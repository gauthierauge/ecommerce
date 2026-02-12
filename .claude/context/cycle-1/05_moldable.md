# Phase 5 — Moldable Development

> Chaîne Rouge 🔴 | Minimum 1 prompt | Pas de code

## Objectif

Tester la logique sur des artefacts jetables avant de figer quoi que ce soit.
Produire un diagramme de la machine à états et valider que toute la logique
est couverte.

## Ce que cette phase doit produire

### 1. Diagramme de la machine à états de la commande (en texte)

États attendus : `created`, `paid`, `prepared`, `shipped`, `cancelled`

Format suggéré :
```
[created] --paiement_ok--> [paid]
[created] --annulation--> [cancelled]
[created] --expiration--> [cancelled]
[paid] --preparation--> [prepared]
[paid] --annulation--> [cancelled]  (avec remboursement)
[prepared] --expedition--> [shipped]
[shipped] → état final
[cancelled] → état final
```

### 2. Validation de couverture

- Toutes les transitions valides sont listées
- Toutes les transitions INVALIDES sont explicitement interdites
  (ex: on ne peut pas passer de `shipped` à `created`)
- Les effets de bord de chaque transition sont documentés
  (ex: `cancelled` → libérer le stock, rembourser si payé)

### 3. Scénario déroulé (dry run)

Dérouler au moins 2 scénarios complets en texte :
- Scénario nominal : panier → commande → paiement → préparation → expédition
- Scénario d'échec : panier → commande → timeout paiement → annulation → libération stock

## Rappels

- ❌ Pas de code (pas de TypeScript, pas de classes)
- ✅ Du texte, des diagrammes ASCII, des scénarios
- ✅ C'est jetable — on peut tout refaire
- ✅ Le but est de valider la LOGIQUE, pas l'implémentation

## Condition de passage

- [ ] Machine à états complète avec transitions valides ET invalides
- [ ] Effets de bord documentés par transition
- [ ] Au moins 2 scénarios déroulés
- [ ] Validation explicite de l'utilisateur
