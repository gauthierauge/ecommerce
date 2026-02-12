# Phase 7 — Génération (Cycle 2)

> Chaîne Bleue 🔵 | ON CODE !

## Objectif

Générer le code composant par composant, en TDD (RED → GREEN → REFACTOR).

## Composants à générer

### P8 : refund-calculator.ts
- Fonction pure : `calculateRefund(order, remainingItems, promos, deps)`
- Réutilise applyPromotions + calculateTotal via injection
- Utilise `order.createdAt` (pas `now`) pour le recalcul des promos (H6)
- Invariants : I13, I17

### P9 : partial-cancellation-handler.ts
- Orchestrateur : workflow 8 étapes, aucune logique de calcul
- Injection de dépendances (calculateRefund, stockManager, transition)
- Gère I14 (annulation totale si 0 items restants)
- Invariants : I14, I15, I16, I18

### types.ts : Extensions
- Interface `Refund`, `RefundResult`
- Erreurs `RefundNegativeError`, `PartialCancellationError`
- Champ optionnel `refunds?` sur `Order`

## Règles de génération

- ✅ TDD : tests d'abord, implémentation ensuite
- ✅ Les 88 tests cycle 1 doivent toujours passer
- ❌ Aucun fichier > 200 lignes

## Condition de passage

- [ ] refund-calculator implémenté et testé
- [ ] partial-cancellation-handler implémenté et testé
- [ ] Tous les tests passent
- [ ] Validation explicite de l'utilisateur
