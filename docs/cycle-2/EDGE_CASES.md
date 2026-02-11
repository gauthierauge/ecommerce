# Cas limites — Cycle 2 : Remboursement partiel

> Scénarios problématiques identifiés en phase Conversation (P5) et validés par dry run (P6).

## Récapitulatif

| # | Scénario | Invariant menacé | Statut |
|---|----------|-----------------|--------|
| S7 | Mapping item ↔ réservation ambigu | I15 | ✅ Résolu (unicité productId) |
| S8 | Annulation totale après remboursement partiel | I13, I18 | ✅ Résolu (handler unique) |
| S9 | Double retrait du même article | I13, I15 | ✅ Résolu (guard existence) |

---

## S7 — Mapping item ↔ réservation ambigu

**Ce qui se passe :** Le handler doit trouver quelle réservation libérer quand un article est retiré. Le seul lien est `productId`. Si deux CartItems ont le même productId, le `find` par productId est ambigu.

**Résolution :** Pré-condition : chaque productId apparaît au plus une fois dans `order.items` (naturel dans le modèle — 2 exemplaires = une ligne avec `quantity: 2`, pas deux lignes). Le matching par productId est alors sans ambiguïté.

---

## S8 — Annulation totale après remboursement partiel

**Ce qui se passe :** Commande partiellement remboursée (40€ sur 150€, total actuel 110€). Le client demande une annulation totale (`paid → cancelled`). Le flux cycle 1 ne produit pas de `Refund`, l'historique est incomplet.

**Résolution :** Toute annulation avec remboursement passe par le `partial-cancellation-handler`. Si `itemsToRemove` = tous les items restants → I14 détecte 0 items restants → bascule en annulation totale avec transition `paid → cancelled` et Refund final de 110€.

---

## S9 — Double retrait du même article (idempotence)

**Ce qui se passe :** Double-click ou retry réseau. Le premier appel retire A et rembourse. Le deuxième appel demande à retirer A qui n'est plus dans la commande.

**Résolution :** Le handler vérifie que chaque item dans `itemsToRemove` existe dans `order.items` actuel avant traitement. Sinon → `PartialCancellationError("Article X absent de la commande")`.