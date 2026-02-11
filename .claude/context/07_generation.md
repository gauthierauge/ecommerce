# Phase 7 — Génération (Generated)

> Chaîne Bleue 🔵 | Minimum 4 prompts | ON CODE !

## Objectif

Générer le code composant par composant, jamais en bloc monolithique.
Chaque prompt = un composant. Chaque composant doit référencer le
modèle stabilisé en phase 6 (`docs/ARCHITECTURE.md`).

## Composants à générer (minimum 4, dans des prompts séparés)

### Prompt obligatoire 1 : Machine à états de la commande
- États : `created`, `paid`, `prepared`, `shipped`, `cancelled`
- Transitions valides uniquement
- Erreur si transition invalide
- Référencer : diagramme de la phase 5, invariants de la phase 1

### Prompt obligatoire 2 : Réservation atomique de stock
- Réserve une quantité pour une durée donnée
- Erreur si stock insuffisant
- Pas de survente (atomicité)
- Référencer : hypothèses de la phase 2 sur le stock

### Prompt obligatoire 3 : Moteur de promotions
- Évalue les promotions applicables
- Gère les incompatibilités entre promotions
- Référencer : hypothèses de la phase 2 sur les promos

### Prompt obligatoire 4 : Calcul du total
- Source unique de vérité pour le montant
- Prend en compte les promotions appliquées
- Référencer : invariant "centralisation du calcul"

## Règles de génération

- ❌ Jamais "génère-moi tout le projet"
- ❌ Jamais un fichier > 200 lignes
- ✅ Un prompt = un composant = un fichier
- ✅ Chaque prompt commence par "En respectant l'architecture définie dans docs/ARCHITECTURE.md..."
- ✅ Chaque composant doit être testable isolément
- ✅ Générer les tests en même temps que le composant (TDD)
- ✅ Injection de dépendances, pas d'imports directs entre composants

## Condition de passage

- [ ] Les 4 composants obligatoires sont générés
- [ ] Chaque composant a ses tests
- [ ] Les tests passent (`vitest run`)
- [ ] Aucun fichier > 200 lignes
- [ ] Validation explicite de l'utilisateur
