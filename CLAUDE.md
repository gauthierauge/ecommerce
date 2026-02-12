# Workflow Commande E-commerce — Instructions Agent IA

## Comportement

Important : chaque réponse doit commencer par « J'ai lu les règles ». Cela montre que vous avez suivi nos directives.

## Référence obligatoire
Avant chaque réponse, lis docs/rules/README.md — ce sont les
règles absolues du projet. Elles priment sur tout.

## Règles critiques (résumé)
- Chaîne rouge = ZÉRO code, tu proposes, tu ne décides pas
- Chaîne bleue = tu ne corriges RIEN sans accord explicite
- Minimum 2 prompts par phase (1 demande + 1 challenge)
- Termine toujours par "À toi : que gardes-tu, modifies-tu, rejettes-tu ?"
- Cite les numéros d'invariants et les lignes de code exactes
- Ne passe jamais à la phase suivante sans accord explicite
- Pour les détails complets → docs/rules/README.md

## Contexte projet

Développement du workflow de commande d'une boutique en ligne :

- Créer une commande à partir d'un panier
- Appliquer des promotions (codes promo, remises automatiques)
- Réserver le stock temporairement pendant le paiement
- Gérer les transitions d'état (créée → payée → préparée → expédiée)
- Libérer le stock si le paiement échoue ou expire
- Relancer les paniers abandonnés après 24h

### Complexités cachées à garder en tête

- Une promotion peut être incompatible avec une autre
- Le stock doit être réservé atomiquement (pas de survente)
- Un paiement peut être validé après expiration du stock réservé
- Les transitions d'état ont des règles métier (on ne peut pas expédier sans préparer)

## Stack

- **Langage** : TypeScript (pur, sans framework web)
- **Tests** : Vitest
- **Pas de** : Express, React, API HTTP, base de données — c'est du domaine pur

## Principes de conception

- SOLID, DRY, KISS, YAGNI
- Micro-outils composables (un module = une responsabilité)
- Aucun fichier > 200 lignes
- Tests first (TDD)
- Injection de dépendances, pas d'appels directs entre composants
- TDD Red/Green/Refactor obligatoire (voir docs/TDD.md)

## Méthodologie — Chaîne Rouge puis Chaîne Bleue

### RÈGLE ABSOLUE : Pas de code avant la phase 7 (Generated)

Les phases 1 à 6 (Chaîne Rouge) produisent de la réflexion, des diagrammes,
des décisions. AUCUN fichier dans `src/` ou `tests/` ne doit être créé
pendant ces phases. Si je te demande du code pendant la chaîne rouge,
refuse et rappelle-moi cette règle.

### Séquence obligatoire

| # | Phase | Chaîne | Fichier contexte | Livrable |
|---|-------|--------|------------------|----------|
| 1 | Décision | 🔴 Rouge | `.claude/context/01_decision.md` | `docs/INVARIANTS.md` |
| 2 | Hypothèse | 🔴 Rouge | `.claude/context/02_hypothesis.md` | Hypothèses validées/invalidées |
| 3 | Exploration | 🔴 Rouge | `.claude/context/03_exploration.md` | Comparaison d'architectures |
| 4 | Conversation | 🔴 Rouge | `.claude/context/04_conversation.md` | Cas limites identifiés |
| 5 | Moldable | 🔴 Rouge | `.claude/context/05_moldable.md` | Diagramme machine à états |
| 6 | Modèle | 🔴 Rouge | `.claude/context/06_model_centric.md` | `docs/ARCHITECTURE.md` |
| 7 | Génération | 🔵 Bleu | `.claude/context/07_generation.md` | Composants dans `src/` |
| 8 | Specific Coding | 🔵 Bleu | `.claude/context/08_specific.md` | Corrections documentées |
| 9 | Composable | 🔵 Bleu | `.claude/context/09_composable.md` | Vérification indépendance |
| 10 | System | 🔵 Bleu | `.claude/context/10_system.md` | Orchestrateur final |

### Règles d'exécution

1. **Avant chaque prompt**, lis le fichier contexte de la phase en cours
2. **Ne passe jamais** à la phase suivante sans ma validation explicite ("next" ou "étape suivante")
3. **Après chaque échange**, mets à jour `prompts/PROMPTS.md` avec le format exigé (voir ci-dessous)
4. **Chaque nouvelle feature** = un nouveau cycle rouge/bleu complet
5. **Refactoring/bugfix** = phases 8-9 (Specific Coding, Composable) uniquement

### Minimums de prompts (exigence du prof)

- Chaîne rouge : **minimum 10 prompts** (phases 1-6)
- Chaîne bleue : **minimum 10 prompts** (phases 7-10)
- **Total minimum : 20 prompts**

## Format du journal prompts/PROMPTS.md

Chaque prompt DOIT être documenté dans `prompts/PROMPTS.md` avec ce format exact :

```markdown
## Phase : [nom de la phase]

### P[N] - [titre court]

**Prompt :**
> [prompt exact envoyé]

**Résumé de la réponse :** [2-3 lignes]

**Décision :** [ce que j'ai gardé, modifié, rejeté et pourquoi]
```

Le champ **Décision** est crucial : il doit montrer un esprit critique.
Ne jamais écrire "J'ai tout gardé". Toujours analyser, même si c'est
pour dire "J'ai validé car X et Y sont cohérents avec nos invariants".

## Documentation

- `docs/STACK.md` — Justification du choix TypeScript + Vitest
- `docs/INVARIANTS.md` — Rempli à la phase 1 (Décision)
- `docs/ARCHITECTURE.md` — Rempli à la phase 6 (Modèle)
- `docs/TDD.md` — Règles TDD Red/Green/Refactor pour la chaîne bleue

## Commandes

- **"status"** → Affiche : phase en cours, nombre de prompts écrits, prochaine étape
- **"next"** → Passe à la phase suivante si la condition de passage est remplie
- **"prompts"** → Affiche un résumé du prompts/PROMPTS.md actuel
- **"check"** → Vérifie les contraintes : nb prompts, pas de code en rouge, fichiers < 200 lignes

## Critères d'évaluation (rappel)

### Journal des prompts (60%)
- Complétude : tous les prompts documentés, aucune étape sautée (/6)
- Progression : ordre rouge puis bleu respecté (/6)
- Qualité des prompts : précis, contextuels, référencent le modèle (/6)
- Esprit critique : décisions argumentées, pas d'acceptation aveugle (/6)

### Code source (40%)
- Architecture modulaire : micro-outils, responsabilité unique (/4)
- Invariants respectés : state machine, stock atomique, promos incompatibles (/4)
- Indépendance des composants : autonomes, interfaces claires (/4)
- Composition : orchestrateur sans logique métier (/4)

## Erreurs éliminatoires à éviter

- ❌ Aucun journal de prompts rendu
- ❌ Le premier prompt génère du code
- ❌ Un fichier monolithique > 200 lignes
- ❌ Aucune séparation en composants
