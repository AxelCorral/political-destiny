# Audit post-corrections — Vers l'Élysée

Audit indépendant mené le 6 août 2026, avec un outillage dédié (`scripts/audit-post/`), pour
déterminer si les cinq problèmes relevés par l'audit précédent ont été réellement corrigés — pas
seulement si le code laisse penser qu'ils l'ont été.

## Tableau de synthèse

| Domaine                                                                |                                                     Avant (V1, réexécuté) |                      Maintenant (V2, commit `cd920b4`) |    Évolution | Verdict                   | Confiance                                  |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------: | -----------------------------------------------------: | -----------: | ------------------------- | ------------------------------------------ |
| Choix génériques (triptyque prudent/risqué/rassembleur complet)        |                                                          160/182 (87,9 %) |                                         2/232 (0,86 %) |   −87 points | **CORRIGÉ**               | Élevée                                     |
| Unicité des récits de conséquence                                      |                                                                   17,73 % |                                               100,00 % | +82,3 points | **CORRIGÉ**               | Élevée                                     |
| Influence du parti (η², score 1er tour)                                |                                                                   73,39 % |                               46,06 % [IC95 43,3–48,5] | −27,3 points | **LARGEMENT CORRIGÉ**     | Élevée                                     |
| Influence de l'agent/stratégie (η², score 1er tour)                    |                                                                    3,00 % |                                  5,36 % [IC95 4,3–7,0] |  +2,4 points | **PARTIELLEMENT CORRIGÉ** | Moyenne (dépend de la métrique — voir §10) |
| Titres d'événements répétés par partie                                 |                                                                      ≈ 23 |                                 0,00 (max observé : 0) |          −23 | **CORRIGÉ**               | Élevée                                     |
| Récits de conséquence répétés par partie                               |                                                                      ≈ 17 |                                 0,00 (max observé : 0) |          −17 | **CORRIGÉ**               | Élevée                                     |
| Mémoire et monde vivant (idéologie, mémoire, remplacements, alliances) | Quasi nuls (0 % à 18,9 % selon le mécanisme, deux effets jamais utilisés) | Actifs et mesurés (10,3 % à 85,9 % selon le mécanisme) | Nette hausse | **LARGEMENT CORRIGÉ**     | Moyenne-élevée                             |

Ces chiffres sont détaillés, avec leurs intervalles de confiance et leurs limites, dans les
sections qui suivent. Le tableau ne doit pas être cité isolément.

## 1. Résumé exécutif

**Les corrections ont réellement transformé le jeu, pas seulement ajouté de la variété
superficielle — avec une réserve importante sur l'agence du joueur, qui reste partielle plutôt que
totale.**

Trois constats solides, vérifiés indépendamment (nouvel outillage, moteur réel, 5 280 campagnes,
330 branches contrefactuelles à état identique) :

1. **La répétition textuelle et structurelle a disparu**, pas seulement diminué. 100 % des textes
   de choix et des récits de conséquence sont désormais uniques dans tout le catalogue, et aucune
   des 4 320 campagnes simulées sur les 9 partis existants n'a affiché un seul titre ou récit
   répété. Ce n'est pas un arrondi favorable : c'est zéro, et le mécanisme est identifiable
   (chaque événement est désormais à usage unique par partie).
2. **Le monde n'est plus statique.** En V1, les effets `ideology` et `candidate_status` n'étaient
   _jamais_ déclenchés (0 occurrence mesurée dans tout le contenu), la mémoire d'acteur était
   vide dans 100 % des campagnes, et aucun remplacement de candidat n'avait jamais été observé. En
   V2, l'idéologie bouge dans la majorité des campagnes, 85,9 % des campagnes enregistrent au
   moins un souvenir d'acteur actif, 10,3 % voient un remplacement de candidat adverse, et les
   effets de reports/relations sont mesurables et exploités par le moteur électoral.
3. **Les décisions du joueur ont un effet causal démontrable**, pas seulement corrélé : la
   branche contrefactuelle stricte (même état de jeu, un seul choix qui diffère, tout le reste
   identique) montre qu'une seule décision précoce change l'issue finale (qualification/victoire)
   dans 22,2 % des cas, et que changer d'agent de décision pour toute la campagne (à parti et
   graine identiques) change cette issue dans 63 % des cas.

La réserve : **l'influence du parti reste le facteur dominant** sur le score brut du premier tour
(46,1 % de variance expliquée, contre 73,4 % avant) — une réduction réelle et statistiquement
solide, mais le parti explique encore davantage de variance que la stratégie ou l'agent
(5,4 %–14,2 % selon la méthode de mesure, voir §10). Sur la métrique « progression par rapport au
sondage de départ » spécifiquement, l'influence du parti reste à 75,9 %, à peine meilleure qu'en
V1 (73,4 % sur l'ensemble des métriques) : ce n'est pas un problème corrigé sur tous les fronts.

## 2. Verdict global

| Problème                               | Verdict                                                                                                                                                        |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — Choix trop génériques              | **CORRIGÉ**                                                                                                                                                    |
| B — Conséquences trop répétitives      | **CORRIGÉ**                                                                                                                                                    |
| C — Impact insuffisant des décisions   | **PARTIELLEMENT CORRIGÉ** (nette amélioration, mais le parti reste le facteur dominant, particulièrement sur la progression)                                   |
| D — Univers politique pas assez vivant | **LARGEMENT CORRIGÉ** (mécanismes actifs et mesurés, mais la capacité du joueur à affecter directement un adversaire reste étroite dans le catalogue statique) |
| E — Répétitions dans une même partie   | **CORRIGÉ**                                                                                                                                                    |

## 3. Version et environnement audités

- Commit audité (V2, « maintenant ») : `cd920b4776da1d40276edf122725ecd84cb9481`, branche
  `codex/v2-audit-improvements`.
- Commit de référence (V1, « avant ») : `e2a6d9c1acbd3585820fadcbbe8872faa4690e5e` (branche
  `main`), réexécuté dans un `git worktree` séparé (`D:\political-destiny-v1-baseline`, non
  destructif pour le dépôt principal), avec ses propres scripts d'audit et un `npm install`
  indépendant.
- Node.js : v24.16.0. npm : 11.13.0.
- Aucune modification non committée n'était présente au démarrage de cet audit (`git status`
  propre).
- Commandes exécutées avant tout audit : `npm run format:check`, `npm run lint`,
  `npm run typecheck`, `npm run data:validate`, `npm run test`, `npm run build` — toutes réussies
  (voir §6).

## 4. Méthodologie

1. **Audit statique du catalogue** (`scripts/audit-post/catalog-audit.ts`) : lecture directe de
   `gameContent` (232 événements réels), sans simulation. Intégrité des références, structure,
   genericité lexicale (TF-IDF cosinus, plusieurs seuils) et mécanique (signature normalisée des
   effets).
2. **Simulation massive** (`scripts/audit-post/simulate.ts`) : le moteur réel
   (`createGame` / `currentEvent` / `resolveCurrentChoice`, aucune réimplémentation parallèle des
   règles), exécuté 5 280 fois : 9 partis existants × 8 agents × 60 graines (4 320 campagnes), plus
   4 profils de parti personnalisé × 8 agents × 30 graines (960 campagnes). 151 822 décisions et
   366 466 actions adverses individuelles enregistrées. 0 erreur, 0 partie invalide.
3. **Expérience contrefactuelle stricte** (`scripts/audit-post/branch-experiment.ts`) : pour 54
   couples (parti, graine), l'état de jeu est amené au même point (décision 5) puis **chaque
   option** de l'événement à ce point est résolue séparément à partir du même état, avant de
   poursuivre avec le même agent — 330 branches. C'est la seule mesure véritablement causale de
   cet audit ; toutes les autres comparent des campagnes indépendantes (corrélationnelles, malgré
   l'appariement par graine).
4. **Analyse statistique** (`scripts/audit-post/analyze.ts`) : ANOVA à deux facteurs (parti ×
   agent) avec décomposition en sommes de carrés, bootstrap à 500 rééchantillonnages pour les
   intervalles de confiance, V de Cramér pour les issues binaires (qualifié/gagné), comparaisons
   appariées par graine.
5. **Comparaison avant/après réelle, pas seulement historique** : le commit V1 a été réexécuté
   avec son propre outillage dans un environnement isolé, et non simplement cité depuis
   `AUDIT_COMPLET.md`. Les figures 87,9 % et 17,73 % et 73,39 %/3,00 % ont été **reproduites à
   l'identique** par cette réexécution indépendante (voir §7), ce qui exclut une erreur de
   transcription du rapport historique.
6. **Chronologies lisibles** (`scripts/audit-post/timelines.ts`) et **graphiques SVG**
   (`scripts/audit-post/charts.ts`) pour la vérification qualitative.
7. **Reproductibilité vérifiée** : `scripts/audit-post/simulate.ts` a été exécuté deux fois de
   suite avec les mêmes paramètres (`AUDIT_SEEDS_PER_COMBO=10`, sans grille personnalisée) ; les
   deux `raw-runs.csv` produits sont **strictement identiques** (même empreinte SHA-256,
   `d83a5f99…`). Même graine, même parti, même agent ⇒ même trajectoire, sans exception.

Aucune règle du jeu, aucune donnée d'événement, aucune statistique de parti n'a été modifiée pour
produire ces résultats. Les deux seules corrections apportées à l'outillage lui-même sont
documentées en §18.

## 5. Limites de l'audit

- **Les 8 agents de cet audit ne sont pas les 7 « stratégies » déjà utilisées par
  `scripts/audit/simulation-audit.ts`** (le harnais de développement du projet). Les deux
  mesurent des choses voisines mais pas identiques : le harnais du projet inclut deux stratégies
  synthétiques d'optimisation extrême (`greedy`/`adverse`) absentes ici, ce qui explique
  partiellement pourquoi son η²(stratégie) mesuré est plus élevé (14,2 %) que celui de cet audit
  (5,4 %) — voir §10 pour la discussion complète. Les deux mesures sont honnêtes ; aucune n'est
  « la » bonne réponse unique.
- **`choice-strength.csv` est corrélationnel**, pas causal : il compare les campagnes qui ont
  choisi chaque option, sans contrôler quel agent ou quel parti les a choisies. La seule mesure
  causale de cet audit est `counterfactuals.csv` (330 branches), un échantillon bien plus restreint.
- **330 branches contrefactuelles sur 54 points de contrôle** est un échantillon modeste comparé
  aux 151 822 décisions observées. Les intervalles ne sont pas calculés sur cette mesure
  spécifique (contrairement à l'ANOVA principale, qui l'est).
- Le point de contrôle des branches contrefactuelles est fixé à la décision 5 (début de
  campagne) : la divergence causale d'un choix pris plus tard dans la campagne (ou au second tour)
  n'a pas été mesurée séparément.
- `choice-similarity.csv` et `consequence-similarity.csv` sont vides à leurs seuils par défaut :
  c'est un résultat réel (aucune paire ne dépasse ces seuils), pas une erreur d'exécution — voir
  `audit-results/README.md`.
- Cet audit ne revérifie pas la validité des succès/badges ni les migrations de sauvegarde
  (couvertes par les phases précédentes de ce chantier) ; il se concentre strictement sur les cinq
  problèmes énoncés dans la commande d'audit.

## 6. État des tests, lint, typecheck et build

Exécuté avant tout audit, sur l'arbre non modifié :

| Commande                | Résultat                                                 |
| ----------------------- | -------------------------------------------------------- |
| `npm run format:check`  | Réussi                                                   |
| `npm run lint`          | Réussi (0 avertissement, 0 erreur)                       |
| `npm run typecheck`     | Réussi                                                   |
| `npm run data:validate` | Réussi — 9 partis, 232 événements, 58 succès, 41 acteurs |
| `npm run test`          | Réussi — 76 tests, 18 fichiers                           |
| `npm run build`         | Réussi                                                   |

Réexécuté après la mise en place de l'outillage d'audit (`scripts/audit-post/`) pour confirmer
qu'aucune régression n'a été introduite : mêmes résultats à l'identique (76/76 tests, build
réussi).

## 7. Comparaison avant/après

### 7.1 Reproductibilité de la référence V1

Plutôt que de citer les chiffres de l'audit précédent tels quels, ils ont été **régénérés** à
partir du commit `e2a6d9c` dans un worktree isolé, avec les scripts d'audit tels qu'ils existaient
à ce commit :

| Mesure                                                     | Valeur citée par l'audit précédent | Valeur réexécutée dans cet audit | Écart |
| ---------------------------------------------------------- | ---------------------------------: | -------------------------------: | ----: |
| Événements au triptyque complet prudent/risqué/rassembleur |                            160/182 |                          160/182 |     0 |
| Récits de conséquence uniques                              |                 17,73 % (189/1066) |               17,73 % (189/1066) |     0 |
| η² du parti (score 1er tour, 5 400 campagnes)              |                             ≈ 73 % |                        73,3871 % |     0 |
| η² de la stratégie                                         |                              ≈ 3 % |                         3,0022 % |     0 |

Reproduction exacte sur les quatre mesures. La référence V1 n'est donc pas une donnée historique
non vérifiée : c'est un résultat reproductible, confirmé indépendamment.

### 7.2 Contenu et catalogue

| Mesure                               |           V1 |         V2 |
| ------------------------------------ | -----------: | ---------: |
| Événements                           |          182 |        232 |
| Choix                                |          533 |        633 |
| Outcomes                             |        1 066 |        641 |
| Événements avec le triptyque complet | 160 (87,9 %) | 2 (0,86 %) |
| Textes de choix uniques              |      72,23 % |   100,00 % |
| Récits de conséquence uniques        |      17,73 % |   100,00 % |

Le nombre d'issues (`outcomes`) baisse alors que le nombre de choix augmente : c'est cohérent avec
un changement structurel documenté en §9 — la V2 privilégie des choix à une seule issue
déterministe (98,7 % des choix, voir §9) plutôt que plusieurs issues probabilistes par choix
(V1 avait en moyenne 2 issues par choix).

## 8. Audit de la diversité des choix (Problème A)

**Verdict : CORRIGÉ.**

- Définition historique exacte (les trois étiquettes PRUDENT + RISQUÉ + RASSEMBLEUR présentes sur
  le même événement) : 160/182 → 2/232. Les deux événements restants
  (`media_prime_time_invite`, `rare_hologram_revolt`) ont été inspectés manuellement ; leurs trois
  options ont des effets mécaniques distincts (pas un simple copier-coller de gabarit).
- Définition élargie (au moins deux des trois étiquettes classiques co-présentes, un signal plus
  généreux) : 38/232 événements (16,4 %) — nettement moins strict, mais confirme que le repli sur
  ces étiquettes reste minoritaire même sous un critère plus permissif.
- **La diversité n'est pas seulement lexicale.** Sur les 633 choix du catalogue :
  - 0 % appartiennent à un cluster lexical de similarité cosinus ≥ 0,62 (aucun cluster détecté à
    ce seuil ; seulement 2 paires à un seuil très permissif de 0,50, aucune à 0,80).
  - 0 événement ne présente d'options mécaniquement identiques entre elles (0 « faux dilemme »
    au sein d'un même événement).
  - 2,84 % des choix (18/633) appartiennent à un groupe d'au moins 3 choix partageant _entre
    événements différents_ une signature mécanique identique — essentiellement des événements
    structurellement parallèles entre partis (ex. les 5 événements `party_*_crisis_followup`
    partagent une signature car ils modélisent la même situation — un vote des adhérents après une
    crise — pour des partis différents ; ce n'est pas une répétition paresseuse mais une structure
    narrative assumée et répétée à dessein entre partis).
- Étiquettes de stratégie toujours présentes (`PRUDENT` 89, `RASSEMBLEUR` 79, `OFFENSIF` 67,
  `TECHNIQUE` 63, `TRANSPARENT` 61, `INSTITUTIONNEL` 57, `CLIVANT` 46, `POPULAIRE` 45,
  `PRÉSIDENTIEL` 45, `RISQUÉ` 37, `LOYAL` 29, `OPPORTUNISTE` 15) mais utilisées comme **repères
  secondaires**, jamais comme libellé principal — conforme à la décision D-003 du projet. Les trois
  étiquettes classiques ne représentent plus que 37,1 % de l'ensemble des choix (contre la quasi-
  totalité en V1, où PRUDENT et RISQUÉ apparaissaient sur 182/182 événements).

## 9. Audit de la diversité des conséquences (Problème B)

**Verdict : CORRIGÉ**, avec une nuance structurelle importante à ne pas ignorer.

- Unicité textuelle : 100,00 % exacte et normalisée sur les 641 récits de conséquence (V1 :
  17,73 %). 0 cluster lexical même au seuil permissif de 0,45.
- Unicité mécanique : 593/641 signatures d'effets uniques (92,5 %). Seul 1 groupe de 5 conséquences
  ou plus partage une signature mécanique identique (contre un plafond de comparaison qui n'existait
  pas en V1, faute d'outillage). Les 10 signatures les plus fréquentes ne couvrent que 4,37 % de
  l'ensemble des conséquences — aucune signature « fourre-tout » ne domine.
- 0 cas de texte identique à mécanique différente ; seulement 2 groupes de signature identique à
  texte différent (sur 641 conséquences) — l'illusion de choix (texte varié, effet copié-collé)
  n'est pas un schéma dominant.
- **Nuance structurelle** : 625/633 choix (98,7 %) n'ont plus qu'une seule issue possible
  (`outcomeGroups.length === 1`) contre une moyenne de ~2 issues par choix en V1. Autrement dit,
  la V2 a largement abandonné le tirage probabiliste _entre plusieurs textes de conséquence pour un
  même choix_, au profit d'une conséquence déterministe par choix (l'aléa du jeu vient d'ailleurs :
  bruit des sondages, actions adverses autonomes, effets différés). Ce n'est pas un défaut — c'est
  cohérent avec la décision D-003 (« un choix décrit une action vérifiable, pas un pari ») — mais
  cela signifie que le taux d'unicité de 100 % est en partie _mécaniquement_ plus facile à
  atteindre qu'en V1, où deux tirages du même choix pouvaient produire des textes différents. Le
  fait mérite d'être noté pour ne pas surinterpréter le 100 % comme preuve unique d'un travail de
  rédaction : c'est la conjonction d'un travail de rédaction réel (633 textes distincts vérifiés
  un par un lors des phases précédentes) et d'un choix d'architecture (une issue par choix).

## 10. Audit de l'agence du joueur (Problème C)

**Verdict : PARTIELLEMENT CORRIGÉ.** Amélioration réelle et statistiquement solide, mais le parti
reste le facteur dominant, et une métrique (la progression) montre une amélioration à peine
mesurable.

### 10.1 Décomposition de variance (ANOVA à deux facteurs, 4 320 campagnes des 9 partis existants)

| Métrique                       |    η² parti |   η² agent | η² interaction | η² résiduel (graine/événements) |
| ------------------------------ | ----------: | ---------: | -------------: | ------------------------------: |
| Score au premier tour          |     46,06 % |     5,36 % |         1,75 % |                         46,83 % |
| Score final (/100)             |     33,42 % |    14,33 % |         1,37 % |                         50,88 % |
| Progression vs sondage initial | **75,87 %** | **2,40 %** |         0,78 % |                         20,95 % |

Intervalles de confiance à 95 % (bootstrap, 500 rééchantillonnages) pour le score au premier tour :
parti [43,3 % – 48,5 %], agent [4,3 % – 7,0 %]. La réduction de l'influence du parti (73,4 % → 46,1 %)
est donc robuste et ne tient pas à un artefact d'échantillonnage.

**Le point faible identifié sans détour** : sur la progression par rapport au sondage de départ —
la métrique la plus proche de « est-ce que ma campagne a fait bouger les choses ? » — l'agent
n'explique que 2,4 % de la variance, et le parti 75,9 %, soit **pire que la moyenne V1 tous
domaines confondus (73,4 %)**. Le sondage de départ (directement dérivé du parti) domine encore
presque totalement la trajectoire de progression, quelle que soit la politique de décision suivie.

### 10.2 Association sur les issues binaires (V de Cramér, 0 = aucune association, 1 = déterministe)

|               | Par parti | Par agent |
| ------------- | --------: | --------: |
| Qualification |     0,591 |     0,185 |
| Victoire      |     0,450 |     0,215 |

Le parti reste plus fortement associé à la qualification/victoire que l'agent, mais l'agent a une
association loin d'être négligeable (0,185–0,215), à comparer à une V1 où cette association était
proche de 0 par construction (l'audit historique ne mesurait qu'un effet de 3 % sur le score, sans
mesure d'association catégorielle équivalente disponible).

### 10.3 Comparaisons appariées (même parti, même graine, agent différent)

540 groupes appariés (les 9 partis × 60 graines, chacun observé sous 8 agents) :

- Écart moyen de score au premier tour entre agents pour une même combinaison parti+graine :
  3,25 points (médiane 3,1).
- Écart moyen de score final : 20,31 points sur 100.
- **63,0 % des groupes appariés voient l'issue (qualification et/ou victoire) changer selon
  l'agent utilisé**, à parti et graine strictement identiques.

C'est la preuve la plus directe que la stratégie de décision affecte le résultat : pour 6 groupes
sur 10, jouer différemment change qui se qualifie ou qui gagne, alors que le parti et le hasard de
la graine sont contrôlés.

### 10.4 Expérience contrefactuelle stricte (une seule décision qui diffère)

330 branches, 108 groupes de branches (54 couples parti/graine × 2 agents de suivi) :

| Horizon                                 |                                            Écart moyen | Écart médian |
| --------------------------------------- | -----------------------------------------------------: | -----------: |
| Immédiat (sondage)                      | (par construction, non nul dès la résolution du choix) |            — |
| +3 décisions                            |                                             0,39 point |            — |
| +8 décisions                            |                                             0,50 point |            — |
| Score au premier tour (fin de campagne) |                                             0,83 point |            — |
| Score final /100                        |                                            5,01 points |  2,00 points |

**22,2 % des groupes de branches voient l'issue finale (qualification/victoire) changer** suite à
un seul choix différent à la décision 5, tout le reste étant identique. C'est une mesure plus
stricte et plus basse que le 63 % des comparaisons appariées (qui cumulent l'effet de _tous_ les
choix d'une politique de décision sur toute la campagne, pas d'un seul) — les deux chiffres ne se
contredisent pas, ils mesurent des granularités différentes : une décision isolée a un effet causal
mesurable mais modeste (médiane de 2 points sur le score final) ; une politique de décision
cohérente sur toute la campagne a un effet cumulé bien plus large.

### 10.5 Un outsider peut-il dépasser un favori ?

Parti le plus favorable (score moyen au premier tour) : `rn` (16,21 %). Parti le plus difficile :
`reconquete` (10,06 %). Sur les 480 campagnes `reconquete` de l'échantillon, 88 (18,3 %) obtiennent
un score final supérieur au pire décile des campagnes `rn` (66/100). C'est cohérent avec l'objectif
produit : un bon parcours avec un parti difficile peut dépasser un mauvais parcours avec un parti
favori, **sans que ce soit la norme** (moins d'une campagne outsider sur cinq).

### 10.6 Pourquoi deux chiffres différents circulent pour l'agence du joueur

Le tableau de comparaison du chantier V2 (`audit/V2_COMPARISON.md`, produit lors d'une session
antérieure de ce même chantier) rapporte η²(stratégie) = 14,2 % en utilisant les 7 stratégies déjà
codées dans `scripts/audit/simulation-audit.ts`, dont deux stratégies synthétiques d'optimisation
extrême (`greedy` qui maximise l'utilité espérée des effets, `adverse` qui la minimise
délibérément). Ces deux stratégies élargissent artificiellement l'écart mesuré, car aucune ne
correspond à un style de jeu humain plausible. Les 8 agents de cet audit ont été conçus
spécifiquement pour éviter cet écueil (aucun n'a une connaissance parfaite des probabilités
futures, tous sont documentés comme des politiques de décision plausibles pour un joueur). Sous
ce jeu d'agents plus réaliste, η²(agent) redescend à 5,4 %. **Les deux mesures sont honnêtes** ;
la fourchette réaliste de l'influence de la stratégie se situe donc entre 5,4 % et 14,2 % selon
qu'on inclut ou non des politiques extrêmes non représentatives d'un joueur réel — dans tous les
cas très au-dessus des 3,0 % mesurés en V1.

## 11. Audit de la mémoire et des conséquences différées (Problème D, partie 1)

**Verdict : LARGEMENT CORRIGÉ.**

| Mécanisme                                                           |                    V1 (mesuré) |                                        V2 (4 320 campagnes) |
| ------------------------------------------------------------------- | -----------------------------: | ----------------------------------------------------------: |
| Campagnes avec mémoire d'acteur non vide                            |                            0 % |                                                      85,9 % |
| Campagnes avec au moins une contradiction exploitée                 | non mesurable (système absent) |                                                      13,8 % |
| Campagnes avec un revirement brutal                                 | non mesurable (système absent) |                                                      28,8 % |
| Effet `ideology` jamais utilisé (0 occurrence dans tout le contenu) |                           Vrai |     Faux — 59 événements du catalogue modifient l'idéologie |
| Chaînes narratives lancées (au moins une fois observées)            |                non instrumenté | 21 événements sources, présents dans les campagnes simulées |
| Fils narratifs actifs (au moins un par campagne)                    |                 non applicable |                                        73,1 % des campagnes |

Nombre moyen de souvenirs d'acteur par campagne : 2,03 (médiane 2, maximum observé 7). Ce n'est pas
un système déclaré-mais-jamais-atteint : il est mesurablement utilisé dans la grande majorité des
campagnes, avec une variabilité réelle (de 0 à 7).

Exemple complet (choix initial → état enregistré → conséquence ultérieure), tiré de
`audit-results/selected-run-timelines/aleatoires__reconquete__aleatoire__seed12.md` : à la décision
5, le choix « Exonérer pendant un an la première embauche durable » enregistre une déclaration de
type `abrupt_reversal` (revirement par rapport à une position antérieure) ; cette déclaration
alimente ensuite le calcul de cohérence idéologique et de risque de contradiction pour le reste de
la campagne — un mécanisme absent de la V1 par construction (`unusedEventEffectKinds` de l'audit V1
listait explicitement `ideology` et `candidate_status` comme jamais déclenchés).

## 12. Audit des adversaires et du monde politique (Problème D, partie 2)

| Mécanisme                                       |                                        V1 |                                                      V2 (4 320 campagnes existantes) |
| ----------------------------------------------- | ----------------------------------------: | -----------------------------------------------------------------------------------: |
| Remplacement de candidat adverse jamais observé |        Vrai (0/900 campagnes historiques) | Faux — 10,3 % des campagnes, 540 remplacements au total sur 366 466 actions adverses |
| Alliance formée par le joueur                   |     18,9 % des campagnes (max 1 alliance) |                                                                 54,2 % des campagnes |
| Actions adverses moyennes par campagne          | non comparable (mécanisme quasi statique) |                                       69,2 (médiane 71, écart-type 7,2, plage 48–80) |

Répartition des 366 466 actions adverses par nature : `strategy` 334 018 (91,1 %, ajustements
tactiques routiniers simulés à chaque décision), `crisis` 16 471 (4,5 %), `endorsement` 8 917
(2,4 %), `alliance` 6 439 (1,8 %), `replacement` 540 (0,15 %), `primary` 80, `withdrawal` 1.

**Nuance honnête** : le catalogue statique ne compte que 2 événements permettant au joueur
d'affecter _directement_ un adversaire par ses propres choix (`eventsAffectingOpponent`), et 1 seul
pouvant retirer un candidat. La richesse du monde adverse observée provient presque entièrement de
la simulation adverse autonome (`simulateOpponentTurn`), pas d'une capacité étendue du joueur à
manipuler ses adversaires par ses propres décisions. C'est cohérent avec la décision D-012 du
projet (« les adversaires publient seulement ce qu'ils ont simulé ») mais mérite d'être noté : le
monde est vivant _autour_ du joueur plus qu'_à cause de_ ses actions directes sur les tiers.

## 13. Audit de l'idéologie (Problème D, partie 3)

| Axe         | Mouvement absolu moyen | Mouvement maximal observé | Part des campagnes avec mouvement > 5 points |
| ----------- | ---------------------: | ------------------------: | -------------------------------------------: |
| Économie    |                   6,71 |                     26,67 |                                       56,6 % |
| Europe      |                   1,80 |                     15,06 |                                       11,3 % |
| Autorité    |                   1,95 |                     18,81 |                                       13,5 % |
| Écologie    |                   1,97 |                     19,50 |                                        9,2 % |
| Immigration |                   0,91 |                      7,17 |                                        5,0 % |
| Société     |                   0,30 |                      5,01 |                                        0,1 % |

L'idéologie bouge réellement et son amplitude est mesurable jusqu'à des valeurs importantes (jusqu'à
26,7 points sur l'axe économique) — en V1, ce mouvement était strictement nul par construction.
Le mouvement reste cependant **très concentré sur l'axe économique** : les cinq autres axes
bougent nettement moins. Ce n'est pas nécessairement un défaut (les thèmes économiques dominent
plausiblement une campagne présidentielle française), mais si l'objectif produit visait une
dynamique idéologique équilibrée sur les six axes, ce n'est pas encore le cas.

## 14. Audit des répétitions dans une partie (Problème E)

**Verdict : CORRIGÉ**, avec le mécanisme exact identifié plutôt que supposé.

Sur les 4 320 campagnes des 9 partis existants :

| Mesure                                | Moyenne | Médiane | Écart-type | Maximum |
| ------------------------------------- | ------: | ------: | ---------: | ------: |
| Titres d'événements répétés (exact)   |   0,000 |       0 |      0,000 |       0 |
| Titres répétés (normalisé)            |   0,000 |       0 |      0,000 |       0 |
| Récits de conséquence répétés (exact) |   0,000 |       0 |      0,000 |       0 |
| Récits répétés (normalisé)            |   0,000 |       0 |      0,000 |       0 |

**4 320 campagnes sur 4 320** n'affichent aucune répétition, exacte ou normalisée. Ce résultat n'est
pas un heureux hasard statistique : l'audit du catalogue confirme que les 232 événements sont
_tous_ marqués `oncePerRun: true` (`eventsRepeatable: 0` dans `catalog-summary.json`) — un
événement ne peut structurellement pas réapparaître deux fois dans la même campagne, et puisque les
titres/récits sont eux-mêmes 100 % uniques dans le catalogue (§9), deux événements différents ne
peuvent pas non plus produire accidentellement le même texte. Le problème historique (≈23 titres,
≈17 récits répétés par partie, mesuré sur l'ancien contenu où plusieurs événements généralistes
étaient piochés au hasard et pouvaient se répéter) est réglé par construction, pas seulement par
un ajustement de probabilité.

## 15. Audit des événements rares

18 événements classés `rare`/`legendary`/`secret` dans le catalogue. **Les 18 ont été atteints au
moins une fois** dans les 4 320 campagnes existantes (0 événement rare jamais atteint). Fréquences
observées les plus hautes : `rare_printer_slogan` (257), `rare_exceptional_powers` (243),
`rare_hologram_revolt` (235), `rare_fragmented_congress` (210), `rare_civil_suspension` (205),
`rare_debate_blackout` (174) ; les plus rares descendent à quelques dizaines d'occurrences
(`rare_national_union` 55, `rare_parrot_quote` 50, `party_horizons_rare` 27). Cette variance de
fréquence est normale et attendue pour des événements à conditions d'éligibilité différentes — elle
n'indique pas un défaut tant que le plancher (0 occurrence) n'est jamais atteint, ce qui est le cas
ici.

## 16. Audit des parties complètes (qualitatif)

45 chronologies lisibles générées dans `audit-results/selected-run-timelines/` : 10 aléatoires, 5
gagnées, 5 perdues, 5 avec le parti le plus favorable (`rn`), 5 avec le parti le plus difficile
(`reconquete`), 5 ayant rencontré un événement rare, 10 formant 5 paires contrefactuelles (même
parti, même graine, agents `aleatoire` et `prudent`).

Observations qualitatives, en complément des données quantitatives (qui restent la preuve
principale) :

- **Sentiment de progression** : les chronologies lues (ex. `reconquete/aleatoire/seed12`)
  enchaînent des situations concrètes et distinctes (règles internes de liste commune, lancement
  de campagne chiffré, négociation syndicale, scandale photo, comité sécurité...) sans jamais
  répéter un intitulé — cohérent avec les mesures de §14.
- **Lisibilité des conséquences** : chaque conséquence relie explicitement le choix fait à son
  effet narré (« La codirection honore l'esprit de la promesse... mais multiplie les réunions »),
  ce qui correspond à l'objectif produit de clarté sans exposer les statistiques cachées.
- **Divergence contrefactuelle observable mais pas toujours spectaculaire** : la paire
  `lfi/aleatoire/seed0` (score final 78, défaite au second tour) et `lfi/prudent/seed0` (score
  final 77, même issue de second tour) montre une divergence _modeste_ pour ce couple précis — un
  rappel utile que le 63 % de changement d'issue (§10.3) laisse aussi 37 % de paires où l'agent
  choisi ne change pas la trajectoire électorale malgré des décisions différentes.
- **Cohérence politique** : les déclarations enregistrées (`initial_position`, `abrupt_reversal`)
  s'accumulent de façon traçable dans le journal de décisions et sont cohérentes avec le thème de
  l'événement qui les a produites.

## 17. Audit de l'interface

Suite Playwright complète (`e2e/game.spec.ts`, 12 scénarios sur desktop Chromium) rejouée contre un
build de production frais du commit `cd920b4`, avec la politique de nouvelles tentatives de la CI
(`retries: 2`) : **9 réussis du premier coup, 3 flaky (passés au second essai), 0 échec net.** Les
3 tests initialement en échec (« démarrage avec un parti existant », « autosauvegarde et reprise »,
« élimination contrôlée au premier tour ») ont tous buté sur le même symptôme — un timeout en
attendant le bouton « Un parti existant » après la fenêtre de mise en garde initiale — et ont
réussi sans modification au second essai. C'est la même catégorie d'instabilité déjà documentée
dans `V2_DECISIONS.md` (D-010, dialogue de fiction) et déjà observée lors des vérifications de la
Phase H de ce chantier ; ce n'est pas une régression introduite par cet audit, qui n'a modifié
aucun fichier d'interface.

Les mécanismes vérifiés comme actifs dans le moteur (mémoire, idéologie, relations, monde adverse)
sont exposés à l'interface via le journal de campagne et le bilan final déjà audités lors des
phases précédentes de ce chantier (extraction de `event-decision-card.tsx`, journal enrichi —
`V2_CHANGELOG.md`, phase H) ; cet audit n'a pas identifié de régression d'affichage depuis cette
vérification, le code d'interface n'ayant pas été modifié entre les deux.

## 18. Bugs et anomalies découverts

- **Aucune anomalie d'intégrité du catalogue** : 0 identifiant d'événement dupliqué, 0 cible de
  chaîne manquante, 0 doublon d'identifiant d'issue au sein d'un même choix, 0 jeu d'issues
  identique entre deux choix du même événement.
- **0 erreur d'exécution** sur les 5 280 campagnes simulées (`audit-results/errors.json` vide) et
  0 partie invalide (`validateGameState` toujours positif).
- Deux corrections mineures apportées à l'outillage d'audit lui-même pendant sa construction
  (aucune ne touche au moteur ni aux données du jeu) :
  1. Les fichiers `choice-similarity.csv`/`consequence-similarity.csv` s'écrivaient sans en-tête
     quand aucune paire ne dépassait le seuil de similarité (0 lignes) ; corrigé pour toujours
     écrire l'en-tête de colonnes.
  2. La signature de hachage des campagnes (`finalSignature`) embarquait initialement le JSON
     complet du résultat dans `raw-runs.csv`, gonflant démesurément le fichier ; remplacée par un
     hachage SHA-1 avant l'exécution à grande échelle.
- Pour mémoire (déjà corrigé lors d'une session antérieure de ce chantier, avant cet audit) :
  `scripts/audit/content-audit.ts` détectait les chaînes narratives via un champ
  (`outcome.enqueueEventIds`) que plus aucun événement V2 ne renseigne, rapportant silencieusement
  zéro chaîne. Cet audit confirme, avec son propre détecteur indépendant, 21 événements source de
  chaîne — cohérent avec la correction déjà appliquée.

## 19. Risques de régression

- L'outillage d'audit (`scripts/audit-post/`) est strictement en lecture sur `gameContent` et
  utilise le moteur réel sans le modifier : aucun risque de régression du jeu lui-même.
- Les figures d'agence du joueur (η² agent) dépendent visiblement de la définition des agents
  (§10.6) : toute évolution future des 7 stratégies de `scripts/audit/simulation-audit.ts` ou des 8
  agents de cet audit rendra les deux séries de mesures difficiles à comparer terme à terme si
  elles ne sont pas documentées ensemble — ce rapport et `audit-results/README.md` documentent
  explicitement les deux définitions pour éviter la confusion.
- `decisions.csv` et `world-events.csv` ne sont pas committés en clair (trop volumineux) ; seule la
  version compressée l'est. Un contributeur qui régénère l'audit sans lancer `npm run audit:game`
  dans l'ordre complet n'aura pas ces fichiers décompressés localement.

## 20. Classement des problèmes restants

**P1 — Agence du joueur sur la métrique « progression » quasi inchangée.**
Preuve : η²(parti) = 75,9 % sur la progression vs sondage initial, contre 73,4 % pour l'ensemble
des métriques en V1 ; η²(agent) = 2,4 %, le plus bas des trois métriques testées. Impact joueur :
sur cette dimension précise (« ma campagne a-t-elle fait progresser mon parti ? »), le sentiment de
contrôle reste probablement proche de celui de la V1. Cause probable : le calcul de progression
reste ancré sur l'écart entre le sondage de départ (déterminé par le parti) et le score final, sans
normalisation par le potentiel de progression propre à chaque parti. Zone : `src/game/engine/scoring.ts`
et le calcul de `pollingProgression` dans `src/game/engine/game.ts`/`election.ts`. Correction
recommandée : étudier une normalisation de la progression par le potentiel de croissance propre au
parti (`hidden.potentialSupport`) plutôt qu'un delta brut. Difficulté estimée : moyenne. Risque de
régression : moyen (touche le calcul de score final et les succès liés à la progression). Test
d'acceptation proposé : réexécuter `scripts/audit-post/analyze.ts` après modification et vérifier
que η²(agent) sur la progression dépasse significativement 2,4 % sans faire s'effondrer η²(parti)
en dessous d'un seuil qui uniformiserait les partis.

**P2 — Capacité du joueur à affecter directement un adversaire très étroite dans le catalogue statique.**
Preuve : seuls 2 événements sur 232 permettent au joueur de modifier directement un adversaire
(`eventsAffectingOpponent`), 1 seul peut retirer un candidat. Impact joueur : la richesse du monde
adverse observée (69 actions/campagne) vient presque exclusivement de la simulation autonome, pas
de choix du joueur ciblant un adversaire. Cause probable : conception assumée (D-012) plutôt que
bug, mais peut limiter le sentiment d'agence sur cette dimension spécifique. Zone :
`src/game/data/events/v2/*.ts` (contenu), en particulier les catégories `alliance`/`scandal`. Cor-
rection recommandée : évaluer l'ajout d'un petit nombre d'événements où une décision du joueur
influence directement un adversaire nommé (au-delà des dotations d'alliance déjà présentes).
Difficulté : moyenne (contenu, pas moteur). Risque de régression : faible. Test d'acceptation :
`eventsAffectingOpponent` dans `catalog-summary.json` dépasse 2 sans dégrader la diversité mesurée
en §8.

**P3 — Mouvement idéologique très concentré sur l'axe économique.**
Preuve : mouvement moyen 6,71 points sur l'axe économie contre 0,30 à 1,97 sur les cinq autres axes.
Impact joueur : la dynamique idéologique perçue sur les enjeux sociétaux, environnementaux ou
d'autorité reste faible comparée à l'économie. Cause probable : répartition du contenu (plus
d'événements/déclarations à impact économique que sur les autres axes). Zone :
`src/game/data/events/v2/*.ts`. Correction recommandée : si un rééquilibrage est souhaité, ajouter
des déclarations à fort enjeu sur les axes société/immigration/autorité plutôt que retoucher le
moteur. Difficulté : faible à moyenne (contenu). Risque de régression : faible. Test
d'acceptation : `meanAbsMovement` par axe dans `summary.json.ideology.byAxis` se resserre entre
les six axes sans réduire le mouvement économique déjà mesuré.

**P4 — Deux définitions de « stratégie/agent » coexistent dans le dépôt sans lien explicite.**
Preuve : `scripts/audit/simulation-audit.ts` (7 stratégies, dont 2 synthétiques extrêmes) et
`scripts/audit-post/lib/agents.ts` (8 agents, aucun extrême) mesurent des η²(stratégie) différents
(14,2 % contre 5,4 %) sans se référencer l'un l'autre. Impact joueur : aucun (outillage de
développement uniquement). Cause : constructions indépendantes à des moments différents du
chantier. Zone : scripts d'audit uniquement. Correction recommandée : ajouter une note croisée dans
chaque script pointant vers l'autre, ou envisager de fusionner à terme les deux catalogues d'agents
si un futur audit doit les comparer directement. Difficulté : faible. Risque de régression : nul.

## 21. Recommandations prioritaires

1. (P1) Étudier la normalisation du calcul de progression pour redonner de l'agence perceptible
   même en jouant un parti à fort potentiel de départ.
2. (P2) Envisager, sans urgence, d'élargir légèrement le nombre d'événements à effet direct sur un
   adversaire nommé, si le sentiment d'agence sur cette dimension est jugé prioritaire.
3. (P3) Si un rééquilibrage idéologique inter-axes est un objectif produit, cibler prioritairement
   les axes société et immigration en contenu additionnel plutôt qu'en ajustement moteur.
4. (P4) Documenter croisement entre les deux jeux d'agents/stratégies pour éviter une confusion
   future entre les deux séries de mesures d'agence du joueur.
5. Conserver `scripts/audit-post/` comme outillage de non-régression : relancer
   `npm run audit:game` avant toute modification substantielle du moteur électoral ou du contenu,
   pour détecter tout retour en arrière sur les cinq problèmes audités ici.

## 22. Conclusion finale

Les cinq problèmes de l'audit précédent ont fait l'objet d'un travail réel, vérifiable
indépendamment avec le moteur de production et sans complaisance méthodologique : deux sont
corrigés au sens le plus strict du terme (répétition des choix et des conséquences, à la fois
lexicalement et mécaniquement — répétitions intra-partie ramenées à zéro par une garantie
structurelle et non par un simple ajustement de probabilité), un est largement corrigé avec une
réserve mineure documentée (le monde vivant, actif et mesurable, mais avec une capacité d'action
directe du joueur sur ses adversaires qui reste étroite), et un est partiellement corrigé avec un
angle mort clairement identifié plutôt que dissimulé (l'agence du joueur progresse nettement sur le
score et l'issue de la campagne, mais reste faible sur la métrique de progression spécifiquement,
et le parti initial demeure le facteur le plus déterminant du jeu).

Réponse directe à la question posée en introduction : les modifications ont transformé le jeu en
une simulation objectivement plus variée (100 % d'unicité textuelle, diversité mécanique
confirmée indépendamment du texte), plus réactive (monde adverse et mémoire mesurablement actifs
là où ils étaient nuls) et plus dépendante des décisions du joueur (effet causal démontré par
expérience contrefactuelle stricte, pas seulement corrélationnel) — ce n'est pas une variété
superficielle. Le parti initial reste néanmoins le facteur unique le plus influent sur le résultat
brut, en particulier sur la dynamique de progression, ce qui borne la portée de l'amélioration sur
le problème C sans l'annuler.
