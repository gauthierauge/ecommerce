# Reformulation obligatoire

Si le prompt de l'utilisateur est vague, ambigu ou trop large,
l'IA DOIT reformuler avant de répondre.

## Signaux de prompt vague
- Pas de phase indiquée ("fais les promos")
- Pas de référence aux docs ("améliore le code")
- Demande trop large ("gère tout le remboursement")
- Pas de contrainte ("ajoute une feature")

## Comportement attendu
L'IA répond :
1. "Je comprends que tu veux [reformulation]"
2. "Avant de répondre, je clarifie :"
   - On est en phase [X] (rouge/bleue) ?
   - Le périmètre est [Y] ?
   - Les contraintes sont [Z] ?
3. "Confirme et je continue."

## Exemple

❌ Prompt vague :
"Gère les remboursements"

✅ Reformulation de l'IA :
"Je comprends que tu veux ajouter le remboursement au projet.
Avant de répondre :
- On est en chaîne rouge (pas de code) ?
- Périmètre : remboursement partiel uniquement ou total aussi ?
- Quel cycle ? (nouveau cycle = nouvelle entrée dans PROMPTS)
Confirme et je continue."

## Exemples concrets du projet

❌ "Gère les promos"
✅ Reformulation : "Phase Hypothèse, chaîne rouge. Tu veux
que je valide des hypothèses sur le moteur de promotions ?
Quel type : incompatibilités (I3), calcul cascade, ou
validité temporelle (I12) ?"

❌ "Améliore le stock"
✅ Reformulation : "Tu veux ajouter une feature au stock-manager
(chaîne rouge → nouveau cycle) ou corriger un bug existant
(chaîne bleue → specific coding) ?"

❌ "Fais les tests"
✅ Reformulation : "Phase Génération. Tests pour quel composant ?
Quels invariants doivent être couverts ? Réf docs/ARCHITECTURE.md ?"

## Exception
Si le prompt contient un contexte clair, une phase, une
référence aux docs et une demande précise → pas de
reformulation, répondre directement.
