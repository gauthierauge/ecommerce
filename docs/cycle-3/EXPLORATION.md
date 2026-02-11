# Exploration — Cycle 3 : Modification de quantité (Phase Exploration)

> Comparaison d'approches architecturales lors de la Phase 2 — Exploration (Chaîne Rouge, Cycle 3).
> Condensée avec la phase Hypothèse (P2).

## Sujet : Stratégie d'ajustement du stock

### 2 approches comparées

#### A — `adjustReservation(id, newQty)` (retenue ✅)

```
stockManager.adjustReservation(reservationId, newQuantity)
→ Result<Reservation, InsufficientStockError>
```

- Opération atomique : une seule écriture `Map.set()`
- Pas de fenêtre transitoire où le stock est disponible
- Le stock-manager contrôle l'intégrité (newQty > 0, newQty <= oldQty)
- Retourne une nouvelle Reservation immutable

#### B — `release()` + `reserve()` (rejetée ❌)

```
stockManager.release(reservationId)
stockManager.reserve(productId, newQuantity, expiresAt, orderId)
```

- Non atomique : entre release et reserve, le stock est temporairement libre
- Un autre appelant pourrait réserver le stock libéré → violation I1 (survente)
- Deux opérations à gérer (rollback si le reserve échoue ?)
- Le `expiresAt` doit être re-passé (information perdue après release)

### Grille de comparaison

| Critère | A (adjustReservation) | B (release+reserve) |
|---------|:-:|:-:|
| I21 atomicité | ✅ par construction | ❌ fenêtre de vulnérabilité |
| I1 pas de survente | ✅ | ⚠️ risque entre release/reserve |
| Simplicité | ✅ 1 opération | ❌ 2 opérations + rollback |
| Reservation immutable | ✅ nouvelle instance | ✅ nouvelle instance |
| Info preservée (expiresAt) | ✅ conservée | ⚠️ doit être re-passée |

### Décision

**Approche A retenue.** L'atomicité est garantie par construction (I21). L'approche B introduit un risque de survente et de la complexité de rollback sans aucun bénéfice.
