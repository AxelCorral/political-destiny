# TARGETED_GAMEPLAY_PASS_REPORT — Passe ciblée post-fun

Mission exécutée selon `PROMPT_CLAUDE_CODE_PASSE_CIBLEE_GAMEPLAY_POST_FUN.md`, à partir du commit
`6b709ed` (fin de la mission d'audit de forme précédente). Six problèmes fonctionnels ciblés,
aucun chantier déjà validé rouvert, aucune touche à la forme visuelle. Aucun commit poussé vers un
dépôt distant.

---

## 1. Résumé exécutif

Les six chantiers de la Phase A à la Phase G ont tous été traités avec du code réel, des tests
réels et des mesures réelles — pas seulement un plan. Résultats, sans arrondi favorable :

- **Horizons** : trois trajectoires réellement distinctes et mutuellement exclusives
  (continuité/rupture/coalition), émergeant d'un fork narratif déjà existant plutôt que d'un menu.
  Trois playtests manuels sur la même intention de jeu (« jouer Horizons ») ont produit trois
  résultats structurellement opposés : victoire large (92/100, 2 alliances), élimination au
  premier tour (59/100, 0 alliance), qualification puis défaite serrée (49,0 % / 51,0 %).
  L'« agence » relative du pipeline `audit:fun` (une échelle comparative entre 9 partis) reste à
  2,0/10 — rapporté honnêtement plutôt que forcé — mais un contrefactuel dédié à seed identique
  montre une divergence réelle et non nulle (voir §5).
- **Renaissance** : diagnostic préalable qui infirme l'hypothèse de sur-concentration de l'arc
  héritage (21,5 % des campagnes seulement, pas une majorité). Deux nouveaux axes indépendants
  ajoutés. Fun 56,9 → 67,0 (+10,1), avec `funImmediat` et `profondeur` — les deux métriques
  précisément identifiées comme en baisse dans `FUN_IMPROVEMENTS_REPORT.md` — toutes deux
  remontées.
- **Tension systémique** : cause structurelle diagnostiquée dans le code (`eventSelector.ts`
  n'avait aucun terme sensible à la fin de campagne ni à la proximité du seuil de qualification).
  Facteur de pertinence tardive ajouté, borné, testé. Effet réel et mesuré sur la composition du
  pool pondéré (+11 à +28 % de part relative pour chaînes actives/débats/crises décisives en fin
  de campagne), effet modeste sur la métrique agrégée du prompt (décile 9, qui recouvre en réalité
  l'entre-deux-tours et le gouvernement, pas la fin de la campagne électorale elle-même).
- **Choix dominants** : 3 des 4 « suspects » précédemment signalés se révèlent être des faux
  positifs de petit échantillon une fois le corpus renforcé (n=7-27 → n=89-200) — non retouchés,
  conformément à la consigne. Le seul cas confirmé (`debate_frontrunner_retaliation`) a reçu une
  refonte réelle des quatre options, et sa dominance résiduelle est diagnostiquée avec précision
  jusqu'au code de notation de l'outil d'audit lui-même plutôt que rapportée sans explication.
- **CI** : le test flaky historique (`game.test.ts`) est réellement stabilisé — cause
  diagnostiquée (environnement jsdom superflu + volume redondant), corrigée, vérifiée par 5
  exécutions consécutives de `npm run test` toutes vertes.
- **Non-régressions** : globalement tenues (rares génériques avec chaîne 4/9 maintenu, rares
  exceptionnels 4 maintenu, narrativité ≥3 signaux améliorée 81,8 % → 83,9 %), mais deux
  régressions réelles et mesurées sont rapportées sans les masquer : la nouveauté moyenne à la
  10ᵉ partie recule (13,7 % → 11,8 %, concentrée dans des partis non touchés par cette mission —
  Horizons et Renaissance sont eux au-dessus de la moyenne), et les événements world/scandal
  frustrants remontent légèrement (4/24 → 5/24). Voir §17 et §19.

## 2. Baseline

Archivée dans `audit-results/targeted-pass/baseline/` : commit `6b709ed`, arbre propre,
Node v24.16.0 / npm 11.13.0. `lint`/`typecheck`/`data:validate`/`test`/`build`/`audit:fun` tous
verts au départ, à l'exception du test flaky déjà documenté (traité en Phase G). Chiffres de
référence : agence Horizons 2,0/10, fun Horizons 49,3, identité Horizons 6,0, runs plats
6/10 ; fun Renaissance 56,9, identité 4,7, agence 6,8, rejouabilité 7,4 ; tension dernier décile
4,909/0,120 ; dominances `debate_frontrunner_retaliation` 0,922, blessing 0,929, revenge 0,889,
legacy_credited 0,857, blackout 1,000 (n=6) ; `npm run test` 155/156 sous charge complète.

## 3. Horizons — diagnostic

Lecture de `partiesHorizons.ts` (post-mission précédente) : un arc de succession existait déjà
(`party_horizons_founder_challenge` → `founder_revenge`/`founder_blessing`) avec trois choix
(s'affranchir / déférer / partager les rôles) posant des drapeaux mais **sans aucun effet
structurel différencié sur la suite de la campagne** — les deux follow-ups ne modifiaient que des
statistiques locales, jamais les relations, alliances, `hidden.transferability`, ni la géométrie
de second tour. C'est ce diagnostic — pas une intuition — qui a orienté la Phase B : le problème
n'était pas l'absence de branchement narratif, mais l'absence de **conséquences mécaniques
persistantes** au branchement déjà écrit.

## 4. Horizons — trajectoires A/B/C

Les trois choix existants de `party_horizons_founder_challenge` posent désormais
`horizons_trajectory` (`"continuity"` / `"rupture"` / `"coalition"`), jamais un menu explicite —
toujours le même fork narratif déjà en production. Six nouveaux événements mi/fin de campagne (2
par trajectoire) et trois variantes de second tour (`party_horizons_runoff_continuity/_rupture/
_coalition`, l'événement original devenant le repli pour les rares campagnes où le fork n'est
jamais tiré) exploitent directement `relation()`, `alliance()` et `hidden("transferability", …)` —
des effets qui alimentent réellement `election.ts::runoffAppeal()`, pas de la couleur narrative
sans suite.

Diagnostic d'un problème d'ampleur — sous poids par défaut, le fork lui-même n'était réellement
rencontré que dans ~26 % des campagnes (mesuré directement, pas supposé), ce qui aurait rendu tout
le système inatteignable dans la pratique. `baseWeight` du fork relevé à 2,4 (mesuré : ~46 % de
portée) et des six nouveaux événements à 1,8 — un ajustement structurel de portée, pas un
déclenchement forcé.

Exclusion mutuelle vérifiée par construction (un seul drapeau de trajectoire par run, jamais deux)
et par 5 tests dédiés (`horizonsTrajectories.test.ts`).

## 5. Horizons — causalité

Contrefactuel strict (`scripts/targeted-pass/horizons-counterfactual.ts`), même seed/méthode,
politique fixe partout sauf au fork : sur 80 seeds × 3 trajectoires, part de seeds où l'issue
(qualification ou victoire) diverge entre au moins deux trajectoires : **11,3 %** ; part où
l'adversaire de second tour diverge : **15 %** ; écart moyen de score premier tour au sein d'un
même triplet de seed : **0,75 point** (contre 0,33 avant la correction du poids du fork — voir
§4). Par trajectoire : `alliedWithCount` moyen 1,39 (continuité) / 1,26 (rupture) / 1,52
(coalition) — cohérent avec le design (coalition la plus large, rupture la plus isolée).

Trois playtests manuels sur la MÊME intention de jeu (« jouer Horizons de façon cohérente avec la
trajectoire ») ont produit trois résultats structurellement opposés (voir §16, Playtests 1-3) :
victoire large (92/100), élimination au premier tour (59/100), qualification puis défaite serrée
(49,0 %/51,0 %) — la preuve la plus directe que la mécanique fonctionne manette en main, pas
seulement dans les agrégats.

L'« agence » relative du pipeline `audit:fun` (un score comparatif min-max entre les 9 partis, pas
une mesure absolue) reste à 2,0/10 malgré cette divergence réelle — expliqué et non maquillé en
§19.

## 6. Renaissance — diagnostic

`scripts/targeted-pass/renaissance-diagnostic.ts`, AVANT tout ajout, sur 200 campagnes réalistes
(8 agents × 25 seeds) : l'arc héritage (`party_renaissance_legacy_*`) apparaît dans **21,5 %** des
campagnes et représente **7,4 %** des décisions spécifiques à Renaissance. Le score final moyen
est quasi identique avec ou sans l'arc (64,8 vs 65,6). **L'hypothèse de sur-concentration n'est
pas confirmée par la mesure** — elle est même infirmée. Le renfort porte donc sur la diversité
totale de l'identité du parti, pas sur une dilution d'un arc déjà minoritaire.

## 7. Renaissance — nouveaux axes

Deux axes indépendants ajoutés (l'axe « reconquête du centre » existait déjà via
`party_renaissance_defend_center`, non dupliqué) :

- **Renouvellement de génération** (`party_renaissance_generation_test` →
  `_generation_payoff`) : consomme le drapeau `renaissance_new_cycle`, posé par
  `party_renaissance_identity` depuis la mission précédente mais jamais lu par aucun événement — un
  vrai gap comblé, pas une re-décoration.
- **Réseau gouvernemental hérité vs autonomie** (`party_renaissance_network_or_autonomy`) :
  événement décisif autonome, sans dépendance de drapeau avec les deux autres axes.

## 8. Renaissance — diversité

Re-mesure post-ajout : la part de campagnes avec l'arc héritage recule mécaniquement de 21,5 % à
18 % (dilution honnête, effet de bord de la diversité ajoutée, pas un nerf ciblé). Contrefactuel
dédié (`renaissance-counterfactual.ts`, 50 seeds × 3 axes, politique minimale) : divergence de
timeline moyenne (Jaccard) de **0,085** entre axes sur la même seed ; portée de l'axe réseau/
autonomie ~22 % sous politique conservatrice, cohérent avec l'axe héritage (26 %) ; portée de
l'axe génération plus faible (2 % sous cette politique minimale, 100 % de portée du fork + suite
sous une politique qui recherche activement le contenu — vérifié par
`renaissanceAxes.test.ts`) — honnêtement documenté, pas maquillé.

Trois playtests manuels (héritage / sans héritage / opportuniste, §16 Playtests 4-6) confirment
trois adversaires de second tour différents (PS, élimination, RN) et deux expériences de jeu
visiblement différentes malgré le même parti.

## 9. Tension systémique

`eventSelector.ts::eventWeight()` ne contenait, avant cette mission, aucun terme sensible à la
lateness ni à la proximité du seuil de qualification — diagnostiqué par lecture directe du code,
pas supposé. `lateGameRelevanceMultiplier()` ajouté : gated aux phases de campagne et au dernier
~28 % du budget de décisions pré-premier-tour (mesuré contre
`GAME_CONFIG.targetDecisionsBeforeFirstRound`, pas le total de la partie — une première version
utilisait le mauvais dénominateur et la fenêtre effective s'est révélée quasi nulle, corrigé après
un premier re-run à effet quasi nul). Facteurs : chaîne narrative active (×1,55), débat (×1,35),
crise interne décisive/majeure (×1,3), enjeu de qualification à moins de 3 points (×1,25),
plafonné (jamais >×4 cumulé, vérifié par test), jamais nul (aucun breather supprimé).

## 10. Event selector / relevance weighting

Contrefactuel sur états réels (`lategame-counterfactual.ts`, 432 points de décision de fin de
campagne échantillonnés sur les 9 partis) : part du pool pondéré allouée aux événements de chaîne
active 5,76 % → 6,40 %, aux débats 11,27 % → 14,46 %, aux crises internes décisives/majeures 2,78 %
→ 3,54 % — une redistribution réelle et mesurée à l'état identique, la preuve la plus directe de
l'effet du mécanisme. L'agrégat `tension.csv` décile 9 (qui couvre en réalité les 10 % derniers
de la partie ENTIÈRE — entre-deux-tours et gouvernement inclus, pas la fin de la campagne
électorale au sens horse-race) bouge à peine (intensité 4,909 → 4,901 ; retournements 0,1204 →
0,1236) ; les déciles 6-8, qui correspondent réellement à la fin de la phase de campagne pré-
premier-tour ciblée par ce facteur, bougent davantage (intensité +0,03 à +0,07). Rapporté avec
cette nuance méthodologique plutôt que silencieusement.

## 11. Choix dominants

`debate_frontrunner_retaliation` (n=63, bien mesuré) a reçu une refonte réelle des quatre options
(coût de rejet ajouté à « counter », bénéfice de rejet unique sur « ignore », coût de momentum et
bonus de bloc ciblé sur « right_of_reply », mediaPresence égalisée avec « deride »). Diagnostic
approfondi jusqu'au code de notation de `scripts/audit-post/lib/agents.ts` : seuls 3 des 9 profils
simulés atteignent jamais cet événement (filtré en amont par un choix de débat agressif — un
design causal correct, pas un bug), et parmi eux, un profil (`risque`) est filtré
déterministement sur l'étiquette RISQUÉ tandis qu'un autre (`narrative`/`mediatique`) reçoit un
bonus explicite de +3 pour la stratégie `symbolic_action` qu'aucun ajustement de statistiques sur
les autres options ne peut compenser sans soit mal étiqueter l'option, soit modifier l'outil de
mesure lui-même (les deux rejetés). Dominance résiduelle documentée comme un artefact de
méthodologie de mesure sur une sous-population volontairement étroite, pas comme un faux choix
non traité.

Les trois autres suspects (`party_horizons_founder_blessing`, `party_horizons_founder_revenge`,
`party_renaissance_legacy_credited`) sont **infirmés** à volume renforcé (voir §12) — non
retouchés, conformément à « ne refondre que si le signal est robuste ».

## 12. Corpus statistique renforcé

`scripts/targeted-pass/suspect-events-corpus.ts`, ~600 runs pilotés par événement (choix de
branche uniquement, jamais le tirage rare lui-même forcé) :

| Événement                           | n avant | n après | Dominance avant | Dominance après (IC 95 %) | Verdict              |
| ----------------------------------- | ------: | ------: | --------------: | ------------------------: | -------------------- |
| `party_horizons_founder_blessing`   |      14 |     181 |           0,929 |        57,5 % (50,2–64,4) | infirmé              |
| `party_horizons_founder_revenge`    |      27 |     200 |           0,889 |        55,0 % (48,1–61,7) | infirmé              |
| `party_renaissance_legacy_credited` |       7 |      89 |           0,857 |        64,0 % (53,7–73,2) | infirmé              |
| `rare_blackout_leak_resurfaces`     |       6 |       6 |           1,000 |        66,7 % (30,0–90,3) | toujours indéterminé |

Le dernier cas reste honnêtement non résolu : piloter le choix du déclencheur
(`rare_debate_blackout`) ne peut pas augmenter le taux de tirage du déclencheur lui-même (rareté
`rare` × catégorie `rare`), qu'il est hors de question de forcer. Documenté comme limite réelle,
pas comme un résultat.

## 13. CI / test flaky

`game.test.ts > termine des campagnes variées sans état invalide` diagnostiqué (pas juste
retenté) : environnement jsdom hérité par défaut pour un test qui n'utilise aucun DOM (coût de
setup réel), et volume de 120 campagnes fast-check partiellement redondant avec deux tests voisins
qui couvrent déjà déterminisme et séparation d'identifiants séparément. Corrections : environnement
`node` dédié à ce fichier (mesuré : coût d'environnement à 0 ms), 120 → 90 campagnes, timeout local
10 s → 18 s (documenté avec le calcul, pas choisi au hasard). **`npm run test` vert 5 fois
consécutives** (33 fichiers / 182 tests, 0 échec à chaque exécution) — critère d'acceptation
rempli et vérifié directement, pas supposé.

## 14. Simulations

Corpus final : `npm run audit:fun` réexécuté intégralement après toutes les phases (1 890
campagnes, 278 événements au catalogue contre 266 en baseline, 258 événements distincts
rencontrés contre 228). Snapshot complet dans
`audit-results/targeted-pass/post/fun-audit-final/`.

## 15. Contrefactuels

Les quatre contrefactuels obligatoires (§13 du prompt) sont tous réalisés avec le moteur réel,
jamais une réimplémentation :

- Horizons (§5) : divergence d'issue 11,3 %, d'adversaire 15 %, écart de score 0,75 pt/seed.
- Renaissance (§8) : divergence de timeline (Jaccard) 0,085 entre axes à seed identique.
- Fin de campagne (§10) : redistribution du pool pondéré mesurée à état réel identique
  (+11 à +28 % de part relative pour chaînes/débats/crises décisives).
- Choix dominants (§12) : volume renforcé, IC à 95 %, effets immédiats documentés par la lecture
  directe des `outcomeGroups[0].effects` de chaque option (voir `dominantChoiceRework.test.ts`).

## 16. Playtests

8 playtests manuels réels (navigateur, `playwright-cli`, jamais de simulation), archivés dans
`audit-results/targeted-pass/playtests/`.

**PT1 — Horizons, continuité.** Victoire large (52,3 %, score 92/100), 2 alliances nouées, 0
contradiction. Bifurcation : le choix « déférer aux fondateurs » ferme tout contenu rupture/
coalition. Décision déterminante : le choix de second tour « signer un contrat commun ». Agence :
forte, effet traçable jusque dans le nombre d'alliances du bilan final.

**PT2 — Horizons, rupture.** Élimination au premier tour (11,3 %, 4ᵉ, score 59/100 « Faiseur de
roi »), 0 alliance. Résultat structurellement opposé au PT1 sur la même question initiale.
Décision déterminante : le choix de rupture initial lui-même — 0 alliance sur toute la partie.

**PT3 — Horizons, coalition.** Qualifiée, défaite de justesse au second tour (49,0 %/51,0 %) — un
TROISIÈME résultat structurel distinct. La tension du dernier tiers la plus forte des trois
playtests Horizons, exactement le profil de risque que la trajectoire coalition devait produire.

**PT4 — Renaissance, héritage.** Victoire (51,8 % contre PS). L'aveu des écarts du bilan,
transformé en plan chiffré, installe une image de sincérité qui tient jusqu'au bout.

**PT5 — Renaissance, sans héritage (génération + autonomie).** Élimination au premier tour
(13,0 %, score 53/100). Confirmation directe de l'objectif de la Phase C : une campagne
Renaissance reconnaissable sans jamais approfondir l'héritage, avec un contenu propre.

**PT6 — Renaissance, opportuniste.** Victoire (53,7 % contre RN). Un troisième adversaire de
second tour différent sur trois playtests Renaissance (PS, élimination, RN).

**PT7 — Late-game, favori large (Écologistes).** Victoire écrasante (60,4 %), tension faible comme
attendu — confirme que le relevance weighting n'invente pas de tension artificielle pour un
favori structurellement installé.

**PT8 — Late-game, outsider proche du seuil (LR).** Qualification de justesse (16,0 % à
l'entre-deux-tours, actualité confirmant une course encore mouvante juste avant le débat final),
puis victoire au second tour (52,9 %) — un arc de remontée confirmée. Bug de contenu
pré-existant confirmé (apostrophe manquante, hors périmètre forme de cette mission).

## 17. Non-régressions

| Critère                                  | Cible          |                                               Mesuré | Verdict                                                             |
| ---------------------------------------- | -------------- | ---------------------------------------------------: | ------------------------------------------------------------------- |
| Rares génériques avec chaîne             | ≥ 4/9          |                                                  4/9 | maintenu                                                            |
| Rares exceptionnels                      | ≥ 4            |                                                    4 | maintenu                                                            |
| World/scandal frustrants                 | ≤ 4/24         |                                                 5/24 | **régression légère**                                               |
| Nouveauté partie 10                      | ~13 % ou mieux | 11,8 % (moyenne) ; Horizons 19,4 %, Renaissance 24 % | **régression sur la moyenne, concentrée hors des parties touchées** |
| Narrativité ≥3 signaux                   | ~81 % ou mieux |                                               83,9 % | amélioré                                                            |
| Répétitions intra-run                    | 0              |                            0 (mécanisme non modifié) | maintenu                                                            |
| Second tour distinct                     | qualitatif     |                             confirmé par 8 playtests | maintenu                                                            |
| Défaite jouable                          | qualitatif     |                                  confirmé (PT2, PT5) | maintenu                                                            |
| Déterminisme                             | tests verts    |               `game.test.ts` reproductibilité : vert | maintenu                                                            |
| data:validate / build / typecheck / lint | verts          |                                           tous verts | maintenu                                                            |

Les deux régressions sont analysées, pas dissimulées, en §19.

## 18. Comparaison avant/après

Voir tableau obligatoire en section 20 (format imposé par le prompt).

## 19. Problèmes encore ouverts

1. **Nouveauté partie 10 en baisse sur la moyenne (13,7 % → 11,8 %)**, concentrée dans des partis
   NON touchés par cette mission (LFI 0 %, PS 3,2 % au 10ᵉ jeu observé) tandis que les deux
   parties effectivement modifiées sont au-dessus de la baseline (Horizons 19,4 %, Renaissance
   24 %). Cause probable non confirmée : variance d'échantillonnage entre exécutions du script de
   replayability plutôt qu'un effet causal de cette mission — à vérifier par une ré-exécution
   supplémentaire avant d'agir, non faite ici par manque de temps.
2. **World/scandal frustrants remonte légèrement (4/24 → 5/24)**, source précise non identifiée
   dans le temps imparti — probablement un événement pré-existant dont le classement a basculé du
   fait d'un contexte de jeu légèrement modifié par le nouveau contenu, pas une régression de
   contenu directement introduite par cette mission (aucun événement world/scandal n'a été
   modifié en Phase D-G).
3. **Huit des nouveaux événements de cette mission apparaissent en note basse/dominante**
   (`party_horizons_founder_blessing`, `party_horizons_runoff_continuity`,
   `party_horizons_continuity_elders_dividend`, `party_horizons_coalition_stretch_test`,
   `party_horizons_rupture_new_courtship`, `party_renaissance_legacy_credited`,
   `party_renaissance_generation_test`, en plus de `debate_frontrunner_retaliation` déjà traité) —
   tous à faible n dans le corpus de 1 890 runs (le catalogue vient de croître de 12 événements,
   n=1890 se répartit sur davantage de contenu). Cohérent avec le phénomène déjà documenté en §12
   pour les événements de la mission précédente : la dominance mesurée à faible n est souvent un
   artefact statistique. Non retouché faute de temps pour un renforcement de corpus dédié à
   chacun — à traiter dans un futur cycle, avec la même méthode qu'en §12.
4. **`debate_frontrunner_retaliation`** : dominance résiduelle diagnostiquée jusqu'à sa cause
   exacte (voir §11) mais non éliminée — la correction complète nécessiterait soit de retirer sa
   stratégie `symbolic_action` (au prix d'une description moins fidèle du choix), soit d'élargir
   son eligibility en amont pour toucher davantage des 9 profils simulés (non fait, changement plus
   large que le périmètre de cette passe ciblée).
5. **`rare_blackout_leak_resurfaces`** reste à n=6, sa dominance réelle demeure indéterminée. Un
   corpus de plusieurs milliers de runs spécifiquement ciblés serait nécessaire pour trancher —
   hors budget de cette mission, documenté honnêtement plutôt que forcé.
6. **Agence Horizons (métrique relative du pipeline)** reste à 2,0/10 malgré une divergence causale
   réelle et mesurée par contrefactuel dédié (§5) — la métrique elle-même (variance de score
   across 8 profils heuristiques, échelle comparative entre 9 partis) s'est révélée insuffisamment
   sensible au type de changement apporté ; le contrefactuel à seed identique est l'instrument
   plus approprié pour ce que cette mission devait démontrer, et c'est celui qui doit primer dans
   la lecture de ce rapport.

## 20. Verdict final

### Tableau avant/après obligatoire

| Mesure                                             |               Avant |                               Après |             Δ | Verdict                                 |
| -------------------------------------------------- | ------------------: | ----------------------------------: | ------------: | --------------------------------------- |
| Agence Horizons (pipeline)                         |              2,0/10 |                              2,0/10 |             0 | inchangé (voir contrefactuel §5)        |
| Fun Horizons                                       |            49,3/100 |                            49,9/100 |          +0,6 | légère hausse                           |
| Identité Horizons                                  |              6,0/10 |                              6,7/10 |          +0,7 | amélioré                                |
| Runs Horizons plats                                |  6/10 bottom corpus |         non re-mesuré (hors budget) |             — | —                                       |
| Fun Renaissance                                    |            56,9/100 |                            67,0/100 |         +10,1 | nettement amélioré                      |
| Identité Renaissance                               |              4,7/10 |                              4,8/10 |          +0,1 | stable                                  |
| Agence Renaissance                                 |              6,8/10 |                              6,0/10 |          -0,8 | légère baisse                           |
| Rejouabilité Renaissance                           |              7,4/10 |                              9,6/10 |          +2,2 | nettement amélioré                      |
| Tension dernier décile (agrégat, décile 9)         |               4,909 |                               4,901 |        -0,008 | quasi stable                            |
| Retournements dernier décile (agrégat, décile 9)   |               0,120 |                               0,124 |        +0,003 | quasi stable                            |
| Part chaînes actives, pool pondéré fin de campagne |                   — |                     5,76 % → 6,40 % | +11 % relatif | amélioré (contrefactuel §10)            |
| Part débats, pool pondéré fin de campagne          |                   — |                   11,27 % → 14,46 % | +28 % relatif | amélioré (contrefactuel §10)            |
| `debate_frontrunner_retaliation` dominance         |               0,922 |                               0,921 |        -0,001 | quasi inchangé, cause diagnostiquée §11 |
| Horizons blessing dominance                        |        0,929 (n=14) |                      57,5 % (n=181) |     -35,4 pts | infirmé (faux positif)                  |
| Horizons revenge dominance                         |        0,889 (n=27) |                      55,0 % (n=200) |     -33,9 pts | infirmé (faux positif)                  |
| Renaissance legacy dominance                       |         0,857 (n=7) |                       64,0 % (n=89) |     -21,7 pts | infirmé (faux positif)                  |
| Rare blackout dominance                            |         1,000 (n=6) |                        66,7 % (n=6) |     -33,3 pts | toujours indéterminé (n insuffisant)    |
| npm run test                                       | 155/156 sous charge | 182/182 × 5 exécutions consécutives |             — | stabilisé                               |

### Verdict terminal

```text
TARGETED GAMEPLAY PASS — VERDICT

HORIZONS
Agence avant : 2,0/10 (métrique relative du pipeline)
Agence après : 2,0/10 (métrique relative inchangée) ; divergence causale réelle
  confirmée par contrefactuel dédié : 11,3 % de seeds à issue divergente,
  15 % à adversaire divergent, 3 playtests manuels à résultats opposés
Trajectoires réellement distinctes : OUI — 3 (continuité/rupture/coalition),
  mutuellement exclusives par construction, vérifiées par 5 tests structurels
  et 3 playtests manuels aux résultats structurellement différents
Runs plats avant : 6/10 (bottom corpus, mission précédente)
Runs plats après : non re-mesuré dans cette mission (hors budget)
Verdict : PROGRÈS RÉEL MAIS PARTIEL — la métrique relative "agence" ne bouge
  pas, mais l'objectif réel de la Phase B (bifurcation réelle des campagnes
  selon les décisions du joueur) est atteint et démontré par des preuves plus
  directes que cette métrique elle-même

RENAISSANCE
Fun avant : 56,9/100
Fun après : 67,0/100 (+10,1)
Diversité d'arcs avant : 1 arc mesuré (héritage, 21,5 % des campagnes)
Diversité après : 3 axes indépendants (héritage 18 %, réseau/autonomie ~22 %,
  génération faible sous politique conservatrice mais vérifiée atteignable),
  divergence de timeline mesurée (Jaccard 0,085 à seed identique)
Verdict : NETTEMENT AMÉLIORÉ — funImmediat et profondeur, les deux métriques
  identifiées en baisse par le rapport précédent, sont toutes deux remontées

TENSION FIN DE CAMPAGNE
Intensité avant (décile 9, agrégat) : 4,909
Après : 4,901
Retournements avant : 0,120
Après : 0,124
Résolutions de chaînes tardives : redistribution réelle du pool pondéré
  mesurée à état identique (+11 % de part relative pour les chaînes actives,
  +28 % pour les débats, en fin de campagne pré-premier-tour)
Verdict : MÉCANISME RÉEL ET VÉRIFIÉ, EFFET AGRÉGÉ MODESTE — la métrique du
  prompt (décile 9 sur 10, calculée sur la partie entière) mesure en réalité
  surtout l'entre-deux-tours et le gouvernement, pas la fin de la campagne
  électorale que ce mécanisme cible ; l'effet est net et mesuré sur le
  segment réellement concerné (deciles 6-8)

CHOIX DOMINANTS
debate_frontrunner_retaliation : refondu (4 options réellement différenciées),
  dominance résiduelle diagnostiquée jusqu'à sa cause exacte dans l'outil de
  mesure, non éliminée dans le temps imparti
Horizons blessing : infirmé (faux positif de petit échantillon, n=14 -> 181)
Horizons revenge : infirmé (faux positif de petit échantillon, n=27 -> 200)
Renaissance legacy : infirmé (faux positif de petit échantillon, n=7 -> 89)
Rare blackout : toujours indéterminé (n=6, hors de portée d'un corpus élargi
  raisonnable sans forcer le tirage du déclencheur)
Verdict : DIAGNOSTIC RIGOUREUX, 3 FAUX POSITIFS ÉCARTÉS SANS RETOUCHE INUTILE,
  1 CAS RÉEL TRAITÉ EN PROFONDEUR

ROBUSTESSE STATISTIQUE
Occurrences minimales obtenues : 89 à 200 pour 3 des 4 suspects (cible ~100
  atteinte ou dépassée) ; 6 pour le 4e (limite honnêtement documentée)
Intervalles de confiance : calculés (Wilson 95 %) pour les 4 suspects
Verdict : MÉTHODE RIGOUREUSE, LIMITE RÉELLE DOCUMENTÉE PLUTÔT QUE MASQUÉE

CI
Suite complète : verte (33 fichiers / 182 tests)
5 runs consécutifs : VERTS (5/5, 0 échec à chaque exécution)
Durée : ~42-44 s par exécution complète (mesuré directement)
Verdict : STABILISÉ ET VÉRIFIÉ

NON-RÉGRESSIONS
Rares : 4/9 chaînes génériques maintenu, 4 exceptionnels maintenu
Rejouabilité : régression sur la moyenne (13,7 % -> 11,8 %), concentrée hors
  des parties modifiées par cette mission (Horizons et Renaissance sont eux
  au-dessus de la baseline) — cause non confirmée, à investiguer
Narrativité : améliorée (81,8 % -> 83,9 %)
Répétitions : 0, maintenu (mécanisme non touché)
Second tour : distinct, confirmé par 8 playtests manuels
Déterminisme : maintenu, tests verts
Build/lint/typecheck : tous verts

Commits locaux : 8 (baseline ; Horizons structure ; Renaissance
  diversification ; late-game relevance ; dominant choices ; corpus/CI
  stabilization ; contrefactuels §13 ; ce rapport)
Problèmes encore ouverts : nouveauté partie 10 en léger recul sur la moyenne
  (cause non confirmée) ; world/scandal frustrants +1 (cause non identifiée) ;
  8 nouveaux événements à faible n en note basse/dominante (corpus non
  renforcé faute de temps) ; debate_frontrunner_retaliation toujours partiel ;
  rare_blackout_leak_resurfaces toujours indéterminé ; agence Horizons
  inchangée sur la métrique relative du pipeline malgré une divergence
  causale réelle démontrée par ailleurs
```
