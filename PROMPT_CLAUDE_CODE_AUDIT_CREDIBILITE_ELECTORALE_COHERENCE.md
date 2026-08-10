# PROMPT MAÎTRE — AUDIT DE CRÉDIBILITÉ ÉLECTORALE, DYNAMIQUE DE COURSE ET COHÉRENCE CONTEXTUELLE
## Projet : « Vers l’Élysée »

Tu interviens comme **lead game systems designer**, **analyste électoral**, **spécialiste des simulations probabilistes**, **QA engineer**, **senior TypeScript gameplay engineer** et **auditeur indépendant**.

Cette mission part de retours humains réels de playtest :

- certains rapports de force initiaux paraissent peu crédibles ;
- plusieurs partis peuvent démarrer autour de 15–16 %, donnant une impression artificiellement compacte ;
- pendant certaines parties, aucun candidat ne se détache vraiment : beaucoup restent dans une bande approximative 7–16 % ;
- des événements deviennent incohérents avec l’état réel de la course, par exemple proposer quoi faire « des électeurs Horizons » ou évoquer une alliance avec Horizons alors que Horizons est précisément l’adversaire du joueur au second tour ;
- certains pourcentages affichés dans la sidebar ne semblent pas basculer correctement vers le second tour ;
- un écran « État de la course » peut rester dans une logique de premier tour après le premier tour ;
- certaines apostrophes ou formulations françaises sont cassées/incohérentes.

Cette mission doit déterminer si ces observations sont des bugs isolés, des problèmes systémiques, des artefacts de quelques graines, des conséquences normales du moteur, ou de véritables défauts de crédibilité/cohérence.

# 1. NATURE DE LA MISSION

C’est d’abord un **audit fonctionnel et systémique**.

Ne corrige pas le jeu pendant la phase d’audit.

Tu peux créer scripts, harnesses, simulations, tests, captures, rapports, CSV/JSON et instrumentation de lecture seule.

Cette mission comporte deux blocs stricts :

```text
BLOC A — AUDIT
→ rapport intermédiaire
→ gate
BLOC B — CORRECTIONS CIBLÉES
→ seulement après audit terminé
```

Le but est d’éviter de corriger à l’aveugle.

# 2. DOCUMENTS À LIRE AVANT TOUT

Lire intégralement les fichiers disponibles parmi :

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
- README
- documentation de la simulation électorale.

Inspecter ensuite notamment :

- `src/game/data/parties.ts`
- moteur d’initialisation des intentions de vote
- `scoring.ts`
- `election.ts`
- `game.ts`
- `eventSelector.ts`
- second tour / runoff
- transferts
- réserves
- potentiel de soutien
- sondages
- état de campagne
- UI/sidebar électorale
- `RaceBulletinScreen`
- résultats premier tour
- entre-deux-tours
- événements d’alliance/endorsement/transfers
- conditions d’éligibilité des événements
- tous les tests E2E liés au premier/second tour.

# 3. CONSIGNER L’ÉTAT INITIAL

Avant toute modification :

- branche
- commit
- `git status`
- Node/npm
- nombre de partis
- nombre d’événements
- seeds disponibles
- tests existants
- scripts d’audit existants.

Exécuter :

```bash
npm run lint
npm run typecheck
npm run data:validate
npm run test
npm run build
npx playwright test
```

Documenter tout échec préexistant.

# 4. QUESTION CENTRALE

Le moteur produit-il une présidentielle qui ressemble à une **course électorale crédible et variée**, ou à un système qui compresse artificiellement les candidats dans une bande étroite ?

Répondre notamment à :

1. Les rapports de force initiaux sont-ils plausibles ?
2. Les partis sont-ils trop proches au départ ?
3. Les intentions convergent-elles artificiellement ?
4. Les favoris peuvent-ils réellement se détacher ?
5. Les outsiders peuvent-ils réellement s’effondrer ou percer ?
6. Existe-t-il plusieurs formes de présidentielle ?
7. Le top 2 change-t-il de manière crédible ?
8. Les scores extrêmes sont-ils trop rares ?
9. Le moteur contient-il des clamps/caps qui écrasent la distribution ?
10. Le mécanisme de normalisation rapproche-t-il artificiellement tous les candidats ?
11. Les effets des événements sont-ils trop petits par rapport au nombre de candidats ?
12. Les adversaires autonomes se neutralisent-ils mutuellement ?
13. Le bruit des sondages masque-t-il ou écrase-t-il les vraies dynamiques ?
14. Le second tour réutilise-t-il parfois des données du premier tour ?
15. Les événements de second tour utilisent-ils toujours le bon adversaire ?
16. Les textes générés restent-ils cohérents avec l’état réel ?
17. L’UI utilise-t-elle une source de vérité électorale unique ?

# 5. CRÉDIBILITÉ DU POINT DE DÉPART

Le jeu n’a pas besoin de reproduire au dixième près un sondage réel. Il doit cependant produire un paysage reconnaissable et plausible.

Évaluer :
- hiérarchie initiale
- écarts
- favoris
- outsiders
- dispersion
- concentration du top 3.

Si l’environnement permet un accès internet fiable :
- rechercher plusieurs sources publiques récentes de sondages / agrégations présidentielles françaises ;
- noter la date exacte ;
- conserver les sources ;
- ne pas utiliser une seule enquête comme vérité absolue ;
- produire plutôt une fourchette plausible.

Si internet n’est pas disponible :
- ne pas inventer de chiffres contemporains ;
- travailler uniquement avec la cohérence interne et documenter cette limite.

Mesurer pour chaque parti :
- moyenne initiale
- médiane
- min/max
- écart au leader
- position moyenne
- variance.

Mesurer aussi :
- spread top1-top9
- spread top1-top3
- écart-type transversal
- concentration top2/top3.

# 6. AUDIT DE LA DISPERSION ÉLECTORALE

Faire un corpus massif avec le moteur de production.

Minimum :
- 10 000 campagnes si raisonnable ;
- sinon au moins 5 000.

Utiliser :
- mêmes agents plausibles des audits précédents
- seeds déterministes
- tous les partis jouables.

Snapshots :
- début
- 25 %
- 50 %
- 75 %
- dernier bulletin avant premier tour
- résultat premier tour.

Pour chaque snapshot calculer :

- score leader
- score 2e
- score 3e
- score dernier
- écart top1-top2
- écart top1-top3
- écart-type
- nombre candidats >20 %
- >18 %
- >15 %
- <10 %
- <7 %
- concentration top2
- concentration top3.

# 7. DÉTECTER LA « BANDE 7–16 % »

Créer explicitement un indicateur `compressedRace`.

Tester plusieurs définitions :
- 8/9 candidats dans [7,16]
- 7/9 candidats dans [7,16]
- spread total <10 pts
- leader <17 %.

Mesurer la fréquence au début, mi-campagne, pré-premier tour et résultat.

Si cette configuration domine trop souvent, identifier pourquoi.

# 8. ARCHÉTYPES DE COURSE

Classer chaque campagne dans une forme de course :

### A. Favori dominant
leader >22 % et avance >5 pts

### B. Duel clair
top2 nettement séparés du reste

### C. Tripartite
3 candidats très proches et au-dessus d’un seuil significatif

### D. Course fragmentée
beaucoup de candidats proches

### E. Percée outsider
un candidat initialement faible gagne fortement

### F. Effondrement favori
un leader initial perd plusieurs places

### G. Remontée tardive
candidat hors top2 à 75 % du jeu puis qualifié

### H. Qualification confortable
top2 fixé tôt et jamais sérieusement menacé.

Les seuils exacts peuvent être adaptés, mais doivent être documentés et stables.

Produire le % de campagnes par archétype.

Question centrale :
> Le moteur produit-il vraiment plusieurs histoires électorales, ou presque toujours D/H ?

# 9. LEADERSHIP ET DYNAMIQUE

Mesurer :

- nombre de changements de leader
- nombre de changements dans le top 2
- durée moyenne d’un leader
- plus grand gain d’un parti
- plus grande chute
- nombre de partis ayant été leader au moins une fois
- nombre de partis ayant dépassé 20 %
- score maximum observé
- score minimum observé.

Créer histogrammes et percentiles.

# 10. AUDIT DES CLAMPS / NORMALISATIONS

Inspecter le code pour toute logique de :

- clamp
- cap
- floor
- normalization
- redistribution
- softmax
- rescaling
- somme forcée à 100
- min/max de sondage
- corrections automatiques
- potentiel de soutien
- hidden support
- compression non linéaire.

Pour chaque mécanisme :
- expliquer sa fonction
- montrer son effet numérique
- tester avec/sans dans un harness d’audit non production
- mesurer s’il réduit artificiellement les écarts.

# 11. EFFET DES DÉCISIONS VS DISPERSION

Mesurer si les effets événementiels :
- sont assez grands pour différencier les trajectoires
- sont absorbés par la normalisation
- se compensent systématiquement
- déplacent surtout le joueur sans faire bouger les adversaires
- font converger tout le monde.

Analyser :
- delta moyen
- delta p90/p99
- effets cumulés
- impact sur rang
- impact sur spread.

# 12. CRÉDIBILITÉ DES FAVORIS ET OUTSIDERS

Ne cherche pas une égalité artificielle.

Vérifier que :
- un favori n’est pas artificiellement ramené vers 15 %
- un outsider peut tomber très bas
- une percée exceptionnelle reste possible
- un favori peut dépasser 20–25 % dans certaines runs
- les gros écarts existent.

Mesurer par parti :
- score initial
- score max
- score min
- percentile 10/50/90
- qualification
- victoire
- probabilité >20 %
- probabilité <8 %.

# 13. SECOND TOUR — BUGS DE COHÉRENCE CONTEXTUELLE

Créer un audit exhaustif des événements éligibles après le premier tour.

Pour chaque événement de second tour / runoff :
- variables utilisées
- adversaire
- partis mentionnés
- électorats
- alliances
- consignes de vote.

Tester automatiquement que l’adversaire direct n’est jamais traité comme un tiers disponible.

Interdictions logiques :
- proposer de s’allier avec l’adversaire direct du second tour
- demander « que faire des électeurs de X ? » avec une formulation qui suppose X éliminé alors que X est le finaliste adverse
- proposer une consigne de vote d’un parti qui est encore dans le duel
- présenter un candidat éliminé comme encore candidat
- afficher un candidat finaliste comme réserve de voix externe.

Créer une matrice :

| event | player | opponent | mentionedParty | coherent? | reason |
|---|---|---|---|---|---|

Tester toutes les combinaisons possibles de finalistes si raisonnable.

# 14. SOURCE DE VÉRITÉ DU SECOND TOUR

Inspecter :
- premier tour
- runoff candidates
- runoff polls
- score actuel
- sidebar
- dashboard
- RaceBulletin
- interpolation des événements.

Objectif :
> toutes les vues doivent lire la même donnée selon la phase.

Identifier les endroits qui continuent d’utiliser une donnée de premier tour alors qu’une donnée runoff devrait être utilisée.

# 15. BUG « POURCENTAGE SECOND TOUR NON ACTUALISÉ À DROITE »

Reproduire explicitement.

Créer un test E2E :

1. jouer jusqu’au second tour
2. capturer le score principal du duel
3. lire le pourcentage sidebar
4. avancer d’une décision
5. provoquer/attendre une évolution
6. vérifier que la sidebar reflète le nouvel état.

Tester :
- joueur devant
- joueur derrière
- inversion
- après événement de second tour.

# 16. BUG « ÉTAT DE LA COURSE APRÈS PREMIER TOUR »

Vérifier automatiquement :

### Avant premier tour
`RaceBulletinScreen` multi-candidats autorisé.

### Après premier tour, joueur qualifié
- écran multi-candidats de qualification interdit
- wording « à portée du second tour » interdit
- données de premier tour seulement comme historique/rappel.

### Après premier tour, joueur éliminé
- aucun wording laissant croire qu’il peut encore se qualifier
- écran observation/fin cohérent.

# 17. PROJECTION RÉGIONALE APRÈS PREMIER TOUR

Vérifier ce que représente réellement la carte.

Si elle affiche encore la force du premier tour :
- soit la cacher
- soit la relabelliser comme résultat historique
- soit créer une projection duel si le moteur la supporte déjà.

Ne pas inventer une projection de second tour sans données.

# 18. APOSTROPHES ET QUALITÉ TYPOGRAPHIQUE FRANÇAISE

Faire un scan global de toutes les chaînes visibles :
- UI
- événements
- titres
- conséquences
- boutons
- rapports
- second tour
- gouvernement
- épilogue
- achievements.

Détecter :
- apostrophes manquantes
- `'` vs `’` incohérents
- `l entre`
- `d accord`
- `aujourdhui`
- `lEtat`
- `lentre`
- espaces avant/après apostrophes
- guillemets incohérents
- doubles espaces
- ponctuation française manifestement cassée.

Créer `scripts/text-quality-audit/` avec regex raisonnables, allowlist et rapport CSV.

Ne remplace pas aveuglément les apostrophes dans les identifiants techniques.

# 19. RAPPORT INTERMÉDIAIRE — FIN DU BLOC A

Créer :

```text
AUDIT_ELECTORAL_COHERENCE.md
```

Répondre :
1. scores initiaux crédibles ?
2. distribution trop comprimée ?
3. fréquence ?
4. causes ?
5. assez de favoris/outsiders/percées/effondrements ?
6. second tour incohérent ?
7. sidebar désynchronisée ?
8. RaceBulletin au mauvais moment ?
9. projection régionale cohérente ?
10. combien de problèmes de texte ?
11. P0/P1/P2 ?
12. corrections recommandées ?

Créer aussi :

```text
audit-results/electoral-coherence/
  summary.json
  initial-strength.csv
  dispersion-by-phase.csv
  compressed-races.csv
  race-archetypes.csv
  leadership-dynamics.csv
  party-percentiles.csv
  normalization-diagnostics.csv
  runoff-context-matrix.csv
  sidebar-sync.csv
  racebulletin-phase-check.csv
  regional-map-check.csv
  text-quality.csv
  timelines/
  charts/
  README.md
```

# 20. GATE AVANT CORRECTION

Ne commence le Bloc B qu’après :
- rapport intermédiaire terminé
- causes racines identifiées
- métriques sauvegardées
- tests reproduisant les bugs ajoutés
- baseline archivée.

Écrire :

```text
BLOC A TERMINÉ — CAUSES RACINES ÉTABLIES — DÉMARRAGE BLOC B
```

# 21. BLOC B — CORRECTIONS CIBLÉES

Corriger uniquement les problèmes confirmés.

## P1 — cohérence second tour
Corriger événements invalides selon adversaire, électorats mal qualifiés, alliances impossibles, candidats éliminés/finalistes mal catégorisés.

Utiliser des conditions génériques robustes, pas des exceptions hardcodées `if Horizons`.

## P1 — synchronisation sidebar
Créer une source de vérité phase-aware. Éviter la duplication.

## P1 — RaceBulletin après premier tour
Rendre le flow phase-aware.

## P1/P2 — dispersion électorale
Si compression confirmée, corriger la cause racine :
- normalisation
- clamps
- volatilité
- potential support
- poids de progression
- interactions adverses.

Ne jamais simplement ajouter +5 à un favori précis pour produire de la dispersion.

## P2 — rapports de force initiaux
Si incohérence confirmée, recalibrer avec une baseline documentée et datée.

Le but n’est pas de prédire 2027 mais de créer un scénario plausible.

## P2 — texte/apostrophes
Corriger tout le contenu utilisateur et ajouter le contrôle aux validations si fiable.

# 22. CRITÈRES DE SUCCÈS SUR LA DISPERSION

Ne cible pas une distribution politique précise.

Chercher une variété structurelle avec une part significative de :
- favoris >20 %
- leaders avec >4-5 pts d’avance
- outsiders <7-8 %
- courses fragmentées
- duels clairs
- tripartites
- percées
- effondrements.

Aucun archétype ne doit devenir obligatoire.

# 23. NON-RÉGRESSION

Préserver :
- agence
- fun
- chaînes narratives
- événements rares
- déterminisme
- diversité
- second tour
- UI/game feel récemment amélioré
- mobile
- visual regression.

Relancer audits/tests pertinents.

# 24. TESTS À AJOUTER

Au minimum :

### Engine
- normalisation
- dispersion
- invariants somme
- bornes.

### Runoff
- adversaire exclu des partenaires
- finaliste jamais traité comme éliminé
- tiers éliminés correctement disponibles.

### UI
- sidebar second tour synchronisée
- RaceBulletin phase-aware
- projection régionale cohérente.

### Text
- apostrophes
- strings interdites
- interpolation.

# 25. PLAYTESTS MANUELS

Jouer au minimum :

1. LR qualifié vs Horizons
2. LR qualifié vs RN ou PS
3. outsider éliminé
4. favori dominant
5. course fragmentée
6. campagne avec changement de leader tardif.

Pour chaque run :
- scores début
- évolution
- leader
- top2
- spread
- adversaire
- événements runoff
- sidebar
- cohérence des textes.

# 26. RAPPORT FINAL

Créer :

```text
ELECTORAL_COHERENCE_FIXES_REPORT.md
```

Structure :
1. Résumé
2. Baseline
3. Crédibilité initiale
4. Compression
5. Archétypes de course
6. Leadership
7. Normalisation
8. Causes racines
9. Second tour
10. Sidebar
11. RaceBulletin
12. Région
13. Textes/apostrophes
14. Corrections
15. Simulations post
16. Avant/après
17. Playtests
18. Non-régressions
19. Problèmes ouverts
20. Verdict.

# 27. TABLEAU AVANT/APRÈS

| Mesure | Avant | Après | Verdict |
|---|---:|---:|---|
| Score moyen leader début | | | |
| Score moyen leader pré-R1 | | | |
| Spread top1-top9 | | | |
| Courses comprimées | | | |
| Favoris >20 % | | | |
| Outsiders <8 % | | | |
| Changements leader | | | |
| Percées outsider | | | |
| Effondrements favori | | | |
| Runoff events incohérents | | | |
| Sidebar sync failures | | | |
| RaceBulletin post-R1 invalide | | | |
| Regional map incoherences | | | |
| Text-quality issues | | | |

# 28. VERDICT TERMINAL

Afficher :

```text
ELECTORAL CREDIBILITY / COHERENCE — VERDICT

Crédibilité initiale :
Avant :
Après :
Verdict :

Dispersion électorale :
Avant :
Après :
Verdict :

Variété des formes de course :
Favori dominant :
Duel :
Tripartite :
Fragmentée :
Percée :
Effondrement :
Verdict :

Compression 7–16 % :
Avant :
Après :
Verdict :

Second tour :
Événements incohérents avant :
Après :
Verdict :

Sidebar :
Avant :
Après :
Verdict :

RaceBulletin :
Avant :
Après :
Verdict :

Projection régionale :
Avant :
Après :
Verdict :

Qualité texte / apostrophes :
Issues avant :
Après :
Verdict :

Tests :
Unit :
E2E :
Visual regression :
Build :

Non-régressions :
Fun :
Agence :
Game feel :
Mobile :
Déterminisme :

Commits :
Problèmes ouverts :
```

# 29. RÈGLE FINALE

Le but n’est pas de rendre l’élection « réaliste » au sens prédictif.

Le but est qu’elle soit :
- crédible
- variée
- cohérente
- lisible
- contextuellement correcte.

Le hasard reste volontairement présent.

Ne rends pas les choix parfaitement prévisibles.

Corrige la structure du monde électoral, pas l’incertitude voulue du jeu.

Commence immédiatement.
