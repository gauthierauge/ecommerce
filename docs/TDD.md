Crée docs/TDD.md avec les règles suivantes :

# Règles TDD — Red/Green/Refactor

## Cycle obligatoire pour chaque composant

### 🔴 Red — Tests d'abord
- Écrire les tests AVANT le code d'implémentation
- Les tests doivent couvrir :
    - Le cas nominal (happy path)
    - Les cas limites (edge cases)
    - Les cas d'erreur (invariants violés)
- Les tests doivent échouer (le composant n'existe pas encore)

### 🟢 Green — Code minimal
- Écrire le code MINIMUM pour faire passer les tests
- Pas d'optimisation, pas de refactoring
- Si un test passe sans code → le test est mauvais, le réécrire

### 🔵 Refactor — Améliorer
- Améliorer le code sans casser les tests
- Renommer, extraire, simplifier
- Les tests doivent toujours passer après refactoring

## Contraintes
- Framework : Vitest
- Coverage cible : 80% minimum (lines, functions, branches, statements)
- Chaque fichier src/*.ts a son fichier tests/*.test.ts
- Les tests doivent être indépendants (pas d'ordre d'exécution)
- Utiliser des données de test explicites (pas de random)

## Vérification
Après chaque composant :
- `vitest run` → tous les tests passent
- `vitest run --coverage` → vérifier la progression du coverage
