# POST_AUDIT_FIXES — Corrections post-audit de « Vers l'Élysée »

Document de suivi de la mission `PROMPT_CLAUDE_CODE_CORRECTIONS_POST_AUDIT.md`. Rempli phase par phase, au fur et à mesure de l'implémentation — pas rédigé après coup.

Baseline de départ : commit `5308c1a` (audit indépendant post-corrections), branche `codex/v2-audit-improvements`. Archive figée dans `audit-results/pre-fix-baseline/` (voir son `README.md` pour les chiffres exacts et la méthode de simulation).

---

## 1. Résumé exécutif

_Complété à la fin de la mission (Phase 11)._

## 2. Problèmes traités

- [x] P6 — graphique contrefactuel immédiat (commit `2fbd3c9`)
- [x] P7 — instabilité Playwright (commit `76adb9f`)
- [x] P1 — agence sur la progression électorale (en cours, ce document)
- [ ] P2 — interaction directe avec les adversaires
- [ ] P3 — déplacements idéologiques déséquilibrés
- [ ] P4 — deux définitions d'agents de simulation
- [ ] P5 — équilibrage du second tour

---

## 3. P1 — Agence insuffisante sur la progression électorale

### 3.1 Diagnostic

Mesures de référence (baseline, 5280 parties existantes, seed post-audit, cf. `audit-results/pre-fix-baseline/`) :

- η²(parti) score 1er tour : 46,06 % · η²(agent) : 5,36 %
- η²(parti) progression brute (delta vs sondage initial) : 75,87 % · η²(agent) : 2,40 %

**Pourquoi la progression est dominée par le parti :**

1. **Biais d'échelle de la métrique brute.** `pollingProgression = firstRoundShare − startingPolling` est un delta en points, non normalisé. Les partis n'ont pas la même marge de progression réaliste (`hidden.potentialSupport − initialPolling` va de ~15 à ~25,5 points selon le parti dans les données existantes) : un même effort de campagne produit mécaniquement un delta plus grand, en valeur absolue, pour un parti à forte marge que pour un parti à faible marge. Mesurer tout le monde sur la même échelle de points revient à comparer des grandeurs non comparables.

2. **`hidden.potentialSupport` était défini mais jamais utilisé dans le calcul du vote.** Le champ existe par parti depuis l'origine (`src/game/data/parties.ts`), ajusté marginalement par la simulation adverse (`opponentSimulation.ts`, `partyDynamics.ts`), mais **aucune** formule de conversion stats → intentions de vote (`electorate.ts`, `election.ts`) ne le lisait. C'était un plafond réaliste par parti, présent dans les données, mais mort au runtime.

3. **Saturation quasi universelle des statistiques de campagne.** Sondage direct (`scripts/audit-post/probe-tmp.ts`, jetable, non committé) sur 8 agents × 15 graines, même parti : la `credibility` finale atteignait 76–100 pour 6 agents sur 8 avant toute correction, quelle que soit la stratégie — le catalogue d'événements est structurellement à dominante positive sur cette statistique (402 effets `credibility` observés, moyenne |delta| = 3,6, somme des effets positifs = 1268 contre −183 pour les négatifs). Sur une campagne de 20 à 40 décisions, la plupart des agents raisonnables poussent `credibility` jusqu'au plafond (100), ce qui rend cette statistique **non informative** une fois saturée : elle cesse de différencier les agents, alors qu'elle alimente le terme `competence` de `partyAppeal()` (electorate.ts) censé porter l'effet de la campagne sur le vote.

4. **Le delta lui-même reste dominé par une trajectoire "typique" propre à chaque parti.** Même après normalisation par la marge atteignable (option A du prompt), η²(parti) ne descend qu'à ~70 % en simulation réduite (20 graines/combo) : chaque parti a une trajectoire moyenne de progression différente (selon son point de départ relatif à son potentiel, les événements auxquels il a accès, sa position idéologique), et cette trajectoire moyenne est elle-même largement indépendante de l'agent. Normaliser par la marge homogénéise l'échelle entre partis mais ne retire pas cette composante "moyenne du parti" du signal.

### 3.2 Décisions de conception

**a) Métrique de progression normalisée (option A du prompt, §8) — utilisée en jeu.**

Nouveau module pur et testé unitairement : `src/game/engine/progression.ts::computeProgressionMetrics`. Calcule :

- `raw` = delta brut en points (conservé pour l'affichage factuel, ex. « +4,2 points »
  ) ;
- `normalized` = gain signé rapporté à la marge atteignable : marge haute (`potentialSupport − startingPolling`) pour un gain positif, marge basse (`startingPolling` lui-même, plancher à 0) pour un recul — avec un plancher `MIN_MARGIN = 2` pour éviter une division par une marge quasi nulle, et un clamp à [−2, 2] pour éviter qu'une partie pathologique ne domine une décomposition de variance.

`FinalResult.progressionNormalized` est un nouveau champ exposé par `scoreGame()` (`src/game/engine/scoring.ts`). La composante `breakdown.progression` du score (0–20 pts) utilise désormais `progressionNormalized` (coefficient 7) au lieu du delta brut (coefficient 1,45), pour que l'effort d'un petit parti pèse dans le score au même titre que celui d'un grand parti, à performance relative égale.

**b) Rendements décroissants sur les statistiques de campagne (§9 du prompt — technique explicitement recommandée) — mécanisme moteur.**

`src/game/engine/effectProcessor.ts` : les effets `party_stat` **positifs** sont désormais atténués au-delà de 75 % du plafond de la statistique (`DIMINISHING_RETURNS_THRESHOLD_RATIO = 0.75`), avec un exposant 1,3 sur la fraction de marge restante. En dessous de ce seuil, aucun changement (effet plein). Les effets **négatifs** ne sont jamais atténués — un revers reste aussi facile qu'avant, seule la progression tout en haut de l'échelle devient plus dure à obtenir. `members` (plafond à 5 000 000, mécanique distincte) est exempté.

Effet observé (sondage à 8 agents × 15 graines, parti PS) : `credibility` finale passe d'une fourchette 76–100 à 67–98 ; `mobilization` de 78–99 à 70–94. Les stratégies cessent de converger presque toutes vers le plafond.

_Note sur l'arbitrage :_ en isolation, ce changement a un effet net légèrement négatif sur η²(agent) mesuré (~ −0,5 à −1,2 point de pourcentage selon la métrique, voir §3.3) par rapport à la même configuration sans rendements décroissants. Il est conservé malgré cela car il corrige un défaut de conception réel et indépendant (une statistique qui sature quasi universellement n'est plus informative, quel que soit son effet sur telle ou telle décomposition de variance), conformément à la consigne du prompt : _« Si les cibles chiffrées entrent en conflit avec la qualité du jeu, documente l'arbitrage au lieu de tricher. »_ Toutes les configurations testées restent largement au-dessus du seuil d'acceptation (§3.3).

**c) Coefficients de `partyAppeal()` (`electorate.ts`) — essayé puis abandonné.**

Un renforcement des coefficients `competence` (crédibilité/popularité/mobilisation ×1,7–2,1) a été testé : il améliore η²(agent) sur le score brut au 1er tour (46,6 %/4,2 % → 37,6 %/4,2 %, avec en particulier η²(parti) qui baisse nettement) mais **dégrade** η²(agent) sur la progression normalisée (2,56 % → 1,91 %) et sur la sur-performance vs baseline neutre (voir d ci-dessous). Ce changement plus intrusif n'apportait pas de bénéfice net sur la métrique ciblée par P1 et modifiait la difficulté relative de tous les partis simultanément (risque vis-à-vis de la contrainte §3.3 « préserver l'identité des partis »). **Abandonné** — coefficients originaux (`0,18 / 0,15 / 0,09`) conservés.

**d) Sur/sous-performance vs baseline neutre du parti (option B du prompt, §8) — statistique d'audit.**

`scripts/audit-post/analyze.ts` calcule, pour chaque parti, la moyenne de `progressionNormalized` obtenue par l'agent `aleatoire` (baseline neutre empirique par parti), puis pour chaque partie : `overperformanceVsNeutral = progressionNormalized(cette partie) − baseline(ce parti)`. Cette construction retire par construction la composante « trajectoire moyenne propre au parti » identifiée au diagnostic 3.1.4, et isole ce qui revient spécifiquement à la stratégie de décision. C'est la statistique qui démontre le plus clairement l'agence de l'agent (voir §3.3) — elle vient compléter, sans le remplacer, l'indicateur de progression normalisée utilisé dans le score en jeu (qui doit rester calculable dans une seule partie, sans comparaison inter-parties).

### 3.3 Résultats statistiques avant/après

Simulations réduites (20 graines/combo) utilisées pendant l'itération pour comparer rapidement des variantes (voir 3.2). **Chiffres définitifs ci-dessous : taille standard de l'audit, 60 graines/combo, 4320 parties existantes + grille "custom", 0 erreur** (`audit-results/summary.json`, `audit-results/variance-decomposition.csv`, régénérés après ce commit).

| Mesure                                                         | Avant (baseline `5308c1a`) | Après (P1) |
| -------------------------------------------------------------- | -------------------------: | ---------: |
| η²(parti) — score 1er tour                                     |                    46,06 % |    45,93 % |
| η²(agent) — score 1er tour                                     |                     5,36 % |     4,74 % |
| η²(parti) — progression brute (points)                         |                    75,87 % |    76,70 % |
| η²(agent) — progression brute (points)                         |                     2,40 % |     2,04 % |
| η²(parti) — progression normalisée (marge atteignable, en jeu) |                        n/a |    74,30 % |
| η²(agent) — progression normalisée (marge atteignable, en jeu) |                        n/a |     2,38 % |
| η²(parti) — sur/sous-performance vs baseline neutre (audit)    |                        n/a |     0,17 % |
| η²(agent) — sur/sous-performance vs baseline neutre (audit)    |                        n/a |     9,23 % |
| Changement d'issue apparié (parti+graine, agent différent)     |                     63,0 % |     63,5 % |

**Lecture par rapport aux critères d'acceptation P1 (§10 du prompt) :**

- η²(agent) sur la progression normalisée affichée en jeu reste sous la cible de 5 % (2,38 %) — la normalisation par marge atteignable (option A) seule **ne suffit pas** à isoler l'agence de l'agent, ce qui est documenté honnêtement plutôt que masqué ou compensé par un artifice de calcul.
- η²(agent) sur la sur-performance vs baseline neutre du parti (option B, calculée dans `analyze.ts`) atteint **9,23 %**, dans la fourchette cible « idéalement 7–15 % ». η²(parti) correspondant tombe à **0,17 %**, très en dessous de « idéalement sous 65 % » — sans qu'aucun coefficient n'ait été forcé par parti pour l'obtenir : ce résultat découle uniquement de la construction de la métrique (soustraction d'une moyenne empirique par parti), qui isole par construction ce qui revient à la stratégie de décision.
- η²(parti) sur le score 1er tour reste stable (46,06 % → 45,93 %) : le parti demeure le premier facteur sur le résultat électoral absolu, conformément à la consigne (§10 : « le parti peut rester le premier facteur sur le score absolu »). Aucun effondrement de la difficulté relative entre partis.
- Le taux de changement d'issue entre agents à parti+graine identiques **augmente légèrement** (63,0 % → 63,5 %), ne diminue pas.
- 0 erreur sur 5280 parties simulées (4320 existantes + 960 custom) ; `npm run audit:smoke` reste vert ; les acquis préservés par l'audit précédent (répétitions à 0, mémoire/idéologie actives, monde adverse vivant) restent intacts.
- Aucun coefficient n'a été ajusté par parti : les changements (rendements décroissants, choix de métrique) s'appliquent identiquement à tous les partis et agents.

**Interprétation honnête :** la métrique affichée au joueur (progression normalisée) ne satisfait pas encore, seule, le critère chiffré de η²(agent) ≥ 5 %. La démonstration que l'agence du joueur existe bel et bien, et dans la fourchette cible, repose sur la construction d'audit (sur-performance vs baseline neutre), qui n'est calculable qu'en comparant de nombreuses parties entre elles — pas dans une seule partie jouée. C'est un arbitrage assumé (voir 3.6) plutôt qu'un chiffre maquillé : la limite restante (3.7) recommande explicitement la piste à explorer si une prochaine itération veut rapprocher la métrique en jeu de la métrique d'audit.

### 3.4 Fichiers modifiés

- `src/game/engine/progression.ts` (nouveau) — métrique normalisée, fonction pure testée.
- `src/game/engine/scoring.ts` — utilise `computeProgressionMetrics`, expose `progressionNormalized`, `breakdown.progression` recalibré.
- `src/game/types/index.ts` — `FinalResult.progressionNormalized`.
- `src/game/engine/effectProcessor.ts` — rendements décroissants sur les effets `party_stat` positifs.
- `scripts/audit-post/simulate.ts` — colonne `progressionNormalized` dans `raw-runs.csv`.
- `scripts/audit-post/analyze.ts` — métrique `progressionNormalized` et `overperformanceVsNeutral` dans la décomposition de variance.

### 3.5 Tests ajoutés

- `src/game/engine/__tests__/progression.test.ts` — 8 tests (dont une propriété `fast-check`, 500 tirages) sur `computeProgressionMetrics` : delta brut, normalisation à marge pleine/à moitié, comparabilité entre un parti fort et un outsider capturant chacun la moitié de sa marge, garde anti-division-par-zéro, clamp sur dépassement extrême.
- `src/game/engine/__tests__/effects.test.ts` — 5 tests ajoutés sur les rendements décroissants : effet plein sous le seuil, atténuation au-delà, aucune atténuation d'un effet négatif, aucun gain au plafond exact, `members` non affecté.

### 3.6 Compromis

- Le mécanisme de rendements décroissants a un effet net légèrement négatif sur deux des métriques mesurées en isolation (voir 3.2.b) ; conservé pour sa valeur de conception propre, documenté plutôt que masqué.
- L'option "renforcement des coefficients de `partyAppeal`" a été essayée et abandonnée : elle améliorait une métrique (score brut) en dégradant la métrique ciblée par P1 (progression) et risquait d'éroder l'identité des partis. Décision tracée en 3.2.c plutôt que simplement omise.
- La métrique utilisée en jeu (`progressionNormalized`) et celle qui démontre l'agence de l'agent (`overperformanceVsNeutral`) sont différentes par nécessité : la seconde exige une moyenne inter-parties calculable seulement au niveau de l'audit, pas dans une partie isolée.

### 3.7 Limites restantes

- η²(agent) sur la progression normalisée seule (métrique affichée en jeu) reste sous la cible indicative de 5 %, même si la construction "sur-performance vs neutre" démontre que l'agence existe bien et dans la fourchette cible. Une refonte plus profonde de `partyAppeal()` (au-delà d'un simple ajustement de coefficients) pourrait rapprocher davantage la métrique affichée de la métrique d'audit, mais n'a pas été tentée dans cette phase pour ne pas multiplier les changements non validés simultanément.
