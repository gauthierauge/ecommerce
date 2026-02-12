# Phase 4 — Conversation (Cycle 3)

> Chaîne Rouge 🔴 | Pas de code

## Objectif

Révéler les cas limites et failles du modèle en jouant le rôle du dev
senior sceptique.

## Scénarios à explorer

1. **S10** — Modification puis tentative de remonter la quantité
   → Invariant menacé : I1 (survente), protégé par I19
2. **S11** — Modification de quantité + annulation partielle simultanées
   → Invariant menacé : I18 (somme des refunds), mitigé par synchronisme

## Livrable

Remplir `docs/cycle-3/EDGE_CASES.md`.

## Condition de passage

- [ ] Au moins 2 scénarios de faille identifiés
- [ ] Chaque scénario a une mitigation
- [ ] Validation explicite de l'utilisateur
