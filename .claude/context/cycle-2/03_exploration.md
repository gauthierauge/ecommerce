# Phase 3 — Exploration (Cycle 2)

> Chaîne Rouge 🔴 | Pas de code

## Objectif

Comparer les approches architecturales pour le refund-calculator.

## Approches à comparer

- **A — Fonction pure** : `calculateRefund(order, remaining, promos, deps) → Result`
- **B — Méthode sur l'Order** : `order.removeItems(items) → Refund`
- **C — Service avec état** : `new RefundService(deps).processRefund(order, items)`

## Critères de comparaison

- Cohérence avec le pattern cycle 1 (orchestrateur + calculateur pur)
- Testabilité
- Respect de H9 (sans état)
- KISS / YAGNI

## Condition de passage

- [ ] Grille de comparaison remplie
- [ ] Approche retenue avec justification
