# Phase 7 — Génération (Cycle 3)

> Chaîne Bleue 🔵 | ON CODE !

## Objectif

Générer le code composant par composant, en TDD (RED → GREEN → REFACTOR).

## Composants à générer

### P6 : stock-manager.ts — adjustReservation
- Ajouter `adjustReservation(id, newQty)` à `IStockManager` (types.ts)
- Implémenter dans `StockManager` : opération atomique Map.set
- 5 tests : diminution, newQty > oldQty, newQty=0, inexistante, atomicité
- Invariants : I19, I20, I21, I23

### P7 : quantity-modifier.ts — Nouveau composant
- Orchestrateur : workflow 8 étapes
- Injection de dépendances (calculateRefund, stockManager, applyPromotions, calculateTotal)
- Aucune logique de calcul (déléguée au refund-calculator)
- 8-9 tests couvrant I19, I20, I22, I23, I16, I17, I18
- Invariants : I19, I20, I22

## Règles de génération

- ✅ Un prompt = un composant
- ✅ TDD : tests d'abord, implémentation ensuite
- ✅ Les tests existants (109+) doivent toujours passer
- ❌ Aucun fichier > 200 lignes

## Condition de passage

- [ ] adjustReservation implémenté et testé
- [ ] quantity-modifier implémenté et testé
- [ ] Tous les tests passent
- [ ] Validation explicite de l'utilisateur
