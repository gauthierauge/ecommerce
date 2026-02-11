# Exploration — Cycle 2 : Remboursement partiel (Phase Exploration)

> Comparaison d'approches architecturales lors de la Phase 3 — Exploration (Chaîne Rouge, Cycle 2).

## Sujet : Architecture du refund-calculator

### 3 approches comparées

#### A — Fonction pure (retenue ✅)

```
calculateRefund(order, itemsToRemove, promos, deps) → Result<RefundResult, Error>
```

- Pas d'effet de bord, pas d'état
- Le handler met à jour la commande après
- Reproduit le pattern `total-calculator` / `order-orchestrator` du cycle 1

#### B — Méthode sur l'Order (rejetée ❌)

```
order.removeItems(itemsToRemove) → Refund
```

- L'Order doit connaître promotion-engine et total-calculator → couplage fort
- Order devient une classe mutable au lieu d'une interface POJO
- Contredit H9 (calculator sans état) et le pattern cycle 1

#### C — Service avec état (rejeté ❌)

```
new RefundService(deps).processRefund(order, items) → Result<Refund, Error>
```

- Double source de vérité : état interne du service vs `order.refunds[]`
- Sur-ingénierie (YAGNI) pour un calcul qui est naturellement sans état
- Contredit H9

### Grille de comparaison

| Critère | A (Fonction pure) | B (Méthode Order) | C (Service état) |
|---------|:-:|:-:|:-:|
| I13 calcul correct | ✅ | ⚠️ couplage | ✅ |
| I18 annulations successives | ✅ | ⚠️ mutation | ⚠️ double source |
| H9 calculator sans état | ✅ | ❌ | ❌ |
| Pattern cycle 1 | ✅ | ❌ | ❌ |
| Testabilité | ✅ | ⚠️ | ⚠️ |
| KISS/YAGNI | ✅ | ✅ | ❌ |

### Décision

**Approche A retenue.** Seule approche cohérente avec tous les critères, les hypothèses validées (H9), et le pattern architectural du cycle 1. La séparation `refund-calculator` (calcul pur) / `partial-cancellation-handler` (séquencement + effets de bord) est isomorphe au pattern `total-calculator` / `order-orchestrator`.