# Architecture — Cycle 2 : Remboursement partiel (Phase Modèle)

> Architecture figée avant la génération de code.
> Étend le cycle 1 (11 composants, 88 tests) avec 2 nouveaux composants.

## Nouveaux fichiers

```
src/
├── refund-calculator.ts              # Calcul pur du remboursement (I13, I17)
├── partial-cancellation-handler.ts   # Orchestrateur annulation partielle (I14-I16, I18)
tests/
├── refund-calculator.test.ts
├── partial-cancellation-handler.test.ts
```

## Fichier cycle 1 modifié

### `types.ts` — Ajouts uniquement

```typescript
// Nouvelle interface
interface Refund {
  id: string;
  orderId: string;
  removedItems: readonly CartItem[];
  oldTotal: number;
  newTotal: number;
  amount: number;
  createdAt: Date;
}

// Nouvelles erreurs
class RefundNegativeError extends Error { ... }
class PartialCancellationError extends Error { ... }

// Extension Order (champ optionnel)
interface Order {
  // ... champs existants ...
  refunds?: readonly Refund[];  // optionnel pour rétrocompatibilité cycle 1
}
```

**Aucun autre fichier cycle 1 modifié.**

## Responsabilités par composant

### `refund-calculator.ts`
- **Responsabilité :** Calculer le montant du remboursement. Pure fonction.
- **Input :** order, remainingItems, promotions, deps (applyPromotions, calculateTotal)
- **Output :** `Result<RefundResult, RefundNegativeError>`
- **Invariants :** I13, I17
- **Point critique :** Utilise `order.createdAt` pour le recalcul des promos (H6)

### `partial-cancellation-handler.ts`
- **Responsabilité :** Orchestrer le workflow d'annulation partielle. Séquence sans logique métier.
- **Input :** order, itemsToRemove, promotions, deps (calculateRefund, stockManager, transition)
- **Output :** `Result<{ order: Order, refund: Refund }, Error>`
- **Invariants :** I14, I15, I16, I18, S9

## Mapping invariant → composant

| Invariant | Composant |
|-----------|-----------|
| I13 — Remboursement = ancien - nouveau total | refund-calculator.ts |
| I14 — ≥ 1 item restant | partial-cancellation-handler.ts |
| I15 — Libération stock partielle | partial-cancellation-handler.ts |
| I16 — Uniquement depuis `paid` | partial-cancellation-handler.ts |
| I17 — Remboursement ≥ 0 | refund-calculator.ts |
| I18 — Historique refunds[] | partial-cancellation-handler.ts |

## Séquence du workflow

### Annulation partielle (cas normal)

```
partial-cancellation-handler
  │
  ├── 1. Vérifier order.state === 'paid'              (I16)
  ├── 2. Vérifier items à retirer existent             (S9)
  ├── 3. remainingItems = order.items \ itemsToRemove
  ├── 4. Vérifier remainingItems.length ≥ 1            (I14)
  │
  ├── 5. refund-calculator(order, remaining, promos)
  │      ├─ subtotal = calculateTotal(remaining, [])
  │      ├─ discounts = applyPromotions(remaining, promos, order.createdAt, subtotal)
  │      ├─ newTotal = calculateTotal(remaining, discounts)
  │      ├─ refundAmount = order.total - newTotal      (I13)
  │      └─ Vérifier refundAmount ≥ 0                  (I17)
  │
  ├── 6. Libérer stock items retirés                   (I15)
  ├── 7. Créer Refund                                  (I18)
  └── 8. Retourner order mis à jour
```

### Annulation totale (0 items restants → I14)

```
  ├── 4b. remainingItems.length === 0
  │       transition('paid', 'cancelled')              (I2)
  │       Libérer TOUTES les réservations
  │       Créer Refund { amount: order.total }
  │       Retourner order cancelled avec refund final
```