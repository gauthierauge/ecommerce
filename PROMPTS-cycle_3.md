# Journal des Prompts — Cycle 3 : Modification de quantité

> **Stack** : TypeScript + Vitest (domaine pur, sans framework web)
> **Agent IA** : Claude Code
> **Méthodologie** : Wardley Map — Chaîne Rouge puis Chaîne Bleue
> **Base** : Cycle 1 (11 composants) + Cycle 2 (2 composants) — 109 tests

---

# 🔴 Chaîne Rouge — Penser avant de produire

---

## Phase : Décision

_Objectif : clarifier le besoin, identifier l'impact sur les cycles précédents._

### P1 - Invariants et périmètre de la modification de quantité

**Prompt :**
```
Contexte :
Cycle 3 — Feature : modification de quantité d'un article
dans une commande payée.
Phase Décision. Pas de code.
Réf : docs/cycle-2/INVARIANTS.md (P2 — cette feature était OUT),
docs/cycle-1/ARCHITECTURE.md

Au cycle 2 P2, on a exclu la modification de quantité car :
- stock-manager.release() supprime le token entier
- pas de release partiel
- Reservation deviendrait mutable

Demande :
1. Nouveaux invariants spécifiques à la modification de quantité
2. Impact sur les composants existants — quels fichiers faut-il
   modifier cette fois ? (contrairement au cycle 2 où aucun
   fichier cycle 1 n'a été touché)
3. Périmètre IN/OUT
4. Critères de réussite mesurables
```

**Résumé de la réponse :** 5 invariants identifiés (I19-I23) : quantité uniquement en baisse, qté=0 délègue au cycle 2, ajustement stock atomique sur le delta, refund recalculé en cascade, réservation reflète la nouvelle qté. Impact : `types.ts` et `stock-manager.ts` doivent être modifiés (rupture avec cycle 2). Nouveau composant `quantity-modifier.ts`. 6 critères de réussite (C13-C18).

**Décision :** Validé avec réserve sur I23 — l'agent propose `adjustReservation` (option A, atomique) plutôt que release+reserve (option B, non atomique). Cohérent avec I21 mais à confirmer en phase Hypothèse. Le périmètre OUT (augmentation, multi-état, prix) est bien borné. J'aurais pu challenger I20 (qté=0 → erreur vs délégation automatique) mais la séparation des responsabilités avec le cycle 2 est plus propre.

---

## Phase : Hypothèse

Objectif : formuler des hypothèses testables, ne pas demander de solutions.

### P2 - Hypothèses et exploration de la modification de quantité

**Prompt :**

```
Contexte :
Cycle 3, phases Hypothèse + Exploration condensées. Pas de code.
Réf : docs/cycle-3/INVARIANTS.md (I19-I23)

Hypothèses :

H10 — AJUSTEMENT ATOMIQUE :
"adjustReservation(id, newQty) est préférable à release+reserve
car l'opération est atomique par construction. Pas de fenêtre
où le stock est temporairement disponible."
→ Valide ou invalide ?

H11 — RÉUTILISATION DU REFUND-CALCULATOR :
"Le refund-calculator du cycle 2 peut être réutilisé tel quel.
On lui passe les items avec quantités modifiées, il recalcule
le total et le remboursement."
→ Valide ou invalide ?

H12 — QUANTITY-MODIFIER VS EXTENSION DU HANDLER CYCLE 2 :
Compare 2 approches :
A : Nouveau fichier quantity-modifier.ts dédié
B : Étendre partial-cancellation-handler.ts pour gérer
    aussi la modification de quantité

Pour chaque : avantages, inconvénients, cohérence avec SRP.
```

**Résumé de la réponse :** H10 validée — `adjustReservation` atomique évite la fenêtre de vulnérabilité stock entre release et reserve. H11 validée — `refund-calculator` réutilisable tel quel en passant les items avec quantités modifiées. H12 option A retenue — nouveau `quantity-modifier.ts` plutôt qu'extension du handler cycle 2 (SRP, limite 200 lignes).

**Décision :** Les 3 hypothèses sont cohérentes. H10 confirmée par l'analyse du code `getAvailableStock()` qui itère les réservations — une opération unique sur la Map est bien atomique. H12 tranchée en faveur de l'option A malgré la duplication de ~10 lignes de wiring : la séparation retrait/quantité est structurelle, pas accidentelle, car les validations diffèrent (filter vs map). Pas de surprise, on passe à la chaîne bleue.

---

## Phase : Conversation

_Objectif : révéler les cas limites et failles du modèle._

### P3 - Failles et architecture de la modification de quantité

**Prompt :**

```
Contexte :
Cycle 3, phases Conversation + Modèle condensées. Pas de code.
Réf : docs/cycle-3/INVARIANTS.md (I19-I23), H10-H12

1. CONVERSATION — Joue le dev senior sceptique :
   Quels scénarios feraient planter la modification de quantité ?
   Au moins 2 scénarios avec l'invariant menacé.

2. MODÈLE — Fige l'architecture :
   - Liste des fichiers modifiés (stock-manager, types) et créés
     (quantity-modifier) avec responsabilité et invariants
   - Séquence du workflow de modification de quantité
     (étapes numérotées)
   - Mapping I19-I23 → composant responsable
```

**Résumé de la réponse :** Deux scénarios de faille identifiés. S10 : modification puis tentative de remonter la quantité — protégé par I19. S11 : modification de quantité + annulation partielle simultanées sur le même ordre — la somme des refunds pourrait dépasser le paiement (I18 menacé), mitigé par l'architecture synchrone. Architecture figée : 2 fichiers modifiés (types.ts, stock-manager.ts), 1 créé (quantity-modifier.ts). Workflow en 8 étapes séquentielles.

**Décision :** S10 est bien couvert par I19, pas d'action. S11 est le vrai risque — l'agent argumente que le single-thread JS protège naturellement, ce qui est vrai pour notre domaine pur (pas d'async). Mais j'ajoute une note : si le projet évolue vers de l'async, il faudra un mécanisme de verrouillage. Le mapping I19-I23 → composants est clair, chaque invariant a un responsable unique. Validé.

---

## Phase : Moldable

_Objectif : tester la logique sur des artefacts jetables, sans coder._

### P4 - Dry run de la modification de quantité

**Prompt :**

```
Contexte :
Cycle 3, phase Moldable. Pas de code.
Réf : docs/cycle-3/ARCHITECTURE.md, séquence workflow P3

Demande :
Déroule ces 2 scénarios pas à pas :

Scénario A (nominal) :
Commande {A:50€ x3, B:30€ x1} avec promo -10% → payé 180€ × 0.9 = 162€.
Le client passe A de 3 à 1. Dérouler le workflow étape par étape.

Scénario B (cas I20 — quantité à 0) :
Même commande. Le client passe A de 3 à 0.
Que se passe-t-il ? Quelle erreur ?
```

**Résumé de la réponse :** Scénario A déroulé en 8 étapes : validation (paid, article existe, 1<3, 1≥1), construction remainingItems [{A:1},{B:1}], refund-calculator donne nouveau total 72€ (80-8 promo), refund=90€, adjustReservation atomique, Refund tracé. Scénario B : rejeté à l'étape 3 (I20 : newQty=0 < 1), message redirige vers annulation partielle cycle 2, aucun effet de bord.

**Décision :** Le dry run confirme que le workflow est complet — les 5 invariants sont vérifiés dans le scénario A, et le scénario B est bien intercepté en amont par le quantity-modifier (pas par le stock-manager). J'ai noté la double protection I20 (modifier + stock-manager) qui est redondante mais défensive. Le calcul 162→72=90€ de refund est cohérent avec I22 (cascade promos). Prêt pour la phase Modèle.

---

## Phase : Modèle

_Objectif : stabiliser l'architecture avant de passer au code._

### P5 - Validation de l'architecture cycle 3
**Prompt :**

```
Contexte :
Cycle 3, phase Modèle. Pas de code.
Réf : P3 section architecture

Demande :
Confirme l'architecture finale du cycle 3 :
1. Liste les fichiers modifiés et créés avec leurs
   responsabilités et invariants
2. Confirme que le workflow en 8 étapes du P3 est complet
3. Y a-t-il un invariant I19-I23 sans composant responsable ?

Scénario B (cas I20 — quantité à 0) :
Même commande. Le client passe A de 3 à 0.
Que se passe-t-il ? Quelle erreur ?
```

**Résumé de la réponse :** Architecture confirmée : 2 fichiers modifiés (types.ts, stock-manager.ts), 1 créé (quantity-modifier.ts), 2 tests (stock-manager.test.ts modifié, quantity-modifier.test.ts créé). Workflow 8 étapes validé complet avec un sous-détail ajouté à l'étape 6 (lookup reservationId par productId). Mapping I19-I23 : aucun invariant orphelin, tous ont au moins un composant responsable avec double protection sur I19 et I20.

**Décision :** Architecture stable et prête pour le code. Le point soulevé sur le lookup de réservation (étape 6) est pertinent — le quantity-modifier devra chercher `order.reservations.find(r => r.productId === targetProductId)` avant d'appeler adjustReservation. C'est un détail d'implémentation, pas un invariant manquant. La chaîne rouge est complète (5 prompts, 5 phases). On passe à la chaîne bleue.

---

# 🔵 Chaîne Bleue — Produire avec maîtrise

---

## Phase : Génération

_Objectif : générer le code composant par composant, jamais en bloc._

### P6 - Génération adjustReservation dans stock-manager (TDD)

```
Contexte :
Cycle 3, chaîne bleue, phase Génération. ON CODE.
Réf : docs/cycle-3/ARCHITECTURE.md, docs/TDD.md, H10

Composant : stock-manager.ts (modification) + types.ts
Invariant garanti : I19, I20, I21, I23

Demande :
En suivant le cycle TDD :

RED — Ajoute dans tests/stock-manager.test.ts :
- Test : adjustReservation de qty 3 → 1, stock libéré de 2
- Test : adjustReservation avec newQty > oldQty → erreur (I19)
- Test : adjustReservation avec newQty === 0 → erreur (I20)
- Test : adjustReservation sur réservation inexistante → erreur
- Test : adjustReservation atomique (stock dispo cohérent après)

GREEN :
1. Ajoute adjustReservation(id, newQty) à IStockManager dans types.ts
2. Implémente dans stock-manager.ts : une seule opération
   sur la Map, retourne la nouvelle Reservation

REFACTOR si nécessaire.

Contrainte : les 109 tests existants doivent toujours passer.
Vitest run après.
```

**Résumé de la réponse :** RED : 5 tests ajoutés dans stock-manager.test.ts (diminution qty, newQty > oldQty, newQty=0, inexistante, atomicité). GREEN : `adjustReservation(id, newQty)` ajouté à `IStockManager` dans types.ts et implémenté dans StockManager — une seule opération Map.set, 12 lignes. REFACTOR : pas nécessaire. 114 tests verts (109 anciens + 5 nouveaux).

**Décision :** Implémentation minimale et correcte. L'ajout à l'interface `IStockManager` est rétrocompatible (les mocks dans les autres tests n'appellent pas cette méthode). La validation `newQty > existing.quantity` dans le stock-manager est une protection basse couche — le quantity-modifier fera la même vérif avec un message métier. Double protection cohérente avec l'approche défensive du projet.

---

### P7 - Génération quantity-modifier (TDD)

**Prompt :**

```
Contexte :
Cycle 3, chaîne bleue, phase Génération.
Réf : docs/cycle-3/ARCHITECTURE.md, workflow 8 étapes P5

Composant : quantity-modifier.ts
Invariants garantis : I19, I20, I22

Demande :
En suivant le cycle TDD :

RED — tests/quantity-modifier.test.ts :
- Test : diminuer qty 3 → 1, total recalculé avec promos, refund correct (C13, C14)
- Test : état !== paid → erreur (I16 réutilisé)
- Test : article inexistant → erreur
- Test : newQty >= oldQty → erreur (I19, C16)
- Test : newQty === 0 → erreur, message renvoyant vers le cycle 2 (I20, C15)
- Test : refund négatif → erreur propagée depuis calculator (I17)
- Test : refunds[] mis à jour (I18)
- Test : réservation mise à jour via adjustReservation (I23)

GREEN — src/quantity-modifier.ts :
- Injection de dépendances (calculateRefund, stockManager,
  applyPromotions, calculateTotal)
- Séquence les 8 étapes du workflow P5
- Aucune logique de calcul (déléguée au refund-calculator)

REFACTOR si nécessaire.

Contrainte : les 114 tests existants doivent toujours passer.
Vitest run après.
```

**Résumé de la réponse :** RED : 9 tests créés dans quantity-modifier.test.ts couvrant nominal (C13/C14), état non-paid, article inexistant, I19 (newQty >= oldQty et newQty === oldQty), I20 (newQty=0), I17 (refund négatif), I18 (refunds tracé), I23 (réservation ajustée). GREEN : `quantity-modifier.ts` (114 lignes) suit le workflow 8 étapes, zéro logique de calcul. 123 tests verts.

**Décision :** Implémentation fidèle à l'architecture P5. Le pattern est isomorphe au `partial-cancellation-handler` du cycle 2 (même structure, deps injectées, Refund produit). La duplication structurelle (~10 lignes de wiring) est acceptée car les validations divergent (map vs filter, qty check vs existence check). Le `removedItems` dans le Refund contient `{productId, quantity: delta}` ce qui trace précisément la modification. Vérifié : 114 anciens + 9 nouveaux = 123 verts.

---

## Phase : Vérification

### P8 - Vérification finale cycle 3

**Prompt :**

```
Contexte :
Cycle 3, vérification finale.
Réf : docs/cycle-3/INVARIANTS.md, docs/cycle-3/ARCHITECTURE.md

Demande :
1. Lance vitest run --coverage et montre le résultat.
2. Vérifie que chaque invariant I19-I23 est couvert par un test.
3. Vérifie que les 109 tests des cycles 1 et 2 passent toujours.
4. Aucun fichier > 200 lignes.
5. Résumé final cycle 3.
```

**Résumé de la réponse :** Coverage 99.54% stmts, 98.41% branches. Les 5 invariants I19-I23 sont chacun couverts par au moins un test (I19 et I20 en double protection modifier + stock-manager). 109 tests cycles 1+2 toujours verts + 14 nouveaux = 123 total. Aucun fichier > 200 lignes (max 190). Bilan : 1 composant créé, 2 modifiés, 23 invariants, 43 prompts sur 3 cycles.

**Décision :** Cycle 3 validé. Le coverage reste au-dessus de 99% malgré l'ajout de `adjustReservation` (L71-72 de stock-manager non couvertes = branche d'erreur mineure). La modification de fichiers cycle 1 est la rupture assumée de ce cycle — justifiée par H10 car l'atomicité était impossible autrement. Le `quantity-modifier` est bien isomorphe au `partial-cancellation-handler` sans duplication de logique métier.
