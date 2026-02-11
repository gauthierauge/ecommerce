# Invariants du Cycle 2 — Remboursement partiel à l'annulation

> Ce document est rempli lors de la Phase 1 — Décision (Chaîne Rouge, Cycle 2).
> Il étend les invariants du cycle 1 (I1-I12) avec les règles spécifiques au remboursement partiel.

## Nouveaux invariants (I13-I18)

| # | Règle | Exemple de violation | Gravité |
|---|-------|---------------------|---------|
| **I13** | **Remboursement = ancien total - nouveau total recalculé** : le montant remboursé est la différence entre le montant payé et le nouveau total après recalcul des promos sur les articles restants. Pas la somme brute des articles retirés. | Commande 100€ avec -20% (payé 80€). Retrait d'un article à 50€ → remboursement naïf = 50€, mais le nouveau total est 50€ - 20% = 40€, donc remboursement correct = 80€ - 40€ = **40€**. | Bloquant |
| **I14** | **Au moins 1 article restant** : après annulation partielle, la commande doit conserver ≥ 1 article. Si tous les articles sont retirés → annulation totale (workflow existant `paid → cancelled`). | Le client retire ses 3 articles un par un via annulation partielle → commande avec 0 articles, total = 0€ mais commande toujours en état `paid`. | Bloquant |
| **I15** | **Libération partielle du stock** : seul le stock des articles retirés est libéré. Les réservations des articles restants sont conservées. | Le client retire 1 article sur 3, mais le système libère toutes les réservations → les 2 articles restants n'ont plus de stock réservé. | Bloquant |
| **I16** | **Annulation partielle uniquement depuis `paid`** : on ne peut retirer des articles que d'une commande en état `paid`. Pas `created` (pas encore payé), `prepared` (préparation lancée), `shipped`, `cancelled`. | Le client tente d'annuler partiellement une commande en préparation → l'entrepôt a déjà commencé le colis. | Bloquant |
| **I17** | **Remboursement ≥ 0** : si le recalcul des promos après retrait d'articles donne un nouveau total supérieur au montant payé (perte d'une promo conditionnelle), l'annulation partielle est refusée. | Commande : A (100€) + B (10€), promo "100€ de réduction si total > 100€" → payé 10€. Retrait de B → total 100€, promo ne s'applique plus → nouveau total 100€ > ancien payé 10€. Remboursement négatif impossible. | Bloquant |
| **I18** | **Annulations partielles successives traçées** : la commande conserve un historique `refunds[]`. Chaque remboursement se base sur le total actuel de la commande (pas l'original). La somme cumulative des remboursements ne peut pas dépasser le montant initialement payé. | Deux annulations partielles successives sans historique → impossible de vérifier la cohérence ou de reconstituer le parcours. | Bloquant |

## Impact sur les composants du cycle 1

| Fichier | Impact |
|---------|--------|
| `types.ts` | Ajout : `Refund` (interface), `PartialCancellationError`, `RefundNegativeError`. Ajout de `refunds: readonly Refund[]` dans `Order`. |
| `order-state-machine.ts` | Aucun changement. L'ordre reste `paid` après annulation partielle. |
| `stock-manager.ts` | Aucun changement. `release(reservationId)` fonctionne déjà par token individuel. |
| `total-calculator.ts` | Aucun changement. Fonctionne avec n'importe quel sous-ensemble d'items. |
| `promotion-engine.ts` | Aucun changement. Recalcule sur les items passés en paramètre. |
| `payment-handler.ts` | Aucun changement. |
| `order-orchestrator.ts` | Aucun changement. L'annulation partielle est un nouveau workflow. |

## Nouveaux composants

| Fichier | Responsabilité |
|---------|---------------|
| `refund-calculator.ts` | Calcule le montant du remboursement (ancien total - nouveau total recalculé). Vérifie I13, I17. |
| `partial-cancellation-handler.ts` | Orchestre le workflow d'annulation partielle : vérifie I14, I15, I16, produit un `Refund` (I18). |

## Périmètre

### Inclus (IN)

- Retirer un ou plusieurs articles entiers d'une commande `paid`
- Recalculer les promos et le total sur les articles restants
- Calculer le montant du remboursement (ancien payé - nouveau total)
- Libérer le stock des articles retirés uniquement
- Mettre à jour la commande (items, total, discounts, reservations, refunds)
- Produire un objet `Refund` traçant l'opération
- Refuser si le remboursement serait négatif (I17)
- Basculer en annulation totale si tous les articles sont retirés (I14)
- Annulations partielles successives autorisées (I18)

### Hors périmètre (OUT)

- Remboursement total (déjà géré par `paid → cancelled` du cycle 1)
- Retours après livraison (`shipped`)
- Avoir / crédit client
- Exécution réelle du remboursement (Stripe, PayPal) — on calcule le montant, pas l'envoi
- Modification de quantité d'un article (retrait de l'article entier uniquement)
- Ajout d'articles à une commande existante
- Facturation de la différence si remboursement négatif (refus simple)

## Critères de réussite

| # | Critère | Vérification |
|---|---------|-------------|
| **C7** | Retirer 1 article sur 3 → commande mise à jour avec 2 articles et nouveau total recalculé | Test unitaire |
| **C8** | Remboursement = ancien total payé - nouveau total recalculé (pas somme brute des items retirés) | Test unitaire avec promos |
| **C9** | Stock libéré uniquement pour les articles retirés, stock des articles restants inchangé | Test unitaire vérifiant `getAvailableStock` |
| **C10** | Retrait de tous les articles → annulation totale (`paid → cancelled`), pas annulation partielle | Test unitaire |
| **C11** | Annulation partielle refusée si nouveau total > ancien payé (I17) | Test unitaire avec promo conditionnelle |
| **C12** | Coverage ≥ 80% maintenu après ajout des nouveaux composants | `vitest run --coverage` |