# Phase 10 — System

> Chaîne Bleue 🔵 | Minimum 2 prompts

## Objectif

Assembler les micro-outils en un système cohérent. L'orchestrateur
assemble les briques mais ne contient AUCUNE logique métier.

## Ce que cette phase doit produire

### 1. Service d'orchestration (`order-orchestrator.ts`)

L'orchestrateur :
- Reçoit une demande de commande
- Appelle les composants dans le bon ordre
- Gère le flux : création → réservation stock → promos → calcul total → paiement
- NE décide PAS (pas de `if/else` métier dans l'orchestrateur)
- Délègue toute logique aux composants spécialisés

**Test critique** : si on retire toute logique métier de l'orchestrateur,
il ne doit rester que du câblage (appels de fonctions dans l'ordre).

### 2. Handler de confirmation de paiement

- Reçoit l'événement "paiement confirmé"
- Fait transitionner la commande vers `paid`
- Gère le cas : paiement reçu après expiration de la réservation

### 3. Handler d'expiration de réservation

- Déclenché quand le timer de réservation expire
- Libère le stock
- Annule la commande si pas encore payée
- Gère le cas : paiement en cours au moment de l'expiration

### 4. (Bonus) Handler de panier abandonné

- Détecte les paniers non convertis après 24h
- Déclenche la relance

## Vérification finale

- [ ] L'orchestrateur ne contient aucun `if` métier
- [ ] Tous les composants communiquent via interfaces
- [ ] Le workflow complet fonctionne de bout en bout
- [ ] Les scénarios de la phase 4 (cas limites) passent en test
- [ ] Tous les tests passent : `vitest run`
- [ ] Coverage > 80% : `vitest run --coverage`
- [ ] Aucun fichier > 200 lignes

## Livrable final

```bash
vitest run             # tous les tests passent
vitest run --coverage  # coverage > 80%
```

## Condition de passage

- [ ] Orchestrateur assemblé sans logique métier
- [ ] Handlers de paiement et expiration fonctionnels
- [ ] Tous les tests passent
- [ ] Coverage > 80%
- [ ] PROMPTS.md complet (≥ 20 prompts documentés)
- [ ] ✅ PROJET TERMINÉ
