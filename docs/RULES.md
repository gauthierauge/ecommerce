# Règles Absolues — Structurer l'IA avec Wardley Map

## Chaîne Rouge (phases 1-6) — PENSER

### Interdit
- Générer du code (même un snippet, même un exemple)
- Créer des fichiers dans src/ ou tests/
- Choisir une solution — tu proposes, le développeur décide
- Passer à la phase suivante sans accord explicite

### Autorisé
- Texte, tableaux, diagrammes texte, pseudocode
- Identifier des invariants, hypothèses, failles
- Comparer des approches (minimum 3 par problématique)

### Format de réponse
- Terminer par : "À toi : que gardes-tu, modifies-tu, rejettes-tu ?"

---

## Chaîne Bleue (phases 7-10) — PRODUIRE

### Interdit
- Corriger du code sans accord explicite
- Générer plus d'un composant par prompt
- Ignorer le cycle TDD (Red → Green → Refactor)
- Modifier un fichier hors périmètre du prompt

### Autorisé
- Écrire les tests RED d'abord
- Écrire le code GREEN minimal
- Refactorer si les tests passent
- Proposer des corrections (sans les appliquer)

### Format de réponse
- Montrer les tests avant le code
- Lancer vitest run à la fin
- Terminer par le nombre de tests

---

## Minimum 2 prompts par phase

Chaque phase (Décision, Hypothèse, Exploration, etc.) doit
contenir au minimum 2 prompts :

- **Prompt 1** — la demande principale
- **Prompt 2** — le challenge

Le prompt 2 sert à :
- Contredire ou challenger la réponse du prompt 1
- Chercher les failles, les cas oubliés, les hypothèses implicites
- Demander "qu'est-ce que tu as manqué ?" ou "je ne suis pas
  d'accord avec X, voici pourquoi"

### Pourquoi c'est obligatoire

Sans challenge, on accepte aveuglément la première réponse.
Les meilleures découvertes du projet sont venues du 2ème prompt :
- P2 cycle 1 → périmètre IN/OUT affiné
- P8 cycle 1 → scénario S6 (modification panier) découvert
- P2 cycle 2 → I18 (annulations successives) découvert
- P18 cycle 1 → correction D3 (cascade promos) imposée

### Exception

Les phases condensées (Moldable + Modèle en un seul prompt)
sont acceptables si le cycle est court et que la feature est
bien comprise. Mais le challenge doit quand même apparaître
dans le prompt (ex: "joue le dev senior sceptique").

---

## Anti-hallucination

- Si tu n'es pas sûr → dis "je ne suis pas sûr"
- Ne fabrique pas d'exemples absents du code
- Cite les numéros d'invariants exacts (docs/INVARIANTS.md)
- Cite les lignes exactes quand tu parles du code
- Si un invariant n'existe pas dans les docs, propose
  de l'ajouter — ne l'invente pas

---

## Structure de prompt recommandée

Chaque prompt doit contenir 4 blocs :

1. **Contexte** — phase actuelle, références aux docs
2. **Contraintes** — ce que l'IA ne doit PAS faire
3. **Demande** — ce que l'IA DOIT faire
4. **Format attendu** — comment structurer la réponse

---

## Règle d'or

> Plus tu donnes de contraintes explicites à l'IA,
> moins elle improvise. Chaque dérapage est un
> garde-fou manquant dans le prompt.
