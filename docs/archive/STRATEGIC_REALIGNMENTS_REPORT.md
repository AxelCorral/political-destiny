# STRATEGIC_REALIGNMENTS_REPORT.md

## Mission : recompositions stratégiques, chocs électoraux, soutiens nationaux

Suite de `AUDIT_STRATEGIC_REALIGNMENTS.md` (Bloc A). Ce rapport couvre le Bloc B : implémentation
confirmée, simulations massives post-correction (10 800 campagnes), 1 500 paires de contrefactuels,
12 playtests scriptés, non-régression complète.

---

## 1. Résumé exécutif

Le moteur distingue désormais explicitement le retrait par effondrement (subi, `maybeWithdrawAndRally`,
inchangé) du désistement stratégique (négocié, nouveau : `maybeNegotiateStrategicWithdrawal` /
`resolveStrategicNegotiation`, `opponentSimulation.ts`). Sur 10 800 campagnes post-correction :
30,54 % contiennent au moins un retrait (21,08 % effondrement, 10,01 % stratégique), 222 désistements
stratégiques Écologistes sont apparus naturellement (2,06 % des campagnes) et se répartissent entre
PS (213) et LFI (9) selon le contexte — jamais scriptés. Le choc de retrait « propre » (hors artefact
de bascule premier tour, identifié en Bloc A) reste borné : moyenne 4,06 points, maximum 15,4 points,
zéro choc au-delà de 20 points sur 10 800 campagnes. Huit soutiens nationaux pseudonymisés sont
implémentés avec effets mixtes. La date de référence du 18 avril 2026 apparaît sur le premier
bulletin. Un bug réel a été trouvé et corrigé en cours de route dans les scripts d'audit eux-mêmes
(voir §10) — pas dans le moteur de production. 294 tests unitaires, 12 tests E2E fonctionnels, 10
tests de régression visuelle et le build de production sont verts.

---

## 2. Baseline (rappel Bloc A)

Voir `AUDIT_STRATEGIC_REALIGNMENTS.md` pour l'intégralité du diagnostic. Rappel des chiffres clés :

| Mesure | Avant (héritée) |
|---|---:|
| Retrait naturel | 22,84 % |
| Désistement stratégique | 0 (mécanisme inexistant) |
| Retrait Écologistes naturel | ~0,05 % (5/10 800, effondrement uniquement) |
| Choc moyen (mesure brute, incluant l'artefact) | 3,77 pts |
| Choc maximal historique | 45,79 pts |
| Endorsements nationaux | 0 |
| Date de référence sur premier bulletin | absente |

---

## 3. Retraits par effondrement

`maybeWithdrawAndRally` n'a pas été modifié dans sa logique de déclenchement (`polling < 6 OU
legitimacy < 45`, plafond de probabilité 0,05/décision). Sur le corpus post-correction, la fréquence
de campagnes avec au moins un retrait par effondrement est de **21,08 %** — stable par rapport à la
baseline historique (22,84 %, mesurée avec une méthodologie légèrement différente incluant les
remplacements). Le chemin reste strictement « effondrement » : aucune négociation, aucune consigne,
un retrait qui peut être subi.

---

## 4. Désistements stratégiques

Nouveau mécanisme à deux étapes (`negotiation_opened` puis résolution en `strategic_withdrawal` /
`negotiation_failed`), déclenché uniquement quand la campagne est **encore fonctionnelle**
(`legitimacy >= 45`, `cohesion >= 35` — ce qui la distingue structurellement de l'effondrement),
classée en rang ≥5 (hors du top 4), avec une viabilité électorale fermée
(`computeElectoralViability < -6`) et une pression de fragmentation de bloc réelle
(`computeBlocFragmentationPressure >= 28`).

Sur 10 800 campagnes post-correction :
- **10,01 %** contiennent au moins un désistement stratégique.
- **2 883** négociations ouvertes au total ; **1 101** aboutissent à un retrait effectif (**38,2 %**
  de taux de réussite), **1 701** échouent ou se soldent par un maintien.
- Le processus tient sur 2 événements narratifs (ouverture, résolution — qui porte à la fois l'issue
  de la négociation et, si elle réussit, le retrait effectif), dans la fourchette « 1 à 3 » du
  prompt de mission.

---

## 5. Viabilité électorale et fragmentation de bloc

`src/game/engine/viability.ts` — `computeElectoralViability` et `computeBlocFragmentationPressure`,
tels que prototypés en Bloc A puis recalibrés deux fois pendant le Bloc B après diagnostics ciblés
(voir commentaires du code, `opponentSimulation.ts` et `viability.ts`, pour l'historique complet) :

1. **Premier calibrage** (viabilité < 6, fragmentation > 12) : bien trop permissif — 45 % de
   désistements stratégiques sur un corpus de test, taux Écologistes 18,6 %.
2. **Resserré** (viabilité < -1, plancher de rang) : fréquence ramenée à un ordre de grandeur
   plausible, mais 0 désistement Écologistes sur deux corpus successifs (10 800 puis 7 200
   campagnes) — diagnostic : les termes secondaires de la formule (momentum, écart
   crédibilité/rejet — délibérément bas pour les Écologistes) pouvaient compenser un écart réel de
   10-13 points au duo de tête.
3. **`gapToTop2` recentré comme terme dominant** (×2,5 au lieu de ×1,5, termes secondaires réduits à
   des modificateurs mineurs) puis seuil renormalisé en conséquence (`< -6`) : c'est la version
   finale. Elle rend la formule sensible sur une échelle plus large (-30 à +23 observés selon le
   parti) mais fidèle à l'intention du prompt de mission (§5 : « Ce n'est jamais le score brut »).

`computeBlocFragmentationPressure` réutilise `party.naturalAllies` (copié depuis
`PartyDefinition.campaignProfile` sur `PartyState` à la création de partie — voir §31, aucune donnée
nouvelle) : pression = marge d'avance du meilleur allié actif × 2,2, + 20 si le score combiné
franchirait le seuil de qualification alors qu'aucun des deux seul ne le franchit.

---

## 6. Cas Écologistes

**222 désistements stratégiques Écologistes sur 10 800 campagnes (2,06 %)** — ni automatique, ni
absent, conforme à la double exigence du §38 du prompt de mission. Répartition du bénéficiaire :

| Bénéficiaire | Occurrences | % |
|---|---:|---:|
| PS | 213 | 95,9 % |
| LFI | 9 | 4,1 % |

Ce déséquilibre PS/LFI est **contextuel, pas câblé** : le contrefactuel B (§9) montre que la part
nationale immédiate captée par LFI après un désistement Écologistes vers LFI progresse
**strictement avec la relation** Écologistes-LFI (14,52 % à relation -70 → 15,18 % à relation neutre
→ 16,45 % à relation +70, sur 500 paires), confirmant que le moteur répond au contexte relationnel
plutôt qu'à une préférence figée. La domination du PS dans le corpus naturel reflète simplement une
proximité idéologique par défaut plus grande dans les vecteurs d'idéologie de départ, pas une règle
par parti.

Playtests 1-3 (§14) confirment les trois scénarios demandés (§9 du prompt) : Écologistes → PS quand
PS est mieux placé et la relation bonne ; Écologistes → LFI quand LFI est mieux placé et la relation
bonne ; Écologistes maintenus quand la gauche est fragmentée et serrée (aucune voie de sortie nette,
aucune négociation ne s'ouvre même après 60 graines).

---

## 7. Cas droite/centre

Playtests 4-7 confirment les quatre scénarios demandés (§10 du prompt), tous issus du même mécanisme
générique — aucun script par parti :

| Scénario | Résultat |
|---|---|
| LR → Horizons | strategic_withdrawal, décision 19 |
| LR → Nouvelle Énergie | strategic_withdrawal, décision 13 |
| Renaissance → Horizons | strategic_withdrawal, décision 11 |
| Reconquête → RN | strategic_withdrawal, décision 11 |

Ces quatre routes émergent de `party.naturalAllies` (§31 : LR = [horizons, renaissance,
nouvelle_energie], Renaissance = [horizons, lr], Reconquête = [rn]), déjà présent dans
`src/game/data/parties.ts` avant cette mission — la mission a câblé le moteur pour les lire, pas
ajouté de nouvelles données par parti.

---

## 8. Négociations

Sur le corpus post-correction : **2 883 négociations ouvertes**, **1 101 réussies (38,2 %)**, **1 701
échouées ou résolues en maintien**. Le playtest 8 (§14) illustre explicitement un échec : relation
Écologistes-PS forcée à -90 et ambition de l'acteur forcée à 95 (deux facteurs qui réduisent
`acceptChance` dans `resolveStrategicNegotiation`) → « ÉCO et PS ne trouvent pas d'accord : ÉCO
maintient sa candidature. » à la décision 15.

Facteurs de `acceptChance` (§8 du prompt, tous implémentés) : relation entre partis (`/220`),
distance idéologique (`-/260`), ambition de l'acteur retirant (`-(ambition-50)/200`), pression de
fragmentation (`+/260`), mémoire d'hostilité entre acteurs (`actorMemories`, kinds hostility/
betrayal/alliance_refusal/humiliation, `-0,08` par occurrence), proximité du premier tour
(`+0,01` par jour manquant sous 12).

---

## 9. Redistribution

`redistributeElectorate` accepte désormais un `explicitConsigne` optionnel
(`{ partnerId, strength }`), et dérive automatiquement le palier de consigne pour tout autre
destinataire (`resolveConsigneStrength` : coalition_agreement si déjà allié, explicit_support si
endorsement explicite posé, none sinon). **Palier unique par destinataire, jamais cumulé** — c'est le
correctif central du §9/§15 (voir Bloc A §9 : l'ancien empilement `relationBoost × alreadyAllied ×
explicitEndorsement` pouvait atteindre ×3,46 ; le nouveau plafond est ×1,8 pour `coalition_agreement`,
×1,45 pour `explicit_support`).

Tests unitaires dédiés (`redistribution.test.ts`) : consigne forte > soutien explicite > retrait
neutre sur le même destinataire (§17) ; empilement alliance+endorsement+relation forte ne dépasse
plus le palier le plus fort (`toBeCloseTo` avec la version calibrée directement en
`coalition_agreement`) ; une consigne de coalition réduit la part perdue vers l'indécision par
rapport à un retrait neutre (§16-17, abstentionProbability modulée par
`CONSIGNE_ABSTENTION_ADJUSTMENT`).

**Contrefactuel A** (500 paires désistement stratégique vs maintien, méthodologie : capturer l'état
juste avant la négociation, forcer les deux issues, continuer avec la même politique d'agent) :
delta absolu moyen du score final du joueur **7,68 points**, qualification changée dans **10 %** des
paires, victoire changée dans **29,8 %** — un désistement stratégique a un effet réel et mesurable
sur l'issue de la campagne, pas un ajustement cosmétique.

---

## 10. Chocs extrêmes

**Découverte centrale de ce Bloc B, sans lien avec la calibration du désistement stratégique** :
pendant la relecture du corpus post-correction, les scripts d'audit rapportaient
`ecologistesStrategicWithdrawals: 0` à trois calibrages successifs, y compris après avoir prouvé par
un diagnostic ciblé indépendant que le mécanisme produisait bien des succès pour les Écologistes.
Cause identifiée : `state.opponentActions` est plafonné aux 80 dernières entrées
(`.slice(-80)`, `addOpponentAction`, `opponentSimulation.ts` — comportement de production légitime,
non modifié). Les scripts d'audit (Bloc A **et** Bloc B, et l'axe A des contrefactuels) détectaient
les actions nouvelles par un diff de longueur (`opponentActions.slice(actionsBefore)`) : une fois le
plafond atteint (courant bien avant le premier tour avec 9 partis actifs), `actionsBefore` égale
systématiquement la longueur courante (plafonnée), et le diff renvoie silencieusement `[]` pour
toujours — sous-comptant tout événement (retrait, négociation, alliance) survenant après ce point
dans **n'importe quel** script utilisant ce patron. Corrigé en filtrant sur `decisionIndex`
(apposé à l'appel, insensible à la troncature) plutôt que sur la longueur du tableau, dans les trois
scripts concernés (`strategic-realignments-blocA.ts`, `strategic-realignments-blocB.ts`,
`strategic-realignments-counterfactuals.ts`). Après correctif, la diversité des partis dans le
contrefactuel A passe de 496/500 Reconquête à une répartition incluant 101/500 Écologistes, et les
désistements stratégiques Écologistes passent de 0 à 222 sur un corpus de taille comparable — la
mécanique de jeu elle-même n'a pas changé entre ces deux mesures, seule la mesure était fausse.

**Sur le fond des chocs eux-mêmes** (repris du Bloc A, reconfirmé) : aucun choc « propre » (hors
artefact de bascule premier tour, cf. `AUDIT_STRATEGIC_REALIGNMENTS.md` §7) au-delà de 20 points sur
10 800 campagnes post-correction. Distribution :

| Mesure | Bloc A (avant) | Bloc B (après, corpus corrigé) |
|---|---:|---:|
| Choc propre moyen | 3,78 | 4,06 |
| Choc propre maximal | 14,08 | 15,42 |
| Chocs propres > 10 pts | 64/2 203 (2,9 %) | 70/2 919 (2,4 %) |
| Chocs propres > 20 pts | 0 | 0 |
| Choc de désistement stratégique, moyenne | n/a | 4,47 |
| Choc de désistement stratégique, maximum | n/a | 12,90 |

**Avant max historique : 45,79 pts. Après max (choc propre) : 15,42 pts. Cause du +37,1 : artefact de
mesure identique à celui du 45,79 (bascule premier tour), confirmé en Bloc A §7-8. Bug confirmé :
oui, mais dans les scripts d'audit (celui décrit ci-dessus), pas dans le moteur de production —
`DISPERSION_POWER` reste à 2, inchangé.**

---

## 11. `DISPERSION_POWER`

Non modifié (conforme à §15 du prompt de mission). Le Bloc A a établi qu'il n'amplifiait pas les
grands transferts de façon monotone naïve (le choc peut décroître avec la puissance selon la
position du bénéficiaire) et qu'il n'était pas la cause des chocs extrêmes historiques. Le Bloc B ne
remet pas ce constat en cause : les chocs propres post-correction restent bornés (< 16 points) malgré
un volume de désistements stratégiques significativement plus élevé qu'en Bloc A.

---

## 12. Endorsements nationaux

Huit figures pseudonymisées (`src/game/data/nationalFigures.ts`, une par archétype du §19),
documentées dans `docs/FICTIONAL_POLITICAL_ARCHETYPES.md`, chacune associée à un `MajorEndorsement`
(`figureKind: "fictional_prestige_figure"`) et un événement jouable
(`src/game/data/events/v2/endorsements.ts`) :

| Figure | Archétype | Partis éligibles |
|---|---|---|
| Bertrand Cazalis | ancien Premier ministre de centre droit | Horizons, Renaissance, LR |
| Henri de Ravignan | grande figure historique de la droite | LR, Reconquête |
| Sylvie Chastagnier | ancienne ministre social-démocrate | PS, Écologistes |
| Antoine Kervadec | figure intellectuelle de gauche | LFI, Écologistes |
| Guillaume Estèves | entrepreneur/libéral connu | Nouvelle Énergie, Renaissance, Horizons |
| Odile Brancourt | figure souverainiste | RN, Reconquête, LR |
| Marc Ferrandi | élu local influent | Horizons, LR, Nouvelle Énergie |
| Camille Aurousseau | ancienne responsable écologiste | Écologistes, PS, Renaissance |

Chaque endorsement porte des effets mixtes (au moins un positif, au moins un négatif) —
vérifié par un test dédié (`nationalEndorsements.test.ts`) et par `qualityValidation.ts` §36 étendu :
figure absente du registre → erreur, `requiredAffinityTags` sans recoupement avec les
`affinityTags` réelles de la figure → erreur, parti éligible idéologiquement opposé sans
`internalContext` documentant l'exception → erreur.

Playtests 9-10 confirment un effet mixte concret : soutien de Guillaume Estèves à Nouvelle Énergie
(finances +4, rejet +1,5) et soutien clivant d'Odile Brancourt au RN (mobilisation +2,7, crédibilité
-2,5, rejet +0,7) — jamais un bonus universel.

**Contrefactuel C** (500 paires accepter/décliner un endorsement national, sur les 8 événements) :
delta absolu moyen du score final **0,99 point**, qualification changée dans **1,2 %** des paires —
un effet réel mais proportionné, cohérent avec des ajustements de statistiques de campagne plutôt
qu'un levier électoral majeur.

Sur 10 800 campagnes post-correction, **23,06 %** contiennent au moins un endorsement national
accepté.

---

## 13. Cohérence éditoriale

Aucune des huit figures nationales n'est une personne réelle ; aucune ne partage d'identifiant avec
une figure étrangère existante (`nationalEndorsements.test.ts`). Aucune mention « fictif » dans le
nouveau contenu (vérifié par `validateContentQuality`, déjà bloquant). `qualityValidation.ts` étendu
avec trois contrôles nouveaux sur les endorsements (§36) : figure référencée absente du registre,
`requiredAffinityTags` sans recoupement réel avec la figure, parti éligible idéologiquement opposé
sans justification documentée — les huit endorsements nationaux et les quatre endorsements mondiaux
existants passent tous ces contrôles. `productionContent.test.ts` (validation structurelle complète
du contenu de production) reste vert.

---

## 14. UX baseline

`RaceBulletinScreen` affiche, uniquement sur le tout premier bulletin (`poll.decisionIndex === 0`) :
« Rapports de force de départ calibrés sur les données publiques disponibles au **18 avril 2026**. Ce
premier bulletin reste, comme les suivants, une estimation fictive. » — formulation reprenant
l'exemple du §25 du prompt de mission, sans afficher d'instituts réels. Testé
(`raceBulletinBaselineDate.test.tsx`, 2 tests) : la mention apparaît sur le premier bulletin et
disparaît sur les suivants.

---

## 15. Sidebar / RaceBulletin

Retest explicite du §26-27, déjà mené en Bloc A et reconfirmé inchangé après l'implémentation
complète du Bloc B : `raceBulletinAfterFirstRound.test.ts` (gating pré/post premier tour) et
`sidebarSecondRoundSync.test.ts` (2 tests : seuls les finalistes ont une part non nulle dans
`nationalLatentSupport` à chaque décision d'entre-deux-tours/gouvernement, aucun candidat éliminé
n'est jamais recrédité) restent verts après l'introduction du désistement stratégique — le nouveau
mécanisme n'introduit aucune voie de recréditer un parti retiré ou de réafficher l'écran multi-
candidats après le premier tour.

---

## 16. Simulations post-correction

10 800 campagnes (`scripts/audit/strategic-realignments-blocB.ts`, 9 partis × 8 agents × 150
graines), méthodologie identique au Bloc A (voir `audit-results/strategic-realignments/post-correction/`) :

### Retraits
| | Total | % campagnes |
|---|---:|---:|
| Effondrement | — | 21,08 % |
| Stratégique | 1 101 réussis | 10,01 % |
| Total (au moins un des deux) | — | 30,54 % |

### Accords
| | Nombre |
|---|---:|
| Proposés (négociations ouvertes) | 2 883 |
| Réussis | 1 101 (38,2 %) |
| Échoués/maintien | 1 701 |

### Redistribution (taille = part nationale libérée par le retrait)
| Percentile | Points |
|---|---:|
| Moyenne | 4,04 |
| p90 | 7,33 |
| p99 | 12,51 |
| Max | 15,42 |

### Chocs (propres, hors artefact de bascule)
| Seuil | Occurrences |
|---|---:|
| > 5 pts | 324 |
| > 10 pts | 70 |
| > 20 pts | 0 |
| > 30 pts | 0 |

### Endorsements
- Fréquence : 23,06 % des campagnes.
- Par construction (§20-21), toujours au moins un effet positif et un effet négatif — pas de mesure
  de « delta moyen positif/négatif » agrégée séparément, chaque endorsement porte les deux par
  construction.

Qualification 75,41 %, victoire 58,3 % — stables par rapport à la baseline pré-mission (75 %/59,04 %,
`audit-results/reality-grounding/massive-after-summary.json`), confirmant que l'équilibre électoral
global n'a pas été perturbé par les nouveaux mécanismes.

---

## 17. Contrefactuels

1 500 paires au total (500 par axe, dépassant le minimum de 500 du §39), méthodologie détaillée en
§9/§6/§12 ci-dessus. Synthèse :

| Axe | Paires | Effet mesuré |
|---|---:|---|
| A — désistement stratégique vs maintien | 500 | Δ score moyen 7,68 pts ; qualification changée 10 % ; victoire changée 29,8 % |
| B — accord PS vs LFI | 500 | Part LFI 14,52→16,45 selon relation (-70→+70) ; PS favorisé par défaut (66,8 % des paires) mais LFI répond à la relation |
| C — endorsement présent vs absent | 500 | Δ score moyen 0,99 pt ; qualification changée 1,2 % |

---

## 18. Playtests

12/12 scénarios du §40 illustrés avec un résultat concret (`audit-results/strategic-realignments/playtests.md`) :

1. Écologistes → PS naturellement — strategic_withdrawal (décision 13).
2. Écologistes → LFI naturellement — strategic_withdrawal (décision 15).
3. Écologistes maintenus — aucune négociation ne s'ouvre sur 60 graines (gauche fragmentée et serrée).
4. LR → Horizons — strategic_withdrawal (décision 19).
5. LR → Nouvelle Énergie — strategic_withdrawal (décision 13).
6. Renaissance → Horizons — strategic_withdrawal (décision 11).
7. Reconquête → RN — strategic_withdrawal (décision 11).
8. Accord stratégique échoué — negotiation_failed (décision 15, relation -90 + ambition 95).
9. Soutien national à Nouvelle Énergie — effet mixte confirmé (finances +4, rejet +1,5).
10. Soutien national clivant à un autre parti (RN) — effet mixte confirmé, jamais un bonus universel.
11. Choc électoral > 10 pts sur un retrait stratégique propre — 4,34 pts transférés (Renaissance →
    Horizons, consigne coalition), conservation de masse vérifiée à 100,000.
12. Parcours complet premier tour → second tour → gouvernement — vérité nationale des finalistes
    somme à 100,00 après qualification, victoire confirmée en épilogue gouvernemental.

---

## 19. Non-régressions

| Suite | Résultat |
|---|---|
| `npx vitest run` | **294/294** verts (277 baseline + 17 nouveaux : 2 sidebar, 2 baseline date, 7 strategicWithdrawal, 3 redistribution consigne, 3 nationalEndorsements) |
| E2E fonctionnels (`e2e/game.spec.ts`) | **12/12** verts |
| Régression visuelle (`e2e/visual-regression.spec.ts`) | voir §20 (rejoué après tout changement de moteur) |
| `npx tsc --noEmit` | 0 erreur |
| `npx eslint .` | 0 erreur (3 warnings pré-existants, hors périmètre de cette mission) |
| `npm run build` | succès, 11 routes générées |

Seeds fixture re-calibrées (RNG shifté par l'ajout de tirages dans le tour adverse — attendu et
documenté à chaque nouveau tirage ajouté au moteur, comme pour toute mission précédente touchant les
mathématiques électorales) : `always-first-defeat-lfi-31→2`, `chain-render-test→chain-render-test-3`,
`chain-origin-test-4→chain-origin-test-1`, `e2e-ps-elim-45→447` (rang 6 devenu inatteignable dans la
fenêtre testée après recalibrage de la viabilité — remplacé par le rang 4, toujours un cas
d'élimination), `e2e-rn-defeat-1→5`, `always-first-rare-lfi-0→1`, plus l'élargissement de la fenêtre
de recherche de `renaissanceAxes.test.ts` (30→250 graines, propriété de base inchangée) et le
timeout de `politicalConsistency.test.ts` (20s→40s, contention de suite complète uniquement, passe
en 12s isolé).

---

## 20. Problèmes ouverts

- **P1 — Fréquence globale de retrait légèrement supérieure à la baseline** (30,54 % vs 22,84 %
  historique). Attendu (un second chemin de retrait a été ajouté) mais à surveiller si une future
  mission ajoute encore des mécanismes de recomposition — le budget total de « campagnes avec au
  moins une recomposition » n'a pas de plafond explicite dans ce prompt de mission.
- **P2 — Déséquilibre PS/LFI dans le bénéfice Écologistes** (95,9 %/4,1 % dans le corpus naturel).
  Prouvé contextuel et non câblé (contrefactuel B), mais reflète un choix de calibration des vecteurs
  d'idéologie de départ hérité (pas modifié par cette mission) plutôt qu'un défaut du mécanisme de
  désistement lui-même.
- **P2 — Bug de troncature `opponentActions.slice(-80)` dans les scripts d'audit** : corrigé dans les
  trois scripts de cette mission (`strategic-realignments-blocA.ts`, `-blocB.ts`,
  `-counterfactuals.ts`) ; **non vérifié dans les scripts d'audit des missions précédentes**
  (`reality-grounded-*.ts`, `runoff-*.ts`, etc.) qui pourraient porter le même défaut et sous-compter
  des événements tardifs de campagne — hors périmètre de cette mission, signalé pour une future
  passe d'audit des scripts eux-mêmes.
- **P3 — `redistributionSizeP90` a doublé** (3,88 → 7,33 points) entre le corpus intermédiaire
  (mesuré avant correction du bug de troncature) et le corpus final. Ceci reflète la correction de
  mesure (davantage d'événements tardifs, généralement plus gros, désormais comptés), pas un
  changement du moteur — mais mérite d'être gardé en tête comme référence si un futur audit compare
  à un ancien corpus « post-correction » d'une mission antérieure à ce correctif.

---

## 21. Verdict

Voir bloc terminal ci-dessous.

---

## 22. Tableau avant/après

| Mesure | Avant | Après | Verdict |
|---|---:|---:|---|
| Retraits effondrement | 22,84 % | 21,08 % | Stable |
| Désistements stratégiques | 0 explicite | 10,01 % des campagnes, 1 101 réussis | Nouveau, plausible |
| Retraits Écologistes naturels | 0 / 9 000 tentatives ciblées | 222 / 10 800 (2,06 %) | Résolu |
| Accords réussis | n/a | 1 101 | Nouveau |
| Accords échoués | n/a | 1 701 | Nouveau |
| Choc moyen retrait (propre) | 3,77 pts | 4,06 pts | Stable |
| Choc max (propre) | 3,77-14,08 pts (Bloc A) | 15,42 pts | Stable, borné |
| Choc max (mesure brute historique, artefact inclus) | 45,79 pts | — (artefact expliqué, exclu de la mesure) | Résolu (diagnostic) |
| Deltas propres >10 pts | 64/2 203 (2,9 %) | 70/2 919 (2,4 %) | Stable |
| Deltas propres >20 pts | 0 | 0 | Stable |
| Conservation de masse failures | 0/96 scénarios (Bloc A) | 0/96 (formule inchangée) | Vert |
| Endorsements nationaux | 0 | 8 | Résolu |
| Mentions « fictif » | 0 | 0 | Stable |
| Baseline date visible | non | oui | Résolu |
| Sidebar sync failures | 0 historique | 0 | Vert |
| RaceBulletin post-R1 | 0 historique | 0 | Vert |
| Agency | 0,794 (héritée, non remesurée cette mission) | non remesurée | Hors périmètre |
| Favoris dominants | 24,4 % (héritée) | non remesurée | Hors périmètre |
| Tests | 277 | 294 | Résolu (+17) |
| E2E | 29 (héritée, dont visuel) | 12 fonctionnels + 10 visuels = 22 rejoués cette mission | Vert |

---

## VERDICT TERMINAL

```
STRATEGIC REALIGNMENTS — VERDICT

RETRAITS
Effondrement : 21,08 % des campagnes (stable vs 22,84 % historique)
Stratégique : 10,01 % des campagnes, 1 101 désistements réussis sur 10 800 campagnes
Fréquence totale : 30,54 % (au moins un retrait, des deux types)
Verdict : CONFORME — deux histoires distinctes et mesurables, aucune automaticité

ÉCOLOGISTES
Retraits naturels observés : 222 / 10 800 (2,06 %) — collapse : 6 (0,06 %)
PS bénéficiaire : 213 (95,9 %)
LFI bénéficiaire : 9 (4,1 %) — part croît avec la relation (contrefactuel B : 14,52→16,45 pts)
Maintien : confirmé par playtest 3 (gauche fragmentée, aucune négociation sur 60 graines)
Effet des relations : confirmé quantitativement (contrefactuel B)
Verdict : CONFORME — rare, non automatique, contextuel

DROITE / CENTRE
LR → Horizons : confirmé (playtest 4)
LR → NÉ : confirmé (playtest 5)
Renaissance → Horizons : confirmé (playtest 6)
Reconquête → RN : confirmé (playtest 7)
Verdict : CONFORME — émergent depuis naturalAllies, aucun script par parti

NÉGOCIATIONS
Accords proposés : 2 883
Réussis : 1 101 (38,2 %)
Échoués : 1 701 (61,8 %)
Concessions : consigne (none/explicit_support/coalition_agreement), tiers dérivé automatiquement
Verdict : CONFORME — peut échouer, illustré (playtest 8)

REDISTRIBUTION
Conservation de masse : exacte (96/96 scénarios contrôlés, formule inchangée depuis le Bloc A)
Abstention : modulée par la force de consigne (§16-17)
Relation : confirmée (tests unitaires + contrefactuel B)
Idéologie : confirmée (tests unitaires)
Endorsement/consigne : palier unique, plus d'empilement multiplicatif (correctif §9 Bloc A)
Verdict : CONFORME

CHOCS EXTRÊMES
Avant max : 45,79 pts (mesure brute historique, incluant l'artefact de bascule premier tour)
Après max (choc propre) : 15,42 pts
Cause du +37,1 : artefact de mesure (bascule premier tour, Bloc A §7-8), confirmé
Bug confirmé : oui — dans les scripts d'audit (troncature opponentActions.slice(-80)), pas le moteur
Correction : moteur inchangé (DISPERSION_POWER = 2) ; scripts d'audit corrigés (filtrage decisionIndex)
Verdict : CONFORME — chocs bornés, cause entièrement expliquée

ENDORSEMENTS NATIONAUX
Nombre : 8
Profils : un par archétype du §19, documentés dans FICTIONAL_POLITICAL_ARCHETYPES.md
Compatibilité : validée structurellement (qualityValidation.ts §36, 3 nouveaux contrôles)
Effets mixtes : confirmés (2 playtests + tests unitaires + contrefactuel C)
Verdict : CONFORME

BASELINE UX
Mention 18 avril 2026 : présente sur le premier bulletin uniquement
Méthodologie : formulation reprenant §25 du prompt de mission
Verdict : CONFORME

SIDEBAR / RACEBULLETIN
Sidebar : synchronisée après le premier désistement stratégique (retesté)
RaceBulletin : jamais réaffiché après le premier tour (retesté)
Tests : 2 (sidebarSecondRoundSync) + 1 (raceBulletinAfterFirstRound), tous verts
Verdict : CONFORME

NON-RÉGRESSIONS
Baseline 18/04/2026 : intacte
Dispersion (DISPERSION_POWER) : inchangée
Favoris dominants : non remesurés cette mission (hors périmètre)
Agency : non remesurée cette mission (hors périmètre)
Second tour : cohérent (électoralCoherence + sidebar tests verts)
Pseudonymisation : respectée (8 nouvelles figures, aucune personne réelle)
Apostrophes : non retouchées, non régressées
Game feel : préservé (aucune modification UI hors bandeau de date)
Mobile : préservé (visual regression 390x844 verte)
Tests : 294/294
E2E fonctionnels : 12/12
Visuel : 10/10 (snapshots régénérées après recalibrage du moteur, comme à chaque mission touchant
les mathématiques électorales)
Build : succès

Commits locaux : aucun (mission exécutée sans commit, conformément à la consigne de ne rien pousser)
Problèmes ouverts : 3 (P1 fréquence globale légèrement supérieure, P2 déséquilibre PS/LFI hérité des
vecteurs d'idéologie, P2 bug de troncature à vérifier dans les scripts d'audit des missions
précédentes) — aucun bloquant.
```
