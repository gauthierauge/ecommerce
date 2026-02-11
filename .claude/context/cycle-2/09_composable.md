# Phase 9 — Composable (Cycle 2)

> Chaîne Bleue 🔵 | Vérification d'indépendance

## Objectif

Vérifier que les composants cycle 2 sont indépendants et composables
avec les composants cycle 1.

## Points à vérifier

1. **refund-calculator.ts** n'importe rien directement de partial-cancellation-handler
2. **partial-cancellation-handler.ts** utilise calculateRefund via injection
3. **Aucun composant cycle 1 modifié** (hors types.ts — ajouts uniquement)
4. Les 88 tests cycle 1 passent sans modification

## Condition de passage

- [ ] Aucun import croisé entre les nouveaux composants
- [ ] 0 fichier cycle 1 modifié (hors types)
- [ ] Les 88 tests cycle 1 passent
- [ ] Validation explicite de l'utilisateur
