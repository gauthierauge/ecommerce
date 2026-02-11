# Phase 3 — Exploration (Cycle 3)

> Chaîne Rouge 🔴 | Pas de code

## Objectif

Comparer les approches architecturales pour l'ajustement du stock.
Condensée avec la phase Hypothèse (P2).

## Approches à comparer

- **A — adjustReservation** : nouvelle méthode atomique sur le stock-manager
- **B — release + reserve** : composition des méthodes existantes

## Critères de comparaison

- Atomicité (I21)
- Cohérence avec I1 (pas de survente)
- Simplicité d'implémentation
- Préservation des informations (expiresAt)

## Condition de passage

- [ ] Grille de comparaison remplie
- [ ] Approche retenue avec justification
