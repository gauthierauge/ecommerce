# Phase 6 — Modèle (Model Centric)

> Chaîne Rouge 🔴 | Minimum 1 prompt | Pas de code

## Objectif

Stabiliser et figer l'architecture avant de passer au code.
Ce qui sort de cette phase est le CONTRAT qui guide toute la chaîne bleue.

## Ce que cette phase doit produire

### 1. Structure de fichiers complète

```
ecommerce-workflow/
├── src/
│   ├── order-state-machine.ts
│   ├── stock-reservation.ts
│   ├── promotion-engine.ts
│   ├── total-calculator.ts
│   ├── order-orchestrator.ts
│   ├── payment-handler.ts
│   ├── reservation-expiry-handler.ts
│   ├── abandoned-cart.ts
│   └── types.ts
├── tests/
│   ├── order-state-machine.test.ts
│   ├── stock-reservation.test.ts
│   ├── promotion-engine.test.ts
│   ├── total-calculator.test.ts
│   ├── order-orchestrator.test.ts
│   └── ...
└── ...
```

⚠️ Cette structure est une SUGGESTION. Elle doit être ajustée en fonction
des phases précédentes (hypothèses validées, exploration, cas limites).

### 2. Responsabilités de chaque composant

Pour chaque fichier dans `src/`, documenter :
- Sa responsabilité unique (SRP)
- Ses inputs/outputs (contrat d'interface)
- Ses dépendances (quels autres composants il utilise)
- Quels invariants il garantit

### 3. Invariants codifiés

Mapper chaque invariant de `docs/INVARIANTS.md` au composant qui le garantit :

| Invariant | Composant responsable |
|-----------|----------------------|
| Pas de survente | `stock-reservation.ts` |
| Transitions valides uniquement | `order-state-machine.ts` |
| Promos incompatibles gérées | `promotion-engine.ts` |
| Total = source unique de vérité | `total-calculator.ts` |
| ... | ... |

## Livrable

Remplir `docs/ARCHITECTURE.md` avec les résultats.

## Rappels

- ❌ Toujours pas de code TypeScript
- ✅ Signatures de types/interfaces OK (c'est du modèle, pas du code)
- ✅ Ce document est la référence pour toute la chaîne bleue
- ✅ Chaque prompt de génération (phase 7) DOIT référencer ce document

## Condition de passage

- [ ] Structure de fichiers complète
- [ ] Responsabilités documentées par composant
- [ ] Invariants mappés aux composants
- [ ] `docs/ARCHITECTURE.md` rempli
- [ ] Validation explicite de l'utilisateur
- [ ] ➡️ FIN DE LA CHAÎNE ROUGE — on peut coder
