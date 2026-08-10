# Audit électoral — sorties

Voir `AUDIT_ELECTORAL_COHERENCE.md` (racine du dépôt) pour l'analyse complète. Ce dossier contient
les données brutes et agrégées produites par `scripts/audit/electoral-coherence-corpus.ts` et
`scripts/audit/electoral-coherence-analyze.ts` (10 008 campagnes, 9 partis × 8 agents × 139
graines), plus `scripts/audit/runoff-coherence-audit.ts` et `scripts/text-quality-audit/run.ts`.

| Fichier | Contenu |
|---|---|
| `dispersion-by-phase.csv` | Sondage de tous les partis actifs à 6 points de contrôle, une ligne par (campagne × checkpoint) |
| `party-percentiles-raw.csv` | Une ligne par campagne : résultat premier tour complet, spread, concentration |
| `dispersion-summary.csv` | `dispersion-by-phase.csv` agrégé par checkpoint |
| `compressed-races.csv` | Indicateur `compressedRace`, 4 définitions, par checkpoint |
| `race-archetypes.csv` | Une ligne par campagne : archétype classé (8 formes) |
| `leadership-dynamics.csv` | Changements de leader/top2, gains/pertes max, agrégé sur tout le corpus |
| `party-percentiles.csv` | Percentiles (p10/p50/p90), taux de qualification/victoire, par parti |
| `initial-strength.csv` | Moyenne/médiane/min/max/écart-type/rang moyen au tout début de partie, par parti |
| `runoff-context-matrix.csv` | Cohérence des événements de second tour vis-à-vis de l'adversaire qualifié |
| `text-quality.csv` | Défauts typographiques détectés dans `gameContent` |
| `summary.json` | Agrégat de toutes les métriques ci-dessus |

Reproduire : `ELECTORAL_SEEDS_PER_COMBO=139 npx tsx scripts/audit/electoral-coherence-corpus.ts &&
npx tsx scripts/audit/electoral-coherence-analyze.ts && npx tsx
scripts/audit/runoff-coherence-audit.ts && npx tsx scripts/text-quality-audit/run.ts`.
