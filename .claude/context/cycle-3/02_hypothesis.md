# Phase 2 — Hypothèse (Cycle 3)

> Chaîne Rouge 🔴 | Pas de code

## Objectif

Formuler des hypothèses testables sur la stratégie d'ajustement du stock
et la réutilisabilité des composants cycle 2.

## Hypothèses à évaluer

1. **H10 — Ajustement atomique** : `adjustReservation(id, newQty)` est
   préférable à `release()` + `reserve()` car l'opération est atomique.
2. **H11 — Réutilisation refund-calculator** : le calculator du cycle 2
   peut être réutilisé tel quel avec les items aux quantités modifiées.
3. **H12 — Nouveau fichier vs extension** : un nouveau `quantity-modifier.ts`
   est préférable à étendre `partial-cancellation-handler.ts` (SRP).

## Format attendu

```
H[N] : "[Affirmation testable]"
→ Verdict : ✅ VALIDÉE / ❌ INVALIDÉE / ⚠️ PARTIELLEMENT
→ Preuve / argument
→ Impact sur la suite
```

## Condition de passage

- [ ] 3 hypothèses évaluées avec verdict argumenté
- [ ] Validation explicite de l'utilisateur
