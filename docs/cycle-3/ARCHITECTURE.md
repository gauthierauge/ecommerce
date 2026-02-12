# Architecture — Cycle 3 : Modification de quantité (Phase Modèle)

> Architecture figée avant la génération de code.
> Étend les cycles 1 (11 composants) et 2 (2 composants) avec 1 nouveau composant et 2 modifications.

## Nouveau fichier

```
src/
├── quantity-modifier.ts              # Orchestrateur modification de quantité (I19-I23)
tests/
├── quantity-modifier.test.ts
```

## Fichiers cycle 1 modifiés

### `types.ts` — Ajout à l'interface

```typescript
interface IStockManager {
  // ... méthodes existantes ...
  adjustReservation(reservationId: string, newQuantity: number): Result<Reservation, InsufficientStockError>;
}
```

### `stock-manager.ts` — Nouvelle méthode

```typescript
adjustReservation(reservationId, newQuantity):
  - Vérifie que la réservation existe
  - Vérifie newQuantity > 0 et newQuantity <= existing.quantity
  - Remplace l'entrée dans la Map (opération atomique)
  - Retourne la nouvelle Reservation
```

**Première modification de code cycle 1.** Justifiée par H10 : l'atomicité de l'ajustement est impossible avec les méthodes existantes (release+reserve non atomique).

## Responsabilités par composant

### `quantity-modifier.ts`
- **Responsabilité :** Orchestrer le workflow de modification de quantité. Séquenceur sans logique métier.
- **Input :** order, productId, newQuantity, promotions, deps
- **Output :** `Result<{ order: Order, refund: Refund }, Error>`
- **Invariants :** I19, I20, I22 (via delegation)

### `stock-manager.adjustReservation()`
- **Responsabilité :** Ajuster atomiquement une réservation existante.
- **Input :** reservationId, newQuantity
- **Output :** `Result<Reservation, InsufficientStockError>`
- **Invariants :** I19, I20, I21, I23

## Mapping invariant → composant

| Invariant | Composant |
|-----------|-----------|
| I19 — Baisse uniquement | quantity-modifier (validation) + stock-manager (rejet newQty > oldQty) |
| I20 — Quantité ≥ 1 | quantity-modifier (validation) + stock-manager (rejet newQty ≤ 0) |
| I21 — Ajustement atomique | stock-manager.adjustReservation (Map.set unique) |
| I22 — Refund cascade promos | refund-calculator (réutilisé tel quel) |
| I23 — Réservation reflète nouvelle qté | stock-manager.adjustReservation (retourne nouvelle Reservation) |

## Séquence du workflow

```
quantity-modifier
  │
  ├── 1. Vérifier order.state === 'paid'              (I16 réutilisé)
  ├── 2. Vérifier que l'article existe
  ├── 3. Vérifier newQty < oldQty (I19) et newQty ≥ 1 (I20)
  │
  ├── 4. remainingItems = items.map(adjust quantity)
  │
  ├── 5. refund-calculator(order, remaining, promos)
  │      ├─ subtotal = calculateTotal(remaining, [])
  │      ├─ discounts = applyPromotions(remaining, promos, order.createdAt, subtotal)
  │      ├─ newTotal = calculateTotal(remaining, discounts)
  │      ├─ refundAmount = order.total - newTotal      (I22)
  │      └─ Vérifier refundAmount ≥ 0                  (I17)
  │
  ├── 6. stockManager.adjustReservation(resId, newQty) (I21, I23)
  ├── 7. Créer Refund {removedItems: [{qty: delta}]}   (I18)
  └── 8. Retourner order mis à jour
```
