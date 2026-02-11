# Cas limites — Phase 4 Conversation (Chaîne Rouge)

> Scénarios problématiques identifiés en challengeant le modèle, avec leurs résolutions.

## Récapitulatif

| # | Scénario | Invariant menacé | Statut |
|---|----------|-----------------|--------|
| S1 | Double-click paiement | I8, I11 | ✅ Résolu |
| S2 | Paiement après expiration réservation | I5 | ✅ Résolu |
| S3 | Annulation après paiement | I2 | ✅ Résolu |
| S4 | Panier abandonné, stock épuisé | I1, I10 | ✅ Acceptable |
| S5 | Promo expirée entre ajout et commande | I3, I7 | ✅ Résolu |
| S6 | Modification panier pendant checkout | — | ✅ Couvert par design |

---

## S1 — Double-click paiement

**Ce qui se passe :** Le client clique deux fois sur "Payer". Deux webhooks de paiement arrivent quasi simultanément.

**Invariants menacés :** I8 (idempotence), I11 (unicité commande/panier)

**Résolution :** Deux gardes complémentaires :
- I11 empêche la création de deux commandes depuis le même panier
- La table déclarative empêche la double transition : le premier webhook passe la commande de `created → paid`, le deuxième tente `paid → paid` → transition invalide → rejeté

---

## S2 — Paiement validé après expiration de la réservation

**Ce qui se passe :** Le paiement prend 20 minutes (3D Secure, banque lente). La réservation expire après 15 minutes. Le stock est libéré et revendu. Le webhook de paiement arrive.

**Invariant menacé :** I5 (paiement tardif vs expiration)

**Résolution :** Double vérification (H5) :
- Le handler de paiement vérifie `expiresAt` avant d'accepter
- Si expiré → commande passe en `cancelled`, pas en `paid`
- Le paiement est marqué comme "à rembourser" (événement émis, traitement hors scope)

---

## S3 — Annulation après paiement mais avant préparation

**Ce qui se passe :** Le client paie puis demande une annulation immédiate. La commande est en `paid`.

**Invariant menacé :** I2 (transitions ordonnées — pas d'état `cancelled` initialement)

**Résolution :** Ajout de l'état `cancelled` dans la machine à états :
- `created → [paid, cancelled]`
- `paid → [prepared, cancelled]`
- `prepared → [shipped]`
- `shipped → []`
- `cancelled → []`

Le handler de la transition vers `cancelled` libère le stock réservé.

---

## S4 — Panier abandonné avec stock épuisé à la relance

**Ce qui se passe :** Un panier est abandonné. 24h plus tard, le système le relance. Mais les articles sont en rupture de stock.

**Invariants menacés :** I1 (pas de survente), I10 (relance pertinente)

**Résolution :** Acceptable sans vérification préalable du stock. La relance est un signal (événement), pas une commande. Si le client revient et que le stock est épuisé, l'erreur arrive proprement à l'étape de réservation (I1 protège). Pas de survente possible.

---

## S5 — Promotion expirée entre ajout au panier et commande

**Ce qui se passe :** Le client ajoute un code promo. Il attend 2 jours. Il valide la commande. La promo a expiré.

**Invariants menacés :** I3 (promos), I7 (montant positif)

**Résolution :** I12 (ajouté suite au P7) impose la vérification de `validFrom/validUntil` à la création de commande. Le moteur de promos rejette toute promo hors période de validité.

---

## S6 — Modification du panier pendant le checkout

**Ce qui se passe :** Le client lance le checkout, puis modifie son panier dans un autre onglet (ajoute un article, change une quantité) pendant que le paiement est en cours.

**Invariants menacés :** Aucun directement — couvert par le design existant.

**Résolution :** H3 impose un snapshot immutable du panier à la création de commande. La commande travaille sur sa copie. Le panier original peut être modifié librement après.

**Point d'attention implémentation :** La commande doit stocker une copie gelée (deep copy) des items, pas une référence au panier vivant.