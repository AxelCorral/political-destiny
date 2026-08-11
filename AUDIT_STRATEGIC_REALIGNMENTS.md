# AUDIT_STRATEGIC_REALIGNMENTS.md — BLOC A

## Mission : recompositions stratégiques, chocs électoraux, soutiens nationaux

Audit ciblé, lecture seule sur le moteur de production (aucune ligne de `src/game/engine` ou
`src/game/data` modifiée pour produire ce rapport). Corpus : **10 800 campagnes** simulées
(`scripts/audit/strategic-realignments-blocA.ts`, 9 partis × 8 agents × 150 graines), plus 96
scénarios contrôlés de conservation de masse et 8 traces de choc entièrement décomposées.
Données brutes : `audit-results/strategic-realignments/`.

> **Addendum post-Bloc B** (voir `STRATEGIC_REALIGNMENTS_REPORT.md` §10) : un bug de troncature
> (`opponentActions.slice(-80)` en production, diffé par longueur dans ce script d'audit) a été
> découvert et corrigé pendant le Bloc B — il sous-comptait les retraits/négociations survenant
> après l'accumulation de 80 actions dans une campagne. Corrigé dans ce script (filtrage sur
> `decisionIndex`). Impact sur les conclusions de ce rapport : **aucun** sur le diagnostic causal du
> §7 (bascule premier tour, basé sur les retraits effectivement détectés, dont les propriétés
> individuelles restent correctes) ni sur la conservation de masse (§10, scénarios contrôlés
> indépendants du comptage d'actions) ; **possible sous-comptage** des fréquences absolues de retrait
> tardif rapportées en §1-6 et §16 — à lire comme des planchers, pas des mesures exactes.

---

## 1. Retrait par effondrement vs désistement stratégique

**Verdict : aucune distinction n'existe dans le moteur actuel — confirmé, pas seulement supposé.**

Le seul chemin de retrait « naturel » est `maybeWithdrawAndRally`
(`src/game/engine/opponentSimulation.ts:170-236`) :

```ts
if (
  state.decisionIndex < 14 ||
  !["campaign", "official_campaign"].includes(state.phase) ||
  (party.stats.polling >= 6 && actor.legitimacy >= 45)
) return false;
```

C'est un **OU** entre deux seuils bruts (`polling < 6`, `legitimacy < 45`), sans aucune lecture de
la position dans le classement, de l'écart au top 2, du potentiel du bloc, des relations ou des
alliances. Sur les 2 439 retraits observés dans le corpus :

| Déclencheur au moment du retrait | Occurrences | % |
|---|---:|---:|
| `polling < 6` seul | 2 267 | 92,95 % |
| `legitimacy < 45` seul | 117 | 4,80 % |
| les deux | 54 | 2,21 % |
| **ni l'un ni l'autre** | **1** | **0,04 %** |

Le seul cas « ni l'un ni l'autre » (`rn_dissidence_14`, décision 17, 10,18 % de sondage, 56 de
légitimité) passe par le **second** chemin de retrait existant, `replaceCandidate` — un parti
scindé (`applyPartySplit`) qui n'a plus de figure de remplacement disponible est retiré
inconditionnellement, indépendamment du sondage. C'est donc un deuxième mécanisme, mais lui aussi
strictement « effondrement » (aucun acteur disponible), jamais « stratégique ».

**Conclusion chiffrée : 99,96 % des retraits actuels sont un pur effondrement mesurable par un
seuil ; aucun retrait stratégique (parti encore viable qui négocie puis se retire par calcul) n'est
possible aujourd'hui, quelles que soient la relation, l'idéologie, la fragmentation de bloc ou les
alliances déjà nouées.** C'est exactement le problème 1 de la mission — confirmé, pas supposé.

---

## 2. Modèle de viabilité électorale (prototype d'audit)

`computeViabilityDiagnostic` (dans le script d'audit, jamais exécuté en production) calcule une
viabilité composite à partir du score, du rang, de l'écart au top 2, du momentum, de la
crédibilité, du rejet, de la présence d'une alliance déjà nouée et du meilleur allié naturel
(`campaignProfile.naturalAllies`) mieux placé. Il s'agit d'un **prototype illustratif** — la
formule elle-même n'est pas calibrée (voir `bloc-fragmentation.csv` : elle reste positive dans la
quasi-totalité des cas testés, y compris pour des partis en fin de course, donc ne doit pas être
reprise telle quelle en Bloc B) — mais l'exercice confirme que les données nécessaires existent déjà
dans `PartyState`/`PartyDefinition` pour construire une vraie fonction `electoralViability` :
`stats.polling`, rang dérivé de `nationalLatentSupport`, `stats.momentum`, `stats.credibility`,
`stats.rejection`, `alliedWith`, et `campaignProfile.naturalAllies`.

Exemple réel extrait du corpus (état initial, Écologistes) :
`score 9,22 % · rang 8 · écart au top 2 −5,46 · meilleur allié naturel PS à 12,51 % · pression de
spoiler 1,64 · « combiné avec le meilleur concurrent direct atteindrait le top 2 » = vrai`. C'est
précisément le scénario que le prompt de mission décrit en exemple (§5) : une candidature pas
morte, mais une voie étroite vers le second tour.

---

## 3. Pression de fragmentation de bloc

`computeFragmentationDiagnostic` réutilise `campaignProfile.directCompetitors` (déjà présent dans
`src/game/data/parties.ts`, jamais lu par le moteur électoral aujourd'hui — confirmé par grep) pour
mesurer : le nombre de concurrents directs encore en course, la proximité de score avec eux
(`spoilerPressure`), et si la candidature combinée avec son meilleur concurrent direct franchirait
le seuil de qualification alors qu'aucune des deux isolément n'y arrive.

Point clé pour le Bloc B : **`naturalAllies`/`directCompetitors` correspondent déjà, tels quels,
aux recompositions attendues par la mission** (`src/game/data/parties.ts`) :

| Parti | `naturalAllies` | `directCompetitors` |
|---|---|---|
| Écologistes | ps, lfi | ps, renaissance |
| LR | horizons, renaissance, nouvelle_energie | rn, horizons, renaissance |
| Renaissance | horizons, lr | horizons, ps, lr |
| Reconquête | rn | rn, lr |

Ces listes couvrent exactement les scénarios exigés en §9-10 (Écologistes → PS/LFI, LR →
Horizons/NÉ, Renaissance → Horizons, Reconquête → RN) **sans qu'aucun script par parti ne soit
nécessaire** : brancher la négociation stratégique sur ces champs suffit à faire émerger ces cas
sans exception codée en dur.

---

## 4. Fréquence des désistements stratégiques

**0 aujourd'hui, par construction** — il n'existe aucun code chemin pour qu'un désistement
« stratégique » (parti encore viable, négociation, accord) se produise. La colonne
`strategic-withdrawals.csv` est une approximation a posteriori (retraits dont la viabilité
illustrative était positive au moment du retrait) — elle contient 2 424 des 2 439 lignes, ce qui
confirme surtout que la formule prototype n'est pas discriminante, pas qu'il existe déjà des
désistements stratégiques. **Aucun chiffre cible n'est fixé ici** (§11 : la fréquence doit émerger,
pas être imposée) ; le Bloc B mesurera la fréquence réellement produite par le nouveau mécanisme.

---

## 5. Cas Écologistes

**Sur 10 800 campagnes, 5 retraits « naturels » d'Écologistes (0,046 %)** — plus que les
« 0 sur 3 000×3 » du rapport précédent (échantillon 3,6× plus grand, la queue de distribution finit
par apparaître), mais toujours structurellement rarissime : les Écologistes perdent presque
toujours la « compétition probabiliste du retrait » face à Reconquête, dont le socle est
délibérément plus faible (voir §7).

Les 5 cas observés sont tous des retraits par effondrement (légitimité ou sondage bas), **mais ils
confirment déjà la structure attendue par la mission** :

- Les 5 cas montrent `bestNaturalAllyId = "ps"` et `hasNaturalAllyBetterPlaced = true` : quand les
  Écologistes meurent, le PS est systématiquement le mieux placé de leurs deux alliés naturels dans
  cet échantillon (LFI n'apparaît dans aucun des 5 cas comme meilleur allié — pas une exclusion du
  moteur, un effet d'échantillonnage : les scénarios où LFI dépasse le PS existent mais sont plus
  rares dans ce corpus).
- Choc nommé associé : 5,98 à 7,55 points (dans l'un des 5 cas, la mesure brute atteint 36,64 —
  c'est l'artefact de bascule premier-tour documenté en §7, pas un choc réel ; voir la colonne
  `decisionIndex` = 23 sur cette ligne précise).

**Conclusion : le modèle de données (`naturalAllies`) pointe déjà correctement vers PS/LFI selon le
contexte ; il ne manque que le déclencheur stratégique pour que ce signal soit utilisé avant
l'effondrement plutôt qu'au moment de l'effondrement.**

---

## 6. Cas LR / NÉ / Horizons / Renaissance / Reconquête

Non observables aujourd'hui en tant que *désistements stratégiques* (le mécanisme n'existe pas),
mais observables en tant que retraits par effondrement pour calibrer le terrain : LR 24 retraits,
Renaissance 14, Horizons 4, RN 21 (+ 1 dissidence), Reconquête 2 306 (+ 15 dissidences),
Nouvelle Énergie 6. La disproportion extrême en faveur de Reconquête (94,5 % de tous les retraits)
confirme que le tirage actuel favorise presque exclusivement le parti au socle le plus faible du
jeu (`PARTY_GAMEPLAY_IDENTITIES.md` : Reconquête est délibérément le potentiel électoral le plus
bas) — cohérent avec le seuil `polling < 6`, mais cela signifie aussi qu'**à mécanique inchangée,
les scénarios demandés en §10 (LR faible → Horizons/NÉ, Renaissance faible → Horizons) ne peuvent
statistiquement quasiment jamais apparaître**, faute de déclencheur qui ne dépende pas uniquement
du socle le plus bas.

---

## 7. Choc de retrait maximal — 45,79 (historique) / 48,67 (reproduit) : cause identifiée

**C'est la découverte centrale de cet audit.** Les 236 retraits du corpus dont le choc national
mesuré dépasse 30 points partagent une propriété à 100 % : **ils se produisent tous exactement à
`decisionIndex = 23`**, c'est-à-dire la décision qui précède immédiatement le franchissement de
`GAME_CONFIG.targetDecisionsBeforeFirstRound = 24`, où `advanceElectionFlow` déclenche
`simulateFirstRound` dans la même résolution de décision.

Exemple entièrement tracé (`lfi:risque:94`, Reconquête se retire à la décision 23) :

```
Avant (9 candidats actifs)         Après (2 finalistes seuls)
lfi   18,004                        lfi          66,674   (+48,670)
ps    11,338                        ps            0        (-11,338)
horizons 14,104                     horizons      0        (-14,104)
...                                 renaissance  33,326   (+23,893)
reconquete 2,719 (se retire)        reconquete    0
```

Le retrait de Reconquête lui-même, isolé (`redistributeElectorate` appelé seul, sans avancer la
décision), ne déplace que **0,77 point maximum** entre partis — parfaitement cohérent avec les
chocs « propres » mesurés ailleurs (§ suivant). Le saut de 48,67 points vient entièrement d'une
comparaison entre deux univers électoraux différents : neuf candidats actifs *avant* la décision,
puis seulement les deux finalistes qualifiés *après* — `isElectorallyActive` filtre correctement
les sept partis non qualifiés, `nationalLatentSupport` renormalise sur 100 parmi les deux restants,
ce qui produit mécaniquement des écarts énormes qui n'ont **rien à voir avec le retrait** survenu
au même pas.

Ceci confirme et rend enfin explicite l'hypothèse déjà notée avec prudence dans
`REALITY_GROUNDED_CAMPAIGN_REPORT.md` §21 (« probablement l'effet combiné de `DISPERSION_POWER` avec
un changement de classement simultané non lié au retrait lui-même ») : la « bascule de classement »
suspectée était en réalité la bascule premier-tour → second-tour, présente dans le même pas de
décision qu'un retrait par pure coïncidence de calendrier (le retrait par effondrement ne peut se
déclencher qu'en toute fin de campagne, `decisionIndex >= 14`, ce qui le rend statistiquement
probable juste avant la coupure du premier tour).

**Aucun bug de redistribution, de conservation de masse ou de `DISPERSION_POWER` n'est en cause.**
Le bug est méthodologique : `scripts/audit/reality-grounded-causality.ts` (et toute mesure « avant
sondage / après sondage » naïve autour d'un retrait) compare des états dont l'ensemble de partis
actifs peut différer sans le détecter. **Recommandation P0 (méthodologie d'audit, pas de code de
jeu) : exclure du calcul de choc toute paire avant/après dont l'ensemble des partis
électoralement actifs (`isElectorallyActive`) diffère, ou comparer séparément.**

---

## 8. Delta national agrégé anormal +37,1 : même cause

Non reproduit à l'identique (graine différente), mais le mécanisme retrouvé au §7 explique
intégralement le phénomène décrit dans le rapport précédent : un delta agrégé à deux chiffres sur
un seul pas de décision, en fin de campagne, est la signature de la bascule premier-tour, pas d'une
redistribution anormale. Le corpus ne contient **aucun** choc « propre » (même ensemble de partis
actifs avant/après) au-dessus de 20 points sur 2 203 retraits hors bascule.

---

## 9. Choc de retrait « propre » (hors artefact de bascule)

En excluant les 236 lignes à `decisionIndex = 23` (2 203 retraits restants) :

| Mesure | Valeur |
|---|---:|
| Choc moyen | **3,778** (baseline historique : 3,77 — quasi identique) |
| Choc maximal | **14,08** |
| Chocs > 20 pts | **0** |
| Chocs 10-20 pts | 64 (2,9 %) |
| Chocs 5-10 pts | 43 (2,0 %) |
| Chocs < 5 pts | 2 096 (95,1 %) |

Les chocs « propres » les plus élevés (10-14 pts) partagent un profil net : un parti classé **2e à
4e** (pas le plus faible) se retire avec ~12-14 % de sondage, et la quasi-totalité de sa part
libérée part vers **un seul destinataire** (le choc mesuré est alors presque exactement égal au
score du parti qui se retire). C'est la signature du problème identifié en §14 ci-dessous : les
multiplicateurs de poids de `redistributeElectorate` (`ideologicalFit × relationBoost(≤1,6) ×
alreadyAllied(1,35) × explicitEndorsement(1,6) × rejectionPenalty`) se combinent sans plafond
relatif aux autres destinataires, et peuvent concentrer la quasi-totalité d'une part libérée sur un
seul parti quand plusieurs bonus s'additionnent (alliance déjà nouée + endorsement explicite +
relation forte).

---

## 10. Conservation de masse

**Exacte, à l'épsilon près, sur les 96 scénarios contrôlés testés** (8 configurations de
relation/alliance/endorsement × 12 blocs électoraux, retrait des Écologistes et, séparément, de deux
gros partis) :

- `undecidedDelta` (variation réelle de `undecidedByBloc`) correspond **exactement** (écart maximal
  mesuré : 0,000000) à `releasedShare × abstentionProbability` prédit par la formule de
  `redistribution.ts`.
- Aucun `undecidedClampHit` (le clamp `[2,60]` n'a jamais été atteint dans ces scénarios).
- Aucune part négative, aucun NaN.
- `sumLatentSupportAfter` = 100 exactement sur les 96 scénarios (`normalizePercentages` garantit
  cette propriété par construction).

**Nuance de modélisation à documenter (pas un bug) :** `latentSupport` par bloc est toujours
renormalisé à 100 parmi *tous* les partis, y compris ceux qui n'ont reçu aucun transfert — la
fraction « perdue vers l'abstention » n'abaisse donc directement la part de **personne** au niveau
du bloc (elle est absorbée par la renormalisation) ; son seul effet mesurable est d'augmenter
`undecidedByBloc`, qui réduit ensuite le poids du bloc dans l'agrégation nationale
(`expressedWeight = bloc.weight × turnout × (1 − undecided/100)`). La conservation de masse est donc
correcte, mais répartie sur deux variables d'état distinctes plutôt que sur une seule — à garder en
tête si le Bloc B ajoute une décomposition captif/transférable (§16 du prompt).

---

## 11. Interaction avec `DISPERSION_POWER`

Harnais d'audit (`nationalLatentSupportAtPower`, réplique exacte de `nationalLatentSupport` mais
avec une puissance paramétrable — jamais appliqué en production) testé sur 8 retraits réels aux
puissances 1,6 / 1,8 / 2,0 / 2,2 :

- Sur ces 8 cas, le choc **diminue** quand la puissance augmente (ex. 3,65 → 2,34 pts entre 1,6 et
  2,2 pour un cas ; 4,86 → 3,49 pour un autre) — **pas d'amplification monotone naïve**. Explication :
  ces retraits concentrent leur transfert vers un parti déjà en tête ou proche de la tête ; à
  puissance plus élevée, le dénominateur (somme des carrés) est déjà dominé par ce leader, donc un
  gain marginal supplémentaire pèse relativement moins.
- Dans 2 des 8 cas, la puissance change effectivement **la paire qualifiée pour le second tour**
  (`horizons+ps` → `horizons+rn` entre 1,6 et 2,2) — une conséquence réelle et mesurable, pas un
  artefact, qui mérite d'être documentée mais qui n'est pas un défaut : `DISPERSION_POWER` a été
  calibré pour produire des favoris nets (`ELECTORAL_COHERENCE_FIXES_REPORT.md`), et une
  qualification disputée sensible à un retrait tardif est un comportement plausible d'un système
  électoral réel.
- **Aucune preuve dans ce corpus que `DISPERSION_POWER = 2` amplifie excessivement les grands
  transferts** ; le vrai facteur de concentration excessive est en amont, dans la pondération de
  `redistributeElectorate` (§9, §14), pas dans l'agrégation nationale. Recommandation : **ne pas
  modifier `DISPERSION_POWER`** (conforme à §15 du prompt de mission).

---

## 12. Absence de soutiens nationaux — confirmée

`majorEndorsements.ts` : 4 entrées, **100 % `figureKind: "world_figure"`, 0 `domestic_entity`, 0
`fictional_prestige_figure`**. Le système de types (`MajorEndorsementDefinition.figureKind`) et le
registre `WorldFigureProfile` anticipent déjà une contrepartie domestique — seule la donnée et les
événements manquent. `docs/FICTIONAL_POLITICAL_ARCHETYPES.md` documente déjà le patron éditorial
exact à reproduire (profil, `affinityTags`/`hostilityTags`, interdictions de contenu sensible) pour
un futur `nationalFigures.ts`.

---

## 13. UX baseline — date de référence

Non implémentée, confirmé par lecture de `RaceBulletinScreen`
(`src/features/campaign/campaign-screens.tsx:400-534`) : le bandeau affiche
`Bulletin de campagne · {date}` avec la date courante de la partie, jamais de mention explicite du
18 avril 2026 comme photographie de départ. Fait utile pour le Bloc B :
`GAME_CONFIG.electionDate = "2027-04-18"` et `currentDate: dateAtDaysBefore(electionDate, 365)`
donnent exactement **`"2026-04-18"`** comme première date de partie — le premier `PollSnapshot`
(`poll.date`, `poll.decisionIndex === 0`) porte donc déjà la bonne date ; il ne manque qu'un texte
explicite conditionné sur ce premier bulletin.

---

## 14. Sidebar / RaceBulletin — retest explicite

**`RaceBulletinScreen`** : gating pre/post premier tour toujours correct
(`raceBulletinAfterFirstRound.test.ts`, re-exécuté, vert). Le déclenchement (`gameStore.ts`,
`chooseEventOption`) reste conditionné à `isBeforeFirstRound`, donc l'écran multi-candidats reste
impossible après le premier tour, y compris avec les mécaniques de retrait/redistribution
actuelles.

**Sidebar (`MainStats`, `party.stats.polling`)** : nouveau test dédié
(`sidebarSecondRoundSync.test.ts`, 2 cas, verts) qui rejoue une campagne complète du premier tour au
gouvernement en vérifiant à chaque décision d'entre-deux-tours/gouvernement que (a) seuls les deux
finalistes ont une part non nulle dans `nationalLatentSupport`, (b) la somme des deux finalistes vaut
100 dans la vérité électorale, (c) aucun candidat éliminé n'est jamais recrédité.

**Découverte non-bug au passage** : `party.stats.polling` n'est **pas** directement comparable entre
partis — `generatePoll` (`polls.ts:58`) écrase cette valeur par une estimation **bruitée**
uniquement pour le parti du joueur (`playerParty.stats.polling = currentPlayerScore`, mélange 72 %
vérité / 28 % délai + bruit ±3,8), alors que la valeur de chaque adversaire reste la vérité exacte
posée par `recalculateElectorate`. Un premier jet de test comparait la somme brute
`stats.polling` du joueur + adversaire à 100 et échouait à ±1,1 point — pas un bug, un artefact de
test qui ignorait l'asymétrie bruit/vérité déjà voulue par la conception (« un instantané bruité,
jamais une vérité électorale »). Documenté ici pour qu'un futur audit ne reparte pas du même faux
positif.

---

## 15. Recommandations et priorités (P0-P3)

- **P0 — Méthodologie d'audit.** Toute future mesure de « choc » doit exclure les paires
  avant/après dont l'ensemble de partis `isElectorallyActive` diffère (bascule de phase). C'est la
  cause unique des chocs > 20 points observés dans ce corpus.
- **P0 — Distinguer retrait par effondrement et désistement stratégique.** Créer un second chemin
  de retrait, piloté par viabilité + pression de fragmentation + négociation (§30-33 du prompt),
  sans toucher `maybeWithdrawAndRally` (qui reste le chemin « effondrement », légitime et déjà
  calibré).
- **P1 — Plafonner la concentration de `redistributeElectorate`.** La multiplication sans borne de
  `relationBoost × alreadyAllied × explicitEndorsement` (jusqu'à ×3,46 par rapport à un ajustement
  de base) explique les chocs propres de 10-14 points où un parti moyen transfère la quasi-totalité
  de son socle à un seul destinataire. Remplacer l'empilement multiplicatif par des paliers de
  consigne mutuellement exclusifs (§17 : accord fort > soutien explicite > retrait neutre), sans cap
  arbitraire de type `if delta > X`.
- **P1 — Décomposition captif/transférable (§16).** Actuellement, `abstentionProbability` ne dépend
  que de la distance idéologique moyenne, jamais de la force de la consigne — l'ajouter est cohérent
  avec l'architecture existante et répond à l'exigence du prompt sans dupliquer le moteur.
  Actuellement, comme documenté ci dessus (§10), le mécanisme d'abstention réduit le poids national
  du bloc mais pas la part relative affichée entre partis actifs — un futur ajustement devra en
  tenir compte pour être réellement visible.
- **P2 — Endorsements nationaux.** Étendre `majorEndorsements.ts`/créer `nationalFigures.ts` en
  suivant exactement le patron de `worldFigures.ts` et `docs/FICTIONAL_POLITICAL_ARCHETYPES.md`.
- **P2 — Date de référence sur le premier bulletin.** Modification UI ciblée et déjà bien cadrée
  (`RaceBulletinScreen`, condition sur `poll.decisionIndex === 0`).
- **P3 — Fréquence des retraits par parti.** Reconquête concentre 94,5 % des retraits actuels ; ce
  n'est pas un défaut du Bloc A (le moteur fait ce qu'on lui demande : le socle le plus faible perd
  le plus souvent), mais cela signifie que sans le nouveau mécanisme stratégique, les scénarios
  demandés en §9-10 resteront statistiquement absents.

---

## 16. Non-régressions vérifiées pendant ce Bloc A

- `npx vitest run` : **277/277** verts (inchangé, aucune modification de production).
- Nouveaux tests ajoutés (diagnostics/regression, pas de changement de règle) :
  `sidebarSecondRoundSync.test.ts` (2 tests, verts).
- E2E ciblés (`game.spec.ts`, tests 7-10, second tour/élimination/défaite/victoire/gouvernement) :
  **4/4 verts** (rejoué une fois en un seul worker après un flake de compilation à froid Next.js sur
  les deux premiers, confirmé non lié au jeu).
- `redistributeElectorate`/`redistributeAllianceBoost` (`redistribution.test.ts`, 11 tests) et
  `electoralCoherence.test.ts` (4 tests) : tous verts, invariants déjà couverts confirmés valables
  après ce corpus de 10 800 campagnes.

---

## GATE

```
BLOC A TERMINÉ — RECOMPOSITIONS STRATÉGIQUES DIAGNOSTIQUÉES — DÉMARRAGE BLOC B
```
