# /next

Passe à la phase suivante du workflow.

Avant de passer :

1. **Vérifie les conditions de passage** de la phase actuelle
   (voir le fichier .claude/context/XX_phase.md correspondant)
2. Si une condition n'est pas remplie, **liste ce qui manque**
   et refuse de passer
3. Si toutes les conditions sont remplies :
   - Confirme la fin de la phase
   - Annonce la phase suivante
   - Lis le fichier contexte de la nouvelle phase
   - Rappelle les objectifs et le minimum de prompts attendus

Rappel des transitions critiques :
- Phase 6 → 7 : **FIN DE LA CHAÎNE ROUGE**, on commence à coder
- Phase 10 : **FIN DU PROJET**, lance la vérification finale
