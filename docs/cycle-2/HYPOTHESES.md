# Hypothèses — Cycle 2 : Remboursement partiel (Phase Hypothèse)

> Hypothèses formulées et évaluées lors de la Phase 2 — Hypothèse (Chaîne Rouge, Cycle 2).

## Récapitulatif

| # | Affirmation | Verdict |
|---|-------------|---------|
| H6 | Le refund-calculator réutilise promotion-engine et total-calculator existants | ⚠️ Partiellement validée |
| H7 | Pas de nouvel état dans la machine à états | ✅ Validée |
| H8 | `stock-manager.release()` suffit pour la libération partielle | ✅ Validée |
| H9 | Le refund-calculator n'a pas besoin de l'historique des remboursements | ✅ Validée |

---

## H6 — Calcul du remboursement

**Affirmation :** "Le refund-calculator peut réutiliser promotion-engine et total-calculator existants en les appelant avec les articles restants."

**Verdict : ⚠️ PARTIELLEMENT VALIDÉE**

**Argument :** L'approche fonctionne pour le calcul (appeler `applyPromotions` + `calculateTotal` avec les items restants). Mais le paramètre `now` de `applyPromotions` pose problème : si une promo a expiré depuis la création de la commande, le recalcul l'exclut et le nouveau total peut dépasser le montant payé (violation I17).

**Correction :** Le refund-calculator doit passer `order.createdAt` (et non `now`) à `applyPromotions`. Les promos étaient valides au moment du paiement et doivent être honorées au moment du remboursement.

**Impact :** Pas de modification de `promotion-engine.ts`. Le refund-calculator passe simplement un paramètre différent.

---

## H7 — État de la commande

**Affirmation :** "L'annulation partielle ne crée pas de nouvel état. La commande reste en `paid`."

**Verdict : ✅ VALIDÉE**

**Argument :**
- L'ordre est payé et reste payé — on modifie son contenu (items, total), pas son statut
- Le workflow existant continue : `paid → prepared → shipped` ou `paid → cancelled`
- L'historique est tracé par `refunds[]` (I18), pas par un état
- Un état `partially_refunded` dupliquerait les transitions de `paid` sans bénéfice

**Impact :** Aucune modification de `order-state-machine.ts`.

---

## H8 — Libération du stock

**Affirmation :** "On peut réutiliser `stock-manager.release()` pour libérer les articles retirés."

**Verdict : ✅ VALIDÉE**

**Argument :**
- L'orchestrateur crée **une réservation par item** (boucle `for (const item of items)`)
- Mapping 1 item ↔ 1 réservation garanti
- Pour retirer un item, on fait `release(reservationId)` → libère toutes les unités de cet item
- Le problème de release partiel ne se pose pas car la modification de quantité est hors périmètre (OUT)

**Impact :** Aucune modification de `stock-manager.ts`.

---

## H9 — Annulations successives

**Affirmation :** "Le refund-calculator n'a pas besoin de connaître l'historique des remboursements précédents."

**Verdict : ✅ VALIDÉE**

**Argument :** Démonstration par trace :

| Étape | Items | Total | Retrait | Nouveau total | Remboursement |
|-------|-------|-------|---------|---------------|---------------|
| Initial | {A, B, C} | 150€ | — | — | — |
| Cancel 1 | {A, B, C} | 150€ | A | 110€ | 40€ |
| Cancel 2 | {B, C} | 110€ | B | 50€ | 60€ |
| **Cumul** | — | — | — | — | **100€** = 150 - 50 ✅ |

Le calculator est sans état : il prend l'ordre actuel et les items à retirer, recalcule. La cohérence mathématique est naturelle (somme des remboursements = total initial - total final).

**Impact :** Le refund-calculator est une pure fonction, sans dépendance à l'historique.