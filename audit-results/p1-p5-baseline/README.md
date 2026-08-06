# audit-results/p1-p5-baseline — État initial du chantier P1+P5

Baseline pour `PROMPT_CLAUDE_CODE_CHANTIERS_P1_P5.md`, archivée avant toute modification de code de cette mission.

## Commit et branche

- Branche : `codex/v2-audit-improvements`
- Commit : `42f0447ab19a6ad25a1d2e822b61a51230728e72` (« docs(audit): add progression and conditional-victory charts (Phase 10) »)
- `git status` avant modification : arbre propre (seul `PROMPT_CLAUDE_CODE_CHANTIERS_P1_P5.md`, non suivi, ajouté par l'utilisateur).
- Node `v24.16.0`, npm `11.13.0`.

## Validation initiale (§5 du prompt)

| Commande                                | Résultat                                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                  | Vert (après normalisation des fins de ligne LF/CRLF, artefact Windows connu — voir note)                      |
| `npm run lint`                          | Vert                                                                                                          |
| `npm run typecheck`                     | Vert                                                                                                          |
| `npm run data:validate`                 | Vert — 9 partis, 41 acteurs, 249 événements, 58 succès                                                        |
| `npm run test`                          | Vert — 117/117 tests (22 fichiers)                                                                            |
| `npm run build`                         | Vert — 11 routes générées (Next.js 16.3.0, Turbopack)                                                         |
| `npm run audit:smoke`                   | Vert — 162/162 parties valides, 0 échec                                                                       |
| `npm run audit:game`                    | Vert — 5280 parties (4320 existantes + 960 personnalisées), 0 erreur                                          |
| `npm run test:e2e` + `--repeat-each=10` | Vert — 180/180 (précédemment confirmé en fin de mission précédente, même commit, code moteur inchangé depuis) |

**Note sur les fins de ligne** : `git checkout --` sur des fichiers déjà commités réintroduit des fins de ligne CRLF sous Windows (`core.autocrlf`), ce que `prettier --check` signale ensuite comme non conforme même si le contenu est strictement identique à l'état commité (`git diff` vide). Un `prettier --write .` restaure les fins de ligne LF sans changer le contenu ; ce n'est pas une régression du dépôt.

## Paramètres de simulation

- `AUDIT_SEEDS_PER_COMBO=60` (défaut) — 60 graines par combinaison (parti × agent).
- `AUDIT_INCLUDE_CUSTOM=1` (défaut) — grille de partis personnalisés incluse (4 profils × 8 agents × 30 graines).
- Préfixe de graine : `post-audit-{seedIndex}`.
- 9 partis existants × 8 agents × 60 graines = 4320 parties existantes ; + 960 parties personnalisées = 5280 parties au total.

## Agents

8 agents de `scripts/audit-post/lib/agents.ts` (`aleatoire`, `prudent`, `risque`, `ideologiquement_coherent`, `opportuniste_electoral`, `parti_dabord`, `mediatique`, `contrarien`).

## Mesures de référence (§2 du prompt, reproduites)

### P1

| Mesure                                                       |  Valeur |
| ------------------------------------------------------------ | ------: |
| η²(parti) — score 1er tour                                   | 45,02 % |
| η²(agent) — score 1er tour                                   |  5,72 % |
| η²(parti) — progression brute                                | 76,10 % |
| η²(agent) — progression brute                                |  2,49 % |
| η²(parti) — progression normalisée                           | 73,10 % |
| η²(agent) — progression normalisée                           |  2,98 % |
| η²(agent) — sur-performance vs baseline neutre inter-parties | 10,98 % |
| Changement d'issue apparié (parti+graine, agent différent)   |  67,4 % |

### P5

| Parti            | Victoire \| qualification |
| ---------------- | ------------------------: |
| Horizons         |                    93,2 % |
| Nouvelle Énergie |                    91,0 % |
| Renaissance      |                    84,1 % |
| LR               |                    82,6 % |
| PS               |                    80,0 % |
| Écologistes      |                    73,3 % |
| LFI              |                    55,5 % |
| RN               |                    39,1 % |

Ces deux jeux de chiffres correspondent exactement à ceux cités dans `PROMPT_CLAUDE_CODE_CHANTIERS_P1_P5.md` section 2 — confirmés reproduits ici avant toute modification de code.

## Fichiers de ce dossier

- `summary.json`, `variance-decomposition.csv`, `second-round-report.csv`, `duel-matrix.csv`, `counterfactuals.csv`, `catalog-summary.json` : copies figées de `audit-results/` au commit `42f0447`.
- Les fichiers volumineux (`raw-runs.csv`, `decisions.csv`, `world-events.csv`, `ideology-trajectories.csv`) ne sont pas dupliqués ici ; voir `audit-results/pre-fix-baseline/` (baseline de la mission précédente) et l'historique Git pour les retrouver au besoin — ce dossier sert de point de comparaison chiffré, pas d'archive complète des données brutes.

## Reproduction

```bash
git checkout 42f0447
npm run audit:game
```
