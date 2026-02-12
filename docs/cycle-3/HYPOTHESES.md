# Hypothèses — Cycle 3 : Modification de quantité (Phase Hypothèse)

> Hypothèses formulées et évaluées lors de la Phase 2 — Hypothèse (Chaîne Rouge, Cycle 3).

## Récapitulatif

| # | Affirmation | Verdict |
|---|-------------|---------|
| H10 | `adjustReservation(id, newQty)` est préférable à release+reserve (atomicité) | ✅ Validée |
| H11 | Le refund-calculator du cycle 2 peut être réutilisé tel quel | ✅ Validée |
| H12 | Nouveau fichier `quantity-modifier.ts` plutôt qu'extension du handler cycle 2 | ✅ Option A retenue |

---

## H10 — Ajustement atomique

**Affirmation :** "`adjustReservation(id, newQty)` est préférable à `release()` + `reserve()` car l'opération est atomique par construction. Pas de fenêtre où le stock est temporairement disponible."

**Verdict : ✅ VALIDÉE**

**Argument :** `getAvailableStock()` calcule `total - somme(reservations)`. Avec release+reserve :
1. `release(id)` supprime la réservation → stock dispo augmente temporairement
2. `reserve(productId, newQty)` → un autre appelant pourrait prendre ce stock entre les deux

Avec `adjustReservation` : une seule opération `Map.set()` sur la Map interne, le stock dispo ne fluctue jamais de façon transitoire.

**Impact :** Ajouter `adjustReservation` à `IStockManager` et l'implémenter dans `StockManager`.

---

## H11 — Réutilisation du refund-calculator

**Affirmation :** "Le refund-calculator du cycle 2 peut être réutilisé tel quel. On lui passe les items avec quantités modifiées, il recalcule le total et le remboursement."

**Verdict : ✅ VALIDÉE**

**Argument :** `calculateRefund` prend `(order, remainingItems, promotions, deps)`. Pour une modification de quantité de 3→1 sur l'article A :
- On construit `remainingItems` avec `{ productId: 'A', quantity: 1, unitPrice: 50 }` au lieu de `quantity: 3`
- Le calculator recalcule `subtotal → promos → newTotal → refundAmount`
- Aucune modification nécessaire

Le quantity-modifier construit le bon tableau `remainingItems` avant d'appeler le calculator. Même pattern que `partial-cancellation-handler`.

**Impact :** Zéro modification sur `refund-calculator.ts`.

---

## H12 — Nouveau fichier vs extension du handler cycle 2

**Affirmation :** "Un nouveau fichier `quantity-modifier.ts` est préférable à étendre `partial-cancellation-handler.ts`."

**Verdict : ✅ Option A retenue**

**Argument :**

| Critère | A (Nouveau fichier) | B (Extension handler) |
|---------|:-:|:-:|
| SRP | ✅ | ❌ deux raisons de changer |
| Limite 200 lignes | ✅ handler à 138 | ⚠️ dépasserait 190+ |
| Tests isolés | ✅ | ⚠️ tests mélangés |
| Régression cycle 2 | ✅ aucune | ⚠️ risque |
| DRY | ⚠️ ~10 lignes dupliquées | ✅ |

La duplication (~10 lignes de wiring : vérif état, appel calculator, création Refund) est structurelle, pas accidentelle. Les deux workflows ont des validations différentes :
- Retrait : `items.filter(...)`, vérif existence
- Quantité : `items.map(...)`, vérif `newQty < oldQty && newQty >= 1`
