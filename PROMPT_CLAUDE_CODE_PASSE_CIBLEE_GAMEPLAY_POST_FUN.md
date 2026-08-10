# PROMPT MAÎTRE — PASSE CIBLÉE POST-IMPROVEMENT
## Agence Horizons, diversité Renaissance, tension de fin de campagne, choix dominants, robustesse statistique et stabilité CI
### Projet : « Vers l’Élysée »

Tu interviens comme **lead game designer système**, **senior TypeScript gameplay engineer**, **narrative systems designer**, **analyste statistique**, **spécialiste des simulations contrefactuelles** et **responsable qualité CI**.

Cette mission est volontairement **ciblée et limitée**. Elle intervient après les audits fonctionnels, l’audit du fun/rejouabilité et la première passe d’amélioration. Elle ne doit PAS devenir une nouvelle refonte générale.

Ta mission : **résoudre ou fortement améliorer les six problèmes fonctionnels encore ouverts après `FUN_IMPROVEMENTS_REPORT.md`**, sans réouvrir les chantiers déjà validés et sans toucher à la forme visuelle.

Ne t’arrête pas à un plan : modifie réellement le code, les données et les tests, exécute les simulations, compare avant/après et poursuis jusqu’au verdict final.

Ne pousse rien vers le dépôt distant.

---

# 1. DOCUMENTS DE RÉFÉRENCE À LIRE EN ENTIER

Avant toute modification, lis intégralement :

- `FUN_IMPROVEMENTS_REPORT.md`
- `AUDIT_FUN_REJOUABILITE.md`
- `AUDIT_POST_CORRECTIONS.md`
- `POST_AUDIT_FIXES.md`
- `GAMEPLAY_AUDIT.md`
- `PARTY_GAMEPLAY_IDENTITIES.md`
- `V2_DECISIONS.md`
- `V2_CHANGELOG.md`
- `audit-results/fun-improvement/`
- `audit-results/fun-audit/`
- `scripts/fun-audit/`
- `scripts/fun-improvement/`
- les tests liés à Horizons, Renaissance, rare chains et au moteur de jeu.

Inspecte aussi les fichiers particulièrement concernés :

- `src/game/data/parties.ts`
- `src/game/data/events/v2/partiesHorizons.ts`
- `src/game/data/events/v2/partiesRenaissance.ts`
- `src/game/data/events/v2/rare.ts`
- `src/game/data/events/v2/opponentInteractions.ts`
- `src/game/data/events/v2/world.ts`
- `src/game/data/events/v2/scandals.ts`
- `src/game/data/events/v2/partiesPs.ts`
- `src/game/data/events/v2/partiesEcologistes.ts`
- `src/game/engine/eventSelector.ts`
- les autres fichiers du moteur touchant aux relations, reports, second tour, mémoire et scoring.

---

# 2. IMPORTANT — CETTE MISSION NE TRAITE PAS LA FORME

Un audit séparé de forme/game feel existe désormais.

**Ne mélange pas les deux chantiers.**

Ne modifie pas dans cette mission :

- direction artistique ;
- animations ;
- responsive ;
- UI ;
- design system ;
- cartes visuelles ;
- mise en scène du premier/second tour ;
- sound design ;
- typographie ;
- layouts.

Exception : uniquement un ajustement technique strictement nécessaire à un test automatisé fonctionnel.

Le périmètre est uniquement :

- structure des campagnes ;
- agence ;
- choix ;
- tension systémique ;
- diversité narrative fonctionnelle ;
- robustesse statistique ;
- stabilité de la suite de tests.

---

# 3. BASELINE À CONSIDÉRER

Le rapport précédent a établi les constats suivants.

## Horizons

Avant la première passe d’amélioration :

- fun : `44,3/100`
- qualification : `85,6 %`
- victoire : `75,6 %`
- agence : `2,0/10`

Après :

- fun : `49,3/100`
- qualification : `78,3 %`
- victoire : `63,3 %`
- victoire conditionnelle à qualification : `80,9 %`
- agence : `2,0/10`
- identité : `4,2 → 6,0`
- bottom10 « runs plats » : `5/10 → 6/10`

Conclusion :

> Horizons est moins dominant, mais le joueur n’a pas davantage de prise stratégique réelle sur sa trajectoire.

## Renaissance

Avant :

- identité : `2,5/10`
- fun : `59,9/100`

Après :

- identité : `4,7/10`
- agence : `5,7 → 6,8`
- rejouabilité : `5,8 → 7,4`
- variété stratégique : `5,1 → 6,2`
- fun : `59,9 → 56,9`

Conclusion :

> L’identité progresse mais l’expérience se concentre peut-être trop autour de l’arc « héritage », ou le proxy de fun pénalise ce type de contenu. Il faut le diagnostiquer et diversifier.

## Choix dominants encore ouverts

- `debate_frontrunner_retaliation` : `0,908 → 0,922` — aggravé.
- `party_horizons_founder_blessing` : `0,929`
- `party_horizons_founder_revenge` : `0,889`
- `party_renaissance_legacy_credited` : `0,857`
- `rare_blackout_leak_resurfaces` : `1,000`, mais très faible nombre d’occurrences.

## Tension fin de campagne

Avant :

- intensité dernier décile : `4,897`
- retournements : `0,133`

Après :

- intensité : `4,909`
- retournements : `0,120`

Conclusion :

> Les patchs locaux n’ont pas amélioré la tension agrégée.

## Gains à préserver

- nouveauté partie 10 : `8,9 % → 13,7 %`
- rares génériques avec chaîne : `0/9 → 4/9`
- rares « exceptionnels » : `0 → 4`
- world/scandal frustrants : `6/24 → 4/24`
- narrativité ≥3 signaux : `81,7 % → 81,8 %`
- fuite de clés techniques : corrigée.

## CI

La suite complète termine à `155/156` à cause d’un timeout dans :

`game.test.ts > termine des campagnes variées sans état invalide`

Le test passe isolément. Cette dette CI doit désormais être traitée proprement.

---

# 4. OBJECTIFS DE CETTE PASSE

Traiter exactement ces six problèmes :

1. **Agence Horizons réellement faible**
2. **Renaissance trop concentré autour d’un seul axe narratif**
3. **Tension systémique de fin de campagne insuffisante**
4. **Choix dominants encore ouverts**
5. **Faible volume statistique sur certains nouveaux follow-ups**
6. **Test flaky sous exécution complète**

Priorité absolue :

> **Faire bifurquer davantage les campagnes selon les décisions du joueur, sans transformer le jeu en roulette ni homogénéiser les partis.**

---

# 5. RÈGLES NON NÉGOCIABLES

## 5.1 Ne pas tricher avec les métriques

Interdictions :

- modifier le calcul du fun uniquement pour améliorer les chiffres ;
- filtrer les runs gênants ;
- choisir des seeds favorables après observation ;
- hardcoder des résultats ;
- forcer artificiellement les taux de victoire ;
- buff/nerf direct uniquement pour déplacer une métrique ;
- supprimer les événements gênants plutôt que les corriger ;
- masquer les faibles occurrences.

## 5.2 Ne pas rééquilibrer Horizons par de simples stats

Le rapport précédent démontre déjà que diminuer sa puissance ne suffit pas.

Donc, sauf justification forte documentée, **ne touche plus d’abord à `parties.ts`**.

Le prochain levier doit être structurel :

- branches ;
- trade-offs ;
- adversaires ;
- second tour ;
- réserves de voix ;
- relations ;
- accès à certains événements ;
- conséquences différées.

## 5.3 Préserver les forces existantes

Ne pas dégrader :

- chaînes narratives ;
- déterminisme ;
- second tour distinct ;
- défaite jouable ;
- rares exceptionnels ;
- world/scandal améliorés ;
- absence de répétitions ;
- identité déjà obtenue ;
- rejouabilité gagnée.

---

# 6. PHASE A — BASELINE REPRODUCTIBLE

Avant modification :

1. noter branche, commit, `git status`, Node/npm ;
2. exécuter :
   - `npm run lint`
   - `npm run typecheck`
   - `npm run data:validate`
   - `npm run test`
   - `npm run build`
   - `npm run audit:fun`
3. archiver dans `audit-results/targeted-pass/baseline/` ;
4. conserver les seeds principales existantes ;
5. créer un corpus renforcé pour les événements faiblement observés.

Créer au minimum :

- `baseline-summary.json`
- `baseline-horizons.csv`
- `baseline-renaissance.csv`
- `baseline-dominant-choices.csv`
- `baseline-late-game.csv`
- `baseline-flaky-tests.txt`

---

# 7. PHASE B — HORIZONS : TROIS TRAJECTOIRES STRATÉGIQUES RÉELLEMENT DISTINCTES

C’est le chantier principal.

## 7.1 Objectif

Créer au moins trois trajectoires émergentes des décisions du joueur, jamais choisies explicitement dans un menu.

### A — Continuité institutionnelle

Potentiel :

- crédibilité ;
- élus ;
- stabilité ;
- faible rejet ;
- bon potentiel de coalition ;
- mais moins de passion/mobilisation ;
- plafond de dynamique.

### B — Autonomisation / rupture du centre

Potentiel :

- notoriété ;
- momentum ;
- différenciation ;
- tensions avec anciens alliés ;
- rejet accru ;
- autre géométrie de second tour.

### C — Coalition / élargissement

Potentiel :

- relations ;
- électorats adjacents ;
- réserves de voix ;
- concessions ;
- risque de dilution ;
- coûts programmatiques ;
- meilleur potentiel de second tour si bien exécuté.

Adapte ces concepts à l’architecture réelle plutôt que de les plaquer littéralement.

## 7.2 Les trajectoires doivent modifier réellement

Au moins plusieurs de ces éléments :

- pool d’événements ;
- réactions d’acteurs ;
- relations entre partis ;
- comportement d’adversaires ;
- bonus/malus conditionnels ;
- électorat transférable ;
- réserves de voix ;
- probabilité/qualité d’alliance ;
- événements entre-deux-tours ;
- potentiel de second tour ;
- cohésion ;
- rejet ;
- momentum.

## 7.3 Mutual exclusion

Une campagne ne doit pas bénéficier pleinement des trois trajectoires.

Créer des flags/mémoires cohérents.

Le choix fort en faveur de A doit pouvoir rendre B/C moins accessibles ou en modifier le coût.

## 7.4 Contrefactuels stricts

Ajouter une expérience dédiée :

Même :

- parti = Horizons ;
- seed ;
- état initial.

Mais politique de décision différente : A/B/C.

Mesurer :

- premier tour ;
- qualification ;
- adversaire de second tour ;
- victoire ;
- réserves de voix ;
- relations ;
- narration ;
- score final ;
- trajectoire.

## 7.5 Critères d’acceptation

- agence Horizons en hausse nette ;
- variance entre profils en hausse ;
- davantage de changements d’adversaire/relations/second tour selon la stratégie ;
- réduction des runs plats sur un corpus plus large ;
- trois familles de campagne effectivement observées ;
- aucune trajectoire strictement dominante ;
- Horizons reste crédiblement fort.

Cible indicative :

- agence > `3,5/10`, idéalement `4–6/10` ;
- divergence de score et d’issue à seed identique en hausse nette.

Ne force pas les chiffres si l’expérience réelle est meilleure sans atteindre exactement la cible.

---

# 8. PHASE C — RENAISSANCE : SORTIR DE L’ARC « HÉRITAGE »

## 8.1 Diagnostic obligatoire

Mesurer avant d’ajouter :

- part des campagnes où l’arc héritage apparaît ;
- part des décisions spécifiques liées à cet arc ;
- fréquence des follow-ups ;
- influence sur `funImmediat` ;
- influence sur `profondeur` ;
- diversité des autres événements spécifiques ;
- similarité avec Horizons/PS/Écologistes.

Déterminer si :

1. le contenu est réellement trop concentré ;
2. le proxy de fun sous-évalue ce contenu ;
3. les deux.

Ne change pas le proxy sans preuve.

## 8.2 Ajouter 2 ou 3 axes narratifs indépendants

Exemples à adapter :

### Axe 1 — Renouvellement de génération

- nouvelle équipe ;
- nouveaux visages ;
- anciens cadres vs renouvellement.

### Axe 2 — Reconquête du centre électoral

- concurrence avec Horizons ;
- concurrence avec Nouvelle Énergie ;
- arbitrage institutionnel/populaire ;
- électorat central volatil.

### Axe 3 — Réseau gouvernemental vs autonomie

- soutien de figures passées ;
- poids des élus ;
- nécessité de construire une candidature autonome.

Une campagne Renaissance doit pouvoir être reconnaissable sans forcément approfondir l’héritage.

## 8.3 Critères Renaissance

- concentration sur héritage en baisse ;
- diversité des timelines en hausse ;
- identité préservée ou améliorée ;
- agence/rejouabilité/variété stratégique non dégradées ;
- fun global restauré ou amélioré sans manipulation du proxy ;
- plusieurs campagnes qualitativement distinctes observables.

---

# 9. PHASE D — TENSION SYSTÉMIQUE DU DERNIER TIERS

Le précédent essai local a échoué.

Ne rajoute pas simplement des points aux événements tardifs.

## 9.1 Analyser le système

Inspecter :

- `eventSelector.ts` ;
- poids par phase ;
- priorité aux follow-ups ;
- événements éligibles dans le dernier tiers ;
- résolution des chaînes ;
- fréquence `major/decisive` ;
- proximité à la qualification ;
- rythme des sondages ;
- caps/clamps ;
- momentum ;
- adversaires.

## 9.2 Hypothèses à tester

Le dernier tiers peut manquer de tension parce que :

- trop de fils restent non résolus ;
- trop d’événements routine restent éligibles ;
- les événements contextuellement décisifs ne sont pas assez favorisés ;
- le jeu traite une course à ±0,5 pt presque comme une course à ±8 pts.

Tester avant de modifier.

## 9.3 Relevance weighting tardif

Évaluer une pondération contextuelle qui augmente modérément, en fin de campagne, la probabilité de :

- résolution d’une chaîne active ;
- duel avec adversaire direct ;
- crise interne non résolue ;
- événement lié au top 2 ;
- enjeu de qualification ;
- conséquence différée arrivée à maturité.

Sans :

- garantir un comeback ;
- favoriser le joueur ;
- supprimer les breathers ;
- augmenter le hasard brut.

## 9.4 Critères

Mesurer sur mêmes seeds :

- intensité dernier décile ;
- retournements ;
- part `major/decisive` ;
- résolutions de chaînes ;
- interactions rival direct ;
- changements de qualification ;
- changements d’issue.

La tension doit augmenter **par pertinence**, pas par chaos.

---

# 10. PHASE E — CHOIX DOMINANTS

## 10.1 `debate_frontrunner_retaliation`

Refonte profonde obligatoire.

Analyser :

- option dominante ;
- cause de la dominance ;
- stats exploitées ;
- absence de cas d’usage des autres options.

Créer trois stratégies réellement différentes, par exemple :

- contre-attaque ;
- pivot présidentiel ;
- esquive/contre-programmation.

Chaque option doit avoir au moins un contexte où elle est rationnellement meilleure.

Utiliser si pertinent :

- relation ;
- rejet ;
- momentum ;
- crédibilité ;
- cohésion ;
- position dans les sondages ;
- trajectoire idéologique.

## 10.2 Nouveaux follow-ups suspects

- `party_horizons_founder_blessing`
- `party_horizons_founder_revenge`
- `party_renaissance_legacy_credited`
- `rare_blackout_leak_resurfaces`

Pour chacun :

1. augmenter le volume statistique ;
2. confirmer ou infirmer la dominance ;
3. ne refondre que si le signal est robuste.

## 10.3 Critères

- aucun choix ciblé confirmé ne reste >80 % sans justification politique forte ;
- aucune égalisation artificielle ;
- plusieurs options contextuellement rationnelles ;
- agents plausibles analysés séparément des agents chaos/contrarian.

---

# 11. PHASE F — CORPUS STATISTIQUE RENFORCÉ

Certains événements nouveaux n’ont que 6 à 27 occurrences.

Créer un corpus ciblé qui augmente **l’éligibilité observée**, jamais le résultat.

Important :

- ne pas hardcoder le déclenchement ;
- ne pas modifier les probabilités de production ;
- utiliser davantage de seeds ;
- filtrer ensuite les runs où l’événement est naturellement rencontré.

Pour chaque événement suspect :

- viser ~100 occurrences si raisonnablement possible ;
- sinon documenter honnêtement la limite.

Produire :

- taux de sélection ;
- intervalle de confiance ;
- effets moyens ;
- distribution par agent ;
- contexte ;
- outcome final.

---

# 12. PHASE G — STABILISER LE TEST FLAKY / CI

Test :

`game.test.ts > termine des campagnes variées sans état invalide`

Il passe isolément mais dépasse 10 s sous charge parallèle.

Objectif :

> rendre la suite complète reproductiblement verte sans masquer une vraie lenteur.

Diagnostiquer :

- contention CPU ;
- nombre de simulations ;
- hooks ;
- isolation ;
- workers Vitest ;
- timeout ;
- setup dupliqué ;
- appels coûteux.

Solutions acceptables :

- optimiser ;
- réduire un corpus redondant tout en gardant la couverture ;
- déplacer un test lourd dans une suite dédiée ;
- limiter la concurrence pour ce fichier ;
- ajuster le timeout uniquement si le coût est intrinsèquement légitime et documenté.

Interdit :

- retry silencieux ;
- supprimer le test ;
- augmenter arbitrairement à 60 s ;
- ignorer l’échec.

Critère :

- `npm run test` vert 5 fois consécutives ;
- aucune perte de couverture fonctionnelle ;
- durée documentée.

---

# 13. TESTS CONTREFACTUELS OBLIGATOIRES

Créer une suite dédiée à cette passe.

## Horizons

- même seed ;
- état initial identique ;
- trajectoire A/B/C ;
- mesurer divergence.

## Renaissance

- même seed ;
- héritage vs autre arc ;
- mesurer diversité.

## Late game

- même seed ;
- baseline vs nouveau relevance weighting ;
- mesurer la pertinence tardive.

## Choix dominants

- même état ;
- chaque option ;
- effet immédiat + différé + électoral.

---

# 14. MÉTRIQUES À PRODUIRE

Créer dans `audit-results/targeted-pass/post/` :

## Horizons

- fun ;
- agence ;
- identité ;
- qualification ;
- victoire ;
- victoire|qualification ;
- variance par agent ;
- changement d’issue seed-identique ;
- types de trajectoire ;
- adversaire second tour ;
- taux de runs plats.

## Renaissance

- fun ;
- identité ;
- agence ;
- profondeur ;
- funImmediat ;
- rejouabilité ;
- variété stratégique ;
- part arc héritage ;
- part autres arcs ;
- similarité inter-partis.

## Late game

- intensity ;
- rank reversals ;
- qualification reversals ;
- decisive event share ;
- chain resolution share ;
- direct-rival interactions ;
- delayed consequence resolutions.

## Choix

- dominance ;
- entropy ;
- CI ;
- outcome by context ;
- outcome by agent.

## Tests

- full-suite pass rate ;
- runtime ;
- targeted test runtime.

---

# 15. VALIDATION MANUELLE

Jouer au minimum :

### Horizons
- continuité ;
- rupture ;
- coalition.

### Renaissance
- héritage ;
- campagne sans héritage si possible ;
- opportuniste.

### Late game
- une course serrée ;
- une course largement devant ;
- une campagne outsider proche du seuil.

Pour chaque run :

- histoire en 3-5 phrases ;
- bifurcation la plus visible ;
- décision réellement déterminante ;
- tension du dernier tiers ;
- second tour ;
- sensation d’agence.

---

# 16. CRITÈRES DE NON-RÉGRESSION

Conserver au minimum :

- rare chains génériques >= `4/9` ;
- rares exceptionnels >= `4` ;
- world/scandal frustrants <= `4/24` ;
- nouveauté partie 10 autour de `13 %` ou mieux ;
- narrativité ≥3 signaux autour de `81 %` ou mieux ;
- répétitions intra-run = `0` ;
- second tour distinct ;
- défaite jouable ;
- déterminisme ;
- data validation ;
- build ;
- typecheck ;
- lint.

---

# 17. LIVRABLE PRINCIPAL

Créer à la racine :

`TARGETED_GAMEPLAY_PASS_REPORT.md`

Structure :

1. Résumé exécutif
2. Baseline
3. Horizons — diagnostic
4. Horizons — trajectoires A/B/C
5. Horizons — causalité
6. Renaissance — diagnostic
7. Renaissance — nouveaux axes
8. Renaissance — diversité
9. Tension systémique
10. Event selector / relevance weighting
11. Choix dominants
12. Corpus statistique renforcé
13. CI / test flaky
14. Simulations
15. Contrefactuels
16. Playtests
17. Non-régressions
18. Comparaison avant/après
19. Problèmes encore ouverts
20. Verdict final

---

# 18. TABLEAU AVANT/APRÈS OBLIGATOIRE

| Mesure | Avant | Après | Δ | Verdict |
|---|---:|---:|---:|---|
| Agence Horizons | 2,0/10 | | | |
| Fun Horizons | 49,3/100 | | | |
| Identité Horizons | 6,0/10 | | | |
| Runs Horizons plats | 6/10 bottom corpus | | | |
| Fun Renaissance | 56,9/100 | | | |
| Identité Renaissance | 4,7/10 | | | |
| Agence Renaissance | 6,8/10 | | | |
| Rejouabilité Renaissance | 7,4/10 | | | |
| Tension dernier décile | 4,909 | | | |
| Retournements dernier décile | 0,120 | | | |
| debate_frontrunner_retaliation dominance | 0,922 | | | |
| Horizons blessing dominance | 0,929 | | | |
| Horizons revenge dominance | 0,889 | | | |
| Renaissance legacy dominance | 0,857 | | | |
| Rare blackout dominance | 1,000 (faible n) | | | |
| npm run test | 155/156 sous charge | | | |

---

# 19. COMMITS

Créer des commits atomiques locaux :

- baseline ;
- Horizons structure ;
- Renaissance diversification ;
- late-game relevance ;
- dominant choices ;
- statistical harness ;
- CI stabilization ;
- post-audit.

Ne rien pousser.

---

# 20. VERDICT FINAL TERMINAL

Afficher :

```text
TARGETED GAMEPLAY PASS — VERDICT

HORIZONS
Agence avant :
Agence après :
Trajectoires réellement distinctes :
Runs plats avant :
Runs plats après :
Verdict :

RENAISSANCE
Fun avant :
Fun après :
Diversité d’arcs avant :
Diversité après :
Verdict :

TENSION FIN DE CAMPAGNE
Intensité avant :
Après :
Retournements avant :
Après :
Résolutions de chaînes tardives :
Verdict :

CHOIX DOMINANTS
debate_frontrunner_retaliation :
Horizons blessing :
Horizons revenge :
Renaissance legacy :
Rare blackout :
Verdict :

ROBUSTESSE STATISTIQUE
Occurrences minimales obtenues :
Intervalles de confiance :
Verdict :

CI
Suite complète :
5 runs consécutifs :
Durée :
Verdict :

NON-RÉGRESSIONS
Rares :
Rejouabilité :
Narrativité :
Répétitions :
Second tour :
Déterminisme :
Build/lint/typecheck :

Commits locaux :
Problèmes encore ouverts :
```

---

# 21. DÉMARRAGE

Commence immédiatement par :

1. lire intégralement les rapports ;
2. établir la baseline ;
3. diagnostiquer précisément l’agence Horizons ;
4. concevoir les trois trajectoires exclusives ;
5. implémenter et mesurer ;
6. passer ensuite à Renaissance ;
7. traiter la tension systémique ;
8. refondre les choix dominants confirmés ;
9. augmenter le corpus ;
10. stabiliser la CI ;
11. relancer l’ensemble des audits ciblés.

Ne demande pas de validation intermédiaire à l’utilisateur.

Ne touche pas à la forme visuelle.

Ne pousse rien vers le distant.
