# audit-results/gameplay — Audit gameplay qualitatif

Livrables de `PROMPT_CLAUDE_CODE_AUDIT_GAMEPLAY_FUN.md`. Voir `GAMEPLAY_AUDIT.md` à la racine pour le rapport complet.

## Commit et branche

- Branche : `codex/v2-audit-improvements`
- Commit de référence : voir `git log --oneline -1` au moment de la génération.
- Node `v24.16.0`, npm `11.13.0`.

## Reproduction

```bash
npm run audit:gameplay                              # corpus + analyse + timelines + graphiques
npx playwright test --config=playwright.gameplay-audit.config.ts   # captures UX (alias : npm run test:ux-audit)
```

Paramètres : `GAMEPLAY_SEEDS_PER_COMBO` (défaut 4) contrôle le nombre de graines par combinaison parti×agent pour les 9 partis existants. Les profils personnalisés utilisent toujours 3 graines × 4 agents (prudent, aléatoire, idéologiquement cohérent, risqué).

## Fichiers

- `runs.csv` — une ligne par partie complète (398 parties dans la version finale de cette mission), avec catégorie de résultat, signaux structurels (rare, alliance, conflit adverse, chaîne, mouvement idéologique, remontée, effondrement).
- `choices.csv` — une ligne par décision (11 266 au total) : événement, catégorie, importance, choix effectué, sondage avant/après, rang avant/après, intensité dramatique estimée.
- `polls.csv` — un relevé de sondage par décision.
- `events.csv` — agrégation par événement unique rencontré (239/249 du catalogue).
- `pacing.csv` — décisions, longueur de texte et intensité moyenne par phase.
- `cognitive-repetition.csv` — occurrences et séquences répétées par catégorie d'événement.
- `dominant-choices.csv` — taux de sélection et performance moyenne par option, pour les événements rencontrés ≥ 8 fois.
- `poll-trajectories.csv` — échantillon de trajectoires de sondage pour visualisation.
- `replayability.csv` — indice de Jaccard des événements rencontrés, par parti (graines différentes, même parti).
- `cross-party-overlap.csv` — indice de Jaccard moyen intra-parti vs inter-partis (voir `GAMEPLAY_AUDIT.md` section 18-19).
- `rank-volatility.csv` — distribution des basculements de classement par décision (voir section 12, inclut la correction d'une mesure initialement erronée).
- `party-identity.csv` — profil agrégé par parti (score, mouvement idéologique, stratégie/étiquette dominante, taux de qualification).
- `final-scores.csv` — distribution du score final par catégorie de résultat et par parti.
- `memorable-moments.csv` — pic d'intensité par partie, comparé au `bestDecisionIndex` calculé par le moteur.
- `dead-zones.csv` — séquences de 3+ décisions consécutives à faible intensité, par partie et par phase.
- `timelines/` — 50 chronologies complètes au format Markdown (texte réel des événements/choix/conséquences, sondage avant/après, intensité), plus un `README.md` d'index.
- `charts/` — 12 graphiques SVG autoportants (voir section 45 du prompt pour la liste).
- `screenshots/` — captures Playwright sur 4 largeurs d'écran (desktop 1366px, mobile étroit 375px, mobile large 412px, tablette 768px), plus `timing-log.json` (mesure de temps de réponse clic→conséquence, sur un run représentatif — voir la note méthodologique dans `GAMEPLAY_AUDIT.md` section 23).

## Note méthodologique

Cet outillage (`scripts/gameplay-audit/`) est séparé du pipeline statistique existant (`scripts/audit-post/`) : il capture des données que ce dernier n'exporte pas (sondage avant/après par décision, intensité dramatique, options non choisies), nécessaires à une lecture qualitative plutôt qu'à un recalcul d'η². Il réutilise le moteur réel du jeu (`createGame`/`currentEvent`/`resolveCurrentChoice`) ainsi que les utilitaires partagés de `scripts/audit-post/lib/` (agents, CSV, statistiques, similarité de texte, graphiques SVG) — aucune règle du jeu n'est réimplémentée, aucun appel LLM externe, aucune API payante.
