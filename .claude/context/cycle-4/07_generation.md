# Phase 7 — Génération (Cycle 4)

> Chaîne Bleue 🔵 | ON REFACTORE (pas de code nouveau)

## Objectif

Exécuter la réorganisation définie en P2, sans changer aucune logique.

## Opérations à effectuer (P3)

1. Créer les dossiers `src/order/`, `src/stock/`, `src/pricing/`, `src/refund/`
2. `git mv` pour chaque fichier (13 fichiers)
3. Mettre à jour les imports dans src/ (`./types` → `../types`)
4. Mettre à jour les imports dans tests/ (`../src/X` → `../src/dossier/X`)
5. Vérifier qu'aucun `.ts` ne reste dans src/ (sauf types.ts)
6. `vitest run` — 123 tests doivent passer

## Contraintes

- ❌ Aucune logique modifiée
- ❌ Aucun test modifié (sauf imports)
- ✅ `git mv` pour préserver l'historique
- ✅ 123 tests verts après

## Condition de passage

- [x] 4 dossiers créés
- [x] 13 fichiers déplacés
- [x] Imports mis à jour (src/ + tests/)
- [x] Aucun fichier orphelin dans src/
- [x] 123 tests passent
