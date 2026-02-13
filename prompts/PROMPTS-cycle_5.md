# Journal des Prompts — Cycle 5 : Audit et consolidation

> **Stack** : TypeScript + Vitest
> **Agent IA** : Claude Code
> **Méthodologie** : Wardley Map — Chaîne Rouge puis Chaîne Bleue
> **Base** : 4 cycles, 14 composants, 123 tests, 23 invariants
> **Objectif** : Challenger l'existant — trouver ce qu'on a raté

---

# 🔴 Chaîne Rouge — Penser avant de produire

---

## Phase : Décision

### P1 - Audit des invariants et edge cases manquants

**Prompt :**
```
Contexte :
Cycle 5 — Audit du projet complet. Phase Décision.
Pas de code.
Réf : docs/cycle-1/INVARIANTS.md (I1-I12),
docs/cycle-2/INVARIANTS.md (I13-I18),
docs/cycle-3/ (I19-I23),
tous les fichiers src/ et tests/

Demande :
Joue le rôle d'un auditeur externe qui découvre le projet.
Relis TOUS les invariants I1-I23 et cherche :

1. INVARIANTS MANQUANTS — des règles métier qui devraient
   être protégées mais ne le sont pas. Pense à :
   - Que se passe-t-il si le panier est vide ?
   - Que se passe-t-il si un prix est négatif ?
   - Que se passe-t-il si deux commandes utilisent
     le même panier ?
   - Que se passe-t-il si une promo est appliquée
     deux fois ?
   - Que se passe-t-il après expédition ? (retour, litige)

2. INVARIANTS FAIBLES — des invariants documentés mais
   insuffisamment protégés (un seul test, pas de test
   de boundary)

3. EDGE CASES NON TESTÉS — des scénarios S1-S9 qui
   méritent plus de tests ou des scénarios nouveaux

4. INCOHÉRENCES ENTRE CYCLES — des décisions du cycle 1
   qui contredisent les cycles 2-3

Pour chaque problème : description, gravité (critique /
important / mineur), invariant impacté ou nouveau.
```

**Résumé de la réponse :**
L'audit a identifié 5 invariants candidats manquants (IC1-IC5 : précision monétaire, promo doublon, commande à 0€, concurrence sur modifications, quantité max), 3 invariants faibles (I8 idempotence sans test dédié, I1 atomicité = hypothèse single-thread, I12 boundary temporelle), 4 edge cases non testés (annulations successives cumulées, cascade sur 1 item restant, adjustReservation + expiration, paiement entre modifications) et 2 incohérences inter-cycles (patterns stock divergents release vs adjust, sum(refunds) + total non vérifié).

**Décision :**
Tout gardé. Les 14 problèmes identifiés sont pertinents et ancrés dans le domaine. IC1 (précision monétaire) et IC4 (concurrence) sont les plus critiques. L'incohérence comptable sum(refunds) + total est un vrai angle mort. On passe au P2 challenge pour creuser les failles de cet audit.

---

### P2 - Challenge de l'audit : tri des vrais problèmes

**Prompt :**

```
Contexte :
Cycle 5, phase Décision — 2ème prompt (challenge).
Pas de code.
Réf : P1 cycle 5 (audit)

Je challenge tes trouvailles :

1. IC1 (précision flottante) — On a DÉJÀ corrigé R1 au code
   review : Math.round(amount * 100) / 100 dans promotion-engine.
   Est-ce suffisant ou faut-il arrondir dans TOUS les calculs
   (total-calculator, refund-calculator) ?

2. IC2 (promo doublon) — Bon catch. Mais est-ce la responsabilité
   de compatibility-checker (qui vérifie les paires) ou d'un
   nouveau garde-fou dans promotion-engine ?

3. IC3 (commande 0€) — Est-ce vraiment un problème ? Le stock
   est légitime même à 0€. Le paiement de 0€ est un no-op.
   Argumente si tu penses que c'est un vrai invariant.

4. IC4 (concurrence) — Tu as toi-même dit au P3 cycle 2 (S11)
   que c'est mitigé par le single-thread JS. Est-ce qu'on
   documente l'hypothèse ou on code un verrou ?

5. IC5 (quantité max) — YAGNI ? Le domaine pur ne sait pas
   quelle est la limite métier.

6. Incohérence release vs adjust — release() supprime TOUTE
   la réservation d'un item retiré. adjustReservation() modifie
   la quantité d'un item gardé. Ce sont deux cas différents.
   Est-ce vraiment incohérent ?

7. sum(refunds) + total = original — Ça c'est un vrai manque.
   Quel invariant et où le vérifier ?

Pour chaque point : maintenu, rejeté, ou reformulé ?
```

**Résumé de la réponse :**
Après vérification dans le code source : IC1 reformulé (promotion-engine arrondit déjà, mais total-calculator.ts:12 et refund-calculator.ts:23 n'arrondissent pas — gravité rétrogradée à important). IC2 maintenu (compatibility-checker.ts:7-15 ne détecte pas les doublons — dédoublonnage à faire en amont). IC3 rejeté (commande 0€ = cas valide). IC4 reformulé en hypothèse H-SYNC à documenter (handlers synchrones, pas de risque en single-thread). IC5 rejeté (YAGNI). Incohérence release/adjust rejetée (deux opérations sémantiquement différentes). sum(refunds) + total maintenu comme nouvel invariant I24 critique. Bilan : 14 → 9 points d'action.

**Décision :**
Tout gardé. Le challenge a éliminé 3 faux positifs (IC3, IC5, release vs adjust) et affiné 2 points (IC1, IC4). Reste 9 vrais problèmes dont 2 critiques (IC2 promo doublon, I24 cohérence comptable). L'audit est maintenant filtré et actionnable.

---

## Phase : Hypothèse

_Objectif : formuler des hypothèses testables, ne pas demander de solutions._

### P3 - Hypothèses sur les corrections d'audit

**Prompt :**

```
Contexte :
Cycle 5, phase Hypothèse. Pas de code.
Réf : P2 cycle 5 (bilan audit)

Hypothèses à valider/invalider :

H13 — ARRONDI SUFFISANT EN BOUT DE CHAÎNE :
"Arrondir uniquement le résultat final de total-calculator
et refund-calculator suffit. Pas besoin d'arrondir chaque
étape intermédiaire car Math.round en sortie absorbe les
écarts IEEE 754."
→ Valide ou invalide ? Montre un contre-exemple chiffré
si invalide.

H14 — DÉDOUBLONNAGE DANS PROMOTION-ENGINE :
"Le dédoublonnage des promos par ID doit se faire dans
promotion-engine (qui reçoit les promos) plutôt que dans
cart-validator ou order-orchestrator."
→ Valide ou invalide ? Quel composant a la responsabilité ?

H15 — I24 VÉRIFIABLE SANS NOUVEAU COMPOSANT :
"La cohérence comptable (total + sum(refunds) = original)
peut être vérifiée par un test e2e uniquement, sans ajouter
de code de vérification dans les handlers."
→ Valide ou invalide ? Faut-il un garde-fou dans le code
ou un test suffit ?

H16 — LES EDGE CASES EC1 ET EC3 SONT COUVERTS PAR I24 :
"Si I24 est vérifié sur un scénario multi-opérations
(retrait + modification quantité), alors EC1 et EC3 sont
automatiquement couverts."
→ Valide ou invalide ?
```

**Résumé de la réponse :**
H13 (arrondi bout de chaîne) ⚠️ partielle — un seul Math.round dans total-calculator.ts:13 suffit à protéger toute la chaîne, car refund-calculator.ts:23 utilise la sortie de calculateTotal pour les deux opérandes. Contre-exemple : 9.99€ × 7 = 69.93000000000001 en IEEE 754 → le total stocké serait imprécis sans arrondi. H14 (dédoublonnage dans promotion-engine) ❌ invalidée — promotion-engine applique, il ne valide pas (SRP). Le dédoublonnage appartient à la couche validation (compatibility-checker ou orchestrator). H15 (I24 test seul) ⚠️ partielle — algébriquement garanti par la somme télescopique, mais dépend de H13 (flottants propres). H16 (EC1+EC3 couverts par I24) ⚠️ partielle — EC1 oui (monétaire), EC3 non (problème de stock, pas de montant).

**Décision :**
Tout gardé. Aucune hypothèse 100% validée — chaque nuance est traçable. Le lien H13↔H15 est une découverte clé : corriger l'arrondi débloque la garantie algébrique de I24. H14 invalidée = bonne prise de conscience SRP.

---

### P4 - Challenge des hypothèses d'audit

**Prompt :**

```
Contexte :
Cycle 5, phase Hypothèse — 2ème prompt (challenge).
Pas de code.
Réf : P3 cycle 5

Je challenge tes verdicts :

1. H13 — Tu dis qu'un seul Math.round dans total-calculator
   suffit. Mais total-calculator est appelé DEUX fois dans
   order-orchestrator : une fois pour le subtotal sans promos,
   une fois pour le total avec promos. Le subtotal non arrondi
   est-il passé à promotion-engine ? Si oui, les discounts
   sont calculés sur un subtotal imprécis même si le total
   final est arrondi. Vérifie la chaîne complète.

2. H14 — Tu proposes compatibility-checker. Mais sa
   responsabilité est de vérifier l'incompatibilité ENTRE
   promos différentes (matrice). Un doublon n'est pas une
   incompatibilité — c'est une entrée invalide. Est-ce
   vraiment la même responsabilité ?

3. H15 — Tu dis que I24 est garanti algébriquement par
   la formule. Mais refund-calculator utilise order.total
   comme référence. Si order.total a été modifié manuellement
   ou corrompu entre deux opérations, la somme télescopique
   ne tient plus. Est-ce que le test e2e couvre ce risque
   ou est-ce qu'il faut stocker originalTotal explicitement ?

4. H16 — Tu rejettes EC3 de I24. Mais EC3 pose une
   question plus profonde : après adjustReservation,
   la réservation a-t-elle toujours le même expiresAt ?
   Ou le timer est-il réinitialisé ? Vérifie dans
   stock-manager.ts.
```

**Résumé de la réponse :**
Challenge 1 (H13 subtotal imprécis) : confirmé comme fait, mais Math.round dans promotion-engine.ts:23 absorbe l'écart — un seul arrondi dans total-calculator.ts:13 suffit. Challenge 2 (H14 compatibility-checker) : reformulé — dédoublonnage dans order-orchestrator (SRP respecté, cohérent avec les validations lignes 43-53). Challenge 3 (H15 corruption) : pas de risque runtime (immutabilité), mais ajout de originalTotal dans Order améliore la traçabilité de I24. Challenge 4 (H16/EC3 expiresAt) : vérifié dans stock-manager.ts:52 — spread conserve expiresAt, timer non réinitialisé. EC3 correct par construction, mais décision implicite à documenter (H-EXPIRY) + test dédié nécessaire.

**Décision :**
Tout gardé. Le challenge a affiné chaque hypothèse sans en invalider aucune. Découvertes : originalTotal à ajouter au type Order, H-EXPIRY à documenter, test EC3 à écrire. On passe à l'exploration des approches.

---

## Phase : Exploration

_Objectif : élargir l'espace des solutions avant de converger._

### P5 - Exploration des approches de correction

**Prompt :**

```
Contexte :
Cycle 5, phase Exploration — prompt 1. Pas de code.
Réf : P3-P4 cycle 5 (hypothèses validées)

4 corrections à faire. Compare les approches pour chaque :

1. IC1 (arrondi) — Où placer le Math.round ?
   A : Dans total-calculator.ts uniquement (sortie finale)
   B : Dans total-calculator + refund-calculator (double protection)
   C : Créer une fonction roundCents() dans un utils et
       l'appeler partout

2. IC2 (promo doublon) — Comment gérer le doublon ?
   A : Erreur explicite (DuplicatePromotionError) — l'appelant
       sait qu'il a envoyé un doublon
   B : Dédoublonnage silencieux (Set sur les IDs) — l'appelant
       ne sait pas
   C : Warning dans le résultat (dédoublonner + flag dans
       le retour)

3. I24 (originalTotal) — Où le stocker ?
   A : Champ optionnel originalTotal? dans Order — rétro-compatible
   B : Champ obligatoire originalTotal dans Order — casse les
       123 tests existants
   C : Ne pas stocker — le reconstituer depuis refunds[0].oldTotal

4. EC3 (adjust + expiration) — Comment tester ?
   A : Injecter now dans expiration-checker comme on le fait
       déjà (cohérent avec D6 cycle 2)
   B : Timer réel avec setTimeout
   C : Mock du stock-manager

Pour chaque : avantages, inconvénients, cohérence avec
les patterns existants du projet.
```

### P6 - Challenge des approches de correction

**Prompt :**

```
Contexte :
Cycle 5, phase Exploration — 2ème prompt (challenge).
Pas de code.
Réf : P5 cycle 5

Je challenge tes recommandations :

1. IC1 option A — Tu dis un seul Math.round dans
   total-calculator suffit. Mais si demain un nouveau
   composant appelle directement les items pour calculer
   un montant (sans passer par total-calculator), il
   n'aura pas l'arrondi. L'option A ne protège que
   le chemin qui passe par total-calculator. Est-ce
   un risque réel ou théorique ?

2. IC2 option A — DuplicatePromotionError dans
   order-orchestrator. Mais l'orchestrateur fait déjà
   validateCart + checkCompatibility + applyPromotions.
   Ajouter une vérification de doublon en plus, c'est
   une 4ème validation. Est-ce que ça ne surcharge pas
   l'orchestrateur ? Ou est-ce que le check est si
   simple (3 lignes) que ça ne compte pas ?

3. I24 option A — Champ optionnel originalTotal?.
   Tu dis "le nouveau code le peuple à la création".
   Mais les handlers de refund (partial-cancellation,
   quantity-modifier) retournent un nouvel Order.
   Est-ce qu'ils propagent originalTotal correctement
   avec le spread { ...order } ? Ou faut-il le gérer
   explicitement ?

4. Toutes option A — Tu notes toi-même que "ce n'est
   pas un biais". Mais 4/4 option A, c'est suspect.
   Donne-moi UN argument en faveur de l'option B ou C
   pour chaque correction qui pourrait me faire changer
   d'avis.
```
