# Rétrospective — Ce qu'on ferait différemment

## Dérapages rencontrés

### D1 — L'IA corrige sans demander (P17)
**Contexte :** P17 demandait une analyse, Claude Code a corrigé
D1, D2, D4 directement sans attendre mon accord.
**Impact :** P18 a dû contredire une décision déjà appliquée.
**Solution :** Ajouter systématiquement "Ne corrige rien sans
mon accord explicite" dans chaque prompt de chaîne bleue.
**Statut :** Règle ajoutée dans docs/rules/.

### D2 — Phases sautées en cycle 3
**Contexte :** Tentative de passer directement de l'Hypothèse
à la Génération, en oubliant Conversation et Moldable.
**Impact :** Rattrapé en cours de route, mais prompts
renumérotés.
**Solution :** Checklist de phases dans chaque fichier de
contexte .claude/context/.
**Statut :** À implémenter.

### D3 — "Tout gardé" dans 13 décisions
**Contexte :** Le polish PROMPTS a révélé que 13 décisions
commençaient par "Tout gardé" — manque d'esprit critique
apparent.
**Impact :** Corrigé avant rendu, mais aurait coûté des
points.
**Solution :** docs/rules/ interdit "Tout gardé" et impose
l'analyse en premier.
**Statut :** Règle ajoutée.

### D4 — Template parasite dans prompts/PROMPTS-cycle_2.md
**Contexte :** La première ligne contenait "Crée le fichier..."
— une instruction de prompt, pas du contenu.
**Impact :** Corrigé au polish.
**Solution :** Toujours relire le premier rendu d'un fichier
généré par l'IA.
**Statut :** Corrigé.

---

## Patterns qui ont marché

### ✅ P1 — Hypothèses testables avant solutions
Formuler "je pense que X fonctionne comme Y" plutôt que
"comment faire X ?" force l'IA à valider/invalider au lieu
de générer une solution.
**Exemples :** H1 (compteur simple → partiellement invalidé),
H6 (order.createdAt découvert).

### ✅ P2 — "Joue le dev senior sceptique"
Demander à l'IA d'attaquer son propre modèle révèle les
failles. Chaque phase Conversation a découvert au moins
un cas critique.
**Exemples :** P7 (état cancelled manquant), P5 cycle 2
(S8 annulation totale après partielle).

### ✅ P3 — Dry runs avant le code
Dérouler un scénario pas à pas en texte coûte 0 en dette
technique et révèle les bugs de logique.
**Exemples :** P9-P10 (transitions invalides), P6 cycle 2
(I17 remboursement négatif).

### ✅ P4 — Contredire l'IA avec des chiffres
P18 : "deux promos -20% sur 100€ : brut = 60€, cascade = 64€"
— argument chiffré impossible à ignorer.

### ✅ P5 — TDD dans les prompts
Demander les tests RED avant le code GREEN empêche l'IA
de générer du code non testé.

### ✅ P6 — Un composant par prompt
P13-P16 : un composant + ses tests par prompt. L'IA reste
focalisée, le code reste petit, les erreurs restent locales.

---

## Patterns qui n'ont PAS marché

### ❌ Prompt trop large
Le P3+P4 condensés (hypothèses + exploration) en un seul
prompt au cycle 3 a produit une réponse longue et difficile
à challenger point par point.

### ❌ Laisser l'IA décider du format
Sans "Format attendu" dans le prompt, l'IA choisit un format
différent à chaque réponse — rend le journal incohérent.

### ❌ Ne pas relire le journal au fil de l'eau
Les "Tout gardé" se sont accumulés sur 13 prompts. Un check
tous les 5 prompts aurait détecté le pattern plus tôt.

---

## Métriques du projet

| Métrique | Cycle 1 | Cycle 2 | Cycle 3 | Cycle 4 |
|----------|---------|---------|---------|---------|
| Prompts | 23 | 12 | 8 | 3 |
| Tests ajoutés | 88 | 15 | 14 | 0 |
| Invariants | 12 | 6 | 5 | 0 |
| Fichiers cycle 1 modifiés | — | 1 (types) | 2 (types, stock) | 13 (imports) |
| Bug trouvé | — | — | B1 (promo overflow) | — |

## Leçon principale

> Le journal des prompts n'est pas une trace administrative.
> C'est l'outil qui force l'esprit critique. Sans lui, on
> accepte la première réponse de l'IA.
