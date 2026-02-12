# Journal des Prompts — Workflow Commande E-commerce

> **Stack** : TypeScript + Vitest (domaine pur, sans framework web)
> **Agent IA** : Claude Code
> **Méthodologie** : Wardley Map — Chaîne Rouge puis Chaîne Bleue

---

# 🔴 Chaîne Rouge — Penser avant de produire

---

## Phase : Décision

_Objectif : clarifier le besoin, définir les invariants critiques, poser le périmètre._

### P1 - Identification des invariants critiques

**Prompt :**
```Contexte :
Je développe le workflow de commande d'une boutique e-commerce en TypeScript pur.
Le système doit gérer : création de commande depuis un panier, application de
promotions, réservation de stock temporaire, transitions d'état de la commande
(created → paid → prepared → shipped), libération du stock si échec/expiration
du paiement, et relance de paniers abandonnés après 24h.
Je suis en phase Décision (chaîne rouge). Pas de solution technique, pas de code.

Demande :
1. Identifie tous les invariants critiques de ce système — c'est-à-dire les
   règles métier qui ne doivent JAMAIS être violées, quoi qu'il arrive.
   Pour chaque invariant, donne :
    - La règle formulée clairement
    - Un exemple concret de violation (ce qui se passe si on ne respecte pas)
    - La gravité (bloquant / dégradé / cosmétique)

2. Y a-t-il des invariants implicites que l'énoncé ne mentionne pas mais
   qui sont évidents dans un vrai système e-commerce ? 
```

**Résumé de la réponse :** Identification de 5 invariants explicites (pas de survente, transitions ordonnées, incompatibilité promos, cohérence stock/paiement/expiration, paiement tardif vs expiration) et 5 invariants implicites (panier non vide, montant ≥ 0, idempotence, quantités positives, relance uniquement sur abandonnés). Tous classés en gravité bloquant sauf la relance (dégradé).

**Décision :** Les 10 invariants couvrent les 4 complexités de l'énoncé (survente, transitions, promos incompatibles, paiement/expiration) et ajoutent des gardes défensives essentielles (idempotence, montant positif). La distinction bloquant/dégradé pour I10 est pertinente car une relance erronée n'impacte pas l'intégrité des données.

---

### P2 - Périmètre et critères de réussite

**Prompt :**
```
Contexte :
Suite au P1, on a identifié 10 invariants critiques (I1 à I10) pour notre
workflow de commande e-commerce. Voir docs/INVARIANTS.md.

Maintenant je dois cadrer le périmètre exact du projet et définir des
critères de réussite mesurables.

Demande :

1. PÉRIMÈTRE — Pour chacune de ces fonctionnalités, dis-moi si elle est
   IN (incluse) ou OUT (hors périmètre) pour cet exercice, avec une
   justification courte :
   - Création de commande depuis un panier
   - Promotions (codes promo + remises automatiques)
   - Réservation temporaire de stock
   - Machine à états de la commande
   - Libération de stock si échec/expiration paiement
   - Relance panier abandonné après 24h
   - Authentification utilisateur
   - Gestion du catalogue produit
   - Interface de paiement (Stripe, PayPal…)
   - Notifications email
   - Historique des commandes
   - Gestion des retours / remboursements
   - Tableau de bord admin

2. CRITÈRES DE RÉUSSITE — Propose 5 critères concrets et mesurables
   qui permettent de dire "le projet est terminé et fonctionne".
   Chaque critère doit être vérifiable par un test ou une commande.
   Exemple de format :
   "Tous les tests passent avec vitest run" → vérifiable oui/non
```

**Résumé de la réponse :** Classement de 13 fonctionnalités en IN (6) et OUT (7). IN = création commande, promotions, réservation stock, machine à états, libération stock, relance paniers. OUT = auth, catalogue, paiement réel, emails, historique, retours, admin. Proposition de 5 critères de réussite mesurables couvrant les invariants critiques (concurrence stock, promos incompatibles, transitions, paiement tardif).

**Décision :** Le périmètre IN correspond exactement à l'énoncé du projet. Les OUT sont justifiés par le cadre "domaine pur sans framework". Les critères de réussite C1-C5 sont vérifiables par des tests automatisés et couvrent les 4 complexités identifiées en P1.

---

## Phase : Hypothèse

_Objectif : formuler des hypothèses testables, ne pas demander de solutions._

### P3 - Hypothèses sur la réservation de stock et les promotions

**Prompt :**
```
Contexte :
Phase Hypothèse (chaîne rouge). Pas de code, pas de solution.
Invariants validés dans docs/INVARIANTS.md (I1 à I10).
Je formule des hypothèses testables, à toi de les valider ou invalider.

Hypothèses :

H1 — RÉSERVATION DE STOCK :
"La réservation de stock peut être modélisée par un simple compteur
(stock disponible - quantité réservée) sans mécanisme de lock, car
dans notre domaine pur en mémoire il n'y a pas de concurrence réelle
entre threads."
→ Valide ou invalide. Si invalide, quel mécanisme minimal est nécessaire
  pour garantir I1 (pas de survente) ?

H2 — PROMOTIONS INCOMPATIBLES :
"On peut gérer l'incompatibilité des promotions avec une matrice
de compatibilité statique (promo A est incompatible avec promo B)
plutôt qu'avec des règles dynamiques complexes. Ça suffit pour
respecter I3."
→ Valide ou invalide. Quel cas cette approche ne couvrirait pas ?

H3 — PROMOTIONS ET TOTAL :
"Le moteur de promotions ne doit PAS modifier le panier. Il doit
retourner une liste de réductions, et c'est le calculateur de total
(composant séparé) qui applique ces réductions. Ça garantit que le
total a une source unique de vérité (I7)."
→ Valide ou invalide. Y a-t-il un risque à séparer ces deux
  responsabilités ?
```

**Résumé de la réponse :** H1 partiellement validée : le compteur simple suffit en single-thread mais il faut garantir que vérification + décrémentation soient dans un seul appel synchrone (pas d'await entre les deux). H2 validée : matrice statique suffisante pour notre périmètre sans règles conditionnelles. H3 validée : séparer promos et calcul de total est bon, à condition de passer un snapshot immutable du panier aux deux.

**Décision :** H1 est la plus importante : le "partiellement" affine notre compréhension — on sait maintenant que le module stock devra exposer une méthode atomique reserve-or-fail. H2 et H3 confirment des intuitions solides et donnent des contraintes concrètes pour l'architecture (snapshot immutable, matrice statique).

---

### P4 - Hypothèses sur les transitions d'état et l'expiration des réservations

**Prompt :**
```
Contexte :
Phase Hypothèse (chaîne rouge). Pas de code.
Invariants : docs/INVARIANTS.md. Hypothèses H1-H3 validées au P3.
Il me reste 2 sujets obligatoires que l'on doit couvrir pour réaliser cette phase d'hypothèse.

Hypothèses :

H4 — TRANSITIONS D'ÉTAT :
"Les transitions de la commande peuvent être modélisées par une
table déclarative qui mappe chaque état vers ses états suivants
autorisés. Toute transition absente de la table est interdite
par défaut. Ça suffit pour garantir I2 car on ne peut pas oublier
de bloquer une transition invalide — si elle n'est pas déclarée,
elle n'existe pas."
→ Valide ou invalide ? Est-ce que la table doit aussi porter les
  effets de bord de chaque transition (ex: libérer le stock quand
  on passe à cancelled) ?

H5 — EXPIRATION DES RÉSERVATIONS :
"Chaque réservation doit porter un expiresAt (timestamp).
Un handler externe vérifie les réservations expirées et libère
le stock. Ce n'est pas la réservation elle-même qui se désactive.
Ça garantit I4 car le handler s'assure que le stock ne reste
jamais bloqué indéfiniment, même si le processus de paiement
plante."
→ Valide ou invalide ? Quel risque si le handler externe tombe
  en panne ou prend du retard ?
```

**Résumé de la réponse :** H4 partiellement validée : la table déclarative est idéale pour valider les transitions (I2), mais les effets de bord (libérer stock, etc.) doivent être découplés via des événements/handlers séparés pour respecter le SRP. H5 validée : expiresAt + handler externe est le bon pattern, renforcé par une double vérification au moment du paiement pour couvrir I4 et I5.

**Décision :** Le "partiellement" sur H4 est précieux : il révèle une séparation de responsabilités qu'on aurait pu rater (validation vs effets de bord). La double vérification pour H5 est une défense en profondeur cohérente avec nos invariants.

---

## Phase : Exploration

_Objectif : élargir l'espace des solutions avant de converger._

### P5 - Comparaison d'approches : machine à états et réservation de stock

**Prompt :**
```
Contexte :
Phase Exploration (chaîne rouge). Pas de code.
Réf : docs/INVARIANTS.md (I1, I2), docs/HYPOTHESES.md (H1, H4).

Problématique 1 — Machine à états de la commande :
Compare ces 3 approches pour implémenter le gardien de transitions :
- A : Switch/case — un bloc conditionnel qui vérifie chaque
  combinaison état actuel / état cible
- B : Table déclarative — un objet qui mappe chaque état vers
  ses états suivants autorisés (validé en H4)
- C : State pattern (classes) — une classe par état, chaque classe
  expose uniquement les méthodes de transition autorisées

Pour chacune : avantages, inconvénients, cohérence avec I2,
facilité d'ajout d'un nouvel état.

Problématique 2 — Réservation atomique de stock :
Compare ces 3 approches :
- A : Compteur simple — on décrémente le stock disponible
  directement (validé partiellement en H1)
- B : Système de tokens — chaque réservation crée un token
  unique avec un expiresAt, le stock = total - tokens actifs
- C : File d'attente — les demandes de réservation sont
  sérialisées dans une queue, traitées une par une

Pour chacune : avantages, inconvénients, cohérence avec I1,
complexité d'implémentation dans notre contexte domaine pur.

Pour chaque problématique, recommande une approche en justifiant
par rapport à nos invariants et au principe KISS.
```

**Résumé de la réponse :** Problématique 1 (machine à états) : la table déclarative (B) l'emporte sur switch/case (fragile, oublis) et State pattern (over-engineering pour 4 états). Problématique 2 (réservation stock) : les tokens de réservation (B) l'emportent sur le compteur simple (pas de traçabilité ni expiresAt) et la file d'attente (over-engineering en single-thread).

**Décision :** La table déclarative est le bon choix pour la machine à états — cohérent avec H4 et KISS pour 4 états. Les tokens de réservation offrent le bon compromis entre simplicité et respect de I1/I4/I5. Les deux choix rejetés (switch/case et file d'attente) sont clairement hors proportion pour notre périmètre.

---

### P6 - Comparaison d'approches : moteur de promotions et orchestration

**Prompt :**
```
Contexte :
Phase Exploration (chaîne rouge). Pas de code.
Réf : docs/INVARIANTS.md (I3, I7), docs/HYPOTHESES.md (H2, H3).

Problématique 1 — Moteur de promotions :
Compare ces 3 approches :
- A : Chain of responsibility — chaque promo est un maillon
  d'une chaîne, vérifie si elle s'applique, fait sa réduction,
  puis passe au suivant
- B : Rules engine déclaratif — les promos sont décrites comme
  des données/config, un moteur les lit et les applique
- C : Strategy pattern — chaque type de promo est une
  fonction/classe séparée avec la même interface appliquer()

Pour chacune : avantages, inconvénients, cohérence avec I3
(incompatibilités) et H2 (matrice statique), facilité d'ajout
d'une nouvelle promo.

Problématique 2 — Orchestration du workflow :
Compare ces 3 approches :
- A : Service central — un orchestrateur appelle les composants
  dans l'ordre (créer → réserver → promos → total → paiement)
- B : Événements — chaque composant émet un événement quand
  il a fini, les autres écoutent et réagissent
- C : Pipeline de fonctions — les composants sont chaînés,
  chacun prend le résultat du précédent

Pour chacune : avantages, inconvénients, testabilité,
cohérence avec le principe "l'orchestrateur ne contient
aucune logique métier".

Recommande une approche par problématique en justifiant
avec nos invariants et KISS.
```

**Résumé de la réponse :** Promos : le Strategy pattern (C) l'emporte — chaque promo est une fonction pure avec la même interface, les incompatibilités (I3) sont gérées par un composant séparé utilisant la matrice statique (H2). Orchestration : hybride A+C recommandé — un orchestrateur central séquence des fonctions pures, sans logique métier. Les événements (B) rendent le flux invisible et sont over-engineering pour notre périmètre.

**Décision :** Le Strategy pattern pour les promos est cohérent avec KISS et SRP — chaque type de promo isolé, extensible sans modifier l'existant. L'hybride orchestrateur + fonctions pures offre le meilleur compromis entre lisibilité du flux (A) et testabilité (C). Le rejet des événements est pertinent : dans un domaine pur sans infra, un flux explicite vaut mieux qu'un flux implicite.

---

## Phase : Conversation

_Objectif : révéler les cas limites et failles du modèle._

### P7 - Identification des failles et cas limites du modèle

**Prompt :**
```
Contexte :
Phase Conversation (chaîne rouge). Pas de code.
Voici le modèle actuel issu des phases précédentes :
- Machine à états : table déclarative (état → états suivants autorisés)
- Stock : tokens de réservation avec expiresAt
- Promotions : strategy pattern + matrice de compatibilité statique
- Orchestration : service central avec fonctions pures
- Invariants : docs/INVARIANTS.md (I1-I10)
- Choix d'archi : docs/EXPLORATION.md

Demande :
Joue le rôle d'un développeur senior sceptique.

1. Quels scénarios concrets feraient planter ce modèle ?
   Donne au moins 5 scénarios avec pour chacun :
   - Ce qui se passe
   - Quel invariant est menacé
   - Quelle partie du modèle ne couvre pas ce cas

2. Quels cas limites ai-je oubliés dans mes invariants I1-I10 ?
```

**Résumé de la réponse :** 5 scénarios identifiés : double-click paiement (I8), paiement après expiration réservation (I5), annulation après paiement (I2 — pas d'état cancelled), panier abandonné avec stock épuisé (I1/I10), promo expirée entre ajout et commande (I3/I7). Deux nouveaux invariants proposés : I11 (unicité commande/panier) et I12 (validité temporelle des promos). Ajout de l'état `cancelled` dans la machine à états.

**Décision :** L'ajout de l'état `cancelled` comble une faille critique dans la machine à états — sans lui, aucune annulation n'était possible. I11 et I12 renforcent la cohérence du modèle en protégeant contre les doublons et les promos périmées. Les 5 scénarios couvrent les cas limites imposés par le contexte (04_conversation.md). Mis à jour dans docs/INVARIANTS.md et docs/HYPOTHESES.md.

---

### P8 - Validation des corrections et recherche de failles résiduelles

**Prompt :**
```
Contexte :
Phase Conversation (chaîne rouge). Suite au P7, j'ai corrigé le modèle :

Corrections appliquées :
- Machine à états : ajout de l'état cancelled, transitions mises à jour
  (created → [paid, cancelled], paid → [prepared, cancelled])
- Invariants : ajout I11 (unicité commande/panier) et I12 (validité
  temporelle des promotions avec validFrom/validUntil)

Scénarios identifiés au P7 :
1. Double-click paiement
2. Paiement après expiration de réservation
3. Annulation après paiement
4. Panier abandonné avec stock épuisé
5. Promo expirée entre ajout au panier et commande

Demande :
Joue le rôle d'un dev senior sceptique.
1. Est-ce que les corrections couvrent les 5 scénarios ? Pour chaque
   scénario, dis-moi si c'est résolu ou s'il reste un trou.
2. Essaie de trouver un 6ème scénario que le modèle corrigé ne couvre
   toujours pas.
```

**Résumé de la réponse :** 4/5 scénarios du P7 sont résolus par les corrections (cancelled, I11, I12). Le double-click paiement est couvert par I11 + table déclarative (transition paid→paid invalide). Le panier abandonné/stock épuisé est acceptable (l'erreur arrive proprement à la réservation). Scénario 6 identifié (modification panier pendant checkout) mais couvert par le snapshot immutable (H3) — point d'attention implémentation, pas de faille structurelle.

**Décision :** Le modèle est solide après corrections — les 5 scénarios sont couverts sans nouvel invariant. Le scénario 6 (modification panier pendant checkout) n'est pas une faille structurelle mais un point d'attention implémentation : la commande devra stocker une copie gelée (deep copy) des items du panier. Sauvegardé dans docs/EDGE_CASES.md.

---

## Phase : Moldable

_Objectif : tester la logique sur des artefacts jetables, sans coder._

### P9 - Diagramme de la machine à états et scénarios

**Prompt :**
```
Contexte :
Phase Moldable (chaîne rouge). Pas de code, uniquement du texte et
des diagrammes.
Réf : docs/INVARIANTS.md (I1-I12), docs/EDGE_CASES.md

Demande :

1. Valide et complète ce diagramme de la machine à états :

[created] --paiement_ok--> [paid]
[created] --annulation--> [cancelled]
[created] --expiration--> [cancelled]
[paid] --preparation--> [prepared]
[paid] --annulation--> [cancelled]
[prepared] --expedition--> [shipped]
[shipped] → état final
[cancelled] → état final

Pour chaque transition qui manquerait, ajoute-la.
Liste aussi explicitement les transitions INTERDITES
(ex: shipped → created).

2. Pour chaque transition valide, liste les effets de bord :
   - Que se passe-t-il côté stock ?
   - Côté paiement ?
   - Côté promotions ?
   - Y a-t-il un événement à émettre ?

3. Déroule ces 2 scénarios pas à pas (état par état,
   avec les effets de bord à chaque étape) :

   Scénario A (nominal) :
   Le client a un panier → crée une commande → paie →
   commande préparée → commande expédiée

   Scénario B (échec paiement) :
   Le client a un panier → crée une commande → le stock
   est réservé → le paiement timeout → la réservation
   expire → le stock est libéré
```

**Résumé de la réponse :** Diagramme complet avec 6 transitions valides et 9 interdites explicites. Effets de bord documentés par transition (stock, paiement, promos, événements). Deux scénarios déroulés : nominal (created→paid→prepared→shipped) et échec (created→cancelled par expiration avec double protection I5 si webhook tardif).

**Décision :** Le diagramme avec 6 transitions valides et 9 interdites couvre exhaustivement I2. Les effets de bord confirment la séparation StateMachine / TransitionHandlers validée en H4. Les deux scénarios déroulés (nominal + échec) valident la logique de bout en bout sans incohérence. Sauvegardé dans docs/STATE_MACHINE.md.

---

### P10 - Dry run des transitions invalides et tentatives de corruption

**Prompt :**
```
Contexte :
Phase Moldable (chaîne rouge). Pas de code.
Réf : docs/STATE_MACHINE.md (transitions interdites)

Demande :
Dry run sur des transitions invalides. Pour chaque scénario,
déroule étape par étape ce qui se passe dans le système :

1. Une commande en shipped → quelqu'un tente de la repasser
   en created (retour en arrière)

2. Une commande en prepared → on tente de l'annuler
   (cancelled) alors que la préparation est lancée

3. Un produit hors stock → on tente de forcer une réservation
   quand même (stock = 0)

4. Une commande en cancelled → on tente de la payer
   (relancer une commande morte)

Pour chaque cas :
- Quel composant bloque l'opération ?
- Quelle erreur est retournée ?
- Quel invariant est protégé ?
- Le système reste-t-il dans un état cohérent après le rejet ?
```

**Résumé de la réponse :** 4 dry runs sur transitions invalides : shipped→created, prepared→cancelled, réservation stock=0, cancelled→paid. Dans chaque cas le système rejette sans effet de bord. Deux composants bloquants identifiés : StateMachine (table déclarative) pour les transitions invalides, StockManager (reserve atomique) pour la survente. État cohérent après chaque rejet.

**Décision :** Les dry runs confirment que le modèle est défensif par design — chaque tentative invalide est rejetée sans effet de bord ni état intermédiaire incohérent. La table déclarative et la réservation atomique sont les deux remparts qui protègent les invariants critiques. Le modèle est prêt pour la phase architecture.

---

## Phase : Modèle

_Objectif : stabiliser l'architecture avant de passer au code._

### P11 - Structure de fichiers et responsabilités par composant

**Prompt :**
```
Contexte :
Phase Modèle (dernière phase chaîne rouge). Pas de code.
Réf : docs/INVARIANTS.md, docs/HYPOTHESES.md, docs/EXPLORATION.md,
docs/EDGE_CASES.md, docs/STATE_MACHINE.md

On a identifié ces composants : state machine, réservation de stock
(tokens), moteur de promotions (strategy + matrice de compatibilité),
calculateur de total, orchestrateur central, handlers (paiement,
expiration, panier abandonné).

Demande :
1. Produis la structure de fichiers complète (src/ et tests/)
2. Pour chaque fichier dans src/, donne :
   - Sa responsabilité unique
   - Ses inputs/outputs
   - Ses dépendances (quels autres composants il utilise)
3. Mappe chaque invariant (I1-I12) au composant qui le garantit
4. Aucun fichier ne doit dépasser 200 lignes
```

**Résumé de la réponse :** Structure de 10 fichiers src/ avec 9 fichiers tests/ correspondants. Chaque composant a une responsabilité unique documentée (inputs/outputs/dépendances). Les 12 invariants (I1-I12) sont mappés chacun à un composant responsable. Diagramme d'interfaces montrant le flux orchestrateur → composants.

**Décision :** La séparation compatibility-checker / promotion-engine est pertinente — chacun a une responsabilité unique (SRP). L'orchestrateur sans logique métier est cohérent avec le choix hybride A+C (P6). Chaque invariant a un responsable unique identifié, ce qui facilitera le TDD composant par composant. Sauvegardé dans docs/ARCHITECTURE.md.

---

### P12 - Challenge structure dossiers et validation panier

**Prompt :**
```
Contexte :
Phase Modèle. Dernier prompt chaîne rouge. Pas de code.
Réf : structure P11

Deux points à challenger avant de figer l'architecture :

1. ORGANISATION EN DOSSIERS :
Le P11 propose 10 fichiers à plat dans src/. Pour la lisibilité,
la scalabilité et l'onboarding de nouveaux devs, je propose de
regrouper par responsabilité :

src/
  core/           → state machine, types
  stock/          → stock-manager, expiration-checker
  promotions/     → promotion-engine, compatibility-checker
  pricing/        → total-calculator
  orchestration/  → order-orchestrator, payment-handler
  cart/           → abandoned-cart

Est-ce justifié pour 10 fichiers ou c'est du YAGNI ?
Quel seuil de fichiers justifierait ce découpage ?

2. VALIDATION DU PANIER :
I6 (panier non vide) et I9 (quantités positives) sont dans
l'orchestrateur. Mais l'orchestrateur ne doit contenir aucune
logique métier. Faut-il un cart-validator.ts dédié ?

Après ces deux points, fige l'architecture finale dans
docs/ARCHITECTURE.md.
```

**Résumé de la réponse :** Organisation en dossiers rejetée (YAGNI pour 10 fichiers, seuil ~15-20). Validation du panier : oui pour un cart-validator.ts dédié — la validation est de la logique métier qui violerait le contrat de l'orchestrateur. Architecture finale : 11 fichiers à plat dans src/ + 10 tests/.

**Décision :** Rejeté le découpage en dossiers (YAGNI, fichiers déjà bien nommés). Gardé le cart-validator.ts — bon réflexe de challenger le SRP de l'orchestrateur. I6 et I9 migrent de order-orchestrator vers cart-validator. docs/ARCHITECTURE.md mis à jour.

---

# 🔵 Chaîne Bleue — Produire avec maîtrise

---

## Phase : Génération

_Objectif : générer le code composant par composant, jamais en bloc._

### P13 - Génération types et machine à états (TDD)

**Prompt :**
```
Contexte :
Phase Génération (chaîne bleue). ON CODE.
Réf : docs/ARCHITECTURE.md, docs/STATE_MACHINE.md, docs/TDD.md

Premier composant à générer : types.ts + order-state-machine.ts
Invariants garantis : I2 (transitions ordonnées)
Approche validée : table déclarative (H4, P5)

Demande :
En suivant le cycle TDD de docs/TDD.md :

RED — Écris d'abord tests/order-state-machine.test.ts :
- Test : transition created → paid réussit
- Test : transition created → cancelled réussit
- Test : transition paid → prepared réussit
- Test : transition paid → cancelled réussit
- Test : transition prepared → shipped réussit
- Test : transition created → shipped échoue (I2)
- Test : transition shipped → created échoue (I2)
- Test : transition cancelled → paid échoue (état final)
- Test : toutes les transitions invalides sont rejetées

GREEN — Puis génère :
1. src/types.ts — tous les types partagés définis dans
   docs/ARCHITECTURE.md (OrderState, CartItem, Order,
   Reservation, Promotion, Discount, Result<T,E>)
2. src/order-state-machine.ts — table déclarative,
   aucun effet de bord, la machine valide uniquement

REFACTOR — Simplifie si nécessaire, les tests doivent
toujours passer.

Contraintes :
- Aucun fichier > 200 lignes
- La machine à états est pure (pas d'effets de bord)
- Les transitions de docs/STATE_MACHINE.md font référence
- Lancer vitest run après pour confirmer que tout passe
```

**Résumé de la réponse :** TDD complet. RED : 26 tests écrits couvrant les 6 transitions valides, 8 invalides, états finaux (shipped/cancelled sans sortie), et transitions vers soi-même. GREEN : types.ts (tous les types/interfaces/erreurs de l'architecture) + order-state-machine.ts (table déclarative TRANSITIONS + fonction transition()). 26/26 tests passent. REFACTOR : rien à simplifier, code déjà minimal.

**Décision :** La table déclarative est exactement conforme à docs/STATE_MACHINE.md — les 6 transitions valides et 9 interdites sont couvertes par 26 tests. Le type Result<T,E> avec ok()/err() permet un pattern matching propre sans exceptions. Les erreurs typées (InvalidTransitionError, etc.) couvrent tous les cas de docs/ARCHITECTURE.md.

---

### P14 - Génération stock-manager.ts (TDD)

**Prompt :**
```
Contexte :
Phase Génération (chaîne bleue).
Réf : docs/ARCHITECTURE.md, docs/TDD.md, docs/HYPOTHESES.md (H1, H5)

Composant : stock-manager.ts
Invariants garantis : I1 (pas de survente), I4 (libération stock)
Approche validée : tokens de réservation avec expiresAt (P5)

Demande :
En suivant le cycle TDD de docs/TDD.md :

RED — Écris d'abord tests/stock-manager.test.ts :
- Test : réserver du stock quand il est disponible → OK, retourne un token
- Test : réserver plus que le stock disponible → erreur (I1)
- Test : réserver le dernier article → OK, stock dispo = 0
- Test : réserver quand stock = 0 → erreur (I1)
- Test : libérer une réservation → stock redevient disponible (I4)
- Test : le stock disponible = stock total - tokens actifs
- Test : réservation porte un expiresAt (H5)
- Test : deux réservations simultanées sur le dernier article →
  une réussit, l'autre échoue (I1, atomicité)
- Test : la réservation est synchrone, pas de await entre
  vérification et décrémentation (H1)

GREEN — Génère src/stock-manager.ts :
- Méthode reserve(productId, qty, expiresAt) → Result<Reservation, StockError>
- Méthode release(reservationId) → void
- Méthode getAvailableStock(productId) → number
- Opération synchrone (H1)
- Injection des données de stock (pas de state global)

REFACTOR — Simplifie si nécessaire.

Contraintes :
- Aucun fichier > 200 lignes
- Lancer vitest run après pour confirmer
```

**Résumé de la réponse :** TDD complet. RED : 12 tests couvrant réservation nominale, erreurs I1 (survente, stock=0, produit inexistant), libération I4, calcul stock disponible, atomicité synchrone. GREEN : StockManager avec tokens en Map, reserve() synchrone (H1), release(), getAvailableStock() = total - sum(tokens). 12/12 passent, 38/38 au total.

**Décision :** Le stock disponible est calculé dynamiquement (total - sum(tokens actifs)) plutôt que par un compteur décrémenté — plus robuste et cohérent avec le choix des tokens (P5). reserve() est synchrone sans await (H1), et release() est idempotent, ce qui simplifie la gestion d'erreurs.

---

### P15 - Génération promotion-engine.ts et compatibility-checker.ts (TDD)

**Prompt :**
```
Contexte :
Phase Génération (chaîne bleue).
Réf : docs/ARCHITECTURE.md, docs/TDD.md, docs/HYPOTHESES.md (H2, H3)

Composants : promotion-engine.ts + compatibility-checker.ts
Invariants garantis : I3 (incompatibilités), I12 (validité temporelle)
Approche validée : strategy pattern + matrice statique (P6)

Demande :
En suivant le cycle TDD de docs/TDD.md :

RED — Écris d'abord les tests :

tests/compatibility-checker.test.ts :
- Test : deux promos compatibles → OK
- Test : deux promos incompatibles → erreur (I3)
- Test : une seule promo → toujours OK
- Test : trois promos dont deux incompatibles → erreur (I3)

tests/promotion-engine.test.ts :
- Test : appliquer une promo pourcentage (-20%) → réduction correcte
- Test : appliquer une promo montant fixe (-10€) → réduction correcte
- Test : promo expirée (validUntil dépassé) → rejetée (I12)
- Test : promo pas encore active (validFrom pas atteint) → rejetée (I12)
- Test : appliquer sur panier immutable → le panier n'est pas modifié (H3)
- Test : promo qui rendrait le total négatif → réduction plafonnée (I7)

GREEN — Génère :
1. src/compatibility-checker.ts — matrice statique, vérifie
   les incompatibilités avant application
2. src/promotion-engine.ts — strategy pattern, chaque type de
   promo est une fonction (cart) → Discount. Vérifie validFrom/validUntil.
   Ne modifie pas le panier, retourne des Discount[].

REFACTOR — Simplifie si nécessaire.

Contraintes :
- Aucun fichier > 200 lignes
- Le moteur de promos NE modifie PAS le panier (H3)
- Lancer vitest run après pour confirmer
```

**Résumé de la réponse :** TDD complet. RED : 6 tests compatibility-checker (compatibles, incompatibles dans les deux sens, promo unique, liste vide, 3 promos dont 2 incompatibles) + 7 tests promotion-engine (pourcentage, fixe, multiples, expirée, future, immutabilité panier, liste vide). GREEN : compatibility-checker avec double boucle sur la matrice statique + promotion-engine en strategy pattern avec switch sur le type. 13/13 passent, 51/51 au total.

**Décision :** Le compatibility-checker vérifie les incompatibilités dans les deux sens (A→B et B→A), couvrant I3 sans ambiguïté. Le promotion-engine ne touche pas au panier (H3) et filtre les promos invalides temporellement (I12). Le plafonnement I7 est volontairement délégué au total-calculator — séparation SRP entre "quelles réductions" et "quel montant".

---

### P16 - Génération total-calculator.ts et cart-validator.ts (TDD)

**Prompt :**
```
Contexte :
Phase Génération (chaîne bleue).
Réf : docs/ARCHITECTURE.md, docs/TDD.md

Composants : total-calculator.ts + cart-validator.ts
Invariants garantis : I6 (panier non vide), I7 (montant ≥ 0), I9 (quantités ≥ 1)

Demande :
En suivant le cycle TDD de docs/TDD.md :

RED — Écris d'abord les tests :

tests/cart-validator.test.ts :
- Test : panier avec articles valides → OK
- Test : panier vide → erreur (I6)
- Test : article avec quantité 0 → erreur (I9)
- Test : article avec quantité négative → erreur (I9)
- Test : article avec prix ≤ 0 → erreur

tests/total-calculator.test.ts :
- Test : panier sans réduction → total = somme des lignes
- Test : panier avec une réduction pourcentage → total correct
- Test : panier avec une réduction montant fixe → total correct
- Test : réductions qui dépassent le sous-total → total = 0, pas négatif (I7)
- Test : panier avec plusieurs articles et plusieurs réductions → calcul correct
- Test : le calculateur est une fonction pure (même input = même output)

GREEN — Génère :
1. src/cart-validator.ts — valide I6 et I9, retourne
   Result<void, CartValidationError>
2. src/total-calculator.ts — source unique de vérité pour
   le montant. Input : panier + Discount[]. Output : number ≥ 0.
   Clamp à 0 si les réductions dépassent le sous-total (I7).

REFACTOR — Simplifie si nécessaire.

Contraintes :
- Aucun fichier > 200 lignes
- Le calculateur est pur (pas d'effets de bord)
- Lancer vitest run après pour confirmer
```

**Résumé de la réponse :** TDD complet. RED : 6 tests cart-validator (valide, vide I6, quantité 0/négative I9, prix ≤ 0) + 6 tests total-calculator (sans réduction, pourcentage, fixe, dépassement I7 clamp à 0, multi-articles/réductions, pureté). GREEN : cart-validator valide I6/I9 avec Result, total-calculator = subtotal - discounts avec Math.max(0). 12/12 passent, 63/63 au total.

**Décision :** Le cart-validator extrait la logique de validation hors de l'orchestrateur, validant le challenge du P12. Le total-calculator est une fonction pure de 14 lignes avec clamp à 0 (I7) — c'est le composant le plus simple du système, signe que la responsabilité est bien découpée. Les deux sont testables isolément.

---

## Phase : Specific Coding

_Objectif : relire le code généré, identifier et corriger les problèmes._

### P17 - Analyse des décisions implicites et invariants manquants

**Prompt :**
```
Contexte :
Phase Specific Coding (chaîne bleue).
6 fichiers générés : types.ts, order-state-machine.ts,
stock-manager.ts, promotion-engine.ts, compatibility-checker.ts,
total-calculator.ts, cart-validator.ts
Réf : docs/INVARIANTS.md, docs/EDGE_CASES.md

Demande :
Relis tout le code dans src/ et sois honnête :
1. Quelles décisions as-tu prises implicitement sans me demander ?
   Pour chacune, quelle alternative existait ?
2. Quels invariants de docs/INVARIANTS.md ne sont pas encore
   garantis dans le code actuel ?
3. Quels cas limites de docs/EDGE_CASES.md ne sont pas couverts
   par les tests ?
4. Y a-t-il du code mort ou inutile ?
```

**Résumé de la réponse :** 4 décisions implicites identifiées : D1 (ID generator global mutable), D2 (orderId vide), D3 (promos % cumulées sur brut), D4 (computeSubtotal dupliqué). 5 invariants pas encore couverts (I4, I5, I8 partiel, I10, I11 — composants non générés). 3 cas limites non testés (S1, S2, S4). 2 éléments de code mort (ExpiredPromotionError, Cart interface).

**Décision :** 3 corrections appliquées : D1 corrigé (nextId dans la classe), D2 corrigé (orderId en paramètre de reserve()), D4 corrigé (subtotal passé en paramètre de applyPromotions, plus de duplication). D3 gardé tel quel pour l'instant — à challenger au P18. le cumul sur brut est un choix métier acceptable pour notre périmètre. 63/63 tests toujours verts après corrections.

---

### P18 - Correction D3 : cumul des promotions en cascade

**Prompt :**
```
Je ne suis pas d'accord avec la décision de garder D3 tel quel.

Deux promos de -20% sur un panier de 100€ :
- Cumul sur brut : 100 - 20 - 20 = 60€ (40% de réduction)
- Cascade : 100 - 20 = 80, puis 80 - 16 = 64€ (36% de réduction)

Le cumul sur brut permet de dépasser les intentions de chaque promo
individuellement. C'est incohérent avec I3 (incompatibilités) et I7
(montant ≥ 0 — on s'en approche plus vite avec le cumul brut).

Corrige D3 : les promos % doivent s'appliquer en cascade.
Mets à jour les tests. Vitest run après.
```

**Résumé de la réponse :** D3 corrigé : les promos % s'appliquent désormais en cascade (sur le remaining, pas le brut). Variable `remaining` décrementée après chaque promo. 2 tests ajoutés : deux promos % en cascade (24 puis 19.2, pas 24+24), et fixe+% en cascade (10 puis 22). 65/65 tests passent.

**Décision :** Bonne correction. L'argument est solide : le cumul sur brut permettait de dépasser les intentions individuelles de chaque promo. La cascade est plus proche de la réalité métier e-commerce et limite les abus de cumul.

---

## Phase : Composable Micro Tools

_Objectif : vérifier l'indépendance et la composabilité de chaque brique._

### P19 - Vérification d'indépendance des composants

**Prompt :**
```
Contexte :
Phase Composable (chaîne bleue).
Réf : docs/ARCHITECTURE.md

Demande :
Pour chaque fichier dans src/ :
1. Liste ses imports — dépend-il d'un autre composant
   concret ou uniquement de types.ts ?
2. Son test fonctionne-t-il sans instancier d'autres
   composants ?
3. Peut-on le remplacer par une autre implémentation
   sans toucher aux autres fichiers ?

Si un couplage est trouvé, propose comment le casser.
```

**Résumé de la réponse :** Les 7 composants src/ ne dépendent que de types.ts — aucun import entre composants concrets. Les 6 fichiers de tests sont autonomes (aucun n'instancie un autre composant). Remplaçabilité validée sauf un point : le switch dans promotion-engine viole Open/Closed (ajouter un type de promo = modifier le fichier). Un registre de stratégies injectables résoudrait le problème.

**Décision :** Gardé en l'état. Le switch est YAGNI pour 2 types de promos — le refactorer en registre ajouterait de la complexité inutile. Le point est documenté comme extension future potentielle. L'indépendance des composants est validée : chaque brique est testable, remplaçable et composable isolément.

---

### P20 - Vérification des interfaces pour injection de dépendances

**Prompt :**
```
Contexte :
Phase Composable (chaîne bleue).
Les composants sont indépendants. Mais en Phase 10 on va
les assembler dans l'orchestrateur via injection de dépendances.

Demande :
1. Vérifie que types.ts définit des interfaces (pas juste des
   classes concrètes) pour chaque composant que l'orchestrateur
   va injecter
2. Si les interfaces manquent, ajoute-les dans types.ts
3. Vitest run pour confirmer que rien ne casse
```

**Résumé de la réponse :** Audit des 7 composants : les 6 fonctions pures (transition, validateCart, checkCompatibility, applyPromotions, calculateTotal) sont naturellement injectables. Seul StockManager (classe concrète) manquait d'interface. Ajout de IStockManager dans types.ts avec le contrat reserve/release/getAvailableStock. StockManager implémente désormais IStockManager. 65/65 tests passent.

**Décision :** L'interface IStockManager comble le seul couplage concret du système — l'orchestrateur dépend désormais du contrat, pas de l'implémentation. On pourra remplacer StockManager par une implémentation DB sans toucher l'orchestrateur. Les fonctions pures n'ont pas besoin d'interface — le type de la fonction suffit comme contrat.

---

## Phase : System

_Objectif : assembler les briques en un workflow cohérent._

### P21 - Génération des handlers (paiement, expiration, panier abandonné)

**Prompt :**
```
Contexte :
Phase System (chaîne bleue).
Réf : docs/ARCHITECTURE.md, docs/TDD.md,
docs/EDGE_CASES.md, docs/STATE_MACHINE.md

Demande :
En suivant le cycle TDD de docs/TDD.md, génère les 3 handlers :

1. payment-handler.ts — traite un paiement reçu :
   - Vérifie que la réservation n'a pas expiré (I5)
   - Fait la transition created → paid via la state machine
   - Rejette si paiement après expiration (scénario S2)
   - Garantit l'idempotence : un 2ème appel est rejeté (I8, S1)

2. expiration-checker.ts — nettoie les réservations expirées :
   - Parcourt les réservations dont expiresAt est dépassé
   - Libère le stock via stock-manager (I4)
   - Fait la transition created → cancelled
   - Timestamp injectable pour les tests (pas de Date.now())

3. abandoned-cart.ts — détecte les paniers abandonnés :
   - Identifie les paniers > 24h sans commande
   - Vérifie qu'une commande n'existe pas déjà (I10)
   - Retourne la liste des paniers à relancer

Injection de dépendances : les handlers reçoivent les composants
existants en paramètre, pas en import direct.
Vitest run après.
```

**Résumé de la réponse :** 3 handlers générés en TDD (14 tests couvrant I4, I5, I8, I10, S1, S2). Bug détecté dans expiration-checker : `transition(state, 'cancelled')` laissait passer les commandes `paid`, corrigé par un filtre explicite `state === 'created'`. 79 tests passent.

**Décision :** Gardé l'ensemble avec une correction importante. Le expiration-checker ne peut pas s'appuyer sur la machine à états pour filtrer les commandes éligibles car `paid → cancelled` est une transition légitime (annulation manuelle). Le checker ne cible que `created` explicitement — cohérent avec I4 (libération du stock à l'expiration) qui ne concerne que les commandes en attente de paiement. Le payment-handler utilise bien la machine à états pour valider `created → paid` et rejette via PaymentExpiredError si réservation expirée ou absente. Le abandoned-cart est une pure fonction de filtrage sans effet de bord, conforme au principe KISS.

---

### P22 - Génération de l'orchestrateur et assemblage final

**Prompt :**
```
Contexte :
Phase System (chaîne bleue). Dernier composant.
Réf : docs/ARCHITECTURE.md, docs/TDD.md

Demande :
En suivant le cycle TDD de docs/TDD.md, génère
order-orchestrator.ts — le service qui assemble le workflow :

Séquence de création de commande :
1. Valider le panier (cart-validator)
2. Vérifier compatibilité des promos (compatibility-checker)
3. Appliquer les promos (promotion-engine)
4. Calculer le total (total-calculator)
5. Réserver le stock (stock-manager)
6. Créer la commande avec état "created" (state machine)

Règles strictes :
- L'orchestrateur reçoit TOUS les composants par injection
  de dépendances (en paramètre du constructeur ou de la fonction)
- AUCUN if métier dans l'orchestrateur — il séquence, il ne décide pas
- Si une étape échoue, les étapes précédentes sont annulées
  (ex: si le stock échoue, les promos sont détachées)
- Le panier est un snapshot immutable (deep copy, scénario S6)
- Vérification unicité commande/panier (I11)

Tests à couvrir :
- Workflow nominal complet (scénario A de docs/STATE_MACHINE.md)
- Panier invalide → erreur, rien n'est réservé
- Stock insuffisant → erreur, pas de commande créée
- Promos incompatibles → erreur avant réservation du stock
- L'orchestrateur ne contient aucune logique métier

Vitest run après.
```

**Résumé de la réponse :** Orchestrateur généré en TDD. 9 tests couvrant workflow nominal, erreurs (panier invalide, stock insuffisant, promos incompatibles), I11, S6, et rollback sur échec partiel. `createOrder` séquence 6 étapes via injection de `CreateOrderDeps`, sans logique métier propre. 88 tests passent.

**Décision :** Gardé l'ensemble. Points notables validés : (1) Le subtotal est calculé via `calculateTotal(items, [])` plutôt qu'une fonction exportée supplémentaire — cohérent avec YAGNI et la source unique de vérité. (2) Le rollback des réservations partielles est une boucle de release, pas un if métier — c'est de l'orchestration pure. (3) L'ID de commande est généré par un compteur interne simple (`order-${++nextOrderId}`) — suffisant pour du domaine pur sans persistance. (4) La durée de réservation (30 min) est une constante interne — injectable si besoin futur mais YAGNI pour l'instant.

---

### P23 - Vérification finale : coverage, invariants, cas limites

**Prompt :**
```
Contexte :
Phase System (chaîne bleue). Vérification finale.
Réf : docs/INVARIANTS.md, docs/EDGE_CASES.md, docs/ARCHITECTURE.md

Demande :
Vérification complète avant de rendre le projet :

1. Lance vitest run --coverage et montre le résultat.
   Cible : 80% minimum sur lines, functions, branches, statements.

2. Vérifie que chaque invariant I1-I12 est couvert par au
   moins un test. Liste le mapping invariant → test.

3. Vérifie que chaque scénario de docs/EDGE_CASES.md (S1-S6)
   est couvert par un test.

4. Vérifie qu'aucun fichier ne dépasse 200 lignes.

5. Vérifie que l'orchestrateur ne contient aucun if métier.

6. Résumé final : nombre de fichiers, nombre de tests,
   coverage, invariants couverts, cas limites couverts.
```

**Résumé de la réponse :** Vérification complète : coverage 99.18% stmts / 100% branch / 94.44% funcs / 99.18% lines (cible 80% dépassée). Les 12 invariants I1-I12 sont chacun couverts par au moins un test. Les 6 scénarios S1-S6 sont couverts. Aucun fichier ne dépasse 200 lignes (max 132). L'orchestrateur ne contient aucun `if` métier. Bilan : 11 fichiers source, 10 fichiers de test, 88 tests verts, critères C1-C6 tous validés.

**Décision :** Projet validé. Seul point mineur : `getReservation()` dans stock-manager (lignes 55-56) n'est pas couvert en test unitaire direct — c'est une méthode accesseur utilisée par le système mais jamais appelée directement dans les tests. Acceptable car le coverage global est à 99%+ et la méthode est triviale (un simple `Map.get`). Pas de correction nécessaire.
