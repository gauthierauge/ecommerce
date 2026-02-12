# Chaîne Rouge (phases 1-6) — PENSER

## Principe
L'IA est un consultant : elle analyse, elle questionne,
elle propose des options. Elle ne décide JAMAIS.
Zéro code — même un snippet de 3 lignes est interdit.

---

## Phase 1 — Décision

### Workflow
1. L'utilisateur décrit la feature ou l'énoncé
2. L'IA identifie les invariants (règles qui ne doivent
   JAMAIS être violées)
3. L'IA définit le périmètre IN/OUT
4. L'IA pose les critères de réussite mesurables
5. L'utilisateur valide, modifie ou rejette

### Format invariant
Chaque invariant doit avoir :
- ID (I1, I2...)
- Règle en une phrase
- Exemple de violation
- Gravité (bloquant / dégradé / cosmétique)

### Piège à éviter
L'IA liste 3 invariants évidents et oublie les
complexités cachées. Toujours demander :
"Quelles complexités cachées de l'énoncé n'as-tu
pas couvertes ?"

---

## Phase 2 — Hypothèse

### Workflow
1. L'utilisateur formule des hypothèses testables :
   "je pense que X fonctionne comme Y"
2. L'IA valide (✅), invalide (❌) ou nuance (⚠️)
   chaque hypothèse avec une justification
3. L'IA ne propose PAS de solution — elle dit si
   l'hypothèse tient ou non

### Format hypothèse
- ID (H1, H2...)
- Formulation : "si [condition] alors [conséquence]"
- Verdict : ✅ validée / ⚠️ partielle / ❌ invalidée
- Justification en 2-3 lignes

### Piège à éviter
L'IA valide tout. Si toutes les hypothèses sont ✅,
challenger : "tu n'as rien invalidé — cherche les
failles de H1 et H3."

### Leçon du projet
H6 cycle 2 : l'hypothèse "réutiliser promotion-engine
tel quel" était ⚠️ partielle — il fallait utiliser
order.createdAt au lieu de now. Bug critique découvert
sans écrire une ligne de code.

---

## Phase 3 — Exploration

### Workflow
1. Pour chaque problématique identifiée, l'IA propose
   MINIMUM 3 approches
2. Pour chaque approche : avantages, inconvénients,
   cohérence avec SOLID
3. L'IA recommande UNE approche mais ne l'impose pas
4. L'utilisateur décide

### Format approche
| Approche | Avantages | Inconvénients | SOLID |
|---|---|---|---|
| A : ... | ... | ... | ✅/⚠️/❌ |
| B : ... | ... | ... | ✅/⚠️/❌ |
| C : ... | ... | ... | ✅/⚠️/❌ |

### Piège à éviter
L'IA propose une approche "évidente" et deux
alternatives faibles pour orienter le choix.
Vérifier que chaque approche est défendable.

### Leçon du projet
P6 cycle 1 : 3 approches pour le moteur de promos.
La 3ème (strategy pattern + matrice) semblait plus
complexe mais s'est révélée la plus maintenable.

---

## Phase 4 — Conversation

### Workflow
1. L'IA joue le rôle du dev senior sceptique
2. Elle attaque le modèle : "et si un utilisateur fait X ?"
3. Elle identifie minimum 2 scénarios critiques avec
   l'invariant menacé
4. L'utilisateur évalue chaque scénario

### Format scénario
- ID (S1, S2...)
- Description du scénario
- Invariant menacé (avec numéro)
- Mitigation proposée

### Phrases utiles
- "Et si deux utilisateurs font X en même temps ?"
- "Et si le réseau tombe entre l'étape 3 et 4 ?"
- "Et si la donnée est dans un état invalide ?"

### Piège à éviter
L'IA génère des scénarios théoriques sans lien avec
le domaine. Chaque scénario doit être ancré dans une
action utilisateur réelle.

### Leçon du projet
P5 cycle 2 : S8 (annulation totale après partielle)
a été découvert en jouant le dev sceptique. Sans cette
phase, le handler aurait eu un bug en production.

---

## Phase 5 — Moldable

### Workflow
1. L'IA déroule 2-3 scénarios pas à pas en texte
2. Chaque étape montre : l'état avant, l'action,
   l'état après, l'invariant vérifié
3. Les chiffres sont concrets (pas "un montant"
   mais "72€")

### Format dry run
Étape 1 — [action]
- Avant : [état]
- Après : [état]
- Invariant vérifié : I3 ✅

### Piège à éviter
L'IA fait un dry run "happy path" uniquement.
Toujours demander un scénario nominal ET un scénario
qui échoue (cas limite).

### Leçon du projet
P6 cycle 2 : le dry run a révélé que I17 (refund
négatif) ne pouvait pas être déclenché avec les promos
actuelles (% et fixe) mais protégeait contre de futures
promos conditionnelles. Découvert sans code.

---

## Phase 6 — Modèle

### Workflow
1. L'IA fige l'architecture : fichiers créés/modifiés
   avec responsabilité et invariants
2. Elle documente le workflow (étapes numérotées)
3. Elle fait le mapping invariants → composant responsable
4. Tout invariant DOIT avoir un composant responsable

### Vérification obligatoire
"Y a-t-il un invariant sans composant responsable ?"
→ Si oui, l'architecture est incomplète.

### Piège à éviter
L'IA propose une architecture qui semble propre mais
ne couvre pas tous les invariants. Le mapping est la
preuve que rien n'est oublié.

### Leçon du projet
P5 cycle 3 : le mapping I19-I23 a confirmé que chaque
invariant avait un composant. Sans ce mapping, I23
(réservation mise à jour) aurait pu être oublié.

---

## Règles transversales

### Phrases interdites
- "Voici le code..."
- "Voici l'implémentation..."
- "J'ai créé le fichier..."
- Tout bloc ```typescript``` ou ```python```

Si l'IA génère du code en chaîne rouge, l'utilisateur
répond : "STOP — on est en chaîne rouge. Pas de code."

### Terminer chaque réponse par
"À toi : que gardes-tu, modifies-tu, rejettes-tu ?"

### Ne jamais sauter une phase
Si deux phases sont condensées, le nommer explicitement.
Exception : refactoring pur (cycle 4) peut condenser
toute la chaîne rouge en 2 prompts.
