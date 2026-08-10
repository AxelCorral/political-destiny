# PROMPT MAÎTRE — CALIBRATION FINALE DU MODÈLE ÉLECTORAL ET DU SECOND TOUR
## Projet : « Vers l’Élysée »
### Mission post-`ELECTORAL_COHERENCE_FIXES_REPORT.md`

Tu interviens comme **lead game systems designer**, **analyste électoral**, **senior TypeScript simulation engineer**, **statisticien**, **QA lead**, **spécialiste des systèmes de transfert de voix** et **auditeur indépendant**.

La mission précédente a corrigé avec succès trois défauts P1 majeurs :

1. compression excessive du premier tour ;
2. événements de second tour incohérents avec l’adversaire réellement qualifié ;
3. sondage/sidebar post-premier-tour calculé avec des candidats déjà éliminés.

Elle a également nettoyé les apostrophes résiduelles et remis toute la suite de tests au vert.

Cette nouvelle mission ne doit PAS rouvrir aveuglément ces problèmes.

Elle doit traiter les **questions encore ouvertes après le correctif**, en particulier :

- le `RUNOFF_SHARE_DAMPING = 0.62`, explicitement documenté comme mécanisme resserrant les seconds tours autour de 50/50 ;
- la crédibilité réelle des duels de second tour ;
- la diversité des marges de second tour ;
- les reports de voix / réserves / rejet / alliances / consignes ;
- la possibilité que le nouveau `DISPERSION_POWER = 2` ait des effets secondaires sur le premier tour, le fun ou l’agence ;
- la plausibilité des rapports de force initiaux par rapport au contexte politique réel ;
- l’absence de règle éditoriale automatique imposant `party_not_opponent` aux futurs événements de second tour ;
- les dernières dettes de qualité / robustesse identifiées par le rapport.

L’objectif est d’obtenir un moteur électoral final qui soit :

> **crédible sans être prédictif, varié sans être chaotique, incertain sans être arbitraire, et cohérent au premier comme au second tour.**

---

# 1. DOCUMENTS À LIRE EN ENTIER

Avant toute action, lire intégralement :

- `ELECTORAL_COHERENCE_FIXES_REPORT.md`
- `AUDIT_ELECTORAL_COHERENCE.md`
- `TARGETED_GAMEPLAY_PASS_REPORT.md`
- `FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md`
- `AUDIT_FUN_REJOUABILITE.md`
- `FUN_IMPROVEMENTS_REPORT.md`
- `AUDIT_POST_CORRECTIONS.md`
- `POST_AUDIT_FIXES.md`
- `GAMEPLAY_AUDIT.md`
- `PARTY_GAMEPLAY_IDENTITIES.md`
- `V2_DECISIONS.md`
- `V2_CHANGELOG.md`
- documentation électorale / scoring / contenu.

Inspecter au minimum :

- `src/game/engine/electorate.ts`
- `src/game/engine/election.ts`
- `src/game/engine/scoring.ts`
- `src/game/engine/polls.ts`
- `src/game/engine/game.ts`
- logique de `runoffAppeal`
- `RUNOFF_SHARE_DAMPING`
- `transferability`
- consignes de vote
- alliances
- relations
- rejet
- idéologie
- cohérence
- mobilisation
- crédibilité
- événements entre-deux-tours
- conditions `party_not_opponent`
- schémas / validateurs de contenu.

---

# 2. ÉTAT DE RÉFÉRENCE À PRÉSERVER

La mission précédente a produit :

```text
Courses comprimées T1 :
76,2 % → 17,8 %

Favori dominant :
0 % → 22,5 %

Course fragmentée :
89,2 % → 47,0 %

Tripartite :
0,3 % → 2,7 %

Percée outsider :
0,9 % → 3,1 %

Score maximal observé :
23,6 % → 37,5 %

Runoff events incohérents :
10/13 → 0/13

Sidebar sync failures :
systémique → 0

Text-quality issues :
54 → 0

Tests :
236 unitaires verts
29 E2E verts
build vert
```

Le correctif de dispersion repose sur :

```text
DISPERSION_POWER = 2
```

appliqué uniformément à `nationalLatentSupport`.

Ne le modifie pas sans preuve.

---

# 3. PROBLÈMES ENCORE OUVERTS

Le rapport final documente explicitement :

## P1/P2 majeur — second tour potentiellement trop resserré

```text
RUNOFF_SHARE_DAMPING = 0.62
```

resserre volontairement les résultats vers 50/50.

Le playtest LR vs Horizons a même produit un résultat final de `50,0 / 50,0`.

Il faut maintenant déterminer :

- si ce resserrement est réaliste ;
- s’il est trop fréquent ;
- s’il gomme les différences de rejet / transferts / alliances ;
- s’il rend le second tour artificiellement dramatique ;
- s’il réduit trop les effets des choix entre les deux tours.

## P2 — plausibilité externe des rapports de force

La précédente mission a corrigé la **dispersion structurelle**.

Elle n’a pas démontré que la hiérarchie initiale entre partis correspond réellement à un scénario politiquement plausible en 2026/2027.

Il faut distinguer :

```text
bonne dispersion mathématique
≠
bonne calibration politique
```

## P2 — nouvelle condition non protégée éditorialement

La condition :

```text
party_not_opponent
```

fonctionne aujourd’hui, mais rien n’oblige automatiquement un futur événement de second tour mentionnant un tiers à l’utiliser.

C’est une dette de validation.

## P3 — effets secondaires du nouveau premier tour

Le changement de dispersion est important.

Il faut vérifier qu’il n’a pas :
- réintroduit une domination excessive du parti de départ ;
- réduit l’agence ;
- cassé certains partis outsiders ;
- modifié excessivement les taux de qualification/victoire ;
- détérioré le fun ;
- créé des leaders trop stables.

---

# 4. STRUCTURE DE MISSION : AUDIT PUIS CORRECTION

Deux blocs stricts :

```text
BLOC A — AUDIT FINAL
→ métriques
→ diagnostic
→ rapport intermédiaire
→ gate

BLOC B — CORRECTIONS CONFIRMÉES UNIQUEMENT
→ validation massive
→ playtests
→ rapport final
```

Ne corrige rien avant le gate.

---

# 5. BLOC A — AUDIT COMPLET DU SECOND TOUR

## 5.1 Corpus

Simuler au minimum :

- `20 000` campagnes complètes si le temps raisonnable le permet ;
- sinon `10 000` minimum.

Utiliser :
- les 9 partis existants ;
- agents plausibles ;
- seeds déterministes ;
- moteur de production.

Archiver toutes les paires de finalistes.

---

# 6. MATRICE COMPLÈTE DES DUELS

Pour chaque matchup réellement rencontré :

```text
LFI vs PS
LFI vs RN
LR vs Horizons
RN vs Renaissance
...
```

Mesurer :

- nombre d’occurrences ;
- victoire candidat A/B ;
- score moyen ;
- médiane ;
- p10 / p25 / p75 / p90 ;
- marge moyenne ;
- marge médiane ;
- fréquence <0,5 pt ;
- fréquence <1 pt ;
- fréquence <2 pts ;
- fréquence >5 pts ;
- fréquence >10 pts ;
- fréquence exacte ou quasi exacte 50/50 ;
- inversion du favori entre début et fin de l’entre-deux-tours.

Créer :

```text
runoff-matchups.csv
runoff-margin-distribution.csv
runoff-close-races.csv
```

---

# 7. TESTER SI LE SECOND TOUR EST ARTIFICIELLEMENT « SCRIPTÉ SERRÉ »

Mesurer globalement :

```text
P(|margin| < 0,5)
P(|margin| < 1)
P(|margin| < 2)
P(|margin| < 5)
P(|margin| > 10)
```

Mesurer également la variance des scores.

Comparer :

### A. Production actuelle
`RUNOFF_SHARE_DAMPING = 0.62`

### B. Harness audit uniquement
tester par exemple :

```text
0
0.25
0.4
0.5
0.62
0.75
1.0
```

ou l’interprétation correcte selon la formule réelle.

Ne change pas la production durant cette expérience.

Objectif :
voir exactement comment le damping modifie :
- marges ;
- taux de victoire ;
- capacité d’un favori à dominer ;
- influence des reports ;
- influence de l’entre-deux-tours ;
- fréquence des quasi-ties.

---

# 8. DÉCOMPOSITION DU SCORE DE SECOND TOUR

Pour chaque finaliste, tracer la contribution de :

- socle du premier tour ;
- proximité idéologique ;
- `transferability` ;
- rejet ;
- endorsements / consignes ;
- alliances ;
- relations ;
- crédibilité ;
- mobilisation ;
- cohérence ;
- événements d’entre-deux-tours ;
- campagne du second tour ;
- bruit aléatoire ;
- damping final.

Créer un diagnostic permettant de répondre :

> Qu’est-ce qui fait réellement gagner un second tour aujourd’hui ?

Et surtout :

> Le damping final annule-t-il une partie excessive du travail effectué en amont ?

---

# 9. AGENCE SPÉCIFIQUE ENTRE LES DEUX TOURS

Faire des contrefactuels stricts.

Même :
- seed ;
- finalistes ;
- état au soir du premier tour.

Changer uniquement les choix entre les deux tours.

Mesurer :
- score final ;
- marge ;
- victoire ;
- relation ;
- transfert ;
- mobilisation.

Minimum :
- 500 états de second tour ;
- plusieurs politiques de décision.

Calculer :

```text
% de duels où les choix de second tour changent le vainqueur
delta moyen de score
delta p90
```

Si l’effet est quasi nul, problème.

S’il est énorme et rend tout premier tour secondaire, problème également.

---

# 10. SECOND TOUR : VARIÉTÉ DES HISTOIRES

Classifier :

### A. Duel serré
<2 pts

### B. Victoire claire
2–7 pts

### C. Large victoire
>7 pts

### D. Comeback
joueur derrière après T1, gagne

### E. Effondrement
joueur devant après T1, perd nettement

### F. Coalition décisive
alliance/endorsement change fortement les reports

### G. Rejet décisif
un finaliste perd malgré un meilleur premier tour

### H. Mobilisation décisive

Mesurer la fréquence.

Le moteur ne doit pas produire presque uniquement A.

---

# 11. AUDIT DES 50,0 / 50,0

Rechercher explicitement :

- égalités exactes ;
- valeurs arrondies 50,0/50,0 ;
- valeurs internes égales ;
- mécanisme de départage.

Pour chaque tie :
- score interne avant arrondi ;
- score après damping ;
- score final ;
- règle de départage.

Vérifier qu’un affichage 50,0/50,0 ne cache pas un vainqueur arbitraire incompréhensible.

Si nécessaire, recommander davantage de précision ou une logique de départage claire.

---

# 12. PLAUSIBILITÉ POLITIQUE DU POINT DE DÉPART

Cette fois, faire réellement une comparaison externe.

Si internet disponible :

Utiliser plusieurs sources récentes et sérieuses datées.

Priorité :
- agrégations / instituts reconnus ;
- sources primaires des instituts ;
- plusieurs scénarios si les candidatures 2027 sont encore incertaines.

Ne pas supposer qu’un parti = un candidat précis si ce candidat n’est pas officiellement connu.

Construire des **fourchettes par bloc/parti**, pas des chiffres absolus.

Le jeu utilise des candidats fictifs.

La calibration doit donc porter sur la **force du mouvement / espace politique**, pas sur une personnalité réelle particulière.

Créer :

```text
REAL_WORLD_CALIBRATION.md
```

avec :
- sources ;
- dates ;
- hypothèses ;
- fourchettes ;
- limites.

---

# 13. COMPARER LE JEU AUX FOURCHETTES RÉELLES

Pour chaque parti :

- score initial moyen du jeu ;
- p10/p90 ;
- fourchette externe ;
- écart ;
- statut :
  - plausible
  - un peu haut
  - un peu bas
  - nettement incohérent
  - impossible à conclure.

Ne force pas tous les partis dans une photographie unique.

Le jeu doit conserver :
- variation ;
- candidats fictifs ;
- scénario alternatif.

---

# 14. TESTER `DISPERSION_POWER = 2` PLUS PROFONDÉMENT

Le correctif a clairement supprimé la compression.

Mais tester sa robustesse.

Harness uniquement :

```text
1.6
1.8
2.0
2.2
2.4
```

Comparer :

- crédibilité initiale ;
- compression ;
- favoris dominants ;
- outsiders ;
- qualification ;
- victoire ;
- party eta² ;
- agent eta² ;
- progression ;
- fun proxy ;
- archétypes de course.

Ne change pas `2.0` simplement parce qu’une autre valeur semble « plus jolie ».

Chercher un plateau de robustesse.

---

# 15. NON-RÉGRESSION FUN / AGENCE APRÈS DISPERSION

Relancer une version ciblée des audits précédents.

Mesurer :

### Premier tour
- eta² parti
- eta² stratégie
- interaction
- residual

### Final score
mêmes mesures.

### Outcomes
- qualification par parti
- victoire par parti
- victoire conditionnelle à qualification

### Agency
- divergence entre agents à seed identique
- changements d’issue
- counterfactual decisions.

Comparer aux dernières baselines disponibles.

Si le nouveau moteur rend le parti de départ à nouveau trop déterminant, le signaler.

---

# 16. OUTSIDERS

La nouvelle dispersion permet à Reconquête d’être <8 % dans une part importante des runs.

Vérifier que l’expérience reste jouable.

Mesurer :
- progression possible ;
- qualification ;
- best-case ;
- milestones ;
- fun ;
- campagnes mortes.

Ne buffe pas automatiquement un outsider.

Un outsider peut rester faible tout en étant intéressant.

---

# 17. FAVORIS

Vérifier qu’un favori dominant à 22–30 % :

- peut perdre ;
- peut commettre des erreurs ;
- peut être rattrapé ;
- ne gagne pas automatiquement.

Mesurer :

```text
P(victoire | favori dominant T1)
P(qualification | favori dominant)
P(perte après avance >5)
```

La présence de favoris doit augmenter le réalisme sans rendre la partie prédéterminée.

---

# 18. VALIDATION AUTOMATIQUE DE `party_not_opponent`

Créer une vraie règle de qualité de contenu.

Objectif :

tout événement :
- de phase second tour ;
- qui référence explicitement un parti tiers dans une mécanique d’alliance, endorsement, électorat, négociation ou report ;

doit être vérifié automatiquement.

Approches possibles :
- métadonnée typée explicite ;
- validation sur `referencedPartyIds` ;
- règle dans `CONTENT_QUALITY_RULES`;
- helper de construction.

Éviter une heuristique fragile basée uniquement sur le texte.

Créer test de non-régression.

Un futur développeur doit avoir du mal à réintroduire le bug.

---

# 19. AUDIT DES ÉVÉNEMENTS DE SECOND TOUR APRÈS LE CORRECTIF

Au-delà du simple `party_not_opponent`, vérifier :

- tiers réellement éliminé ;
- cohérence idéologique ;
- alliance déjà active ;
- endorsement contradictoire ;
- parti déjà hostile ;
- candidat remplacé ;
- relation mémorisée.

Identifier les événements qui sont techniquement éligibles mais narrativement absurdes.

---

# 20. UX DU SCORE DE SECOND TOUR

Sans refonte graphique :

vérifier que partout :

- les deux finalistes sont clairement identifiés ;
- le score affiché somme à ~100 ;
- la sidebar reflète le duel ;
- les pourcentages ne changent pas de définition sans label ;
- un 50,0/50,0 est compréhensible ;
- résultat final et sondage ne sont pas confondus.

Si un label manque, correction UI minimale autorisée.

---

# 21. BLOC A — RAPPORT INTERMÉDIAIRE

Créer :

```text
AUDIT_RUNOFF_FINAL_CALIBRATION.md
```

avec :

1. Résumé
2. État du premier tour post-dispersion
3. Matrice des duels
4. Distribution des marges
5. Damping
6. Décomposition des reports
7. Agence entre-deux-tours
8. Ties / 50-50
9. Plausibilité réelle initiale
10. Robustesse DISPERSION_POWER
11. Fun / agence non-régression
12. Outsiders
13. Favoris
14. Qualité des événements runoff
15. Validation `party_not_opponent`
16. UX runoff
17. Problèmes P0-P4
18. Recommandations.

Créer :

```text
audit-results/runoff-final-calibration/
  baseline/
  runoff-matchups.csv
  runoff-margin-distribution.csv
  runoff-close-races.csv
  runoff-components.csv
  runoff-counterfactuals.csv
  runoff-archetypes.csv
  damping-sensitivity.csv
  dispersion-power-sensitivity.csv
  real-world-calibration.csv
  party-agency-regression.csv
  runoff-content-quality.csv
  ties.csv
  charts/
  README.md
```

---

# 22. GATE

Avant toute correction :

```text
BLOC A TERMINÉ — CALIBRATION SECOND TOUR DIAGNOSTIQUÉE — DÉMARRAGE BLOC B
```

Ne passer au Bloc B qu’après :
- audit terminé ;
- métriques sauvegardées ;
- causes racines identifiées ;
- effets du damping compris ;
- non-régression premier tour mesurée.

---

# 23. BLOC B — CORRIGER LE DAMPING UNIQUEMENT SI NÉCESSAIRE

Si `0.62` est confirmé trop fort :

corriger le mécanisme de manière systémique.

Possibilités à ÉVALUER, pas à appliquer aveuglément :

### A. Damping moins fort

### B. Damping non linéaire
plus fort sur écarts extrêmes, faible sur écarts raisonnables.

### C. Diminishing returns des reports
agir sur la cause plutôt que compresser la sortie finale.

### D. Damping dépendant de l’incertitude
si les reports sont très inconnus.

### E. Suppression du damping + recalibration des coefficients de transfert

Choisir la solution la plus interprétable.

Interdit :
- hardcode par parti ;
- forcer 50/50 ;
- limiter arbitrairement à 55/45 ;
- modifier le résultat après coup pour créer du suspense.

---

# 24. CIBLE SECOND TOUR

Pas de cible politique rigide.

Mais le corpus devrait contenir :

- beaucoup de 48–52 ;
- aussi des 45–55 ;
- parfois des 40–60 ;
- très rarement des écarts plus larges si les conditions le justifient.

Un 50/50 exact doit rester rare.

La distribution doit venir des mécanismes, pas d’un objectif artificiel.

---

# 25. RECALIBRATION INITIALE SI NÉCESSAIRE

Si comparaison externe montre des incohérences fortes :

ajuster les **baselines structurelles des partis**, avec documentation.

Ne pas lier le jeu à un sondage quotidien.

Préférer :

```text
politicalBaselineVersion
calibrationDate
sourceRange
```

Documenter le scénario.

La calibration doit rester stable plusieurs mois, pas devenir un live polling simulator.

---

# 26. GARDE-FOU FUTUR POUR LA CALIBRATION

Créer éventuellement un document :

```text
docs/ELECTORAL_CALIBRATION.md
```

avec :
- date de calibration ;
- logique ;
- fourchettes ;
- sources ;
- paramètres principaux ;
- règles de recalibration ;
- éléments à ne pas toucher sans audit.

---

# 27. TESTS OBLIGATOIRES

Ajouter :

### Runoff
- distribution non dégénérée ;
- aucune somme ≠100 ;
- tie behavior ;
- finalistes only ;
- damping invariants.

### Counterfactual
- choix du second tour peuvent avoir un effet.

### Content
- `party_not_opponent` obligatoire quand nécessaire.

### Calibration
- bounds structurelles raisonnables ;
- pas de compression massive réintroduite.

### Regression
- determinism ;
- no NaN ;
- no invalid state.

---

# 28. PLAYTESTS MANUELS

Jouer :

1. duel serré LR vs Horizons ;
2. RN vs gauche ;
3. centre vs gauche ;
4. favori dominant qui gagne ;
5. favori dominant qui perd ;
6. comeback entre-deux-tours ;
7. duel avec alliance importante ;
8. outsider qualifié.

Pour chacun :
- score T1 ;
- score entrée runoff ;
- évolution ;
- choix ;
- transferts ;
- résultat ;
- marge ;
- sentiment de cohérence.

---

# 29. NON-RÉGRESSION

Conserver :

```text
compression T1 <= ~20 %
favoris dominants présents
course fragmentée non obligatoire
runoff incohérent = 0
sidebar sync = 0 erreur
apostrophes = 0 issue
236+ tests verts
29+ E2E verts
visual regression verte
build vert
```

Et vérifier :
- fun ;
- agence ;
- game feel ;
- mobile.

---

# 30. RAPPORT FINAL

Créer :

```text
FINAL_ELECTORAL_CALIBRATION_REPORT.md
```

Structure :

1. Résumé exécutif
2. Baseline
3. Second tour avant
4. Damping
5. Reports
6. Agence runoff
7. Marges
8. Matchups
9. Ties
10. Calibration réelle
11. DISPERSION_POWER
12. Premier tour non-régression
13. Outsiders/favoris
14. Validation contenu
15. Corrections
16. Simulations post
17. Playtests
18. Avant/après
19. Non-régressions
20. Problèmes ouverts
21. Verdict.

---

# 31. TABLEAU AVANT/APRÈS

| Mesure | Avant | Après | Verdict |
|---|---:|---:|---|
| Marge runoff moyenne | | | |
| Médiane marge runoff | | | |
| Runoff <0,5 pt | | | |
| Runoff <1 pt | | | |
| Runoff <2 pts | | | |
| Runoff >5 pts | | | |
| Runoff >10 pts | | | |
| 50,0/50,0 affichés | | | |
| Choix runoff changent vainqueur | | | |
| Contribution damping moyenne | | | |
| Favori T1 gagne runoff | | | |
| Comeback runoff | | | |
| Compression T1 | 17,8 % | | |
| Favori dominant T1 | 22,5 % | | |
| Party eta² | | | |
| Strategy eta² | | | |
| Runoff incohérents | 0 | | |
| Validation party_not_opponent | manuelle | automatique | |
| Tests | 236/236 | | |
| E2E | 29/29 | | |

---

# 32. VERDICT TERMINAL

Afficher :

```text
FINAL ELECTORAL CALIBRATION — VERDICT

PREMIER TOUR
Dispersion :
Compression :
Favoris :
Outsiders :
Crédibilité :
Verdict :

SECOND TOUR
Marge moyenne :
Marge médiane :
<1 pt :
>5 pts :
>10 pts :
50/50 exact :
Verdict :

RUNOFF DAMPING
Avant : 0.62
Après :
Conservé/modifié :
Raison :
Verdict :

REPORTS DE VOIX
Idéologie :
Rejet :
Alliances :
Relations :
Mobilisation :
Poids relatif du damping :
Verdict :

AGENCE ENTRE-DEUX-TOURS
Delta moyen :
% vainqueur changé :
Verdict :

CALIBRATION RÉELLE
Date :
Sources :
Partis plausibles :
Écarts importants :
Verdict :

DISPERSION_POWER
Avant : 2
Après :
Robustesse :
Verdict :

CONTENT QUALITY
party_not_opponent :
Validation automatique :
Événements runoff incohérents :
Verdict :

NON-RÉGRESSIONS
Fun :
Agence :
Game feel :
Compression T1 :
Sidebar :
Textes :
Tests :
E2E :
Visual :
Build :

Commits locaux :
Problèmes encore ouverts :
```

---

# 33. RÈGLE FINALE

Ne cherche pas à rendre tous les seconds tours serrés.

Ne cherche pas non plus à produire artificiellement de larges victoires.

Le moteur doit laisser émerger :

- duel serré ;
- victoire claire ;
- comeback ;
- rejet décisif ;
- coalition décisive ;
- favori qui confirme ;
- favori qui échoue.

Le suspense doit venir de l’état de la campagne, pas d’un compresseur de score.

Le hasard reste volontaire.

Les choix ne doivent pas devenir parfaitement prévisibles.

Commence immédiatement.
