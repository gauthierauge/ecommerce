# Machine à états — Phase 5 Moldable (Chaîne Rouge)

> Diagramme complet de la machine à états de la commande, effets de bord et scénarios déroulés.

## Diagramme

```
                    ┌──────────────────────────────────────┐
                    │                                      ▼
[created] ──paiement_ok──► [paid] ──preparation──► [prepared] ──expedition──► [shipped]
    │                        │                                                  (final)
    │                        │
    ├──annulation──►  [cancelled]  ◄──────────────┘
    │                  (final)
    └──expiration──►  [cancelled]
```

## Transitions valides

| De | Événement | Vers |
|---|---|---|
| `created` | `paiement_ok` | `paid` |
| `created` | `annulation` | `cancelled` |
| `created` | `expiration` | `cancelled` |
| `paid` | `preparation` | `prepared` |
| `paid` | `annulation` | `cancelled` |
| `prepared` | `expedition` | `shipped` |

## Transitions interdites

| De | Vers | Raison |
|---|---|---|
| `created` | `prepared` | On ne peut pas préparer sans payer (I2) |
| `created` | `shipped` | On ne peut pas expédier sans payer ni préparer (I2) |
| `paid` | `created` | Pas de retour en arrière (I2) |
| `paid` | `shipped` | On ne peut pas expédier sans préparer (I2) |
| `prepared` | `created` | Pas de retour en arrière |
| `prepared` | `paid` | Pas de retour en arrière |
| `prepared` | `cancelled` | Trop tard pour annuler — préparation lancée |
| `shipped` | * (tout) | État final, aucune transition sortante |
| `cancelled` | * (tout) | État final, aucune transition sortante |

## Effets de bord par transition

| Transition | Stock | Paiement | Promotions | Événement émis |
|---|---|---|---|---|
| `created → paid` | Stock reste réservé | Paiement confirmé | Aucun changement | `order.paid` |
| `created → cancelled` (annulation) | Stock réservé libéré | Aucun (pas encore payé) | Promos détachées | `order.cancelled`, `stock.released` |
| `created → cancelled` (expiration) | Stock réservé libéré | Aucun | Promos détachées | `reservation.expired`, `order.cancelled`, `stock.released` |
| `paid → prepared` | Stock passe de "réservé" à "engagé" | Aucun changement | Aucun changement | `order.preparing` |
| `paid → cancelled` | Stock réservé libéré | Remboursement déclenché | Promos détachées | `order.cancelled`, `stock.released`, `refund.requested` |
| `prepared → shipped` | Stock définitivement sorti | Aucun changement | Aucun changement | `order.shipped` |

## Scénarios déroulés

### Scénario A — Nominal (happy path)

| Étape | État | Action | Effets de bord |
|---|---|---|---|
| 1 | — | Client a un panier (2x Article A, 1x Article B) | — |
| 2 | — | Validation du panier : I6 (non vide), I9 (quantités ≥ 1) | — |
| 3 | — | Moteur de promos : code "SUMMER20" vérifié (I12 validité, I3 compatibilité) | Réduction calculée : -20% |
| 4 | — | Calculateur de total : sous-total 100€ - 20€ = 80€ (I7 : ≥ 0) | — |
| 5 | `created` | Commande créée (I11 : unicité panier/commande). Snapshot immutable du panier. | Stock réservé atomiquement : 2x A, 1x B. Tokens avec `expiresAt = now + 15min` |
| 6 | `paid` | Webhook paiement reçu. Vérification : réservation non expirée (I5). Transition `created → paid` valide. | `order.paid` émis |
| 7 | `prepared` | Entrepôt confirme la préparation. Transition `paid → prepared`. | `order.preparing` émis |
| 8 | `shipped` | Colis remis au transporteur. Transition `prepared → shipped`. | Stock définitivement sorti. `order.shipped` émis. État final. |

### Scénario B — Échec paiement / expiration

| Étape | État | Action | Effets de bord |
|---|---|---|---|
| 1 | — | Client a un panier (1x Article C, stock restant = 1) | — |
| 2 | — | Validation panier + promos + total | — |
| 3 | `created` | Commande créée. Stock réservé : 1x C. Token avec `expiresAt = now + 15min`. | Stock disponible C = 0 (tout réservé) |
| 4 | — | Un autre client tente de réserver Article C → **échec** (I1 : stock = 0) | — |
| 5 | — | 15 minutes passent. Le paiement n'est pas arrivé. | — |
| 6 | — | `ExpirationChecker` détecte le token expiré. | — |
| 7 | `cancelled` | Transition `created → cancelled` (expiration). | Stock libéré : C disponible = 1. `reservation.expired` + `order.cancelled` + `stock.released` émis |
| 8 | — | Le deuxième client peut maintenant réserver Article C. | — |
| 9 | — | Si le webhook de paiement arrive maintenant → I5 vérifie `expiresAt` → expiré → **rejeté**. Commande déjà `cancelled`, transition `cancelled → paid` interdite. Double protection. | — |

## Dry runs — Transitions invalides (P10)

Validation que le système rejette les opérations invalides sans corrompre l'état.

### shipped → created (retour en arrière)

- **Composant bloquant :** `StateMachine` — la table déclare `shipped → []`, aucune transition sortante
- **Erreur :** `InvalidTransitionError("shipped → created")`
- **Invariant protégé :** I2
- **État après rejet :** Commande reste `shipped`. Aucun effet de bord. ✅

### prepared → cancelled (annulation trop tardive)

- **Composant bloquant :** `StateMachine` — `prepared → [shipped]`, `cancelled` absent
- **Erreur :** `InvalidTransitionError("prepared → cancelled")`
- **Invariant protégé :** I2
- **État après rejet :** Commande reste `prepared`. Stock reste engagé. ✅

### Réservation forcée sur stock = 0

- **Composant bloquant :** `StockManager` — stock disponible = total - tokens actifs = 0
- **Erreur :** `InsufficientStockError("stock disponible = 0, demandé = 1")`
- **Invariant protégé :** I1
- **État après rejet :** Aucun token créé. Commande non créée. ✅

### cancelled → paid (relancer une commande morte)

- **Composant bloquant :** `StateMachine` — `cancelled → []`, aucune transition sortante
- **Erreur :** `InvalidTransitionError("cancelled → paid")`
- **Invariant protégé :** I2, I5
- **État après rejet :** Commande reste `cancelled`. Stock reste libéré. Paiement marqué "à rembourser". ✅

### Bilan

| Cas | Composant bloquant | Invariant | Cohérent après rejet |
|---|---|---|---|
| shipped → created | StateMachine | I2 | ✅ |
| prepared → cancelled | StateMachine | I2 | ✅ |
| Réservation stock = 0 | StockManager | I1 | ✅ |
| cancelled → paid | StateMachine | I2, I5 | ✅ |