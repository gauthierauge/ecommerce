# Machine à états — Cycle 3 : Modification de quantité

> Pas de modification de la machine à états du cycle 1.

## Transitions existantes (inchangées)

```
created → paid → prepared → shipped
created → cancelled
paid → cancelled
```

## Impact du cycle 3

La modification de quantité **ne crée pas de nouvel état**. La commande reste en `paid` après modification, exactement comme pour l'annulation partielle du cycle 2.

```
paid ──[modifier quantité]──→ paid (même état, contenu modifié)
```

### Ce qui change dans l'ordre après modification

| Champ | Avant | Après |
|-------|-------|-------|
| `state` | `paid` | `paid` (inchangé) |
| `items` | quantité originale | quantité diminuée |
| `total` | total original | nouveau total recalculé |
| `discounts` | promos originales | promos recalculées |
| `reservations` | qty originale | qty ajustée (I23) |
| `refunds` | `[...existants]` | `[...existants, nouveau]` |

### Workflow post-modification

Le workflow existant continue normalement :
```
paid (modifié) → prepared → shipped
paid (modifié) → cancelled
```
