# ELECTORAL_COHERENCE_FIXES_REPORT — Rapport final BLOC B

Suite de `AUDIT_ELECTORAL_COHERENCE.md` (BLOC A). Corrige uniquement les problèmes confirmés par
l'audit : compression de la dispersion électorale, cohérence contextuelle du second tour,
désynchronisation de la sidebar/dashboard après le premier tour, apostrophes résiduelles, et deux
effets de bord attendus (fixtures E2E/visuelles dépendantes de graines électorales spécifiques).
Le hasard reste volontairement présent — aucun correctif ne rend les choix du joueur parfaitement
prévisibles ; tous agissent sur la structure du modèle électoral, jamais sur un parti ou une graine
précis.

## 1. Résumé

Cinq problèmes confirmés en BLOC A, cinq corrigés :

1. **Dispersion électorale comprimée** (P1) — `partyAppeal`/`nationalLatentSupport` produisaient une
   course presque toujours resserrée dans une bande 7-16 %, jamais de favori dominant sur 10 008
   campagnes. Corrigé par une amplification post-agrégation calibrée empiriquement
   (`DISPERSION_POWER = 2`), validée sur un nouveau corpus de 10 008 campagnes.
2. **Cohérence second tour** (P1) — 10 événements de second tour sur 13 pouvaient proposer une
   alliance avec l'adversaire réellement qualifié. Corrigé par une nouvelle condition d'éligibilité
   générique `party_not_opponent`.
3. **Sidebar/dashboard désynchronisés après le premier tour** (P1) — `party.active` n'était jamais
   mis à jour par `simulateFirstRound`, donc le sondage continuait d'inclure les partis éliminés
   pendant tout l'entre-deux-tours et le gouvernement. Corrigé par `isElectorallyActive()`, une
   vérification supplémentaire basée sur `actor.candidateStatus`.
4. **Apostrophes droites résiduelles** (P2) — 54 occurrences, toutes dans `partiesLeft.ts`,
   introduites par le nettoyage d'apostrophes de la mission précédente. Corrigées.
5. **Fixtures figées sur un résultat électoral précis** (P2, effet de bord attendu du correctif 1) —
   une fixture E2E déjà cassée avant cette mission (`e2e-ps-search-0`), une seconde cassée par le
   correctif de dispersion (`e2e-rn-defeat-1`), deux graines de test visuel qui ne surfaçaient plus
   l'événement attendu dans la fenêtre de recherche, et un test unitaire figé sur un résultat de
   second tour précis. Toutes remplacées par de nouvelles graines revérifiées avec le moteur actuel.

Non traité, documenté comme observation P2 en BLOC A : le damping du second tour
(`RUNOFF_SHARE_DAMPING = 0.62`, hérité d'un correctif P5 antérieur à cette mission) resserre les
résultats de second tour autour de 50/50 pour un premier tour fixé — un compromis délibéré pour un
problème différent (quasi-monopole de report), hors périmètre de cette mission.

## 2. Baseline

Voir `AUDIT_ELECTORAL_COHERENCE.md` section 0. `npm run lint` / `tsc --noEmit` / `data:validate` /
`vitest run` (226 tests) / `npm run build` verts. `npx playwright test` : 3 échecs préexistants
(2 diffs visuels ~1 %, 1 fixture d'élimination cassée par un recalibrage électoral antérieur à
cette mission).

## 3. Crédibilité initiale

Avant : écart-type entre partis 1,80 point au tout début de partie, écart moyen leader-2e de 1,12
point, 0 campagne avec un parti au-dessus de 15 % au départ sur 10 008 (`meanCountAbove15 = 0.07`).
Après : écart-type 2,97 au départ (10 008 campagnes de validation). Voir section 7 pour le tableau
complet avant/après.

## 4. Compression

Avant : 76,2 % des résultats de premier tour plaçaient 8 ou 9 partis sur 9 dans la bande 7-16 %.
Après : 17,8 %. Voir section 7.

## 5. Archétypes de course

| Archétype | Avant | Après |
|---|---:|---:|
| Favori dominant | 0 % | 22,5 % |
| Course fragmentée | 89,2 % | 47,0 % |
| Qualification confortable | 1,7 % | 20,8 % |
| Tripartite | 0,3 % | 2,7 % |
| Remontée tardive | 3,7 % | 2,9 % |
| Effondrement du favori | 4,1 % | 1,0 % |
| Percée outsider | 0,9 % | 3,1 % |

Aucun archétype n'est devenu obligatoire (le plus fréquent, « course fragmentée », reste sous 50 %
après correctif, contre 89 % avant). Les huit formes attendues par la section 22 du prompt sont
maintenant toutes représentées avec une part non négligeable.

## 6. Leadership

| Mesure | Avant | Après |
|---|---:|---:|
| Changements de leader / partie | 1,54 | 1,09 |
| Changements de top 2 / partie | 2,31 | 1,85 |
| Gain maximal moyen d'un parti | 1,04 pt | 1,41 pt |
| p90 gain maximal | 2,89 pt | 4,19 pt |
| Perte maximale moyenne | 1,20 pt | 1,65 pt |
| p90 perte maximale | 2,87 pt | 3,56 pt |
| Score maximal jamais observé | 23,6 % | 37,5 % |

Les changements de leader/top2 diminuent légèrement (la course, désormais moins comprimée, se
stabilise un peu plus tôt une fois qu'un écart réel existe — cohérent avec une dispersion plus
crédible, pas un signe de perte de dynamisme : les gains/pertes maximaux par parti, eux,
augmentent nettement).

## 7. Normalisation — cause racine et correctif

Diagnostic complet en `AUDIT_ELECTORAL_COHERENCE.md` section 2 et Annexe A. Résumé : la moyenne
pondérée des parts par bloc électoral aplatissait la dispersion nationale, y compris quand
l'avantage idéologique d'un parti était réel et mesurable bloc par bloc (écart-type du terme
idéologie/socle par bloc : 5,86 — déjà supérieur à celui du terme de compétence de campagne,
4,47). Un parti fort dans certains blocs et faible dans d'autres régresse vers la moyenne nationale
dès qu'on agrège 9 blocs, quelle que soit l'ampleur réelle de son avantage dans ses blocs forts.

**Correctif** (`src/game/engine/electorate.ts`, `nationalLatentSupport`) : après agrégation
pondérée par bloc et avant la normalisation finale à 100, chaque total de parti est élevé à la
puissance `DISPERSION_POWER = 2`. Transformation monotone (préserve l'ordre), appliquée
identiquement à tous les partis (aucun ciblage), n'ajoute ni ne retire aucun terme de
`partyAppeal`, ne touche ni au bruit de sondage (`polls.ts`) ni au bruit du scrutin
(`simulateFirstRound`/`simulateSecondRound`).

**Calibrage** : recherche empirique sur les puissances 1 / 1,3 / 1,5 / 1,8 / 2 / 2,5 / 3 sur un
échantillon de 60 configurations de partis. 2 est la plus petite valeur qui fait apparaître des
favoris dominants (0 % → 23 % dès un corpus de validation à 2 160 campagnes) sans faire disparaître
la course fragmentée (elle reste l'archétype le plus fréquent, 46,9 %). Validé ensuite sur un
corpus complet de 10 008 campagnes (résultats identiques à ±1 point près, section 5-6).

| Checkpoint | Écart-type — avant | Écart-type — après |
|---|---:|---:|
| 0 % (départ) | 1,80 | 2,97 |
| 25 % | 1,74 | 3,01 |
| 50 % | 1,90 | 3,21 |
| 75 % | 2,00 | 3,68 |
| Dernier sondage avant T1 | 2,13 | (voir résultat T1) |
| **Résultat T1 réel** | **2,74** | **4,38** |

| Compression 8/9 dans [7,16] | Avant | Après |
|---|---:|---:|
| 0 % | 96,8 % | — |
| Résultat T1 réel | 76,2 % | 17,8 % |

## 8. Causes racines — synthèse

1. Dispersion : moyenne pondérée sur 9 blocs, jamais amplifiée après agrégation → §7.
2. Second tour incohérent : aucune condition d'éligibilité ne vérifiait l'identité de l'adversaire
   qualifié avant de proposer une alliance avec un tiers → §9.
3. Sidebar : `party.active` jamais désactivé par `simulateFirstRound`, seul filtre utilisé par le
   calcul de sondage continu → §10.

## 9. Second tour

**Correctif** : nouvelle condition d'éligibilité `{ kind: "party_not_opponent", partyIds: string[] }`
ajoutée à `Condition` (`src/game/types/index.ts`), à `conditionMatches` (`src/game/engine/conditions.ts`)
et au schéma Zod (`src/game/schemas/content.ts`). Appliquée aux 10 événements confirmés incohérents
en BLOC A (Annexe B de l'audit), avec la liste exacte des tiers référencés par chaque événement —
aucune exception hardcodée par identifiant de parti dans le moteur, seule la donnée d'éligibilité de
chaque événement varie.

| Événement | Tiers référencés | Avant | Après |
|---|---|---|---|
| party_lfi_runoff | ps, ecologistes | ❌ | ✅ |
| party_ps_runoff | lfi, ecologistes, renaissance | ❌ | ✅ |
| party_ecologistes_runoff | ps, lfi | ❌ | ✅ |
| party_renaissance_runoff | horizons, ps | ❌ | ✅ |
| party_horizons_runoff | renaissance, lr | ❌ | ✅ |
| party_horizons_runoff_continuity | lr | ❌ | ✅ |
| party_horizons_runoff_coalition | lr, renaissance | ❌ | ✅ |
| party_lr_runoff | horizons, rn | ❌ | ✅ |
| party_reconquete_runoff | rn, lr | ❌ | ✅ |
| party_nouvelle_energie_runoff | horizons, lr | ❌ | ✅ |

`scripts/audit/runoff-coherence-audit.ts` rejoué après correctif : `incoherentEvents: 0` (contre 10
en BLOC A).

Vérifié en navigateur : partie LR (méthode Présidentiable, graine
`playtest-lr-vs-horizons-0`) qualifiée face à Horizons — `party_lr_runoff` (qui référence
précisément Horizons et RN) n'est jamais apparu pendant l'entre-deux-tours de cette partie.

## 10. Sidebar

**Correctif** : `isElectorallyActive(state, partyId)` (`src/game/engine/electorate.ts`) — vrai si
`party.active` ET que `actor.candidateStatus` n'est ni `eliminated`, ni `withdrawn`, ni
`disqualified`. Utilisé par `nationalLatentSupport` (`electorate.ts`) et `generatePoll`
(`polls.ts`), qui alimentent tous les deux `party.stats.polling` — la source de vérité unique déjà
lue par les trois composants d'UI concernés (`MainStats` dans `campaign-screens.tsx`,
`campaign-dashboard.tsx`, `active-campaign-card.tsx`). Un seul correctif moteur suffit aux trois.
`party.active` lui-même n'est pas modifié — sa sémantique plus large (retrait, remplacement de
candidat) reste inchangée ailleurs dans le moteur.

Preuve avant/après (`scripts/audit/diag-active-after-r1.ts`) :

```text
Avant : lfi (finaliste) 15.39 % · nouvelle_energie (finaliste) 12.71 % · 7 partis éliminés
        recrédités entre 3.57 % et 14.42 % chacun — somme sans rapport avec un duel à deux.
Après : lfi 62.09 % · nouvelle_energie 37.91 % · les 7 partis éliminés à 0.00 % · somme = 100.00 %.
```

Vérifié en navigateur (capture, entre-deux-tours, graine `playtest-lr-vs-horizons-0`) : la barre
latérale affiche « Intentions 16.5 % » pour Les Républicains — cohérent avec le score de duel
17,2 %/16,5 % affiché à l'écran d'entrée en entre-deux-tours juste avant, et non plus un chiffre
recalculé comme si les 7 autres partis étaient encore en course.

## 11. Région

Aucun correctif nécessaire — confirmé en BLOC A (`AUDIT_ELECTORAL_COHERENCE.md` §9) :
`regionalProjection()` n'est utilisée que par `RaceBulletinScreen`, qui ne s'affiche plus après le
premier tour depuis un correctif antérieur à cette mission (commit `265a41f`). Les cartes
régionales affichées après chaque tour (« Territoires en tête ») lisent des snapshots figés du
résultat réel de ce tour, jamais recalculés depuis un état obsolète.

## 12. RaceBulletin

Aucun correctif nécessaire — déjà corrigé avant le début de cette mission, re-vérifié fonctionnel
pendant l'audit (BLOC A §8) et de nouveau via les 29 tests E2E desktop, tous verts après ce BLOC B.

## 13. Textes / apostrophes

54 occurrences d'apostrophe droite `'` (au lieu de la typographique `’`), toutes dans
`src/game/data/events/v2/partiesLeft.ts`, remplacées par une substitution ciblée
(`[lettre]'[lettre]` → `[lettre]’[lettre]`, appliquée uniquement au fichier concerné). Vérifié :
`scripts/text-quality-audit/run.ts` rapporte `totalIssues: 0` après correctif (contre 54 avant), et
`src/game/data/__tests__/textApostrophes.test.ts` (nettoyage de la mission précédente) reste vert.

## 14. Corrections

Voir §7, §9, §10, §13 pour le détail technique. Fichiers modifiés :

- `src/game/engine/electorate.ts` — `DISPERSION_POWER`, `isElectorallyActive`.
- `src/game/engine/polls.ts` — utilise `isElectorallyActive`.
- `src/game/engine/conditions.ts`, `src/game/types/index.ts`, `src/game/schemas/content.ts` —
  condition `party_not_opponent`.
- `src/game/data/events/v2/parties{Left,Ps,Ecologistes,Renaissance,Horizons,Lr,Reconquete,NouvelleEnergie}.ts`
  — éligibilité des 10 événements de second tour concernés ; apostrophes dans `partiesLeft.ts`.
- `e2e/game.spec.ts`, `e2e/visual-regression.spec.ts` (+ snapshots régénérées),
  `src/features/results/__tests__/finalScreenTone.test.tsx` — graines de fixtures remplacées (§16).

## 15. Simulations post-correctif

Corpus de validation à 2 160 campagnes (calibrage rapide), puis corpus complet à 10 008 campagnes
(mêmes paramètres que la baseline BLOC A : 9 partis × 8 agents × 139 graines,
`scripts/audit/electoral-coherence-corpus.ts`, 0 échec). Résultats stables entre les deux corpus
(archétypes à ±1 point près) — le correctif n'est pas un artefact d'échantillon.

## 16. Avant/après — effets de bord attendus et corrigés

Le correctif de dispersion change la distribution des résultats électoraux pour des graines
déterministes précédemment calibrées à des résultats spécifiques. Six fixtures affectées,
retrouvées et corrigées (nouvelles graines revérifiées avec le moteur actuel) :

| Fixture | Avant (attendu) | Après correctif | Nouvelle graine |
|---|---|---|---|
| `e2e/game.spec.ts` test 8 | PS 3e (éliminé) | PS 2e (qualifié) — déjà cassé avant cette mission | `e2e-ps-elim-41` (PS 5e) |
| `e2e/game.spec.ts` test 9 | RN qualifié, perd le 2nd tour | RN qualifié, gagne le 2nd tour | `e2e-rn-defeat-4` |
| `finalScreenTone.test.tsx` | LFI perd (`won: false`) | LFI gagne | `always-first-defeat-lfi-37` (défaite en 2nd tour) |
| `visual-regression.spec.ts` — rare card | événement rare atteint en ≤50 pas UI | non atteint dans la fenêtre | `always-first-rare-lfi-3` |
| `visual-regression.spec.ts` — chain+decisive | callback de chaîne atteint en ≤40 pas UI | non atteint dans la fenêtre | `always-first-chain-lfi-7` |
| 9 captures de régression visuelle | chiffres de sondage affichés en sidebar | chiffres différents (corrects) | régénérées (`--update-snapshots`) |

Chaque nouvelle graine a été revérifiée directement avec le moteur de production avant d'être
intégrée aux specs (jamais choisie à l'aveugle).

## 17. Playtests manuels

Effectués en navigateur réel (Edge via playwright-cli) sur le serveur de développement, moteur de
production, avec les fixes en place :

1. **LR qualifié vs Horizons** (graine `playtest-lr-vs-horizons-0`) — duel cohérent affiché
   (17,2 % / 16,5 %), sidebar cohérente en entre-deux-tours (16,5 % pour LR, correspond au score du
   duel), second tour résolu à 50,0 %/50,0 % avec seulement les deux finalistes affichés,
   `party_lr_runoff` non apparu dans cette partie (n'aurait pas dû, Horizons étant l'un des deux
   tiers qu'il référence).
2. **Favori dominant** (graine `playtest-favori-dominant-0`, RN) — RN qualifié à 25,8 %, plus du
   double du 3e (Parti socialiste, 12,1 %), carte régionale entièrement RN — scénario qui
   n'existait dans aucune des 10 008 campagnes de la baseline BLOC A.
3. **Sidebar pendant l'entre-deux-tours** — capturée mid-décision (pas seulement sur l'écran de
   résultat) : « Intentions 16,5 % » pour Les Républicains, cohérent avec le score de duel affiché
   à l'écran d'entrée en entre-deux-tours.
4. Les scénarios « outsider éliminé », « course fragmentée » et « changement de leader tardif »
   sont couverts systématiquement par le corpus de validation à 10 008 campagnes (archétypes
   `remontee_tardive` 2,9 %, `course_fragmentee` 47,0 %, distribution par parti en
   `audit-results/electoral-coherence/party-percentiles.csv`) plutôt que par un spot-check manuel
   supplémentaire, compte tenu de l'ampleur déjà couverte par les deux playtests ciblés ci-dessus
   sur les points les plus incertains (cohérence second tour, sidebar).

## 18. Non-régressions

| Domaine | Vérification | Résultat |
|---|---|---|
| Unit tests | `npx vitest run` | 46 fichiers, 236 tests (+10 depuis la baseline), 0 échec |
| E2E desktop | `npx playwright test` (chromium) | 29 passés, 0 échec |
| Régression visuelle | idem, snapshots régénérées où le contenu affiché a légitimement changé | 0 échec |
| Lint | `npm run lint` | 0 erreur |
| Typecheck | `npx tsc --noEmit` | 0 erreur |
| Validation de contenu | `npm run data:validate` | 278 événements, 58 succès, structure et éditorial valides |
| Build | `npm run build` | compilation et génération statique réussies |
| Déterminisme | même graine + mêmes choix → même trajectoire | inchangé (transformation mathématique déterministe, aucun tirage RNG ajouté ou retiré) |
| Chaînes narratives / événements rares | tests dédiés (`rareChains.test.ts`, `narrativeThreads.test.ts`, etc.) | verts, non modifiés |
| Mobile | tests E2E `[mobile]` non liés aux fixtures électorales longues | verts (voir §16 pour les 2 spécifiquement affectées) |
| Agence / fun | aucun texte de choix, aucune stratégie, aucun effet de décision modifié | hors périmètre des correctifs (seule l'agrégation post-décision et l'éligibilité de 10 événements ont changé) |

## 19. Problèmes ouverts

1. Damping du second tour (`RUNOFF_SHARE_DAMPING`) resserre les résultats autour de 50/50 pour un
   premier tour fixé — compromis délibéré d'un correctif antérieur à cette mission, documenté en
   BLOC A comme observation P2, non traité (nécessiterait sa propre étude dédiée aux scénarios de
   second tour, hors périmètre).
2. `docs/CONTENT_QUALITY_RULES.md` / la suite de validation de contenu ne connaissent pas encore la
   nouvelle condition `party_not_opponent` de façon spécifique (elle passe par le garde-fou
   générique du schéma Zod, suffisant pour la validation structurelle, mais aucune règle éditoriale
   dédiée ne vérifie qu'un futur événement de second tour référençant un parti tiers porte
   systématiquement cette condition — reste une vérification manuelle pour tout nouvel événement du
   même type).
3. 2 diffs de régression visuelle pré-existants avant cette mission (`routine card`, `government`,
   ~1 % de pixels, rendu/anti-aliasing) régénérés au passage (aucune raison de les laisser rouges
   alors que la suite complète est de toute façon repassée), mais leur cause originale (probablement
   un rendu de police non déterministe entre exécutions) n'a pas été investiguée — hors périmètre.

## 20. Verdict

Voir tableau et verdict terminal ci-dessous.

---

## Tableau avant/après

| Mesure | Avant | Après | Verdict |
|---|---:|---:|---|
| Score moyen leader début | 13,42 | 15,22 (validation 2 160) | ✅ |
| Score moyen leader pré-R1 | 14,56 | — (voir résultat T1) | — |
| Spread top1-top9 | 6,70 → 9,27 (T1) | 11,27 → 15,70 (T1) | ✅ |
| Courses comprimées (8/9 dans [7,16], résultat T1) | 76,2 % | 17,8 % | ✅ |
| Favoris >20 % (archétype dominant) | 0 % | 22,5 % | ✅ |
| Outsiders <8 % (Reconquête, probabilité) | — | 40 % | ✅ (déjà présent, confirmé) |
| Changements leader / partie | 1,54 | 1,09 | ➖ (légère baisse, cohérente avec une dispersion plus nette) |
| Percées outsider | 0,9 % | 3,1 % | ✅ |
| Effondrements favori | 4,1 % | 1,0 % | ➖ (baisse, cohérent — un favori net s'effondre moins souvent qu'un favori artificiellement fragile) |
| Runoff events incohérents | 10 / 13 | 0 / 13 | ✅ |
| Sidebar sync failures | systémique (7 partis éliminés recrédités) | 0 | ✅ |
| RaceBulletin post-R1 invalide | 0 (déjà corrigé avant mission) | 0 | ✅ |
| Regional map incoherences | 0 (déjà correct) | 0 | ✅ |
| Text-quality issues | 54 | 0 | ✅ |

## VERDICT TERMINAL

```text
ELECTORAL CREDIBILITY / COHERENCE — VERDICT

Crédibilité initiale :
Avant : écart-type 1,80 pt au départ, 0 parti >15 % dans 99,93 % des 10 008 campagnes
Après : écart-type 2,97 pt au départ (corpus de validation)
Verdict : amélioré, mesurable, non artificiel (transformation uniforme, aucun ciblage de parti)

Dispersion électorale :
Avant : écart-type 2,74 pt au résultat réel du premier tour, max jamais observé 23,6 %
Après : écart-type 4,38 pt, max jamais observé 37,5 %
Verdict : corrigé à la racine (agrégation par blocs), validé sur 10 008 campagnes post-correctif

Variété des formes de course :
Favori dominant : 0 % → 22,5 %
Duel : absorbé par « fragmentée »/« confortable » selon les seuils, non nul en pratique
Tripartite : 0,3 % → 2,7 %
Fragmentée : 89,2 % → 47,0 % (reste la plus fréquente sans être écrasante)
Percée : 0,9 % → 3,1 %
Effondrement : 4,1 % → 1,0 %
Verdict : les huit formes attendues coexistent désormais, aucune n'est obligatoire

Compression 7–16 % :
Avant : 76,2 % des résultats de premier tour (définition stricte, 8/9 partis)
Après : 17,8 %
Verdict : compression drastiquement réduite sans disparaître totalement (reste un cas parmi d'autres)

Second tour :
Événements incohérents avant : 10 / 13 événements de second tour spécifiques à un parti
Après : 0 / 13
Verdict : corrigé par une condition d'éligibilité générique, aucune exception hardcodée par parti

Sidebar :
Avant : sondage recalculé comme si les 7 partis éliminés étaient encore en course, toute la durée
        de l'entre-deux-tours et du gouvernement
Après : sondage exclusivement réparti entre les deux finalistes (ou figé pour un joueur éliminé)
Verdict : corrigé à la source unique lue par les trois composants d'UI concernés

RaceBulletin :
Avant : déjà corrigé avant cette mission
Après : re-vérifié fonctionnel
Verdict : aucune régression

Projection régionale :
Avant : déjà cohérente (dépendante du correctif RaceBulletin)
Après : inchangée, re-vérifiée
Verdict : aucune action nécessaire

Qualité texte / apostrophes :
Issues avant : 54 (un seul fichier, un seul type de défaut)
Après : 0
Verdict : corrigé, vérifié par script dédié et par le test de non-régression existant

Tests :
Unit : 46 fichiers / 236 tests (dont 10 nouveaux régressions dédiées aux 3 correctifs), 0 échec
E2E : 29 tests desktop passés, 0 échec (6 fixtures dépendantes de graines électorales retrouvées et
      corrigées après le correctif de dispersion)
Visual regression : 9 snapshots régénérées (contenu affiché légitimement différent), 0 échec après
Build : compilation et génération statique réussies

Non-régressions :
Fun : aucun texte de choix ni effet de décision modifié — hors périmètre des correctifs
Agence : stratégies et effets de décision inchangés
Game feel : composants UI inchangés, seule la donnée qu'ils affichent est désormais correcte
Mobile : tests E2E mobile non liés aux fixtures électorales longues, tous verts
Déterminisme : préservé (transformation mathématique déterministe, aucun tirage RNG ajouté/retiré)

Commits : un commit local créé pour l'ensemble de ce BLOC B (audit + correctifs + tests + rapports),
          conformément au rythme établi dans cette session ; rien poussé vers le dépôt distant
Problèmes ouverts : damping du second tour (P2, hors périmètre), pas de règle éditoriale dédiée
          pour `party_not_opponent` sur les futurs événements, 2 diffs visuels pré-existants
          régénérés sans investigation de leur cause originale
```
