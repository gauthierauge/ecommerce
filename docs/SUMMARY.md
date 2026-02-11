# Résumé du projet — Workflow Commande E-commerce

## Contexte

Système de gestion de commandes e-commerce en **TypeScript pur** (domaine uniquement, sans framework web ni base de données). Développé en suivant la méthodologie **Chaîne Rouge / Chaîne Bleue** (Wardley Map) avec **TDD** (Vitest).

## Méthodologie

### Chaîne Rouge — Penser avant de produire (P1 → P12)

| Phase | Prompts | Livrable |
|-------|---------|----------|
| 1. Décision | P1, P2 | 12 invariants (I1-I12), périmètre, critères C1-C6 |
| 2. Hypothèse | P3, P4 | 5 hypothèses validées (H1-H5) |
| 3. Exploration | P5, P6 | Comparaison d'architectures, choix justifiés |
| 4. Conversation | P7, P8 | 6 cas limites (S1-S6), ajout `cancelled`, I11, I12 |
| 5. Moldable | P9, P10 | Machine à états complète, dry runs |
| 6. Modèle | P11, P12 | Architecture finale à 11 composants |

### Chaîne Bleue — Produire avec rigueur (P13 → P23)

| Phase | Prompts | Livrable |
|-------|---------|----------|
| 7. Génération | P13, P14, P15, P16 | 7 composants + 63 tests |
| 8. Specific Coding | P17, P18 | 4 corrections (ID, orderId, cascade, subtotal) |
| 9. Composable | P19, P20 | Interface IStockManager, indépendance vérifiée |
| 10. System | P21, P22, P23 | 3 handlers + orchestrateur + vérification finale |

**Total : 23 prompts** (12 rouge + 11 bleu, minimum requis : 20)

## Architecture

```
src/
├── types.ts                 # Types, interfaces, Result<T,E>, erreurs (132 lignes)
├── cart-validator.ts        # Validation panier : I6, I9 (25 lignes)
├── order-state-machine.ts   # Table déclarative des transitions : I2 (25 lignes)
├── stock-manager.ts         # Réservation par tokens : I1 (61 lignes)
├── promotion-engine.ts      # Promos en cascade : I12 (34 lignes)
├── compatibility-checker.ts # Matrice d'incompatibilité : I3 (18 lignes)
├── total-calculator.ts      # Calcul total ≥ 0 : I7 (13 lignes)
├── payment-handler.ts       # Paiement + vérif expiration : I5, I8 (31 lignes)
├── expiration-checker.ts    # Libération stock expiré : I4 (34 lignes)
├── abandoned-cart.ts        # Détection paniers > 24h : I10 (22 lignes)
└── order-orchestrator.ts    # Séquencement sans logique métier : I11 (96 lignes)
```

**Principes appliqués :** SOLID, DRY, KISS, YAGNI, injection de dépendances, aucun fichier > 200 lignes.

## Invariants

| # | Règle | Composant responsable | Couvert par test |
|---|-------|-----------------------|------------------|
| I1 | Pas de survente | stock-manager | ✅ |
| I2 | Transitions ordonnées | order-state-machine | ✅ |
| I3 | Promos incompatibles | compatibility-checker | ✅ |
| I4 | Libération stock si expiration | expiration-checker | ✅ |
| I5 | Paiement tardif rejeté | payment-handler | ✅ |
| I6 | Panier non vide | cart-validator | ✅ |
| I7 | Montant ≥ 0 | total-calculator | ✅ |
| I8 | Idempotence | payment-handler + state machine | ✅ |
| I9 | Quantités positives | cart-validator | ✅ |
| I10 | Relance paniers abandonnés | abandoned-cart | ✅ |
| I11 | Unicité commande/panier | order-orchestrator | ✅ |
| I12 | Validité temporelle promos | promotion-engine | ✅ |

## Cas limites

| # | Scénario | Couvert par test |
|---|----------|------------------|
| S1 | Double-click paiement | ✅ payment-handler + orchestrator |
| S2 | Paiement après expiration réservation | ✅ payment-handler |
| S3 | Annulation après paiement | ✅ state machine (paid → cancelled) |
| S4 | Panier abandonné, stock épuisé | ✅ abandoned-cart (relance = signal) |
| S5 | Promo expirée entre ajout et commande | ✅ promotion-engine |
| S6 | Modification panier pendant checkout | ✅ orchestrator (snapshot immutable) |

## Tests et couverture

- **10 fichiers de test**, **88 tests**, tous verts
- Coverage :

| Métrique | Résultat |
|----------|----------|
| Statements | 99.18% |
| Branches | 100% |
| Functions | 94.44% |
| Lines | 99.18% |

## Critères de réussite

| # | Critère | Statut |
|---|---------|--------|
| C1 | `vitest run` passe à 100% | ✅ 88/88 |
| C2 | Deux réservations concurrentes, une seule réussit | ✅ |
| C3 | Promos incompatibles refusées | ✅ |
| C4 | Transition created → shipped impossible | ✅ |
| C5 | Paiement après expiration rejeté | ✅ |
| C6 | Coverage ≥ 80% | ✅ (99%+) |

## Décisions techniques notables

1. **Machine à états déclarative** — table `Record<State, State[]>` sans side effects
2. **Tokens de réservation** (pas de simple compteur) — chaque réservation a un ID, orderId, expiresAt
3. **Promotions en cascade** — chaque promo s'applique sur le restant, pas sur le brut
4. **Result<T, E>** — gestion d'erreurs explicite sans exceptions
5. **IStockManager** — interface injectable pour découplage
6. **Orchestrateur pur séquenceur** — aucune logique métier, rollback sur échec partiel
7. **Snapshot immutable du panier** — deep copy à la création de commande (S6)