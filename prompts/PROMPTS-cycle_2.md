# Journal des Prompts — Cycle 2 : Remboursement partiel à l'annulation

> **Stack** : TypeScript + Vitest (domaine pur, sans framework web)
> **Agent IA** : Claude Code
> **Méthodologie** : Wardley Map — Chaîne Rouge puis Chaîne Bleue
> **Base** : Cycle 1 terminé (11 composants, 88 tests, 12 invariants)

---

# 🔴 Chaîne Rouge — Penser avant de produire

---

## Phase : Décision

_Objectif : clarifier le besoin, définir les nouveaux invariants, identifier l'impact sur le cycle 1._

### P1 - Invariants et périmètre du remboursement partiel

**Prompt :**
```
Contexte :
Cycle 2 — Feature : Remboursement partiel à l'annulation.
Chaîne rouge, phase Décision. Pas de code.
Réf : docs/cycle-1/INVARIANTS.md, docs/cycle-1/ARCHITECTURE.md,
docs/cycle-1/STATE_MACHINE.md

Le système du cycle 1 gère le workflow complet de commande
(created → paid → prepared → shipped / cancelled).
On veut ajouter la possibilité d'annuler partiellement une
commande payée : retirer certains articles, recalculer le
montant, rembourser la différence.

Demande :
1. Identifie les nouveaux invariants spécifiques au
   remboursement partiel. Pour chaque invariant :
   - La règle
   - Un exemple de violation
   - La gravité (bloquant / dégradé)

2. Quel est l'impact sur les composants existants du cycle 1 ?
   Pour chaque fichier touché, dis ce qui change.

3. Périmètre de cette feature :
   IN : ce qu'on implémente
   OUT : ce qu'on exclut (remboursement total, retours après
   livraison, avoir/crédit, etc.)

4. Critères de réussite mesurables pour cette feature.
```

**Résumé de la réponse :** 5 nouveaux invariants (I13-I17) couvrant calcul du remboursement, minimum 1 article, libération partielle du stock, restriction à `paid`, refus si remboursement négatif. Impact cycle 1 : aucun fichier modifié. 2 nouveaux fichiers à créer, 6 critères de réussite (C7-C12).

**Décision :** Gardé l'ensemble. Les 5 invariants sont cohérents avec les 12 du cycle 1. L'invariant I17 (remboursement négatif) est le cas limite le plus subtil — il protège contre la perte d'une promo conditionnelle qui augmenterait le total après retrait. Le choix de ne pas modifier les composants existants valide la conception modulaire du cycle 1 (composants composables, interfaces stables). Le périmètre exclut explicitement la modification de quantité (retrait d'article entier uniquement) — cohérent avec YAGNI.

---

### P2 - Challenge des invariants du remboursement partiel

**Prompt :**

```
Contexte :
Cycle 2, phase Décision. Pas de code.
Réf : docs/cycle-2/INVARIANTS.md (I13-I17)

Je challenge le P1 sur 3 points :

1. I17 (remboursement négatif refusé) — est-ce vraiment la
   bonne réponse ? Alternative : on autorise l'annulation mais
   on facture la différence au client. Quelle approche est la
   plus simple pour notre périmètre domaine pur ?

2. Modification de quantité — le P1 l'exclut du périmètre
   (OUT). Mais retirer 2 exemplaires d'un article sur 5, c'est
   différent de retirer l'article entier. Est-ce que ce cas
   risque d'être demandé naturellement par les tests ? Doit-on
   le traiter maintenant ou c'est du YAGNI ?

3. Historique des annulations — le P1 dit "produire un objet
   Refund traçant l'opération". Mais peut-on faire plusieurs
   annulations partielles successives sur la même commande ?
   Si oui, faut-il un invariant supplémentaire pour gérer
   le cumul ?
```

**Résumé de la réponse :** 3 points challengés. I17 (refus vs. facturation) : la facturation de la différence nécessite un flux de paiement complémentaire hors scope domaine pur → refus maintenu. Modification de quantité : impact sur StockManager (release partiel) + mutation de tokens, trop intrusif pour le cycle 2 → gardé OUT (YAGNI). Annulations successives : oui, autorisées. La cohérence mathématique est naturelle (chaque remboursement sur le total actuel, somme convergente). Ajout de I18 (historique refunds[] traçable, cumul ≤ montant payé).

**Décision :** I17 gardé tel quel (refus simple). Modification de quantité confirmée OUT — extension possible cycle 3 si demandé. Ajout de I18 (annulations successives traçées) — impacte types.ts (ajout `refunds[]` à Order). Total : 6 invariants pour le cycle 2 (I13-I18).

---

## Phase : Hypothèse

_Objectif : formuler des hypothèses testables, ne pas demander de solutions._

### P3 - Hypothèses sur le remboursement partiel

**Prompt :**

```
Contexte :
Cycle 2, phase Hypothèse. Pas de code.
Réf : docs/cycle-2/INVARIANTS.md (I13-I18),
docs/cycle-1/ARCHITECTURE.md

Hypothèses :

H6 — CALCUL DU REMBOURSEMENT :
"Le refund-calculator peut réutiliser promotion-engine et
total-calculator existants en les appelant avec les articles
restants. Pas besoin de logique de calcul spécifique au
remboursement — le remboursement = total actuel - nouveau total."
→ Valide ou invalide ? Quel cas cette approche ne couvrirait pas ?

H7 — ÉTAT DE LA COMMANDE :
"L'annulation partielle ne crée pas de nouvel état dans la
machine à états. La commande reste en paid. L'opération modifie
le contenu (items, total, refunds[]) mais pas l'état."
→ Valide ou invalide ? Faut-il un état 'partially_refunded' ?

H8 — LIBÉRATION DU STOCK :
"On peut réutiliser stock-manager.release() existant pour
libérer le stock des articles retirés, car chaque réservation
est un token individuel par produit."
→ Valide ou invalide ? Quel problème si une réservation
couvre plusieurs unités du même produit ?

H9 — ANNULATIONS SUCCESSIVES :
"Le refund-calculator n'a pas besoin de connaître l'historique
des remboursements précédents. Il prend les items actuels de
la commande, retire ceux demandés, recalcule. La cohérence
est garantie car chaque opération part de l'état courant."
→ Valide ou invalide ?
```


**Résumé de la réponse :** H6 partiellement validée : réutilisation OK mais il faut passer `order.createdAt` au lieu de `now` pour les promos (sinon violation I17). H7 validée (pas de nouvel état). H8 validée (mapping 1:1 item↔réservation, `release()` suffit). H9 validée (calculator sans état, cohérence mathématique naturelle).

**Décision :** H6 acceptée avec la correction `order.createdAt` — c'est le point critique du cycle 2. H7, H8, H9 validées sans modification. Aucun composant du cycle 1 ne nécessite de changement, confirmant la bonne modularité de l'architecture.

---

## Phase : Exploration

_Objectif : élargir l'espace des solutions avant de converger._


### P4 - Exploration des approches pour le refund-calculator

**Prompt :**

```
Contexte :
Cycle 2, phase Exploration. Pas de code.
Réf : docs/cycle-2/INVARIANTS.md (I13-I18),
docs/cycle-2/HYPOTHESES.md (H6-H9)

Le remboursement partiel nécessite 2 nouveaux composants :
refund-calculator et partial-cancellation-handler.

Compare 3 approches pour le refund-calculator :

A : Fonction pure — prend (order, itemsToRemove, promos) et
    retourne { remainingItems, newTotal, refundAmount }. Aucun
    effet de bord. Le handler met à jour la commande après.

B : Méthode sur l'Order — order.removeItems(items) modifie
    l'objet order directement et retourne le refund.

C : Service avec état — RefundService stocke l'historique des
    remboursements et vérifie les cumuls à chaque appel.

Pour chaque approche : avantages, inconvénients, cohérence
avec I13 (calcul correct), I18 (annulations successives),
H9 (calculator sans état), et le pattern du cycle 1
(fonctions pures + orchestrateur séquenceur).
```

**Résumé de la réponse :** 3 approches comparées sur 5 critères (I13, I18, H9, pattern cycle 1, testabilité). Approche A (fonction pure) : seule à respecter tous les critères, cohérente avec H9 (sans état) et le pattern cycle 1 (fonctions pures + orchestrateur). Approche B (méthode Order) : casse le pattern interfaces/POJOs du cycle 1, introduit mutation et couplage fort. Approche C (service avec état) : sur-ingénierie, double source de vérité avec `order.refunds[]`, contredit H9.

**Décision :** Approche A retenue sans hésitation. Elle reproduit le pattern éprouvé du cycle 1 : `refund-calculator` (calcul pur, comme `total-calculator`) + `partial-cancellation-handler` (séquencement, comme `order-orchestrator`). Les approches B et C rejetées car elles contredisent des hypothèses validées (H9) et le pattern architectural établi.

---

## Phase : Conversation

_Objectif : révéler les cas limites et failles du modèle._

### P5 - Recherche de failles dans le modèle de remboursement

**Prompt :**
```
Contexte :
Cycle 2, phase Conversation. Pas de code.
Réf : docs/cycle-2/INVARIANTS.md (I13-I18),
docs/cycle-2/HYPOTHESES.md (H6-H9)

Modèle actuel :
- refund-calculator : fonction pure, prend (order, itemsToRemove,
  promos, deps), retourne { remainingItems, newTotal, refundAmount }
- partial-cancellation-handler : séquence le workflow (vérifie
  état paid, appelle calculator, libère stock, met à jour commande)
- Promos recalculées avec order.createdAt (H6)
- Pas de nouvel état dans la machine (H7)
- Annulations successives via order.refunds[] (I18)

Joue le rôle d'un dev senior sceptique.
1. Quels scénarios concrets feraient planter ce modèle ?
   Donne au moins 3 scénarios avec l'invariant menacé.
2. Le mapping item ↔ réservation est-il fiable pour
   identifier quel token libérer ?
```

**Résumé de la réponse :** 3 scénarios de faille : S7 (mapping item↔réservation ambigu si doublons → pré-condition unicité productId), S8 (annulation totale après partielle → toute annulation passe par le même handler), S9 (double retrait → vérifier existence avant traitement). Le mapping item↔réservation est fiable sous condition d'unicité.

**Décision :** Les 3 scénarios sont réels et actionnables. S7 : on documente l'unicité productId comme pré-condition (pas besoin d'un nouvel invariant — c'est naturel dans le modèle). S8 : on adopte l'option A (toute annulation avec remboursement passe par le handler) — c'est le changement le plus structurant pour la suite. S9 : vérification d'existence triviale à ajouter dans le handler (guard clause).

---

## Phase : Moldable

_Objectif : tester la logique sur des artefacts jetables, sans coder._

### P6 - Dry run des scénarios de remboursement partiel

**Prompt :**

```
Contexte :
Cycle 2, phase Moldable. Pas de code.
Réf : docs/cycle-2/INVARIANTS.md (I13-I18),
docs/cycle-2/HYPOTHESES.md (H6-H9),
scénarios S7-S9

Demande :
Déroule ces 3 scénarios pas à pas (état par état,
avec les effets de bord à chaque étape) :

Scénario A (nominal) :
Commande {A:50€, B:30€, C:20€} avec promo -10% → payé 90€.
Le client retire B. Dérouler tout le workflow.

Scénario B (annulations successives) :
Même commande. Le client retire B puis C.
Montrer le calcul à chaque étape et le cumul des refunds.

Scénario C (cas I17 — remboursement négatif) :
Commande {A:100€, B:10€} avec promo "-50€ si total > 100€"
→ payé 60€. Le client retire B. Que se passe-t-il ?
```

**Résumé de la réponse :** 3 scénarios déroulés pas à pas. Scénario A (nominal) : retrait de B d'une commande {A,B,C} à 90€ → recalcul promos en cascade sur {A,C}, nouveau total 63€, remboursement 27€, stock B libéré. Scénario B (successif) : retrait de C ensuite → total 45€, remboursement 18€. Cumul R1+R2=45€ = 90-45 ✅, confirmant H9. Scénario C (I17) : commande {A:100€, B:10€} avec promo "-50€ si total>100" payée 60€ → retrait de B donne subtotal=100€, promo ne s'applique plus, nouveau total=100€ > 60€ payé, refund=-40€ → REFUSÉ par I17.

**Décision :** Les dry runs confirment la solidité du modèle. Point notable : avec nos types de promos actuels (percentage, fixed_amount), I17 ne peut jamais se déclencher — c'est un garde défensif pour des promos conditionnelles futures. On le garde quand même (coût d'implémentation quasi nul, protection financière importante). Le calcul en cascade des promos (correction D3 du cycle 1) est essentiel — sans cascade, les montants de remboursement seraient incorrects.

---

## Phase : Modèle

_Objectif : stabiliser l'architecture avant de passer au code._

### P7 - Architecture du remboursement partiel

**Prompt :**

```
Contexte :
Cycle 2, phase Modèle. Pas de code.
Réf : docs/cycle-2/INVARIANTS.md (I13-I18),
docs/cycle-2/HYPOTHESES.md (H6-H9),
scénarios S7-S9, dry runs P6

Demande :
Fige l'architecture du cycle 2 :

1. Liste les nouveaux fichiers à créer avec pour chacun :
   - Responsabilité unique
   - Inputs / outputs
   - Invariants garantis

2. Liste les fichiers du cycle 1 modifiés (si aucun, confirme)

3. Mappe chaque invariant I13-I18 au composant responsable

4. Séquence complète du workflow d'annulation partielle
   (étapes numérotées comme le dry run P6)
```

**Résumé de la réponse :** Architecture figée : 2 nouveaux fichiers (refund-calculator.ts pour le calcul pur I13/I17, partial-cancellation-handler.ts pour l'orchestration I14/I15/I16/I18). Seul fichier cycle 1 modifié : types.ts (ajout Refund, erreurs, champ optionnel refunds? sur Order). Tous les 6 invariants mappés à un composant. Séquence complète en 8 étapes avec branche alternative pour annulation totale (I14 : 0 items restants → paid → cancelled via state machine).

**Décision :** Architecture validée. Choix clé : `refunds` optionnel (`?`) sur Order pour ne pas casser les 88 tests cycle 1 — pragmatique et non intrusif. Le refund-calculator est isomorphe au total-calculator (pure fonction), le handler est isomorphe à l'orchestrateur (séquenceur sans logique métier). Pattern cycle 1 parfaitement reproduit.

---

# 🔵 Chaîne Bleue — Produire avec maîtrise

---

## Phase : Génération

_Objectif : générer le code composant par composant, jamais en bloc._

### P8 - Génération types et refund-calculator (TDD)

**Prompt :**

```
Contexte :
Cycle 2, chaîne bleue, phase Génération. ON CODE.
Réf : docs/cycle-2/ARCHITECTURE.md, docs/TDD.md

Composant : types.ts (modification) + refund-calculator.ts
Invariants garantis : I13, I17

Demande :
En suivant le cycle TDD de docs/TDD.md :

RED — tests/refund-calculator.test.ts :
- Test : retrait d'1 article sur 3, remboursement correct (I13)
- Test : retrait avec promo % → recalcul cascade sur restants
- Test : remboursement = ancien total - nouveau total, pas somme brute
- Test : refund négatif → erreur RefundNegativeError (I17)
- Test : utilise order.createdAt pour les promos, pas now (H6)
- Test : fonction pure (même input = même output)

GREEN — Génère :
1. Ajoute dans types.ts : Refund, RefundResult,
   RefundNegativeError, PartialCancellationError,
   Order.refunds? optionnel
2. src/refund-calculator.ts : fonction pure calculateRefund()

REFACTOR si nécessaire.

Contrainte : les 88 tests existants doivent toujours passer.
Vitest run après.
```

**Résumé de la réponse :** types.ts étendu (`Refund`, `RefundResult`, erreurs, `refunds?` optionnel). refund-calculator.ts : pure fonction qui recalcule promos avec `order.createdAt` (H6) et vérifie I17. 6 tests RED/GREEN couvrant I13, I17, H6, cascade et pureté. 94 tests passent (88 cycle 1 inchangés).

**Décision :** Gardé tel quel. Le refund-calculator utilise `Set` pour filtrer les items par productId — O(n) au lieu de O(n²). L'interface `RefundCalculatorDeps` type les fonctions injectées, cohérent avec `CreateOrderDeps` du cycle 1. Le test I17 simule un total artificiellement bas (10€ pour une commande à 110€) car nos promos actuelles ne peuvent pas créer ce cas — c'est volontairement un test de garde défensif.

---

### P9 - Génération partial-cancellation-handler (TDD)

**Prompt :**

```
Contexte :
Cycle 2, chaîne bleue, phase Génération.
Réf : docs/cycle-2/ARCHITECTURE.md, docs/TDD.md,
séquence workflow P7 (8 étapes)

Composant : partial-cancellation-handler.ts
Invariants garantis : I14, I15, I16, I18, S9

Demande :
En suivant le cycle TDD de docs/TDD.md :

RED — tests/partial-cancellation-handler.test.ts :
- Test : retrait nominal d'1 article → order mis à jour, refund créé
- Test : état !== paid → erreur (I16)
- Test : item inexistant → erreur PartialCancellationError (S9)
- Test : retrait de tous les items → annulation totale,
  transition paid → cancelled (I14)
- Test : stock libéré uniquement pour items retirés (I15)
- Test : refunds[] mis à jour avec le nouveau refund (I18)
- Test : annulations successives → cumul cohérent (I18)
- Test : refund négatif → erreur propagée depuis calculator (I17)

GREEN — Génère src/partial-cancellation-handler.ts :
- Injection de dépendances (calculateRefund, stockManager,
  transition, applyPromotions, calculateTotal)
- Séquence les 8 étapes du workflow P7
- Aucune logique métier de calcul (déléguée au refund-calculator)

REFACTOR si nécessaire.

Contrainte : les 94 tests existants doivent toujours passer.
Vitest run après.
```

**Résumé de la réponse :** partial-cancellation-handler.ts implémenté (115 lignes). 8 tests RED/GREEN couvrant : nominal, I16 (état paid), S9 (item inexistant), I14 (annulation totale si 0 items), I15 (stock libéré partiellement), I18 (refunds[] mis à jour + cumul successif), I17 (erreur propagée du calculator). Le handler séquence les 8 étapes du workflow P7 avec branche I14 pour l'annulation totale. 102 tests passent (94 existants + 8 nouveaux).

**Décision :** Gardé tel quel. Le handler suit exactement la séquence du P7. Points validés : (1) le handler délègue tout calcul au refund-calculator — aucune logique métier de montant. (2) La branche I14 (annulation totale) utilise bien `transition('paid', 'cancelled')` via la state machine injectée. (3) Le matching réservation par productId est sûr grâce à la pré-condition d'unicité (S7). (4) Le refund ID est généré par compteur simple, cohérent avec le pattern du cycle 1.

---

## Phase : Specific Coding

_Objectif : relire le code généré, identifier et corriger les problèmes._

### P10 - Analyse des décisions implicites du cycle 2

**Prompt :**

```
Contexte :
Cycle 2, phase Specific Coding.
Réf : docs/cycle-2/INVARIANTS.md (I13-I18),
docs/cycle-2/ARCHITECTURE.md

Demande :
Relis les 2 nouveaux fichiers (refund-calculator.ts,
partial-cancellation-handler.ts) et sois honnête :

1. Quelles décisions as-tu prises implicitement sans me
   demander ? Pour chacune, quelle alternative existait ?

2. Les 6 invariants I13-I18 sont-ils tous couverts par
   au moins un test ? Liste le mapping.

3. Les scénarios S7, S8, S9 sont-ils couverts ?

4. Le handler contient-il de la logique métier de calcul
   qui devrait être dans le refund-calculator ?

5. Y a-t-il du code mort ou des imports inutiles ?

Ne corrige rien sans mon accord explicite.
```

**Résumé de la réponse :** 4 décisions implicites identifiées : D5 (double calcul remainingItems dans handler et calculator), D6 (`new Date()` non injectable dans le Refund), D7 (calcul trivial en dur dans la branche I14 au lieu de passer par le calculator), D8 (compteur refundId global mutable). 6/6 invariants couverts. S7 et S9 couverts, mais S8 (partial → total) n'a pas de test dédié. Un import inutile (`Reservation`).

**Décision :** Corrections retenues : D5 (supprimer double calcul), D6 (injecter now), S8 (test dédié partial → total), nettoyage import. D7 et D8 laissés en l'état — D7 est un calcul trivial acceptable, D8 est cohérent avec le pattern cycle 1.

---

### P11 - Corrections D5, D6, S8 et nettoyage

**Prompt :**

```
Applique ces corrections :

1. D5 : Supprime le double calcul de remainingItems dans le
   handler. Passe remainingItems directement au calculator.

2. D6 : Injecte now en paramètre du handler au lieu de
   new Date(). Cohérent avec le pattern du cycle 1
   (expiration-checker, promotion-engine).

3. S8 : Ajoute un test dédié : annulation partielle (retirer B)
   puis annulation partielle avec tous les items restants
   → I14 déclenché → transition paid → cancelled.

4. Supprime l'import Reservation inutile.

Ne touche pas à D7 (branche I14 calcul trivial) ni D8
(nextRefundId). Vitest run après.
```

**Résumé de la réponse :** 4 corrections appliquées. D5 : signature de `calculateRefund` changée pour accepter `remainingItems: readonly CartItem[]` directement, supprimant le double calcul (handler filtre une seule fois, passe au calculator). D6 : paramètre `now: Date = new Date()` ajouté au handler, les 2 occurrences de `new Date()` remplacées par `now` (paramètre + `createdAt` du Refund). Import `Reservation` supprimé. S8 : test dédié ajouté — annulation partielle (retirer B) puis retrait de tous les items restants (A+C) → I14 déclenché, `paid → cancelled`, cumul refunds = 100€, stock entièrement libéré. 103 tests passent (102 + 1 S8).

**Décision :** Corrections validées. D5 rend le calculator plus pur (il ne décide plus quels items retirer, il calcule sur ce qu'on lui donne). D6 complète l'injectabilité — le handler est maintenant 100% déterministe en test. Le test S8 couvre le scénario le plus critique : la transition d'annulations partielles successives vers une annulation totale, vérifiant que I14, I18 et la libération stock fonctionnent ensemble.

---

## Phase : Vérification

_Objectif : valider la couverture, les contraintes et la qualité finale._

### P12 - Vérification finale cycle 2

**Prompt :**

```
Contexte :
Cycle 2, vérification finale.
Réf : docs/cycle-2/INVARIANTS.md, docs/cycle-2/ARCHITECTURE.md

Demande :
1. Lance vitest run --coverage et montre le résultat.
   Cible : 80% minimum maintenu.

2. Vérifie que chaque invariant I13-I18 est couvert par
   au moins un test.

3. Vérifie que les scénarios S7, S8, S9 sont tous couverts.

4. Vérifie que les 88 tests du cycle 1 passent toujours.

5. Aucun fichier > 200 lignes.

6. Résumé final cycle 2 : nouveaux fichiers, nouveaux tests,
   coverage, invariants couverts.
```

**Résumé de la réponse :** Vérification complète. Coverage : 99.42% stmts, 98.98% branch, 95% funcs. 103 tests verts (88 cycle 1 + 15 cycle 2). Les 6 invariants I13-I18 sont tous couverts par au moins un test. Les 3 scénarios S7-S9 sont couverts (S8 via test dédié ajouté au P11). Les 88 tests cycle 1 passent sans modification. Un fichier test dépassait 200 lignes (204) → compacté à 198 lignes par suppression de lignes vides superflues. Aucun fichier > 200 lignes. Bilan : 2 nouveaux composants (refund-calculator.ts, partial-cancellation-handler.ts), types.ts étendu, 0 fichier cycle 1 modifié.

**Décision :** Cycle 2 validé. La couverture est maintenue au-dessus de 99%. Le seul point d'attention était le fichier test à 204 lignes, résolu par compactage sans perte de lisibilité. L'architecture modulaire du cycle 1 a prouvé sa composabilité : aucun composant existant n'a été modifié, seuls les types ont été étendus (champ optionnel `refunds?`). Le pattern fonction pure + handler séquenceur se reproduit parfaitement.
