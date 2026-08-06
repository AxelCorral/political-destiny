# audit-results/post-fix — Snapshot après corrections (Phase 7)

Instantané des mesures statistiques après l'implémentation complète des corrections P1–P7 de `PROMPT_CLAUDE_CODE_CORRECTIONS_POST_AUDIT.md`. Généré par la dernière exécution complète de `npm run audit:game` de la mission (commit `0680ca1`, avant les corrections P4 purement documentaires qui ne modifient aucune donnée simulée).

## Paramètres

Identiques à la baseline (`audit-results/pre-fix-baseline/README.md`), pour permettre une comparaison directe :

- `AUDIT_SEEDS_PER_COMBO=60` (défaut) — 60 graines par combinaison (parti × agent).
- `AUDIT_INCLUDE_CUSTOM=1` (défaut) — grille de partis personnalisés incluse.
- `AUDIT_CUSTOM_SEEDS=30` (défaut).
- Préfixe de graine : `post-audit-{seedIndex}` (identique à la baseline).

## Graines

Mêmes graines principales que la baseline (`post-audit-0` à `post-audit-59` par combinaison parti×agent), pour que les écarts mesurés reflètent les corrections, pas un tirage différent.

## Agents

8 agents de `scripts/audit-post/lib/agents.ts` (`aleatoire`, `prudent`, `risque`, `ideologiquement_coherent`, `opportuniste_electoral`, `parti_dabord`, `mediatique`, `contrarien`) — voir le commentaire d'en-tête de ce fichier (ajouté en P4) pour la distinction avec le jeu d'agents plus large de `scripts/audit/simulation-audit.ts`.

## Fichiers

- `summary.json` — copie de `audit-results/summary.json` au moment de la génération (5280 parties, 4320 existantes + 960 personnalisées, 0 erreur).
- `variance-decomposition.csv` — décomposition ANOVA à deux facteurs (parti × agent) sur les cinq métriques : score 1er tour, score final, progression brute, progression normalisée (P1), sur/sous-performance vs baseline neutre (P1).
- `second-round-report.csv` — rapport par parti du second tour (P5) : qualification, victoire, victoire conditionnelle, rejet moyen, crédibilité moyenne, distance idéologique à l'adversaire.
- `duel-matrix.csv` — matrice des duels de second tour, parti A contre parti B (P5).
- `catalog-summary.json` — audit statique du catalogue d'événements (P2/P3) : `eventsAffectingOpponent`, unicité textuelle, faux dilemmes, triptyque classique.

Les fichiers volumineux (`raw-runs.csv`, `decisions.csv`, `world-events.csv`, `ideology-trajectories.csv`, `repetition-by-run.csv`, `counterfactuals.csv`, `choice-similarity.csv`, `consequence-similarity.csv`) ne sont **pas dupliqués** dans ce dossier : la racine `audit-results/` est déjà, au moment de ce commit, l'état post-corrections (contrairement à `audit-results/pre-fix-baseline/`, qui est une archive figée d'un état antérieur). Voir ces fichiers directement à la racine de `audit-results/`.

## Reproduction

```bash
npm run audit:game
```

Régénère l'intégralité de `audit-results/` (y compris les fichiers listés ci-dessus, avant copie manuelle dans `post-fix/`) à partir du code actuel. Déterminisme vérifié : mêmes graines + mêmes décisions ⇒ mêmes résultats (contrôlé par `npm run audit:smoke`, qui rejoue chaque campagne deux fois et compare `party.slice(0,3)`).

## Limites

- `summary.json` et les CSV de ce dossier sont un instantané pris après le commit `0680ca1` (fin P2). Les commits P4 (`c1e7547`) et le nettoyage de formatage (`4988936`) qui suivent ne modifient aucune donnée simulée (P4 est documentaire, le nettoyage est cosmétique) — ce dossier reste donc représentatif de l'état final du dépôt à la fin de cette mission.
- Voir `COMPARISON.md` dans ce même dossier pour le tableau avant/après obligatoire (§30-31 du prompt) et `POST_AUDIT_FIXES.md` à la racine du dépôt pour le diagnostic et les décisions de conception détaillées de chaque correction.
