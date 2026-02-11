# Phase 5 — Moldable (Cycle 2)

> Chaîne Rouge 🔴 | Pas de code

## Objectif

Dérouler des scénarios pas à pas (dry run) pour valider le modèle
avant de passer au code.

## Scénarios à dérouler

### Scénario A — Nominal (retrait d'un article)
Commande {A:50€, B:30€, C:20€}, promo -10%, payé 90€.
Retirer B. Dérouler les 8 étapes du workflow.

### Scénario B — Annulations successives
Poursuivre depuis le résultat du scénario A, retirer C.
Vérifier le cumul des refunds (I18).

### Scénario C — Remboursement négatif (I17)
Commande avec promo conditionnelle, retrait d'article qui fait sauter la condition.

## Condition de passage

- [ ] Les 3 scénarios déroulés avec vérification des invariants
- [ ] Validation explicite de l'utilisateur
