# Chaîne Bleue (phases 7-10) — PRODUIRE

## Principe
L'IA est un ouvrier qualifié : elle exécute le plan de la
chaîne rouge. Elle ne prend AUCUNE initiative architecturale.
Si elle voit un problème, elle le signale — elle ne le corrige pas.

---

## Phase 7 — Génération

### Workflow par prompt
1. L'utilisateur nomme UN composant + ses invariants
2. L'IA écrit les tests RED (montrés à l'utilisateur)
3. L'utilisateur valide les tests
4. L'IA écrit le code GREEN minimal
5. L'IA lance vitest run
6. L'IA propose un refactor SI les tests passent

### Contraintes
- Un prompt = un composant = un fichier src/ + un fichier test/
- Le composant doit être dans docs/ARCHITECTURE.md — sinon
  demander "ce composant n'est pas dans l'architecture, on l'ajoute ?"
- Chaque test doit référencer un invariant (I1, I2...)
- Fichier < 200 lignes — si dépassé, découper et demander

---

## Phase 8 — Specific Coding

### Workflow
1. L'IA relit le code généré en phase 7
2. Elle liste les **décisions implicites** (D1, D2...)
   avec : fichier, ligne, ce qui a été décidé, l'alternative
3. L'utilisateur décide pour chaque D
4. L'IA applique UNIQUEMENT les corrections validées

### Signaux de décision implicite
- Un hardcode (valeur en dur au lieu d'une injection)
- Un type plus large que nécessaire
- Une duplication entre deux composants
- Un cas non géré retourné silencieusement
- Un import non utilisé

### Piège à éviter
Au P17 du cycle 1, l'IA a corrigé D1, D2, D4 dans le même
prompt que l'analyse. L'utilisateur n'a pas pu valider chaque
correction individuellement.
→ TOUJOURS séparer l'analyse des corrections.

---

## Phase 9 — Composable

### Vérification
- Chaque composant fonctionne SANS les autres
- Les tests unitaires n'importent qu'un seul composant
- Pas de dépendance circulaire
- L'injection de dépendances est utilisée partout

### Question de contrôle
"Si je supprime le composant X, quels tests cassent ?"
→ Seuls les tests de X doivent casser.

---

## Phase 10 — System

### Vérification
- L'orchestrateur assemble les composants
- Il ne contient AUCUNE logique métier — uniquement du séquencement
- Les tests e2e utilisent les vrais composants (pas de mocks)
- Le coverage global est > 95%

### Vérification finale obligatoire
1. vitest run --coverage
2. Mapping invariants → tests (tous couverts ?)
3. Aucun fichier > 200 lignes
4. Nombre total de tests avant/après

---

## Phrases obligatoires dans chaque prompt
- "Réf : docs/ARCHITECTURE.md" (ou le doc pertinent)
- "Contrainte : les N tests existants doivent passer"
- "Vitest run après"
- "Ne corrige rien sans mon accord explicite"

## Phrases interdites (signaux de dérapage)
- "J'ai aussi corrigé..." → correction non demandée
- "J'en ai profité pour..." → hors périmètre
- "Tant qu'à faire..." → scope creep
- "Tout gardé" → manque d'esprit critique

Si l'IA utilise une phrase interdite, l'utilisateur répond :
"STOP — tu as dépassé le périmètre. Annule et propose."

---

## Leçons du projet
- P17 : l'IA corrige sans demander → "propose, ne fais pas"
- P18 : contredire avec des chiffres → meilleur pattern
- B1 : bug trouvé en code review → relecture obligatoire
- Cycle 3 : adjustReservation justifié par H10 → toute
  modification de cycle précédent doit être justifiée par
  une hypothèse validée
