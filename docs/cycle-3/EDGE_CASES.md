# Cas limites — Cycle 3 : Modification de quantité

> Scénarios problématiques identifiés en phase Conversation (P3).

## Récapitulatif

| # | Scénario | Invariant menacé | Statut |
|---|----------|-----------------|--------|
| S10 | Modification puis tentative de remonter la quantité | I1, I19 | ✅ Protégé par I19 |
| S11 | Modification de quantité + annulation partielle simultanées | I18 | ✅ Mitigé par architecture synchrone |

---

## S10 — Modification puis remontée de quantité

**Ce qui se passe :** Un utilisateur commande 5 unités de X (stock total : 5, tout réservé). Il diminue à 3 → 2 unités libérées. Un autre processus réserve ces 2 unités. L'utilisateur tente de remonter de 3 à 5.

**Invariant menacé :** I1 (pas de survente) — si la remontée était autorisée, le stock ne serait plus disponible.

**Résolution :** I19 interdit strictement l'augmentation de quantité (`newQty >= oldQty → erreur`). La vérification est faite en double : par le `quantity-modifier` (message métier) et par `stock-manager.adjustReservation` (rejet si newQty > oldQty).

---

## S11 — Modification de quantité + annulation partielle simultanées

**Ce qui se passe :** Commande {A:3, B:2, C:1}. En parallèle : modifier A de 3→1 ET retirer B entièrement. Les deux handlers lisent le même `order.total` comme référence pour le refund. Si les deux s'exécutent sur le même état, chacun calcule un refund basé sur le total original → la somme des refunds pourrait dépasser le paiement initial.

**Invariant menacé :** I18 (somme des refunds ≤ paiement initial).

**Résolution :** Les deux opérations sont séquentielles dans notre architecture synchrone (TypeScript single-thread, pas d'async). La deuxième opère sur l'ordre mis à jour par la première (nouveau total, nouveaux items). Note : si le projet évolue vers de l'async, un mécanisme de verrouillage sera nécessaire.
