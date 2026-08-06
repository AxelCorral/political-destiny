# Résultats de l'audit post-corrections

Générés par `npm run audit:game` (voir `scripts/audit-post/`). Toutes les commandes ci-dessous
sont exécutables individuellement ; `npm run audit:game` les enchaîne dans l'ordre.

Échelle de cette exécution (documentée dans `AUDIT_POST_CORRECTIONS.md`) : 5 280 campagnes sur les
9 partis existants + 4 profils de parti personnalisé, croisés avec les 8 agents de décision, plus
330 branches contrefactuelles à état initial identique. Commit audité : `cd920b4`.

## Fichiers

| Fichier                      | Généré par             | Contenu                                                                                                                                                                                                                                                                              |
| ---------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `catalog-summary.json`       | `catalog-audit.ts`     | Audit statique complet du catalogue (structure, intégrité, genericité des choix, diversité des conséquences).                                                                                                                                                                        |
| `event-catalog.csv`          | `catalog-audit.ts`     | Une ligne par événement : catégorie, mécanismes présents (chaîne, mémoire, idéologie, etc.), intégrité.                                                                                                                                                                              |
| `choice-similarity.csv`      | `catalog-audit.ts`     | Paires de choix dont la similarité cosinus (TF-IDF) dépasse 0.62. Vide si aucune paire ne dépasse ce seuil (c'est le cas dans cette exécution).                                                                                                                                      |
| `consequence-similarity.csv` | `catalog-audit.ts`     | Paires de récits de conséquence dont la similarité cosinus dépasse 0.55. Également vide dans cette exécution.                                                                                                                                                                        |
| `raw-runs.csv`               | `simulate.ts`          | Une ligne par campagne simulée : parti, agent, graine, résultat électoral, mémoire, monde, idéologie, répétitions. C'est la table de base de la plupart des analyses.                                                                                                                |
| `decisions.csv.gz`           | `simulate.ts`          | Une ligne par décision individuelle (~152 000 lignes), compressée (gzip -9, 31 Mo → 2,8 Mo). Décompresser avec `gunzip -k decisions.csv.gz` avant analyse ; `analyze.ts` et `timelines.ts` s'attendent à la version décompressée `decisions.csv` (non committée, voir `.gitignore`). |
| `world-events.csv.gz`        | `simulate.ts`          | Une ligne par action adverse enregistrée (~366 000 lignes), compressée (25 Mo → 1,2 Mo). Même remarque que ci-dessus.                                                                                                                                                                |
| `ideology-trajectories.csv`  | `simulate.ts`          | Une ligne par (campagne, axe idéologique) : position de départ/arrivée, réelle et perçue.                                                                                                                                                                                            |
| `errors.json`                | `simulate.ts`          | Campagnes ayant levé une exception pendant la simulation (vide dans cette exécution : 0/5280).                                                                                                                                                                                       |
| `counterfactuals.csv`        | `branch-experiment.ts` | Expérience contrefactuelle stricte : même état de jeu, chaque option du même événement résolue séparément, puis suivie avec le même agent. Mesure causale, pas corrélationnelle.                                                                                                     |
| `summary.json`               | `analyze.ts`           | Le fichier de résultats principal : décomposition de variance (ANOVA à deux facteurs, bootstrap, V de Cramér), résumé des branches contrefactuelles, mémoire/monde/idéologie, répétitions.                                                                                           |
| `variance-decomposition.csv` | `analyze.ts`           | Extrait tabulaire de la décomposition ANOVA (parti × agent) pour 3 métriques.                                                                                                                                                                                                        |
| `choice-strength.csv`        | `analyze.ts`           | Par (événement, choix) : score final moyen, taux de qualification/victoire des campagnes qui ont choisi cette option. **Corrélationnel** — voir la mise en garde dans `summary.json.choiceStrength.caveat`.                                                                          |
| `repetition-by-run.csv`      | `analyze.ts`           | Extrait des colonnes de répétition de `raw-runs.csv`, pour lecture directe.                                                                                                                                                                                                          |
| `selected-run-timelines/`    | `timelines.ts`         | Chronologies lisibles (Markdown) d'un échantillon de campagnes : aléatoires, gagnées, perdues, parti favori, parti difficile, événement rare, paires contrefactuelles. Voir `selected-run-timelines/README.md` pour l'index.                                                         |
| `charts/*.svg`               | `charts.ts`            | 11 graphiques autonomes (SVG, aucune dépendance de rendu), voir la légende de chacun pour la taille d'échantillon et le commit.                                                                                                                                                      |

## Régénérer

```bash
npm run audit:game
```

Variables d'environnement disponibles (valeurs utilisées pour cette exécution entre parenthèses) :

- `AUDIT_SEEDS_PER_COMBO` (60) — graines par cellule (parti × agent) dans la grille principale.
- `AUDIT_INCLUDE_CUSTOM` (1) — inclure la grille de partis personnalisés.
- `AUDIT_CUSTOM_SEEDS` (30) — graines par cellule (profil personnalisé × agent).
- `AUDIT_BRANCH_CHECKPOINT` (5) — décision à laquelle les branches contrefactuelles se séparent.
- `AUDIT_BRANCH_SAMPLES_PER_PARTY` (6) — nombre de couples (parti, graine) branchés.
- `AUDIT_COMMIT` — inscrit dans le sous-titre des graphiques.

Durée mesurée sur cette machine : simulation principale ≈ 15,6 minutes (5 280 campagnes, ≈ 5,6
campagnes/s), branches contrefactuelles ≈ 1 minute (330 branches), analyse/graphiques/chronologies
≈ quelques secondes chacun.

## Limites connues

- `choice-similarity.csv` et `consequence-similarity.csv` sont vides à leurs seuils par défaut
  (0.62 et 0.55) : aucune paire ne les dépasse dans le catalogue actuel. Voir
  `catalog-summary.json.choiceGenericity.lexicalClusterCountByThreshold` et
  `.consequenceDiversity.narrativeLexicalClusterCountByThreshold` pour les comptes à des seuils
  plus permissifs (0.45–0.80).
- `choice-strength.csv` est corrélationnel (confondu par l'agent et le parti qui choisissent
  chaque option) ; `counterfactuals.csv` est la mesure causale correspondante, mais sur un
  échantillon beaucoup plus restreint (330 branches contre ~150 000 décisions observées).
- L'agrégat `decisions.csv` / `world-events.csv` n'est pas committé en clair (voir `.gitignore`) ;
  seule la version compressée l'est.
