# Dry runs — Cycle 2 : Remboursement partiel (Phase Moldable)

> Scénarios déroulés pas à pas pour valider le modèle avant génération de code.

## Scénario A — Nominal (retrait d'un article)

**Commande initiale :** {A:50€, B:30€, C:20€}, promo -10%, total payé = 90€

| Étape | Action | État |
|-------|--------|------|
| 1 | Vérifier `state === 'paid'` (I16) | ✅ |
| 2 | Vérifier B existe dans items (S9) | ✅ |
| 3 | remaining = [{A:50}, {C:20}] | subtotal = 70€ |
| 4 | Recalculer promos (order.createdAt) : 70 × 10% | discount = 7€ |
| 5 | Nouveau total : 70 - 7 | **63€** |
| 6 | I17 : refund = 90 - 63 = 27€ ≥ 0 | ✅ |
| 7 | I14 : 2 items ≥ 1 | ✅ partielle |
| 8 | release('res-2') | Stock B +1 |
| 9 | Refund R1 : {oldTotal:90, newTotal:63, amount:27} | — |
| 10 | Update order | items=[A,C], total=63, refunds=[R1] |

## Scénario B — Annulations successives

**Départ :** état final Scénario A (items={A,C}, total=63€, refunds=[R1:27€])

| Étape | Action | État |
|-------|--------|------|
| 1 | remaining = [{A:50}] | subtotal = 50€ |
| 2 | Promos : 50 × 10% | discount = 5€ |
| 3 | Nouveau total : 50 - 5 | **45€** |
| 4 | I17 : 63 - 45 = 18€ ≥ 0 | ✅ |
| 5 | I14 : 1 item ≥ 1 | ✅ |
| 6 | release('res-3') | Stock C +1 |
| 7 | Refund R2 : {oldTotal:63, newTotal:45, amount:18} | — |
| 8 | Update order | items=[A], total=45, refunds=[R1, R2] |

**Vérification cumul (I18) :**
- R1 = 27€, R2 = 18€, cumul = **45€**
- Original (90) - final (45) = **45€** ✅

## Scénario C — Remboursement négatif (I17)

**Commande initiale :** {A:100€, B:10€}, promo "-50€ si total > 100€", total payé = 60€

| Étape | Action | État |
|-------|--------|------|
| 1 | remaining = [{A:100}] | subtotal = 100€ |
| 2 | Condition promo : 100 > 100 ? | ❌ promo ne s'applique plus |
| 3 | Nouveau total (sans discount) | **100€** |
| 4 | I17 : 60 - 100 = -40€ < 0 | ❌ **REFUSÉ** |
| 5 | Return `err(RefundNegativeError)` | Commande inchangée |

**Note :** Avec nos types de promos actuels (percentage, fixed_amount), I17 ne se déclenche jamais. C'est un garde défensif pour des promos conditionnelles futures.
