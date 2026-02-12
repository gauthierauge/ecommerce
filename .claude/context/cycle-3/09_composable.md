# Phase 9 — Composable (Cycle 3)

> Chaîne Bleue 🔵 | Vérification d'indépendance

## Objectif

Vérifier que les composants sont indépendants et composables.

## Points à vérifier

1. **quantity-modifier.ts** n'importe rien directement de partial-cancellation-handler
2. **stock-manager.ts** est rétrocompatible (adjustReservation ne casse rien)
3. **refund-calculator.ts** est inchangé et fonctionne avec les deux handlers
4. Les types sont partagés via injection, pas par couplage direct

## Condition de passage

- [ ] Aucun import croisé entre quantity-modifier et partial-cancellation-handler
- [ ] Les 109 tests cycles 1+2 passent sans modification
- [ ] Validation explicite de l'utilisateur
