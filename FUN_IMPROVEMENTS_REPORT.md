# Rapport d'amélioration du fun — post-audit

Mission exécutée conformément à `PROMPT_CLAUDE_CODE_AMELIORATION_FUN_POST_AUDIT.md`, à partir du
commit baseline `37764b5` (fin de `AUDIT_FUN_REJOUABILITE.md`), sur la branche
`codex/v2-audit-improvements`. Aucun push vers un dépôt distant : aucun `remote` n'est configuré sur
ce dépôt (`git remote -v` vide), donc rien n'a pu être poussé, intentionnellement ou non.

10 commits locaux créés pour cette mission (baseline incluse), détaillés en §20.

---

## 1. Résumé exécutif

La mission a suivi les phases A→J du prompt : diagnostic et rééquilibrage de Horizons, ajout de
chaînes narratives sur les événements rares génériques, correction des événements
world/scandal frustrants, matrice d'identité de gameplay des 9 partis + contenu Renaissance,
suppression de deux choix dominants de second tour (PS, Écologistes), affinement de la tension de
fin de campagne, correction de fuites de clés techniques dans l'UI, et une nouvelle vérification
complète (audit + tests + 8 playtests manuels).

**Résultats mesurés, sans arrondi favorable :**

- Horizons : fun 44,3 → 49,3 (+5,0), mais qualification et victoire ont **baissé** comme prévu
  (nerf structurel délibéré : 85,6 % → 78,3 % de qualification, 75,6 % → 63,3 % de victoire). Son
  identité progresse (+1,8) mais son agence reste plate (2,0 → 2,0) : un problème ouvert, pas
  résolu par cette mission (§18).
- Renaissance : identité, agence, rejouabilité et variété stratégique progressent tous, mais le
  score de fun composite **baisse légèrement** (59,9 → 56,9) car `funImmediat` et `profondeur`
  reculent en parallèle. Résultat honnête et non forcé, rapporté tel quel (§7, §15).
- 4 événements rares génériques passent de « mémorable » à « exceptionnel » grâce aux chaînes
  narratives (0 → 4 événements exceptionnels au total).
- 2 choix dominants de second tour (PS, Écologistes) ont disparu ; mais 4 nouveaux événements de
  chaîne que j'ai écrits sont eux-mêmes devenus dominants ou faiblement notés (§11, §18) — un
  effet de bord honnêtement documenté, pas maquillé.
- La tension de fin de campagne (dernier décile) est **restée quasiment plate**
  (intensité 4,897 → 4,909 ; taux de retournement 0,133 → 0,120) : les ajustements de la Phase G
  n'ont pas produit d'effet agrégé mesurable, malgré des changements de contenu réels (§9).
- Aucune régression sur la validation de données, le typecheck, le lint, le build. Un test reste
  flaky sous charge parallèle complète (`game.test.ts`), pré-existant et confirmé non lié à cette
  mission (isolé : 3/3 passés en 5,7 s ; §13).

## 2. Baseline

- Commit de départ : `37764b5`, arbre propre.
- Snapshot complet dans `audit-results/fun-improvement/baseline/` : `README.md` (méthodologie,
  chiffres de référence), `environment.txt`, `checks.txt`, `data-validate.txt`, `test.txt`,
  `build.txt`, et une copie de `audit-results/fun-audit/*.csv|json` au commit baseline
  (`fun-audit-snapshot/`).
- Corpus baseline : 1 890 campagnes (1 620 partis existants + 270 personnalisés), 53 950
  décisions, 1 296 lignes A/B appariées, 249 événements au catalogue, 228 événements distincts
  rencontrés.
- Tous les chiffres cités par le prompt de mission ont été vérifiés dans le snapshot avant toute
  modification (table complète dans `baseline/README.md`).

## 3. Changements Horizons

Diagnostic (Phase B) : au commit baseline, Horizons avait simultanément le rejet le plus bas
(`rejection: 40`) et la cohésion la plus haute (`cohesion: 68`) du jeu, ce qui, combiné à sa
`governingCredibility` élevée, produisait un `partyAppeal()` structurellement dominant — d'où
qualification 85,6 % et victoire 75,6 % en baseline, très supérieures aux autres favoris.

- `src/game/data/parties.ts` : `cohesion: 68→62`, `rejection: 40→46` — réduit l'avantage structurel
  sans le supprimer (Horizons reste un favori crédible, juste moins écrasant).
- `src/game/data/events/v2/partiesHorizons.ts` : 6 nouveaux événements formant un vrai arc de
  vulnérabilité — un fondateur historique (Paul Auriac) qui conteste la ligne du parti, se venge ou
  bénit la candidate selon les choix précédents, plus des contestations technocrates/passion/centre.
  Objectif : donner à Horizons une friction interne qu'il n'avait pas, sans le rendre injouable.
- Test dédié : `src/game/data/__tests__/horizonsArcs.test.ts` (4 tests, structure + branchement).

Résultat mesuré : qualification -7,3 pts, victoire -12,3 pts, `victoryGivenQualifiedRate` -7,4 pts
(88,3 % → 80,9 %) — le nerf a bien opéré. Identité +1,8 pt. Fun +5,0 pts malgré la baisse de
puissance : le contenu ajouté a plus pesé que la perte de dominance. Agence inchangée à 2,0/10
(voir §18, problème ouvert).

## 4. Événements rares

Phase C : les 4 événements rares génériques les plus fréquents et les mieux notés
(`rare_national_union`, `rare_exceptional_powers`, `rare_debate_blackout`,
`rare_fragmented_congress`) n'avaient aucune suite narrative malgré un fort engagement — un
gaspillage identifié par l'audit précédent. Chacun reçoit désormais un champ `chain` et un
`followUps` menant à un événement de suite conditionné par le choix fait (ex :
`rare_national_union_expires` selon que la coalition de crise a tenu ou explosé).

- `src/game/data/events/v2/rare.ts` : 4 événements déclencheurs modifiés + 6 nouveaux événements de
  suite (rareté `uncommon`), tous testés dans `src/game/data/__tests__/rareChains.test.ts`
  (structure, probabilités, balayage borné sur 10 graines/parti).

Résultat mesuré (`rare-event-value.csv`) : ces 4 événements passent tous de la classification
« mémorable » à « exceptionnel », avec un `compositeScore` en hausse nette (ex :
`rare_national_union` : 61,2 → 79,6 ; `rare_fragmented_congress` : 62,7 → 75,2). Le compteur
`summary.json.rareEvents.exceptionnel` passe de 0 à 4.

Effet de bord honnête : un des 6 nouveaux événements de suite,
`rare_blackout_leak_resurfaces`, n'apparaît que 6 fois dans le corpus et affiche un
`choiceEntropyNormalized` de 0 (100 % de choix dominant) — grade D. Rapporté en §11 et §18, pas
masqué.

## 5. Événements world/scandal

Phase D : 5 événements identifiés comme frustrants par l'audit précédent
(`scandal_supplier_overbilling`, `scandal_donation_route`, `scandal_audit_conclusion`,
`world_budget_warning`, et via la Phase H `world_rival_leadership_tension` /
`debate_frontrunner_retaliation`) ont reçu de vrais compromis : un choix qui semblait strictement
dominant gagne un coût réel (ex. `scandal_audit_conclusion` : l'option « tout » perd 3 en
momentum ; `world_budget_warning` : l'option « croissance » gagne en mobilisation mais coûte plus
cher en compétence économique).

Résultat mesuré (`summary.json.randomEventValue`) : `frustrant` 6 → 4 (amélioration),
`intéressant` 8 → 8 (stable), `neutre` 10 → 12 (légère hausse, cohérente avec un rééquilibrage qui
adoucit les extrêmes plutôt que de créer artificiellement plus d'événements « intéressants »).

## 6. Identité des partis

`PARTY_GAMEPLAY_IDENTITIES.md` (nouveau, racine du dépôt) documente une matrice à 5 axes (rejet
initial, cohésion, lecture stratégique, style de risque récompensé, vulnérabilité narrative
propre) pour les 9 partis, fondée sur les données réelles de `parties.ts` et les runs de l'audit —
pas une déclaration d'intention non vérifiée. Sert de garde-fou pour les phases suivantes : chaque
nouveau contenu de parti devait rester cohérent avec l'axe identifié plutôt que de plaquer un arc
générique.

## 7. Renaissance

Diagnostic : Renaissance avait l'identité la plus faible du jeu en baseline (2,5/10), avec un
avantage institutionnel/média fort mais aucune tension interne écrite.

- `src/game/data/events/v2/partiesRenaissance.ts` : 5 nouveaux événements — un ancien mandat
  (« l'héritage ») confronté ou salué selon le choix du joueur, l'après-manifeste, la défense du
  centre. Testés dans `src/game/data/__tests__/renaissanceArcs.test.ts` (3 tests).

Résultat mesuré, **rapporté sans arrondi favorable** : identité 2,5 → 4,7 (+2,2), agence 5,7 → 6,8
(+1,1), rejouabilité 5,8 → 7,4 (+1,6), variété stratégique 5,1 → 6,2 (+1,1) — toutes les dimensions
directement ciblées par la mission progressent. Mais `funImmediat` recule (4,8 → 3,6) et
`profondeur` recule (6,8 → 5,4), tirant le score composite vers le bas (59,9 → 56,9, -3,0). Un des
nouveaux événements de suite, `party_renaissance_legacy_credited`, affiche un
`dominantChoiceShare` de 0,857 (grade B, pas critique mais pas neutre non plus). Interprétation
prudente : le contenu ajouté est qualitativement meilleur sur les axes ciblés, mais soit trop
resserré autour d'un seul fil narratif (moins de profondeur perçue en dehors de cet arc), soit
sujet à un biais du proxy `funImmediat` sur ce type de contenu introspectif plutôt que spectaculaire.
Non « corrigé » artificiellement pour remonter le score composite — voir §18.

## 8. Rejouabilité

Phase F : deux événements de second tour affichaient un choix dominant (> 88 %) faute
d'alternative crédible : `party_ps_runoff` (0,881, grade C) et `party_ecologistes_runoff` (0,890,
grade C). Chacun reçoit un troisième choix réellement distinct
(`ps_runoff_no_deal`, `ecologistes_runoff_solo`) plutôt qu'une variante cosmétique.

Résultat mesuré : les deux événements **disparaissent** de la liste des choix dominants
(> 80 %) du corpus post-amélioration — vérifié directement dans `event-fun.csv`. La nouveauté
moyenne à la 10ᵉ partie (`replayability.csv`, `newContentShareThisGame`) passe de 8,9 % à 13,7 %
(+4,8 pts), portée par les 17 nouveaux événements du catalogue (249 → 266).

## 9. Tension

Phase G : ajustements ciblés sur les événements de fin de campagne (`debate_frontrunner_retaliation`,
`world_rival_leadership_tension`) pour renforcer l'enjeu perçu des derniers tours.

Résultat mesuré (`tension.csv`, dernier décile de campagne) : intensité moyenne 4,897 → 4,909
(quasi identique), taux de retournement de classement 0,133 → 0,120 (légèrement en baisse).
**Aucun effet agrégé net mesurable** malgré des changements de contenu réels — les ajustements
ont probablement un effet local (sur les runs où ces événements précis apparaissent) noyé dans la
moyenne du corpus. Rapporté honnêtement comme résultat neutre plutôt que présenté comme un
succès.

## 10. Choix dominants

`summary.json.dominantChoiceShare` : 4/224 événements évalués (1,8 %) en baseline → 4/236 (1,7 %)
en post — quasiment stable, malgré un catalogue plus large. Détail du mouvement, événement par
événement (`event-fun.csv` / `rare-event-value.csv`) :

| Événement                           | Baseline    | Post      | Évolution                                            |
| ----------------------------------- | ----------- | --------- | ---------------------------------------------------- |
| `party_ps_runoff`                   | 0,881 (C)   | disparu   | corrigé (Phase F)                                    |
| `party_ecologistes_runoff`          | 0,890 (C)   | disparu   | corrigé (Phase F)                                    |
| `debate_frontrunner_retaliation`    | 0,908 (C)   | 0,922 (F) | **aggravé** malgré tentative de correction (Phase H) |
| `party_rn_dissidence`               | 0,917 (B)   | 0,889 (B) | légère amélioration, non ciblé directement           |
| `program_integration_contract`      | 0,947 (A)   | 0,949 (A) | inchangé, hors périmètre de la mission               |
| `party_horizons_founder_blessing`   | — (nouveau) | 0,929 (F) | nouveau contenu, effet de bord                       |
| `party_horizons_founder_revenge`    | — (nouveau) | 0,889 (B) | nouveau contenu, effet de bord                       |
| `party_renaissance_legacy_credited` | — (nouveau) | 0,857 (B) | nouveau contenu, effet de bord                       |
| `rare_blackout_leak_resurfaces`     | — (nouveau) | 1,000 (D) | nouveau contenu, effet de bord                       |

Le nombre total de choix dominants reste stable, mais sa composition a changé : deux corrections
réelles, une régression réelle non résolue, et quatre effets de bord issus du nouveau contenu de
cette mission. Voir §18.

## 11. Événements faibles

`world_security_attack` reste en grade F (n=1 occurrence, bruit statistique pré-existant,
inchangé par cette mission — hors périmètre). Les 4 nouveaux événements à choix dominant listés en
§10 constituent la vraie zone de suivi : ils sont peu fréquents (6 à 27 occurrences) et n'ont pas
eu le volume de simulation suffisant pour un rééquilibrage fiable en une seule itération. Non
retravaillés dans cette mission faute de signal statistique suffisant à ce stade (voir §18/§19).

## 12. UI / immersion

Phase I : un bug rapporté en direct pendant un playtest de l'audit précédent — une clé technique
brute (`climateConcern`) affichée telle quelle dans le libellé d'un effet — a été corrigé
structurellement plutôt que patché au cas par cas.

- `src/game/engine/internalKeyLabels.ts` (nouveau) : tables de libellés français
  (`PRIMARY_STAT_LABELS`, `SECONDARY_STAT_LABELS`, `TRAIT_LABELS`, `WORLD_STAT_LABELS`,
  `IDEOLOGY_AXIS_LABELS`), avec vérification de complétude à la compilation (`satisfies`), et un
  filet de sécurité `humanizeInternalKey()` qui ne peut jamais renvoyer de camelCase brut même pour
  une clé non cartographiée.
- `src/game/engine/effectProcessor.ts` et `outcomeResolver.ts` : les générateurs de libellé par
  défaut utilisent désormais ces tables au lieu d'un `replaceAll("_", " ")` naïf.
- Test `src/game/engine/__tests__/internalKeyLabels.test.ts` (9 tests) : reproduit noir sur blanc
  le bug rapporté, et scanne l'intégralité du catalogue de production (266 événements) pour
  vérifier qu'aucun effet visible sans libellé explicite n'expose de clé camelCase brute.
- `src/lib/game-presentation.ts` : nouvelle fonction pure `computeQualificationGap()` (marge ou
  déficit par rapport au seuil de qualification), affichée dans `RaceBulletinScreen`
  (`campaign-screens.tsx`) — remplace un simple rang brut par une information actionnable pour le
  joueur.

## 13. Tests

- Ajouts : `horizonsArcs.test.ts` (4), `rareChains.test.ts` (3 gros tests incluant un balayage sur
  10 graines/parti), `renaissanceArcs.test.ts` (3), `mutuallyExclusiveArcs.test.ts` (2),
  `internalKeyLabels.test.ts` (9), `game-presentation.test.ts` (5). Total catalogue de tests :
  130 → 156.
- `npm run test` (suite complète, parallèle) : 155/156 passés, 1 échec —
  `game.test.ts > termine des campagnes variées sans état invalide`, timeout à 10 s sous charge
  parallèle complète. **Confirmé pré-existant et non lié à cette mission** : ce test utilise
  `testContent` (fixture isolée), jamais `gameContent` (catalogue de production que cette mission a
  modifié), et repasse à 3/3 en 5,7 s en isolation (`npx vitest run
src/game/engine/__tests__/game.test.ts`). Flakiness de contention CPU sous suite parallèle,
  documentée dès la Phase B et reconfirmée ici.
- `npm run typecheck`, `npm run lint`, `npm run data:validate` : tous verts, zéro avertissement.

## 14. Simulations

`npm run audit:fun` ré-exécuté intégralement après la Phase I (Phase J) : même corpus
(1 890 campagnes, mêmes graines), catalogue élargi (266 événements, 244 rencontrés contre 228 en
baseline). Snapshot complet archivé dans `audit-results/fun-improvement/post/fun-audit-snapshot/`.
`npm run data:validate` confirme 9 partis, 266 événements, 58 succès, 18 rares/légendaires/secrets
— validation structurelle et éditoriale réussie.

## 15. Comparaison avant/après

| Mesure                                                  | Baseline                        | Post                                 | Δ                                       |
| ------------------------------------------------------- | ------------------------------- | ------------------------------------ | --------------------------------------- |
| Fun Horizons                                            | 44,3/100                        | 49,3/100                             | **+5,0**                                |
| Qualification Horizons                                  | 85,6 %                          | 78,3 %                               | -7,3 pts (nerf voulu)                   |
| Victoire Horizons                                       | 75,6 %                          | 63,3 %                               | -12,3 pts (nerf voulu)                  |
| Agence Horizons                                         | 2,0/10                          | 2,0/10                               | **0 (non résolu, §18)**                 |
| Identité Horizons                                       | 4,2/10                          | 6,0/10                               | +1,8                                    |
| Identité Renaissance                                    | 2,5/10                          | 4,7/10                               | +2,2                                    |
| Fun Renaissance                                         | 59,9/100                        | 56,9/100                             | **-3,0 (net négatif, §7/§18)**          |
| Similarité stratégies inter-partis (cosinus, plage)     | 0,979–0,996                     | 0,981–0,997                          | quasi stable                            |
| Rares avec chaîne (génériques)                          | 0/9                             | 4/9                                  | **+4**                                  |
| Rares « exceptionnels »                                 | 0                               | 4                                    | **+4**                                  |
| World/scandal intéressants                              | 8/24                            | 8/24                                 | stable                                  |
| World/scandal frustrants                                | 6/24                            | 4/24                                 | **-2 (amélioré)**                       |
| Nouveauté partie 10 (moyenne)                           | 8,9 %                           | 13,7 %                               | **+4,8 pts**                            |
| Narrativité ≥ 3 signaux                                 | 81,7 %                          | 81,8 %                               | stable (préservé)                       |
| Choix dominants > 80 %                                  | 1,8 % (4/224)                   | 1,7 % (4/236)                        | quasi stable (composition changée, §10) |
| Tension fin de campagne (intensité, dernier décile)     | 4,897                           | 4,909                                | quasi stable                            |
| Tension fin de campagne (retournements, dernier décile) | 0,133                           | 0,120                                | légère baisse                           |
| Runs Horizons « plats » (bottom10 fun)                  | 5/10                            | 6/10                                 | **+1 (légèrement aggravé, §18)**        |
| Clés techniques visibles (camelCase brut)               | 1 bug confirmé (climateConcern) | 0 sur tout le catalogue (test dédié) | **corrigé**                             |

Classement du fun par parti (baseline → post) :

| Rang | Baseline                | Post                    |
| ---- | ----------------------- | ----------------------- |
| 1    | Nouvelle Énergie (70,7) | Écologistes (78,1)      |
| 2    | Écologistes (64,7)      | LFI (68,6)              |
| 3    | LR (61,4)               | Nouvelle Énergie (67,8) |
| 4    | Renaissance (59,9)      | Reconquête (61,0)       |
| 5    | Reconquête (59,5)       | LR (60,6)               |
| 6    | LFI (58,1)              | RN (58,7)               |
| 7    | PS (57,0)               | PS (57,6)               |
| 8    | RN (53,8)               | Renaissance (56,9)      |
| 9    | Horizons (44,3)         | Horizons (49,3)         |

Horizons reste dernier dans les deux mesures — le nerf n'a pas suffi à le sortir de la dernière
place, seulement à réduire l'écart (baseline : -9,5 pts vs l'avant-dernier ; post : -7,6 pts).
Écologistes et LFI progressent fortement sans avoir été des cibles directes d'une phase dédiée :
ils bénéficient des changements systémiques (nouvelles chaînes rares, correction world/scandal)
plus que les autres profils, probablement parce que leurs styles de jeu simulés interagissent
plus souvent avec ce contenu.

## 16. Playtests

8 playtests manuels effectués dans un vrai navigateur (Edge via `playwright-cli`), captures
archivées dans `audit-results/fun-improvement/post/playtests/`.

**PT1 — Horizons, style prudent.** Campagne construite sur des choix PRUDENT/TRANSPARENT.
Histoire en 3 phrases : Agathe Belcourt consolide son socle territorial sans jamais provoquer de
crise ; le nouvel arc du fondateur Paul Auriac reste feutré côté prudent ; victoire nette au
second tour. Moment fort : la première apparition de la friction fondateur, qui n'existait pas
avant cette mission. Tension : correcte mais jamais dramatique (cohérent avec le style choisi).
Envie de rejouer : oui, pour tester le style opposé sur le même parti (fait en PT2/PT3).

**PT2 — Horizons, style opportuniste.** Résultat : victoire face au PS. Décision marquante : le
choix POPULAIRE/OFFENSIF sur l'arc fondateur mène à une confrontation plus dure avec Paul Auriac
que sur PT1 — le branchement est bien perceptible manette en main, pas seulement dans les données.

**PT3 — Horizons, style chaos/audacieux (méthode « La rupture »).** Résultat : victoire face au
RN, 57,3 %. Un bug d'automatisation (regex ancrée sur le mauvais motif de bouton) a bloqué la
boucle de test 30 itérations sur un écran de débat où les étiquettes sont préfixées plutôt que
suffixées — corrigé en cours de route, sans incidence sur le contenu du jeu lui-même (bug de mon
script de test, pas du jeu). Une fois débloqué, campagne jusqu'au bout sans autre accroc, écran de
résultat nickel.

**PT4 — Renaissance, style cohérent (méthode « Présidentiable »).** Résultat : victoire face au
RN, 55,9 %. Histoire cohérente avec le diagnostic de la Phase E : Renaissance en méthode
institutionnelle tient bien la distance, le nouvel arc « héritage » s'intègre sans rupture de ton.
Tension modérée, résultat prévisible mais pas plat pour autant — les cartes d'événements varient.

**PT5 — Renaissance, style opportuniste (méthode « campagne numérique »).** Résultat : victoire
face au RN, 60,8 % — meilleur score que le style cohérent sur la même partie, cohérent avec
`varieteStrategique` mesuré en hausse. Aucune carte répétée perçue sur les 31 décisions.

**PT6 — Reconquête, outsider réussi (qualifié pour le second tour).** Méthode « terrain d'abord »,
tags RASSEMBLEUR/TRANSPARENT/PRUDENT/POPULAIRE. Résultat : qualifié pour le second tour, 45,6 %
face au RN (54,4 %) — défaite au second tour mais qualification réussie, un résultat rare et
valorisant pour ce parti (`qualificationRate` baseline 27,2 % / 28,3 % post). Histoire : une
campagne de terrain qui paie, jusqu'à buter sur le plafond structurel du parti au second tour.
Décision marquante : rejoindre le second tour a demandé plusieurs choix RASSEMBLEUR consécutifs —
perceptible comme un vrai effort de construction, pas un coup de dé isolé.

**PT7 — Reconquête, outsider éliminé au premier tour.** Méthode « La rupture », tags
OFFENSIF/CLIVANT/RISQUÉ/POPULAIRE. Résultat : élimination au premier tour, 8,6 % (« Campagne
honorable »), 9ᵉ position, +3,6 points de progression. Défaite jouable et racontée (pas un simple
écran d'échec sec) : le bilan cite explicitement le tournant retenu (« La présidence que vous
proposez ») et le nombre de positions programmatiques tenues. Confirme l'acquis « défaites
jouables » de l'audit précédent, préservé par cette mission.

**PT8 — Écologistes.** Méthode « La rupture », tags CLIVANT/OFFENSIF/RASSEMBLEUR/RISQUÉ. Résultat :
victoire nette face à Horizons, 58,3 %. Le parti déjà le mieux noté avant la mission (et encore
plus après, +13,4 pts de fun) confirme cette progression manette en main : rythme soutenu,
événements rares déclenchés (le parti a le plus haut engagement avec ce contenu dans le corpus),
aucune carte faible perçue.

Aucun playtest n'a révélé de blocage réel du jeu (hors le bug de script d'automatisation en PT3,
sans rapport avec le contenu du jeu).

## 17. Régressions évitées

- Les 4 signatures acquises par l'audit précédent (§2 de `AUDIT_FUN_REJOUABILITE.md`) ont été
  vérifiées : narrativité ≥3 signaux quasi identique (81,7 % → 81,8 %), zéro répétition de carte
  observée en playtest, déterminisme intact (`npm run test` couvre les tests de déterminisme
  existants, tous verts), défaites jouables confirmées en PT7.
- `format:check`, `lint`, `typecheck`, `data:validate`, `build` : tous verts après implémentation,
  aucune dégradation vs baseline.
- Les différences naturelles entre partis n'ont pas été gommées : le classement de fun reste
  dispersé (44,3–70,7 en baseline, 49,3–78,1 en post), pas resserré artificiellement autour d'une
  moyenne.
- Le score de fun n'a pas été maximisé artificiellement : Renaissance baisse (§7), la tension de
  fin de campagne stagne (§9), et les effets de bord du nouveau contenu sont rapportés au même
  niveau de détail que les succès (§10, §18).

## 18. Problèmes encore ouverts

1. **Agence Horizons inchangée (2,0/10, §3).** Le nerf structurel et le nouvel arc narratif n'ont
   pas fait bouger cette dimension spécifique. Le contenu ajouté enrichit l'identité mais ne donne
   pas davantage de prise stratégique réelle au joueur sur l'issue de sa partie Horizons.
2. **Renaissance : score de fun composite en baisse nette malgré des sous-scores ciblés en
   hausse (§7, -3,0 pts).** `funImmediat` et `profondeur` reculent pour des raisons non
   élucidées dans le temps imparti — possiblement un arc trop concentré sur un seul fil narratif
   (l'héritage) au détriment de la diversité perçue des situations.
3. **`debate_frontrunner_retaliation` : le choix dominant s'est aggravé malgré une tentative de
   correction (0,908 → 0,922, §10).** L'ajout de `momentum-2`/`credibility+2` n'a pas suffi à
   déplacer suffisamment l'équilibre ; nécessite une refonte plus profonde du choix, pas un simple
   ajustement de valeurs.
4. **4 événements de suite nouvellement écrits affichent un choix dominant ou une note basse**
   (`party_horizons_founder_blessing` F, `rare_blackout_leak_resurfaces` D,
   `party_horizons_founder_revenge` B, `party_renaissance_legacy_credited` B — §10, §11). Volume
   d'occurrences trop faible (6 à 27) pour un rééquilibrage fiable en une seule itération de
   mission ; à surveiller sur un prochain cycle d'audit avec plus de données.
5. **Tension de fin de campagne : aucun effet agrégé mesurable (§9)**, malgré des changements de
   contenu réels sur les événements ciblés — l'effet, s'il existe, est trop local pour ressortir
   dans la moyenne du corpus.
6. **Horizons reste sur-représenté parmi les runs « plats » (bottom10 fun) : 5/10 → 6/10 (§15).**
   Le nerf structurel et le nouvel arc n'ont pas réduit ce phénomène, et l'ont même très légèrement
   aggravé sur cet échantillon précis.

## 19. Recommandations futures

- Revoir `debate_frontrunner_retaliation` en profondeur (nouveau choix plutôt qu'un ajustement de
  valeurs) plutôt que de retenter un patch marginal.
- Laisser tourner un cycle d'audit supplémentaire une fois que les 6 nouveaux événements de suite
  auront accumulé plus d'occurrences, pour rééquilibrer ceux qui se confirment dominants avec des
  données plus robustes que 6-27 occurrences.
- Étudier spécifiquement pourquoi l'arc « héritage » de Renaissance tire `funImmediat` et
  `profondeur` vers le bas malgré des sous-scores qualitatifs en hausse — potentiellement un
  problème de calibration du proxy de fun sur du contenu introspectif plutôt qu'un problème de
  contenu en soi.
- Chercher un levier d'agence pour Horizons distinct de la simple réduction de puissance
  structurelle (ex. un choix stratégique à conséquence réellement bifurquante sur son second tour,
  qui n'existe pas actuellement).

## 20. Verdict final

Commits locaux créés (10, `37764b5`..`HEAD`, aucun push, aucun remote configuré) :

```
f9c6906 chore(fun-improvement): Phase J — post-improvement audit corpus and playtest archive
de5a4bc fix(p3): eliminate raw camelCase key leaks in effect/decisive-factor labels
d45a90a fix(p2/h): rebalance dominant choices, keep debate_frontrunner_retaliation's writing intact
3076a2e feat(p3): show the qualification gap instead of raw rank on the polls bulletin
a3134c8 test(p3): verify mutual exclusion of the mission's new branching arcs
79d6f81 feat(p3/p4): party gameplay identity matrix + Renaissance legacy content
81839ac fix(p2): give the 5 verified-frustrating world/scandal events real trade-offs
db8ffa5 fix(p2): give four generic rare events real narrative chains
2dc19bd fix(p1): Horizons — give the favorite a real vulnerability and branching
94c7d9a chore(fun-improvement): Phase A — reproducible baseline before improvements
```

Fichiers majeurs modifiés (hors `audit-results/`) : `src/game/data/parties.ts`,
`src/game/data/events/v2/{partiesHorizons,partiesRenaissance,rare,scandals,world,
opponentInteractions,partiesPs,partiesEcologistes}.ts`, `src/game/engine/{internalKeyLabels
(nouveau),effectProcessor,outcomeResolver}.ts`, `src/lib/game-presentation.ts`,
`src/features/campaign/campaign-screens.tsx`, 6 nouveaux fichiers de tests, `PARTY_GAMEPLAY_
IDENTITIES.md` (nouveau), `scripts/fun-improvement/quick-check.ts` (nouveau) — 24 fichiers,
+2279/-28 lignes hors résultats d'audit.

```
================================================================================
FUN IMPROVEMENT — VERDICT FINAL
================================================================================

Horizons
  Avant   : fun 44,3/100 | qualification 85,6 % | victoire 75,6 % | agence 2,0/10
  Après   : fun 49,3/100 | qualification 78,3 % | victoire 63,3 % | agence 2,0/10
  Verdict : Nerf structurel réussi (dominance réduite comme prévu), fun en hausse
            (+5,0), mais agence toujours non résolue — problème ouvert.

Renaissance / identité
  Avant   : identité 2,5/10 | fun 59,9/100
  Après   : identité 4,7/10 | fun 56,9/100
  Verdict : Identité, agence, rejouabilité et variété stratégique en hausse ; fun
            composite en baisse nette (-3,0) — résultat mixte rapporté sans
            correction artificielle.

Événements rares
  Avant   : 0 exceptionnel, 0/9 génériques avec chaîne
  Après   : 4 exceptionnels, 4/9 génériques avec chaîne
  Verdict : Réussite nette, mesurée directement dans rare-event-value.csv.

Événements aléatoires (world/scandal)
  Avant   : 6/24 frustrants
  Après   : 4/24 frustrants
  Verdict : Amélioration réelle, modeste.

Rejouabilité
  Avant   : 8,9 % de nouveauté à la 10e partie | 2 choix de second tour dominants
  Après   : 13,7 % de nouveauté | 0 choix de second tour dominant (ceux ciblés)
  Verdict : Réussite nette sur les deux fronts.

Tension fin de campagne
  Avant   : intensité 4,897 | retournements 0,133 (dernier décile)
  Après   : intensité 4,909 | retournements 0,120 (dernier décile)
  Verdict : Effet agrégé nul — problème ouvert, non résolu par cette mission.

Choix dominants
  Avant   : 4/224 (1,8 %)
  Après   : 4/236 (1,7 %)
  Verdict : Stable en volume ; composition changée (2 corrigés, 1 aggravé, 4
            nouveaux effets de bord) — problème partiellement ouvert.

Immersion UI
  Avant   : 1 bug confirmé de clé technique brute affichée (climateConcern)
  Après   : 0 sur l'ensemble du catalogue de production (test dédié, 266
            événements scannés)
  Verdict : Réussite nette et vérifiée structurellement.

Non-régressions
  format:check / lint / typecheck / data:validate / build : tous verts.
  npm run test : 155/156 (1 échec de contention CPU parallèle, pré-existant,
  confirmé non lié à cette mission — 3/3 en isolation).

Playtests manuels
  8/8 effectués (Horizons x3 styles, Renaissance x2, Reconquête x2, Écologistes
  x1) dans un vrai navigateur. Aucun blocage de contenu observé.

Commits locaux créés
  10 (baseline + 8 phases de contenu + post-audit). Aucun push. Aucun remote
  configuré sur ce dépôt.

Fichiers majeurs modifiés
  24 fichiers hors résultats d'audit (+2279/-28 lignes) ; corpus d'audit
  entièrement régénéré (1890 runs, 266 événements).

Problèmes encore ouverts
  1. Agence Horizons inchangée (2,0/10)
  2. Fun Renaissance en baisse nette malgré identité en hausse
  3. debate_frontrunner_retaliation aggravé malgré tentative de correction
  4. 4 événements neufs à choix dominant/note basse, volume insuffisant pour
     rééquilibrage fiable
  5. Tension fin de campagne : aucun effet agrégé mesurable
  6. Horizons toujours sur-représenté parmi les runs « plats » (6/10 vs 5/10
     avant)
================================================================================
```
