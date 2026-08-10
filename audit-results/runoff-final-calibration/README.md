# Calibration finale électorale — sorties

Voir `AUDIT_RUNOFF_FINAL_CALIBRATION.md` (racine du dépôt) pour l'analyse complète, et
`FINAL_ELECTORAL_CALIBRATION_REPORT.md` pour le rapport final post-correctifs.

| Fichier | Contenu |
|---|---|
| `runoff-raw.csv` | Une ligne par second tour simulé (15 801 après BLOC B, 15 567 avant) : finalistes, scores T1/T2, marge, reconstruction déterministe à 7 valeurs de damping |
| `runoff-matchups.csv` | Matrice des 47 duels réellement rencontrés : occurrences, taux de victoire, marge moyenne/médiane/percentiles |
| `runoff-margin-distribution.csv` | Distribution globale des marges de second tour |
| `runoff-close-races.csv` | Sous-ensemble des duels à marge <2 pts |
| `damping-sensitivity.csv` | Marge moyenne/médiane selon 7 valeurs de `RUNOFF_SHARE_DAMPING` (reconstruction déterministe, mêmes 15 567 états) |
| `runoff-components.csv` | Décomposition retenu/transféré/damping de la marge |
| `runoff-counterfactuals.csv` | 3 640 rejouages contrefactuels (520 états × 7 politiques de décision entre-deux-tours) |
| `runoff-agency-summary.json` | Agrégat des contrefactuels : % de vainqueur changé, delta de score |
| `runoff-archetypes.csv` | Classification des seconds tours (serré/clair/large/comeback/effondrement) |
| `ties.csv` | Égalités exactes ou quasi-exactes |
| `dispersion-power-sensitivity.csv` / `-raw.csv` | Sensibilité de `DISPERSION_POWER` (1,6 à 2,4) |
| `real-world-calibration.csv` | Extrait tabulaire de `REAL_WORLD_CALIBRATION.md` |
| `party-agency-regression.csv` | η² parti/stratégie avant/après `DISPERSION_POWER`, 5 métriques |
| `runoff-content-quality.csv` | Matrice de cohérence des événements de second tour (`party_not_opponent`) |
| `retained-gap-damping-search.csv` / `-raw.csv` | Recherche empirique de `RETAINED_GAP_DAMPING` (1,0 à 0,7, 5 040 reconstructions) ayant fixé la valeur 0,75 |
| `playtests/pt1..pt8-*.md` | Les 8 playtests manuels requis (§28), générés par `scripts/audit/runoff-final-calibration-playtests.ts` |

**Note de cycle de vie des données** : les CSV ci-dessus ont été régénérés en BLOC B (correctifs
appliqués) et remplacent en place les fichiers BLOC A (pré-correctif) — mêmes noms de fichiers, mêmes
scripts. Les valeurs BLOC A (« avant ») ne sont donc plus présentes sous forme de fichier ; elles
restent citées en toutes lettres dans `AUDIT_RUNOFF_FINAL_CALIBRATION.md` (§1, §4, §13) et reprises
dans le tableau avant/après de `FINAL_ELECTORAL_CALIBRATION_REPORT.md`.

Reproduire (ordre) :

```bash
RUNOFF_SEEDS_PER_COMBO=280 npx tsx scripts/audit/runoff-final-calibration-corpus.ts
npx tsx scripts/audit/runoff-final-calibration-analyze.ts
AGENCY_TARGET_STATES=520 npx tsx scripts/audit/runoff-agency-counterfactuals.ts
DISPERSION_SEEDS_PER_COMBO=40 npx tsx scripts/audit/dispersion-power-sensitivity.ts
npx tsx scripts/audit/runoff-coherence-audit.ts
```
