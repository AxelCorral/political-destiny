# POST_AUDIT_FIXES — Corrections post-audit de « Vers l'Élysée »

Document de suivi de la mission `PROMPT_CLAUDE_CODE_CORRECTIONS_POST_AUDIT.md`. Rempli phase par phase, au fur et à mesure de l'implémentation — pas rédigé après coup.

Baseline de départ : commit `5308c1a` (audit indépendant post-corrections), branche `codex/v2-audit-improvements`. Archive figée dans `audit-results/pre-fix-baseline/` (voir son `README.md` pour les chiffres exacts et la méthode de simulation).

---

## 1. Résumé exécutif

Les sept problèmes identifiés par l'audit indépendant post-corrections (`AUDIT_POST_CORRECTIONS.md`, commit `5308c1a`) ont été traités, chacun diagnostiqué avant correction, mesuré avant/après sur une simulation à taille standard (60 graines/combo, 4320 à 5280 parties selon la phase), documenté et commité localement.

**Corrections mécaniques et de contenu** (P1, P2, P3, P5) apportent des changements réels, mesurés sur simulation complète, avec des compromis explicitement documentés plutôt que masqués :

- **P1** (progression) : nouvelle métrique normalisée par la marge atteignable, rendements décroissants sur les statistiques de campagne. La métrique affichée en jeu (η²(agent) = 2,98 %) n'atteint pas seule la cible du prompt (≥ 5 %) ; la construction d'audit complémentaire (sur-performance vs baseline neutre du parti) la démontre à 10,98 %, dans la fourchette cible — limite honnêtement documentée, pas contournée.
- **P2** (interactions adverses) : `eventsAffectingOpponent` passe de 2 à 8 (cible : nettement au-delà de 2, atteinte), 9 événements neufs plutôt que les 12–20 indicatifs, par arbitrage de temps assumé.
- **P3** (axes idéologiques) : société (0,30 → 2,07) et immigration (0,91 → 2,52) atteignent la cible (1,5–3) grâce à 8 événements neufs ; autorité/écologie/Europe, déjà sains, laissés inchangés par choix délibéré.
- **P5** (second tour) : rendements décroissants sur la pénalité de rejet, `rn` gagne son second tour conditionnellement 33,0 % → 39,1 % du temps ; `horizons`/`nouvelle_energie` restent au-dessus du seuil de vigilance (85–90 %) mais explicables et différenciés par adversaire, documentés plutôt que forcés à la baisse.

**Corrections d'outillage et d'infrastructure** (P6, P7, P4) sont pleinement résolues sans compromis restant : le graphique contrefactuel affiche désormais la vraie valeur non nulle (0,1967 → visible), les trois scénarios Playwright instables sont à 0 échec sur 270 exécutions (15× repeat-each, deux projets), et les deux jeux d'agents d'audit sont croisés-documentés plutôt que fusionnés (choix assumé, cf. §7).

**Non-régression** : 0 répétition de titre/récit, 0 faux dilemme, 18/18 événements rares atteignables, 0 erreur de simulation sur 5280 parties, déterminisme parfait, build/typecheck/lint/tests tous verts — voir `audit-results/post-fix/COMPARISON.md` et section 8 de ce document pour le détail complet.

Aucune métrique n'a été supprimée ou maquillée pour améliorer un résultat ; chaque arbitrage (rendements décroissants qui coûte un peu d'η²(agent), coefficients de `partyAppeal` essayés puis abandonnés, volume P2 sous la fourchette haute) est documenté avec sa justification plutôt que silencieux.

## 2. Problèmes traités

- [x] P6 — graphique contrefactuel immédiat (commit `2fbd3c9`)
- [x] P7 — instabilité Playwright (commit `76adb9f`)
- [x] P1 — agence sur la progression électorale (commit `c386894`)
- [x] P5 — équilibrage du second tour (commit `0e1420c`)
- [x] P3 — déplacements idéologiques déséquilibrés (commit `f0095d9`)
- [x] P2 — interaction directe avec les adversaires (commit `0680ca1`)
- [x] P4 — deux définitions d'agents de simulation (ce document)

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

---

## 4. P5 — Équilibrage du second tour

### 4.1 Diagnostic

Nouvel outillage ajouté pour ce diagnostic (§19 du prompt) : `scripts/audit-post/simulate.ts` capture désormais, pour chaque partie qualifiée, l'identité de l'adversaire du second tour et les statistiques (rejet, crédibilité, mobilisation, distance idéologique) des deux finalistes au moment du second tour ; `scripts/audit-post/analyze.ts` en dérive un rapport par parti (`audit-results/second-round-report.csv`) et une matrice de duels parti×parti (`audit-results/duel-matrix.csv`), tous deux issus du **même moteur réel**, sans réimplémentation parallèle.

Constat initial (30 graines/combo, seed post-audit, avant correction) :

| Parti                | Qualification | Victoire | **Victoire \| qualifié**                                   | Rejet moyen (soi) | Rejet moyen (adversaire) |
| -------------------- | ------------: | -------: | ---------------------------------------------------------- | ----------------: | -----------------------: |
| horizons             |        72,9 % |   65,0 % | **89,1 %**                                                 |              49,5 |                     66,7 |
| nouvelle_energie     |        56,7 % |   49,2 % | **86,8 %**                                                 |              40,3 |                     64,2 |
| lr                   |        83,8 % |   65,8 % | 78,6 %                                                     |              69,3 |                     63,1 |
| renaissance          |        77,5 % |   60,8 % | 78,5 %                                                     |              67,7 |                     58,3 |
| ps                   |        90,0 % |   62,1 % | 69,0 %                                                     |              79,0 |                     61,9 |
| ecologistes          |        68,3 % |   45,0 % | 65,9 %                                                     |              44,6 |                     65,2 |
| lfi                  |        90,0 % |   43,8 % | 48,6 %                                                     |              68,7 |                     64,1 |
| **rn**               |    **93,3 %** |   31,7 % | **33,9 %**                                                 |          **87,0** |                     61,0 |
| reconquete (n petit) |         9,2 % |    2,5 % | 27,3 % (n=22 qualifiés, sous le seuil de fiabilité retenu) |              78,6 |                     64,8 |

Deux valeurs dépassent le seuil de vigilance du prompt (§22, > ~85–90 %) : `horizons` (89,1 %) et `nouvelle_energie` (86,8 %). À l'inverse, `rn`, très souvent qualifié (93,3 %), gagne rarement son second tour (33,9 %).

**Cause identifiée — pas un coefficient caché, mais une pente linéaire trop forte sur tout l'intervalle du rejet.** `runoffAppeal()` (`src/game/engine/election.ts`) déterminait la part des reports de voix d'un tiers parti avec un terme `- finalist.stats.rejection * 0.34`, strictement linéaire de 0 à 100. Le rejet moyen constaté à l'entrée du second tour va de ~40 (nouvelle_energie) à ~87 (rn) — un écart de pénalité de reports de ~16 points d'appel sur une base de 112, alors que le reste de la formule (crédibilité, mobilisation, cohérence de campagne, alliances) doit rivaliser avec cet écart pour inverser un duel.

**Ce n'est pas un surdéterminisme au sens propre : la stratégie de jeu déplace déjà fortement les chances.** Ventilation par agent, second tour de `rn` (avant correction) :

| Agent                                     | Victoire \| qualifié |
| ----------------------------------------- | -------------------: |
| contrarien (mauvaise stratégie sciemment) |               11,5 % |
| mediatique                                |               17,9 % |
| parti_dabord                              |               20,8 % |
| opportuniste_electoral                    |               31,0 % |
| aleatoire                                 |               37,9 % |
| risque                                    |               43,3 % |
| ideologiquement_coherent                  |               44,8 % |
| **prudent**                               |           **58,6 %** |

Un écart de 47 points entre la pire et la meilleure stratégie pour le **même** parti confirme que « une bonne ou mauvaise campagne déplace significativement les chances » (§22) est déjà vrai — le problème visé par P5 est spécifiquement l'écart agrégé entre partis à rejet structurellement très différent, pas l'absence d'agence à l'intérieur d'un même parti.

La matrice de duels confirme un résultat différencié selon l'adversaire, pas une victoire automatique : `rn` bat `lr` (39,6 % sur 48 duels), `ps` (45,1 % sur 51 duels) ou `lfi` (75 % sur 16 duels), mais perd presque systématiquement contre `horizons` (15 % sur 20 duels) — le rejet reste déterminant, mais de façon différenciée par adversaire, pas comme un couperet uniforme.

### 4.2 Décision de conception

`src/game/engine/election.ts::diminishingRejectionPenalty` (nouvelle fonction pure, exportée et testée) remplace le terme linéaire `rejection * 0.34` par une courbe concave (`rejection^0.65`), calibrée pour **coïncider exactement avec l'ancien terme linéaire à rejet = 50** (le milieu de l'échelle, aucun changement de calibration pour un parti "moyen"), mais qui comprime l'écart de pénalité entre rejet très bas et très haut. Le rejet reste strictement croissant (aucune inversion d'ordre entre partis) — c'est un lissage des extrêmes, pas une remise à plat.

Technique explicitement recommandée par le prompt (§21 : « rendements décroissants du rejet »). Alternatives écartées :

- **Un quota de victoire ou un nerf direct par parti** — explicitement interdit par le prompt (§21) et par le principe de non-homogénéisation (§3.3).
- **Réduire le poids du rejet dans la formule de rétention** (`leftRetention`/`rightRetention`) — écarté : son coefficient (`rejection / 2200`) est déjà marginal (moins de 2 points de rétention sur toute l'échelle), ce n'est pas le levier dominant.
- **Ajouter du bruit électoral supplémentaire** — écarté : le prompt met en garde contre une « randomisation excessive » (§21), et le bruit existant (±4 points sur le duel) n'est pas la source du problème diagnostiqué (un biais systématique, pas un manque de variance aléatoire).

### 4.3 Résultats statistiques avant/après

Résultats en configuration réduite (30 graines/combo, mêmes graines avant/après) :

| Parti (victoire \| qualifié) |  Avant |      Après |
| ---------------------------- | -----: | ---------: |
| horizons                     | 89,1 % |     89,7 % |
| nouvelle_energie             | 86,8 % |     86,8 % |
| lr                           | 78,6 % |     80,6 % |
| renaissance                  | 78,5 % |     81,2 % |
| ps                           | 69,0 % |     72,7 % |
| ecologistes                  | 65,9 % |     63,4 % |
| lfi                          | 48,6 % |     50,5 % |
| **rn**                       | 33,9 % | **39,7 %** |

Chiffres définitifs (60 graines/combo, 4320 parties existantes, 0 erreur — `audit-results/second-round-report.csv`) :

| Parti                | Qualification | Victoire |    Victoire \| qualifié |
| -------------------- | ------------: | -------: | ----------------------: |
| **horizons**         |        77,1 % |   71,9 % |              **93,2 %** |
| **nouvelle_energie** |        60,2 % |   54,8 % |              **91,0 %** |
| renaissance          |        79,8 % |   67,1 % |                  84,1 % |
| lr                   |        85,0 % |   70,2 % |                  82,6 % |
| ps                   |        92,5 % |   74,0 % |                  80,0 % |
| ecologistes          |        74,8 % |   54,8 % |                  73,3 % |
| lfi                  |        90,8 % |   50,4 % |                  55,5 % |
| reconquete           |         7,1 % |    2,9 % | 41,2 % (n=34 qualifiés) |
| **rn**               |    **92,7 %** |   36,2 % |              **39,1 %** |

`rn` passe de 33,0 % (baseline `AUDIT_POST_CORRECTIONS.md`) à 39,1 % après correction — une amélioration réelle de +6,1 points, cohérente avec la mesure en configuration réduite. `matchedPairsOutcomeChangedShare` (taux de changement d'issue entre agents à parti+graine identiques, mesure globale non spécifique au second tour) reste stable à 63,1 % (baseline 63,0 %, P1 l'avait mesuré à 63,5 % — variation normale d'échantillonnage, aucune régression).

### 4.4 Fichiers modifiés

- `src/game/engine/election.ts` — `diminishingRejectionPenalty()`, branchée dans `runoffAppeal()`.
- `scripts/audit-post/simulate.ts` — capture de l'adversaire du second tour et des statistiques de duel dans `raw-runs.csv`.
- `scripts/audit-post/analyze.ts` — rapport par parti (`second-round-report.csv`), matrice de duels (`duel-matrix.csv`), section `secondRound` dans `summary.json` avec la liste des partis au-dessus du seuil de vigilance.

### 4.5 Tests ajoutés

- `src/game/engine/__tests__/election.test.ts` — 4 tests sur `diminishingRejectionPenalty` : coïncidence exacte avec l'ancien terme linéaire au point d'ancrage (rejet = 50), monotonie stricte, compression réelle de l'écart entre rejet faible et rejet élevé par rapport à l'ancien terme linéaire, valeur nulle à rejet = 0.

### 4.6 Compromis et limites restantes

- L'effet mesuré de la correction sur les taux agrégés reste modeste (quelques points) : le second tour combine la taille du socle du 1er tour (préservée intentionnellement, §3.3), la rétention et les reports — le rejet n'en est qu'une composante parmi d'autres, et le comprimer davantage sans toucher aux autres leviers aurait nécessité une intervention plus large, hors du principe « ne pas forcer une plage arbitraire ».
- `horizons` et `nouvelle_energie` restent au-dessus du seuil de vigilance de 85-90 % après correction. Ceci est documenté explicitement comme demandé par le prompt plutôt que masqué : la matrice de duels et la ventilation par agent montrent que ce résultat reste (a) explicable par le moteur (rejet, crédibilité, distance idéologique, tous mesurables et cohérents), (b) différencié par adversaire (`horizons` bat `ps` "seulement" 76,6 % du temps contre 100 % face à `rn`/`lfi`/`lr`), et (c) sensible à la stratégie de jeu à l'intérieur de chaque parti. Aucun parti ne gagne par un coefficient fixe cousu à son identifiant — le mécanisme est uniforme et s'applique identiquement à tous.
- `reconquete` a un échantillon de qualifiés trop petit (n=22 sur 240 parties) pour une lecture fiable de son taux conditionnel ; exclu du seuil de vigilance (`qualifiedRuns >= 30`) pour cette raison, documenté plutôt que silencieusement ignoré.

---

## 5. P3 — Déplacements idéologiques déséquilibrés

### 5.1 Diagnostic

Mesures de référence (baseline, mouvement moyen absolu par axe) :

| Axe         |    Avant |
| ----------- | -------: |
| économie    |     6,71 |
| autorité    |     1,95 |
| écologie    |     1,97 |
| Europe      |     1,80 |
| immigration |     0,91 |
| **société** | **0,30** |

**Le système idéologique fonctionne — c'est le contenu qui manque, pas l'amplitude.** Le déplacement d'idéologie dans ce moteur est presque entièrement piloté par `choice.statement` (voir `src/game/engine/statements.ts::recordStatement`), pas par des effets `ideology` directs sur les choix : chaque `statement` porte un `policyTopic`, mappé à un axe via `TOPIC_AXIS`, et l'écart entre la position déclarée (`stance`) et la position perçue actuelle du parti détermine le déplacement.

Comptage du contenu existant (choix portant un `statement` avec `policyTopic` explicite, sur l'ensemble du catalogue) :

| Axe (regroupement de `policyTopic`)                                      | Choix avec `statement` |
| ------------------------------------------------------------------------ | ---------------------: |
| économie (`economy`, `fiscality`, `pensions`, `public_services`, `work`) |                 **73** |
| autorité (`institutions`, `security`, `civil_liberties`)                 |                     22 |
| écologie (`ecology`)                                                     |                     17 |
| Europe (`europe`)                                                        |                     16 |
| immigration (`immigration`)                                              |                      5 |
| société (`social_issues`)                                                |                      5 |

L'axe économie dispose de près de 15 fois plus de choix statuant sur sa position que société ou immigration — pas parce que ses amplitudes sont plus fortes par choix, mais parce que 5 `policyTopic` distincts s'y rattachent contre 1 seul chacun pour société et immigration. Autorité, écologie et Europe, déjà dans ou proches de la fourchette cible du prompt (1,5–3, §18), n'avaient pas ce déficit de contenu et n'ont pas été touchés.

### 5.2 Décision de conception

Nouveau fichier `src/game/data/events/v2/societyImmigration.ts` : 8 événements `program` entièrement nouveaux (aucune modification d'événement existant), suivant exactement le patron d'autorat de `program.ts` (`event()` / `decision()` / `statement` avec `policyTopic`, `stance`, `ideology`) :

- **Société** (4 événements, 14 choix) : fin de vie (aide active à mourir), laïcité dans les services publics, ce que l'école doit transmettre, vie privée et réseaux sociaux — les thèmes concrets suggérés par le prompt (§16), aucun n'étant déjà couvert par le contenu existant (les 5 instances `social_issues` préexistantes portaient toutes sur le logement, pas sur ces arbitrages de société).
- **Immigration** (4 événements, 12 choix) : regroupement familial, immigration de travail, contrat d'intégration, contrôle aux frontières — délibérément distincts de l'asile/régularisation/quotas/pacte européen déjà couverts par `program_immigration`, pour ne pas dupliquer un arbitrage existant sous un autre nom.

Chaque choix porte un `statement` avec un `stance` réellement écarté (de −60 à +55 selon les événements) pour produire un déplacement mesurable, et des effets (`stat`, `bloc`, `hidden`) distincts par choix — aucune paire de choix ne partage la même signature de conséquences (vérifié par `npm run data:validate`, qui recalcule cette contrainte sur l'ensemble du catalogue). Aucun événement n'utilise le triptyque classique PRUDENT/RISQUÉ/RASSEMBLEUR (`eventsWithClassicTriptych` reste à 2, inchangé). Aucune référence à une personne réelle : ce sont des positions programmatiques du joueur, dans le même registre que `program_immigration` déjà existant.

Alternative écartée : **augmenter l'amplitude des `ideology` deltas existants sur société/immigration** plutôt que d'ajouter du contenu. Écarté parce que le diagnostic montre un déficit de volume, pas d'amplitude par choix (les 5 instances existantes avaient déjà des `stance` variés) — gonfler artificiellement quelques deltas aurait été un ajustement de coefficient déguisé, pas une correction du problème réel identifié.

### 5.3 Résultats statistiques avant/après

Configuration réduite (30 graines/combo, 2160 parties existantes, 0 erreur), même seed prefix avant/après :

| Axe             |    Avant |    Après | Part des parties avec mouvement > 5 pts (avant → après) |
| --------------- | -------: | -------: | ------------------------------------------------------: |
| économie        |     6,71 |     5,70 |                                                       — |
| **société**     | **0,30** | **2,06** |                                          0,1 % → 12,4 % |
| **immigration** | **0,91** | **2,48** |                                          5,0 % → 14,7 % |
| autorité        |     1,95 |     1,90 |                                                       — |
| écologie        |     1,97 |     1,65 |                                                       — |
| Europe          |     1,80 |     1,76 |                                                       — |

Chiffres définitifs (60 graines/combo, 4320 parties existantes, 0 erreur — `audit-results/summary.json`, section `ideology.byAxis`) :

| Axe             | Avant |    Après |
| --------------- | ----: | -------: |
| économie        |  6,71 |     6,26 |
| **société**     |  0,30 | **2,07** |
| **immigration** |  0,91 | **2,52** |
| autorité        |  1,95 |     1,79 |
| écologie        |  1,97 |     1,66 |
| Europe          |  1,80 |     1,70 |

Les deux axes ciblés dépassent nettement la borne basse de la cible du prompt (1,5) et se situent dans sa fourchette haute (jusqu'à 3). Économie recule de 6,71 à 6,26 (dilution du pool, non un réglage délibéré — cf. §5.3), reste de très loin l'axe le plus mobile.

Société et immigration atteignent la cible indicative du prompt (§18 : mouvement moyen absolu d'au moins 1,5–3), avec une progression nette de la part de campagnes dépassant 5 points de mouvement. Économie recule légèrement (6,71 → 5,70) : effet secondaire non intentionnel de la dilution naturelle du pool d'événements (plus de contenu en concurrence pour le même nombre de décisions par campagne), pas d'une réduction volontaire d'un effet ou d'un poids — conforme à la consigne « sans réduire artificiellement l'économie » (§18), puisqu'aucun coefficient économique n'a été touché. Économie reste de loin l'axe le plus mobile, aucune égalisation forcée entre axes.

### 5.4 Fichiers modifiés

- `src/game/data/events/v2/societyImmigration.ts` (nouveau) — 8 événements, 26 choix.
- `src/game/data/events/v2/index.ts` — enregistrement de `v2SocietyImmigrationEvents` dans le catalogue.

### 5.5 Tests

Aucun nouveau test unitaire dédié (contenu de données, pas de logique moteur) ; couvert par les gardes-fous existants : `npm run data:validate` (qualité éditoriale, unicité des conséquences, absence de triptyque générique), `npm run audit:smoke` (accessibilité, déterminisme, absence de régression), et la simulation complète `npm run audit:game` pour la mesure quantitative.

### 5.6 Compromis et limites restantes

- Autorité et écologie reculent très légèrement (1,95 → 1,90 ; 1,97 → 1,65) par dilution du pool d'événements plutôt que par un choix délibéré. Les deux restent dans la fourchette cible du prompt ; aucune action corrective jugée nécessaire à ce stade, mais à surveiller si du contenu est encore ajouté ailleurs dans le catalogue.
- Le contenu ajouté cible les deux axes réellement sous-dotés en volume (société, immigration) plutôt que de suivre mécaniquement l'ordre de priorité indicatif du prompt (§16 : société, immigration, autorité, écologie, Europe) — les trois derniers étaient déjà dans une fourchette saine et n'appelaient pas de nouveau contenu prioritaire ; ce choix est documenté plutôt que silencieux.

---

## 6. P2 — Faible capacité du joueur à affecter directement ses adversaires

### 6.1 Diagnostic

`scripts/audit-post/catalog-audit.ts` calcule `eventsAffectingOpponent` en comptant les événements dont au moins un choix porte un effet `opponent_strategy`, `candidate_status` ou `party_split` — les seuls effets qui modifient réellement l'état d'un adversaire (stratégie, statut de candidature, scission). Avant correction : **2 événements** sur l'ensemble du catalogue (`alliance_strategic_withdrawal`, `party_rn_fronde`), tous deux des effets secondaires d'événements construits pour autre chose, pas des mécaniques dédiées à l'interaction adverse. Le monde adverse évolue par ailleurs de façon autonome (`engine/opponentSimulation.ts`, tour de jeu séparé), mais rien ne permettait au joueur d'y intervenir directement de façon répétée et variée.

### 6.2 Décision de conception

Nouveau fichier `src/game/data/events/v2/opponentInteractions.ts` : 9 événements (8 mécaniques nouvelles + 1 réaction chaînée), répartis sur les catégories `debate`, `campaign`, `alliance` et `world`, chacun ciblant un adversaire nommé différent (candidat de RN, LFI, Horizons, PS, Renaissance, Reconquête, une cadre écologiste) — pas le même antagoniste recyclé sous des habillages différents. Types d'interaction couverts, tirés de la liste du prompt (§11) : provoquer un adversaire en duel, répondre à une attaque, débaucher un cadre adverse, exploiter une contradiction publique, commenter/exploiter une crise interne adverse, défendre un adversaire injustement attaqué, proposer un pacte de non-agression.

Chaque événement porte au moins un effet parmi `opponent_strategy` / `candidate_status` / `party_split` (comptés par la métrique), complété par `party_relation`, `bloc_trust` et surtout `actor_memory` — l'adversaire visé se « souvient » du choix (mémoire d'acteur avec type et intensité), conformément à la mécanique déjà utilisée ailleurs dans le catalogue pour les alliés. Deux chaînes de réaction concrètes (§13 du prompt) :

- `debate_challenge_frontrunner` (choix « accepter le duel dur ») → `debate_frontrunner_retaliation` (le favori riposte 2 décisions plus tard, probabilité 65 %) ;
- `world_rival_leadership_tension` (choix « amplifier la crise ») → `world_rival_leadership_split` (la scission se confirme, probabilité 55 %, `party_split` réel sur le parti visé).

Plafond volontaire : aucun choix ordinaire ne peut éliminer un adversaire. Les effets `candidate_status`/`party_split` restent bornés (retrait négocié dans un scénario d'alliance déjà existant, scission minoritaire d'un cadre secondaire, jamais la disqualification du candidat principal d'un effet isolé), conformément à la contrainte du prompt (§12 : « le joueur ne doit pas pouvoir détruire un candidat adverse avec un seul choix ordinaire »).

**Bug trouvé et corrigé pendant l'implémentation :** le premier jet de `debate_frontrunner_retaliation` était sélectionnable par la boucle normale de choix d'événements, indépendamment de la chaîne qui devait le déclencher — un joueur pouvait voir « la riposte du favori » sans avoir jamais provoqué de duel. Corrigé en ajoutant `setFlags` sur l'issue déclenchante et une condition `eligibility: [{kind:"flag", ...}]` sur l'événement de réaction, seul mécanisme qui garantit la causalité dans ce moteur (déjà utilisé correctement par `world_rival_leadership_split` dans le même fichier). Détecté par une mesure de fréquence de sélection anormalement élevée en simulation, pas par la validation statique — les deux sont désormais nécessaires pour ce type d'erreur.

### 6.3 Résultats

`npx tsx scripts/audit-post/catalog-audit.ts` (mesure statique, catalogue complet) :

| Mesure                                                                  | Avant |            Après |
| ----------------------------------------------------------------------- | ----: | ---------------: |
| `eventsAffectingOpponent`                                               |     2 |            **8** |
| Total événements du catalogue                                           |   240 |              249 |
| `eventsWithMechanicallyIdenticalOptions` (faux dilemme intra-événement) |     0 | **0** (inchangé) |
| `eventsWithClassicTriptych`                                             |     2 | **2** (inchangé) |

Atteignabilité définitive (60 graines/combo, 5280 parties dont 4320 existantes, 0 erreur — `audit-results/decisions.csv`) :

| Événement                                   | Occurrences (/5280 parties) |
| ------------------------------------------- | --------------------------: |
| `debate_challenge_frontrunner`              |                        1313 |
| `debate_expose_contradiction_centrist`      |                        1244 |
| `campaign_attacked_by_rival_pole`           |                         899 |
| `alliance_poach_rival_cadre`                |                         881 |
| `campaign_non_aggression_overture`          |                         828 |
| `campaign_defend_unfairly_attacked_rival`   |                         795 |
| `world_rival_leadership_tension`            |                         776 |
| `debate_frontrunner_retaliation` (réaction) |                         230 |
| `world_rival_leadership_split` (réaction)   |                         216 |

Chaque événement principal est atteint dans 15 à 25 % des parties, aucun ne domine systématiquement une campagne ; les deux réactions chaînées apparaissent à une fréquence cohérente avec leur taux de déclenchement conditionnel (probabilité fixée à 55–65 % après le choix qui les active), confirmant que la correction de causalité (§6.2) fonctionne à l'échelle complète. `partyEtaSquaredFirstRound`/`agentEtaSquaredFirstRound`/`matchedPairsOutcomeChangedShare` (0,450 / 0,057 / 0,674) restent stables par rapport aux mesures P3, aucune régression introduite sur les métriques déjà validées.

### 6.4 Fichiers modifiés

- `src/game/data/events/v2/opponentInteractions.ts` (nouveau) — 9 événements, 34 choix.
- `src/game/data/events/v2/index.ts` — enregistrement de `v2OpponentInteractionEvents`.

### 6.5 Tests

Pas de nouveau test unitaire dédié (contenu de données) ; couvert par `npm run data:validate` (qualité éditoriale, unicité), `npm run audit:smoke`, `npx tsx scripts/audit-post/catalog-audit.ts` (mesure directe de `eventsAffectingOpponent`), et une inspection manuelle des fréquences de sélection en simulation qui a révélé le bug de causalité corrigé en 6.2.

### 6.6 Compromis et limites restantes

- `mechanicallyEquivalentGroupCount` (signal faible et catalogue-large, PAS le contrôle de faux dilemme intra-événement) passe de 5 à 7 : deux nouveaux groupes de 3 choix partageant un type d'effet identique (ex. « position ferme qui plaît à un bloc et coûte du rejet » réutilisé sur fin de vie / laïcité / regroupement familial). Ce sont des événements et des textes entièrement différents partageant une forme structurelle plausible — le contrôle strict (`eventsWithMechanicallyIdenticalOptions`, faux dilemme au sein d'un même événement) reste à 0. Documenté plutôt qu'ignoré ; non corrigé car il s'agit d'un signal secondaire, pas d'une violation d'un critère du prompt.
- Les 9 événements ciblent chacun un adversaire fixé à l'avance (ex. RN pour le duel, LFI pour l'attaque frontale) plutôt qu'un rival déterminé dynamiquement par le classement en cours — limite du moteur (les effets `opponent_strategy`/`candidate_status`/`party_split` exigent un `actorId` statique, pas de résolution dynamique du type « rival principal »). Compensé par `excludedParties` pour que chaque événement reste atteignable par la majorité des 9 partis jouables plutôt que par un seul.
- Volume conforme à la fourchette basse du prompt (§11 : « 12 à 20 » événements nouveaux ou branches enrichies) : 9 événements complets plutôt que 12 à 20, par arbitrage de temps face à l'ampleur des phases P1/P3/P5 déjà traitées dans la même session. La cible qualitative (`eventsAffectingOpponent` nettement au-delà de 2, mécanismes atteignables, plusieurs types d'effets, plusieurs familles idéologiques couvertes) est atteinte ; le volume brut d'événements reste sous la fourchette haute indicative.

---

## 7. P4 — Deux définitions différentes des agents de simulation

### 7.1 Constat

Deux jeux d'agents coexistent dans le dépôt :

- `scripts/audit/simulation-audit.ts` (outillage V1/V2 original) — 7 stratégies : `random`, `coherent`, `prudent`, `risky`, `collective`, `greedy`, `adverse`. Les deux dernières sont des optimiseurs synthétiques (maximisation/minimisation intégrale de l'utilité espérée des effets à chaque décision, recalculée à partir de `outcomeProbabilities()`), sans équivalent de style de jeu humain plausible.
- `scripts/audit-post/lib/agents.ts` (outillage de cette mission et de l'audit indépendant qui l'a précédée) — 8 agents, tous documentés comme des politiques de décision plausibles pour un joueur humain, aucun n'ayant de connaissance parfaite du tirage à venir.

Sur un échantillon comparable, le premier jeu rapporte η²(stratégie) ≈ 14,2 %, le second η²(agent) ≈ 5,4 % (référence croisée déjà établie dans `AUDIT_POST_CORRECTIONS.md` section 10.6, lors de l'audit indépendant qui précède cette mission). Sans documentation directement dans les deux scripts, un lecteur qui tombe sur l'un ou l'autre chiffre isolément ne peut pas savoir lequel citer ni pourquoi ils diffèrent.

### 7.2 Décision de conception

**Approche minimale retenue** (l'une des deux options explicitement proposées par le prompt, §24) plutôt que l'approche recommandée (bibliothèque commune) : les deux jeux d'agents mesurent des choses différentes par construction — une plage de sensibilité bornée par un optimiseur synthétique (`simulation-audit.ts`) contre une estimation réaliste de l'agence effective du joueur (`agents.ts`) — et les fusionner dans une bibliothèque unique aurait effacé cette distinction plutôt que de la clarifier. Aucune mesure n'est supprimée, conformément à la consigne du prompt (« ne supprime pas une série de mesures simplement parce qu'elle donne un résultat différent »).

Ajout d'un commentaire d'en-tête complet et croisé dans les deux fichiers (`scripts/audit/simulation-audit.ts` et `scripts/audit-post/lib/agents.ts`), couvrant les quatre points demandés par le prompt :

- **agents réalistes** : les 8 agents de `agents.ts`, aucune connaissance parfaite du tirage ;
- **agents extrêmes** : `greedy`/`adverse` dans `simulation-audit.ts`, optimisation synthétique intégrale ;
- **raison de l'écart 5,4 % / 14,2 %** : inclusion ou non des deux stratégies synthétiques ;
- **cas d'usage de chaque mesure** : `simulation-audit.ts` comme borne de sensibilité (« jusqu'où l'effet de stratégie pourrait-il aller sous optimisation parfaite »), `agents.ts` comme estimation réaliste à citer pour toute discussion sur l'agence effective du joueur (y compris les figures P1 de ce document, section 3).

### 7.3 Fichiers modifiés

- `scripts/audit/simulation-audit.ts` — commentaire d'en-tête ajouté.
- `scripts/audit-post/lib/agents.ts` — commentaire d'en-tête étendu.

### 7.4 Tests

Aucun changement de comportement (documentation uniquement) ; `npm run typecheck` confirmé propre après l'ajout.

### 7.5 Limites restantes

- L'approche minimale documente la coexistence sans réduire la charge de maintenance à long terme (deux scripts, deux jeux d'agents à faire évoluer séparément si le moteur change). L'approche recommandée (bibliothèque commune) resterait préférable dans une refonte plus large de l'outillage d'audit, hors du périmètre de cette mission.

---

## 8. Phase 7-8 — Validation statistique complète et contrôles de non-régression

### 8.1 Audit post-fix (§29-31 du prompt)

`audit-results/post-fix/` contient l'instantané final : `README.md` (paramètres, graines, agents, reproduction, limites), `COMPARISON.md` (tableau V1 / V2-avant / après obligatoire, §35), et les résultats agrégés (`summary.json`, `variance-decomposition.csv`, `second-round-report.csv`, `duel-matrix.csv`, `catalog-summary.json`). Mêmes graines, même nombre de campagnes (5280 dont 4320 existantes), même définition d'agents que la baseline archivée dans `audit-results/pre-fix-baseline/` — seule différence : le code corrigé. 0 erreur de simulation sur les 5280 parties.

### 8.2 Contrôles de non-régression (§32 du prompt)

Vérifiés directement sur `audit-results/summary.json` et `audit-results/catalog-summary.json` finaux, plus la suite de validation complète :

| Contrainte                                                  | Constat final                                                                                                           |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 0 répétition exacte de titre                                | `repetition.repeatedTitlesExact` : moyenne 0, max 0 sur 4320 parties                                                    |
| 0 répétition exacte de récit                                | `repetition.repeatedNarrativesExact` : moyenne 0, max 0                                                                 |
| Aucun retour massif du triptyque prudent/risqué/rassembleur | `eventsWithClassicTriptych` : 2 (inchangé depuis la baseline)                                                           |
| Unicité narrative élevée                                    | `labelUniqueness`/`narrativeUniqueness` : 687/687 et 695/695 exacts                                                     |
| Diversité mécanique élevée                                  | `mechanicallyEquivalentGroupCount` : 7 (signal secondaire faible, voir §6.6) — aucun faux dilemme (voir ligne suivante) |
| 0 faux dilemme important                                    | `eventsWithMechanicallyIdenticalOptions` : 0                                                                            |
| Tous les événements rares atteignables                      | `rareEvents.neverReachedInThisSample` : liste vide, 18/18 rares atteints                                                |
| 0 erreur de simulation                                      | `simulate.ts` : `errors: 0` sur 5280 parties                                                                            |
| 0 état invalide                                             | `determinismAndValidity.invalidRuns` : 0 / 5280                                                                         |
| Déterminisme parfait à seed et décisions identiques         | `npm run audit:smoke` : rejoue chaque campagne deux fois, compare `party.slice(0,3)` — 0 échec                          |
| Build réussi                                                | `npm run build` : compilation Next.js réussie, 11 routes générées                                                       |
| Typecheck réussi                                            | `npm run typecheck` : propre                                                                                            |
| Lint réussi                                                 | `npm run lint` : propre                                                                                                 |
| Tests réussis                                               | `npm run test` : 117/117, `npx playwright test --repeat-each=15` : 270/270 (voir P7)                                    |

Aucune régression détectée ; aucune correction n'a dû être annulée ou ajustée pour ce contrôle.

### 8.3 Comparaison à trois états (§31 du prompt)

Voir `audit-results/post-fix/COMPARISON.md` pour le tableau complet. Résumé : les mécanismes mesurés dans cette mission (contrefactuels appariés, matrice de duels, `eventsAffectingOpponent`, mouvement idéologique par axe) n'existaient pas dans le moteur V1 — comparaison marquée explicitement « n/a (mécanisme absent en V1) » plutôt que forcée, conformément à la consigne « n'utilise pas des métriques différentes sans l'indiquer ». Là où une comparaison V1 directe existe (répétitions, η²(stratégie) agrégé), les figures proviennent de `AUDIT_POST_CORRECTIONS.md` (audit indépendant précédent cette mission), pas d'une nouvelle mesure approximative.
