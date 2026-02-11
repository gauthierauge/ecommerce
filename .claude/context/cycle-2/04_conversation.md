# Phase 4 — Conversation (Cycle 2)

> Chaîne Rouge 🔴 | Pas de code

## Objectif

Révéler les cas limites et failles du modèle de remboursement partiel.

## Scénarios à explorer

1. **S7** — Mapping item ↔ réservation ambigu (même productId, quantités différentes)
2. **S8** — Annulation totale après remboursement partiel (cumul des refunds)
3. **S9** — Double retrait du même article (idempotence, retry réseau)

## Livrable

Remplir `docs/cycle-2/EDGE_CASES.md`.

## Condition de passage

- [ ] Au moins 3 scénarios de faille identifiés
- [ ] Chaque scénario a une résolution
- [ ] Validation explicite de l'utilisateur
