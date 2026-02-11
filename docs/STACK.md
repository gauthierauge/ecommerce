# Stack technique

## Choix : TypeScript pur + Vitest

### Langage : TypeScript

**Pourquoi TypeScript :**
- Typage fort → idéal pour modéliser un domaine riche (union types pour la machine à états, interfaces pour les contrats entre composants)
- L'exercice demande du domaine pur (pas d'API, pas d'UI) → pas besoin de framework
- Familiarité de l'équipe avec l'écosystème JS/TS

**Pourquoi PAS de framework (Express, Nest, etc.) :**
- L'énoncé ne demande aucune couche HTTP
- Ajouter un framework serait du YAGNI
- Le domaine doit être testable sans infrastructure

### Tests : Vitest

**Pourquoi Vitest :**
- Support natif TypeScript (pas de config supplémentaire)
- API compatible Jest (familiarité)
- Rapide (basé sur Vite)
- Coverage intégré

### Ce qu'on n'utilise PAS (et pourquoi)

| Technologie | Raison du rejet |
|-------------|----------------|
| React/Vue | Pas d'UI demandée → YAGNI |
| Express/Fastify | Pas d'API HTTP demandée → YAGNI |
| Base de données | Stockage en mémoire suffisant pour l'exercice |
| ORM (Prisma, etc.) | Pas de persistence → YAGNI |
| Symfony/PHP | Un seul langage suffit, TS mieux typé pour le domaine |
