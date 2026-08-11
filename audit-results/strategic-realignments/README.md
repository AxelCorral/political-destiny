# audit-results/strategic-realignments/

Données brutes du Bloc A de `PROMPT_CLAUDE_CODE_RECOMPOSITIONS_STRATEGIQUES_SOUTIENS_CHOCS.md`.
Synthèse et interprétation : `AUDIT_STRATEGIC_REALIGNMENTS.md` à la racine du dépôt. Toutes ces
données proviennent de `scripts/audit/strategic-realignments-blocA.ts`, un script lecture-seule qui
appelle le moteur de production existant (`redistributeElectorate`, `nationalLatentSupport`,
`resolveCurrentChoice`) sans jamais le modifier. Régénérable via :

```
BLOCA_SEEDS_PER_COMBO=150 npx tsx scripts/audit/strategic-realignments-blocA.ts
```

(150 graines × 9 partis × 8 agents = 10 800 campagnes ; ~20 minutes.)

## Fichiers

- `baseline/corpus-raw.csv` — une ligne par campagne (10 800), agrégats de retrait/suivi Écologistes.
- `baseline/summary.json` — métriques globales de la dernière exécution.
- `withdrawal-types.csv` — une ligne par retrait observé (2 439), avec classification du
  déclencheur (`triggerLowPolling`/`triggerLowLegitimacy`), viabilité diagnostique, pression de
  fragmentation, et **`nationalShockPoints`** (voir avertissement ci-dessous).
- `strategic-withdrawals.csv` — sous-ensemble illustratif (viabilité diagnostique > 0 au moment du
  retrait) ; **pas** une mesure de désistements stratégiques réels, puisqu'aucun n'existe encore
  dans le moteur — voir §4 du rapport.
- `bloc-fragmentation.csv` — snapshot de viabilité/fragmentation pour chaque parti à l'état initial
  de neuf campagnes (une par parti de départ).
- `shock-traces.csv` — décomposition étape par étape (§12 du prompt) des 8 chocs les plus extrêmes
  du corpus : vérité nationale avant/après à `DISPERSION_POWER=2`, transferts bruts, vérité
  avant/après en linéaire (`power=1`), delta d'indécision par bloc.
- `shock-power-sensitivity.csv` — mêmes 8 cas, `DISPERSION_POWER` balayé à 1,6/1,8/2,0/2,2 sur le
  retrait isolé (jamais sur un pas de décision complet — voir avertissement).
- `mass-conservation.csv` — 96 scénarios contrôlés (relation/alliance/endorsement × 12 blocs),
  conservation de masse exacte vérifiée (voir rapport §10).
- `national-endorsement-gaps.csv` — comptage par `figureKind` dans `majorEndorsements.ts` (0
  `domestic_entity`, 0 `fictional_prestige_figure`, 4 `world_figure`).
- `sidebar-regression.csv`, `racebulletin-regression.csv` — résultats du retest explicite §26-27.

## ⚠️ Avertissement méthodologique important sur `nationalShockPoints`

La colonne `nationalShockPoints` de `withdrawal-types.csv` mesure `max(|vérité après décision −
vérité avant décision|)` **sur le pas de décision complet**, pas sur le retrait isolé. Quand ce pas
de décision correspond aussi au franchissement du premier tour
(`GAME_CONFIG.targetDecisionsBeforeFirstRound`), la « vérité » passe d'une distribution à 9 partis à
une distribution à 2 finalistes — un changement d'univers de mesure, pas un choc électoral réel.
**Les 236 lignes à `decisionIndex == 23` de ce corpus sont toutes dans ce cas** (voir
`AUDIT_STRATEGIC_REALIGNMENTS.md` §7) : à exclure de toute lecture de « choc de retrait ». Le choc
de retrait réel (hors ces 236 lignes) a une moyenne de 3,78 points et un maximum de 14,08 points sur
ce corpus.

## ⚠️ Addendum Bloc B : bug de troncature corrigé

Ce script (et `strategic-realignments-blocB.ts` / `-counterfactuals.ts`) détectait initialement les
actions nouvelles d'un pas de décision par un diff de longueur sur `state.opponentActions` — un
tableau plafonné en production à 80 entrées (`.slice(-80)`, `addOpponentAction`,
`opponentSimulation.ts`). Une fois ce plafond atteint (courant avant le premier tour), le diff
renvoyait silencieusement `[]` pour le reste de la campagne, sous-comptant les retraits/négociations
tardifs. Corrigé (filtrage sur `decisionIndex`) après le Bloc A — voir
`STRATEGIC_REALIGNMENTS_REPORT.md` §10 pour l'analyse complète et l'impact mesuré (aucun sur le
diagnostic causal du choc premier-tour ni sur la conservation de masse ; sous-comptage probable des
fréquences absolues de retrait tardif dans les fichiers de ce dossier `baseline/`).

## Fichiers Bloc B

- `post-correction/corpus-raw.csv`, `post-correction/summary.json` — 10 800 campagnes post-
  implémentation (script corrigé), `scripts/audit/strategic-realignments-blocB.ts`.
- `post-correction/shocks-raw.csv`, `post-correction/redistribution-sizes-raw.csv` — détail par
  retrait (effondrement et stratégique confondus).
- `counterfactuals/A-withdraw-vs-maintain.csv`, `B-ps-vs-lfi.csv`,
  `C-endorsement-present-vs-absent.csv`, `counterfactuals/summary.json` — 500 paires par axe
  (`scripts/audit/strategic-realignments-counterfactuals.ts`, `CF_TARGET_PAIRS=500`).
- `playtests.md` — 12 playtests scriptés (`scripts/audit/strategic-realignments-playtests.ts`).
