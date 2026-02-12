# Structure de prompt recommandée

Chaque prompt doit contenir 4 blocs :

1. **Contexte** — phase actuelle, références aux docs
2. **Contraintes** — ce que l'IA ne doit PAS faire
3. **Demande** — ce que l'IA DOIT faire
4. **Format attendu** — comment structurer la réponse

## Exemple complet (tiré du projet)

```
Contexte :
Phase Génération (chaîne bleue). ON CODE.
Réf : docs/ARCHITECTURE.md, docs/TDD.md

Contraintes :
- Ne corrige rien sans mon accord explicite
- Un seul composant : stock-manager.ts
- Les 63 tests existants doivent passer

Demande :
En suivant le cycle TDD de docs/TDD.md, génère
stock-manager.ts avec les tests.

Format attendu :
- RED : liste des tests écrits
- GREEN : code minimal
- REFACTOR : simplifications
- Terminer par : X/X tests passent
```

## Erreurs courantes
- Oublier "Contraintes" → l'IA fait ce qu'elle veut
- Oublier "Réf" → l'IA invente au lieu de lire les docs
- Oublier "Format attendu" → réponses incohérentes
