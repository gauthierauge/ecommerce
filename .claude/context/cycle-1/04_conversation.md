# Phase 4 — Conversation

> Chaîne Rouge 🔴 | Minimum 2 prompts | Pas de code

## Objectif

Utiliser l'IA comme support de pensée, pas générateur de résultats.
Présenter le modèle construit jusqu'ici et demander à l'IA d'en
trouver les failles, cas limites et scénarios problématiques.

## Ce que cette phase doit produire

1. **Failles identifiées** dans le modèle actuel
2. **Cas limites** documentés avec leur résolution
3. **Scénarios problématiques** explorés

## Scénarios à couvrir obligatoirement

Ces scénarios sont implicites dans l'énoncé — le prof attend qu'ils soient traités :

- Un client applique 2 promotions incompatibles en même temps
- Le stock est réservé, le paiement prend trop de temps, la réservation expire
- Le paiement est validé (webhook) APRÈS l'expiration de la réservation
- Un client tente de passer une commande avec un stock = 1 au même moment qu'un autre
- Un panier abandonné est relancé mais le stock n'est plus disponible
- Une commande est annulée après paiement mais avant préparation
- Double-click sur le bouton de paiement → double commande ?

## Format de la conversation

Ce n'est PAS un prompt → réponse classique. C'est un dialogue :
- Tu présentes ton modèle
- L'IA challenge
- Tu réponds ou ajustes
- L'IA re-challenge

## Rappels

- ❌ Pas de code
- ❌ Ne pas demander de solutions — demander des problèmes
- ✅ "Quelles failles vois-tu ?" plutôt que "Comment résoudre X ?"
- ✅ Montrer dans PROMPTS.md que tu modifies ton modèle suite aux réponses

## Condition de passage

- [ ] Au moins 5 cas limites identifiés et documentés
- [ ] Chaque cas a une résolution ou une stratégie
- [ ] Le modèle a été ajusté si nécessaire
- [ ] Validation explicite de l'utilisateur
