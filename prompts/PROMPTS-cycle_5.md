# Journal des Prompts — Cycle 5 : Audit et consolidation

> **Stack** : TypeScript + Vitest
> **Agent IA** : Claude Code
> **Méthodologie** : Wardley Map — Chaîne Rouge puis Chaîne Bleue
> **Base** : 4 cycles, 14 composants, 123 tests, 23 invariants
> **Objectif** : Challenger l'existant — trouver ce qu'on a raté

---

# 🔴 Chaîne Rouge — Penser avant de produire

---

## Phase : Décision

### P1 - Audit des invariants et edge cases manquants

**Prompt :**
```
Contexte :
Cycle 5 — Audit du projet complet. Phase Décision.
Pas de code.
Réf : docs/cycle-1/INVARIANTS.md (I1-I12),
docs/cycle-2/INVARIANTS.md (I13-I18),
docs/cycle-3/ (I19-I23),
tous les fichiers src/ et tests/

Demande :
Joue le rôle d'un auditeur externe qui découvre le projet.
Relis TOUS les invariants I1-I23 et cherche :

1. INVARIANTS MANQUANTS — des règles métier qui devraient
   être protégées mais ne le sont pas. Pense à :
   - Que se passe-t-il si le panier est vide ?
   - Que se passe-t-il si un prix est négatif ?
   - Que se passe-t-il si deux commandes utilisent
     le même panier ?
   - Que se passe-t-il si une promo est appliquée
     deux fois ?
   - Que se passe-t-il après expédition ? (retour, litige)

2. INVARIANTS FAIBLES — des invariants documentés mais
   insuffisamment protégés (un seul test, pas de test
   de boundary)

3. EDGE CASES NON TESTÉS — des scénarios S1-S9 qui
   méritent plus de tests ou des scénarios nouveaux

4. INCOHÉRENCES ENTRE CYCLES — des décisions du cycle 1
   qui contredisent les cycles 2-3

Pour chaque problème : description, gravité (critique /
important / mineur), invariant impacté ou nouveau.
```
