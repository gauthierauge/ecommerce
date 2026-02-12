# Phase 8 — Specific Coding

> Chaîne Bleue 🔵 | Minimum 2 prompts

## Objectif

Relire le code généré en phase 7 et identifier les problèmes.
C'est TOI qui reprends la main sur le code, pas l'IA.

## Ce que cette phase doit produire

### 1. Analyse des décisions implicites

Demander à l'IA : "Quelles décisions as-tu prises implicitement dans
le code généré ? Quelles alternatives existaient ?"

Chercher notamment :
- Des choix de types qui pourraient être plus stricts
- Des cas limites non gérés (quantité 0 ? prix négatif ? promo à 100% ?)
- Des invariants de `docs/INVARIANTS.md` non respectés dans le code
- Des couplages cachés entre composants

### 2. Minimum 3 corrections

Identifier au moins 3 corrections à effectuer :
- Cas limites manquants
- Invariants non respectés
- Choix implicites à rendre explicites
- Code mort ou inutile

Pour chaque correction :
1. Identifier le problème
2. Expliquer pourquoi c'est un problème (référencer les invariants)
3. Effectuer la correction (manuellement ou par prompt précis)
4. Documenter dans PROMPTS.md

### 3. Si aucune correction n'est nécessaire

L'énoncé dit "s'il n'y en a pas, tant mieux". Mais c'est peu probable
sur du code généré. Cherche bien. Le barème "esprit critique" évalue
ta capacité à trouver des problèmes.

## Rappels

- ✅ C'est la phase où tu montres que tu ne fais pas confiance aveuglément à l'IA
- ✅ Chaque correction = points sur "esprit critique" (/6)
- ✅ Documenter les corrections dans PROMPTS.md avec le raisonnement

## Condition de passage

- [ ] Décisions implicites identifiées
- [ ] Au moins 3 corrections documentées
- [ ] Corrections appliquées, tests toujours verts
- [ ] Validation explicite de l'utilisateur
