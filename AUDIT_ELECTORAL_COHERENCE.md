# AUDIT — Crédibilité électorale, dynamique de course et cohérence contextuelle

Rapport intermédiaire de fin de BLOC A (PROMPT_CLAUDE_CODE_AUDIT_CREDIBILITE_ELECTORALE_COHERENCE.md).
Aucune règle de production n'a été modifiée pendant cette phase : seuls des scripts d'audit
(`scripts/audit/`, `scripts/text-quality-audit/`), un test de diagnostic ponctuel et ce rapport ont
été créés.

## 0. État initial consigné

- Branche : `codex/v2-audit-improvements`, HEAD `265a41f` (« fix(ui): stop RaceBulletinScreen from
  reappearing after round one; clean up glued apostrophes »).
- `git status` avant audit : un seul fichier modifié non commité (`next.config.ts`, réglage
  `allowedDevOrigins` local pour un tunnel de test, hors sujet), plus les prompts de mission
  non trackés à la racine.
- Node v24.16.0, npm 11.13.0.
- 9 partis jouables (`isRealOrganization`), 278 événements, 58 succès (`npm run data:validate`).
- Scripts d'audit préexistants réutilisés : `scripts/audit-post/lib/agents.ts` (8 agents
  déterministes), `scripts/gameplay-audit/generate-corpus.ts` (patron repris pour le corpus
  électoral), `scripts/audit/electoral-extremes.ts` (scénarios de second tour déjà en place).

### Contrôles de référence

| Commande | Résultat |
|---|---|
| `npm run lint` | ✅ aucune erreur |
| `npx tsc --noEmit` | ✅ aucune erreur |
| `npm run data:validate` | ✅ « Validation structurelle et éditoriale réussie » |
| `npx vitest run` | ✅ 44 fichiers, 226 tests (un premier run a timeout sur les workers pour raison d'infrastructure locale — reproductible avec des process Node concurrents laissés ouverts ; relancé proprement, 0 échec) |
| `npm run build` | ✅ compilation et génération statique réussies |
| `npx playwright test` | ⚠️ 26 passés, 3 échecs, 17 skip (voir ci-dessous) |

**Échecs préexistants documentés (non liés à cet audit) :**

1. `e2e/game.spec.ts` test 8 « élimination contrôlée au premier tour et bilan final » —
   attend `/3e au premier tour/i` pour PS sur la graine `e2e-ps-search-0` (méthode
   « Présidentiable », choix systématiquement en première position). Rejoué directement avec le
   moteur (`scripts/audit/diag-e2e-seed.ts`) : PS termine désormais **2e** (14,8 % contre 15,5 %
   pour RN, Horizons 3e à 14,1 %) et **se qualifie** — la fixture ne produit plus une élimination
   du tout. Cause probable : recalibrage électoral antérieur à cette mission (commits
   `eb845c7` « fix(p5): penalize ideological centrality and cap runoff transfer share » et
   `a68bd41` « fix(p1): wire cohesion and consistency into first-round vote appeal », tous deux
   avant cette session) qui a fait glisser une position de course déjà proche de la frontière de
   qualification. C'est le même phénomène que celui déjà documenté dans `V2_CHANGELOG.md` Phase H
   pour cette exact seed après un précédent recalibrage. Ne révèle pas un nouveau bug de crédibilité
   — c'est une fixture figée sur un résultat électoral qui a toujours été sensible à la moindre
   recalibration. Corrigée en BLOC B (nouvelle graine).
2. `e2e/visual-regression.spec.ts` — 2 diffs de régression visuelle à ~1 % des pixels
   (« routine card — 1366×768 », « government — 1366×768 »), rendu/anti-aliasing, sans lien avec
   le sujet de cette mission. Non traité (hors périmètre BLOC B, aucune règle de gameplay
   affectée).

## 1. Scores initiaux crédibles ?

**Non.** Corpus de 10 008 campagnes (9 partis × 8 agents × 139 graines,
`scripts/audit/electoral-coherence-corpus.ts`, `AUDIT` complet en 19,9 min). Au tout début de
partie — avant toute décision du joueur, moteur de production réel via `createGame` —
`audit-results/electoral-coherence/initial-strength.csv` :

| Parti | Moyenne | Médiane | Min | Max | Écart-type | Écart moyen au leader | Rang moyen |
|---|---:|---:|---:|---:|---:|---:|---:|
| RN | 13,13 | 13,12 | 8,40 | 18,70 | 0,68 | 0,29 | 1,39 |
| Horizons | 12,01 | 11,99 | 7,40 | 17,60 | 0,69 | 1,41 | 2,46 |
| Renaissance | 11,98 | 11,97 | 7,60 | 18,50 | 0,69 | 1,44 | 3,26 |
| Nouvelle Énergie | 11,57 | 11,54 | 7,40 | 17,30 | 0,70 | 1,85 | 4,90 |
| PS | 11,62 | 11,60 | 7,50 | 17,20 | 0,69 | 1,80 | 4,12 |
| LFI | 11,44 | 11,43 | 7,30 | 17,50 | 0,72 | 1,98 | 5,74 |
| LR | 11,02 | 11,01 | 6,80 | 16,70 | 0,71 | 2,40 | 6,61 |
| Écologistes | 10,49 | 10,48 | 6,30 | 15,20 | 0,69 | 2,93 | 7,53 |
| Reconquête | 6,73 | 6,71 | 2,60 | 11,30 | 0,71 | 6,69 | 9,00 |

Sur 10 008 campagnes, aucun parti (hors Reconquête, délibérément le plus faible) n'a **jamais**
démarré sous 6,3 % ni au-dessus de 18,7 % — un écart-type de 0,68 à 0,72 point pour 8 partis sur 9.
Cette compression est **présente dès la décision 0**, avant toute action du joueur : elle n'est
pas un artefact d'un mauvais choix de graines ou d'agents, elle vient directement du calcul
d'appel électoral initial (`partyAppeal`, `src/game/engine/electorate.ts`).

## 2. Distribution trop comprimée ?

**Oui, structurellement, du début à la fin de la campagne.** `audit-results/electoral-coherence/summary.json`
(`dispersionByCheckpoint`) :

| Checkpoint | Leader moyen | 2e moyen | 3e moyen | Écart top1-top2 | Écart top1-top9 | Écart-type |
|---|---:|---:|---:|---:|---:|---:|
| 0 % (départ) | 13,42 | 12,30 | 11,93 | 1,12 | 6,70 | 1,80 |
| 25 % | 13,23 | 12,38 | 11,85 | 0,85 | 6,47 | 1,74 |
| 50 % | 13,94 | 12,36 | 11,80 | 1,59 | 7,23 | 1,90 |
| 75 % | 14,23 | 12,66 | 12,05 | 1,57 | 7,60 | 2,00 |
| Dernier sondage avant T1 | 14,56 | 12,67 | 12,09 | 1,90 | 8,10 | 2,13 |
| **Résultat T1 réel** | **15,51** | **13,62** | **12,68** | **1,89** | **9,27** | **2,74** |

La campagne (24 décisions) fait bouger l'écart-type de seulement 1,80 à 2,74 — une croissance
réelle mais modeste, partant d'une base déjà très resserrée. Le bruit du scrutin au résultat réel
élargit un peu plus (écart-type 2,74 contre 2,13 au dernier sondage), mais reste loin d'une
dispersion crédible.

**Cause racine identifiée et quantifiée** (`scripts/audit/diag-clamp-contribution.ts`, calculée sur
la graine `clamp-test-1`) : dans `partyAppeal()`, le terme additif de compétence
(`credibility*0.18 + popularity*0.15 + mobilization*0.09`) varie de **19,20 à 25,74** selon le
parti (ratio ≈1,34×) alors que le terme multiplicatif porté par l'idéologie et le socle
(`base * ideologicalFit * affinity * electoralReadiness`) — qui EST la source de différenciation
voulue par blocs électoraux — se retrouve réduit à une magnitude comparable ou inférieure une fois
multiplié par des facteurs tous ≤1 (`ideologicalFit` ≤1, `affinity` généralement proche de 1,
`electoralReadiness` 0,68–1). Résultat : le terme le moins différenciant (compétence, stats
proches d'un parti à l'autre au lancement) domine le terme censé porter l'essentiel de la
différenciation (idéologie/socle). Le clamp `electoralReadiness` lui-même n'est **jamais atteint**
en pratique aux stats de départ (valeur clampée strictement identique à la valeur non clampée pour
les 9 partis testés) — ce n'est pas le mécanisme responsable, contrairement à l'hypothèse initiale.

## 3. Fréquence de la bande 7–16 %

`audit-results/electoral-coherence/compressed-races.csv`, quatre définitions testées :

| Checkpoint | ≥8/9 partis dans [7,16] | ≥7/9 dans [7,16] | Écart total <10 pts | Leader <17 % |
|---|---:|---:|---:|---:|
| 0 % | 96,8 % | 99,9 % | 99,998 % | 99,99 % |
| 25 % | 96,9 % | 99,9 % | 99,99 % | 99,99 % |
| 50 % | 93,0 % | 99,7 % | 98,9 % | 99,7 % |
| 75 % | 89,7 % | 99,4 % | 95,7 % | 98,9 % |
| Dernier sondage avant T1 | 83,6 % | 99,8 % | 85,5 % | 95,7 % |
| **Résultat T1 réel** | **76,2 %** | **98,1 %** | **61,7 %** | **81,7 %** |

Même à la définition la plus stricte (8 ou 9 partis sur 9 dans la bande 7–16 %), la configuration
domine **76,2 % des résultats réels de premier tour** sur 10 008 campagnes. Avec la définition
large (7/9), elle domine **98,1 %** des cas. Le leader du premier tour reste sous 17 % dans
**81,7 %** des campagnes. Sur l'ensemble du corpus, le score maximal jamais observé, tous partis et
tous checkpoints confondus, est **23,6 %** — jamais 25 %, jamais 30 %.

## 4. Causes identifiées

### 4.1 Confirmée — désynchronisation `party.active` / `candidateStatus` après le premier tour (P1)

`simulateFirstRound` (`src/game/engine/election.ts:220-223`) marque les partis non qualifiés
`actor.candidateStatus = "eliminated"` mais **ne met jamais `party.active` à `false`**. Or
`party.active` (pas `candidateStatus`) est le seul filtre utilisé par :

- `nationalLatentSupport` (`electorate.ts:104`) — alimente `party.stats.polling` à **chaque
  décision** via `recalculateElectorate`, appelé inconditionnellement dans `game.ts:398` quelle que
  soit la phase ;
- `generatePoll` (`polls.ts:25`) — alimente `state.pollHistory`, régénéré tous les 4 décisions
  (`game.ts:436`) y compris en entre-deux-tours/gouvernement ;
- `regionalResults` (`election.ts:34`).

Confirmé empiriquement (`scripts/audit/diag-active-after-r1.ts`, graine `diag-active-1`, parti
LFI) : juste après le verrouillage du premier tour, les 7 partis éliminés ont tous
`active = true` et un `polling` recalculé comme si la course à 9 candidats continuait :

```text
lfi   active=true candidateStatus=official    polling=15.39
ps    active=true candidateStatus=eliminated  polling=10.43
...
nouvelle_energie active=true candidateStatus=official polling=12.71
```

Les deux finalistes affichent 15,39 % et 12,71 % — des chiffres qui ne correspondent ni à un
sondage multi-candidats cohérent (il ne devrait plus y avoir que 2 concurrents) ni au duel réel
calculé séparément par `simulateSecondRound` (report de voix, abstention, appel). C'est la cause
racine du signalement « certains pourcentages affichés dans la sidebar ne semblent pas basculer
correctement vers le second tour » : `MainStats` (`campaign-screens.tsx:45-68`), affiché sans
condition de phase dans la barre latérale à chaque décision, lit directement
`party.stats.polling`.

Capture réelle de cette session (screenshot `verif-06-elimine-entre-deux-tours.png`, prise pendant
le fix précédent du RaceBulletinScreen) : un candidat éliminé en 6e position au premier tour
affiche encore « Intentions 8,3 % » en entre-deux-tours — un chiffre sans signification claire
(ni son dernier score réel au premier tour, ni une part de duel puisqu'il n'y participe pas).

**Confirmé, cause racine identifiée, corrigible sans exception hardcodée** : exclure les partis
dont `actor.candidateStatus` est `eliminated`/`withdrawn`/`disqualified` du calcul de
`nationalLatentSupport`/`generatePoll` une fois `state.qualifiedPartyIds` fixé, sans toucher à la
sémantique plus large de `party.active` (utilisée ailleurs pour d'autres décisions, ex.
remplacement de candidat).

### 4.2 Confirmée — événements de second tour référençant un tiers sans exclure le cas « adversaire » (P1)

Voir section 6 et Annexe B.

### 4.3 Écran RaceBulletinScreen après le premier tour — déjà corrigé

Corrigé sur cette même branche avant le début de cette mission (commit `265a41f`,
`src/features/campaign/gameStore.ts` : `pendingScreen: "race"` n'est plus assigné que pour les
phases `pre_campaign`/`campaign`/`official_campaign`). Re-vérifié fonctionnel pendant cet audit ;
aucune régression trouvée. Voir section 8.

### 4.4 Apostrophes — cassées dans un seul fichier, introduites par le nettoyage précédent (P2)

Voir section 10 et Annexe C.

## 5. Favoris / outsiders / percées / effondrements suffisamment présents ?

**Non.** Archétypes classés sur les 10 008 campagnes (perspective du parti joué,
`scripts/audit/electoral-coherence-analyze.ts`, seuils documentés dans le script) :

| Archétype | % des campagnes |
|---|---:|
| Course fragmentée | 89,2 % |
| Effondrement du favori | 4,1 % |
| Remontée tardive | 3,7 % |
| Percée outsider | 0,9 % |
| Qualification confortable | 1,7 % |
| Tripartite | 0,3 % |
| **Favori dominant (>22 %, avance >5 pts)** | **0 %** |
| Duel clair | 0 % (jamais isolé — toujours absorbé par « fragmentée » avant ce seuil) |

**Zéro campagne sur 10 008 ne produit un favori dominant.** Le score maximal jamais observé
(23,6 %) est lui-même sous le seuil de définition d'un « favori dominant » (>22 % ET >5 pts
d'avance) — la définition n'est donc quasiment jamais atteignable avec la calibration actuelle.
Dynamique de leadership (`leadership-dynamics.csv`) : 1,54 changement de leader et 2,31
changements de top 2 par campagne en moyenne (l'incertitude existe et bouge réellement), mais le
gain maximal moyen d'un parti sur toute une campagne n'est que de 1,04 point (p90 : 2,89 points) et
la perte maximale moyenne de 1,20 point (p90 : 2,87) — aucun effet d'événement, cumulé sur 24
décisions, ne rapproche un parti du seuil de percée ou d'effondrement franc tel que défini par la
mission. Ce n'est pas un manque de variété narrative (voir `PARTY_GAMEPLAY_IDENTITIES.md`, tension
et dilemme définis pour chaque parti) : c'est un manque de portée numérique des effets face à
l'ampleur de la compression de base.

## 6. Second tour incohérent ?

**Oui, systémique.** 10 des 13 événements de second tour spécifiques à un parti référencent un
tiers précis (allié « naturel ») sans exclure le cas où ce tiers est en réalité l'adversaire
qualifié du joueur — reproduisant exactement le scénario Horizons signalé par les retours de
playtest. Détail en Annexe B.

## 7. Sidebar désynchronisée ?

Oui — confirmé, cause racine identifiée en 4.1. Non un artefact de graine : systémique, présent
sur toute campagne dès que le premier tour est tranché, tant que le joueur reste en jeu (qualifié
ou éliminé) pendant l'entre-deux-tours et le gouvernement.

## 8. RaceBulletin au mauvais moment ?

Non — déjà corrigé avant cette mission (commit `265a41f`), re-vérifié pendant cet audit. Voir
section 11.

## 9. Projection régionale cohérente ?

Oui — `regionalProjection()` (`campaign-screens.tsx:365`) n'est utilisée que par
`RaceBulletinScreen`, qui ne s'affiche plus après le premier tour (§8). Les cartes régionales
affichées après le premier tour (`ElectionNightScreen`, « Territoires en tête ») lisent
`state.firstRoundResult.regionalResults` / `state.secondRoundResult.regionalResults` — des
snapshots figés du résultat réel de chaque tour, jamais recalculés depuis un état obsolète.
Vérifié en navigateur sur les deux tours pendant la vérification précédente de cette branche.
Aucune action nécessaire.

## 10. Combien de problèmes de texte ?

54 — un seul type de défaut (apostrophe droite `'` au lieu de la typographique `’`), tous confinés
à `src/game/data/events/v2/partiesLeft.ts`. Voir section 13.

## 11. P0/P1/P2 ?

Aucun P0 (aucun crash, aucune corruption d'état, aucune campagne invalide — 0 échec sur 10 008
runs, `firstRoundIntegrity` déjà vérifiée par `electoral-extremes.ts` : total premier tour toujours
= 100, aucun candidat disqualifié ne reçoit de voix).

**P1** :
1. Compression de la dispersion électorale (sections 1-5) — cause racine identifiée et quantifiée
   dans `partyAppeal()`.
2. Cohérence contextuelle du second tour (section 6, Annexe B) — 10/13 événements.
3. Désynchronisation de la sidebar/dashboard après le premier tour (section 7) — cause racine
   identifiée (`party.active` jamais mis à jour par `simulateFirstRound`).

**P2** :
4. Second tour lui-même resserré autour de 50/50 par le calibrage P5 précédent
   (`RUNOFF_SHARE_DAMPING = 0.62`) : `scripts/audit/electoral-extremes.ts` rejoué pendant cet audit
   montre un intervalle observé de 44,9–55,4 % pour le camp PS sur 500 graines à premier tour fixé,
   contre 41,7–60,1 % le 5 août (avant le calibrage P5 le plus récent). C'est un compromis
   déjà délibéré pour corriger un défaut antérieur documenté (quasi-monopole de report) — signalé
   ici comme observation, pas comme régression à corriger sans plus d'analyse : un assouplissement
   du damping risquerait de réintroduire le problème que P5 corrigeait. Non traité en BLOC B de
   cette mission (nécessiterait sa propre étude dédiée aux scénarios de second tour).
5. Apostrophes droites résiduelles (section 10, Annexe C) — 54 occurrences, un seul fichier.
6. Fixture E2E `e2e-ps-search-0` obsolète après un recalibrage antérieur à cette mission.

## 12. Corrections recommandées

1. **Dispersion (P1)** — rééquilibrer `partyAppeal()` dans `src/game/engine/electorate.ts` pour que
   le terme idéologie/socle (`base * ideologicalFit * affinity * electoralReadiness`) pèse
   proportionnellement plus que le terme de compétence additif, sans changer la logique métier de
   chaque terme ni cibler un parti précis. Valider par re-simulation massive contre les critères de
   la section 22 du prompt (favoris >20 %, outsiders <7-8 %, formes de course variées) avant/après.
2. **Cohérence second tour (P1)** — nouvelle condition d'éligibilité générique
   `{ kind: "party_not_opponent", partyIds: [...] }` dans `Condition` (types) et `conditions.ts`,
   appliquée aux 10 événements listés en Annexe B avec leurs `referencedThirdParties` réels. Aucune
   exception `if Horizons` hardcodée.
3. **Sidebar (P1)** — exclure les partis dont `actor.candidateStatus` est
   `eliminated`/`withdrawn`/`disqualified` du calcul de `nationalLatentSupport`/`generatePoll`, sans
   toucher à la sémantique plus large de `party.active`. Une seule source de vérité déjà en place
   (`party.stats.polling`), lue par trois composants (`MainStats`, `campaign-dashboard.tsx`,
   `active-campaign-card.tsx`) — corrigée automatiquement pour les trois par un seul changement
   moteur.
4. **Apostrophes (P2)** — remplacer les 54 apostrophes droites de `partiesLeft.ts` par la
   typographique, revalidées par `src/game/data/__tests__/textApostrophes.test.ts` (déjà vert car ce
   test ne couvre que les mots collés, pas l'incohérence `'` vs `’` — étendre sa portée ou ajouter
   une règle dédiée).
5. **Fixture E2E (P2)** — remplacer la graine `e2e-ps-search-0` par une graine reproduisant
   effectivement une élimination en position ≥3 avec la méthode « Présidentiable ».

---

## Annexe A — Détail méthodologique de la dispersion électorale

- **Corpus** : `scripts/audit/electoral-coherence-corpus.ts`. 9 partis jouables × 8 agents
  déterministes (`scripts/audit-post/lib/agents.ts`, déjà utilisés dans les audits fun/gameplay
  précédents) × 139 graines = 10 008 campagnes complètes, moteur de production réel
  (`createGame`/`currentEvent`/`resolveCurrentChoice`), 0 échec. Durée : 19,9 min.
- **Snapshots** : sondage (`party.stats.polling`, recalculé à chaque décision par
  `recalculateElectorate`) de tous les partis actifs à 0 %, 25 %, 50 %, 75 % des 24 décisions avant
  le premier tour (`GAME_CONFIG.targetDecisionsBeforeFirstRound`), au dernier point avant le
  verrouillage du premier tour, et au résultat réel (`state.firstRoundResult.results`, qui inclut
  le bruit du scrutin — distinct du sondage).
- **Analyse** : `scripts/audit/electoral-coherence-analyze.ts` relit les CSV bruts et calcule
  dispersion agrégée, indicateur `compressedRace` (4 définitions), archétypes de course (8 formes,
  seuils documentés dans le script — percée : score initial <7 % et gain ≥8 pts au résultat T1 ;
  effondrement : rang initial 1 et rang T1 ≥4 ; remontée tardive : hors top 2 à 75 % puis qualifié ;
  favori dominant : leader T1 >22 % et avance >5 pts ; duel clair : écart 2e-3e ≥8 pts ; tripartite :
  1-2-3 dans un mouchoir de 3 pts et tous ≥15 % ; fragmentée : ≥7/9 partis dans [7,16] ; qualification
  confortable : cas restant), dynamique de leadership, percentiles par parti.
- **Sorties** : `audit-results/electoral-coherence/{dispersion-by-phase,party-percentiles-raw,
  dispersion-summary,compressed-races,race-archetypes,leadership-dynamics,party-percentiles,
  initial-strength,runoff-context-matrix,text-quality}.csv` + `summary.json`.
- **Limite assumée** (section 5 du prompt) : pas d'accès Internet fiable dans cet environnement pour
  comparer à des sondages présidentiels français récents ; l'audit travaille donc uniquement sur la
  cohérence interne (dispersion, variance, plausibilité relative entre partis) et documente cette
  limite plutôt que d'inventer des chiffres contemporains.

## Annexe B — Matrice de cohérence du second tour

10 des 13 événements de second tour spécifiques à un parti (`eligibility` contient
`{kind:"qualified", value:true}` et `eligibleParties` fixe un seul parti) référencent un parti
tiers précis via un effet `alliance()` ou `party_relation()`, sans aucune condition
d'éligibilité excluant le cas où ce tiers est en réalité l'adversaire qualifié du joueur. Aucun
mécanisme de ce type n'existe ailleurs dans le moteur (`eventSelector.ts` ne référence jamais
`qualifiedPartyIds`).

Script : `scripts/audit/runoff-coherence-audit.ts` → `audit-results/electoral-coherence/runoff-context-matrix.csv`.

| eventId | eligibleParties | referencedThirdParties | coherent |
|---|---|---|---|
| party_lfi_runoff | lfi | ps, ecologistes | ❌ |
| party_ps_runoff | ps | lfi, ecologistes, renaissance | ❌ |
| party_ecologistes_runoff | ecologistes | ps, lfi | ❌ |
| party_renaissance_runoff | renaissance | horizons, ps | ❌ |
| party_horizons_runoff | horizons | renaissance, lr | ❌ |
| party_horizons_runoff_continuity | horizons | lr | ❌ |
| party_horizons_runoff_coalition | horizons | lr, renaissance | ❌ |
| party_lr_runoff | lr | horizons, rn | ❌ |
| party_reconquete_runoff | reconquete | rn, lr | ❌ |
| party_nouvelle_energie_runoff | nouvelle_energie | horizons, lr | ❌ |
| party_rn_runoff | rn | *(aucune référence tierce)* | ✅ |

Exemple concret confirmant le signalement utilisateur : si le joueur incarne Horizons et que RN
(pas LR/Renaissance) est en réalité l'adversaire qualifié, `party_horizons_runoff` et ses deux
suites de chaîne restent éligibles et proposent malgré tout de négocier avec LR/Renaissance — sans
jamais évoquer RN. Si le tiers référencé (LR ou Renaissance) est lui-même l'adversaire qualifié,
l'incohérence devient directe : l'événement encourage une alliance avec le finaliste adverse.

## Annexe C — Qualité du texte

Script : `scripts/text-quality-audit/run.ts` → `audit-results/electoral-coherence/text-quality.csv`.
Scanne `gameContent` entier (événements, partis, acteurs, méthodes, fins, entités, succès), hors
champs techniques (id, clés, topics...). 76 correspondances brutes, 22 écartées après correction
d'un faux positif dans la détection « élision avec espace » (le motif initial confondait le
« s » final de mots comme « après » avec le pronom élidé « s' », ex. « après un » à tort signalé
comme « après_s un » — corrigé pour n'accepter le préfixe isolé qu'en début de mot). 54 restants,
tous de la même règle (`apostrophe_droite_au_lieu_de_typographique`), tous dans
`partiesLeft.ts`.

Origine : le nettoyage d'apostrophes effectué juste avant cette mission (commit `265a41f`) a
utilisé l'apostrophe droite `'` dans ses corrections de `partiesLeft.ts` au lieu de la
typographique `’` utilisée par le reste du corpus (`endgame.ts`, `internal.ts`, `alliances.ts`,
`world.ts`, `scandals.ts`, `rare.ts` — vérifiés à 0 occurrence de `'` collée entre lettres). C'est
exactement le symptôme « apostrophes... incohérentes » remonté dans cette mission : régression
auto-infligée, confinée, triviale à corriger.

---

## Gate

Rapport intermédiaire terminé. Causes racines établies pour les cinq problèmes confirmés
(compression de dispersion, cohérence second tour, sidebar, apostrophes, fixture E2E obsolète).
Métriques sauvegardées (`audit-results/electoral-coherence/`). Bug reproduit explicitement pour
chaque cause racine via des scripts dédiés (`scripts/audit/diag-active-after-r1.ts`,
`scripts/audit/diag-e2e-seed.ts`, `scripts/audit/diag-clamp-contribution.ts`,
`scripts/audit/runoff-coherence-audit.ts`, `scripts/text-quality-audit/run.ts`). Baseline archivée
(section 0, ce document, plus les CSV/JSON listés en Annexe A). Aucune règle de production
modifiée pendant cette phase.

```text
BLOC A TERMINÉ — CAUSES RACINES ÉTABLIES — DÉMARRAGE BLOC B
```
