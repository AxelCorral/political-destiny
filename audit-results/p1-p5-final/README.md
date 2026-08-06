# audit-results/p1-p5-final — État final du chantier P1+P5

Livrable final pour `PROMPT_CLAUDE_CODE_CHANTIERS_P1_P5.md`, produit après les deux corrections (P1 : agence réelle sur la progression ; P5 : second tour crédible et non automatique).

## Commits

- Branche : `codex/v2-audit-improvements`
- Baseline archivée avant modification : `bbf33a7` (« chore(p1-p5): archive baseline before P1+P5 deep-dive mission »), sur `42f0447`.
- Correction P1 : `a68bd41` (« fix(p1): wire cohesion and consistency into first-round vote appeal »).
- Correction P5 : `eb845c7` (« fix(p5): penalize ideological centrality and cap runoff transfer share »).
- Formatage des résultats d'audit générés : `cc36407`.
- Ce livrable : voir le commit qui suit immédiatement dans l'historique (« docs(audit): add final P1/P5 comparison and methodology »).
- Node `v24.16.0`, npm `11.13.0`.

## Validation finale (§26 du prompt)

| Commande                               | Résultat                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                 | Vert (après `prettier --write .` — fins de ligne CRLF/LF sous Windows, artefact connu, sans changement de contenu ; voir baseline)                                                                                                                                                                                                                                                                |
| `npm run lint`                         | Vert                                                                                                                                                                                                                                                                                                                                                                                              |
| `npm run typecheck`                    | Vert                                                                                                                                                                                                                                                                                                                                                                                              |
| `npm run data:validate`                | Vert — 9 partis, 41 acteurs, 249 événements, 58 succès                                                                                                                                                                                                                                                                                                                                            |
| `npm run test`                         | Vert — 130/130 tests (23 fichiers, dont 4 nouveaux tests P1 et 9 nouveaux tests P5)                                                                                                                                                                                                                                                                                                               |
| `npm run build`                        | Vert — 11 routes générées (Next.js, Turbopack)                                                                                                                                                                                                                                                                                                                                                    |
| `npm run audit:smoke`                  | Vert — 162/162 parties valides, 0 échec                                                                                                                                                                                                                                                                                                                                                           |
| `npm run audit:game`                   | Vert — 5280 parties (4320 existantes + 960 personnalisées), 0 erreur, 0 état invalide                                                                                                                                                                                                                                                                                                             |
| `npx playwright test --repeat-each=10` | 1er run (machine chargée par des simulations concurrentes) : 2/240 échecs transitoires (timeout d'affichage de dialogue, `game.spec.ts:195` et `:204`) ; 2e run (machine repos) : **180/180, 0 échec**. Diagnostic : flakiness liée à la charge CPU, pas une régression — P1/P5 ne touchent que des fonctions de calcul pures (`electorate.ts`, `election.ts`), aucun chemin de code UI/dialogue. |

## Paramètres de simulation finale

- `AUDIT_SEEDS_PER_COMBO=60` (défaut) — mêmes graines que la baseline (`post-audit-{seedIndex}`).
- `AUDIT_INCLUDE_CUSTOM=1` (défaut).
- 9 partis existants × 8 agents × 60 graines = 4320 parties existantes ; + 960 parties personnalisées = 5280 parties.
- Itérations rapides de calibrage (documentées section 4 et 8 de `P1_P5_FINAL_FIXES.md`) : `AUDIT_SEEDS_PER_COMBO=25 AUDIT_INCLUDE_CUSTOM=0`.

## Fichiers de ce dossier

- `summary.json`, `variance-decomposition.csv`, `counterfactuals.csv`, `second-round-report.csv`, `duel-matrix.csv` : copies figées de `audit-results/` à l'état final (5280 runs, mêmes graines que la baseline).
- `transfer-breakdown.csv`, `retention-abstention.csv` : détail des reports de second tour (par transfert élémentaire source→finaliste), produits par un probe dédié (9 partis × 8 agents × 20 graines, 10 114 transferts) car ce niveau de granularité n'est pas exporté par le pipeline principal `simulate.ts`.
- `poll-trajectories.csv` : trajectoire de sondage moyenne par agent, relevée à 5 points de contrôle (décisions 0/5/10/15/20), produite par le même type de probe dédié (9 partis × 8 agents × 15 graines, 5400 relevés) — cette donnée n'existait pas comme artefact CSV séparé avant cette mission ; elle est désormais aussi visualisée dans `charts/14-trajectoires-sondage-par-agent.svg`.
- `charts/` : 19 graphiques SVG autoportants (aucune dépendance externe). Les 13 premiers viennent du pipeline `scripts/audit-post/charts.ts` (exécution `npm run audit:game`, 5280 runs) ; les 6 suivants (14 à 19) couvrent les sujets du §29 non encore produits par ce pipeline (trajectoires de sondage, matrice des duels visualisée, reports par parti source, abstention par duel, effet du rejet, effet des alliances/consignes) et ont été produits par le même probe dédié que `transfer-breakdown.csv`/`poll-trajectories.csv`. Chaque graphique indique dans son sous-titre : commit, taille d'échantillon et source des données.

## Note méthodologique sur les probes dédiés

Le pipeline principal (`simulate.ts` → `analyze.ts` → `charts.ts`) ne capture pas, par construction, le détail transfert-par-transfert du second tour ni les relevés de sondage intermédiaires (seuls les résultats agrégés par campagne sont exportés dans `raw-runs.csv`). Pour produire `transfer-breakdown.csv`, `retention-abstention.csv`, `poll-trajectories.csv` et les 6 graphiques 14-19, des scripts de sondage dédiés, temporaires et non versionnés (supprimés après exécution), ont rejoué des campagnes avec le moteur de production réel (`createGame`/`currentEvent`/`resolveCurrentChoice`, mêmes fonctions que `simulate.ts`) sur un sous-échantillon (15-20 graines par combinaison parti×agent plutôt que 60) pour rester dans un temps d'exécution raisonnable. Les chiffres qui en résultent sont donc chiffrés sur un échantillon plus petit que le run principal à 5280 parties, mais utilisent exactement le même moteur et la même méthode de tirage.

## Reproduction

```bash
git checkout eb845c7
npm run audit:game
```
