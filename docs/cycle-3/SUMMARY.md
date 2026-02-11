# Résumé — Cycle 3 : Modification de quantité

## Contexte

Extension du système cycles 1+2 (13 composants, 109 tests, 18 invariants). Feature : permettre la diminution de quantité d'un article dans une commande payée — ajuster atomiquement la réservation, recalculer avec promos en cascade, rembourser la différence.

## Méthodologie

### Chaîne Rouge — Penser avant de produire (P1 → P5)

| Phase | Prompts | Livrable |
|-------|---------|----------|
| 1. Décision | P1 | 5 invariants (I19-I23), périmètre, critères C13-C18 |
| 2. Hypothèse | P2 | 3 hypothèses (H10-H12), adjustReservation atomique retenu |
| 3. Conversation | P3 | 2 cas limites (S10-S11), architecture figée |
| 4. Moldable | P4 | 2 dry runs (nominal 3→1, I20 qté=0) |
| 5. Modèle | P5 | Architecture validée, mapping I19-I23 complet |

### Chaîne Bleue — Produire avec maîtrise (P6 → P8)

| Phase | Prompts | Livrable |
|-------|---------|----------|
| 7. Génération | P6 | adjustReservation dans stock-manager (5 tests) |
| 7. Génération | P7 | quantity-modifier.ts + 9 tests |
| 9. Vérification | P8 | Coverage 99.54%, contraintes validées |

**Total : 8 prompts** (5 rouge + 3 bleu)

## Composants

```
src/
├── types.ts          # Modifié : +adjustReservation dans IStockManager (167 lignes)
├── stock-manager.ts  # Modifié : +adjustReservation implémentation (77 lignes)
└── quantity-modifier.ts  # Créé : orchestrateur modification quantité (114 lignes)
```

**Première modification de fichiers cycle 1** (types.ts + stock-manager.ts). Justifiée par H10 : l'atomicité est impossible avec release+reserve.

## Invariants cycle 3

| # | Règle | Composant | Couvert par test |
|---|-------|-----------|------------------|
| I19 | Quantité uniquement en baisse | quantity-modifier + stock-manager | ✅ |
| I20 | Nouvelle quantité ≥ 1 | quantity-modifier + stock-manager | ✅ |
| I21 | Ajustement atomique (Map.set unique) | stock-manager.adjustReservation | ✅ |
| I22 | Refund recalculé avec promos en cascade | refund-calculator (réutilisé) | ✅ |
| I23 | Réservation reflète la nouvelle quantité | stock-manager.adjustReservation | ✅ |

## Cas limites cycle 3

| # | Scénario | Couverture |
|---|----------|-----------|
| S10 | Tentative de remonter la quantité après diminution | ✅ protégé par I19 |
| S11 | Modification quantité + annulation partielle simultanées | ✅ mitigé par architecture synchrone |

## Hypothèses

| # | Hypothèse | Verdict |
|---|-----------|---------|
| H10 | adjustReservation atomique préférable à release+reserve | ✅ Validée |
| H11 | refund-calculator réutilisable tel quel | ✅ Validée |
| H12 | Nouveau fichier quantity-modifier vs extension handler cycle 2 | ✅ Option A (SRP > DRY) |

## Tests et couverture

- **14 fichiers de test**, **123 tests**, tous verts
- Cycles 1+2 : 109 tests inchangés et verts
- Cycle 3 : +14 tests (5 stock-manager + 9 quantity-modifier)

| Métrique | Cycle 2 | Cycle 3 |
|----------|---------|---------|
| Statements | 99.42% | 99.54% |
| Branches | 98.98% | 98.41% |
| Functions | 95% | 95.45% |
| Lines | 99.42% | 99.54% |

## Contraintes respectées

| Contrainte | Statut |
|-----------|--------|
| Aucun fichier > 200 lignes | ✅ (max : 190 lignes) |
| Pas de code en chaîne rouge | ✅ |
| Chaque composant a ses tests | ✅ |

## Décisions techniques notables

1. **adjustReservation atomique (H10)** — une seule opération Map.set, pas de fenêtre transitoire. Double protection I19/I20 dans le modifier et le stock-manager.
2. **Nouveau fichier vs extension (H12)** — SRP > DRY. La duplication de ~10 lignes de wiring est structurelle : retrait (filter) ≠ modification quantité (map).
3. **refund-calculator inchangé (H11)** — le quantity-modifier construit `remainingItems` avec quantités modifiées, le calculator recalcule. Même pattern que le cycle 2.
4. **Refund.removedItems trace le delta** — `{productId: 'A', quantity: 2, unitPrice: 50}` pour une modification de 3→1, permettant de distinguer un retrait d'une modification.
5. **Première modification cycle 1** — rupture assumée, impossible autrement. `adjustReservation` est rétrocompatible (nouvelle méthode sur l'interface, aucun appelant existant impacté).
