# Invariants du système

> Ce document est rempli lors de la Phase 1 — Décision (Chaîne Rouge).
> Il constitue le socle de vérité du projet : tout le code doit respecter ces règles.

## Invariants critiques

### Invariants explicites

| # | Règle | Exemple de violation | Gravité |
|---|-------|---------------------|---------|
| **I1** | **Pas de survente** : on ne peut pas vendre un article dont le stock disponible est à 0. La réservation de stock doit être atomique. | Deux clients achètent le dernier exemplaire en même temps → 2 commandes confirmées pour 1 article. | Bloquant |
| **I2** | **Transitions d'état ordonnées** : une commande suit strictement `created → paid → prepared → shipped`. On ne peut pas sauter ni revenir en arrière. | Une commande passe de `created` directement à `shipped` sans être payée ni préparée. | Bloquant |
| **I3** | **Incompatibilité des promotions** : certaines promotions ne peuvent pas se cumuler. Le système doit refuser l'application d'une promo incompatible avec une promo déjà appliquée. | Un code promo "-30%" se cumule avec une remise automatique "-20%" → le client paie 50% de moins au lieu du maximum autorisé. | Bloquant |
| **I4** | **Cohérence stock/paiement/expiration** : si le paiement échoue ou si la réservation expire, le stock réservé DOIT être libéré. | Le paiement échoue mais le stock reste bloqué → articles indisponibles pour les autres clients, stock "fantôme". | Bloquant |
| **I5** | **Paiement tardif vs expiration** : si un paiement est validé APRÈS l'expiration de la réservation de stock, la commande doit être refusée (ou re-vérifier le stock), pas acceptée aveuglément. | Le stock a expiré et a été revendu à un autre client, mais le paiement tardif crée une deuxième vente sur le même article. | Bloquant |

### Invariants implicites

| # | Règle | Exemple de violation | Gravité |
|---|-------|---------------------|---------|
| **I6** | **Panier non vide** : on ne peut pas créer une commande à partir d'un panier vide. | Commande créée avec 0 article → incohérence dans tout le pipeline aval. | Bloquant |
| **I7** | **Montant positif** : le total d'une commande après promotions doit être ≥ 0. Une promo ne peut pas rendre le montant négatif. | Cumul de promos donne -5€ → le système devrait "payer" le client. | Bloquant |
| **I8** | **Idempotence des opérations critiques** : appliquer deux fois le même paiement ou la même promo ne doit pas doubler l'effet. | Le webhook de paiement arrive 2 fois → la commande est marquée payée 2 fois ou le stock est libéré 2 fois. | Bloquant |
| **I9** | **Quantités positives** : chaque ligne du panier doit avoir une quantité ≥ 1. | Un article avec quantité 0 ou -1 fausse le calcul du stock et du montant. | Bloquant |
| **I10** | **Relance uniquement sur paniers abandonnés** : un panier déjà converti en commande ne doit pas être relancé. | Le client reçoit un email "vous avez oublié votre panier" alors qu'il a déjà commandé. | Dégradé |
| **I11** | **Unicité commande/panier** : un même panier ne peut générer qu'une seule commande. Évite les doublons si le client rafraîchit la page ou double-clique. | Le client valide deux fois → deux commandes identiques, double débit, double réservation de stock. | Bloquant |
| **I12** | **Validité temporelle des promotions** : une promo expirée ne peut pas être appliquée, même si elle était valide au moment de l'ajout au panier. La vérification se fait à la création de la commande. | Le client ajoute un code promo, attend 2 jours, valide → la promo expirée est quand même appliquée. | Bloquant |

## Périmètre

### Inclus

- Création de commande depuis un panier
- Promotions (codes promo + remises automatiques)
- Réservation temporaire de stock
- Machine à états de la commande (`created → paid → prepared → shipped`, + `cancelled` depuis `created` et `paid`)
- Libération de stock si échec/expiration paiement
- Relance panier abandonné après 24h

### Hors périmètre

- Authentification utilisateur (on suppose un `userId` fourni)
- Gestion du catalogue produit (on suppose `productId`, `price`, `stock` existants)
- Interface de paiement réelle (Stripe, PayPal…) — le paiement sera un port injectable
- Notifications email — événement émis, pas d'envoi réel
- Historique des commandes
- Gestion des retours / remboursements
- Tableau de bord admin

## Critères de réussite

| # | Critère | Vérification |
|---|---------|-------------|
| **C1** | `vitest run` passe à 100% sans erreur | Commande terminal → oui/non |
| **C2** | Deux réservations concurrentes sur le dernier article en stock : une seule réussit | Test unitaire dédié → oui/non |
| **C3** | Appliquer deux promotions incompatibles sur une même commande est refusé | Test unitaire dédié → oui/non |
| **C4** | Une commande ne peut pas passer de `created` à `shipped` directement | Test unitaire vérifiant chaque transition invalide → oui/non |
| **C5** | Un paiement validé après expiration de la réservation est rejeté | Test unitaire simulant le scénario temporel → oui/non |
| **C6** | Coverage ≥ 80% sur tous les seuils (lines, functions, branches, statements) | `vitest run --coverage` → oui/non |