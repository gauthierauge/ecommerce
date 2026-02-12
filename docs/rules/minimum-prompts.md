# Minimum 2 prompts par phase

Chaque phase (Décision, Hypothèse, Exploration, etc.) doit
contenir au minimum 2 prompts :

- **Prompt 1** — la demande principale
- **Prompt 2** — le challenge

Le prompt 2 sert à :
- Contredire ou challenger la réponse du prompt 1
- Chercher les failles, les cas oubliés, les hypothèses implicites
- Demander "qu'est-ce que tu as manqué ?" ou "je ne suis pas
  d'accord avec X, voici pourquoi"

## Pourquoi c'est obligatoire

Sans challenge, on accepte aveuglément la première réponse.
Les meilleures découvertes du projet sont venues du 2ème prompt :
- P2 cycle 1 → périmètre IN/OUT affiné
- P8 cycle 1 → scénario S6 (modification panier) découvert
- P2 cycle 2 → I18 (annulations successives) découvert
- P18 cycle 1 → correction D3 (cascade promos) imposée

## Exception

Les phases condensées (Moldable + Modèle en un seul prompt)
sont acceptables si le cycle est court et que la feature est
bien comprise. Mais le challenge doit quand même apparaître
dans le prompt (ex: "joue le dev senior sceptique").

## Grille de décision

| Taille de la feature | Prompts rouge | Prompts bleu | Total |
|---|---|---|---|
| Grande (cycle 1) | 10-12 | 10-12 | 20-24 |
| Moyenne (cycle 2) | 6-8 | 4-6 | 10-14 |
| Petite (cycle 3) | 4-5 | 3-4 | 7-9 |
| Refactoring (cycle 4) | 2 | 1-2 | 3-4 |

## Quand condenser
- Feature bien comprise + peu d'invariants → condenser
  Conversation + Modèle en un prompt
- Refactoring sans logique → condenser toute la chaîne rouge
  en 1-2 prompts

## Quand NE PAS condenser
- Nouvelle feature complexe → toutes les phases séparées
- Doute sur un invariant → phase Conversation complète
- Premier cycle du projet → ne jamais condenser
