# Baseline pré-corrections (Phase 0)

Snapshot figé avant le début du chantier `PROMPT_CLAUDE_CODE_CORRECTIONS_POST_AUDIT.md`, pour
permettre une comparaison avant/après honnête (Phase 7/10 du mandat).

- Commit de départ : `5308c1ab569b107b79f27a0e51cd94b69b560ae8`
  (« audit: independent post-corrections verification with new tooling »)
- Branche : `codex/v2-audit-improvements`
- Date : 6 août 2026
- Node.js v24.16.0, npm 11.13.0
- Paramètres de simulation : `AUDIT_SEEDS_PER_COMBO=60`, `AUDIT_INCLUDE_CUSTOM=1`,
  `AUDIT_CUSTOM_SEEDS=30`, `AUDIT_BRANCH_CHECKPOINT=5`, `AUDIT_BRANCH_SAMPLES_PER_PARTY=6` —
  identiques à ceux documentés dans `audit-results/README.md` et `AUDIT_POST_CORRECTIONS.md`.
- 5 280 campagnes (4 320 partis existants + 960 personnalisés), 330 branches contrefactuelles,
  151 822 décisions, 0 erreur.

## Validation initiale (Phase 0)

| Commande                                                                        | Résultat                                                                  |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `npm run format:check`                                                          | Réussi                                                                    |
| `npm run lint`                                                                  | Réussi                                                                    |
| `npm run typecheck`                                                             | Réussi                                                                    |
| `npm run data:validate`                                                         | Réussi — 232 événements, 58 succès, 9 partis                              |
| `npm run test`                                                                  | Réussi — 76/76                                                            |
| `npm run build`                                                                 | Réussi                                                                    |
| `npm run test:e2e` (référence antérieure, voir `AUDIT_POST_CORRECTIONS.md` §17) | 9 réussis directement, 3 flaky (passés au second essai) sous `retries: 2` |

## Contenu de ce dossier

Copie exacte, au moment du commit `5308c1a`, des fichiers suivants de `audit-results/` :
`summary.json`, `variance-decomposition.csv`, `counterfactuals.csv`, `ideology-trajectories.csv`,
`repetition-by-run.csv`, `choice-similarity.csv`, `consequence-similarity.csv`,
`catalog-summary.json`, `raw-runs.csv`, `choice-strength.csv`, `event-catalog.csv`,
`world-events.csv.gz`.

Ces fichiers ne doivent plus être modifiés une fois ce chantier commencé : ce sont la référence
« avant » de `audit-results/post-fix/COMPARISON.md` et de `POST_AUDIT_FIXES.md`.

## Chiffres clés à préserver ou améliorer (voir `PROMPT_CLAUDE_CODE_CORRECTIONS_POST_AUDIT.md` §2)

| Mesure                                                          | Valeur baseline |
| --------------------------------------------------------------- | --------------: |
| η² parti — score 1er tour                                       |         46,06 % |
| η² agent — score 1er tour                                       |          5,36 % |
| η² parti — progression                                          |         75,87 % |
| η² agent — progression                                          |          2,40 % |
| Changement d'issue apparié (même parti+graine, agent différent) |          63,0 % |
| `eventsAffectingOpponent` (catalogue statique)                  |               2 |
| Mouvement idéologique moyen — économie                          |            6,71 |
| Mouvement idéologique moyen — société                           |            0,30 |
| Mouvement idéologique moyen — immigration                       |            0,91 |
| Mouvement idéologique moyen — autorité                          |            1,95 |
| Mouvement idéologique moyen — écologie                          |            1,97 |
| Mouvement idéologique moyen — Europe                            |            1,80 |
| Titres répétés par partie (moyenne)                             |           0,000 |
| Récits répétés par partie (moyenne)                             |           0,000 |
