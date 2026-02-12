# Workflow Commande E-commerce

Système de gestion de commandes en **TypeScript pur** (domaine uniquement, sans framework web ni base de données).
Développé avec la méthodologie **Wardley Map** (Chaîne Rouge / Chaîne Bleue) et **TDD** (Vitest).

## Quick start

```bash
npm install
npx vitest run            # 123 tests
npx vitest run --coverage # coverage 99%+
```

## Structure du projet

```
src/
├── types.ts                              # Types, interfaces, Result<T,E>, erreurs
├── order/                                # Workflow commande (cycle 1)
│   ├── order-orchestrator.ts             #   Séquencement création commande : I11
│   ├── order-state-machine.ts            #   Table déclarative des transitions : I2
│   ├── cart-validator.ts                 #   Validation panier : I6, I9
│   ├── payment-handler.ts               #   Paiement + vérif expiration : I5, I8
│   └── abandoned-cart.ts                #   Détection paniers > 24h : I10
├── stock/                                # Stock & réservation
│   ├── stock-manager.ts                  #   Réservation par tokens + adjustReservation : I1, I4, I21
│   └── expiration-checker.ts             #   Libération stock expiré : I4
├── pricing/                              # Promos & calculs
│   ├── promotion-engine.ts               #   Promos en cascade (%, fixe) : I12
│   ├── compatibility-checker.ts          #   Matrice d'incompatibilité : I3
│   └── total-calculator.ts              #   Calcul total ≥ 0 : I7
└── refund/                               # Remboursement (cycles 2+3)
    ├── refund-calculator.ts              #   Calcul remboursement partiel : I13, I17
    ├── partial-cancellation-handler.ts   #   Orchestration annulation partielle : I14-I16, I18
    └── quantity-modifier.ts              #   Modification de quantité : I19-I23

tests/
├── [14 fichiers de tests unitaires]      # 1 par composant
└── e2e-workflow.test.ts                  # 4 scénarios d'intégration bout en bout
```

## Cycles de développement

### Cycle 1 — Workflow complet

23 prompts (12 rouge + 11 bleu) | 88 tests | Invariants I1-I12

Panier → commande → promotions → stock → paiement → préparation → expédition.
Machine à états, réservation atomique, promos incompatibles, expiration, paniers abandonnés.

### Cycle 2 — Remboursement partiel à l'annulation

12 prompts (7 rouge + 5 bleu) | 21 tests | Invariants I13-I18

Retirer des articles d'une commande payée, recalculer avec promos en cascade, rembourser la différence.
**Aucun composant du cycle 1 modifié** — seul `types.ts` étendu (champ optionnel `refunds?`).

### Cycle 3 — Modification de quantité

8 prompts (5 rouge + 3 bleu) | 14 tests | Invariants I19-I23

Diminuer la quantité d'un article dans une commande payée, ajustement atomique de la réservation, recalcul avec promos en cascade.
**Première modification de composants cycle 1** : `stock-manager.ts` (`adjustReservation`) et `types.ts` (`IStockManager`).

### Cycle 4 — Réorganisation par domaine métier

3 prompts (2 rouge + 1 bleu) | 0 test ajouté | Refactoring pur

Réorganisation de `src/` en 4 sous-dossiers (`order/`, `stock/`, `pricing/`, `refund/`).
Justifié par le seuil YAGNI atteint (14 fichiers, 4 domaines). **0 logique modifiée**, 123 tests toujours verts.

### Tests e2e

4 scénarios assemblant tous les composants réels (pas de mocks) :
workflow nominal, paiement expiré, annulation partielle, annulation + expédition.

## Journaux de prompts

| Fichier | Contenu |
|---------|---------|
| `PROMPTS.md` | Cycle 1 — 23 prompts documentés avec résumé et décision |
| `PROMPTS-cycle_2.md` | Cycle 2 — 12 prompts documentés avec résumé et décision |
| `PROMPTS-cycle_3.md` | Cycle 3 — 8 prompts documentés avec résumé et décision |
| `PROMPTS-cycle_4.md` | Cycle 4 — 3 prompts documentés avec résumé et décision |

## Chiffres clés

| Métrique | Valeur |
|----------|--------|
| Tests | 123 (119 unitaires + 4 e2e) |
| Coverage | 99.54% stmts, 98.41% branches |
| Invariants | 23 (I1-I23) |
| Cas limites | 11 (S1-S11) |
| Composants | 15 fichiers src/ (4 dossiers) |
| Fichier max | 190 lignes (limite : 200) |
| Prompts | 46 (26 rouge + 20 bleu) |

## Documentation par cycle

| Cycle | Résumé | Contexte phases |
|-------|--------|-----------------|
| Cycle 1 | `docs/cycle-1/SUMMARY.md` | `.claude/context/cycle-1/` (10 phases) |
| Cycle 2 | `docs/cycle-2/SUMMARY.md` | `.claude/context/cycle-2/` (10 phases) |
| Cycle 3 | `docs/cycle-3/SUMMARY.md` | `.claude/context/cycle-3/` (10 phases) |
| Cycle 4 | `docs/cycle-4/SUMMARY.md` | `.claude/context/cycle-4/` (10 phases) |

## Règles du projet

Voir `docs/rules/README.md` — 9 fichiers de règles couvrant :
chaîne rouge, chaîne bleue, anti-hallucination, reformulation,
structure de prompt, minimum 2 prompts, pros/cons, chain-of-thought,
contraintes code/tests.

## Stack

**TypeScript** + **Vitest** — domaine pur, pas de Express/React/API/DB.
Principes : SOLID, DRY, KISS, YAGNI, injection de dépendances, micro-outils composables.
