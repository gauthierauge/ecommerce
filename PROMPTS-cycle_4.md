# Journal des Prompts — Cycle 4 : Réorganisation en dossiers

> **Stack** : TypeScript + Vitest
> **Agent IA** : Claude Code
> **Méthodologie** : Wardley Map — Chaîne Rouge puis Chaîne Bleue
> **Base** : 14 fichiers src/, 123 tests, cycles 1-3 terminés
> **Contexte** : Au P12 du cycle 1, la réorganisation en dossiers
> avait été rejetée (YAGNI pour 10 fichiers, seuil 15-20).
> Avec 14 fichiers et 3 cycles, le seuil est atteint.

---

# 🔴 Chaîne Rouge — Penser avant de produire

---

## Phase : Décision

### P1 - Décision de réorganisation : YAGNI atteint ?

**Prompt :**

```
Contexte :
Cycle 4 — Refactoring : réorganisation de src/ en sous-dossiers.
Phase Décision. Pas de code.
Réf : P12 cycle 1 (rejeté YAGNI pour 10 fichiers, seuil 15-20)

Aujourd'hui : 14 fichiers src/, 3 cycles, 3 domaines distincts
(commande, remboursement, modification quantité).

Demande :
1. Le seuil YAGNI est-il atteint ? Justifie avec des métriques
   (nombre de fichiers, cohésion par domaine, difficulté à
   trouver un fichier)

2. Propose 2 organisations possibles :
   A : Par responsabilité technique (core, handlers, pricing...)
   B : Par domaine métier (order, stock, promotion, refund...)
   Pour chaque : avantages, inconvénients, cohérence avec SOLID

3. Risques du refactoring : quels fichiers cassent ? Combien
   d'imports à mettre à jour ? Les tests sont-ils impactés ?

4. Critère de réussite : 123 tests toujours verts après
```

**Résumé de la réponse :** Seuil YAGNI atteint : 15 fichiers, 4 domaines, 3 cycles. Option A (technique) rejetée — faible cohésion, `handlers/` fourre-tout. Option B (domaine) retenue — haute cohésion, fichiers qui changent ensemble dans le même dossier. `types.ts` reste à la racine. ~80 imports à modifier, zéro logique changée. Risque principal : imports cassés (mitigé par rechercher-remplacer + vitest).

**Décision :** Option B validée. L'argument de cohésion est décisif : au cycle 2, seul `refund/` aurait été touché, au cycle 3 seuls `refund/` et `stock/`. Le seul point à trancher : `abandoned-cart.ts` seul dans `cart/` ou intégré dans `order/`. Je penche pour `order/` — un panier abandonné est un pré-order, pas un domaine à part. À confirmer en P2.

---

## Phase : Conversation

### P2 - Risques et structure finale de la réorganisation

**Prompt :**

```
Contexte :
Cycle 4, phases Conversation + Modèle condensées. Pas de code.
Réf : P1 cycle 4, Option B

1. CONVERSATION — Joue le dev senior sceptique :
   Quels risques concrets dans cette réorganisation ?
   - Un import oublié qui compile mais pointe vers le
     mauvais fichier ?
   - Un test qui importe depuis l'ancien chemin et passe
     silencieusement car le fichier existe encore ?
   - Les barrel exports (index.ts) sont-ils nécessaires
     ou c'est du YAGNI ?

2. MODÈLE — Fige la structure finale :
   - Liste chaque fichier avec son nouveau chemin
   - Liste chaque fichier de test avec son import mis à jour
   - Confirme : abandoned-cart dans order/ ou dossier seul ?
   - Faut-il réorganiser tests/ aussi ou garder flat ?
```

**Résumé de la réponse :** 4 risques analysés. Import cassé → détecté au build (TypeScript strict). Fichier fantôme → mitigé par `git mv`. Barrel exports → YAGNI rejeté. Imports cross-dossier → aucun (les 2 imports internes restent dans `refund/`). Structure figée : 4 dossiers (order/ 5 fichiers, stock/ 2, pricing/ 3, refund/ 3), types.ts à la racine, tests flat. `abandoned-cart` dans `order/` confirmé.

**Décision :** Structure finale validée. Barrel exports rejetés — YAGNI pur (pas de consommateur externe). Tests restent flat car 15 fichiers n'atteignent pas le seuil. Le risque principal (fichier fantôme) est éliminé par `git mv` + vérification `ls src/*.ts` post-migration. L'absence d'imports cross-dossier (hors types.ts) est un bon signe architectural — les domaines sont bien découplés.

---

# 🔵 Chaîne Bleue — Produire avec maîtrise

---

## Phase : Génération

_Objectif : générer le code composant par composant, jamais en bloc._

### P3 - Exécution de la réorganisation par domaine métier

**Prompt :**
```
Contexte :
Cycle 4, chaîne bleue. Refactoring pur.
Réf : P2 structure finale

Demande :
1. Crée les dossiers src/order/, src/stock/, src/pricing/, src/refund/

2. Déplace chaque fichier avec git mv :
   - order/ : order-orchestrator, order-state-machine,
     cart-validator, payment-handler, abandoned-cart
   - stock/ : stock-manager, expiration-checker
   - pricing/ : promotion-engine, compatibility-checker,
     total-calculator
   - refund/ : refund-calculator, partial-cancellation-handler,
     quantity-modifier
   - types.ts reste à la racine de src/

3. Mets à jour tous les imports dans src/ :
   ./types → ../types

4. Mets à jour tous les imports dans tests/ :
   ../src/X → ../src/dossier/X

5. Vérifie qu'aucun fichier .ts ne reste dans src/ flat
   (sauf types.ts)

6. vitest run — 123 tests doivent passer

Ne change AUCUNE logique. Uniquement des déplacements et
des mises à jour d'imports.
```
