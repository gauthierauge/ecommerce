# Hypothèses — Phase 2 (Chaîne Rouge)

> Résultat de la phase Hypothèse. Chaque hypothèse a été formulée puis challengée.

## Récapitulatif

| # | Sujet | Verdict |
|---|-------|---------|
| H1 | Réservation stock — compteur simple | ⚠️ Partiel |
| H2 | Promos — matrice statique | ✅ Validée |
| H3 | Promos/total — séparation responsabilités | ✅ Validée |
| H4 | Transitions — table déclarative | ⚠️ Partiel |
| H5 | Expiration — handler externe + double vérification | ✅ Validée |

---

## H1 — Réservation de stock par simple compteur

**Hypothèse :** "La réservation de stock peut être modélisée par un simple compteur (stock disponible - quantité réservée) sans mécanisme de lock, car dans notre domaine pur en mémoire il n'y a pas de concurrence réelle entre threads."

**Verdict : ⚠️ PARTIELLEMENT VALIDÉE**

**Argument :** En TypeScript pur single-thread (Node.js), un simple compteur fonctionne si chaque opération de réservation est synchrone et atomique dans la même tick de l'event loop. Le risque arrive si on introduit de l'asynchrone entre la vérification du stock et la réservation (un `await` entre les deux) — deux appels concurrents pourraient lire le même stock.

**Mécanisme minimal :** Encapsuler la vérification + décrémentation dans une seule opération synchrone. Pattern "reserve-or-fail" atomique qui retourne succès/échec immédiatement.

**Impact :** Le module de stock devra exposer une méthode unique `reserve(productId, qty): Result<Reservation, StockError>` qui fait vérification + décrémentation en un seul appel synchrone.

---

## H2 — Matrice de compatibilité statique pour les promotions

**Hypothèse :** "On peut gérer l'incompatibilité des promotions avec une matrice de compatibilité statique (promo A est incompatible avec promo B) plutôt qu'avec des règles dynamiques complexes. Ça suffit pour respecter I3."

**Verdict : ✅ VALIDÉE**

**Argument :** Pour notre périmètre (domaine pur, pas de règles marketing dynamiques), une matrice statique suffit. On définit à l'avance quelles promos sont incompatibles, et on vérifie avant d'appliquer.

**Cas non couvert :** Des règles conditionnelles ("incompatible seulement si le montant dépasse X€"). Hors périmètre.

**Impact :** Chaque promotion portera une liste d'IDs de promos incompatibles. La vérification se fait avant application, pas après.

---

## H3 — Séparation moteur de promos / calculateur de total

**Hypothèse :** "Le moteur de promotions ne doit PAS modifier le panier. Il doit retourner une liste de réductions, et c'est le calculateur de total (composant séparé) qui applique ces réductions. Ça garantit que le total a une source unique de vérité (I7)."

**Verdict : ✅ VALIDÉE**

**Argument :** Bon découplage. Le moteur de promos calcule les réductions applicables, le calculateur de total agrège (sous-total - réductions) et garantit I7 (montant ≥ 0). Chacun a une responsabilité unique.

**Risque identifié :** Si le panier est modifié entre les deux appels, incohérence possible. Parade : les deux reçoivent le même snapshot immutable du panier.

**Impact :** Le workflow devra passer un objet panier immutable aux deux composants. Le calculateur de total est la seule source de vérité pour le montant final.

---

## H4 — Table déclarative pour les transitions d'état

**Hypothèse :** "Les transitions de la commande peuvent être modélisées par une table déclarative qui mappe chaque état vers ses états suivants autorisés. Toute transition absente de la table est interdite par défaut."

**Verdict : ⚠️ PARTIELLEMENT VALIDÉE**

**Argument :** La table déclarative est excellente pour garantir I2. Le principe "tout ce qui n'est pas déclaré est interdit" est la meilleure défense contre les transitions invalides. Mais la table ne doit PAS porter les effets de bord — on mélangerait validation et exécution des conséquences (violation du SRP).

**Meilleure approche :** La table ne fait que valider. Les effets de bord sont gérés par des handlers séparés qui réagissent aux événements de transition.

**Table de transitions mise à jour (Phase 4 — Conversation) :**
- `created → [paid, cancelled]`
- `paid → [prepared, cancelled]`
- `prepared → [shipped]`
- `shipped → []`
- `cancelled → []`

L'état `cancelled` est accessible depuis `created` et `paid`, mais pas depuis `prepared` ou `shipped` (une commande en cours de préparation ou expédiée ne peut plus être annulée).

**Impact :** Deux composants distincts — un `StateMachine` (validation pure) et des `TransitionHandlers` (effets de bord par transition).

---

## H5 — Expiration par handler externe avec `expiresAt`

**Hypothèse :** "Chaque réservation doit porter un expiresAt (timestamp). Un handler externe vérifie les réservations expirées et libère le stock. Ce n'est pas la réservation elle-même qui se désactive."

**Verdict : ✅ VALIDÉE**

**Argument :** La réservation est un objet passif avec un `expiresAt`. Un `ExpirationChecker` parcourt les réservations et libère celles qui ont expiré. En domaine pur, le risque de panne du handler est minimal.

**Double vérification :** Au moment d'accepter un paiement, on re-vérifie que la réservation n'a pas expiré (I5). Même si le handler de nettoyage a du retard, un paiement tardif est rejeté.

**Impact :** Deux gardes complémentaires — le `ExpirationChecker` (nettoyage proactif) et la vérification au paiement (garde défensive). Les deux garantissent I4 et I5.