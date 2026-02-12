# Phase 2 — Hypothèse (Cycle 2)

> Chaîne Rouge 🔴 | Pas de code

## Objectif

Formuler des hypothèses testables sur la réutilisabilité des composants
cycle 1 et la stratégie de calcul du remboursement.

## Hypothèses à évaluer

1. **H6 — Réutilisation promotion-engine + total-calculator** : le refund-calculator
   peut réutiliser les composants existants en les appelant avec les articles restants.
   Point critique : quel paramètre `now` passer ?
2. **H7 — Pas de nouvel état** : la commande reste en `paid` après annulation partielle.
3. **H8 — release() suffit** : `stock-manager.release()` fonctionne pour la libération
   partielle (une réservation par item, pas de release partiel nécessaire).
4. **H9 — Calculator sans état** : le refund-calculator n'a pas besoin de l'historique
   des remboursements précédents.

## Format attendu

```
H[N] : "[Affirmation testable]"
→ Verdict : ✅ VALIDÉE / ❌ INVALIDÉE / ⚠️ PARTIELLEMENT
→ Preuve / argument
→ Impact sur la suite
```

## Condition de passage

- [ ] 4 hypothèses évaluées avec verdict argumenté
- [ ] Correction critique identifiée (order.createdAt vs now)
- [ ] Validation explicite de l'utilisateur
