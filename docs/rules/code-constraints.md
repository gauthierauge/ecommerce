# Contraintes de Code et Tests

## Principe
Ces contraintes sont non négociables. Elles ont été
établies au cycle 1 et validées sur 4 cycles. L'IA
ne peut pas les contourner, même si elle pense qu'une
exception est justifiée.

---

## Fichiers

### Taille
- Aucun fichier > 200 lignes (src/ ET tests/)
- Si un fichier dépasse 150 lignes → alerter l'utilisateur
- Si un fichier dépasse 180 lignes → proposer un découpage
- Seuil actuel du projet : max 190 lignes

### Organisation
- Un composant = un fichier src/ + un fichier test/
- Les noms de fichiers reflètent la responsabilité unique
- Pas de fichier fourre-tout (utils.ts, helpers.ts, misc.ts)

---

## Code

### Domaine pur
- Zéro framework (pas de Express, React, NestJS...)
- Zéro base de données (pas de Prisma, TypeORM...)
- Zéro I/O (pas de fetch, fs, console.log dans src/)
- Le code est testable sans infrastructure

### Patterns obligatoires
- **Result<T, E>** pour les erreurs — jamais de throw
  dans la logique métier
- **Injection de dépendances** — jamais d'import direct
  entre composants, passer les deps en paramètre
- **Fonctions pures** — même entrée → même sortie,
  pas d'état global mutable
- **Immutabilité** — ne jamais modifier un objet reçu
  en paramètre, retourner un nouvel objet

### Patterns interdits
- throw dans la logique métier (utiliser err())
- Singleton ou état global
- any dans les types (toujours typer explicitement)
- console.log dans src/ (uniquement dans les tests si debug)
- new Date() en dur (injecter now en paramètre)

### Leçon du projet
D6 cycle 2 : `new Date()` dans le handler rendait le
code non testable. Corrigé en injectant `now` en
paramètre. Toute dépendance au temps doit être injectée.

---

## Tests

### Framework
- Vitest uniquement
- Pas de mocks sauf exception justifiée
  (ex: timer pour l'expiration)
- Les tests e2e utilisent les vrais composants

### Cycle TDD strict
1. **RED** — écrire les tests d'abord, ils doivent échouer
2. **GREEN** — code MINIMAL pour faire passer les tests
3. **REFACTOR** — simplifier sans casser les tests

L'IA ne saute JAMAIS le RED. Elle montre les tests
avant d'écrire le code.

### Couverture
- Seuil minimum : 95% statements
- Objectif : 99%+ (atteint sur ce projet : 99.54%)
- Chaque invariant (I1, I2...) doit avoir au moins
  un test dédié
- Chaque scénario critique (S1, S2...) doit avoir
  un test dédié

### Nommage des tests
- describe → nom du composant
- it → décrit le comportement attendu en français
- Référencer l'invariant dans le nom si applicable :
  `it('rejette les promos incompatibles (I3)')`

### Structure d'un test
it('description du comportement (I-XX)', () => {
// ARRANGE — préparer les données
// ACT — exécuter l'action
// ASSERT — vérifier le résultat
});

### Tests de régression
- Avant chaque vitest run, noter le nombre de tests attendus
- Après, vérifier : "N anciens + M nouveaux = X total"
- Si un test ancien casse → STOP, analyser avant de continuer
- Ne jamais modifier un test ancien pour faire passer
  du nouveau code (sauf si l'ancien test était faux)

### Leçons du projet
- T2 code review : le boundary `expiresAt === now` n'était
  pas testé. Un test de 3 lignes a suffi à couvrir le cas.
- P12 cycle 1 : la vérification mapping invariants → tests
  a confirmé 12/12. Sans cette étape, on aurait pu croire
  que tout était couvert.
- P9 cycle 2 : 8 tests pour partial-cancellation-handler
  couvrant I14-I18 et S7-S9. Chaque invariant = au moins
  un test.

---

## Orchestrateurs

### Règle
Un orchestrateur (order-orchestrator, partial-cancellation-handler,
quantity-modifier) ne contient AUCUNE logique métier.

Il fait uniquement :
1. Valider les préconditions
2. Appeler les composants dans l'ordre
3. Assembler le résultat

### Vérification
Si l'orchestrateur contient un `if` qui n'est pas une
validation d'état ou une vérification d'erreur Result →
la logique doit être extraite dans un composant dédié.

### Leçon du projet
order-orchestrator.ts séquence 7 composants sans calculer
de prix, vérifier de stock, ou appliquer de promo. Chaque
responsabilité est déléguée.

---

## Résumé des chiffres de référence

| Contrainte | Seuil | Projet actuel |
|---|---|---|
| Fichier max | 200 lignes | 190 |
| Coverage stmts | > 95% | 99.54% |
| Coverage branches | > 90% | 98.41% |
| Tests par composant | ≥ 1 | 14 src → 14 test |
| Invariants couverts | 100% | 23/23 |
| throw dans src/ | 0 | 0 |
| any dans types | 0 | 0 |
| Mocks dans tests | minimum | 0 |
