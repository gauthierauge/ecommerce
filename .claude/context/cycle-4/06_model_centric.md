# Phase 6 — Modèle (Cycle 4)

> Chaîne Rouge 🔴 | Condensée avec phase 4 dans P2

## Objectif

Figer la structure finale des dossiers.

## Structure figée (P2)

```
src/
├── types.ts                    # Racine — partagé par tous
├── order/                      # 5 fichiers
│   ├── order-orchestrator.ts
│   ├── order-state-machine.ts
│   ├── cart-validator.ts
│   ├── payment-handler.ts
│   └── abandoned-cart.ts
├── stock/                      # 2 fichiers
│   ├── stock-manager.ts
│   └── expiration-checker.ts
├── pricing/                    # 3 fichiers
│   ├── promotion-engine.ts
│   ├── compatibility-checker.ts
│   └── total-calculator.ts
└── refund/                     # 3 fichiers
    ├── refund-calculator.ts
    ├── partial-cancellation-handler.ts
    └── quantity-modifier.ts
```

## Mapping imports

- src/ : `./types` → `../types`
- tests/ : `../src/X` → `../src/dossier/X`

## Condition de passage

- [x] Structure figée avec chemins exacts
- [x] Imports à modifier listés
- [x] Validation explicite de l'utilisateur
