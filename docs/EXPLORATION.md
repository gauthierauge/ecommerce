# Exploration — Phase 3 (Chaîne Rouge)

> Comparaison d'approches et choix d'architecture avant de converger.

## Récapitulatif des choix

| Problématique | Approche choisie | Alternatives rejetées | Justification |
|---|---|---|---|
| Machine à états | Table déclarative | Switch/case, State pattern | KISS, sûre par défaut (I2), extensible |
| Réservation stock | Tokens de réservation | Compteur simple, File d'attente | Traçabilité, expiresAt natif (I1/I4/I5) |
| Moteur de promotions | Strategy pattern | Chain of responsibility, Rules engine | Fonctions pures, SRP, KISS |
| Orchestration | Service central + fonctions pures | Événements, Pipeline pur | Flux explicite, testable, sans logique métier |

---

## P5 — Machine à états et réservation de stock

### Machine à états de la commande

| Critère | A — Switch/case | B — Table déclarative | C — State pattern |
|---|---|---|---|
| Avantages | Simple à comprendre | Déclaratif, lisible, compact, extensible | Type-safe au compile-time |
| Inconvénients | Spaghetti dès 5+ états, oublis faciles | Vérification runtime uniquement | Verbose, over-engineering pour 4 états |
| Cohérence I2 | Faible — default oublié = transition silencieuse | Forte — non déclaré = interdit | Forte — compilateur empêche les erreurs |
| Ajout d'un état | Modifier chaque case, risque d'oubli | Ajouter une ligne | Créer une classe + modifier les existantes |

**Choix : B — Table déclarative.** Pour 4 états (created → paid → prepared → shipped + cancelled), c'est le sweet spot entre sûreté et simplicité. Cohérent avec H4.

### Réservation atomique de stock

| Critère | A — Compteur simple | B — Tokens de réservation | C — File d'attente |
|---|---|---|---|
| Avantages | Ultra simple, performant | Traçable, annulable, porte un expiresAt | Garantie d'ordre |
| Inconvénients | Pas de traçabilité, libération partielle fragile | Plus complexe, stock = calcul dérivé | Over-engineering en single-thread |
| Cohérence I1 | OK si synchrone, mais pas de lien avec expiresAt | Compatible I1, I4, I5 nativement | OK mais complexité injustifiée |
| Complexité | Très faible | Modérée | Élevée |

**Choix : B — Tokens de réservation.** Chaque réservation est un objet avec productId, qty, expiresAt. Le stock disponible est calculé dynamiquement (total - tokens actifs). Cohérent avec H1 et H5.

---

## P6 — Moteur de promotions et orchestration

### Moteur de promotions

| Critère | A — Chain of responsibility | B — Rules engine déclaratif | C — Strategy pattern |
|---|---|---|---|
| Avantages | Extensible, maillons indépendants | Promos = données, moteur générique | Interface commune, fonctions pures testables |
| Inconvénients | Ordre impacte le résultat, incompatibilités fragiles | Over-engineering, pas besoin d'un DSL | Pas de gestion native des incompatibilités |
| Cohérence I3 + H2 | Faible — incompatibilités dans chaque maillon | Bonne si config complète, mais disproportionné | Bonne — matrice de compatibilité séparée |
| Ajout d'une promo | Ajouter un maillon | Ajouter une entrée config | Ajouter une fonction/classe |

**Choix : C — Strategy pattern.** Chaque type de promo (pourcentage, montant fixe…) est une fonction avec la même signature `(panier) → Réduction`. Les incompatibilités (I3) sont vérifiées par un composant séparé utilisant la matrice statique (H2). Séparation "calculer la réduction" / "vérifier la compatibilité".

### Orchestration du workflow

| Critère | A — Service central | B — Événements | C — Pipeline de fonctions |
|---|---|---|---|
| Avantages | Flux explicite, lisible, facile à débugger | Découplage maximal, extensible | Composable, fonctionnel, testable |
| Inconvénients | Risque de logique métier qui glisse | Flux invisible, difficile à débugger | Rigide si besoin de contexte non-linéaire |
| Testabilité | Bonne (mock des composants) | Complexe (simuler les événements) | Excellente (chaque fonction isolée) |
| Sans logique métier | Possible si discipliné | Naturel mais flux implicite | Naturel — orchestrateur = composition |

**Choix : A + C hybride — Service central avec fonctions pures.** Un orchestrateur central séquence les étapes dans un ordre explicite. Chaque étape est une fonction pure. L'orchestrateur ne contient aucun `if`, aucun calcul — il appelle les composants et passe les résultats. La logique métier reste dans les composants.