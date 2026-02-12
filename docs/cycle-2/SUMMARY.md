# Résumé — Cycle 2 : Remboursement partiel à l'annulation

## Contexte

Extension du système cycle 1 (11 composants, 88 tests, 12 invariants). Feature : permettre l'annulation partielle d'une commande payée — retirer certains articles, recalculer le montant avec promos en cascade, rembourser la différence.

## Méthodologie

### Chaîne Rouge — Penser avant de produire (P1 → P7)

| Phase | Prompts | Livrable |
|-------|---------|----------|
| 1. Décision | P1, P2 | 6 invariants (I13-I18), périmètre, critères C7-C12 |
| 2. Hypothèse | P3 | 4 hypothèses (H6-H9), correction critique `order.createdAt` |
| 3. Exploration | P4 | 3 approches comparées, fonction pure retenue |
| 4. Conversation | P5 | 3 cas limites (S7-S9), mapping item↔réservation |
| 5. Moldable | P6 | 3 dry runs (nominal, successif, I17 négatif) |
| 6. Modèle | P7 | Architecture figée, séquence 8 étapes |

### Chaîne Bleue — Produire avec maîtrise (P8 → P12)

| Phase | Prompts | Livrable |
|-------|---------|----------|
| 7. Génération | P8, P9 | 2 composants + types étendus + 15 tests |
| 8. Specific Coding | P10, P11 | Audit (D5-D8), corrections D5/D6, test S8 |
| 9. Vérification | P12 | Coverage 99.42%, contraintes validées |

**Total : 12 prompts** (7 rouge + 5 bleu)

## Nouveaux composants

```
src/
├── types.ts                         # Étendu : +Refund, +RefundResult, +RefundNegativeError,
│                                    #   +PartialCancellationError, Order.refunds? (166 lignes)
├── refund-calculator.ts             # Calcul pur du remboursement : I13, I17 (30 lignes)
└── partial-cancellation-handler.ts  # Orchestration annulation partielle :
                                     #   I14, I15, I16, I18, S9 (138 lignes)
```

**Fichiers cycle 1 modifiés : 0** (seul `types.ts` étendu avec champ optionnel `refunds?`)

## Invariants cycle 2

| # | Règle | Composant | Couvert par test |
|---|-------|-----------|------------------|
| I13 | Remboursement = ancien total - nouveau total recalculé | refund-calculator | ✅ |
| I14 | 0 items restants → annulation totale (paid → cancelled) | handler | ✅ |
| I15 | Stock libéré uniquement pour items retirés | handler | ✅ |
| I16 | Annulation partielle uniquement depuis l'état `paid` | handler | ✅ |
| I17 | Remboursement négatif refusé (RefundNegativeError) | refund-calculator + handler | ✅ |
| I18 | Historique `refunds[]` traçable, cumul cohérent | handler | ✅ |

## Cas limites cycle 2

| # | Scénario | Couverture |
|---|----------|-----------|
| S7 | Mapping item↔réservation par productId | ✅ implicite via I15 |
| S8 | Annulation partielle puis totale (I14 déclenché) | ✅ test dédié |
| S9 | Item inexistant / double retrait | ✅ test dédié |

## Hypothèses

| # | Hypothèse | Verdict |
|---|-----------|---------|
| H6 | Réutiliser promotion-engine + total-calculator avec `order.createdAt` | ✅ Partiellement validée — correction critique : utiliser `order.createdAt` et non `now` |
| H7 | Pas de nouvel état, commande reste `paid` | ✅ Validée |
| H8 | `release()` existant suffit pour libération partielle | ✅ Validée |
| H9 | Calculator sans état, cohérence naturelle sur annulations successives | ✅ Validée |

## Tests et couverture

- **12 fichiers de test**, **103 tests**, tous verts
- Cycle 1 : 88 tests inchangés et verts
- Cycle 2 : +15 tests (6 refund-calculator + 9 handler)

| Métrique | Cycle 1 | Cycle 2 |
|----------|---------|---------|
| Statements | 99.18% | 99.42% |
| Branches | 100% | 98.98% |
| Functions | 94.44% | 95% |
| Lines | 99.18% | 99.42% |

## Contraintes respectées

| Contrainte | Statut |
|-----------|--------|
| Aucun fichier > 200 lignes | ✅ (max : 198 lignes) |
| Pas de code en chaîne rouge | ✅ |
| Chaque composant a ses tests | ✅ |
| 0 fichier cycle 1 modifié (hors types) | ✅ |

## Décisions techniques notables

1. **`order.createdAt` pour le recalcul des promos (H6)** — point critique : utiliser la date de création de la commande et non `now`, sinon une promo expirée serait exclue du recalcul et le nouveau total pourrait dépasser le montant payé
2. **`refunds?` optionnel sur Order** — backward compatible avec les 88 tests cycle 1, pas de migration
3. **Calculator reçoit `remainingItems` directement (D5)** — le handler filtre, le calculator calcule, séparation nette des responsabilités
4. **`now` injectable (D6)** — handler 100% déterministe en test, cohérent avec le pattern cycle 1
5. **Branche I14 dans le handler** — annulation totale si 0 items restants, utilise `transition('paid', 'cancelled')` via state machine injectée
6. **I17 comme garde défensif** — avec les promos actuelles (percentage, fixed_amount) le cas ne peut pas survenir, mais protège contre des promos conditionnelles futures
7. **Pattern reproduit** — refund-calculator isomorphe à total-calculator (pur), handler isomorphe à order-orchestrator (séquenceur sans logique métier)