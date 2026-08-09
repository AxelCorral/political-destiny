# Baseline — mission d'amélioration du fun (PROMPT_CLAUDE_CODE_AMELIORATION_FUN_POST_AUDIT.md)

## Identité de la baseline

- Commit de départ (avant toute modification de cette mission) : `37764b5` (« feat(fun-audit): add
  fun/replayability audit tooling, report, and audit:fun script »), branche
  `codex/v2-audit-improvements`.
- Ce commit correspond exactement au contenu audité par `AUDIT_FUN_REJOUABILITE.md` — le code de jeu
  n'a pas changé entre la fin de l'audit et le début de cette mission.
- Node v24.16.0, npm 11.13.0.
- `git status` propre au démarrage de cette mission (après le commit ci-dessus).

## Pourquoi `fun-audit-snapshot/` est une copie et pas une ré-exécution

`npm run audit:fun` (nouvellement câblé dans `package.json` par cette mission, voir
`scripts/fun-audit/run-all.ts`) exécute le même moteur déterministe sur les mêmes graines que celles
déjà utilisées pour produire `audit-results/fun-audit/`. Comme le code de jeu et le contenu
n'avaient pas changé entre les deux missions, une ré-exécution aurait reproduit des fichiers
strictement identiques (déterminisme du moteur, vérifié par ailleurs par
`audit-results/audit-post/`). Les fichiers de `fun-audit-snapshot/` sont donc une copie directe de
`audit-results/fun-audit/*.csv`/`*.json` au commit `37764b5`, pas une nouvelle simulation — plus
rapide, strictement équivalente. La ré-exécution complète (`npm run audit:fun`) sera faite une seule
fois, après implémentation, pour produire `audit-results/fun-improvement/post/` (voir Phase J).

## Résultats des vérifications de référence

Tous exécutés sur l'arbre au commit `37764b5`, avant toute modification :

| Commande                | Résultat                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`  | 3 fichiers markdown de consigne non formatés (fichiers de prompt, pas de code — état préexistant, inchangé par cette mission) |
| `npm run lint`          | Réussi (0 avertissement)                                                                                                      |
| `npm run typecheck`     | Réussi                                                                                                                        |
| `npm run data:validate` | Réussi — 9 partis, 249 événements, 58 succès, 18 rares/legendary/secret                                                       |
| `npm run test`          | Réussi — 130/130 tests                                                                                                        |
| `npm run build`         | Réussi                                                                                                                        |

Détail dans `environment.txt`, `checks.txt`, `data-validate.txt`, `test.txt`, `build.txt`.

## Chiffres de référence cités par le prompt de mission (tous vérifiés dans `fun-audit-snapshot/`)

| Mesure                                               | Valeur baseline                                          | Source                                                                                   |
| ---------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Fun Horizons                                         | 44,3/100                                                 | `party-fun.csv`                                                                          |
| Agence Horizons                                      | 2,0/10                                                   | `party-fun.csv`                                                                          |
| Qualification Horizons                               | 85,6 %                                                   | `party-fun.csv` (`qualificationRate`)                                                    |
| Victoire\|qualifié Horizons                          | 88,3 %                                                   | `party-fun.csv` (`victoryGivenQualifiedRate`)                                            |
| Identité Renaissance                                 | 2,5/10                                                   | `party-fun.csv`                                                                          |
| Similarité stratégies inter-partis                   | 0,979–0,996                                              | `party-similarity.csv` (`strategyCosine`)                                                |
| Rares avec chaîne (génériques)                       | 0/9                                                      | `rare-event-value.csv` (aucune ligne `isChain=true`)                                     |
| Rares « exceptionnels »                              | 0                                                        | `summary.json.rareEvents.exceptionnel`                                                   |
| World/scandal intéressants                           | 8/24                                                     | `summary.json.randomEventValue.interessant`                                              |
| World/scandal frustrants                             | 6/24                                                     | `summary.json.randomEventValue.frustrant`                                                |
| Nouveauté partie 10 (moyenne)                        | 8,9 %                                                    | `replayability.csv` (moyenne des 9 partis, `newContentShareThisGame` à `gamesPlayed=10`) |
| Narrativité ≥ 3 signaux                              | 81,7 %                                                   | `summary.json.memorableMoments.shareAtLeast3`                                            |
| Choix dominants > 80 %                               | 1,8 %                                                    | `summary.json.dominantChoiceShare.dominantSharePct`                                      |
| Runs Horizons « plats » (rang 1 constant, ≤1 signal) | voir `selected-timelines/` bottom10 (5/10 sont Horizons) | `audit-results/fun-audit/selected-timelines/INDEX.json`                                  |

## Corpus source

1 890 campagnes (1 620 partis existants + 270 partis personnalisés), 53 950 décisions, 1 296 lignes
A/B appariées — voir `AUDIT_FUN_REJOUABILITE.md` §2 pour la méthodologie complète.
