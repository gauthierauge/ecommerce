# Invariants du Cycle 3 — Modification de quantité

> Ce document est rempli lors de la Phase 1 — Décision (Chaîne Rouge, Cycle 3).
> Il étend les invariants des cycles 1 (I1-I12) et 2 (I13-I18) avec les règles spécifiques à la modification de quantité.

## Nouveaux invariants (I19-I23)

| # | Règle | Exemple de violation | Gravité |
|---|-------|---------------------|---------|
| **I19** | **Quantité uniquement en baisse** : on ne peut que diminuer la quantité d'un article dans une commande payée. Augmenter nécessiterait un flux de paiement complémentaire (hors périmètre). | Le client passe A de 2 à 5 → il devrait payer la différence, mais aucun flux de surcharge n'existe. | Bloquant |
| **I20** | **Nouvelle quantité ≥ 1** : si la quantité cible est 0, c'est un retrait d'article complet → déléguer au cycle 2 (`partial-cancellation-handler`). | Le client passe A de 3 à 0 via quantity-modifier → l'article disparaît sans passer par le workflow d'annulation partielle (pas de I14 check). | Bloquant |
| **I21** | **Ajustement atomique du stock** : libérer exactement le delta (ancienne qté - nouvelle qté) en une seule opération, sans fenêtre transitoire où le stock est temporairement disponible. | `release()` puis `reserve()` : entre les deux, un autre appelant réserve le stock libéré → survente. | Bloquant |
| **I22** | **Remboursement recalculé avec promos en cascade** : le refund est la différence entre l'ancien total payé et le nouveau total recalculé sur les items avec quantités modifiées. Même principe que I13 du cycle 2. | Commande 162€ (promo -10%). Diminution qté A de 3→1. Refund naïf = 100€ (2×50€), mais nouveau total = 72€ (80-8 promo), refund correct = 90€. | Bloquant |
| **I23** | **Réservation reflète la nouvelle quantité** : après modification, la réservation de l'article dans le stock-manager doit porter la quantité mise à jour. | Qty A passe de 3 à 1 mais la réservation garde qty:3 → le stock calculé est faux, 2 unités "fantômes" réservées. | Bloquant |

## Impact sur les composants des cycles précédents

| Fichier | Impact |
|---------|--------|
| `types.ts` | Ajout de `adjustReservation()` à l'interface `IStockManager` |
| `stock-manager.ts` | Implémentation de `adjustReservation(id, newQty)` — première modification de code cycle 1 |
| `order-state-machine.ts` | Aucun changement. La commande reste en `paid` après modification. |
| `refund-calculator.ts` | Aucun changement. Réutilisé tel quel (H11). |
| `partial-cancellation-handler.ts` | Aucun changement. Responsabilité distincte (SRP, H12). |
| `promotion-engine.ts` | Aucun changement. |
| `total-calculator.ts` | Aucun changement. |

## Nouveau composant

| Fichier | Responsabilité |
|---------|---------------|
| `quantity-modifier.ts` | Orchestre le workflow de modification de quantité : valide la demande (I19, I20), construit remainingItems, appelle refund-calculator (I22), ajuste le stock (I21, I23), produit un Refund (I18). |

## Périmètre

### Inclus (IN)

- Diminuer la quantité d'un article dans une commande `paid`
- Ajustement atomique de la réservation (delta uniquement)
- Recalcul du total avec promos en cascade
- Remboursement de la différence (réutilisation de `refund-calculator`)
- Traçabilité dans `order.refunds[]`

### Hors périmètre (OUT)

- Augmentation de quantité (nécessiterait paiement complémentaire)
- Modification depuis un état autre que `paid`
- Modification de quantité + retrait d'article dans la même opération
- Modification du `unitPrice` (prix figé à la création)

## Critères de réussite

| # | Critère | Vérification |
|---|---------|-------------|
| **C13** | Diminuer qté de 3→1 : stock libéré de 2, réservation mise à jour à 1 | Test unitaire |
| **C14** | Diminuer qté avec promo % : refund = ancien total - nouveau total recalculé | Test unitaire avec promos |
| **C15** | Diminuer qté à 0 → erreur (renvoyer vers retrait article cycle 2) | Test unitaire |
| **C16** | Augmenter qté → erreur explicite (I19) | Test unitaire |
| **C17** | `adjustReservation` sur réservation inexistante → erreur | Test unitaire |
| **C18** | Tests existants (109) toujours verts après modification de `stock-manager` | `vitest run` |
