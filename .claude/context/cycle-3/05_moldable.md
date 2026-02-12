# Phase 5 — Moldable (Cycle 3)

> Chaîne Rouge 🔴 | Pas de code

## Objectif

Dérouler des scénarios pas à pas (dry run) pour valider le modèle
avant de passer au code.

## Scénarios à dérouler

### Scénario A — Nominal
Commande {A:50€ x3, B:30€ x1} avec promo -10% → payé 162€.
Le client passe A de 3 à 1. Dérouler les 8 étapes du workflow.

### Scénario B — Cas I20 (quantité à 0)
Même commande. Le client passe A de 3 à 0.
Vérifier que l'erreur est bien levée à l'étape 3.

## Condition de passage

- [ ] Les 2 scénarios déroulés avec vérification des invariants
- [ ] Validation explicite de l'utilisateur
