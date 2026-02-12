# Analyse Pros/Cons obligatoire

## Principe
L'IA ne doit JAMAIS recommander une solution sans avoir
comparé au moins 2 alternatives. Une recommandation sans
comparaison est une opinion déguisée.

---

## Quand déclencher une analyse pros/cons

### Obligatoire
- Choix d'architecture (nouveau composant, pattern, structure)
- Choix de design (interface, type, organisation)
- Choix de stratégie (comment résoudre un problème)
- Modification d'un composant existant (modifier vs créer)

### Pas nécessaire
- Correction d'un bug évident (une seule bonne réponse)
- Mise à jour d'un import (mécanique)
- Ajout d'un test pour un invariant spécifique

---

## Format imposé

### Minimum 2 options, idéal 3

| Critère | Option A : [nom] | Option B : [nom] | Option C : [nom] |
|---|---|---|---|
| Description | ... | ... | ... |
| ✅ Avantages | ... | ... | ... |
| ❌ Inconvénients | ... | ... | ... |
| SOLID | ✅/⚠️/❌ | ✅/⚠️/❌ | ✅/⚠️/❌ |
| Complexité | faible/moyenne/haute | ... | ... |
| Impact existant | aucun/faible/fort | ... | ... |

### Verdict
L'IA recommande UNE option avec justification mais
termine par : "À toi de décider."

---

## Pièges à éviter

### L'option homme de paille
L'IA propose une bonne option et deux mauvaises pour
orienter le choix. Chaque option doit être défendable.

**Signal :** si une option n'a que des inconvénients,
elle n'aurait pas dû être proposée.

### Le faux consensus
L'IA dit "l'option A est clairement supérieure" sans
nuancer. Il y a toujours un tradeoff.

**Signal :** si une option n'a que des avantages,
l'IA a oublié des inconvénients.

### L'analyse de surface
L'IA compare sur des critères vagues ("plus propre",
"plus simple") au lieu de critères concrets.

**Signal :** remplacer "plus simple" par un chiffre
(nombre de lignes, nombre de fichiers impactés,
nombre de tests à écrire).

---

## Exemples du projet

### Bon exemple — P6 cycle 1 (moteur de promos)
| Critère | A : Chain of resp. | B : Rules engine | C : Strategy + matrice |
|---|---|---|---|
| Avantages | Extensible | Déclaratif | Données séparées du code |
| Inconvénients | Couplage entre promos | Over-engineering | Matrice à maintenir |
| SOLID | ⚠️ | ❌ YAGNI | ✅ |
→ Option C choisie. Justification concrète.

### Bon exemple — H12 cycle 3 (quantity-modifier)
| Critère | A : Nouveau fichier | B : Étendre handler cycle 2 |
|---|---|---|
| SRP | ✅ Séparé | ❌ Deux raisons de changer |
| Lignes | ~100 | 190+ (proche limite 200) |
| Duplication | ~10 lignes de wiring | 0 |
→ Option A choisie. La duplication est structurelle, pas accidentelle.

### Mauvais exemple — ce qu'il NE faut PAS faire
"Je recommande l'option A car elle est plus propre
et plus maintenable."
→ Pourquoi ? Combien de fichiers ? Quel impact ?
  "Plus propre" n'est pas un argument.
