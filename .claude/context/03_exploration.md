# Phase 3 — Exploration

> Chaîne Rouge 🔴 | Minimum 2 prompts | Pas de code

## Objectif

Élargir l'espace des solutions possibles AVANT de converger.
Comparer au moins 3 approches pour chaque problématique clé.

## Problématiques clés à explorer

1. **Machine à états de la commande**
   - Approche A : enum + switch
   - Approche B : State pattern (classes)
   - Approche C : table de transitions déclarative
   - ...

2. **Réservation atomique de stock**
   - Approche A : lock optimiste
   - Approche B : saga pattern
   - Approche C : event sourcing
   - ...

3. **Moteur de promotions**
   - Approche A : chain of responsibility
   - Approche B : rules engine déclaratif
   - Approche C : strategy pattern
   - ...

4. **Orchestration du workflow**
   - Approche A : orchestrateur central (service)
   - Approche B : chorégraphie (events)
   - Approche C : pipeline de fonctions
   - ...

## Ce que cette phase doit produire

Pour chaque problématique et chaque approche :
- Avantages
- Inconvénients / risques
- Complexité d'implémentation
- Cohérence avec nos invariants (cf. `docs/INVARIANTS.md`)

Un **choix justifié** pour chaque problématique.

## Rappels

- ❌ Pas de code
- ❌ Ne pas converger trop vite — explorer d'abord
- ✅ Présenter les trade-offs, pas juste "la meilleure solution"
- ✅ Référencer les invariants de la phase 1 dans les arguments

## Condition de passage

- [ ] Au moins 3 approches comparées par problématique clé
- [ ] Un choix justifié pour chaque problématique
- [ ] Validation explicite de l'utilisateur
