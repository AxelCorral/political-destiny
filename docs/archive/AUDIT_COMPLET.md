# Audit complet — Vers l’Élysée

> Audit réalisé le 5 août 2026 sur le commit de départ **96c0ae2**. Aucun fichier fonctionnel ni aucune donnée du jeu n’a été modifié. Les résultats bruts, les scripts et les captures sont conservés dans [audit](audit/) et [scripts/audit](scripts/audit/).

## Méthode et périmètre

L’audit confronte quatre sources de preuve :

1. le cahier des charges maître, le README, TODO.md, AGENTS.md, l’historique Git et les 99 fichiers sources ;
2. une analyse statique exhaustive des 182 événements, 533 choix et 1 066 résultats pondérés ;
3. 7 900 campagnes automatisées, dont 5 400 avec les neuf partis existants, 1 600 avec quatre partis personnalisés et 900 campagnes instrumentées ;
4. des parcours réels dans le navigateur sur cinq tailles d’écran, dont une campagne complète et une création de parti personnalisée.

Les agrégats de référence sont dans [metrics.json](audit/metrics.json). Les définitions des heuristiques et les listes exhaustives sont dans [content-report.json](audit/content-report.json), [simulation-report.json](audit/simulation-report.json), [campaign-dynamics-report.json](audit/campaign-dynamics-report.json), [entity-inventory.json](audit/entity-inventory.json) et [browser-report.json](audit/browser-report.json). La mesure de « contenu distinct » à 11,54 % est un indicateur structurel et lexical volontairement sévère ; ce n’est pas un jugement sémantique humain événement par événement.

## 1. Résumé exécutif

### Réponses directes

- **Le jeu est-il déjà amusant ?** Oui pendant une première partie, de façon modérée. Le démarrage est clair, les décisions s’enchaînent vite, les sondages donnent un objectif lisible et la soirée électorale produit un dénouement. La campagne manuelle Parti socialiste, seed audit-browser-ps, s’est terminée à 15,4 % au premier tour, 48,7 % au second et 78/100 : le parcours a fonctionné sans erreur. L’intérêt baisse dès que le joueur reconnaît que presque chaque carte applique le même arbitrage prudent / risqué / collectif et les mêmes textes de résultat.
- **Est-il déjà rejouable ?** Faiblement. Deux campagnes successives ne partagent en moyenne que 14,44 % de leurs identifiants d’événements, mais 99,70 % de leurs structures de choix. Le catalogue change ; la grammaire ludique demeure presque identique. Dans une partie, 17,43 résultats narratifs et 23,07 titres de résultats sont répétés en moyenne.
- **Ressemble-t-il réellement à une campagne présidentielle française ?** Partiellement. Les neuf partis, l’élection à deux tours, les parrainages, les institutions, les thèmes et le vocabulaire général installent la France. Le calendrier du premier tour est faux d’une semaine, les quatre instituts de sondage sont inventés, la carte ne contient que huit macro-régions abstraites, 61,8 % des entités nommées classées sont fictives et les adversaires n’ont ni mémoire politique ni alliances autonomes. Le résultat évoque une campagne française située dans un monde parallèle très prudent.
- **Les choix donnent-ils une véritable sensation d’agence ?** Leur formulation est meilleure que le défaut redouté : 0 % des libellés sont de simples adjectifs, 0 % sont classés abstraits ou sans action par l’heuristique. L’agence mécanique est pourtant faible : les 182 événements possèdent les mêmes identifiants prudent_response et risk_breakthrough, 160 y ajoutent collective_path, et les conséquences convergent vers 35 ensembles réutilisés.
- **Le moteur est-il plus profond que l’interface laisse voir ?** Son architecture l’est : RNG à seed, électorats, idéologies, blocs, adversaires, mémoire, alliances, scissions, effets différés et drapeaux existent dans les types. Le jeu réellement alimenté ne l’est pas : aucune campagne instrumentée ne fait bouger l’idéologie ni la mémoire des acteurs ; aucun événement n’emploie les effets ideology, bloc_trust ou candidate_status.
- **Le contenu est-il suffisamment varié ?** Non pour soutenir plusieurs parties. Les 182 résumés sont plutôt spécifiques, mais seuls 189 des 1 066 récits de résultat sont uniques, et seuls huit titres de résultat existent.

### Trois qualités majeures

1. **Socle technique fiable.** Lint, typecheck, validation des données et build passent. Les 38 tests unitaires passent avec un délai de 15 secondes et les 18 E2E passent en série ; les délais par défaut ont toutefois produit deux échecs intermittents consignés. Le déterminisme passe 18 vérifications sur 18. La sauvegarde corrompue est isolée et signalée ; le mode hors ligne fonctionne.
2. **Parcours complet réellement livré.** Choix de parti, parti personnalisé, méthode de campagne, événements, sondages, deux tours, élimination, gouvernement, archives, badges, export/import et partage PNG sont présents et utilisables.
3. **Interface claire et rapide.** Aucun débordement horizontal sur cinq viewports. Lighthouse mesure 99/100 en performance mobile et 100/100 en accessibilité sur l’accueil ; le bundle transféré de cette page reste proche de 295 Kio.

### Trois défauts majeurs

1. **Une fabrique de contenu écrase la diversité.** Les mêmes huit titres et sept longs récits de résultat servent presque partout. Les textes changent avant le clic ; après le clic, le jeu répond presque toujours avec la même voix.
2. **Le parti initial et le bouton “risqué” dominent la stratégie.** Le parti explique 73,39 % de la variance du score de premier tour, contre 3,00 % pour la stratégie testée. Le RN accède au second tour dans 99,67 % des simulations ; Reconquête dans 0,17 %. La stratégie risquée gagne 33,33 % des parties, contre 18,78 % pour la stratégie collective.
3. **Les systèmes politiques promis restent en grande partie inertes.** En 900 campagnes, 5,97 % seulement des événements joués sont spécifiques au parti, l’idéologie ne change jamais, aucun souvenir d’acteur n’est écrit et aucun remplacement de candidat adverse n’est observé.

### Décision éditoriale

Le projet mérite une **restructuration ciblée**, pas une réécriture totale. Le shell produit, la persistance, le moteur déterministe, les schémas et une grande partie de l’interface doivent être conservés. Le générateur d’événements, la différenciation partisane, l’équilibrage et l’activation des systèmes politiques doivent être repris avant une nouvelle passe de rédaction. Réécrire 182 cartes avant ce travail conduirait à refaire deux fois le contenu.

### Confrontation au cahier des charges maître

| Exigence maître                                  | État                             | Preuve ou écart                                                                               |
| ------------------------------------------------ | -------------------------------- | --------------------------------------------------------------------------------------------- |
| V1 complète, locale, gratuite, sans compte       | Satisfait                        | Build local, IndexedDB, aucune API, aucune authentification.                                  |
| 27 à 33 décisions, environ 30                    | Partiel                          | 25 à 31, moyenne 26,88 ; certaines parties sont sous la cible.                                |
| Au moins 110 événements de qualité               | Quantité satisfaite, qualité non | 182 événements validés ; seulement 17,73 % de récits de résultat uniques.                     |
| Événements probabilistes et différés             | Partiel                          | Probabilités réelles ; seulement six seeds d’événement déclarent un effet différé.            |
| Même seed + mêmes décisions = même résultat      | Satisfait                        | 18/18 traces identiques.                                                                      |
| Hasard sans rendre les décisions inutiles        | Partiel                          | 311/900 groupes changent de destin selon la stratégie, mais parti Eta² 73,39 %.               |
| Partis existants et parti créé                   | Satisfait en surface             | Neuf partis et créateur complets ; campagne personnalisée non conditionnée par son idéologie. |
| Victoire non prédéterminée à 90 % par le parti   | Non satisfait                    | RN qualifié 99,67 %, parti = 73,39 % de variance du premier tour.                             |
| Simulation autonome des adversaires              | Partiel                          | Stats et stratégie évoluent ; aucune mémoire, alliance autonome ou réaction ciblée.           |
| 4 ou 5 choix pour moment décisif/débat/crise     | Majoritairement non              | 9 événements à 4 choix, 0 à 5 ; 125 décisifs selon l’heuristique.                             |
| Éviter trois événements similaires de suite      | Partiel                          | Identifiants variés, structures identiques à 99,70 % entre campagnes.                         |
| Aucun adversaire ne doit rester inerte           | Non démontré                     | 0 mémoire et 0 remplacement observé ; changements numériques sans trajectoire lisible.        |
| Statement ledger ressortant une ancienne phrase  | Non satisfait                    | 91 déclarations, aucun changement idéologique ni réemploi narratif observé.                   |
| Premier tour, reports, abstention et second tour | Satisfait avec défauts           | Deux tours valides ; participation du second tour fixée à +2,4.                               |
| Égalité rarissime avec chaîne                    | Non satisfait                    | 2 à 5 égalités exactes/500, départage lexical silencieux.                                     |
| Carte simplifiée des régions françaises          | Partiel                          | Huit macro-zones non officielles, sans décision territoriale.                                 |
| Succès, archives et score final détaillé         | Partiel                          | Fonctions présentes ; sept badges impossibles et collision d’archive.                         |
| PWA installable et hors ligne                    | Satisfait                        | Service worker et fallback testés hors ligne.                                                 |
| Prudence juridique sur personnes réelles         | Satisfait                        | Scandales attribués à des personnages fictifs ; aucune personnalité réelle mise en cause.     |

## 2. Notes globales sur 100

| Critère                        |   Note | Motif factuel                                                                                             |
| ------------------------------ | -----: | --------------------------------------------------------------------------------------------------------- |
| Concept                        |     82 | Proposition claire, locale, sans compte, avec un cycle de campagne complet.                               |
| Plaisir immédiat               |     60 | Première partie fluide ; conséquence et rythme deviennent prévisibles.                                    |
| Profondeur stratégique         |     38 | Nombreux paramètres internes, faible activation par le contenu.                                           |
| Variété narrative              |     24 | 182 cartes, mais 8 titres et 189 récits uniques sur 1 066 résultats.                                      |
| Qualité des choix              |     45 | Actions concrètes, mais même triptyque dans 160 événements.                                               |
| Réalisme politique français    |     38 | Institutions et partis réels ; calendrier, territoires, sondages et monde fictif affaiblissent l’ancrage. |
| Différenciation des partis     |     38 | Bases très distinctes ; 1,59 événement spécifique par partie et modèles copiés neuf fois.                 |
| Équilibre                      |     25 | Qualification de 99,67 % pour le RN et 0,17 % pour Reconquête.                                            |
| Rejouabilité                   |     30 | Rotation d’identifiants correcte, structure identique à 99,70 %.                                          |
| Rythme                         |     58 | 25 à 31 décisions, moments électoraux nets ; 21,19 % de parties décidées tôt.                             |
| Interface mobile               |     68 | Pas d’overflow, contrôles lisibles ; bilan de 8,56 écrans et badges de 12,88 écrans.                      |
| Interface ordinateur           |     74 | Mise en page stable et rapide ; densité et longueurs restent fortes.                                      |
| Clarté                         |     76 | Onboarding et effets numériques compréhensibles.                                                          |
| Qualité rédactionnelle         |     43 | Résumés corrects ; résultats industriels et 12 erreurs de contraction/accord.                             |
| Qualité technique              |     78 | Séparation moteur/données/UI solide ; collision d’identifiants et composants massifs.                     |
| Performances                   |     95 | Lighthouse 99 mobile, 100 ordinateur ; LCP mobile 2,27 s.                                                 |
| Accessibilité                  |     76 | Accueil Lighthouse 100, clavier et reduced-motion valides ; landmarks imbriqués et petits textes en jeu.  |
| Tests                          |     72 | 38 unitaires et 24 E2E ; branches à 64,14 %, UI peu couverte et deux timeouts intermittents.              |
| Potentiel du produit           |     84 | Architecture et boucle complète donnent un bon levier de correction.                                      |
| État pour publication publique |     38 | Jeu fonctionnel, mais contenu, balance, badges et date électorale sont insuffisants.                      |
| **Note générale**              | **52** | **Prototype complet et robuste, expérience politique encore superficielle.**                              |

## 3. Ce qui fonctionne bien

### 3.1 La boucle de jeu est complète

**Preuve.** Le parcours navigateur couvre accueil, tutoriel, parti, candidat, méthode, campagne, premier tour, second tour, bilan, badges et archives. La capture [bilan mobile](audit/screenshots/bilan-360x800-long.png) vient d’une partie réellement jouée. Les fichiers src/features/onboarding/setup-screens.tsx, src/features/campaign/campaign-screens.tsx et src/features/results/final-screen.tsx couvrent les étapes sans dépendre d’une API externe.

**Impact.** Le joueur peut finir une campagne cohérente sans compte et revenir consulter son résultat. Ce socle vaut la peine d’être conservé.

**Classification.** À conserver avec ajustements mineurs.

### 3.2 Les libellés de choix sont des actions

**Preuve.** Sur 533 choix, le détecteur trouve 0 choix réduit à un adjectif, 0 choix abstrait et 0 choix sans verbe d’action. Exemples : « Suspendre les paiements et vérifier chaque pièce » dans scandal_treasurer_invoices et « Ouvrir une conférence sociale avant toute réforme » dans program_pensions.

**Impact.** Le défaut “Prudent / Agressif / Rassembleur” comme seul texte du bouton n’existe pas. Les tags PRUDENT, RISQUÉ et RASSEMBLEUR sont bien secondaires dans l’interface.

**Classification.** À conserver ; dissocier ensuite ces actions de la matrice de résultat uniforme.

### 3.3 Le déterminisme est réel

**Preuve.** Les 18 paires parti/seed rejouées produisent exactement les mêmes événements, résultats, sondages et fin. Aucun échec de déterminisme dans [simulation-report.json](audit/simulation-report.json). Le générateur et ses dérivations sont isolés dans src/game/engine/random.ts.

**Impact.** Les bugs peuvent être reproduits, les défis quotidiens sont envisageables et les tests d’équilibrage sont fiables.

**Classification.** À conserver.

### 3.4 La persistance locale est défensive

**Preuve.** Une sauvegarde IndexedDB volontairement corrompue déclenche le message « La sauvegarde active était incomplète. Une copie de récupération locale a été conservée. », supprime l’entrée active et crée une clé de récupération. Le rafraîchissement d’une campagne normale reprend au bon écran. Voir [browser-resilience.json](audit/browser-resilience.json) et src/lib/storage/game-database.ts.

**Impact.** Une donnée locale invalide ne bloque pas toute l’application.

**Classification.** À conserver avec une migration/version de sauvegarde plus explicite.

### 3.5 PWA, hors ligne et performance sont déjà publiables

**Preuve.** Le service worker contrôle la page après rechargement, une route déjà visitée reste disponible hors connexion et une route inconnue affiche « Vous êtes hors connexion ». Lighthouse : performance 99 mobile / 100 ordinateur, accessibilité 100 sur l’accueil, LCP 2,27 s / 0,49 s, aucun décalage cumulatif. Aucun message console inattendu avant le test hors ligne.

**Impact.** L’usage local et mobile ne dépend pas d’un réseau stable.

**Classification.** À conserver.

### 3.6 Les données sont validées et séparées

**Preuve.** Les schémas Zod de src/game/schemas/content.ts valident événements et entités ; npm run validate:data passe. Le moteur réside dans src/game/engine, le contenu dans src/game/data et les écrans dans src/features. Graphify relève 49 communautés dans le graphe combiné, sans cycle d’import bloquant signalé.

**Impact.** Une refonte ciblée du contenu peut avancer sans remplacer l’application entière.

**Classification.** À conserver.

## 4. Problèmes bloquants

Aucun P0 : l’application démarre, se construit, sauvegarde et permet de terminer une partie. Six P1 empêchent toutefois une publication éditoriale sérieuse.

### AUD-CONT-01 — La fabrique rend les conséquences interchangeables

### Problème

Les 182 événements utilisent la même paire prudent_response / risk_breakthrough ; 160 utilisent aussi collective_path. Les résultats sont produits dans src/game/data/events/factory.ts avec huit titres seulement.

### Preuve

- 1 066 résultats pondérés, 189 récits uniques (17,73 %) et 8 titres uniques (0,75 %) ;
- « Une réponse qui rassure » apparaît 182 fois ;
- « La prudence ressemble à une hésitation », « Le pari crée une ouverture » et « Le pari se retourne » apparaissent chacun 182 fois ;
- une partie contient en moyenne 17,43 récits et 23,07 titres déjà lus plus tôt dans la même partie.

### Impact

Après quelques cartes, le joueur anticipe le texte et ne lit plus les conséquences. Le contexte politique disparaît exactement au moment où la décision devrait produire une histoire.

### Recommandation

Remplacer la fabrique universelle par cinq à huit familles mécaniques et des résultats propres à chaque événement. Garder les helpers de validation et d’effets, supprimer les récits génériques.

### Priorité

P1.

### Effort

Élevé.

### AUD-BAL-01 — Le choix du parti et le risque écrasent la compétence

### Problème

Le socle électoral initial décide l’essentiel du premier tour, tandis que la stratégie “risquée” domine les autres styles.

### Preuve

- le parti explique 73,39 % de la variance du premier tour ; la stratégie testée, 3,00 % ;
- RN : 99,67 % de qualifications ; Reconquête : 0,17 % ; Les Écologistes et Nouvelle Énergie : 4,33 % ;
- stratégie risquée : 49,22 % de qualifications, 33,33 % de victoires ;
- stratégie collective : 26,22 % de qualifications, 18,78 % de victoires.

### Impact

Une partie difficile ressemble à une défaite assignée ; une partie RN ressemble à une qualification acquise. Le joueur apprend qu’il faut cliquer “risqué”, pas comprendre la situation.

### Recommandation

Définir des objectifs de carrière propres au parti, calibrer les probabilités par situation et rendre chaque stratégie conditionnellement forte. L’équilibrage doit suivre l’activation des systèmes idéologiques, sinon les coefficients seront retouchés deux fois.

### Priorité

P1.

### Effort

Élevé.

### AUD-SYS-01 — L’idéologie, la mémoire et les adversaires ne produisent pas la campagne promise

### Problème

Le modèle de données prévoit des effets riches, mais le catalogue ne les emploie presque pas.

### Preuve

- 0 événement emploie ideology, bloc_trust ou candidate_status ;
- 0 des 91 prises de position applique ideologyDelta ;
- 0 campagne sur 900 ne modifie l’idéologie ou n’écrit une mémoire d’acteur ;
- 0 remplacement adverse observé ; maximum d’une alliance joueur ;
- 1,59 événement spécifique au parti par campagne, soit 5,97 %.

### Impact

LFI, le PS, Les Écologistes, Renaissance, Horizons, LR, le RN, Reconquête et Nouvelle Énergie ont des points de départ différents, mais vivent ensuite presque la même carrière.

### Recommandation

Établir d’abord un contrat de système : axes idéologiques modifiables, relations nommées, mémoire réutilisée, réactions adverses et conditions d’événement. Écrire ensuite les arcs spécifiques.

### Priorité

P1.

### Effort

Très élevé.

### AUD-BADGE-01 — Sept succès sont structurellement impossibles

### Problème

Sept badges ne peuvent pas se déclencher avec l’ordre de calcul ou les bornes actuelles.

### Preuve

- kingmaker et secret_ending sont évalués avant que endingId soit calculé dans src/game/engine/scoring.ts ; 1 858 fins kingmaker, 0 badge kingmaker ;
- historic_score et perfect_campaign voient un score provisoire nul ;
- coalition demande deux alliés, alors que le maximum observé et structurel est un ;
- solvent demande 80 de finances, au-dessus du maximum initial de 73 sans effet positif de finances ;
- million_members demande un million de membres ; la borne généreuse observée par analyse est inférieure à 232 000.

### Impact

Le joueur ne peut pas compléter la collection et n’a aucun moyen de comprendre pourquoi.

### Recommandation

Calculer la fin et le score avant les succès finaux, puis tester chaque badge avec un fixture satisfaisant. Ajuster ou retirer les trois seuils impossibles.

### Priorité

P1.

### Effort

Faible.

### AUD-DATA-01 — Une seed identique provoque une collision d’archive entre partis

### Problème

runId dépend seulement de la seed dans src/game/engine/game.ts. Deux campagnes de partis différents lancées avec la même seed ont le même identifiant. src/lib/storage/game-database.ts conserve existing ?? summary.

### Preuve

La sonde avec la même seed pour le PS et le RN produit run-1v01j67 dans les deux cas. Le second résumé ne crée pas une nouvelle archive et ne remplace pas l’ancien.

### Impact

Perte silencieuse d’un historique, particulièrement probable avec un défi quotidien ou un partage de seed.

### Recommandation

Inclure parti, horodatage ou nonce local dans l’identifiant d’exécution ; conserver la seed séparément pour la reproductibilité. Ajouter un test de deux campagnes de même seed.

### Priorité

P1.

### Effort

Très faible.

### AUD-CAL-01 — Le calendrier officiel est faux

### Problème

src/game/data/config.ts fixe le premier tour au 11 avril 2027.

### Preuve

La [CNCCFP](https://cnccfp.fr/elections/election-du-president-de-la-republique-2027/) indique, au 5 août 2026, un premier tour le **18 avril 2027** et un second tour le **2 mai 2027**. Elle indique aussi l’ouverture de la période de financement au 1er avril 2026.

### Impact

Une date centrale vérifiable contredit le cadre réel revendiqué et décale les phases.

### Recommandation

Corriger la date, vérifier les bornes mensuelles et ajouter une source datée dans realWorldSnapshot.

### Priorité

P1 éditorial.

### Effort

Très faible.

## 5. Problèmes de contenu et de répétition

### 5.1 Inventaire exhaustif

| Mesure                                          |                  Résultat |
| ----------------------------------------------- | ------------------------: |
| Événements totaux                               |                       182 |
| Événements atteints sur 5 400 campagnes         |                       175 |
| Événements non atteints                         |                         7 |
| Choix totaux                                    |                       533 |
| Moyenne de choix par événement                  |                     2,929 |
| Événements à 2 / 3 / 4 / 5 choix                |          22 / 151 / 9 / 0 |
| Textes de choix uniques                         |         385, soit 72,23 % |
| Résultats pondérés                              |                     1 066 |
| Récits de résultat uniques                      |         189, soit 17,73 % |
| Titres de résultat uniques                      |            8, soit 0,75 % |
| Événements génériques / spécifiques à un parti  |                  128 / 54 |
| Événements spécifiques à une idéologie          |                         0 |
| Événements limités à une phase                  |                        58 |
| Événements rares                                |                         9 |
| Événements “décisifs” selon poids/effets        |                       125 |
| Conditions statiquement impossibles             |                         0 |
| Chaînes / arêtes / événements chaînés           |              11 / 11 / 22 |
| Profondeur moyenne / maximale                   |                     1 / 1 |
| Ensembles de conséquences réutilisés            |                        35 |
| Choix utilisant ces ensembles                   | 471 sur 533, soit 88,37 % |
| Paires quasi dupliquées, Jaccard ≥ 0,62         |                     5 348 |
| Groupes de similarité                           |                        21 |
| Distinction structurelle/textuelle, heuristique |                   11,54 % |

Les sept événements jamais vus sont rare_printer_slogan, rare_hologram_revolt, rare_crown_petition, rare_exceptional_powers, rare_fragmented_congress, rare_national_union et rare_civil_suspension. Deux autres rares apparaissent : rare_parrot_quote 127 fois et rare_debate_blackout 16 fois. Cette absence empirique ne prouve pas une impossibilité logique ; elle montre une probabilité de découverte pratiquement nulle dans l’échantillon.

### 5.2 Les trente formulations de choix les plus répétées

La normalisation retire casse, accents et ponctuation. La liste exhaustive reproductible est dans content-report.json.

| Rang | Occurrences | Formulation normalisée                                       |
| ---: | ----------: | ------------------------------------------------------------ |
|    1 |           9 | accorder une représentation sans céder la direction          |
|    2 |           9 | clarifier deux priorités sans exclure les sensibilités       |
|    3 |           9 | construire une convention publique autour du thème           |
|    4 |           9 | convoquer un conseil national extraordinaire                 |
|    5 |           9 | coordonner le réseau avec un kit national précis             |
|    6 |           9 | en faire le cœur exclusif de la dernière ligne droite        |
|    7 |           9 | faire remonter chaque initiative dans un tableau commun      |
|    8 |           9 | faire voter une feuille de route par les adhérents           |
|    9 |           9 | imposer une ligne unique jusqu’au premier tour               |
|   10 |           9 | lancer une opération locale sans validation du siège         |
|   11 |           9 | menacer les meneurs fictifs d’exclusion                      |
|   12 |           9 | négocier un soutien mutuel sans fusionner les programmes     |
|   13 |           9 | nommer une médiation composée de plusieurs courants          |
|   14 |           9 | recevoir les contestataires et fixer des garanties           |
|   15 |           9 | refuser l’ultimatum et provoquer le vote                     |
|   16 |           9 | relier ce marqueur à deux mesures déjà financées             |
|   17 |           9 | répondre point par point avec une démonstration technique    |
|   18 |           9 | soumettre les termes aux adhérents des deux mouvements       |
|   19 |           4 | chercher un point d’accord avant de marquer votre différence |
|   20 |           2 | conclure immédiatement un accord avec les écologistes        |
|   21 |           1 | accepter avec un thème clairement négocié                    |
|   22 |           1 | accepter dix questions préparées par tirage                  |
|   23 |           1 | accepter la question surprise sans répétition                |
|   24 |           1 | accepter le soutien sans modifier votre programme            |
|   25 |           1 | accepter toutes les questions sans condition                 |
|   26 |           1 | accepter un soutien sans rôle dans l’équipe                  |
|   27 |           1 | accepter une heure centrée sur le programme                  |
|   28 |           1 | accepter une mesure et préserver son autonomie               |
|   29 |           1 | accepter uniquement sans accès privilégié                    |
|   30 |           1 | accorder l’entretien en recentrant sur le programme          |

Les dix-huit premières formulations répétées neuf fois viennent surtout de la duplication des six archétypes partisans pour les neuf partis. Changer le nom du parti, le rival et le thème ne crée pas neuf dilemmes politiques.

### 5.3 Structures d’événements les plus répétées

Il n’existe que dix signatures structurelles ; demander un “top 20” aboutit donc à cette liste complète.

| Rang | Événements | Exemple d’identifiants                          | Structure                                                  |
| ---: | ---------: | ----------------------------------------------- | ---------------------------------------------------------- |
|    1 |         58 | internal_nomination_rules, party_lfi_identity   | prudent + risqué + collectif ; mêmes classes d’effets      |
|    2 |         41 | campaign_official_launch, scandal_false_resume  | prudent + risqué + collectif ; finances/dynamique en échec |
|    3 |         22 | campaign_market_walkabout, rare_parrot_quote    | prudent + risqué seulement                                 |
|    4 |         19 | alliance_left_roundtable, runoff_vote_transfers | prudent + risqué + collectif ; transfert/alliance          |
|    5 |         10 | program_pensions à program_climate_adaptation   | dix sujets de programme, matrice identique                 |
|    6 |          9 | party_*_alliance                                | modèle d’alliance copié pour neuf partis                   |
|    7 |          9 | party_*_crisis_followup                         | modèle de crise copié pour neuf partis                     |
|    8 |          8 | debate_economy_round, debate_post_show_spin     | quatre choix dont technique                                |
|    9 |          5 | world_economic_slowdown, world_security_attack  | effets world + même matrice                                |
|   10 |          1 | runoff_final_debate                             | variante unique à quatre choix                             |

### 5.4 Vingt ensembles de conséquences les plus réutilisés

| Rang | Utilisations | Premier exemple                               | Lecture                                                      |
| ---: | -----------: | --------------------------------------------- | ------------------------------------------------------------ |
|    1 |           60 | internal_nomination_rules / prudent_response  | cohésion ou membres contre cohésion/rivalité                 |
|    2 |           60 | internal_nomination_rules / collective_path   | même bloc collectif interne                                  |
|    3 |           41 | internal_nomination_rules / risk_breakthrough | même bloc risqué interne                                     |
|    4 |           25 | campaign_official_launch / prudent_response   | succès mobilisation/popularité, revers finances/dynamique    |
|    5 |           23 | campaign_official_launch / risk_breakthrough  | même succès + momentum, même revers + fatigue                |
|    6 |           20 | campaign_official_launch / collective_path    | mobilisation/cohésion contre finances/dynamique              |
|    7 |           20 | alliance_left_roundtable / prudent_response   | transfert/position contre stats génériques                   |
|    8 |           20 | alliance_left_roundtable / collective_path    | variante collective d’alliance                               |
|    9 |           17 | alliance_left_roundtable / risk_breakthrough  | variante risquée d’alliance                                  |
|   10 |           15 | media_economic_morning / prudent_response     | crédibilité/média ou popularité/finances                     |
|   11 |           11 | media_unflattering_photo / risk_breakthrough  | effet viral générique                                        |
|   12 |           10 | program_pensions / prudent_response           | crédibilité/constance contre crédibilité/constance           |
|   13 |           10 | program_pensions / collective_path            | crédibilité/cohésion contre popularité/cohésion              |
|   14 |           10 | scandal_treasurer_invoices / prudent_response | crédibilité/cohésion ou finances/popularité                  |
|   15 |           10 | scandal_treasurer_invoices / collective_path  | bloc éthique collectif                                       |
|   16 |            9 | debate_economy_round / technical_path         | technique, crédibilité/média                                 |
|   17 |            9 | program_pensions / risk_breakthrough          | popularité/constance/momentum contre rejet/constance/fatigue |
|   18 |            9 | rare_printer_slogan / prudent_response        | bloc rare prudent                                            |
|   19 |            9 | party_lfi_crisis_followup / risk_breakthrough | bloc crise avec party_split                                  |
|   20 |            8 | debate_economy_round / prudent_response       | bloc débat prudent                                           |

Les signatures JSON complètes et chaque couple événement/choix concerné figurent dans content-report.json. La réutilisation n’est pas un problème en soi ; 471 choix reposant sur 35 vecteurs, associés aux sept mêmes récits, rend les décisions perceptuellement identiques.

### 5.5 Faux choix : diagnostic nuancé

Le problème n’est pas dans les libellés. « Dérouler trois priorités déjà chiffrées », « Annoncer un objectif national inattendu » et « Faire parler des militants de plusieurs territoires » décrivent des actions distinctes. L’heuristique attribue généralement 90/100 en concrétude et 100/100 en clarté.

Le faux choix apparaît dans la **structure cachée** :

- PRUDENT apparaît 182 fois, RISQUÉ 182, RASSEMBLEUR 160, TECHNIQUE 9 ;
- 160 événements sur 182, soit 87,91 %, reposent exactement sur le triptyque prudent/risqué/collectif ;
- les identifiants, titres de résultats et probabilités suivent la même fabrique ;
- les choix d’un événement partisan sont souvent échangeables avec ceux d’un autre : les dix-huit formulations répétées neuf fois en sont la preuve.

La cohérence idéologique est particulièrement faible : 91 choix créent une prise de position, mais aucun ne déplace un axe idéologique. Le jeu sait donc afficher ce que le candidat dit sans mémoriser ce que cette parole change politiquement.

### 5.6 Impression produite

Les introductions couvrent campagne, média, programme, monde, scandale, alliance, débats, raretés et gouvernement. Cette variété de surface suffit lors d’une première partie. Les résultats réemploient ensuite « votre équipe », « la séquence », « le pari » et « les adversaires fictifs ». Le joueur vit une succession de cartes qui modifient des jauges, avec peu de retours différés et des chaînes de profondeur maximale 1. Il ne construit pas un historique politique durable.

## 6. Problèmes de réalisme

### 6.1 Inventaire des entités

La classification contrôlée porte sur 76 entités et 423 mentions. Trois candidats lexicaux restent non classés ; ils sont listés dans entity-inventory.json.

| Catégorie                               | Nombre |
| --------------------------------------- | -----: |
| Parti réel / fictif                     | 10 / 0 |
| Personnalité politique réelle / fictive | 0 / 41 |
| Média réel / fictif                     |  0 / 0 |
| Émission réelle / fictive               |  0 / 0 |
| Institution réelle / fictive            |  8 / 0 |
| Pays réel / fictif                      |  1 / 1 |
| Ville ou région réelle                  |      3 |
| Organisation réelle / fictive           |  1 / 4 |
| Événement inventé                       |      1 |
| Entité ambiguë ou non identifiable      |      6 |

Au total : 23 entités réelles (30,3 %), 47 fictives (61,8 %) et 6 ambiguës (7,9 %).

### 6.2 Classement éditorial

| Classe                                   | Nombre | Exemples et décision                                                                                        |
| ---------------------------------------- | -----: | ----------------------------------------------------------------------------------------------------------- |
| Fiction nécessaire                       |      5 | Cadres impliqués dans des scandales sensibles : à garder fictifs.                                           |
| Fiction acceptable                       |     37 | Candidats et rivaux secondaires : juridiquement prudents, mais à individualiser.                            |
| Fiction paresseuse                       |      4 | Quatre instituts de sondage inventés appliqués partout : à remplacer par un habillage explicitement simulé. |
| Fiction qui réduit fortement l’immersion |      9 | « États imaginaires », « Parlement européen fictif », macro-régions abstraites : à remplacer.               |
| Réel utilisable                          |      8 | Institutions et mécanismes constitutionnels : à conserver.                                                  |
| Réel à actualiser ou sourcer             |     13 | Partis, calendrier, financement, pluralisme, données territoriales : source datée requise.                  |

Les 752 occurrences de termes comme fictif, fictive ou imaginaires évitent l’ambiguïté juridique, mais rappellent constamment au joueur que le monde n’est pas la France réelle. « Parlement européen fictif » est particulièrement contre-productif : le Parlement européen existe ; seule la situation racontée doit être présentée comme hypothétique.

### 6.3 Ce qui peut être réel sans accusation

Les partis, l’Élysée, le Conseil constitutionnel, l’Assemblée nationale, le Sénat, les régions, villes, pays, règles de parrainage et formats publics peuvent être nommés. L’[Arcom](https://www.arcom.fr/nous-connaitre-nos-missions/garantir-le-pluralisme-et-la-cohesion-sociale/proteger-le-pluralisme-politique) documente le pluralisme politique audiovisuel ; l’[Insee](https://www.insee.fr/fr/metadonnees/definition/c1502) fournit la définition officielle des régions ; la [CNCCFP](https://cnccfp.fr/elections/election-du-president-de-la-republique-2027/) publie les dates et règles financières.

Les personnalités réelles peuvent figurer uniquement pour des faits publics sourcés ou leur fonction. Les infractions, rumeurs, citations, secrets privés et conduites sensibles fictives doivent rester associés à des personnages explicitement fictifs et non identifiables. L’absence totale de personnalité réelle est donc sûre, mais inutilement stérile pour les séquences factuelles.

### 6.4 Différenciation politique

Les données de src/game/data/parties.ts donnent à chaque parti des bases, idéologies, électorats, forces, faiblesses et rivaux différents. Ces bases expliquent fortement les résultats. La campagne vécue ne matérialise presque pas leur culture :

- six événements sont déclarés par parti, soit 54, mais une partie n’en voit que 1,59 en moyenne ;
- les six archétypes sont construits par la même fonction pour les neuf partis ;
- aucune décision ne déplace l’idéologie ;
- aucune condition d’événement ne cible un axe idéologique ;
- les réserves de voix sont principalement des affinités numériques, rarement une alliance ou un conflit raconté.

**Conclusion par parti.** LFI, le PS, Les Écologistes, Renaissance, Horizons, LR, le RN, Reconquête et Nouvelle Énergie ont des difficultés initiales différentes, pas neuf campagnes différentes. Le RN perd même 4,62 points en moyenne tout en se qualifiant presque toujours ; Horizons gagne 5,82 points mais se qualifie rarement. Cela peut être une histoire de carrière intéressante, à condition que l’écran final et les objectifs la reconnaissent explicitement.

### 6.5 Parti personnalisé

Les huit réponses modifient effectivement les axes, électorats, ressources et forces. C’est une qualité. Les limites sont importantes :

- base fixe de 3,8 %, potentiel fixe de 18 %, affinités régionales toutes initialisées à 50 ;
- aucun événement conditionné par l’idéologie ou le statut personnalisé ;
- les réponses sont précochées et aucune cohérence globale n’est expliquée ;
- un profil volontairement contradictoire gagne plus souvent que deux profils idéologiquement cohérents.

Sur 1 600 campagnes : gauche-écologiste cohérente 6,5 % de qualifications, conservatrice cohérente 8,25 %, hybride contradictoire 12,25 %, centriste par défaut 16,5 %. Le créateur personnalise le départ ; il ne génère pas encore une campagne sur mesure.

## 7. Problèmes de game design

### 7.1 Agence réelle

| Type                  | État actuel   | Preuve                                                                                 |
| --------------------- | ------------- | -------------------------------------------------------------------------------------- |
| Narratif              | Partiel       | Actions contextualisées, résultats génériques.                                         |
| Stratégique           | Faible        | Stratégie testée = 3,00 % de variance du premier tour.                                 |
| Cosmétique            | Fréquent      | Texte et tag différents, même vecteur de conséquence.                                  |
| Faux choix            | Structurel    | 160 triptyques identiques malgré des verbes concrets.                                  |
| Choix dominant        | Oui           | Style risqué : 33,33 % de victoires, collectif : 18,78 %.                              |
| Piège sans indication | Oui par parti | Certaines campagnes sont presque impossibles à gagner, sans objectif alternatif clair. |
| Purement aléatoire    | Partiel       | Chaque option a des issues pondérées ; la même seed reste reproductible.               |

Le résultat dépend raisonnablement des statistiques dans le code, mais le joueur ne voit ni la formule de probabilité ni les compétences qui ont pesé. Il comprend les deltas après coup ; il comprend rarement pourquoi une action a réussi. L’apprentissage porte donc sur le tag “RISQUÉ”, pas sur une doctrine, un électorat ou une relation.

### 7.2 Hasard contre compétence

La seed change les cartes et les tirages, mais le parti fixe la majeure partie du destin. Sur les mêmes groupes parti/seed, changer de stratégie modifie qualification ou victoire dans 311 cas sur 900 ; les choix ne sont donc pas inutiles. Leur portée moyenne reste modeste au premier tour : écart moyen de 2,895 points entre les six stratégies.

La stratégie “greedy” et la stratégie “adverse” des scripts sont des heuristiques numériques d’audit, pas des stratégies visibles par le joueur. Leur performance ne prouve pas une solution optimale humaine ; elle confirme que les deltas immédiats ne résument pas correctement la valeur d’un choix.

### 7.3 Spirales et parties décidées

1 144 campagnes sur 5 400, soit 21,19 %, sont classées “décidées tôt” par le checkpoint documenté dans simulation-report.json. Seules 237, soit 4,39 %, accomplissent une remontée spectaculaire. Les partis au socle haut absorbent les revers ; les plus faibles ne disposent pas d’un arc spécifique pour élargir leur coalition.

### 7.4 Progression et rythme

Une campagne dure 25 à 31 décisions, 26,88 en moyenne. Le début et les scrutins sont lisibles. Les débats ont quatre boutons et une présentation distincte, mais huit débats partagent exactement la même structure et les mêmes deux résultats techniques. Le nombre d’événements ne suffit pas à créer une montée : les enjeux “décisifs” sont 125 sur 182 et perdent leur rareté.

La soirée électorale fonctionne visuellement, mais le bilan sélectionne les cinq dernières décisions comme “moments clés”. Une décision routinière tardive peut évincer le scandale ou le débat qui a réellement changé la partie.

### 7.5 Rejouabilité

- nouveauté d’identifiants élevée entre deux runs : chevauchement moyen 14,44 % ;
- nouveauté structurelle quasi nulle : chevauchement 99,70 % ;
- huit fins observées sur quinze ;
- quatre succès sont obtenus dans les 5 400 campagnes ;
- onze chaînes seulement, toutes de profondeur 1.

Estimation : la répétition des résultats devient visible pendant la première partie, la répétition de structure est forte dès la deuxième, et le sentiment d’avoir compris l’essentiel apparaît après trois à cinq parties. Changer de parti prolonge peu cette durée, sauf par la difficulté initiale.

## 8. Problèmes de simulation électorale

### 8.1 Sondages

Les résultats affichés sont normalisés : écart maximal à 100 de 2,84 × 10⁻¹⁴. Le moteur conserve des indécis internes, de 17,06 % en moyenne au départ jusqu’au plancher de 2 %. Le joueur ne les voit pas. Les sondages ajoutent un bruit de ±3,8 points et l’élection un bruit de ±3,2, mais aucune marge d’erreur n’est expliquée à l’écran.

Les quatre noms — Observatoire Hexagone, Baromètre Civique, Institut Agora et Panel République — sont fictifs. Cette fiction est acceptable si l’interface dit clairement « simulation, pas un sondage réel » et affiche la fourchette. La [Commission des sondages](https://www.commission-des-sondages.fr/hist/communiques/communique-commission-des-sondages-2021-04-09.htm) rappelle l’importance des marges d’erreur dans une publication réelle ; le jeu n’y est pas assimilé, mais son modèle éditorial devrait reprendre cette pédagogie.

Le vote utile, l’abstention et les indécis existent sous forme de coefficients ou de masse interne ; ils sont peu lisibles. La normalisation à 100 % masque la différence entre intention exprimée et ensemble des inscrits.

### 8.2 Adversaires

src/game/engine/opponentSimulation.ts change périodiquement leur stratégie et leurs statistiques. Une sonde de 20 tours observe sept changements de stratégie. C’est une simulation numérique réelle, pas uniquement un texte ajouté après coup.

Elle reste rudimentaire :

- aucune mémoire d’événement n’est écrite ;
- aucune alliance adverse autonome n’est créée ;
- aucune candidature dissidente ni aucun retrait observé ;
- aucune réaction ciblée au joueur ; une “attaque” améliore surtout l’attaquant ;
- zéro remplacement sur 900 campagnes, malgré une branche de code prévue ;
- ambition, loyauté et légitimité ne créent pas d’arc suivi.

**Classification.** À restructurer, en conservant la boucle et les modèles.

### 8.3 Second tour

Le moteur tient compte de la proximité idéologique, du rejet, de la transférabilité, des consignes, de l’alliance et d’un bruit allant jusqu’à ±6,5 avant normalisation. Sur 500 seeds PS/RN appariées :

| Scénario                 | Score PS moyen | Victoires PS |
| ------------------------ | -------------: | -----------: |
| Baseline                 |       50,598 % |       51,8 % |
| Alliance PS–LFI          |   +0,566 point |       55,2 % |
| Rejet PS à 100           |   −1,604 point |       42,4 % |
| Transférabilité PS à 100 |  +2,142 points |       64,8 % |
| Idéologie PS extrême     |  −3,599 points |       34,2 % |

Les effets sont directionnellement cohérents. Trois défauts subsistent :

1. la participation vaut toujours 72,4 %, quel que soit le duel ou le rejet ;
2. deux à cinq égalités exactes sur 500 sont départagées par l’ordre lexical, sans règle ni récit ;
3. les reports sont agrégés et difficilement auditables par le joueur.

Les scénarios avec candidat disqualifié donnent bien zéro voix à ce candidat et les totaux restent à 100.

### 8.4 Carte régionale

Les totaux régionaux sont mathématiquement cohérents, mais les huit zones sont des regroupements abstraits. Le calcul applique essentiellement le score national à une affinité de parti, puis normalise. Il n’y a ni événement territorial conditionnel, ni allocation de ressources régionale, ni bénéfice stratégique à lire la carte.

**Impact.** La carte fournit une couleur de résultat, pas un système territorial.

**Recommandation.** Employer les régions officielles ou un découpage électoral justifié, lier quelques décisions à des territoires et expliquer pourquoi le score y diffère. Sinon, remplacer la carte par un tableau de blocs électoraux plus honnête.

**Priorité.** P2.

## 9. Problèmes narratifs

### 9.1 Corpus et longueurs

L’analyse porte sur 3 029 champs narratifs. Les résumés font de 25 à 42 mots, 30,88 en moyenne ; les choix de 4 à 10 mots, 6,88 en moyenne ; les résultats de 23 à 33 mots, 27,39 en moyenne. Le vouvoiement est constant : 1 665 marques de vous/votre/vos et aucun tutoiement détecté.

Les longueurs sont donc maîtrisées. Le défaut vient de la génération :

- src/game/data/events/factory.ts ajoute exactement la phrase « Cette décision met à l’épreuve votre méthode, votre cohérence et la capacité de l’équipe fictive à rester unie. » à 28 événements trop courts ;
- sept récits complets fournissent 926 résultats dupliqués ;
- 752 qualificatifs de fiction encombrent le corpus ;
- des résumés partisans concatènent un article au nom sans contraction.

### 9.2 Erreurs françaises visibles

Le modèle de src/game/data/events/partySpecific.ts produit douze erreurs certaines :

- party_ps_identity et party_ps_crisis_followup : « Au sein de le Parti socialiste » ;
- party_ps_alliance : « Les Écologistes propose à le Parti socialiste » ;
- party_ecologistes_identity, party_ecologistes_signature et party_ecologistes_crisis_followup : « de Les Écologistes » ;
- party_lr_identity, party_lr_signature et party_lr_crisis_followup : « de Les Républicains » ;
- party_rn_identity et party_rn_crisis_followup : « Au sein de le Rassemblement national » ;
- party_rn_alliance : « Reconquête propose à le Rassemblement national ».

**Recommandation.** Les noms de partis doivent porter leurs formes grammaticales, par exemple nomCourt, deNom et auSeinDe, au lieu d’être injectés dans une phrase fixe.

L’affichage parfois illisible des accents dans certaines sorties PowerShell de l’audit est un problème de rendu du terminal ; le navigateur affiche correctement les fichiers UTF-8. Ce n’est pas un bug de données du jeu.

### 9.3 Lexique des cinquante expressions ou structures les plus répétées

Le calcul prend des n-grammes normalisés de deux à quatre mots sur les résumés et résultats. Les fragments qui se recouvrent sont conservés : ils montrent qu’un paragraphe complet est dupliqué 182 fois.

| Rang | Expression              | Nombre | Rang | Expression                     | Nombre |
| ---: | ----------------------- | -----: | ---: | ------------------------------ | -----: |
|    1 | la campagne             |    377 |   26 | une réponse qui rassure        |    182 |
|    2 | votre équipe            |    376 |   27 | réponse qui rassure votre      |    182 |
|    3 | adversaires fictifs     |    365 |   28 | qui rassure votre réponse      |    182 |
|    4 | la prudence             |    364 |   29 | rassure votre réponse cette    |    182 |
|    5 | le pari                 |    364 |   30 | votre réponse cette séquence   |    182 |
|    6 | la séquence             |    195 |   31 | réponse cette séquence est     |    182 |
|    7 | plusieurs adversaires   |    192 |   32 | cette séquence est jugée       |    182 |
|    8 | la campagne mais        |    191 |   33 | séquence est jugée solide      |    182 |
|    9 | campagne mais           |    191 |   34 | est jugée solide et            |    182 |
|   10 | une réponse             |    189 |   35 | jugée solide et proportionnée  |    182 |
|   11 | équipe le               |    187 |   36 | solide et proportionnée elle   |    182 |
|   12 | une partie              |    185 |   37 | et proportionnée elle ne       |    182 |
|   13 | votre position          |    184 |   38 | proportionnée elle ne renverse |    182 |
|   14 | du temps                |    184 |   39 | elle ne renverse pas           |    182 |
|   15 | une partie de           |    183 |   40 | ne renverse pas seule          |    182 |
|   16 | votre équipe doit       |    183 |   41 | une réponse qui                |    182 |
|   17 | votre équipe le         |    183 |   42 | réponse qui rassure            |    182 |
|   18 | vos adversaires fictifs |    183 |   43 | qui rassure votre              |    182 |
|   19 | votre réponse           |    183 |   44 | rassure votre réponse          |    182 |
|   20 | auprès des              |    183 |   45 | votre réponse cette            |    182 |
|   21 | partie de               |    183 |   46 | réponse cette séquence         |    182 |
|   22 | équipe doit             |    183 |   47 | cette séquence est             |    182 |
|   23 | un message              |    183 |   48 | séquence est jugée             |    182 |
|   24 | le récit                |    183 |   49 | est jugée solide               |    182 |
|   25 | vos adversaires         |    183 |   50 | jugée solide et                |    182 |

Les expressions suggérées dans la demande — « jouer la carte de », « rassembler », « prendre la parole », « contre-attaquer », « faire profil bas », « afficher sa fermeté », « créer la surprise » et « les réseaux s’enflamment » — apparaissent chacune zéro fois. Le corpus évite ces clichés précis ; il les remplace par une autre prose industrielle : « le récit s’impose » 182 fois, « angle d’attaque inattendu » 182 fois, « votre équipe » 376 fois et « la séquence » 195 fois.

### 9.4 Cohérence entre choix et résultat

Le récit de succès prudent est identique après un débat fiscal, une panne de bus, un attentat fictif, un conflit interne ou une nomination de Premier ministre : « Votre réponse à cette séquence est jugée solide et proportionnée. » Il ne dit ni ce qui s’est passé, ni qui a réagi, ni quelle promesse est désormais opposable au candidat.

Les deltas numériques diffèrent parfois, mais le joueur voit surtout la même validation morale. À l’inverse, une issue négative ne donne presque jamais d’information exploitable pour la partie suivante. Elle annonce une hésitation, un brouillage ou du jargon, sans relier l’échec à une statistique faible ou à une décision antérieure.

**Classification.** Les résumés de situation sont à améliorer significativement ; la fabrique de résultats est à remplacer.

## 10. Problèmes UX

### 10.1 Parcours testés

| Écran ou fonction                      | Résultat                                                             |
| -------------------------------------- | -------------------------------------------------------------------- |
| Accueil, tutoriel et choix du mode     | Compréhensibles, CTA visible.                                        |
| Choix d’un parti                       | Fonctionnel ; liste trop longue sur mobile.                          |
| Création de parti                      | Six étapes claires ; réponses précochées et cohérence non expliquée. |
| Première décision et conséquence       | Action et effets lisibles ; probabilités et facteurs cachés.         |
| Tableau de bord, sondages et carte     | Informations riches ; beaucoup de hauteur et carte peu stratégique.  |
| Sauvegarde et reprise                  | Reprise après rafraîchissement validée.                              |
| Archives, badges, réglages             | Fonctionnels ; badges sans filtre et très longs.                     |
| Premier tour, second tour, élimination | Parcours validés par E2E et campagne manuelle.                       |
| Résumé final et partage                | PNG généré ; bilan excessivement long.                               |
| Mode tout aléatoire                    | Couvert par E2E.                                                     |

### 10.2 Mesures par viewport

Les viewports testés sont 360 × 800, 412 × 915, 768 × 1024, 1366 × 768 et 1920 × 1080. Aucun débordement horizontal n’est détecté.

| Écran             | Hauteur en écrans à 360 × 800 |
| ----------------- | ----------------------------: |
| Accueil           |                          1,92 |
| Choix du parti    |                          3,91 |
| Première décision |                          1,93 |
| Conséquence       |                          1,56 |
| Premier tour      |                          2,52 |
| Second tour       |                          1,71 |
| Bilan             |                          8,56 |
| Badges            |                         12,88 |
| Archives          |                          1,37 |

Captures : [accueil mobile](audit/screenshots/accueil-360x800-long.png), [partis mobile](audit/screenshots/partis-360x800-long.png), [première décision](audit/screenshots/premiere-decision-360x800.png), [premier tour](audit/screenshots/premier-tour-360x800-long.png), [bilan mobile](audit/screenshots/bilan-360x800-long.png), [badges mobile](audit/screenshots/badges-360x800-long.png) et [bilan large](audit/screenshots/bilan-1920x1080.png).

### 10.3 AUD-UX-01 — Le bilan dilue la fin

### Preuve

Le bilan mesure 8,56 hauteurs d’écran mobile, 4,66 sur portable et 3,31 sur écran large. src/features/results/final-screen.tsx fait 468 lignes et juxtapose verdict, note, détail du score, évolution, moments clés, meilleure décision, décision coûteuse, badges, partage et navigation.

### Impact

Le moment émotionnel principal devient une page de rapport. La victoire ou la défaite n’a pas un écran court et mémorable avant l’analyse.

### Recommandation

Séparer en trois niveaux : verdict immédiat, histoire de campagne, détails et partage repliables. Classer les moments par impact réel, pas par récence.

### Priorité

P2.

### Effort

Moyen.

### 10.4 AUD-UX-02 — Les badges sont impraticables à parcourir

### Preuve

La page fait 12,88 écrans mobiles, sans filtre “obtenus / à obtenir / secrets”, recherche ni regroupement repliable. Voir la [capture longue](audit/screenshots/badges-360x800-long.png).

### Impact

La collection ne soutient pas la rejouabilité ; elle devient un inventaire à faire défiler.

### Recommandation

Ajouter filtres, progression globale, groupes et conditions lisibles pour les badges non secrets. Corriger les badges impossibles avant la mise en scène.

### Priorité

P2.

### Effort

Faible.

### 10.5 AUD-UX-03 — Le jeu cache les facteurs qui décident

### Preuve

La carte de choix montre action et tag, puis l’écran de conséquence montre les deltas. Elle ne dit pas que crédibilité, trait, fatigue ou rivalité ont modifié la probabilité. Les stratégies apprises par simulation ne sont pas explicables depuis l’interface.

### Impact

Un échec cohérent avec le moteur ressemble à un tirage arbitraire. Le joueur ne peut pas améliorer son raisonnement d’une partie à l’autre.

### Recommandation

Après résolution, afficher deux ou trois facteurs qualitatifs : « votre crédibilité économique a aidé », « la fatigue a réduit vos chances », sans révéler nécessairement le pourcentage exact. Réserver l’explication complète à un mode détails.

### Priorité

P2.

### Effort

Moyen.

### 10.6 Accessibilité

Points validés :

- navigation clavier et ordre de focus cohérents sur le parcours vérifié ;
- labels de formulaires présents dans le créateur ;
- prefers-reduced-motion actif, durée maximale mesurée 0,01 ms ;
- contraste de l’accueil validé par Lighthouse ;
- titres, erreurs de reprise et fallback hors ligne compréhensibles.

Points à corriger :

- src/app/layout.tsx et src/features/campaign/campaign-screens.tsx créent deux éléments main imbriqués ; l’écran de campagne possède aussi deux en-têtes ;
- certains tags descendent à 10,88 px et certaines télémétries à 10,4 px ;
- des liens d’en-tête mesurent environ 32 × 44 px et des liens de pied de page environ 20 px de haut, sous une cible tactile confortable ;
- le score Lighthouse 100 concerne l’accueil, pas l’ensemble des états dynamiques.

**Priorité.** P2 pour les landmarks ; P3 pour tailles et cibles secondaires.

## 11. Problèmes techniques

### 11.1 État des vérifications

| Vérification           | Résultat                                                                    |
| ---------------------- | --------------------------------------------------------------------------- |
| Installation           | Dépendances présentes, installation reproductible via npm ci                |
| Format                 | Passe après formatage des seuls artefacts d’audit                           |
| ESLint                 | Passe                                                                       |
| TypeScript             | Passe sans émission                                                         |
| Validation des données | Passe                                                                       |
| Vitest                 | 38/38 avec délai 15 s ; 37/38 au dernier run par défaut, timeout uniquement |
| Couverture             | lignes 79,38 %, statements 74,76 %, fonctions 67,28 %, branches 64,14 %     |
| Playwright             | 18 passent et 6 skips en série ; un timeout intermittent en parallèle       |
| Build production       | Passe                                                                       |
| npm audit              | 0 vulnérabilité                                                             |
| Console navigateur     | 0 erreur ou warning inattendu avant test offline                            |
| Lighthouse mobile      | 99 / 100 / 100 / 100                                                        |
| Lighthouse ordinateur  | 100 / 100 / 100 / 100                                                       |

### 11.2 Registre technique

| ID          | Sévérité | Preuve                                                                                                 | Impact joueur                       | Impact développeur                             | Difficulté  | Recommandation                              |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------- | ---------------------------------------------- | ----------- | ------------------------------------------- |
| AUD-DATA-01 | P1       | runId = deriveStableId(seed, “run”) dans game.ts:150 ; existing ?? summary dans game-database.ts:232   | Archive perdue silencieusement      | Test et support difficiles                     | Très faible | Identifiant unique distinct de la seed      |
| AUD-TECH-02 | P1       | factory.ts génère tous les résultats ; 88,37 % des choix réutilisent 35 vecteurs                       | Répétition massive                  | Toute amélioration locale fuit vers 182 cartes | Élevée      | Helpers mécaniques sans prose globale       |
| AUD-TECH-03 | P2       | setup-screens.tsx 962 lignes ; campaign-screens.tsx 806 ; types/index.ts 692                           | Peu direct                          | Revue, tests et évolution risqués              | Moyenne     | Découper par écran et domaine               |
| AUD-TECH-04 | P2       | poll-chart.tsx et stat-gauge.tsx à 0 % de couverture ; regional-map.tsx à 20 % ; onboarding à 33,62 %  | Régressions visuelles possibles     | Confiance incomplète                           | Faible      | Tests composants et a11y                    |
| AUD-TECH-05 | P2       | égalité classée par localeCompare dans election.ts:25                                                  | Vainqueur arbitraire                | Règle métier implicite                         | Faible      | Règle explicite + événement de départage    |
| AUD-TECH-06 | P2       | participation second tour = premier tour + 2,4 dans election.ts:181                                    | Tous les duels mobilisent pareil    | Modèle difficile à calibrer                    | Moyenne     | Participation par bloc, duel et consigne    |
| AUD-TECH-07 | P2       | main dans layout.tsx:43 et campaign-screens.tsx:171                                                    | Landmarks confus                    | Dette d’accessibilité                          | Très faible | Un seul main, régions nommées               |
| AUD-TECH-08 | P2       | résultat final évalué avant endingId et score final dans scoring.ts:83–99                              | Badges impossibles                  | Ordre de calcul fragile                        | Faible      | Pipeline final explicite et testé           |
| AUD-TECH-09 | P3       | schéma DB version 1 ; sauvegarde ancienne clonée à la version courante sans transformateur par version | Risque futur, pas de panne actuelle | Première évolution cassante délicate           | Moyenne     | Migrations numérotées et fixtures anciennes |
| AUD-TECH-10 | P3       | realWorldSnapshot contient accessedAt, mais aucune vérification automatisée de fraîcheur               | Données périmées possibles          | Discipline manuelle                            | Faible      | Date limite et checklist de publication     |

Le journal [final-verification.json](audit/final-verification.json) distingue les assertions fonctionnelles des délais :

- npm run test échoue actuellement sur le test property-based de campagne complète lorsque ses 5 secondes expirent ; le même test et les 38 tests passent avec testTimeout = 15 000 ms ;
- npm run test:e2e a connu un run parallèle à 17 réussites, 6 skips et 1 attente du dialogue initial expirée ; le test ciblé passe ensuite en 1,4 seconde et la suite complète en série donne 18 réussites, 6 skips ;
- ces deux défauts sont des instabilités QA reproductibles sur filesystem lent, pas des assertions métier en échec. Ils restent à corriger.

### 11.3 Architecture et graphe

Le dépôt contient 14 499 lignes source dans 99 fichiers TypeScript/TSX/CSS. Les dix plus gros fichiers vont de 403 à 962 lignes. L’analyse Graphify couvre 124 fichiers pris en charge, environ 64 037 mots, 730 nœuds combinés et 49 communautés. Le rapport [GRAPH_REPORT.md](graphify-out/GRAPH_REPORT.md) confirme une séparation générale données/moteur/features, avec quelques concentrations fortes dans onboarding, campagne, final et archives.

Les dépendances sont cohérentes avec le produit. npm audit ne signale aucune vulnérabilité. Les seules versions “outdated” majeures observées concernent ESLint 10 et TypeScript 7 ; les versions installées satisfont les plages du projet. Aucune mise à jour n’est nécessaire pour cet audit.

### 11.4 Sauvegardes et erreurs

Le stockage IndexedDB valide version, forme et export. Les exports venant d’une version plus récente sont refusés. Une donnée active corrompue est sauvegardée à part puis supprimée. Ce comportement est robuste. Le manque se situe dans une migration explicite entre anciennes versions de schéma quand la structure changera.

### 11.5 Performance et re-renders

Lighthouse et les parcours ne montrent ni blocage, ni layout shift, ni erreur React. Les simulations exécutent 14,16 campagnes par seconde sur la machine d’audit. Aucun profil React détaillé n’a été nécessaire car aucun ralentissement visible n’est apparu. Le long bilan est un problème de volume d’information, pas de temps de rendu mesuré.

## 12. Éléments à supprimer

| Élément                                                    | Action                                   | Justification                                                                         |
| ---------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Sept récits génériques de factory.ts                       | Supprimer après migration                | Ils occupent 926 résultats et effacent le contexte.                                   |
| Huit titres universels de résultat                         | Remplacer                                | 0,75 % de titres uniques ; répétition audible dès la première partie.                 |
| Phrase de remplissage atLeastWords                         | Supprimer                                | Injectée telle quelle dans 28 événements uniquement pour atteindre 25 mots.           |
| Mentions systématiques “fictif/fictive”                    | Réduire                                  | 752 occurrences rappellent le dispositif au lieu de sécuriser une situation précise.  |
| “Parlement européen fictif” et “États imaginaires”         | Remplacer                                | Ils rendent fictive une institution réelle ou créent une géopolitique sans nécessité. |
| Quatre faux instituts présentés comme marques récurrentes  | Remplacer par un habillage de simulation | Fiction paresseuse, sans valeur narrative propre.                                     |
| Huit macro-régions si elles restent non interactives       | Remplacer ou retirer                     | Carte décorative, découpage non officiel.                                             |
| Classement des “moments clés” par cinq dernières décisions | Supprimer                                | La récence n’est pas l’importance.                                                    |
| Badges impossibles dans leur état actuel                   | Désactiver jusqu’à correction            | Une condition mensongère nuit plus qu’un badge absent.                                |
| Date du 11 avril 2027                                      | Supprimer                                | Contredit la date officielle du 18 avril.                                             |

Il ne faut pas supprimer les personnages fictifs liés aux scandales sensibles. Leur fiction est une protection éditoriale utile ; leur caractère secondaire doit être clair.

## 13. Éléments à conserver

| Élément                                                   | Classification                       | Justification                                                   |
| --------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------- |
| Boucle complète onboarding → campagne → élections → bilan | À conserver                          | Parcours stable, réellement jouable.                            |
| RNG à seed et dérivations déterministes                   | À conserver                          | 18/18 vérifications identiques.                                 |
| Séparation moteur / données / interface                   | À conserver                          | Permet une refonte ciblée.                                      |
| Schémas Zod et commande data:validate                     | À conserver                          | 182 événements validés avant exécution.                         |
| IndexedDB, export/import et récupération de corruption    | À conserver                          | Reprise et résilience vérifiées.                                |
| PWA et fallback hors ligne                                | À conserver                          | Fonctionnement local réel.                                      |
| Libellés de choix formulés comme actions                  | À conserver                          | 0 % adjectif seul, abstrait ou sans action.                     |
| Écran de création en six étapes                           | À conserver avec ajustements mineurs | Clair, mais conséquences et cohérence doivent être visibles.    |
| Affichage des deltas après décision                       | À conserver avec ajustements mineurs | Bon feedback, facteurs probabilistes à expliquer.               |
| Deux tours et transferts idéologiques                     | À conserver avec ajustements         | Réactions directionnelles cohérentes aux scénarios extrêmes.    |
| Partis, institutions et mécanismes réels                  | À conserver et sourcer               | Ancrage français utile sans risque narratif particulier.        |
| Personnages fictifs pour scandales sensibles              | À conserver                          | Évite d’attribuer un fait inventé à une personne réelle.        |
| Archives et partage PNG                                   | À conserver avec ajustements         | Fonctionnels ; corriger collision runId et hiérarchie du bilan. |
| Respect de reduced-motion                                 | À conserver                          | Vérifié dans le navigateur.                                     |

## 14. Exemples de réécriture

Ces propositions restent dans l’audit ; aucun événement du jeu n’a été remplacé. La version actuelle complète, y compris chaque issue et chaque effet, est archivée dans [rewrite-sources.json](audit/rewrite-sources.json). Les tags proposés sont des indications secondaires. Chaque réécriture cherche à produire des conséquences incompatibles entre elles, une information mémorisable et, lorsque cela sert le récit, un effet différé.

### 14.1 campaign_official_launch — Lancement officiel

**Version actuelle.** « Votre équipe a réservé une salle symbolique pour l’entrée officielle en campagne. Les militants attendent un cap clair, tandis que les journalistes cherchent surtout l’image qui résumera la soirée. » Choix : « Dérouler trois priorités déjà chiffrées » ; « Annoncer un objectif national inattendu » ; « Faire parler des militants de plusieurs territoires ».

**Problème précis.** Les actions sont claires, mais “objectif inattendu” ne précise aucun enjeu et les trois branches retombent sur les six résultats génériques. Le lieu annoncé comme symbolique n’a aucune identité.

**Proposition.** « À Saint-Denis, le premier grand meeting doit relier votre programme national à la vie quotidienne. Les chaînes d’information prendront quinze minutes en direct ; le reste dépendra des images reprises demain. »

**Choix concrets.**

- Ouvrir par le pouvoir d’achat, annoncer le coût et la source de financement. — Tag : crédibilité.
- Consacrer le direct à une proposition institutionnelle absente du programme publié. — Tag : rupture.
- Céder la moitié du direct à trois militants de territoires différents. — Tag : mobilisation.

**Conséquences distinctes.** Le premier choix teste la crédibilité et crée un fact-check différé ; le deuxième déplace réellement l’axe institutions et peut ouvrir une fronde interne ; le troisième augmente militants et implantation, avec risque de message national dispersé. Mémoriser le thème de lancement pour qu’il soit rappelé au premier débat.

### 14.2 media_economic_morning — Chiffrage en matinale

**Version actuelle.** « Une journaliste fictive vous demande de chiffrer votre mesure phare en direct. Le montant exact n’est pas dans vos notes et votre silence commence déjà à sembler trop long. » Choix : ordre de grandeur prudent ; chiffrage détaillé de mémoire ; renvoi au document de l’équipe.

**Problème précis.** Bonne prémisse, mais aucune mesure ni unité ne permet au joueur de raisonner. L’issue ne dépend pas de sa crédibilité économique.

**Proposition.** « Dans la matinale d’une radio nationale, la journaliste reprend votre promesse de baisse de taxe : “Combien coûte-t-elle la première année ?” Votre fiche indique 7,8 milliards ; une note plus récente, encore non publiée, indique 9,1. »

**Choix concrets.**

- Donner la fourchette de 8 à 9 milliards et promettre la note avant midi. — Tag : transparent.
- Maintenir le chiffre publié de 7,8 milliards et contester la nouvelle estimation. — Tag : offensif.
- Reconnaître que l’arbitrage n’est pas clos et reporter l’annonce. — Tag : prudent.
- Corriger immédiatement le programme à 9,1 milliards et nommer les économies correspondantes. — Tag : technique.

**Conséquences distinctes.** Un fact-check à J+1 vérifie la publication ; la crédibilité économique et la cohérence modifient les chances. Mentir ou ne pas publier doit réapparaître pendant le débat économique.

### 14.3 media_open_microphone — Micro ouvert

**Version actuelle.** « Après une émission, un micro capte une remarque sèche sur l’organisation de votre équipe fictive. La phrase est réelle dans l’univers du jeu, privée, et déjà partagée. » Choix : excuses ; assumer la critique.

**Problème précis.** La “remarque sèche” n’est jamais donnée. Le joueur ne sait pas si les excuses sont proportionnées et ne dispose que d’un axe soumission/affrontement.

**Proposition.** « En quittant le plateau, vous dites que votre directrice de campagne “ne sait plus tenir un agenda”. L’extrait circule ; elle vous demande si vous la soutenez encore. Cette personne est fictive. »

**Choix concrets.**

- L’appeler avant le journal, reconnaître une faute et la confirmer publiquement. — Tag : loyauté.
- Dire publiquement que le désaccord est réel et annoncer une réorganisation. — Tag : autorité.
- Publier l’agenda chaotique et assumer une responsabilité collective. — Tag : transparence.

**Conséquences distinctes.** Le premier réduit la rivalité mais coûte en autorité ; le deuxième peut améliorer l’efficacité ou provoquer une démission différée ; le troisième expose une donnée vérifiable et teste la confiance interne. Créer un drapeau direction_confirmed ou direction_replaced.

### 14.4 debate_economy_round — Manche économique

**Version actuelle.** Le rival attaque la crédibilité des chiffres. Choix : deux chiffres ; retourner l’attaque ; citer les partenaires ; démonstration point par point.

**Problème précis.** Les choix décrivent un style de réponse, sans objet fiscal concret. Le quatrième bouton produit les mêmes deux textes “fond” ou “jargon” dans neuf débats.

**Proposition.** « Votre rival affirme que votre programme creuse le déficit de 20 milliards. Le chiffrage du parti suppose pourtant une entrée en vigueur progressive et 12 milliards de recettes nouvelles. Vous avez quatre-vingt-dix secondes. »

**Choix concrets.**

- Expliquer le calendrier et citer les deux principales recettes. — Tag : pédagogique.
- Identifier une dépense non financée du rival et comparer les deux soldes. — Tag : duel.
- Abandonner en direct la mesure la plus coûteuse pour garantir le solde. — Tag : arbitrage.
- Refuser le cadre du déficit et défendre l’effet de relance attendu. — Tag : doctrinal.

**Conséquences distinctes.** Chaque réponse doit dépendre d’un couple différent : crédibilité/cohérence, maîtrise du rival, soutien interne, proximité idéologique. L’abandon doit modifier le programme et revenir dans program_taxation.

### 14.5 program_pensions — Retraites

**Version actuelle.** Le candidat doit fixer principe, calendrier et dialogue social. Choix : conférence sociale ; nouvel âge légal ; négociation par métiers.

**Problème précis.** “Nouvel âge légal” sans valeur et “réforme par métiers” sans mécanisme évitent le choix politique. Les électorats concernés ne réagissent pas séparément.

**Proposition.** « Votre programme promet de stabiliser le système de retraites, mais ne fixe ni âge légal ni financement. Les syndicats demandent une position avant leur congrès ; les actifs proches de la retraite veulent une règle lisible. »

**Choix concrets.**

- Maintenir l’âge légal et augmenter progressivement les cotisations de 0,2 point. — Tag : contributif.
- Porter l’âge légal à 64 ans avec exemptions de pénibilité. — Tag : budgétaire.
- Revenir à 62 ans et financer l’écart par une contribution sur les hauts revenus. — Tag : redistributif.
- Annoncer six mois de négociation avec une règle de retour à l’équilibre obligatoire. — Tag : négociation.

**Conséquences distinctes.** Déplacer économie et redistribution ; réactions séparées des retraités, salariés, entrepreneurs et syndicats ; événement différé de congrès syndical. Une promesse contradictoire avec une déclaration antérieure doit coûter en constance.

### 14.6 program_immigration — Immigration et intégration

**Version actuelle.** « Vos adversaires fictifs vous pressent de préciser admission, intégration, éloignement et accueil… » suivi de la phrase de remplissage. Choix : distinguer les procédures ; référendum global ; accord parlementaire sur trois mesures.

**Problème précis.** La carte empile quatre politiques publiques puis propose trois méthodes de communication. Elle ne demande aucune décision de fond.

**Proposition.** « Le Parlement examinera avant le scrutin un texte limité aux délais d’asile et à l’exécution des obligations de quitter le territoire. Votre groupe doit déposer ses amendements demain. »

**Choix concrets.**

- Soutenir des délais plus courts avec renforcement de l’aide juridique. — Tag : garanties.
- Conditionner le vote à un contrôle parlementaire annuel des éloignements. — Tag : institutionnel.
- Rejeter le texte et proposer un accès au travail plus rapide pour les demandeurs. — Tag : intégration.
- Soutenir le texte sans amendement et demander ensuite un référendum plus large. — Tag : rupture.

**Conséquences distinctes.** Modifier immigration, autorité, confiance du bloc concerné et relation au groupe parlementaire. Enregistrer le vote, réutilisable lors d’un débat ou d’une négociation de second tour.

### 14.7 internal_rival_interview — Rival interne

**Version actuelle.** Un cadre fictif décrit ce qu’il ferait différemment. Choix : rappel sans sanction ; exclusion de l’équipe ; défense en réunion.

**Problème précis.** Le rival n’a ni proposition, ni loyauté visible, ni mémoire. Sa mise à l’écart ne crée aucun successeur ou courant durable.

**Proposition.** « Nadia Valfort, présidente fictive du groupe parlementaire, défend votre candidature mais demande de retirer la réforme scolaire. Sa loyauté est élevée, son ambition aussi ; douze élus la soutiennent. »

**Choix concrets.**

- Négocier deux amendements et conserver la réforme. — Tag : compromis.
- La retirer du comité stratégique tout en gardant son soutien public. — Tag : discipline.
- Soumettre la réforme au vote du conseil national. — Tag : procédure.
- Retirer la réforme et lui confier la convention sur l’école. — Tag : concession.

**Conséquences distinctes.** Modifier loyauté, ambition, poids du courant et contenu du programme. Une sanction peut créer une dissidence différée ; une concession doit être citée si Nadia sollicite Matignon.

### 14.8 alliance_left_roundtable — Accord à gauche

**Version actuelle.** « Plusieurs partis fictifs proposent une réunion… » Choix : engagements de second tour ; candidature commune immédiate ; convention ouverte.

**Problème précis.** La gauche réelle est remplacée par “plusieurs partis fictifs”, alors que les partis jouables sont nommés ailleurs. Les concessions et circonscriptions n’ont aucune substance.

**Proposition.** « Le PS, LFI et Les Écologistes proposent une réunion publique sur trois garanties de second tour : climat, retraites et proportionnelle. Il s’agit d’une situation hypothétique du jeu, sans citation attribuée à une personne réelle. »

**Choix concrets.**

- Signer seulement une règle de désistement pour le candidat arrivé derrière. — Tag : électoral.
- Négocier un socle commun sur les trois mesures avant toute consigne. — Tag : programmatique.
- Refuser l’accord national et autoriser des soutiens locaux. — Tag : autonomie.
- Proposer une primaire commune avec engagement de retrait. — Tag : maximal.

**Conséquences distinctes.** Créer une alliance nommée, ajouter des concessions au programme, modifier transfertabilité et cohésion selon le parti. Un refus doit influencer les reports de second tour ; une primaire doit ouvrir un événement à risque avant le scrutin.

### 14.9 scandal_false_resume — CV d’un conseiller

**Version actuelle.** Une qualification de Léonard Pujol, personnage fictif, ne peut être confirmée. Choix : retrait temporaire ; licenciement ; cabinet indépendant.

**Problème précis.** C’est l’un des scénarios où la fiction est justifiée. Le défaut vient encore des résultats génériques et de l’absence de chronologie d’enquête.

**Proposition.** « L’université ne retrouve pas le diplôme d’économie mentionné par Léonard Pujol, conseiller fictif qui a validé votre chiffrage. Il parle d’une erreur de mise en page ; la rédaction publiera son article à 20 heures. »

**Choix concrets.**

- Le suspendre immédiatement et publier les documents disponibles. — Tag : transparence.
- Le maintenir hors antenne jusqu’à la réponse écrite de l’université. — Tag : proportionné.
- Rompre son contrat et faire revérifier tout le programme économique. — Tag : rupture.
- Confier la vérification à un cabinet et publier son mandat avant 20 heures. — Tag : indépendant.

**Conséquences distinctes.** Coût financier et médiatique différents ; audit différé obligatoire ; si le programme comporte déjà un fact-check non résolu, risque accru. Aucun résultat ne doit impliquer une culpabilité avant confirmation.

### 14.10 world_international_crisis — Crise européenne

**Version actuelle.** Une « crise diplomatique fictive entre États imaginaires » teste sanctions et autonomie. Choix : réponse européenne ; initiative unilatérale ; réunion des candidats.

**Problème précis.** Sans pays, traité, intérêt français ou échéance, aucune option n’est évaluable. L’expression “États imaginaires” détruit l’ancrage.

**Proposition.** « Après la fermeture contestée d’un détroit commercial hors de l’Union européenne, un Conseil européen extraordinaire doit choisir entre sanctions ciblées et mission de surveillance maritime. Aucun affrontement fictif n’est attribué à un pays réel. »

**Choix concrets.**

- Soutenir les sanctions ciblées et demander une clause de réexamen à trente jours. — Tag : européen.
- Proposer une mission française d’observation sous mandat international. — Tag : autonomie.
- Refuser toute mesure avant un vote du Parlement. — Tag : parlementaire.
- Demander une position commune des candidats limitée à la protection des ressortissants. — Tag : unité.

**Conséquences distinctes.** Déplacer axe européen, crédibilité internationale et confiance institutionnelle. Le choix doit être rappelé lors du débat international ; un coût économique différé peut affecter le prix de l’énergie.

### 14.11 world_security_attack — Attentat fictif

**Version actuelle.** Un attentat fictif interrompt la campagne, sans détail graphique. Choix : suspendre la polémique ; réponse sécuritaire complète ; déclaration commune.

**Problème précis.** La prudence éditoriale est correcte. Le bouton “réponse complète” transforme toutefois une crise sensible en opportunité générique de momentum ; aucune temporalité ni information disponible n’est précisée.

**Proposition.** « Une attaque fictive a fait des victimes. Le parquet antiterroriste a ouvert une enquête et demande de ne relayer aucune identité. Le gouvernement invite les candidats à une cérémonie demain ; aucune mesure nouvelle n’est encore soumise. »

**Choix concrets.**

- Suspendre les déplacements, participer à la cérémonie et ne commenter que les informations officielles. — Tag : retenue.
- Demander la réunion immédiate des présidents de groupe, sans annoncer de loi. — Tag : institutionnel.
- Maintenir un meeting consacré aux services de secours, sans slogan partisan. — Tag : présence.
- Publier dès ce soir un paquet de mesures sécuritaires. — Tag : précipité.

**Conséquences distinctes.** La dernière option doit porter un fort risque de rejet si des faits changent ; les autres influencent autorité, respect institutionnel, mobilisation et fatigue de façons différentes. Créer un suivi quand les premiers faits officiels sont établis.

### 14.12 party_lfi_fronde — Centralisation de LFI

**Version actuelle.** Des cadres fictifs demandent plus d’autonomie thématique. Choix : garanties ; menace d’exclusion ; conseil national extraordinaire.

**Problème précis.** Les contestataires n’ont ni thème ni implantation. Le dilemme est interchangeable avec les huit autres frondes.

**Proposition.** « Trois coordinateurs départementaux fictifs de LFI refusent le kit national sur l’énergie et veulent défendre un moratoire local. Ils représentent 18 % des équipes de terrain dans deux régions où votre score progresse. »

**Choix concrets.**

- Autoriser un amendement local au kit, limité aux deux régions. — Tag : autonomie.
- Maintenir la ligne nationale et remplacer les coordinateurs avant le week-end. — Tag : centralisation.
- Organiser un vote numérique des militants sur le moratoire. — Tag : mouvement.
- Retirer temporairement le thème énergie de la tournée. — Tag : évitement.

**Conséquences distinctes.** Agir sur mobilisation régionale, cohésion, autorité et doctrine énergétique. Les coordinateurs doivent rester des acteurs mémorisés ; un remplacement peut provoquer une liste dissidente.

### 14.13 party_ps_identity — Ligne du PS

**Version actuelle.** « Au sein de le Parti socialiste, la synthèse entre ancrage social-démocrate, union de la gauche et autonomie présidentielle reste contestée. » Choix : deux priorités ; ligne unique ; vote des adhérents.

**Problème précis.** Erreur grammaticale visible et orientations réduites à des méthodes. Aucun contenu n’oblige à choisir entre autonomie, union et social-démocratie.

**Proposition.** « Au sein du Parti socialiste, trois motions fictives demandent une clarification avant la convention : accord de premier tour avec la gauche, candidature autonome ou contrat de gouvernement limité au second tour. »

**Choix concrets.**

- Maintenir une candidature autonome et garantir un désistement réciproque au second tour. — Tag : autonomie.
- Ouvrir immédiatement une négociation de programme commun avec LFI et Les Écologistes. — Tag : union.
- Refuser l’accord national et construire une coalition sociale-démocrate avec élus locaux et syndicats. — Tag : implantation.
- Soumettre les trois lignes au vote des adhérents. — Tag : démocratie interne.

**Conséquences distinctes.** Les options modifient alliances possibles, électorats, cohésion et transferabilité. Le vote doit produire un mandat conservé en mémoire, opposable lors d’une future alliance.

### 14.14 party_rn_alliance — Accord RN–Reconquête

**Version actuelle.** « Reconquête propose à le Rassemblement national des désistements réciproques… » Choix : soutien mutuel ; accord immédiat ; vote des adhérents.

**Problème précis.** Erreur de contraction, concessions vagues, aucune réaction différenciée du socle RN ou du rejet. Le scénario hypothétique emploie des partis réels sans préciser qu’aucune déclaration réelle n’est rapportée.

**Proposition.** « Dans cette simulation, Reconquête propose au Rassemblement national un accord fictif : soutien au mieux placé au second tour contre deux engagements programmatiques sur l’immigration et l’Europe. Aucune citation réelle n’est attribuée. »

**Choix concrets.**

- Accepter la règle de soutien sans reprendre les deux engagements. — Tag : électoral.
- Intégrer l’engagement immigration et refuser celui sur l’Europe. — Tag : concession ciblée.
- Accepter l’ensemble et organiser une déclaration commune. — Tag : alliance.
- Refuser publiquement tout accord avant le premier tour. — Tag : autonomie.

**Conséquences distinctes.** L’alliance améliore les reports mais augmente le rejet et déplace les axes concernés ; le refus protège l’autonomie mais réduit la transférabilité. Réutiliser la concession dans le débat et au second tour.

### 14.15 runoff_vote_transfers — Reports de voix

**Version actuelle.** Les électeurs ne suivent pas mécaniquement leurs dirigeants fictifs. Choix : trois garanties ; recentrage total ; réunions par électorat.

**Problème précis.** La carte reconnaît le problème, mais ne montre ni partis éliminés, ni taille des réserves, ni demandes. “Trois garanties” peut signifier n’importe quoi.

**Proposition.** « Vous êtes au second tour. Les électeurs écologistes pèsent 7,4 % du premier tour et votre adversaire est mieux placé chez les retraités modérés. Les premiers demandent un calendrier climat ; vos soutiens refusent une hausse générale de fiscalité. »

**Choix concrets.**

- Avancer la rénovation thermique sans modifier les autres engagements fiscaux. — Tag : concession ciblée.
- Signer un accord de gouvernement avec Les Écologistes sur trois ministères. — Tag : coalition.
- Concentrer la campagne sur l’abstention des moins de trente ans. — Tag : mobilisation.
- Ne concéder aucun point et dramatiser le choix face à l’adversaire. — Tag : polarisation.

**Conséquences distinctes.** Montrer les transferts attendus par bloc avant validation, puis mesurer reports, abstention différentielle, rejet et cohésion. La coalition doit compter comme une alliance réelle et influencer Matignon.

### 14.16 government_prime_minister — Choix de Matignon

**Version actuelle.** « Votre victoire fictive exige un premier choix symbolique. Une personnalité loyale, une experte indépendante ou une figure de coalition n’enverront pas le même signal. » Choix : personnalité expérimentée ; indépendante inattendue ; nom proposé par la coalition.

**Problème précis.** La carte pourrait conclure les relations construites pendant la campagne, mais propose trois archétypes anonymes. Elle ajoute la phrase de remplissage et ignore alliances, rivaux et promesses.

**Proposition.** « Votre victoire ouvre la nomination du Premier ministre. Trois personnes rencontrées pendant la campagne sont disponibles : votre directrice loyale, la présidente fictive du groupe qui vous a contesté et la négociatrice de votre coalition. Leur ambition, leur loyauté et les accords signés sont connus. »

**Choix concrets.**

- Nommer la directrice de campagne et préserver la ligne présidentielle. — Tag : continuité.
- Nommer la rivale interne contre un accord écrit de majorité. — Tag : équilibre.
- Respecter l’accord de coalition et nommer sa négociatrice. — Tag : coalition.
- Choisir une personnalité extérieure fictive et demander un vote de confiance immédiat. — Tag : ouverture.

**Conséquences distinctes.** La disponibilité des choix dépend des acteurs et alliances réels de la partie. La fin doit raconter qui accepte, qui refuse, la solidité parlementaire et le coût éventuel d’une promesse rompue.

## 15. Analyse quantitative des simulations

### 15.1 Protocole

Le harness appelle le moteur de production sans modifier ses règles :

- 9 partis × 100 seeds × 6 stratégies = **5 400 campagnes** ;
- 4 profils personnalisés × 100 seeds × 4 stratégies = **1 600 campagnes** ;
- **900 campagnes** aléatoires supplémentaires instrumentées pour les dynamiques ;
- total : **7 900 campagnes terminées** ;
- 18 rejouements déterministes appariés ;
- débit : 14,16 campagnes par seconde, 381,2 secondes pour le lot principal ;
- 0 état invalide et 0 campagne bloquée.

Les stratégies prudent, risky et collective prennent le choix du tag correspondant lorsqu’il existe. random tire un choix. greedy maximise une heuristique de deltas immédiats et adverse la minimise ; ces deux dernières ne représentent pas un joueur expert.

### 15.2 Résultat global des partis existants

| Mesure                          |                Résultat |
| ------------------------------- | ----------------------: |
| Qualifications au second tour   |                34,648 % |
| Victoires                       |                24,778 % |
| Premier tour moyen              |                12,832 % |
| Variance du premier tour        |                  17,744 |
| P05 / médiane / P95             | 5,9 % / 12,7 % / 20,0 % |
| Second tour moyen des qualifiés |                53,461 % |
| Note finale moyenne             |            59,722 / 100 |
| Progression moyenne             |           +2,276 points |
| Décisions moyennes              |                  26,881 |

### 15.3 Résultats par parti

Chaque ligne porte sur 600 campagnes.

| Parti                  | Qualification | Victoire | Premier tour moyen | Second tour moyen si qualifié | Progression |
| ---------------------- | ------------: | -------: | -----------------: | ----------------------------: | ----------: |
| La France insoumise    |       12,83 % |   7,83 % |           12,260 % |                      52,122 % |      −0,740 |
| Parti socialiste       |       68,17 % |  52,00 % |           15,947 % |                      54,627 % |      +4,947 |
| Les Écologistes        |        4,33 % |   2,83 % |           10,151 % |                      51,665 % |      +3,651 |
| Renaissance            |       71,50 % |  50,00 % |           15,818 % |                      53,522 % |      +0,818 |
| Horizons               |       16,67 % |  12,33 % |           11,818 % |                      54,296 % |      +5,818 |
| Les Républicains       |       34,17 % |  25,67 % |           13,548 % |                      53,540 % |      +3,548 |
| Rassemblement national |       99,67 % |  68,50 % |           19,383 % |                      52,649 % |      −4,618 |
| Reconquête             |        0,17 % |   0,17 % |            6,669 % |                      52,600 % |      +1,669 |
| Nouvelle Énergie       |        4,33 % |   3,67 % |            9,895 % |                      54,773 % |      +5,394 |

Le RN n’est pas “impossible à perdre” selon le seuil strict du script, mais sa qualification est pratiquement garantie. Reconquête compte une victoire sur 600 ; cinq de ses six groupes de stratégie n’en comptent aucune. La difficulté n’est pas présentée comme un objectif de progression alternatif.

### 15.4 Résultats par stratégie

Chaque ligne porte sur 900 campagnes, cent par parti.

| Stratégie            | Qualification | Victoire | Premier tour | Note finale |
| -------------------- | ------------: | -------: | -----------: | ----------: |
| Aléatoire            |       32,89 % |  23,33 % |     12,688 % |       59,47 |
| Prudente             |       31,56 % |  23,78 % |     12,604 % |       59,30 |
| Risquée              |       49,22 % |  33,33 % |     14,216 % |       65,66 |
| Collective           |       26,22 % |  18,78 % |     11,894 % |       54,99 |
| Greedy, heuristique  |       30,00 % |  22,67 % |     12,391 % |       57,72 |
| Adverse, heuristique |       38,00 % |  26,78 % |     13,198 % |       61,19 |

Le fait que l’heuristique “adverse” batte “greedy” illustre la faiblesse d’une lecture limitée aux deltas visibles : effets cachés, poids probabilistes et calendrier comptent. Il ne faut pas en conclure que choisir volontairement les pires effets est une stratégie humaine viable.

### 15.5 Influence relative

- Eta² du parti sur le score de premier tour : **73,387 %**.
- Eta² de la stratégie : **3,002 %**.
- Écart moyen entre stratégies pour un même parti/seed : **2,895 points** au premier tour.
- Écart moyen de note finale : **14,247 points**.
- Qualification ou victoire change dans **311 groupes appariés sur 900**.

Les décisions influencent donc la trajectoire et la note, mais le point de départ domine l’accès à l’Élysée.

### 15.6 Fréquence des événements et répétition

Les événements les plus présents sont internal_rival_interview 1 920 fois, debate_all_candidates 1 816, program_immigration 1 666, debate_post_show_spin 1 647 et runoff_favorite_pressure 1 625. Ils apparaissent dans 30,1 % à 35,6 % des campagnes. Les cartes de second tour ne concernent naturellement que les qualifiés ; leur fréquence ne constitue pas seule une anomalie.

Dans une partie :

- 23,068 titres de résultat répétés en moyenne ;
- 17,432 récits de résultat répétés ;
- 100 % des parties répètent au moins un titre ;
- aucun identifiant d’événement n’est joué deux fois dans les 900 campagnes instrumentées ;
- le problème est donc la répétition de matrice et de prose, pas une sélection accidentelle du même événement.

### 15.7 Rythme et fins

| Fin observée       | Nombre |
| ------------------ | -----: |
| kingmaker          |  1 858 |
| honorable_campaign |  1 338 |
| president          |  1 338 |
| runoff_defeat      |    533 |
| retirement         |    213 |
| strengthened_party |     96 |
| narrow_elimination |     19 |
| divided_party      |      5 |

Huit fins sur quinze apparaissent. Aucune fin secrète n’est observée. 21,19 % des campagnes sont pratiquement décidées tôt selon le checkpoint ; 4,39 % réalisent une remontée.

### 15.8 Succès et score final

Le score final pondère résultat électoral 30, progression 20, qualification/victoire 15, croissance 10, cohérence 10, héritage 10 et succès 5. Le principe est équilibré et reconnaît une défaite honorable.

Défauts :

- campaign_complete, first_choice, first_poll et ten_good_outcomes sont obtenus dans 5 400 campagnes sur 5 400 ; le dernier n’est donc pas un accomplissement ;
- sept badges sont impossibles ;
- 13 badges se sont affichés lors de la campagne manuelle, ce qui dilue leur mise en scène ;
- les succès valent 0,5 point chacun, plafonnés à 5 : collection et score s’influencent peu ;
- les “moments clés” sont les cinq dernières décisions ;
- meilleure et pire décision sont choisies par nombre d’effets positifs/négatifs, pas par amplitude, probabilité ou impact électoral.

Les mêmes gains de popularité, dynamique et crédibilité alimentent plusieurs composantes du score ; la stratégie risquée peut ainsi améliorer à la fois résultat électoral, progression et badges viral/risk_taker. Le plafond de 5 points des succès limite cette manipulation et aucun exploit donnant 100/100 à volonté n’a été démontré.

Les buckets finaux vont de 20–29 à 90–99 ; 18 campagnes atteignent 90–99, mais historic_score ne se débloque jamais. Les statistiques finales proviennent bien de l’état de la partie ; elles ne sont pas inventées à l’écran. Membres, popularité, rejet et progression sont issus de la trace, mais la position idéologique finale reste identique au départ dans les 900 campagnes instrumentées. Leur sélection narrative est défectueuse.

### 15.9 Partis personnalisés

| Profil                     | Qualification | Victoire | Premier tour | Progression |
| -------------------------- | ------------: | -------: | -----------: | ----------: |
| Gauche-écologiste cohérent |        6,50 % |   3,50 % |      9,251 % |      +5,450 |
| Conservateur cohérent      |        8,25 % |   4,75 % |      9,671 % |      +5,871 |
| Hybride contradictoire     |       12,25 % |   8,75 % |     10,144 % |      +6,344 |
| Centriste par défaut       |       16,50 % |  12,75 % |     10,609 % |      +6,810 |

La stratégie collective ne qualifie aucun des 400 profils personnalisés concernés ; la stratégie risquée qualifie de 25 % à 50 % selon le profil. Le créateur ne punit pas explicitement l’absurdité et ne la transforme pas non plus en narration particulière : l’hybride contradictoire surperforme simplement les profils cohérents.

### 15.10 Déterminisme

Les 18 contrôles répétés avec seed, parti et stratégie identiques produisent les mêmes traces. La collision d’archive ne remet pas en cause ce déterminisme ; elle montre qu’un identifiant de campagne ne doit pas être confondu avec la seed.

## 16. Matrice de priorité

| ID            | Titre                             | Catégorie      | Preuve                                           | Impact                      | Recommandation                                     | Effort      | Dépendances                   | Priorité |
| ------------- | --------------------------------- | -------------- | ------------------------------------------------ | --------------------------- | -------------------------------------------------- | ----------- | ----------------------------- | -------- |
| AUD-CONT-01   | Résultats universels              | Contenu        | 8 titres, 189/1 066 récits uniques               | Lecture abandonnée          | Remplacer la prose de factory.ts                   | Élevé       | Nouveau contrat événement     | P1       |
| AUD-BAL-01    | Parti et risque dominants         | Équilibre      | Eta² parti 73,39 % ; risqué 33,33 % de victoires | Agence faible               | Recalibrer après activation des systèmes           | Élevé       | AUD-SYS-01                    | P1       |
| AUD-SYS-01    | Systèmes politiques inertes       | Game design    | 0 ideology, mémoire ou candidate_status          | Même campagne pour tous     | Activer axes, mémoire et réactions                 | Très élevé  | Schéma et contenu             | P1       |
| AUD-BADGE-01  | Sept badges impossibles           | Progression    | 1 858 kingmaker, 0 badge                         | Collection impossible       | Réordonner scoring et tester chaque condition      | Faible      | Aucune                        | P1       |
| AUD-DATA-01   | Collision runId                   | Persistance    | Même seed PS/RN = run-1v01j67                    | Archive perdue              | Séparer id unique et seed                          | Très faible | Migration archive optionnelle | P1       |
| AUD-CAL-01    | Date électorale fausse            | Réalisme       | 11/04 au lieu du 18/04/2027                      | Cadre factuellement faux    | Corriger et sourcer                                | Très faible | Vérifier phases               | P1       |
| AUD-UX-03     | Facteurs de probabilité cachés    | UX/game design | Deltas visibles, modificateurs invisibles        | Aléa perçu arbitraire       | Expliquer les facteurs après coup                  | Moyen       | Contrat de résolution         | P2       |
| AUD-PARTY-01  | 5,97 % de contenu partisan joué   | Contenu        | 1,59 carte spécifique/run                        | Partis interchangeables     | Arcs de 12–18 cartes par parti                     | Très élevé  | AUD-SYS-01                    | P2       |
| AUD-NAR-01    | Prose industrielle                | Narration      | “le récit s’impose” ×182                         | Monde artificiel            | Résultats propres au contexte                      | Élevé       | AUD-CONT-01                   | P2       |
| AUD-FR-01     | Monde réel sous-utilisé           | Réalisme       | 61,8 % des entités classées fictives             | Immersion faible            | Réaliser lieux/institutions/formats sûrs           | Moyen       | Charte éditoriale             | P2       |
| AUD-GRAM-01   | Contractions et accords           | Rédaction      | 12 erreurs partySpecific.ts                      | Qualité visible             | Formes grammaticales par parti                     | Très faible | Aucune                        | P2       |
| AUD-CUSTOM-01 | Parti personnalisé générique      | Game design    | 0 événement idéologique ; base 3,8 fixe          | Promesse non tenue          | Conditions et arcs issus du profil                 | Élevé       | AUD-SYS-01                    | P2       |
| AUD-OPP-01    | Adversaires sans mémoire          | Simulation     | 0 mémoire, alliance ou remplacement observé      | Monde passif                | États relationnels et décisions ciblées            | Élevé       | AUD-SYS-01                    | P2       |
| AUD-POLL-01   | Incertitude cachée                | Élection/UX    | Indécis internes, affichage normalisé à 100      | Sondage pris pour vérité    | Fourchette, indécis, méthodologie                  | Faible      | Aucun                         | P2       |
| AUD-R2-01     | Participation fixe au second tour | Élection       | Toujours premier tour +2,4                       | Duels peu crédibles         | Mobilisation par bloc et duel                      | Moyen       | Calibration                   | P2       |
| AUD-TIE-01    | Égalité lexicale                  | Élection       | 2–5 égalités/500, tri par identifiant            | Vainqueur arbitraire        | Règle et récit explicites                          | Faible      | Tests extrêmes                | P2       |
| AUD-MAP-01    | Carte décorative                  | Territoires    | 8 zones, affinité simple                         | Complexité sans décision    | Régions réelles et événements, ou retrait          | Élevé       | Données territoriales         | P2       |
| AUD-UX-01     | Bilan de 8,56 écrans              | UX             | Mesure mobile                                    | Climax dilué                | Verdict puis détails repliables                    | Moyen       | Nouveau résumé                | P2       |
| AUD-UX-02     | Badges sur 12,88 écrans           | UX             | Mesure mobile                                    | Collection illisible        | Filtres et groupes                                 | Faible      | AUD-BADGE-01                  | P2       |
| AUD-FINAL-01  | Moments clés par récence          | Résumé final   | slice(-5) scoring.ts:83                          | Mauvaise histoire           | Classer par impact et drapeaux                     | Moyen       | Traçage des effets            | P2       |
| AUD-A11Y-01   | Landmarks imbriqués               | Accessibilité  | Deux main                                        | Navigation assistée confuse | Un main unique                                     | Très faible | Aucune                        | P2       |
| AUD-TEST-01   | Branches et UI peu couvertes      | QA             | 64,14 % branches ; 0 % pour deux widgets         | Régressions                 | Fixtures, composants, a11y                         | Moyen       | Systèmes stabilisés           | P2       |
| AUD-TEST-02   | Délais de test instables          | QA             | Vitest 5 s et dialogue E2E parallèle expirent    | CI non fiable               | Budgets réalistes, attente d’état, workers adaptés | Faible      | Aucune                        | P2       |
| AUD-CHAIN-01  | Chaînes sans profondeur           | Narration      | 11 chaînes, max 1                                | Décisions oubliées          | Arcs de 2–4 suivis                                 | Élevé       | Mémoire/flags                 | P2       |
| AUD-RARE-01   | Sept rares invisibles             | Rejouabilité   | 0 occurrence/5 400                               | Contenu mort en pratique    | Revoir conditions et télémétrie                    | Faible      | Tests de reachability         | P2       |
| AUD-PAD-01    | Phrase de remplissage             | Rédaction      | 28 résumés                                       | Ton artificiel              | Réécrire ou accepter plus court                    | Faible      | AUD-CONT-01                   | P3       |
| AUD-TOUCH-01  | Petits textes et cibles           | Accessibilité  | 10,4 px ; liens ~32 × 44                         | Confort mobile              | Minimums typographiques/tactiles                   | Faible      | Design tokens                 | P3       |
| AUD-MIG-01    | Migration future implicite        | Persistance    | schéma DB 1, clone sans transformateur           | Risque lors d’une V2        | Migrations numérotées                              | Moyen       | Nouveau schéma                | P3       |
| AUD-SOURCE-01 | Fraîcheur manuelle                | Éditorial      | accessedAt sans alerte                           | Données périmées            | Contrôle de date en CI                             | Faible      | Sources officielles           | P3       |

Il n’existe aucun P0. Aucun P4 n’est prioritaire tant que les problèmes P1 et P2 structurants subsistent.

## 17. Roadmap recommandée

### Correctifs immédiats — moins de 4 heures

1. Corriger le 11 avril en 18 avril 2027 et ajuster les bornes de phase.
2. Rendre runId unique indépendamment de la seed ; ajouter le test d’archive PS/RN.
3. Calculer endingId et score avant les badges ; débloquer kingmaker, secret_ending, historic_score et perfect_campaign.
4. Corriger les douze formes grammaticales des partis.
5. Retirer le main imbriqué.
6. Désactiver ou reformuler coalition, solvent et million_members tant que leurs conditions restent impossibles.
7. Stabiliser le property test et l’attente du dialogue E2E sans augmenter aveuglément tous les délais.

**Vérification.** Tests unitaires ciblés, deux archives de même seed, fixtures des sept badges, validation des dates, scan grammatical et axe automatisé des routes de campagne.

### Première passe qualité — 1 à 2 jours

1. Afficher indécis, fourchette et mention de simulation sur les sondages.
2. Ajouter les facteurs qualitatifs de réussite/échec à l’écran de conséquence.
3. Filtrer et regrouper les badges.
4. Réduire le bilan en un verdict immédiat et des détails repliables.
5. Montrer au créateur son vecteur idéologique, ses électorats et un avertissement de contradiction non bloquant.
6. Remplacer les quatre instituts fictifs et les mentions “Parlement européen fictif”.
7. Ajouter tests composants pour poll-chart, stat-gauge et regional-map.

**Vérification.** Parcours 360 × 800 et clavier, tests de composants, bilan initial inférieur à deux écrans, page badges filtrable, sondages dont la masse affichée est explicitée.

### Refonte du contenu — 3 à 7 jours

1. Définir six familles de décision : arbitrage programmatique, crise temporelle, relation, négociation, allocation de ressources, prise de position.
2. Réécrire une tranche verticale de 60 à 80 événements prioritaires, avec résultats propres, facteurs et suivis.
3. Créer au moins quatre arcs de trois étapes et trois dilemmes réellement spécifiques pour chacun des neuf partis.
4. Remplacer les lieux et institutions fictifs inutiles par des entités réelles sûres et sourcées.
5. Passer le corpus dans un contrôle exact, n-grammes, vecteurs d’effets, grammaire et charte diffamation.

**Vérification.** Aucun récit exact dans plus de trois événements, triptyque universel sous 30 %, 25 % de contenu partisan par partie sur la tranche, relecture humaine des situations sensibles.

### Améliorations structurelles — plus d’une semaine

1. Activer ideologyDelta, bloc_trust, candidate_status et la mémoire relationnelle.
2. Faire réagir les adversaires à des actes précis, avec alliances, dissidences, retraits et remplacements plausibles.
3. Reprendre la simulation de participation, reports et vote utile.
4. Choisir entre une vraie couche territoriale et la suppression de la carte stratégique.
5. Recalibrer sur au moins 10 000 campagnes par version de balance.
6. Écrire le reste du catalogue et les fins après stabilisation du modèle.

**Vérification.** Tests d’invariants, traces explicables, objectifs propres aux partis, simulation massive et sessions avec joueurs externes.

## 18. Ordre optimal de refonte

1. **Corriger les faits et pertes de données.** Date, collision d’archive, badges et grammaire ne dépendent pas du futur design.
2. **Figer les métriques d’acceptation.** Transformer les scripts d’audit utiles en contrôles CI avant toute réécriture.
3. **Définir le contrat de décision.** Chaque choix doit pouvoir écrire idéologie, relations, engagements, acteurs et effets différés, avec une explication de probabilité.
4. **Modifier le schéma et le moteur.** Ajouter les migrations, l’ordre de scoring et les réactions adverses avant d’écrire les nouveaux arcs.
5. **Créer une tranche verticale.** Reprendre un parti fort, un parti faible, un parti personnalisé, deux débats, une crise et un second tour. Tester l’agence avant de généraliser.
6. **Réécrire le contenu partisan et les chaînes.** Les événements génériques viennent ensuite, car ils doivent exploiter les relations et promesses déjà stabilisées.
7. **Équilibrer.** Rejouer 10 000+ campagnes seulement après l’activation des systèmes ; régler maintenant conduirait à recommencer.
8. **Refondre bilan, badges et carte.** Ces écrans doivent lire les nouvelles traces, pas inventer une histoire sur l’ancien état.
9. **Terminer par accessibilité, performance et vérification éditoriale.** Les seuils actuels servent de garde-fou pendant les changements.

Cet ordre évite trois doublons : réécrire des textes que le schéma ne sait pas mémoriser, équilibrer des coefficients avant l’ajout des relations, et redessiner un bilan avant de disposer de vrais moments clés.

## 19. Critères d’acceptation de la future V2

### Contenu et rédaction

- au moins **180 événements accessibles**, dont **160 jugés réellement distincts** par revue humaine et signature mécanique ;
- aucun récit de résultat exact utilisé dans plus de **3 événements** ;
- moins de **10 %** de récits répétés à l’intérieur d’une campagne médiane ;
- au moins **95 %** de choix avec action concrète et **85 %** avec objet propre au contexte ;
- **0** choix réduit à un adjectif ;
- aucune structure prudent/risqué/collectif dans plus de **30 %** du catalogue ;
- au moins **6 familles de décisions** et **20 chaînes** de profondeur 2 ou plus, dont 5 de profondeur 3 ;
- 0 faute certaine dans le scan grammatical et la relecture ;
- moins de 100 qualificatifs “fictif/fictive/imaginaires” dans le corpus hors mentions légales ciblées ;
- aucune expression narrative non fonctionnelle présente dans plus de **20 %** des événements.

### Partis, idéologie et rejouabilité

- au moins **25 % d’événements spécifiques au parti par campagne**, sans copier la même structure neuf fois ;
- au moins **12 événements ou variantes uniques par parti**, plus des conditions idéologiques transversales ;
- au moins **20 %** du catalogue conditionné ou modulé par idéologie, relation, promesse ou histoire ;
- au moins une décision mémorisée et réutilisée dans **60 %** des campagnes ;
- chevauchement structurel entre deux campagnes successives inférieur à **60 %** ;
- au moins **12 fins** atteignables dans 10 000 simulations, dont chaque fin secrète couverte par fixture ;
- nouveaux contenus encore rencontrés après la dixième partie dans une session de test contrôlée.

### Équilibre et explicabilité

- déterminisme **100 %** sur 100 paires seed/parti/stratégie ;
- aucun parti au-dessus de **85 %** ou sous **3 %** de qualification dans le mode standard, sauf mode difficulté explicitement signalé ;
- chaque parti possède au moins une stratégie à **5 %** de victoire et un objectif alternatif atteignable entre **25 % et 65 %** ;
- le parti explique moins de **55 %** de la variance du premier tour et les stratégies cohérentes au moins **10 %** ;
- aucune famille de choix ne dépasse les autres de plus de **8 points** de victoire toutes choses appariées ;
- participation, indécis, vote utile et reports vérifiés par invariants ; somme de chaque affichage à 100 ± 0,01 ;
- après chaque résultat, au moins un facteur causal vrai est expliqué au joueur.

### Réalisme et sécurité éditoriale

- **100 %** des institutions, pays et régions sont réels, sauf univers alternatif clairement nécessaire ;
- au moins **65 %** des entités classées sont réelles ou factuelles, en excluant du dénominateur les personnages fictifs nécessaires aux situations sensibles ;
- calendrier et règles électorales contrôlés contre une source officielle de moins de 90 jours avant publication ;
- 100 % des accusations, infractions, secrets et citations inventés concernent des personnages fictifs non identifiables ;
- chaque donnée contemporaine possède source, date d’accès et date de révision.

### UX, accessibilité et technique

- bilan initial inférieur à **2 hauteurs d’écran mobile** avant détails ;
- page badges filtrable, aucun badge impossible et fixture positive pour **58/58** conditions ;
- aucune cible principale inférieure à **44 × 44 px** ;
- 0 violation axe sérieuse ou critique sur les 15 écrans clés ; un seul main par page ; parcours complet clavier ;
- Lighthouse mobile performance ≥ **90**, accessibilité ≥ **95**, LCP ≤ **2,5 s**, CLS ≤ **0,1** ;
- 0 overflow à 320, 360, 412, 768, 1 366 et 1 920 px ;
- couverture lignes ≥ **85 %**, branches ≥ **75 %**, moteur critique ≥ **90 %** ;
- 10 exécutions consécutives des suites par défaut sans timeout ni retry ;
- E2E : sélection, custom, random, qualification, élimination, victoire, défaite, sauvegarde, corruption, import/export, offline et partage ;
- 0 collision d’identifiant sur 100 000 campagnes générées ;
- simulation de validation d’au moins **10 000 campagnes** à chaque changement de balance.

## 20. Verdict final

**Prototype prometteur nécessitant une restructuration.**

Le produit n’est ni un simple squelette ni une façade : la partie complète fonctionne, le moteur est déterministe, la persistance est sérieuse et l’interface est rapide. Il n’est pas prêt pour une publication publique exigeante. Sa faiblesse principale se situe au cœur de l’expérience : 182 mises en situation alimentent presque la même décision ternaire et les mêmes conséquences. La balance transforme ensuite le parti initial en principal déterminant du résultat, tandis que l’idéologie, la mémoire et les adversaires restent inertes.

La bonne décision est de garder l’application et de restructurer la couche de décision politique. Une réécriture intégrale du front ou du moteur de base gaspillerait les éléments les plus solides. Une simple “passe de contenu” sur les textes actuels ne suffirait pas non plus : le schéma et les systèmes doivent d’abord permettre aux nouveaux textes de laisser des traces.

## Commandes utilisées et reproductibilité

### Inspection

- git status --short
- git log --oneline --decorate --graph --all
- git diff --stat et git diff
- rg --files
- rg -n avec les identifiants, types d’effets, conditions et chaînes recherchés
- Get-ChildItem -Recurse pour l’inventaire complet

### Qualité et construction

- npm ci
- npm run format:check
- npm run lint
- npm run typecheck
- npm run data:validate
- npm run test
- npx vitest run --coverage
- npm run build
- npm run test:e2e
- npm audit --json
- npm outdated --json

### Audit reproductible

- npx tsx scripts/audit/content-audit.ts
- npx tsx scripts/audit/entity-audit.ts
- npx tsx scripts/audit/system-audit.ts
- npx tsx scripts/audit/simulation-audit.ts
- npx tsx scripts/audit/custom-party-simulation.ts
- npx tsx scripts/audit/campaign-dynamics-audit.ts
- npx tsx scripts/audit/electoral-extremes.ts
- npx tsx scripts/audit/narrative-audit.ts
- npx tsx scripts/audit/badge-audit.ts
- npx tsx scripts/audit/rewrite-sources.ts
- node scripts/audit/browser-page-metrics.js
- node scripts/audit/play-campaign.js
- node scripts/audit/browser-resilience.mjs
- npx tsx scripts/audit/aggregate-metrics.ts

### Navigateur et performance

- npm run start
- Playwright CLI sur localhost en 360 × 800, 412 × 915, 768 × 1024, 1 366 × 768 et 1 920 × 1 080
- npx lighthouse sur le build local, profils mobile et ordinateur, sortie JSON

### Artefacts

| Fichier                                                              | Rôle                                            |
| -------------------------------------------------------------------- | ----------------------------------------------- |
| [metrics.json](audit/metrics.json)                                   | Agrégat de référence                            |
| [content-report.json](audit/content-report.json)                     | Inventaire, répétitions, faux choix, vecteurs   |
| [simulation-report.json](audit/simulation-report.json)               | 5 400 campagnes existantes                      |
| [custom-party-simulation.json](audit/custom-party-simulation.json)   | 1 600 campagnes personnalisées                  |
| [campaign-dynamics-report.json](audit/campaign-dynamics-report.json) | 900 campagnes instrumentées                     |
| [electoral-extremes.json](audit/electoral-extremes.json)             | 500 seeds par scénario extrême                  |
| [entity-inventory.json](audit/entity-inventory.json)                 | Classification réel/fictif                      |
| [narrative-report.json](audit/narrative-report.json)                 | Lexique, longueurs, erreurs structurelles       |
| [badge-report.json](audit/badge-report.json)                         | Atteignabilité des 58 succès                    |
| [system-report.json](audit/system-report.json)                       | Architecture et mécanismes                      |
| [browser-report.json](audit/browser-report.json)                     | Mesures responsive et captures                  |
| [browser-resilience.json](audit/browser-resilience.json)             | Offline, corruption, console, reduced motion    |
| [vitest-report.json](audit/vitest-report.json)                       | Résultats unitaires                             |
| [playwright-report.json](audit/playwright-report.json)               | Résultats E2E                                   |
| [final-verification.json](audit/final-verification.json)             | Vérifications finales et timeouts intermittents |
| [lighthouse-mobile.json](audit/lighthouse-mobile.json)               | Audit mobile                                    |
| [lighthouse-desktop.json](audit/lighthouse-desktop.json)             | Audit ordinateur                                |

## Limites et zones non testées

- Une seule campagne a été jouée manuellement de bout en bout ; les 7 900 autres sont automatisées. Aucune étude avec des joueurs externes n’a mesuré plaisir ou compréhension.
- La campagne manuelle n’a pas été chronométrée dans des conditions de découverte ; la cible de 10 à 15 minutes est donc évaluée par le nombre et la longueur des écrans, pas validée par une durée utilisateur moyenne.
- Les stratégies automatiques sont simples. Les taux décrivent le moteur sous ces politiques, pas le meilleur jeu humain possible.
- L’absence de sept événements rares dans 5 400 campagnes n’est pas une preuve formelle d’inaccessibilité. Le scan statique ne trouve aucune condition impossible.
- La similarité s’appuie sur égalité, normalisation, n-grammes, Jaccard, signatures structurelles et vecteurs d’effets. Aucun modèle d’embeddings local adapté n’était disponible ; aucune API externe n’a été appelée.
- L’inventaire des noms propres est contrôlé manuellement autour de 76 entités, avec trois candidats non classés. Ce n’est pas une reconnaissance d’entités exhaustive de chaque groupe nominal.
- Lighthouse a été exécuté sur l’accueil du build local. Les routes avec état ont été mesurées par Playwright, sans score Lighthouse séparé.
- Aucun lecteur d’écran physique NVDA, VoiceOver ou TalkBack, aucun appareil iOS/Android réel et aucun Safari réel n’ont été testés. Le contrôle couvre DOM, clavier, Chromium, contraste automatisé et reduced-motion.
- Le fonctionnement sans JavaScript n’a pas été considéré comme un objectif pertinent pour le jeu interactif. Le fallback hors ligne avec JavaScript et service worker est validé.
- Aucun déploiement CDN, hébergeur, trafic concurrent ou télémétrie de production n’a été testé.
- Les sources contemporaines ont été vérifiées le 5 août 2026 auprès de la CNCCFP, de la Commission des sondages, de l’Insee, de l’Arcom, de Légifrance et des sites officiels référencés dans src/game/data/realWorldSnapshot/snapshot.ts. Elles devront être revérifiées avant publication.
- Lighthouse a émis sous Windows des avertissements de nettoyage de répertoire temporaire après avoir produit des rapports JSON valides ; aucune panne produit n’en résulte.
- Le connecteur d’analyse graphique local ne fournit pas de compteurs de tokens ni de coût. cost.json conserve donc une valeur indisponible/nulle au lieu d’une estimation inventée.

## Sources contemporaines vérifiées le 5 août 2026

- [CNCCFP — Élection du président de la République 2027](https://cnccfp.fr/elections/election-du-president-de-la-republique-2027/)
- [Commission des sondages — marges d’erreur](https://www.commission-des-sondages.fr/hist/communiques/communique-commission-des-sondages-2021-04-09.htm)
- [Insee — définition de la région](https://www.insee.fr/fr/metadonnees/definition/c1502)
- [Insee — populations régionales](https://www.insee.fr/fr/statistiques/8680653?sommaire=8681011)
- [Arcom — pluralisme politique](https://www.arcom.fr/nous-connaitre-nos-missions/garantir-le-pluralisme-et-la-cohesion-sociale/proteger-le-pluralisme-politique)
- [Légifrance — loi du 6 novembre 1962 relative à l’élection présidentielle](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000684037)
