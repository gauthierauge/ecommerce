# Phase 2 — Hypothèse

> Chaîne Rouge 🔴 | Minimum 2 prompts | Pas de code

## Objectif

Transformer les intuitions en hypothèses testables. Ne pas demander de solutions
directes, mais formuler des hypothèses et les faire évaluer.

## Ce que cette phase doit produire

Au moins 5 hypothèses couvrant obligatoirement ces sujets :
1. **Réservation de stock** — comment garantir l'atomicité ?
2. **Gestion des promotions** — comment gérer les incompatibilités ?
3. **Transitions d'état** — comment garantir la validité ?
4. **Centralisation du calcul du total** — source unique de vérité ?
5. **Expiration des réservations** — que faire quand le timer expire ?

## Format attendu pour chaque hypothèse

```
H[N] : "[Affirmation testable]"
→ Verdict : ✅ VALIDÉE / ❌ INVALIDÉE / ⚠️ PARTIELLEMENT
→ Preuve / argument
→ Impact sur la suite
```

## Rappels

- ❌ Pas de code, pas d'architecture
- ❌ Ne pas demander "comment faire X" → demander "est-ce que X est vrai ?"
- ✅ Formuler des affirmations et demander à l'IA de les challenger
- Le champ "Décision" dans PROMPTS.md est crucial : montre que tu ne prends
  pas les réponses de l'IA pour argent comptant

## Condition de passage

- [ ] 5 hypothèses formulées sur les 5 sujets imposés
- [ ] Chaque hypothèse a un verdict argumenté
- [ ] Validation explicite de l'utilisateur
