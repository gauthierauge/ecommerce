# Phase 1 — Décision (Cycle 2)

> Chaîne Rouge 🔴 | Pas de code

## Objectif

Clarifier le besoin de remboursement partiel à l'annulation, identifier les
invariants spécifiques et l'impact (ou non) sur les composants du cycle 1.

## Ce que cette phase doit produire

1. **Nouveaux invariants** (I13-I18) spécifiques au remboursement partiel
2. **Impact sur les composants cycle 1** — quels fichiers toucher ?
3. **Périmètre IN/OUT** — retrait d'articles uniquement, pas modification de quantité
4. **Critères de réussite mesurables** (C7-C12)

## Livrable

Remplir `docs/cycle-2/INVARIANTS.md`.

## Rappels

- ❌ Aucun code, aucune architecture
- ✅ Identifier les complexités : recalcul promos, remboursement négatif, stock partiel
- ✅ Décider explicitement ce qui est OUT (modification quantité, retours après livraison)

## Condition de passage

- [ ] Invariants I13-I18 listés
- [ ] Impact cycle 1 évalué
- [ ] Périmètre in/out défini
- [ ] Validation explicite de l'utilisateur
