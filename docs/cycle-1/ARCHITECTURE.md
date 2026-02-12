# Architecture du système

> Ce document est rempli lors de la Phase 6 — Modèle (Chaîne Rouge).
> Il fige l'architecture avant la génération de code.
> Aucun code ne doit être écrit avant que ce document soit validé.

## Structure de fichiers

```
ecommerce/
├── src/
│   ├── types.ts                      # Types et interfaces partagés
│   ├── cart-validator.ts             # Validation du panier (I6, I9)
│   ├── order-state-machine.ts        # Machine à états (table déclarative)
│   ├── stock-manager.ts              # Réservation de stock (tokens)
│   ├── promotion-engine.ts           # Moteur de promotions (strategy)
│   ├── compatibility-checker.ts      # Matrice de compatibilité des promos
│   ├── total-calculator.ts           # Calculateur de total (source unique)
│   ├── payment-handler.ts            # Handler de paiement
│   ├── expiration-checker.ts         # Nettoyage des réservations expirées
│   ├── abandoned-cart.ts             # Détection et relance paniers abandonnés
│   └── order-orchestrator.ts         # Orchestrateur central (aucune logique métier)
├── tests/
│   ├── cart-validator.test.ts
│   ├── order-state-machine.test.ts
│   ├── stock-manager.test.ts
│   ├── promotion-engine.test.ts
│   ├── compatibility-checker.test.ts
│   ├── total-calculator.test.ts
│   ├── payment-handler.test.ts
│   ├── expiration-checker.test.ts
│   ├── abandoned-cart.test.ts
│   └── order-orchestrator.test.ts
└── docs/
    ├── INVARIANTS.md
    ├── HYPOTHESES.md
    ├── EXPLORATION.md
    ├── EDGE_CASES.md
    ├── STATE_MACHINE.md
    ├── ARCHITECTURE.md
    └── STACK.md
```

Contrainte : aucun fichier > 200 lignes.

## Responsabilités par composant

### `types.ts`
- **Responsabilité :** Définir tous les types, interfaces et enums partagés
- **Inputs/Outputs :** Aucun — définition pure
- **Dépendances :** Aucune
- **Contenu :** `OrderState`, `CartItem`, `Order`, `Reservation`, `Promotion`, `Discount`, `Result<T, E>`, erreurs typées

### `cart-validator.ts`
- **Responsabilité :** Valider qu'un panier est prêt à être transformé en commande. Logique métier de validation extraite de l'orchestrateur.
- **Input :** panier
- **Output :** `Result<void, CartValidationError>`
- **Dépendances :** `types.ts`
- **Invariants garantis :** I6 (panier non vide), I9 (quantités ≥ 1)

### `order-state-machine.ts`
- **Responsabilité :** Valider les transitions d'état. Table déclarative `état → [états suivants]`. Aucun effet de bord.
- **Input :** état actuel + état cible
- **Output :** `Result<OrderState, InvalidTransitionError>`
- **Dépendances :** `types.ts`

### `stock-manager.ts`
- **Responsabilité :** Gérer le stock via tokens de réservation. Réserver atomiquement (synchrone), libérer, calculer le stock disponible.
- **Input :** `productId`, `quantity`, `expiresAt`
- **Output :** `Result<Reservation, InsufficientStockError>`
- **Dépendances :** `types.ts`

### `promotion-engine.ts`
- **Responsabilité :** Appliquer les promotions (strategy pattern). Chaque type de promo est une fonction `(cart) → Discount`. Vérifie la validité temporelle (I12).
- **Input :** panier (snapshot immutable) + liste de promos à appliquer
- **Output :** `Discount[]`
- **Dépendances :** `types.ts`, `compatibility-checker.ts`

### `compatibility-checker.ts`
- **Responsabilité :** Vérifier les incompatibilités entre promotions via la matrice statique (H2).
- **Input :** liste de promos à appliquer
- **Output :** `Result<void, IncompatiblePromotionsError>`
- **Dépendances :** `types.ts`

### `total-calculator.ts`
- **Responsabilité :** Calculer le total final. Source unique de vérité (H3). Garantit montant ≥ 0 (I7).
- **Input :** panier (snapshot) + `Discount[]`
- **Output :** `number` (total ≥ 0)
- **Dépendances :** `types.ts`

### `payment-handler.ts`
- **Responsabilité :** Traiter un paiement. Vérifie que la réservation n'a pas expiré (I5) avant d'accepter. Garantit l'idempotence (I8).
- **Input :** `orderId`, résultat de paiement (port injectable)
- **Output :** `Result<void, PaymentExpiredError | InvalidTransitionError>`
- **Dépendances :** `types.ts`, `order-state-machine.ts`, `stock-manager.ts`

### `expiration-checker.ts`
- **Responsabilité :** Parcourir les réservations actives et libérer celles dont `expiresAt` est dépassé (H5). Déclenche la transition `created → cancelled`.
- **Input :** `now` (timestamp injectable pour les tests)
- **Output :** liste de réservations libérées
- **Dépendances :** `types.ts`, `stock-manager.ts`, `order-state-machine.ts`

### `abandoned-cart.ts`
- **Responsabilité :** Détecter les paniers abandonnés (> 24h sans commande) et émettre un événement de relance. Vérifie I10 (pas de relance si commande existe) et la disponibilité du stock.
- **Input :** `now` (timestamp injectable), liste des paniers
- **Output :** liste de paniers à relancer
- **Dépendances :** `types.ts`, `stock-manager.ts`

### `order-orchestrator.ts`
- **Responsabilité :** Séquencer le workflow de création de commande. Appelle les composants dans l'ordre. **Aucune logique métier** — pas de `if`, pas de calcul. Fonctions pures chaînées.
- **Input :** panier + promos + userId
- **Output :** `Result<Order, Error>`
- **Dépendances :** Tous les composants ci-dessus (via injection de dépendances)

## Invariants codifiés

| Invariant | Composant responsable |
|---|---|
| **I1** — Pas de survente | `stock-manager.ts` (reserve atomique synchrone) |
| **I2** — Transitions ordonnées | `order-state-machine.ts` (table déclarative) |
| **I3** — Promos incompatibles | `compatibility-checker.ts` (matrice statique) |
| **I4** — Libération stock si échec/expiration | `expiration-checker.ts` + `payment-handler.ts` |
| **I5** — Paiement tardif rejeté | `payment-handler.ts` (vérification expiresAt) |
| **I6** — Panier non vide | `cart-validator.ts` |
| **I7** — Montant ≥ 0 | `total-calculator.ts` (clamp à 0) |
| **I8** — Idempotence | `payment-handler.ts` + `order-state-machine.ts` (transition paid→paid impossible) |
| **I9** — Quantités positives | `cart-validator.ts` |
| **I10** — Relance paniers abandonnés uniquement | `abandoned-cart.ts` (vérification statut panier) |
| **I11** — Unicité commande/panier | `order-orchestrator.ts` (vérification avant création) |
| **I12** — Validité temporelle des promos | `promotion-engine.ts` (vérification validFrom/validUntil) |

## Interfaces entre composants

```
Orchestrateur (order-orchestrator.ts)
  │
  ├── 1. Valide le panier ──► cart-validator.ts (I6, I9)
  ├── 2. Vérifie compatibilité promos ──► compatibility-checker.ts (I3)
  ├── 3. Calcule les réductions ──► promotion-engine.ts (I12)
  ├── 4. Calcule le total ──► total-calculator.ts (I7)
  ├── 5. Réserve le stock ──► stock-manager.ts (I1)
  ├── 6. Crée la commande (I11) en état `created`
  │
  │  ... le client paie (externe) ...
  │
  ├── 7. Paiement reçu ──► payment-handler.ts (I5, I8)
  │      └── Transition ──► order-state-machine.ts (I2)
  │
  │  ... en parallèle ...
  │
  ├── Nettoyage périodique ──► expiration-checker.ts (I4)
  │      └── Libération stock ──► stock-manager.ts
  │      └── Transition → cancelled ──► order-state-machine.ts
  │
  └── Relance paniers ──► abandoned-cart.ts (I10)
```