# Anti-hallucination

## Principe
L'IA ne sait pas ce qu'elle ne sait pas. Quand elle
invente au lieu de lire, le résultat semble correct
mais est faux. Le seul remède : ancrer chaque affirmation
dans un fichier existant.

---

## Règle 1 — Citer ses sources

Chaque affirmation de l'IA doit être traçable :

| L'IA affirme... | Elle doit citer... |
|---|---|
| "L'invariant X est couvert" | Le numéro exact (I1, I2...) + le fichier de test + le nom du test |
| "Ce composant gère Y" | Le fichier exact + la ligne |
| "L'hypothèse est validée" | Le numéro (H1, H2...) + la justification dans docs/HYPOTHESES.md |
| "Ce cas est géré" | Le scénario (S1, S2...) + le test correspondant |
| "Le code fait X" | Le fichier + la ligne + le contenu de la ligne |

Si l'IA ne peut pas citer sa source → elle dit
"je ne suis pas sûr, vérifie dans [fichier]."

---

## Règle 2 — Ne rien inventer

### Interdit
- Inventer un invariant qui n'est pas dans docs/INVARIANTS.md
  → proposer de l'ajouter comme "invariant candidat"
- Inventer un test qui n'existe pas
  → lancer vitest pour vérifier
- Inventer un numéro de ligne
  → ouvrir le fichier et compter
- Affirmer "les tests passent" sans lancer vitest
  → toujours lancer avant d'affirmer
- Inventer un cas limite sans lien avec le domaine
  → ancrer dans une action utilisateur réelle

### Signaux d'hallucination
L'utilisateur doit se méfier quand l'IA :
- Cite un numéro d'invariant qui n'apparaît nulle part
- Dit "comme on l'a vu au P12" sans préciser le contenu
- Affirme "c'est déjà testé" sans nommer le test
- Utilise "généralement" ou "en principe" au lieu de
  citer un fait précis
- Répond avec certitude sur un sujet hors du projet

---

## Règle 3 — Vérification croisée

Quand l'IA affirme qu'un invariant est couvert :

### Mauvaise réponse ❌
"I3 est couvert par les tests de compatibility-checker."

### Bonne réponse ✅
"I3 est couvert par :
- tests/compatibility-checker.test.ts
- describe('checkCompatibility')
- it('rejects incompatible promotions')
  → vérifie que PROMO_A + PROMO_B retourne IncompatiblePromotionsError"

Si l'IA ne peut pas fournir ce niveau de détail :
"I3 devrait être couvert par compatibility-checker.test.ts
mais je ne suis pas sûr du nom exact du test.
Lance `npx vitest run tests/compatibility-checker.test.ts`
pour vérifier."

---

## Règle 4 — Avouer l'incertitude

### Phrases autorisées
- "Je ne suis pas sûr — vérifie dans [fichier]"
- "Je pense que c'est le cas mais lance vitest"
- "Ce n'est pas dans les docs — on l'ajoute ?"
- "Mon raisonnement : [X] mais ça pourrait être faux si [Y]"

### Phrases interdites
- "Bien sûr, c'est couvert" (sans preuve)
- "Évidemment" (masque l'incertitude)
- "Comme tout le monde sait" (appel à l'autorité)
- "C'est trivial" (minimise la complexité)

---

## Règle 5 — Réaction quand l'utilisateur détecte une hallucination

Si l'utilisateur dit "c'est faux" ou "ça n'existe pas" :

1. L'IA ne se défend PAS
2. Elle dit "tu as raison, je vérifie"
3. Elle ouvre le fichier concerné (ou lance vitest)
4. Elle corrige avec la source exacte
5. Elle ne s'excuse pas 3 fois — une correction suffit

---

## Leçons du projet

### P23 cycle 1 — Vérification finale
On a demandé le mapping exact invariant → test.
Résultat : 12/12 couverts, avec fichier et nom de test.
Si on avait accepté "oui c'est couvert" sans détail,
on aurait pu rater un trou.

### Code review — B1 ligne 31
L'IA a cité "promotion-engine.ts:31" — on a pu vérifier.
Si elle avait dit "il y a un bug dans les promos" sans
ligne, le debug aurait pris 10x plus de temps.

### H6 cycle 2 — order.createdAt
L'IA a d'abord validé H6 (✅) puis nuancé (⚠️ partielle)
en réalisant que `now` et `order.createdAt` ne sont pas
interchangeables. L'auto-correction honnête est meilleure
qu'une réponse fausse avec certitude.
