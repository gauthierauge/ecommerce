# Phase 4 — Conversation (Cycle 4)

> Chaîne Rouge 🔴 | Condensée avec phase 6 dans P2

## Objectif

Jouer le dev senior sceptique sur les risques de la réorganisation.

## Risques analysés (P2)

1. **Import cassé** → détecté au build (TypeScript strict)
2. **Fichier fantôme** (ancien chemin existe encore) → mitigé par `git mv`
3. **Barrel exports** (index.ts) → YAGNI rejeté
4. **Imports cross-dossier** → aucun (hors types.ts), bon signe architectural

## Décisions

- `abandoned-cart.ts` dans `order/` confirmé (un panier abandonné est un pré-order)
- `tests/` reste flat (15 fichiers < seuil)
- Pas de barrel exports

## Condition de passage

- [x] Risques identifiés et mitigés
- [x] Structure finale figée
- [x] Validation explicite de l'utilisateur
