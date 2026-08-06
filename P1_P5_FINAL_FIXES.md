# P1_P5_FINAL_FIXES — Chantiers ciblés P1 (agence réelle) + P5 (second tour crédible)

Document de suivi de `PROMPT_CLAUDE_CODE_CHANTIERS_P1_P5.md`. Rempli phase par phase, au fur et à mesure de l'implémentation.

Baseline : commit `42f0447`, branche `codex/v2-audit-improvements`. Archive figée dans `audit-results/p1-p5-baseline/`.

---

## 1. Résumé exécutif

_Complété à la fin de la mission._

## 2. Baseline reproduite

Voir `audit-results/p1-p5-baseline/README.md` — tous les chiffres du prompt (§2) reproduits et confirmés avant modification :

- P1 : η²(parti) 1er tour 45,02 % / η²(agent) 5,72 % ; η²(parti) progression brute 76,10 % / η²(agent) 2,49 % ; η²(parti) progression normalisée 73,10 % / η²(agent) 2,98 % ; η²(agent) sur-performance vs neutre 10,98 % ; changement d'issue apparié 67,4 %.
- P5 : Horizons 93,2 %, Nouvelle Énergie 91,0 %, Renaissance 84,1 %, LR 82,6 %, PS 80,0 %, Écologistes 73,3 %, LFI 55,5 %, RN 39,1 % (victoire | qualification).

Suite de validation initiale entièrement verte (format/lint/typecheck/data:validate/test/build/audit:smoke/audit:game/E2E).

## 3. Diagnostic P1

### Réponses aux 12 questions (§8 du prompt)

1. **Part structurelle vs déplaçable par la campagne** : la part structurelle domine. `base = 8.2 + baseSupport*0.58 + awareness*0.02` (multiplié par `ideologicalFit*affinity*electoralReadiness`) est le terme dominant de `partyAppeal()`. Le terme `competence` (credibility*0.18 + popularity*0.15 + mobilization*0.09) existe mais reste modeste une fois dilué par la normalisation multi-partis et le lissage temporel (`previous*0.62 + fresh*0.38` à chaque recalcul).
2. **Effets sur des stats indirectes trop faibles** : pire que ça — deux stats richement modifiées par le contenu ne sont **jamais lues** par la formule de vote : `party.stats.cohesion` (221 effets `stat("cohesion", ...)` dans le catalogue) et `hidden.consistency` (modifié à chaque déclaration via `statements.ts`). Vérifié par recherche exhaustive : `grep -n "stats\.cohesion\|hidden\.consistency" src/game/engine/electorate.ts src/game/engine/election.ts` → aucune occurrence.
3. **Convergence des stats positives** : `credibility`/`popularity`/`mobilization` montrent une différenciation réelle mais modérée après les rendements décroissants du chantier précédent (sondage à 8 agents × 15 graines, PS : credibility 77,1–97,5 ; popularity 56,2–75,9 ; mobilization 74,2–93,3). `awareness` est quasi invariant (92,2 pour tous les agents) — pas une saturation, mais un contenu rare (17 effets seulement dans tout le catalogue contre 221 pour cohesion).
4. **Agents font-ils évoluer des variables différentes** : oui, nettement — `cohesion` finale varie de 28,8 (contrarien) à 93,3 (parti_dabord, en mobilisation) selon la stratégie, `rejection` de 70,4 à 86,5.
5. **Variables ignorées ou sous-utilisées** : `cohesion` et `hidden.consistency` (jamais lues pour le vote), `hidden.potentialSupport` (jamais lu pour le vote, seulement pour la métrique de progression).
6. **`potentialSupport` agit-il sur le vote ou la métrique** : confirmé — uniquement sur la métrique (`src/game/engine/progression.ts`). Aucune référence dans `electorate.ts` ni `election.ts`.
7. **Bruit/adversaires/socle** : le bruit électoral direct au 1er tour (`randomBetween(rng, -3.2, 3.2)`) est loin d'être négligeable face au spread inter-agents observé (~1,6 à 2,3 points après 20 décisions), mais n'est pas la cause principale — le socle structurel et la normalisation cross-partis dominent davantage.
8. **Asymétrie positif/négatif** : oui, voulue — les rendements décroissants (chantier précédent) n'atténuent que les effets positifs, jamais les négatifs.
9. **Effet cumulatif vs convergence rapide** : spread réel observé en fin de campagne (pas de convergence totale), mais l'ampleur reste modeste comparée au socle.
10. **Cohérence/contradictions/crédibilité thématique/relations** : `statementLedger` modifie `hidden.consistency` et donne +1 crédibilité pour une évolution cohérente, mais `consistency` lui-même n'a aucun effet électoral direct. Pas de notion de « crédibilité thématique » distincte par sujet (économie, sécurité, etc.) — toute la crédibilité gagnée est fongible dans un seul stock global.
11. **Gains ciblés par bloc via choix cohérents sur un thème** : partiellement — `applyElectorateResponse` (`statements.ts`) ajuste déjà `trustModifiers` par bloc selon la proximité stance/bloc et la priorité du bloc (mécanisme réel, pas mort), mais sans mémoire cumulative explicite : chaque déclaration produit un ajustement isolé, une suite cohérente sur un même thème ne s'auto-renforce pas.
12. **Courbes de sondage distinctes selon l'agent** : oui, mesurable. Sondage direct (PS, 8 agents × 15 graines) : à J+20 décisions, écart de 12,96 (contrarien) à 14,60 (idéologiquement cohérent) — 1,64 point ; au premier tour, écart de 13,37 à 15,62 — 2,25 points sur une base ≈14–15 %.

### Conclusion diagnostique

Le problème n'est pas un manque de contenu différenciant les agents (`cohesion` en particulier est richement modifiée), mais un **défaut de câblage** : deux stats déjà vivantes et différenciées par la stratégie de jeu (`cohesion`, `hidden.consistency`) n'ont aucune conséquence électorale. Les activer est une correction minimale et systémique (aucun nouveau mécanisme de contenu requis, aucun coefficient par parti) qui utilise des signaux déjà authentiquement pilotés par les choix du joueur.

### Plan retenu

1. Câbler `hidden.consistency` et `party.stats.cohesion` dans `partyAppeal()` (`electorate.ts`), avec un terme centré sur 50 (`(valeur − 50) × coefficient`) pour ne pas changer la calibration d'un parti à la valeur de départ neutre.
2. Évaluer un ajustement modéré du poids de lissage (`fresh` dans `previous*0.62 + fresh*0.38`) si les deux activations ci-dessus ne suffisent pas — seulement si cela n'introduit pas d'instabilité (§25 : ni insensible, ni chaotique).
3. Mesurer par simulation réduite (20-30 graines/combo) avant de passer à l'échelle complète ; abandonner toute variante qui n'améliore que la métrique d'audit sans effet réel sur `progressionNormalized`/`progression` calculées dans une partie unique.

## 4. Variantes P1 testées

Mesures rapides (`AUDIT_SEEDS_PER_COMBO=25 AUDIT_INCLUDE_CUSTOM=0`, ~4 min/run) pour calibrer les deux coefficients avant de lancer l'échelle complète.

| Variante                                            | η²(parti) progressionNormalized | η²(agent) progressionNormalized | η²(parti) 1er tour |
| --------------------------------------------------- | ------------------------------: | ------------------------------: | -----------------: |
| Baseline (aucun câblage)                            |                         73,10 % |                          2,98 % |            45,02 % |
| Essai 1 : cohesion×0.12 + consistency×0.10          |                          67,0 % |                          ~6-7 % |              ~35 % |
| Essai 2 (retenu) : cohesion×0.16 + consistency×0.14 |                         64,65 % |                          ~8-9 % |              ~35 % |

L'essai 1 restait trop proche du seuil « souhaité » 65 % ; l'essai 2 (coefficients relevés de +0,04 chacun) le franchit nettement en échantillon réduit tout en gardant `firstRoundScore` (parti) dans la bande mandatée 35–55 %. Coefficients volontairement arrêtés à ce niveau : les pousser davantage aurait fait passer `firstRoundScore` (parti) sous le plancher de 35 % (§9/§25 du prompt : un parti central peut garder un avantage mais la difficulté propre à chaque parti ne doit pas s'effacer). Aucune variante testée n'a modifié le poids de lissage `previous*0.62 + fresh*0.38` — l'activation des deux leviers morts a suffi, l'étape 2 du plan retenu (section 3) n'a pas été nécessaire.

## 5. Correction P1 retenue

Activation de deux leviers déjà vivants dans le contenu mais jamais lus par `partyAppeal()` (`src/game/engine/electorate.ts`) :

```ts
const cohesionBonus = (party.stats.cohesion - 50) * 0.16;
const consistencyBonus = (party.hidden.consistency - 50) * 0.14;
```

ajoutés à la somme retournée par `partyAppeal()`, aux côtés de `competence`. Centrage sur 50 (valeur de calibration de départ des deux stats) : un parti resté neutre sur ces deux axes ne voit strictement aucun changement de difficulté. Aucun coefficient par identifiant de parti, aucun plafond de victoire, aucun filtrage — correction purement structurelle et générique, applicable identiquement aux 9 partis existants et au parti personnalisé.

## 6. Résultats P1 avant/après

Simulation à pleine échelle (`npm run audit:game`, mêmes graines que la baseline, 5280 runs, 0 erreur) :

| Métrique                                   | Baseline | Après P1 | Cible mandatoire    | Cible souhaitée |
| ------------------------------------------ | -------: | -------: | ------------------- | --------------- |
| η²(agent) progressionNormalized            |   2,98 % |   8,98 % | ≥ 5 %               | 7–15 %          |
| η²(parti) progressionNormalized            |  73,10 % |  67,18 % | nettement < 73,10 % | < 65 %          |
| η²(parti) 1er tour                         |  45,02 % |  35,18 % | reste dans 35–55 %  | —               |
| η²(agent) 1er tour                         |   5,72 % |  18,55 % | —                   | —               |
| Changement d'issue apparié (matched pairs) |   67,4 % |   78,3 % | ne doit pas baisser | —               |

**Tous les critères mandatoires sont satisfaits** : η²(agent) progression passe de 2,98 % à 8,98 % (dans la fourchette souhaitée 7–15 %, et bien au-dessus du plancher de 5 %) ; η²(parti) progression chute nettement de 73,10 % à 67,18 % ; le changement d'issue apparié progresse de 67,4 % à 78,3 %.

**Deux points à signaler honnêtement plutôt qu'à maquiller :**

- η²(parti) progressionNormalized à pleine échelle (67,18 %) est légèrement **au-dessus** de la cible souhaitée de 65 %, alors que la mesure rapide à 25 graines/combo l'avait placé à 64,65 % (sous la cible). Écart attribuable à la variance d'échantillonnage entre 25 et 60 graines/combo, pas à un changement de code entre les deux runs. La cible mandatoire (« nettement sous 73,10 % ») reste largement atteinte (−5,92 points, soit environ 8 % de baisse relative) ; la cible souhaitée est ratée de peu (+2,18 points) et n'a pas été forcée en poussant les coefficients plus loin, car cela aurait fait sortir `firstRoundScore` (parti) de sa bande mandatée (voir point suivant).
- `firstRoundScore` (parti) à pleine échelle est à **35,18 %**, tout juste au-dessus du plancher mandaté de 35 %. C'est volontaire (voir section 4) : ne pas pousser davantage les coefficients pour préserver ce plancher, au prix de ne pas atteindre pleinement la cible souhaitée sur `progressionNormalized`. Un futur ajustement viserait plutôt un troisième levier indépendant (par ex. un terme de campagne cumulée distinct du socle) plutôt que de re-pousser cohesion/consistency, qui sont déjà proches de leur limite raisonnable (§25 : gain borné, testé explicitement dans `electorate.test.ts`).

Identité des partis préservée à pleine échelle (`raw-runs.csv`, moyenne sur les runs `existing`) : Reconquête reste le parti le plus difficile (finalScore moyen 56,0, firstRound 9,65) et PS/Horizons restent les plus favorisés (finalScore 82,0/81,8) — aucune homogénéisation, la hiérarchie de difficulté relative entre partis est intacte.

## 7. Diagnostic P5

### Constat chiffré (baseline, `audit-results/p1-p5-baseline/second-round-report.csv`)

| Parti                | Rejet propre | Distance idéo. moy. à l'adversaire | Victoire \| qualification |
| -------------------- | -----------: | ---------------------------------: | ------------------------: |
| horizons             |         49,9 |                               49,8 |                    92,3 % |
| nouvelle_energie     |         39,0 |                               53,2 |                    92,2 % |
| renaissance          |         67,1 |                               54,8 |                    82,8 % |
| lr                   |         70,1 |                               63,3 |                    80,2 % |
| ps                   |         79,8 |                               69,1 |                    79,4 % |
| ecologistes          |         45,3 |                               70,3 |                    68,4 % |
| lfi                  |         69,3 |                               75,7 |                    53,4 % |
| rn                   |         88,0 |                               84,2 |                    42,9 % |
| reconquete (n petit) |         79,2 |                               73,1 |                    33,3 % |

**Corrélation quasi parfaite entre distance idéologique moyenne à l'adversaire et taux de victoire conditionnelle** — bien plus nette que la seule corrélation au rejet. La preuve la plus directe : `ecologistes` a un rejet **bas** (45,3, proche de `horizons`) mais une distance idéologique **élevée** (70,3, proche de `lfi`/`reconquete`) et un taux de victoire conditionnelle nettement inférieur à `horizons` (68,4 % contre 92,3 %). Le rejet seul ne peut pas expliquer cet écart — c'est la centralité idéologique qui domine.

### Réponses aux 12 questions (§16 du prompt)

1. **Horizons/Nouvelle Énergie gagnent-ils parce qu'ils affrontent plus souvent certains partis ?** Partiellement examiné via `duel-matrix.csv` (baseline) : `horizons` bat `ps` "seulement" 76,6 % du temps contre 100 % face à `rn`/`lfi`/`lr` — donc oui, l'identité de l'adversaire compte, mais la distance moyenne à l'adversaire (calculée sur tous les duels rencontrés, pas un seul) reste le facteur le plus prédictif dans le tableau ci-dessus.
2. **Meilleure rétention de leur propre vote ?** Non — la formule de rétention (`0.86 + mobilization/1000 - rejection/2200`, plage [0,78–0,95]) est symétrique et son amplitude est modeste (≤ 0,17 point d'écart maximal théorique) ; elle ne peut pas expliquer un écart de 50 points de victoire conditionnelle.
3. **Part excessive de presque tous les électorats éliminés ?** Oui — c'est le mécanisme central : `runoffAppeal()` compare deux scores d'appel puis les normalise en part directe (`leftAppeal / (leftAppeal + rightAppeal)`), sans plafond. Un avantage d'appel modeste mais systématique (distance + rejet tous deux favorables) se traduit en une part largement majoritaire de **chaque** bloc éliminé, sans plafond amortissant.
4. **Abstention trop faible chez les électeurs éloignés des deux finalistes ?** L'abstention dépend de `closestDistance` (le plus proche des deux finalistes, pas la moyenne des deux) — un bloc peut être très éloigné d'un des deux finalistes sans que cela augmente l'abstention, tant qu'il reste proche de l'autre. Cohérent avec la réalité électorale (barrage), mais ne capture pas le cas où les deux finalistes inspirent peu.
5. **Proximité idéologique calculée sur des axes trop simplifiés ?** Non — `ideologyDistance()` utilise les 6 axes complets (économie, société, Europe, écologie, autorité, immigration), une RMS distance standard. Pas un défaut de simplification.
6. **Rejet trop/pas assez important pour les partis modérés ?** Le rejet reste un facteur réel (`ecologistes` avec rejet bas performe mieux que `rn`/`lfi` à distance équivalente), mais il n'est plus le facteur dominant après la correction concave du chantier précédent — la distance idéologique a pris le relais comme facteur principal.
7. **Alliances et consignes cumulées trop fortement ?** Non examiné comme excessif ; en revanche, l'abstention n'intègre actuellement PAS l'alliance (`allianceModifier` existe dans `runoffAppeal` mais pas dans le calcul d'`abstentionRate`) — incohérence mineure à corriger (§18 : l'abstention doit diminuer si une alliance existe).
8. **Facteurs comptés deux fois ?** Le rejet intervient dans `leftRetention`/`rightRetention` (effet faible) ET dans `runoffAppeal` via `diminishingRejectionPenalty` (effet fort) — ce n'est pas un double comptage au sens strict (deux mécanismes différents : rétention de son propre vote vs attractivité pour les reports), mais les deux pointent dans le même sens, ce qui amplifie l'effet du rejet sans le dupliquer artificiellement.
9. **Le candidat central bénéficie-t-il mécaniquement des deux côtés sans coût ?** **Oui, confirmé — c'est la cause racine principale.** Rien dans le moteur ne pénalise une position idéologique centrale : `runoffAppeal` traite la proximité comme un pur avantage, jamais comme un coût (pas de pénalité de mobilisation, d'enthousiasme ou de fidélité électorale liée à la centralité). Une position centrale réduit mécaniquement `distance` face à la plupart des adversaires potentiels, sans aucune contrepartie prévue par le prompt (§19).
10. **Biais d'échantillon dans le choix de l'adversaire ?** Chaque parti affronte un mélange d'adversaires représentatif de qui se qualifie dans les mêmes graines ; pas de biais de sélection artificiel identifié — le déséquilibre vient de la formule, pas de l'échantillon.
11. **Campagnes de second tour réellement simulées ?** Le second tour utilise l'état complet du parti (stats, idéologie, relations) au moment du premier tour, plus le bruit électoral (±4) — il n'y a pas de décisions dédiées au second tour dans le catalogue actuel (pas d'événements `between_rounds` orientés second-tour spécifique au-delà de ce qui existe déjà pour l'entre-deux-tours).
12. **Les décisions avant le second tour peuvent-elles modifier les reports ?** Oui indirectement — toute décision qui modifie `credibility`, `mobilization`, `rejection`, `hidden.consistency` (désormais actif, chantier P1), une alliance ou une relation influence `runoffAppeal()`. Le canal existe déjà.

### Conclusion diagnostique

La cause racine principale n'est pas un rejet mal calibré (déjà traité) mais l'**absence de coût de centralité** : `runoffAppeal()` convertit un avantage de proximité idéologique en part de voix sans plafond ni contrepartie, ce qui permet à un parti structurellement central de capter une part largement majoritaire de **chaque** électorat éliminé, dans **chaque** duel, indépendamment de l'identité de l'adversaire.

### Plan retenu

1. **Compresser la conversion appel → part de voix** : au lieu de `leftAppeal / (leftAppeal + rightAppeal)` brut (peut approcher 0 ou 1), amortir l'écart par rapport à 50/50 par un facteur `<1`, pour qu'un avantage d'appel se traduise en avantage réel mais jamais en quasi-monopole d'un électorat éliminé.
2. **Coût structurel de centralité** : calculer, pour chaque parti actif, une distance idéologique moyenne à tous les autres partis actifs (propriété purement géométrique, recalculée à chaque duel, jamais codée par identifiant de parti) et appliquer une pénalité modeste de mobilisation/momentum au second tour proportionnelle à cette centralité — un parti structurellement proche de la moyenne du champ politique paie un léger coût d'enthousiasme, cohérent avec §19 (« manque de mobilisation, électorat moins fidèle, faible enthousiasme »).
3. **Ajouter l'alliance au calcul de l'abstention** (actuellement absente, incohérence mineure avec §18).
4. Conserver la structure à deux étages (abstention puis répartition A/B) — la conservation de masse (report A + report B + abstention = 100 % de l'électorat éliminé) est déjà garantie arithmétiquement ; une réécriture complète en softmax à trois issues n'est pas jugée nécessaire si les leviers ci-dessus suffisent à corriger le problème diagnostiqué (le prompt autorise cette approche : « préférable... si le moteur actuel produit des reports excessifs », pas une obligation absolue).

## 8. Variantes P5 testées

Après implémentation initiale (`runoffShareSplit` avec amortissement à `RUNOFF_SHARE_DAMPING=0.62` + `centralityCost` + alliance dans l'abstention), la mesure rapide (`AUDIT_SEEDS_PER_COMBO=25 AUDIT_INCLUDE_CUSTOM=0`) a révélé un effet secondaire à examiner avant de valider : le taux de victoire conditionnelle du RN passait de 42,9 % (baseline archivée) à 53,3 %. Investigation avant d'accepter ou de rejeter la variante (méthode imposée : « abandonner toute variante qui n'aide la métrique qu'au détriment du jeu ») :

| Variante                                                              | Horizons (victoire\|qualif.) | Nouvelle Énergie |     RN |
| --------------------------------------------------------------------- | ---------------------------: | ---------------: | -----: |
| Baseline archivée (aucune correction)                                 |                       92,3 % |           92,2 % | 42,9 % |
| `RUNOFF_SHARE_DAMPING=1` (aucun amortissement, `centralityCost` seul) |                       80,5 % |           92,7 % | 50,5 % |
| `RUNOFF_SHARE_DAMPING=0.8` (amortissement modéré)                     |                       79,9 % |           92,0 % | 51,1 % |
| `RUNOFF_SHARE_DAMPING=0.62` (retenue)                                 |                       79,3 % |           88,3 % | 53,3 % |

**Diagnostic de l'effet secondaire** : avec `centralityCost` seul (amortissement désactivé), Horizons baisse déjà nettement (92,3 %→80,5 %) mais Nouvelle Énergie reste quasiment inchangée (92,2 %→92,7 %). Cause identifiée par inspection du contenu (`src/game/data/parties.ts`) : Nouvelle Énergie démarre avec `rejection: 28` en `baseline`, le rejet initial le plus bas de tous les partis, explicitement listé comme force du parti (« Rejet initial faible »). Sa domination au second tour vient donc majoritairement d'un rejet structurellement bas (un trait de contenu voulu, pas un bug de centralité géométrique), et non de sa seule position idéologique. `centralityCost`, purement géométrique, ne peut logiquement pas capturer cet avantage-là. Seul l'amortissement de la part de voix (`runoffShareSplit`), qui compresse tout écart d'appel brut vers 50/50 quelle qu'en soit la source, réduit effectivement l'avantage de Nouvelle Énergie — mais il compresse par construction aussi l'écart (structurellement défavorable et légitime) du RN.

**Décomposition de la hausse du RN** : sur les 10,4 points de hausse totale (42,9 %→53,3 %), 7,6 points apparaissent déjà avec `centralityCost` seul (sans amortissement) — c'est-à-dire qu'ils viennent du retrait de l'avantage de centralité de ses adversaires typiques, un effet indirect voulu et légitime (un adversaire qui ne bénéficie plus d'un report quasi automatique laisse mécaniquement plus de marge à tous ses concurrents, RN inclus). Seuls 2,8 points supplémentaires viennent de l'amortissement lui-même. Le taux de victoire **global** (non conditionnel) du RN reste nettement inférieur à celui d'Horizons même après correction (48,5 % contre 65 % sur l'échantillon réduit) — le RN reste clairement outsider, il n'est pas devenu favori.

**Décision** : conserver `RUNOFF_SHARE_DAMPING=0.62`. Les deux valeurs plus faibles testées (`1` et `0.8`) échouent à corriger Nouvelle Énergie — l'un des deux partis explicitement cités par le prompt comme problème à résoudre — alors que `0.62` corrige les deux partis cités sans faire du RN un favori (il reste loin derrière Horizons en taux de victoire global). Écarter ces variantes reviendrait à n'a corriger qu'la moitié du problème diagnostiqué.

## 9. Correction P5 retenue

Trois modifications systémiques dans `src/game/engine/election.ts`, aucune par identifiant de parti :

1. **`centralityCost(state, partyId)`** : coût géométrique (distance idéologique moyenne aux autres partis actifs, recalculée à chaque duel) soustrait de `runoffAppeal()` pour le finaliste — pénalise un positionnement structurellement central, sans jamais référencer un identifiant de parti.
2. **`runoffShareSplit(leftAppeal, rightAppeal)`** : convertit deux scores d'appel en part de voix amortie vers 50/50 (`RUNOFF_SHARE_DAMPING=0.62`), remplaçant le ratio brut sans plafond — empêche qu'un avantage d'appel (centralité ou rejet bas) ne se traduise en quasi-monopole d'un électorat éliminé.
3. **Alliance ajoutée au calcul de l'abstention** dans `simulateSecondRound` (incohérence mineure corrigée : l'alliance réduisait déjà le report côté `runoffAppeal` mais pas l'abstention).

## 10. Résultats P5 avant/après

Simulation à pleine échelle (`npm run audit:game`, mêmes graines que la baseline, 5280 runs, 0 erreur) :

| Parti                | Victoire\|qualif. baseline | Victoire\|qualif. après P5 | Victoire globale baseline | Victoire globale après P5 |
| -------------------- | -------------------------: | -------------------------: | ------------------------: | ------------------------: |
| horizons             |                     92,3 % |                     86,9 % |                    69,8 % |                    69,4 % |
| nouvelle_energie     |                     92,2 % |                     88,8 % |                    56,9 % |                    64,4 % |
| renaissance          |                     82,8 % |                     80,6 % |                    65,4 % |                    54,4 % |
| ps                   |                     79,4 % |                     82,5 % |                    72,3 % |                    67,7 % |
| lr                   |                     80,2 % |                     72,4 % |                    64,0 % |                    47,5 % |
| ecologistes          |                     68,4 % |                     73,0 % |                    46,9 % |                    43,3 % |
| lfi                  |                     53,4 % |                     54,2 % |                    46,0 % |                    43,3 % |
| rn                   |                     42,9 % |                     53,5 % |                    39,4 % |                    47,3 % |
| reconquete (n petit) |                     33,3 % |                     44,2 % |                     3,1 % |                     4,8 % |

**Les deux partis explicitement cités par le prompt sont corrigés** : Horizons passe de 92,3 % à 86,9 % de victoire conditionnelle (−5,4 points), Nouvelle Énergie de 92,2 % à 88,8 % (−3,4 points) — les deux sortent de la zone « quasi automatique » (>90 %) sans devenir des partis faibles : ils restent, de loin, les favoris du second tour. Aucun duel non-RN/non-LFI avec n≥30 ne reste proche de 100/0 dans `duel-matrix.csv` (les deux seuls cas restants — Horizons vs LFI 97,3 %, n=37 ; Horizons vs RN 98,1 %, n=154 — étaient déjà à 100 % dans la baseline archivée et reflètent un rejet structurellement élevé de LFI/RN, pas un avantage de centralité).

**Sur le RN, honnêteté plutôt que maquillage** : le taux de victoire conditionnelle du RN monte de 42,9 % à 53,5 % (+10,6 points), un effet mesuré et anticipé pendant le calibrage (section 8), pas découvert après coup. Trois éléments soutiennent qu'il s'agit d'une conséquence légitime du retrait de l'avantage de centralité de ses adversaires typiques plutôt que d'un boost artificiel du RN :

1. Aucun terme du moteur ne cible le RN par identifiant — le RN ne bénéficie d'aucune réduction de `centralityCost` (sa distance idéologique moyenne aux autres partis actifs, 81,96, reste largement au-dessus de la référence de 70 : il continue de payer un coût nul, comme n'importe quel parti aussi excentré).
2. Décomposé pendant le calibrage (section 8) : l'essentiel de la hausse (≈73 %, soit 7,6 des 10,4 points mesurés en échantillon réduit) vient du retrait de l'avantage de centralité de ses adversaires — un adversaire qui ne bénéficie plus d'un report quasi automatique laisse mécaniquement plus de marge à tous ses concurrents, RN inclus. Seule une fraction vient de l'amortissement `runoffShareSplit`, qui compresse aussi l'écart de rejet du RN (un compromis assumé, pas ignoré).
3. Le RN reste nettement moins favori qu'Horizons en probabilité de victoire **globale** (toutes campagnes confondues, pas seulement celles où il se qualifie) : 47,3 % contre 69,4 % — un écart de 22 points, en réalité peu différent de l'écart baseline (39,4 % contre 69,8 %, 30,4 points). Le RN reste clairement l'outsider structurel ; il n'est pas devenu favori et son rejet propre (87,4, quasi inchangé face à 88,0 en baseline) continue de le pénaliser lourdement.

Non-régressions confirmées à pleine échelle : 0 run invalide sur 5280, 0 titre/narration répétée (`repetition.repeatedTitlesExact.mean = 0`), η²(parti)/η²(agent) de P1 inchangés (0,6718/0,0898, cohérent avec la section 6 — P5 ne touche que le second tour), `matchedPairsOutcomeChangedShare` à 80,9 % (légèrement supérieur au run P1 seul, 78,3 %, sans dégradation).

## 11. Tests

_À compléter — liste des tests unitaires ajoutés (§24 du prompt)._

## 12. Non-régressions

_À compléter — voir §26 du prompt._

## 13. Compromis

_À compléter._

## 14. Limites restantes

_À compléter._

## 15. Verdict final

_À compléter — voir le verdict affiché dans le terminal en fin de mission (§31 du prompt)._
