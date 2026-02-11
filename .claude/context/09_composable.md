# Phase 9 — Composable Micro Tools

> Chaîne Bleue 🔵 | Minimum 2 prompts

## Objectif

Vérifier que chaque composant est autonome, a une responsabilité unique,
et que les dépendances passent par des interfaces claires.

## Checklist de vérification

### Pour chaque composant, vérifier :

**1. Responsabilité unique (SRP)**
- [ ] Le composant fait UNE chose
- [ ] Son nom décrit exactement ce qu'il fait
- [ ] Si on le supprime, un seul aspect du système est affecté

**2. Autonomie**
- [ ] Le composant peut être testé sans les autres
- [ ] Le composant peut être remplacé sans toucher aux autres
- [ ] Le composant n'a pas de dépendance directe (import) vers un autre composant concret

**3. Interfaces claires**
- [ ] Les dépendances sont injectées (pas d'imports directs)
- [ ] Les contrats entre composants sont des interfaces/types TypeScript
- [ ] Un composant ne connaît que les interfaces, pas les implémentations

### Tests de composabilité

Demander à l'IA de vérifier :
- "Puis-je utiliser le moteur de promotions sans la machine à états ?"
- "Puis-je remplacer le stockage de stock (mémoire → DB) sans toucher au reste ?"
- "Puis-je ajouter un nouveau type de promotion sans modifier le code existant ?"

Si la réponse est non → il y a un couplage à casser.

## Rappels

- ✅ C'est la phase anti-monolithe
- ✅ Chaque couplage trouvé et cassé = points sur "indépendance des composants" (/4)
- ✅ Le barème dit "pas de couplage fort" et "interfaces claires entre briques"

## Condition de passage

- [ ] Chaque composant a une responsabilité unique vérifiée
- [ ] Chaque composant peut fonctionner indépendamment
- [ ] Les dépendances passent par injection + interfaces
- [ ] Tests de composabilité validés
- [ ] Validation explicite de l'utilisateur
