# Phase 1 — Décision

> Chaîne Rouge 🔴 | Minimum 2 prompts | Pas de code

## Objectif

Clarifier le besoin, définir les invariants critiques, poser le périmètre exact
et les critères de réussite du projet.

## Ce que cette phase doit produire

1. **Liste des invariants critiques** : les règles qui ne doivent JAMAIS être violées
   - Stock atomique (pas de survente)
   - Transitions d'état valides uniquement
   - Promotions incompatibles gérées
   - Cohérence stock/paiement/expiration
2. **Périmètre exact** : ce qui est inclus vs hors périmètre
3. **Critères de réussite mesurables**

## Livrable

Remplir `docs/INVARIANTS.md` avec les résultats.

## Rappels

- ❌ Aucun code, aucune architecture, aucune solution technique
- ✅ Uniquement de la clarification, des questions, des contraintes
- Le prof évalue si tu as identifié les complexités cachées de l'énoncé :
  - Promotion incompatible avec une autre
  - Stock réservé atomiquement
  - Paiement validé après expiration du stock réservé
  - Transitions d'état avec règles métier

## Condition de passage à la phase suivante

- [ ] Invariants critiques listés et validés
- [ ] Périmètre in/out défini
- [ ] Critères de réussite posés
- [ ] `docs/INVARIANTS.md` rempli
- [ ] Validation explicite de l'utilisateur
