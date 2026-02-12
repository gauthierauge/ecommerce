# Chain of Thought — Raisonnement visible

## Principe
L'IA doit montrer son raisonnement étape par étape.
Une conclusion sans raisonnement est invérifiable.
L'utilisateur ne peut challenger que ce qu'il voit.

---

## Quand exiger un chain-of-thought

### Obligatoire
- Validation ou invalidation d'une hypothèse
- Analyse d'impact d'un changement
- Dry run d'un scénario
- Recherche de bugs ou de failles
- Calcul de remboursement, de stock, de total

### Pas nécessaire
- Création mécanique d'un fichier
- Mise à jour d'imports
- Réponse factuelle simple

---

## Format imposé

### Étape par étape numéroté
Raisonnement :

[Fait observé] → [conséquence]
[Fait observé] → [conséquence]
[Contradiction ou confirmation] → [conclusion]

Conclusion : [résultat]
Confiance : haute / moyenne / basse
Si basse : "je ne suis pas sûr parce que [raison]"

---

## Les 3 niveaux de chain-of-thought

### Niveau 1 — Vérification simple
"L'invariant I3 est-il couvert ?"

I3 = promos incompatibles rejetées
Je cherche dans tests/ → compatibility-checker.test.ts
Test "rejects incompatible promotions" → vérifie que
PROMO_A + PROMO_B retourne une erreur
Conclusion : I3 couvert ✅
Confiance : haute (test trouvé et nommé)


### Niveau 2 — Analyse d'impact
"Que se passe-t-il si on ajoute adjustReservation ?"

adjustReservation modifie stock-manager.ts
IStockManager dans types.ts doit être étendu
Les composants qui utilisent IStockManager :

order-orchestrator.ts (L23) → pas impacté (n'utilise
que reserve et release)
expiration-checker.ts (L15) → pas impacté
partial-cancellation-handler.ts (L42) → pas impacté


Les tests existants : 109 tests, aucun n'appelle
adjustReservation → pas de régression
Conclusion : modification sûre, 2 fichiers touchés
Confiance : haute (imports vérifiés)


### Niveau 3 — Dry run complet
"Que se passe-t-il si on retire B d'une commande {A, B, C} ?"

État initial : {A:50€, B:30€, C:20€}, promo -10%
Subtotal = 100€, discount = 10€, total payé = 90€
Retrait de B → remainingItems = {A:50€, C:20€}
Recalcul : subtotal = 70€, promo -10% = 7€
Nouveau total = 63€
Refund = 90€ - 63€ = 27€
Vérification I13 : 27 = 90 - 63 ✅
Vérification I17 : 27 ≥ 0 ✅
Conclusion : refund de 27€
Confiance : haute (chiffres vérifiés)


---

## Pièges à éviter

### Le raccourci
L'IA saute des étapes : "évidemment le total est 63€."
→ Montrer le calcul : 70 × 0.9 = 63€

### La conclusion sans raisonnement
"L'option A est meilleure."
→ Pourquoi ? Par quel raisonnement ?

### Le raisonnement circulaire
"C'est la bonne approche parce que c'est l'approche
recommandée."
→ Recommandée par qui ? Sur quels critères ?

### Le faux chain-of-thought
L'IA numérote des affirmations mais ne les connecte pas :
"1. Le stock est géré. 2. Les promos sont gérées. 3. Donc
tout fonctionne."
→ Chaque étape doit découler de la précédente ou la
contredire.

---

## Leçons du projet

### P6 cycle 2 — Dry run qui découvre I17
Le raisonnement pas à pas a révélé que retirer un
article peut faire AUGMENTER le total (perte de promo
conditionnelle). Sans dry run chiffré, ce cas aurait
été manqué.

### P18 cycle 1 — Chiffres contre intuition
"Deux promos -20% sur 100€ : brut = 60€, cascade = 64€."
L'IA avait implémenté le brut. Le chain-of-thought
chiffré a prouvé que c'était faux. Le raisonnement
visible est le seul moyen de contredire l'IA.

### H10 cycle 3 — Analyse d'atomicité
Le raisonnement étape par étape a montré qu'entre
release() et reserve(), un autre appelant pouvait
prendre le stock. Conclusion : adjustReservation
atomique nécessaire. Sans le chain-of-thought,
l'intuition aurait dit "ça marchera".
