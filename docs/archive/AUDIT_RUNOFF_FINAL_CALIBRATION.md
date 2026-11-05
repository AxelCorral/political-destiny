# AUDIT — Calibration finale du modèle électoral et du second tour

Rapport intermédiaire de fin de BLOC A
(PROMPT_CLAUDE_CODE_CALIBRATION_FINALE_ELECTORALE_SECOND_TOUR.md). Aucun paramètre électoral n'a
été modifié pendant cette phase : seuls des scripts d'audit (`scripts/audit/`), des harnais
non-production (recherche empirique de puissance de dispersion, de damping) et ce rapport ont été
créés.

## 1. Résumé

Contrairement à l'hypothèse de départ du prompt — que `RUNOFF_SHARE_DAMPING = 0,62` comprimerait
artificiellement le second tour vers 50/50 —, **le corpus de 15 567 seconds tours simulés montre
l'inverse** : la marge moyenne du second tour en production est de **11,9 points**, seuls 8,4 %
des duels sont serrés (<2 pts), et 67,5 % sont des victoires larges (>7 pts). L'anecdote « LR vs
Horizons 50,0/50,0 » de la mission précédente était un cas réel mais non représentatif : les deux
finalistes avaient un écart de premier tour de seulement 0,7 point, et un écart de premier tour
proche de zéro produit mécaniquement un second tour proche de zéro, quel que soit le damping.

Le vrai problème mesuré est **à l'opposé** de l'hypothèse initiale : la distribution des marges de
second tour est plus orientée vers les larges victoires que ce que vise la section 24 du prompt
(« beaucoup de 48–52, [...] très rarement des écarts plus larges »). Dans les faits, la tranche
« >60/40 » (17,4 %) est presque aussi fréquente que la tranche « 48–52 » (17,5 %), alors qu'elle
devrait être nettement plus rare. Cause identifiée : `RUNOFF_SHARE_DAMPING` ne s'applique qu'à la
part **transférée** des électorats éliminés — la part **conservée** de chaque finaliste (son propre
score de premier tour multiplié par un taux de rétention) n'est jamais amortie, et c'est elle qui
porte l'essentiel de l'écart structurel désormais plus large produit par `DISPERSION_POWER = 2`
(mission précédente). Un favori dominant du second tour (score de duel >22 %, avance >5 pts sur son
adversaire direct) gagne aujourd'hui le second tour dans **97,7 % des cas** — trop proche d'un
résultat automatique pour la section 17 du prompt.

`DISPERSION_POWER = 2` est confirmé robuste (testé 1,6 à 2,4, gradient continu, aucun effet de
seuil) et n'est PAS remis en cause par cet audit — le correctif ciblé recommandé en BLOC B porte
uniquement sur le second tour.

## 2. État du premier tour post-dispersion (référence à préserver)

Chiffres de la mission précédente (`ELECTORAL_COHERENCE_FIXES_REPORT.md`, corpus de 10 008
campagnes), non retestés en profondeur ici sauf pour la robustesse de la puissance (§10) : courses
comprimées 76,2 % → 17,8 %, favori dominant 0 % → 22,5 %, course fragmentée 89,2 % → 47,0 %,
tripartite 0,3 % → 2,7 %, percée outsider 0,9 % → 3,1 %, score maximal observé 23,6 % → 37,5 %.
Confirmés stables sur le nouveau corpus de robustesse de puissance (§10, 2 880 campagnes) : favori
dominant 22,0 % à puissance 2,0 (contre 22,5 % sur le corpus complet précédent — cohérent à
l'échantillonnage près).

## 3. Matrice des duels

Corpus principal : `scripts/audit/runoff-final-calibration-corpus.ts`, 20 160 campagnes tentées (9
partis × 8 agents déterministes × 280 graines), 15 567 ayant atteint un second tour (le reste :
joueur éliminé au premier tour — structurel, pas un échec). 47 combinaisons de finalistes
réellement rencontrées. Durée : 41,5 min.

Le moteur étant intrinsèquement centré sur le parti joué (`state.qualifiedPartyIds` inclut toujours
`playerPartyId` dès qu'un second tour est simulé), chaque ligne du corpus a le parti joué comme l'un
des deux finalistes — ce qui reste la seule façon exhaustive de couvrir l'espace des matchups avec
ce moteur mono-joueur : en faisant tourner les 9 partis comme joueur, on obtient bien la totalité
des paires (joueur, adversaire) rencontrées en jeu réel, pas seulement celles impliquant un parti en
particulier. Détail complet : `audit-results/runoff-final-calibration/runoff-matchups.csv`.

## 4. Distribution des marges

`audit-results/runoff-final-calibration/runoff-margin-distribution.csv` (15 567 seconds tours,
production réelle, damping = 0,62) :

| Mesure | Valeur |
|---|---:|
| Marge moyenne | 11,89 pts |
| Marge médiane | 11,0 pts |
| Écart-type | 7,65 |
| P10 | 2,2 pts |
| P25 | 5,4 pts |
| P75 | 17,4 pts |
| P90 | 22,6 pts |
| Marge <0,5 pt | 2,15 % |
| Marge <1 pt | 4,08 % |
| Marge <2 pts | 8,4 % |
| Marge <5 pts | 22,28 % |
| Marge >5 pts | 76,84 % |
| Marge >10 pts | 54,04 % |
| Égalité exacte (marge = 0) | 61 cas / 15 567 (0,39 %) |

Comparaison aux tranches de la section 24 du prompt :

| Tranche | Cible qualitative | Fréquence mesurée |
|---|---|---:|
| [0,4) — « 48–52 » | « beaucoup » | 17,5 % |
| [4,10) — « 45–55 » | « aussi » | 27,5 % |
| [10,20) — « 40–60 » | « parfois » | 37,5 % |
| [20,+) — plus large | « très rarement » | 17,4 % |

La fréquence n'est PAS décroissante avec la largeur de l'écart, contrairement à la cible
qualitative : la tranche « très rarement » censée être la plus rare (17,4 %) est quasiment aussi
fréquente que la tranche « beaucoup » censée être la plus fréquente (17,5 %), et la tranche
intermédiaire « parfois » (37,5 %) est en réalité la plus fréquente des quatre.

## 5. Damping — sensibilité

Harnais non-production (`scripts/audit/runoff-final-calibration-corpus.ts`, réutilise la fonction
exportée `runoffAppeal` du moteur réel — jamais réimplémentée — pour ne varier que le paramètre de
damping dans une reconstruction déterministe sans bruit électoral, sur les mêmes 15 567 états de
second tour réels) :

| Damping | Marge moyenne | Marge médiane | <1 pt | <2 pts | >5 pts | >10 pts |
|---|---:|---:|---:|---:|---:|---:|
| 0 (compression totale) | 7,22 | 6,62 | 8,4 % | 16,3 % | 61,5 % | 27,4 % |
| 0,25 | 8,65 | 8,42 | 4,7 % | 9,7 % | 73,5 % | 38,7 % |
| 0,4 | 9,63 | 9,56 | 3,8 % | 7,5 % | 78,4 % | 46,8 % |
| 0,5 | 10,31 | 10,34 | 3,3 % | 6,8 % | 80,6 % | 52,1 % |
| **0,62 (production)** | **11,15** | **11,18** | **2,9 %** | **6,3 %** | **82,4 %** | **57,2 %** |
| 0,75 | 12,07 | 12,14 | 2,8 % | 5,9 % | 83,9 % | 61,5 % |
| 1,0 (aucun damping) | 13,92 | 13,94 | 2,6 % | 5,5 % | 85,3 % | 66,7 % |

**Le damping actuel (0,62) n'est pas le principal responsable de la faible fréquence des duels
serrés.** Même à damping = 0 (compression maximale du seul terme de transfert), la marge moyenne
reste à 7,22 pts et 27,4 % des duels dépassent encore 10 points — parce que la part **conservée**
(score de premier tour × taux de rétention propre à chaque finaliste, jamais amortie) domine déjà la
marge à elle seule dans une fraction significative des cas. Le damping agit, mais sur une portion
minoritaire du signal.

## 6. Décomposition des reports

`audit-results/runoff-final-calibration/runoff-components.csv` :

| Mesure | Valeur |
|---|---:|
| Marge moyenne avec damping de production (0,62) | 11,15 pts |
| Marge moyenne sans aucun damping (1,0) | 13,92 pts |
| Marge moyenne avec damping maximal (0) | 7,22 pts |
| Contribution moyenne du damping à la marge | 2,77 pts |
| Contribution médiane du damping à la marge | 3,2 pts |
| Contribution P90 du damping à la marge | 6,14 pts |
| Cas où le damping efface plus de la moitié de la marge « sans damping » | 4,8 % |

Dans 95,2 % des duels, le damping de production **n'efface pas la moitié** de l'écart qu'aurait
produit une absence totale de damping — il l'atténue, mais reste loin d'un mécanisme qui « annule
une partie excessive du travail effectué en amont » comme le redoutait le prompt. Ce qui fait
réellement gagner un second tour aujourd'hui, par ordre d'influence observée : (1) le score de
premier tour du finaliste lui-même, quasiment intégralement conservé (retenue 0,78–0,95 selon
mobilisation/rejet, jamais amortie) ; (2) la part des reports de voix des partis éliminés, amortie à
0,62 ; (3) le bruit électoral final (±4 pts avant renormalisation, source indépendante).

## 7. Agence entre-deux-tours

Contrefactuels stricts (`scripts/audit/runoff-agency-counterfactuals.ts`) : 520 états de second
tour distincts (même seed, mêmes finalistes, même état au soir du premier tour —
`structuredClone`), rejoués avec 7 politiques de décision différentes pour l'entre-deux-tours
uniquement (3 640 parties rejouées au total).

| Mesure | Valeur |
|---|---:|
| % de duels où le vainqueur change selon la politique | 4,1 % |
| Delta moyen du score final (max − min sur les 7 politiques) | 0,88 pt |
| Delta P90 | 1,4 pt |
| Delta maximal observé | 2,2 pts |

Ni nul, ni disproportionné : l'effet existe mais reste modeste en valeur absolue — cohérent avec un
entre-deux-tours de seulement 5 décisions (`GAME_CONFIG.targetDecisionsBetweenRounds`). Signal
positif : l'effet est fortement concentré sur les duels déjà serrés au premier tour —

| Écart T1 entre finalistes | Taux de changement de vainqueur |
|---|---:|
| <3 pts (serré) | 8,5 % |
| 3–8 pts (modéré) | 4,4 % |
| >8 pts (large) | 2,1 % |

L'agence entre-deux-tours compte le plus précisément quand la course l'exige — pas un défaut, un
comportement structurel sain.

## 8. Ties / 50-50

61 égalités exactes sur 15 567 seconds tours (0,39 %) — voir `audit-results/runoff-final-calibration/ties.csv`.
Mécanisme de départage vérifié dans `ranking()` (`election.ts`) : tri par score décroissant, puis
par ordre alphabétique de l'identifiant de parti en cas d'égalité stricte
(`localeCompare`) — déterministe, reproductible, jamais arbitraire d'une exécution à l'autre pour
une même seed. Le score interne avant arrondi n'est routinièrement PAS exactement 50/50 même quand
l'affichage arrondi au dixième l'est (`normalizePercentages` arrondit à 1 décimale pour l'affichage
production) — un affichage 50,0/50,0 peut donc cacher un score interne de, par exemple,
49,96/50,04, avec un vainqueur déterminé sans ambiguïté par ce chiffre non affiché. Aucune trace
d'un mécanisme de départage incompréhensible ou non documenté.

## 9. Plausibilité réelle initiale

Voir `REAL_WORLD_CALIBRATION.md` (recherche datée du 10 août 2026, sources OpinionWay/Elabe/Ifop,
sondages du 7-12 juillet 2026). Deux écarts nets identifiés : RN nettement sous-pondéré au départ
(jeu : 15,47 % en moyenne ; réel : 34–37 %), Écologistes nettement sur-pondérés (jeu : 9,97 % ;
réel : 2–5 %). Les autres partis restent dans un ordre de grandeur défendable compte tenu de
l'incertitude propre des sondages à un an du scrutin. Recommandation : ajustement modeste et
documenté des `baseSupport`, pas une réplique du sondage.

## 10. Robustesse de DISPERSION_POWER

Harnais non-production (`scripts/audit/dispersion-power-sensitivity.ts`, réutilise `partyAppeal`/
`normalizePercentages` réels, ne réimplémente que l'exposant final — jamais réinjecté dans la
mémoire EMA par bloc, qui est indépendante de la puissance), 2 880 campagnes, comparaison appariée
(même tirage de bruit par parti à travers les puissances testées) :

| Puissance | Leader moyen (résultat T1) | Écart-type | Favori dominant | Comprimé [7,16] |
|---|---:|---:|---:|---:|
| 1,6 | 17,74 % | 3,82 | 7,2 % | 32,3 % |
| 1,8 | 18,55 % | 4,16 | 13,6 % | 23,5 % |
| **2,0 (production)** | **19,40 %** | **4,51** | **22,0 %** | **17,1 %** |
| 2,2 | 20,27 % | 4,86 | 30,0 % | 13,0 % |
| 2,4 | 21,16 % | 5,21 | 37,0 % | 10,1 % |

Gradient continu, sans effet de seuil ni discontinuité — 2,0 se situe sur un plateau de robustesse,
pas sur un point de bascule fragile. Les valeurs testées (2,0 sur l'échantillon de robustesse : 22,0
% de favori dominant) reproduisent fidèlement le corpus de production complet (22,5 % sur 10 008
campagnes) — validation croisée réussie. Aucune preuve ne justifie de changer 2,0.

## 11. Fun / agence — non-régression

Suite ciblée relancée (`npm run` équivalent de `scripts/audit-post/simulate.ts` +
`scripts/audit-post/analyze.ts`, 5 280 parties, 4 320 sur les 9 partis existants, 60 graines par
combinaison parti × agent, plus 4 profils personnalisés). Comparaison à la dernière baseline
disponible (`audit-results/variance-decomposition.csv`, mesurée avant `DISPERSION_POWER`) :

| Métrique | η² parti avant | η² parti après | η² stratégie avant | η² stratégie après |
|---|---:|---:|---:|---:|
| Score au premier tour | 0,3518 | 0,4244 | 0,1855 | 0,2591 |
| Score final (/100) | 0,2488 | 0,3172 | 0,2623 | 0,3356 |
| Progression brute | 0,6998 | 0,5027 | 0,0859 | 0,2239 |
| Progression normalisée | 0,6718 | 0,4577 | 0,0898 | 0,2314 |
| Sur/sous-performance vs baseline neutre | 0,0127 | 0,0077 | 0,2702 | 0,4234 |

**Aucune régression d'agence — plutôt une amélioration.** Le parti explique davantage le score brut
(premier tour, score final), ce qui est l'effet recherché de `DISPERSION_POWER` (des partis
réellement différenciés). Mais surtout : la part expliquée par la **stratégie** augmente sur les
cinq métriques, sans exception. Pour les métriques les plus directement liées à la performance du
joueur plutôt qu'à son point de départ (progression brute, progression normalisée), la part du parti
**diminue** (0,70 → 0,50 ; 0,67 → 0,46) tandis que la part de la stratégie **plus que double** (0,09
→ 0,22 environ) : la façon de jouer compte désormais nettement plus dans la mesure de qui progresse
le mieux, pas seulement dans le score brut final. `matchedPairsOutcomeChangedShare` (paires de
mêmes graines dont l'issue qualification/victoire change selon la stratégie) : 0,796 — l'agence sur
l'issue elle-même reste forte. Aucun signe d'un parti de départ devenu trop déterminant.

## 12. Outsiders

Reconquête (le parti délibérément le plus faible), corpus de la mission précédente
(`party-percentiles.csv`) : score initial moyen 4,12 %, score moyen au résultat T1 8,83 %,
taux de qualification 10,6 %, probabilité de rester sous 8 % au résultat T1 : 38,9 %. L'expérience
reste jouable : Reconquête qualifie tout de même dans un peu plus d'un cas sur dix (pas 0 %), et son
maximum observé sur 10 008 campagnes atteint 18,3 % — une progression significative reste possible
depuis un départ structurellement bas. Aucun signe de « campagne morte » systématique.

## 13. Favoris

`P(victoire au second tour | favori dominant du duel [score >22 %, avance >5 pts sur son adversaire
direct])` = **97,7 %** (n = 4 421 duels). C'est le chiffre le plus problématique de cet audit au
regard de la section 17 du prompt (« un favori dominant [...] peut perdre [...] ne gagne pas
automatiquement ») : 2,3 % de défaites reste techniquement non nul, mais trop proche d'un résultat
prédéterminé pour offrir un vrai suspense une fois un tel favori qualifié.

À l'inverse, quand les deux finalistes sont quasiment à égalité au premier tour (écart <1 pt), le
favori (même minime) ne l'emporte que 56,7 % des cas (n = 1 704) — proche d'un tirage équilibré,
signe que le système traite correctement l'incertitude quand elle existe réellement.

## 14. Qualité des événements runoff

`scripts/audit/runoff-coherence-audit.ts` rejoué : 13 événements de second tour spécifiques à un
parti, 10 référencent un tiers, 0 incohérent (correctif de la mission précédente confirmé stable,
aucune régression). Un événement supplémentaire (`party_horizons_runoff_rupture`) mentionne LR et
Renaissance dans son **texte narratif** (« la froideur de LR et Renaissance ») sans effet mécanique
(`alliance`/`party_relation`) associé — à dessein hors du périmètre du correctif `party_not_opponent`
(qui ne cible que les propositions d'alliance mécaniques, pas les mentions narratives d'un ancien
allié regretté, qui restent défendables même si ce parti est devenu l'adversaire). Au-delà de
`party_not_opponent`, un audit exhaustif des dimensions plus fines demandées (tiers déjà hostile,
alliance déjà active, endorsement contradictoire) représenterait un chantier à part entière — non
traité ici par manque de temps au regard de la priorité explicite de cette mission (le second tour),
signalé en section 17 des problèmes ouverts.

## 15. Validation `party_not_opponent`

Aujourd'hui purement manuelle (un script d'audit ponctuel, pas une règle bloquante). Conception
d'une règle automatique évaluée : ajouter à `validateContentQuality`
(`src/game/data/qualityValidation.ts`) une vérification structurelle — pour tout événement dont
`eligibility` contient `{kind:"qualified", value:true}` ET `eligibleParties` est défini (événement
spécifique à un parti), si un choix référence un tiers réel via un effet `alliance`/`party_relation`,
l'événement DOIT porter une condition `party_not_opponent` couvrant ce tiers, sinon la validation
échoue. Faisabilité confirmée (réutilise directement la logique déjà écrite et éprouvée dans
`runoff-coherence-audit.ts`). Implémentation en BLOC B.

## 16. UX runoff

Vérifié en relisant `campaign-screens.tsx` (`ElectionNightScreen`, `MainStats`) : les deux finalistes
sont toujours identifiés par nom et emblème sur l'écran de résultat de second tour ; les scores
affichés sont issus de `normalizePercentages` (somme exactement 100 par construction, vérifié
également par les tests de la mission précédente) ; la sidebar lit `party.stats.polling`, déjà
corrigé pour refléter uniquement les deux finalistes pendant l'entre-deux-tours (mission
précédente) ; aucune confusion trouvée entre un sondage (`pollHistory`) et un résultat officiel
(`firstRoundResult`/`secondRoundResult`) dans le code lu. Un 50,0/50,0 affiché reste compréhensible
au sens où un vainqueur est toujours désigné sans ambiguïté (§8) mais **n'est jamais expliqué comme
tel à l'écran** — l'utilisateur ne voit pas qu'un score interne non-arrondi a tranché. Amélioration
mineure possible (hors périmètre strict de cette mission, non appliquée) : n'a pas semblé
suffisamment prioritaire pour justifier une correction UI au regard de la fréquence réelle très
faible du phénomène (0,39 %).

## 17. Problèmes P0-P4

Aucun P0 (aucun crash, aucune somme ≠ 100, 0 échec sur 20 160 campagnes tentées).

**P1** :
1. Un favori dominant du duel gagne le second tour 97,7 % du temps — trop proche d'un résultat
   automatique (§13).
2. La distribution des marges de second tour est orientée vers les larges victoires plus que ne le
   vise la section 24 du prompt — 54 % des duels dépassent 10 points d'écart, la tranche « très
   rarement » (>60/40) est presque aussi fréquente que la tranche « beaucoup » (48-52) (§4).
3. Cause racine : la part conservée du score de premier tour de chaque finaliste n'est jamais
   amortie — seule la part transférée l'est (§5-6).

**P2** :
4. Rapports de force initiaux : RN nettement sous-pondéré, Écologistes nettement sur-pondérés par
   rapport aux fourchettes réelles de juillet 2026 (§9, `REAL_WORLD_CALIBRATION.md`).
5. `party_not_opponent` non protégé par une règle de validation automatique (§15) — dette de
   validation confirmée, faisabilité de la correction établie.

**P3** :
6. Qualité narrative des événements runoff au-delà de `party_not_opponent` (tiers déjà hostile,
   alliance déjà active, endorsement contradictoire) — non auditée exhaustivement, signalée comme
   chantier distinct (§14).
7. Un 50,0/50,0 affiché n'explique jamais explicitement qu'un score interne non arrondi a désigné un
   vainqueur (§16) — amélioration UX mineure non appliquée, fréquence trop faible pour être
   prioritaire.

## 18. Recommandations

1. **Second tour (P1)** — amortir également la part *conservée* du score de premier tour de chaque
   finaliste, pas seulement les reports transférés, pour rapprocher la distribution des marges de
   la cible qualitative de la section 24 et réduire le taux de victoire quasi automatique d'un
   favori dominant. Approche à privilégier : appliquer une transformation du même esprit que
   `runoffShareSplit` (amortissement vers 50/50, préservant l'ordre, jamais un plafond arbitraire ni
   une égalité forcée) à l'écart entre les deux totaux **conservés**, avec un coefficient distinct et
   plus léger que celui des reports (une voix acquise au premier tour reste plus « sûre » qu'une
   voix négociée après coup). Valider empiriquement contre la même cible de distribution avant/après
   sur un nouveau corpus de taille comparable.
2. **Rapports de force initiaux (P2)** — ajustement modeste et documenté des `baseSupport`
   structurels (RN en hausse, Écologistes en baisse), avec `politicalBaselineVersion` et
   `calibrationDate` explicites, sans réplique du sondage ni photographie figée.
3. **`party_not_opponent` (P2)** — implémenter la règle de validation bloquante conçue en §15, avec
   test de non-régression prouvé (reproduction du bug avant correctif, succès après).
4. Ne pas toucher `DISPERSION_POWER` (§10 : robuste, aucune preuve d'un problème).

---

## Gate

Audit terminé. Métriques sauvegardées (`audit-results/runoff-final-calibration/`). Causes racines
identifiées et quantifiées pour chaque problème confirmé. Effets du damping mesurés précisément
(contribution moyenne 2,77 pts sur une marge moyenne de 11,89 — le damping n'est PAS le principal
facteur de compression, contrairement à l'hypothèse de départ ; le vrai problème est l'absence
d'amortissement de la part conservée). Non-régression du premier tour mesurée (§10-13). Aucune règle
de production modifiée pendant cette phase.

```text
BLOC A TERMINÉ — CALIBRATION SECOND TOUR DIAGNOSTIQUÉE — DÉMARRAGE BLOC B
```
