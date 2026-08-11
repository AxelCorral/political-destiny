# Ancrage réel et recompositions électorales — sorties

Voir `REALITY_GROUNDING_BASELINE.md` (racine du dépôt) pour l'audit avant implémentation, et
`REALITY_GROUNDED_CAMPAIGN_REPORT.md` pour le rapport final post-implémentation.

| Fichier | Contenu |
|---|---|
| `baseline-initial-snapshot.csv` | Distribution du socle affiché à la toute première carte, avant implémentation (Phase A) |
| `baseline-current-model-raw.csv` / `-summary.json` | 5 472 campagnes, modèle avant implémentation (Phase A) |
| `content-consistency.csv` | Audit des mentions « fictif » dans le texte visible au joueur (avant nettoyage) |
| `massive-after-raw.csv` / `-summary.json` | 10 080 campagnes, modèle après implémentation (Phase G) |
| `counterfactuals-raw.csv` / `-summary.json` | 520 paires retrait/maintien à état et graine identiques |
| `causality-cases.txt` | Cas T-1/événement/T+1 pour des retraits réellement survenus |
| `party-agency-regression.csv` | η² parti/stratégie avant/après cette mission, 5 métriques |
| `playtests/pt1..pt10-*.md` | Les 10 playtests manuels requis |

Reproduire (ordre) :

```bash
BASELINE_SEEDS_PER_COMBO=76 npx tsx scripts/audit/reality-grounding-baseline.ts
npx tsx scripts/audit/reality-grounding-content-audit.ts
MASSIVE_SEEDS_PER_COMBO=140 npx tsx scripts/audit/reality-grounded-massive-corpus.ts
COUNTERFACTUAL_PAIRS=520 npx tsx scripts/audit/reality-grounded-counterfactuals.ts
CAUSALITY_CASES=12 npx tsx scripts/audit/reality-grounded-causality.ts
npx tsx scripts/audit/reality-grounded-playtests.ts
npx tsx scripts/audit/reality-grounded-playtests-forced.ts
```
