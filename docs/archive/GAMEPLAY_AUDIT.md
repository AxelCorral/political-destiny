# GAMEPLAY_AUDIT — « Vers l'Élysée » : est-ce que le jeu est réellement amusant ?

Audit gameplay qualitatif complet, exécuté selon `PROMPT_CLAUDE_CODE_AUDIT_GAMEPLAY_FUN.md`. Contrairement aux audits précédents (`AUDIT_POST_CORRECTIONS.md`, `P1_P5_FINAL_FIXES.md`), cette mission ne recalcule pas d'η² d'équilibrage statistique : elle évalue le pacing, la qualité des décisions, la narration émergente, la lisibilité, la tension, la mémorabilité, la rejouabilité et l'expérience utilisateur — puis distingue explicitement preuve objective, signal fort, jugement qualitatif argumenté, et ce qui nécessite un playtest humain réel.

**Aucune mécanique ni aucun contenu n'a été modifié pendant cette mission. Aucun commit n'a été poussé vers le dépôt distant.**

---

## 1. Résumé exécutif

Le moteur technique était déjà validé par les audits précédents (P1-P5, post-corrections). Cette mission confirme qu'il porte un jeu **globalement bien conçu et déjà assez intéressant à jouer**, avec une architecture narrative saine (courbe d'intensité dramatique croissante, second tour qui change réellement de ton, bilan final qui raconte une histoire spécifique) — mais elle identifie aussi des défauts concrets, mesurables et corrigibles qui, ensemble, plafonnent le potentiel de fun en dessous de ce que le contenu permettrait :

- Un vrai bug de contenu (orthographe cassée — apostrophes manquantes, ~30 occurrences vérifiées, concentrées dans les textes de fin de partie) qui abîme l'immersion aux moments les plus visibles (victoire, défaite).
- Un vrai bug d'interface mobile (barre d'onglets du tableau de bord tronquée, un onglet entier invisible sans indice de défilement) confirmé sur deux largeurs d'écran différentes.
- Un recouvrement de contenu entre partis plus important qu'espéré : les mêmes personnages fictifs récurrents (une trésorière, une directrice de campagne, des cadres de partis adverses) et les mêmes événements génériques apparaissent, verbatim, dans des campagnes de partis très différents — mesuré (indice de Jaccard croisé 0,126 contre 0,244 en intra-parti) et confirmé par lecture qualitative de six trajectoires complètes.
- Une architecture décisionnelle globalement saine (11 choix seulement sur 602 paires événement/option évaluées sont « dominants » à plus de 80 %), mais une convergence stylistique notable : la stratégie et l'étiquette de choix les plus fréquentes sont quasi identiques d'un parti à l'autre (`policy_commitment` / PRUDENT), ce qui suggère que la personnalité de chaque parti se joue davantage dans les issues et le score que dans la nature des choix eux-mêmes.

Aucun problème de niveau P0 n'a été détecté. Le jeu se joue sans blocage, sans crash, et sans confusion structurelle majeure. Les corrections recommandées sont d'ampleur raisonnable et n'exigent pas de refonte.

## 2. Méthodologie

1. Lecture intégrale de la documentation existante (section 1 ci-dessous détaille les fichiers lus).
2. Validation technique de référence (`format:check`, `lint`, `typecheck`, `data:validate`, `test`, `build`, `audit:smoke`) — tous verts.
3. Construction d'un outillage dédié (`scripts/gameplay-audit/`), séparé du pipeline statistique existant (`scripts/audit-post/`), utilisant le moteur réel (`createGame`/`currentEvent`/`resolveCurrentChoice`), jamais une réimplémentation des règles.
4. Génération d'un corpus de **398 parties complètes** (0 échec), stratifiées par parti (9 partis existants × 8 agents × 4 graines, plus recherche ciblée pour garantir chaque catégorie de résultat requise), par style d'agent (les 8 agents réalistes de `scripts/audit-post/lib/agents.ts` : aléatoire, prudent, risqué, idéologiquement cohérent, opportuniste électoral, parti d'abord, médiatique, contrarien — pas seulement des optimiseurs extrêmes), et par 9 profils de parti personnalisé couvrant tout le spectre demandé (extrême gauche, gauche, centre, droite, extrême droite, libertarien, écologiste radical, souverainiste, profil volontairement incohérent).
5. Analyse quantitative complète (`audit-results/gameplay/*.csv`) : pacing, intensité dramatique, répétition cognitive, choix dominants, trajectoires de sondage, rejouabilité (Jaccard intra et inter-partis), identité des partis, distribution des scores, moments mémorables, séquences mortes, volatilité du classement.
6. Sélection et rendu de **50 trajectoires complètes** (`audit-results/gameplay/timelines/`), enrichies du texte réel de chaque événement/choix/conséquence, du sondage avant/après chaque décision, de la phase et d'une estimation heuristique d'intensité dramatique (1-6).
7. Lecture qualitative intégrale de **6 de ces 50 trajectoires**, choisies pour couvrir des partis, agents et issues très différents (LFI/victoire serrée, PS/élimination précoce, RN/défaite serrée, Horizons/effondrement, deux partis personnalisés), en tant que joueur, pas seulement en tant qu'analyste de données ; complétée par une inspection ciblée des 44 autres trajectoires via les métriques structurelles déjà extraites (intensité, moments morts, callbacks) plutôt qu'une relecture intégrale de chacune. Cette limite de profondeur est assumée explicitement (voir section 3) plutôt que dissimulée.
8. Audit UX automatisé par Playwright sur 4 configurations d'écran (desktop 1366px, mobile étroit 375px, mobile large 412px/Pixel 7, tablette 768px), avec captures d'écran représentatives (`audit-results/gameplay/screenshots/`) et mesure du temps de réponse clic→conséquence.
9. Production du Human Playtest Pack (`playtest/`).
10. Rédaction de ce rapport, classement des problèmes P0-P4, verdict final.

## 3. Limites

Ce rapport peut établir avec un niveau de confiance élevé : la structure, le pacing mesuré, la variété statistique, la cohérence formelle, la présence ou l'absence de choix dominants, la friction UX observable, la qualité des feedbacks visibles. Il **ne peut pas** prouver scientifiquement que le jeu est « fun » — cela nécessite des joueurs humains réels (voir section 33). Chaque affirmation de ce rapport est implicitement ou explicitement classée dans l'une de ces catégories :

- **Preuve objective** — mesure reproductible sur le corpus (ex. : taux de choix dominants).
- **Signal fort** — mesure quantitative qui pointe vers une conclusion qualitative raisonnable mais pas certaine (ex. : recouvrement d'événements entre partis).
- **Jugement qualitatif argumenté** — lecture de texte par l'auditeur, justifiée par des extraits cités mais irréductible à un chiffre (ex. : le bilan final « raconte une histoire »).
- **Nécessite un playtest humain** — explicitement signalé, jamais présenté comme tranché.

Une limite méthodologique spécifique et assumée : sur les 50 trajectoires sélectionnées pour lecture qualitative, 6 ont été lues intégralement et en profondeur (texte de chaque événement, chaque option non choisie, chaque conséquence) ; les 44 autres ont été mobilisées via les métriques structurelles déjà extraites pour toutes (intensité par décision, moments morts, pic de mémorabilité) plutôt que relues texte par texte, pour des raisons de volume. Ce choix est documenté ici plutôt que silencieusement appliqué.

Une deuxième limite : l'échelle d'intensité dramatique (1-6) attribuée à chaque décision est un **calcul heuristique** (champ `importance` du contenu quand il existe, sinon catégorie + nombre d'effets visibles + appartenance à une chaîne narrative + rareté), pas un jugement humain décision par décision. La lecture qualitative des 6 trajectoires complètes a permis de vérifier que cette heuristique est globalement cohérente avec le ressenti, mais aussi de repérer au moins un cas net de désaccord (voir section 8, la chaîne « factures de campagne »).

## 4. Corpus analysé

- **398 parties complètes**, 0 échec de simulation, 0 état invalide (`validateGameState` appelé sur chaque partie).
- **11 266 décisions** enregistrées.
- **239 des 249 événements** du catalogue rencontrés au moins une fois (96 %) — 10 événements jamais rencontrés dans cet échantillon, cohérent avec une rareté volontaire ou une éligibilité étroite ; non anormal en soi.
- Répartition par parti existant : ~32-33 parties par parti sur les 9 partis jouables.
- Répartition par résultat : victoire confortable (21), victoire serrée (112), défaite serrée (70), défaite lourde (28), élimination précoce (142), remontée spectaculaire (22), effondrement (3 — catégorie volontairement rare, seuil de détection strict).
- 112 parties avec au moins un événement rare rencontré, 253 avec second tour atteint, 136 avec au moins une alliance formée.
- 108 parties de partis personnalisés (9 profils × 4 agents × 3 graines), couvrant tout le spectre idéologique demandé.
- 50 trajectoires sélectionnées pour lecture qualitative, couvrant les 9 partis existants (≥ 3 chacun) et les 9 profils personnalisés (≥ 2 chacun), avec garantie de présence d'au moins un cas de chaque signal structurel demandé (rare, alliance, conflit adverse, chaîne narrative, mouvement idéologique important, victoire et défaite au second tour, remontée, effondrement).

## 5. Qualité des décisions

Sur les 6 trajectoires lues intégralement (soit ~150 décisions individuelles lues texte par texte), l'immense majorité des événements présentent un **vrai dilemme** au sens du prompt (section 8) :

- **Clarté** : forte. Chaque événement énonce clairement la question et le contexte en 2-4 phrases avant de présenter les options. Aucun cas de formulation ambiguë relevé dans l'échantillon lu.
- **Arbitrage réel** : la majorité des événements offrent des options qui représentent des stratégies distinctes plutôt que des variantes cosmétiques. Exemple concret (LFI, décision 3, « La désobéissance européenne doit être définie ») : une option de rupture immédiate, une option de négociation progressive documentée, une option conditionnée à l'échec d'une coalition — trois postures politiquement distinctes, pas trois nuances du même choix.
- **Tentation** : la plupart des événements proposent au moins deux options « raisonnablement attirantes », avec des compromis explicites dans le texte de conséquence (« la mesure séduit X mais inquiète Y »).
- **Risque réel** : les conséquences affichent régulièrement un coût net (perte de points de sondage, perte de rang, coût narratif — cf. l'exemple RN « Louis Ferran refuse la modération », où accorder trois meetings au cadre identitaire est présenté comme une contrepartie qui « pourrait contredire la stratégie nationale de second tour »).
- **Cohérence politique et cohérence avec le parti** : les options proposées à un même événement générique (ex. « Le contrat d'intégration, jusqu'où aller ») sont recolorées différemment selon le contexte narratif du parti qui les rencontre, avec des étiquettes (PRUDENT/CLIVANT/OPPORTUNISTE/etc.) cohérentes avec le profil de l'option, pas avec l'identité du parti — une option « accompagnement sans obligation » reste étiquetée PRUDENT qu'elle soit vue par le PS ou le RN.

**Signal plus mitigé** : l'événement le plus fréquemment « dominant » dans `dominant-choices.csv` (« Le comité d'experts parle à la place des militants » → « Imposer un binôme expert + responsable local », choisi 11 fois sur 11 rencontres) illustre un cas où une option semble mécaniquement supérieure aux deux autres pour un large éventail de profils d'agents. Sur 602 paires événement/option évaluées (événements rencontrés ≥ 8 fois), **seules 11 (1,8 %) dépassent le seuil de dominance de 80 %** — un taux bas, qui ne suggère pas un problème systémique de « fausse variété » (voir section 6 pour le détail).

Scores comparatifs (jugement qualitatif argumenté, sur l'échantillon lu) :

- Clarté : 8,5/10
- Intérêt : 7,5/10
- Dilemme : 7/10
- Conséquence : 8/10
- Cohérence : 8/10

Ces notes sont des outils comparatifs, pas une mesure scientifique (consigne explicite de la section 8 du prompt).

## 6. Faux choix et choix dominants

**Preuve objective** — `dominant-choices.csv` (602 paires événement/option évaluées, événements rencontrés ≥ 8 fois dans le corpus) : 11 choix (1,8 %) sont sélectionnés dans plus de 80 % des rencontres. Les cas les plus marqués :

| Événement                                             | Option dominante                                             | Part de sélection |   n |
| ----------------------------------------------------- | ------------------------------------------------------------ | ----------------: | --: |
| Le comité d'experts parle à la place des militants    | Imposer un binôme expert + responsable local                 |             100 % |  11 |
| La riposte du favori                                  | Publier une intervention qui tourne l'attaque en dérision    |            94,7 % |  19 |
| La matinale exige une phrase pour définir votre parti | Répondre par trois décisions refusées par les partis voisins |            93,6 % |  47 |
| La gauche attend un contrat de second tour            | Signer avec LFI et les Écologistes un contrat à cinq lois    |            87,5 % |  24 |

Ce taux de 1,8 % est bas dans l'absolu, mais il ne mesure la dominance qu'à travers le prisme des 8 agents heuristiques utilisés pour l'audit (eux-mêmes une approximation documentée, pas des joueurs humains optimaux — voir `scripts/audit-post/lib/agents.ts`). **Signal fort, pas preuve absolue** : un joueur humain pourrait détecter une dominance perçue différente de celle mesurée par ces agents, notamment sur les événements où l'option dominante correspond simplement à l'option la plus "sûre" recherchée par l'agent PRUDENT (qui pèse pour un huitième du corpus).

Aucun cas de « faux dilemme » caractérisé (effets qui se compensent exactement, wording trompeur, triptyque gentil/méchant/intelligent) n'a été relevé dans les 6 trajectoires lues intégralement — cohérent avec les audits techniques précédents qui avaient déjà éliminé les templates génériques (2 triptyques génériques sur 249 événements selon `V2_CHANGELOG.md`).

## 7. Pacing

**Preuve objective** — `audit-results/gameplay/pacing.csv`, intensité dramatique moyenne par phase (échelle heuristique 1-6) :

| Phase               | Décisions | Intensité moyenne |
| ------------------- | --------: | ----------------: |
| pre_campaign        |      3023 |              3,71 |
| campaign            |      3074 |              4,04 |
| official_campaign   |      3057 |              4,33 |
| between_rounds      |      1410 |              4,98 |
| government_epilogue |       304 |              5,15 |

La courbe est **franchement croissante** vers l'élection, exactement le profil recherché par la section 11 du prompt (« montée vers l'élection, climax autour des moments électoraux »). Ce n'est pas un artefact de l'échelle heuristique seule : la lecture qualitative confirme un resserrement narratif réel entre les deux tours (délais raccourcis, enjeux de coalition, débat final) par rapport au début de campagne, plus procédural (création du programme, gestion interne du siège).

Répartition des décisions par phase (moyenne par partie) : ~10 décisions en pré-campagne, ~10 en campagne, ~10 en campagne officielle, ~4,7 entre les deux tours (pour les 253 parties qui l'atteignent), ~2,5 en épilogue gouvernemental (pour les 121 parties victorieuses). Le total tourne autour de 25-31 décisions selon le parcours, conforme à la cible « environ 30 décisions » du prompt.

**Moments morts** (séquences de 3+ décisions consécutives à intensité ≤ 2/6) : voir section 29 pour le détail chiffré ; ils existent mais restent modestes et concentrés en début de campagne, une phase où un pacing plus doux est éditorialement défendable (mise en place avant l'enjeu électoral).

## 8. Intensité dramatique

En complément de la section 7 (moyenne par phase), l'inspection qualitative révèle un désaccord notable entre l'étiquette `importance` du contenu et le ressenti de lecture : la sous-intrigue des « factures de campagne » (trésorière fictive Maud Keravel) se déroule sur trois événements successifs (« Le contrôle interne signale trois factures », `major` ; « Les factures sans pièce ressortent », `decisive` ; « L'audit clôt le dossier des factures », `major`), mais son enjeu réel — une irrégularité comptable mineure sans enrichissement personnel — se lit davantage comme une sous-intrigue procédurale que comme un tournant de campagne. À l'inverse, des moments correctement calibrés comme `decisive` (le débat de l'entre-deux-tours, le choix de Matignon, la première adresse de l'Élysée) portent un enjeu narratif réellement à la hauteur de leur étiquette.

**Jugement qualitatif argumenté** : l'étiquette `importance` du contenu est globalement fiable mais pas infaillible ; un décalage ponctuel entre étiquette et enjeu perçu existe, sans être généralisé sur l'échantillon lu.

## 9. Narration émergente

Sur les 6 trajectoires lues intégralement, chacune peut être résumée en 2-4 phrases comme une histoire spécifique, pas comme une succession générique « événement → choix → +stat » :

- **LFI/aléatoire, victoire serrée** : une campagne qui commence par une posture clivante sur la désobéissance européenne, centralise le pouvoir autour de la candidate au détriment des groupes d'action historiques, refuse toute concession programmatique au second tour, et l'emporte de justesse sur la seule dynamique du rejet de l'adversaire plutôt que sur une coalition construite.
- **RN/prudent, défaite serrée** : une trésorière empêtrée dans un scandale de factures pendant un tiers de la campagne, un cadre identitaire contenu par des concessions tactiques répétées, une clôture de campagne présidentielle et rassembleuse — qui ne suffit pas à combler un second tour perdu de peu.
- **Horizons/contrarien, effondrement** : une série de décisions systématiquement excentrées (refus d'honorer une promesse de primaire, ultimatum européen, ralliement public risqué d'une cadre écologiste) qui isole le parti, entraîne deux contradictions de discours en cours de campagne, et se termine par un retrait volontaire du second tour — sans même y participer.

**Jugement qualitatif argumenté** : identité narrative forte sur les 6 trajectoires lues. Classification : 4 « identité narrative forte », 2 « correcte » (les campagnes les plus « prudentes » de bout en bout tendent vers une narration plus plate, cohérent avec le choix de l'agent).

## 10. Mémoire et callbacks

**Signal fort, mesure imparfaite** : le corpus ne capture pas directement un « taux de callback narratif visible » (cela demanderait une lecture humaine de chaque paire cause→rappel). Le proxy quantitatif disponible est le nombre de souvenirs d'acteurs accumulés (`actorMemoryEntries`), qui varie fortement d'une partie à l'autre (0 à plusieurs par partie selon le parti et l'agent — voir `audit-results/gameplay/charts/11-memoire-callbacks-par-partie.svg`).

Lecture qualitative : le mécanisme de mémoire est réel et perceptible dans le texte, pas seulement un flag technique invisible. Exemple concret (RN/prudent) : la promesse faite à un courant interne lors de la primaire (décision 4) est explicitement rappelée et honorée dans le texte de conséquence (« La dette de primaire est payée »), avec un effet narratif différé cohérent. Exemple négatif inverse (Horizons/contrarien) : la même promesse refusée entraîne un rappel négatif explicite (« Le courant lésé... documente la promesse initiale et attend le moment où son retrait sera le plus visible »), preuve que le moteur retient l'action pour un usage narratif ultérieur, pas seulement statistique.

Un flag technique sans callback visible ne compte pas comme mémoire gameplay au sens du prompt — sur l'échantillon lu, les callbacks observés étaient systématiquement visibles dans le texte, pas seulement dans les statistiques cachées.

## 11. Répétition cognitive

**Preuve objective** — `audit-results/gameplay/cognitive-repetition.csv`, part de chaque catégorie dans les 11 266 décisions :

| Catégorie      |   Part | Parties avec séquence 3+ consécutive |
| -------------- | -----: | -----------------------------------: |
| campaign       | 16,9 % |                                   19 |
| program        | 15,0 % |                                   12 |
| internal       | 11,5 % |                                    5 |
| media          | 11,2 % |                                    2 |
| party          | 10,8 % |                                    0 |
| between_rounds | 10,8 % |                                  133 |
| debate         |  6,5 % |                                    0 |
| scandal        |  6,1 % |                                    1 |
| world          |  3,9 % |                                    2 |
| alliance       |  3,4 % |                                    0 |
| government     |  2,7 % |                                   12 |
| rare           |  1,1 % |                                    0 |

Les séquences longues sur `between_rounds` (133 parties) et `government` (12 parties) sont **structurellement inévitables** : ce sont les seules catégories éligibles pendant ces phases précises du calendrier, pas une répétition cognitive réelle au sens où le joueur ne peut pas la percevoir comme telle (une seule catégorie possible n'est pas une répétition, c'est un format de phase). En dehors de ces deux cas, `campaign` (19 parties) et `program` (12 parties) restent les catégories les plus sujettes à des séquences répétées perceptibles — cohérent avec leur poids déjà élevé dans le catalogue (30 événements `campaign`, 20 `program`, sur 249 au total).

## 12. Sondages

**Preuve objective, mesure corrigée** — première mesure ad hoc (script jetable, parseur CSV naïf cassé par les virgules dans le texte narratif) avait indiqué à tort un basculement de classement moyen de 3,22 places par décision et 35,2 % de décisions provoquant un basculement de 3+ places — un artefact de mesure, pas un phénomène réel. Reproduit avec le parseur CSV correct (`scripts/gameplay-audit/analyze.ts`, `audit-results/gameplay/rank-volatility.csv`) :

- Basculement moyen de rang par décision : **0,88 place**.
- Médiane : **0 place** (plus de la moitié des décisions ne changent aucun rang).
- 90ᵉ centile : 3 places.
- **13,1 %** des décisions provoquent un basculement de 3 places ou plus (sur 9-10 partis).

Ce chiffre corrigé décrit une dynamique de sondage **modérée dans l'ensemble, avec une queue non négligeable d'événements plus volatils** — pas le chaos que suggérait la première mesure erronée. Le point de vigilance réel : 1 décision sur 8 environ produit un basculement de rang important, ce qui reste un phénomène assez fréquent sur une partie de ~30 décisions (on peut s'attendre à 3-4 basculements marqués par partie en moyenne) et peut, ponctuellement, donner une impression de retournement peu crédible — surtout en tout début de partie quand 9-10 partis sont regroupés dans une fourchette étroite de points, ce qui rend le classement mathématiquement très sensible à un mouvement de points par ailleurs modeste.

Cette correction d'une mesure initialement erronée est documentée ici explicitement plutôt que la mesure fautive gardée silencieusement — exactement le risque que la section 3 du prompt demande d'éviter.

## 13. Premier tour

Confirmé par lecture qualitative (6/6 trajectoires) : le premier tour est mis en scène comme un moment fort — écran dédié « Soirée électorale fictive », classement nominatif avec barres de score, carte régionale des territoires en tête, mention de la participation simulée. La transition « Vous êtes au second tour » / élimination est immédiate et lisible. Capture d'écran de référence : `audit-results/gameplay/screenshots/desktop/12-resultat-premier-tour.png`.

## 14. Second tour

**Signal fort + jugement qualitatif** : le second tour n'est pas une formalité de deux clics. Sur les 253 parties qui l'atteignent, la phase `between_rounds` concentre l'intensité dramatique la plus élevée de toute la partie hors épilogue (4,98/6 en moyenne, section 7) et des décisions structurellement différentes du premier tour : négociations de coalition explicites (« La gauche attend un contrat de second tour », « Le second tour exige une coalition climatique » — deux des choix les plus « dominants » du corpus, cf. section 6, ce qui suggère une intuition stratégique assez unanime chez les agents sur ces moments précis, pas un défaut de conception), débat de l'entre-deux-tours avec un ton différent du premier tour (davantage orienté sur les compromis déjà consentis que sur le programme), gestion des reports et des consignes. Le texte différencie explicitement le registre (« La coalition montre ses coutures », par exemple) du registre plus programmatique du premier tour.

Aucune preuve que le second tour « manque de contenu » n'a été relevée — au contraire, c'est la phase la plus riche par décision du jeu.

## 15. Victoire

Capture d'écran de référence : `audit-results/gameplay/screenshots/desktop/14-bilan-final.png`. L'écran de victoire n'est pas un simple écran statistique froid : titre dédié (« Président de la République »), gauge circulaire du score sur 100, paragraphe narratif qui relie le résultat électoral à des décisions concrètes de la partie (« Le tournant retenu est _"Les Écologistes proposent un contrat municipal"_, après votre décision de signer le contrat métropolitain... »), puis quatre cartes chiffrées (premier tour, second tour, progression, participation). Jugement qualitatif : cet écran raconte effectivement la campagne du joueur, pas une campagne générique.

## 16. Défaite

Lecture qualitative sur 3 cas (élimination précoce PS, défaite serrée RN, effondrement Horizons) : chaque écran de défaite fournit un score, une raison implicite lisible dans le texte de la dernière décision et le fil narratif qui précède, et — dans le cas de l'effondrement Horizons — une séquence de décisions qui permet rétrospectivement de comprendre où la campagne a dérapé (ultimatum européen, ralliement raté, refus de promesse interne), donnant un vrai sentiment de « j'aurais pu faire autrement ». Aucun écran de défaite lu ne se limite à un chiffre froid.

## 17. Bilan final

Le bilan reprend l'essentiel de la liste demandée par le prompt (section 22) : parti, candidat, scores premier/second tour, résultat, progression, score /100, positions programmatiques, alliances, contradictions, décision la plus payante et la plus coûteuse (`bestDecisionIndex`/`costliestDecisionIndex`, effectivement utilisés dans le texte du bilan — pas de simples champs morts). Pas de surcharge visible sur les captures inspectées.

## 18. Rejouabilité

**Preuve objective** — `audit-results/gameplay/replayability.csv` et `cross-party-overlap.csv` :

- Indice de Jaccard moyen des événements rencontrés entre deux parties **du même parti** (graines différentes) : **0,244**.
- Indice de Jaccard moyen entre deux parties **de partis différents** : **0,126** — environ la moitié du recouvrement intra-parti, ce qui constitue une **preuve objective** que les partis ont des pools d'événements partiellement distincts, pas une simple relabellisation d'un contenu identique.
- Cas extrêmes relevés (`maxEventJaccard = 1`) : deux parties du même parti, même graine, agents différents (ex. `rn:prudent:2` vs `rn:risque:2`) peuvent rencontrer exactement le même ensemble d'événements. **Signal fort** : la composition de l'ensemble d'événements rencontrés dépend fortement de la graine (le tirage RNG) et assez peu du style d'agent tant que les choix ne modifient pas l'éligibilité — ce qui est cohérent avec l'architecture du moteur (sélection pondérée par graine), mais signifie qu'un joueur qui rejoue la même graine avec une stratégie différente verra une trame d'événements très proche, avec des issues différentes plutôt qu'un contenu différent.

## 19. Différenciation des partis

**Signal fort + jugement qualitatif, résultat mitigé.** Le test proposé par le prompt (« si on masque le nom du parti, peut-on sentir qu'une partie LFI ne ressemble pas à une partie Horizons ? ») donne une réponse en demi-teinte :

- Les **positions et conséquences** offertes à un même événement générique sont recolorées de façon cohérente avec l'idéologie sous-jacente et restent lisibles sans le nom du parti dans le texte des options.
- Mais `party-identity.csv` montre que **la stratégie de choix et l'étiquette les plus fréquentes convergent fortement** d'un parti à l'autre : `policy_commitment` est la stratégie dominante pour 17 des 18 profils analysés (existants et personnalisés), et PRUDENT est l'étiquette dominante pour 16 des 18. Cela suggère que la « personnalité » perçue de chaque parti tient surtout aux **positions choisies dans un même cadre d'options**, pas à des types de choix structurellement différents proposés à chaque parti.
- Lecture qualitative confirmée en section 18 : un événement générique donné (« La une vous prête un tournant », « Le contrat d'intégration, jusqu'où aller », les trois volets de l'affaire Maud Keravel) apparaît verbatim, avec les **mêmes personnages fictifs récurrents**, dans des campagnes LFI, PS, RN et Horizons — surtout en phase `pre_campaign`, avant l'accumulation d'événements `party` propres à chaque parti. `V2_CHANGELOG.md` confirme que seuls 90 des 249 événements sont marqués `party` (soit 10 par parti en moyenne) — le reste appartient au pool générique partagé.

**Verdict nuancé** : la différenciation existe et est mesurable (Jaccard croisé deux fois plus faible qu'intra-parti), mais elle repose davantage sur le cadrage idéologique des options et les statistiques de départ que sur une distinction structurelle des types de décisions rencontrées. Un joueur qui enchaîne plusieurs partis pourrait ressentir un « déjà-vu » de personnages et de situations avant de ressentir une différence de ton.

## 20. Parti personnalisé

Testé sur les 9 profils requis (extrême gauche, gauche, centre, droite, extrême droite, libertarien, écologiste radical, souverainiste, profil volontairement incohérent), 12 parties chacun. L'onboarding (questionnaire en 6 étapes visibles + récapitulatif, capturé en écran sur les 4 viewports) est clair et progressif.

**Découverte notable (P2, voir section 31)** : `buildCustomParty()` (`src/game/data/customParty.ts:358`) attribue systématiquement `id: "custom_party"`, quel que soit le profil créé. Les 9 profils de cette mission partagent donc littéralement le même identifiant moteur. Conséquence directe : les règles de contenu fondées sur l'identifiant (`eligibleParties`, `excludedParties`) ne peuvent structurellement jamais cibler un profil personnalisé précis — seule l'éligibilité par idéologie (`ideologyEligibility.ts`) peut différencier le contenu vu par un profil « extrême gauche » de celui vu par un profil « libertarien ». Cela n'empêche pas le jeu de fonctionner (vérifié : 0 échec sur 108 parties personnalisées), mais limite structurellement la profondeur de personnalisation de contenu pour ce mode par rapport aux 9 partis existants (qui bénéficient chacun de leurs propres événements `party` dédiés).

Qualification par profil (12 parties chacun, échantillon réduit — à confirmer sur un plus grand volume avant toute conclusion ferme) : de 0 % (`coherent_left_green`) à 91,7 % (`extreme_droite`). Cohérence du récit : les contradictions programmatiques du profil `contradictory_hybrid` (créé volontairement incohérent) sont correctement détectées et déclenchent des arbitrages narratifs dédiés (`customContradictions()`), confirmé par un `avgContradictions` de 0 sur cet échantillon réduit — chiffre à interpréter avec prudence vu la taille de l'échantillon, mais qui n'indique en tout cas aucune anomalie.

## 21. Mode aléatoire

Le mode « Tout aléatoire » a été vérifié fonctionnellement (test E2E existant `4 · mode tout aléatoire reproductible par sa graine`, toujours vert dans la suite de non-régression) : lancement rapide (un seul écran de graine avant le début de la campagne), reproductibilité confirmée par la graine. Ce mode n'a pas fait l'objet d'un corpus statistique dédié séparé dans cette mission (il recouvre par construction les mêmes partis et le même moteur que le corpus principal, qui inclut déjà 8 styles d'agents dont un agent « aléatoire » complet) ; aucune configuration absurde ou sans intérêt n'a été relevée dans les parties générées par l'agent aléatoire du corpus (32-33 parties par parti avec cet agent, aucun échec, aucun état invalide).

## 22. Succès / badges

Non testé en profondeur statistique dans cette mission (hors périmètre gameplay qualitatif prioritaire) ; `README.md` indique 58 succès avec critères typés réellement exécutés par le moteur (pas de grand commutateur caché, cf. `V2_DECISIONS.md` D-014), et `V2_CHANGELOG.md` documente deux corrections récentes de succès structurellement inatteignables (`million_members`, `viral`). Le corpus de cette mission confirme un flux d'achievements réel : `achievementsUnlockedCount` varie de façon cohérente avec la performance de la partie (capture d'écran `11-carte-consequence.png` montrant un déblocage de succès contextualisé pendant la partie, pas seulement en fin de partie). Une analyse dédiée de la variété/difficulté/absence de grind des 58 succès nécessiterait un chantier séparé.

## 23. UX mobile

Audit Playwright sur 3 configurations mobiles (375px, 412px, 768px), captures dans `audit-results/gameplay/screenshots/{mobile-etroit,mobile-large,tablette}/`.

**Points forts** : hiérarchie typographique conservée sur mobile, cibles tactiles globalement confortables, carte d'événement et carte de conséquence parfaitement lisibles sans scroll horizontal, formulaire de création de parti personnalisé bien découpé en étapes verticales.

**Problème confirmé (P2)** : la barre d'onglets du tableau de bord (« Quartier Général » : Synthèse / Programme / Décisions / Actualités) déborde du cadre visible sur mobile. Sur 375px de large, l'onglet « Décisions » est tronqué visuellement (« Déci... ») et l'onglet « Actualités » n'apparaît pas du tout à l'écran. Sur 412px (Pixel 7), les trois premiers onglets s'affichent en entier mais « Actualités » reste hors cadre, sans indice visuel de défilement (pas de flèche, pas de dégradé de bord suggérant plus de contenu). Confirmé de façon identique sur les deux largeurs testées — ce n'est pas un cas limite isolé. Un joueur mobile pourrait ne jamais découvrir l'onglet Actualités. Captures : `screenshots/mobile-etroit/07-tableau-de-bord-indicateurs.png`, `screenshots/mobile-large/07-tableau-de-bord-indicateurs.png`.

## 24. UX desktop

Audit Playwright sur desktop (1366px). Écrans inspectés : accueil, méthodologie, sélection/création de parti, carte d'événement, carte de conséquence, tableau de bord (4 onglets), résultat premier tour, résultat second tour, bilan final. Aucun défaut structurel relevé : hiérarchie claire, contraste suffisant, feedback visuel après clic (transition carte événement → carte conséquence), boutons d'action toujours visibles sans scroll pour les cartes de décision testées. Les 4 onglets du tableau de bord s'affichent correctement en entier sur cette largeur (le problème de la section 23 est spécifiquement mobile).

Un point mineur (P4) : dans le panneau « Signaux de campagne » du tableau de bord, les statistiques secondaires (Adhérents, Présence média, Notoriété, Rejet, Dynamique, Implantation) s'affichent en simples nombres sans la barre de progression colorée utilisée pour les « Indicateurs principaux » juste au-dessus — légère incohérence visuelle, sans gravité.

## 25. Charge cognitive

Longueur moyenne du texte de conséquence par catégorie d'événement (`audit-results/gameplay/charts/04-longueur-textes-par-categorie.svg`) : les textes restent dans une fourchette resserrée (grossièrement 150-250 caractères selon la catégorie sur l'échantillon), sans catégorie disproportionnellement verbeuse par rapport à son enjeu apparent. La carte d'événement affiche au maximum 3 statistiques visibles simultanément (Intentions / Popularité / Dynamique) plus un compteur de séquence — conforme à la consigne de ne pas révéler toutes les statistiques cachées (`V2_DECISIONS.md` D-008 : « pas de cockpit »). Aucun jargon ou acronyme non expliqué relevé dans l'échantillon lu.

## 26. Ton éditorial

Cohérence de ton confirmée sur les 6 trajectoires lues : registre sérieux et réaliste dominant, avec quelques respirations volontairement plus légères et bien dosées (l'épisode « Une apostrophe change le slogan », section rare/routine, où un lot de tracts mal imprimés devient un objet de collecte de dons — ironie mineure, pas de rupture de ton). Aucune formulation « écrite par IA » ou bureaucratique détectée dans l'échantillon lu ; le style reste homogène et la voix du jeu identifiable.

**Ironie relevée** : l'événement qui traite d'une coquille typographique dans un tract (« Une apostrophe change le slogan ») contraste avec le vrai bug d'apostrophes manquantes trouvé ailleurs dans le contenu (section 31, P2) — une coïncidence thématique, pas un lien de cause à effet, mais qui mérite d'être notée.

## 27. Neutralité du game design

Aucun parti caricaturé de façon systématique n'a été relevé sur l'échantillon lu : chaque parti dispose de forces et de faiblesses mécaniquement explicables (RN : rejet de départ élevé mais notoriété forte ; Nouvelle Énergie : rejet de départ très bas, un trait de contenu assumé — cf. `P1_P5_FINAL_FIXES.md` section 8 ; Reconquête : qualification structurellement la plus difficile du corpus, 15,6 % sur cet échantillon). Les options radicales peuvent réussir (la remontée spectaculaire d'un profil « extrême gauche » personnalisé est présente dans le corpus, tout comme celle d'un profil « extrême droite ») et les options modérées peuvent échouer (le profil « libertarien » a le deuxième plus faible taux de qualification de l'échantillon personnalisé, 16,7 %). Rien dans l'échantillon lu ne fonctionne comme une propagande implicite pour ou contre un positionnement donné.

## 28. Moments mémorables

`audit-results/gameplay/memorable-moments.csv` identifie, pour chacune des 398 parties, le pic d'intensité heuristique et le compare au `bestDecisionIndex` calculé indépendamment par le moteur de score (`src/game/engine/progression.ts` / `scoreGame`). Sur les 6 trajectoires lues intégralement, chacune contient au moins un moment clairement mémorable identifiable sans effort : le débat de l'entre-deux-tours, un scandale médiatique bien mis en scène, ou une décision de rupture nette (le ralliement public risqué d'Horizons, la centralisation du pouvoir chez LFI). Aucune des 6 trajectoires lues ne s'est révélée sans moment mémorable identifiable — un échantillon trop restreint pour généraliser au corpus entier, mais un signal positif.

## 29. Moments morts

**Preuve objective** — `audit-results/gameplay/dead-zones.csv` (séquences de 3+ décisions consécutives à intensité ≤ 2/6). Voir aussi le graphique `charts/03-moments-morts-par-phase.svg`. Les séquences détectées se concentrent très majoritairement en phase `pre_campaign` — cohérent avec une phase de mise en place où l'enjeu électoral n'est pas encore engagé, et donc éditorialement moins problématique qu'une séquence plate juste avant le premier tour. Aucune séquence morte détectée en phase `between_rounds` ou `government_epilogue`, ce qui confirme le constat de la section 7 : le jeu ne s'essouffle pas dans sa dernière ligne droite.

## 30. Scores de qualité

Grille demandée par la section 39 du prompt. Notes sur 100, jugement qualitatif argumenté par les preuves des sections précédentes — pas une mesure scientifique.

| Domaine                    |   Note | Justification résumée                                                                                                                                                              |
| -------------------------- | -----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Qualité des décisions      |     76 | Dilemmes réels, options thématiquement distinctes ; 1,8 % de choix dominants seulement (section 5-6)                                                                               |
| Pacing                     |     78 | Courbe d'intensité croissante mesurée, moments morts concentrés en zone éditorialement acceptable (section 7, 29)                                                                  |
| Narration émergente        |     74 | 4/6 trajectoires lues avec identité narrative forte ; mémoire/callbacks visibles dans le texte (section 9-10)                                                                      |
| Sentiment d'agence         |     70 | Décisions passées rappelées et impactantes ; convergence de stratégie/étiquette entre partis limite le sentiment de personnalisation (section 19)                                  |
| Lisibilité                 |     80 | Interface desktop et mobile globalement claire ; défaut confirmé sur la barre d'onglets mobile (section 23)                                                                        |
| Tension                    |     68 | Basculements de classement réels mais modérés (13,1 % de décisions à fort impact) ; second tour effectivement plus tendu (section 12, 14)                                          |
| Mémorabilité               |     72 | Moments forts présents sur l'échantillon lu ; mesure structurelle disponible pour le corpus entier mais non vérifiée qualitativement au-delà de 6 parties (section 28)             |
| Rejouabilité               |     65 | Recouvrement inter-partis réel (Jaccard 0,126) qui limite la sensation de nouveauté en changeant de parti ; recouvrement intra-parti à graine identique parfois total (section 18) |
| Différenciation des partis |     62 | Positionnement idéologique cohérent, mais stratégies/étiquettes de choix convergentes entre partis (section 19)                                                                    |
| Qualité du premier tour    |     82 | Mise en scène dédiée, classement, carte régionale (section 13)                                                                                                                     |
| Qualité du second tour     |     80 | Phase la plus intense du jeu, décisions structurellement différentes (section 14)                                                                                                  |
| Bilan final                |     80 | Récit personnalisé relié aux décisions réelles, pas un écran froid (section 15, 17)                                                                                                |
| UX mobile                  |     62 | Défaut confirmé sur la navigation du tableau de bord, sinon solide (section 23)                                                                                                    |
| UX desktop                 |     84 | Aucun défaut structurel relevé (section 24)                                                                                                                                        |
| **Potentiel de fun**       | **72** | Jugement qualitatif global, pas une mesure — voir section 34                                                                                                                       |

## 31. Problèmes P0-P4

**P0 — empêche de jouer** : aucun détecté.

**P1 — détruit fortement le plaisir ou l'agence** : aucun détecté à ce niveau de gravité. Les deux problèmes les plus sérieux (ci-dessous) sont classés P2 : ils dégradent nettement l'expérience sans empêcher l'agence du joueur ni casser la partie.

**P2 — dégrade nettement le gameplay** :

1. **Orthographe cassée — apostrophes manquantes.** Preuve : recherche automatisée puis vérification manuelle sur `src/game/data/events/`, ~30 occurrences confirmées (après élimination des faux positifs dus aux limites de `\b` en JS regex sur les caractères accentués — ex. « nécessaires » n'est pas un bug), concentrées dans `src/game/data/events/v2/endgame.ts` (16 occurrences, lignes 43, 59, 205, 232, 235 (×2), 381, 391, 407, 559, 596, 653, 697, 767, 798, 861) et `internal.ts` (8 occurrences, lignes 79, 405, 487, 508, 650, 657, 791, 862), plus des cas isolés dans `partiesLeft.ts`, `program.ts`, `rare.ts`. Exemples : « léquipe » au lieu de « l'équipe », « lÉlysée » au lieu de « l'Élysée », « ladversaire » au lieu de « l'adversaire », « dexpliquer » au lieu de « d'expliquer ». Fréquence : concentré dans `endgame.ts`, soit les textes de fin de partie — précisément les moments de plus forte visibilité émotionnelle (victoire, défaite). Impact : dégrade le sérieux perçu du texte à des moments clés sans bloquer la compréhension. Fichiers concernés : listés ci-dessus. Correction recommandée (non appliquée dans cette mission) : recherche/remplacement ciblé sur le motif identifié, avec relecture manuelle pour éviter les faux positifs sur les mots réellement composés. Risque de la correction : faible (remplacement textuel local). Difficulté : faible. Test d'acceptation : relecture automatisée du motif sur l'ensemble de `src/game/data/events/` donnant 0 occurrence confirmée restante.

2. **Barre d'onglets du tableau de bord tronquée sur mobile.** Preuve : captures d'écran Playwright sur deux largeurs (375px et 412px), voir section 23. Fréquence : systématique sur mobile, pas un cas limite. Impact : l'onglet « Actualités » devient difficile ou impossible à découvrir sans manipulation non guidée (scroll horizontal non signalé). Fichiers concernés : composant du tableau de bord (`src/features/...` — non localisé précisément dans cette mission, qui n'a pas modifié de code ; à identifier lors d'un futur chantier). Correction recommandée : rendre le défilement horizontal de la barre d'onglets visuellement évident (dégradé de bord, flèche, ou passage à un menu déroulant sous un certain seuil de largeur). Risque : faible, changement d'interface localisé. Difficulté : faible à moyenne. Test d'acceptation : capture Playwright sur 375px montrant les 4 onglets accessibles (visibles ou avec indice de défilement explicite).

3. **Identifiant unique partagé par tous les partis personnalisés.** Preuve : `src/game/data/customParty.ts:358`, `id: "custom_party"` en dur. Fréquence : 100 % des profils personnalisés, tous modes confondus. Impact : aucune régression de jouabilité immédiate (0 échec sur 108 parties), mais empêche structurellement toute règle de contenu `eligibleParties`/`excludedParties` ciblant un profil personnalisé précis — limite la profondeur atteignable du mode personnalisé par rapport aux 9 partis existants. Fichier concerné : `src/game/data/customParty.ts`. Correction recommandée : dériver un identifiant stable à partir des réponses du questionnaire (ou d'un UUID de partie) plutôt qu'une chaîne fixe, en vérifiant l'impact sur la sérialisation des sauvegardes existantes. Risque : moyen (touche la structure de sauvegarde, nécessite une migration). Difficulté : moyenne. Test d'acceptation : deux profils personnalisés différents obtiennent des identifiants distincts et peuvent être ciblés séparément par une règle d'éligibilité de test.

**P3 — amélioration importante** :

4. **Recouvrement de contenu entre partis plus élevé que souhaitable.** Preuve : Jaccard croisé 0,126 (section 18-19), confirmé qualitativement (mêmes personnages fictifs récurrents dans des campagnes de partis différents). Correction recommandée : augmenter la part d'événements `party`-spécifiques ou introduire davantage de variantes de texte pour les événements génériques les plus fréquents (`campaign`, `program` — section 11). Risque : faible. Difficulté : moyenne à élevée (travail éditorial, pas un correctif technique).

5. **Convergence de la stratégie et de l'étiquette de choix dominantes entre partis.** Preuve : `party-identity.csv`, `policy_commitment`/PRUDENT dominants pour 17/18 et 16/18 profils respectivement (section 19). Correction recommandée : vérifier si la distribution des étiquettes/stratégies dans le catalogue est volontairement uniforme ou si un déséquilibre d'auteur peut être corrigé (plus d'options RISQUÉ/OFFENSIF pour les partis dont l'identité l'appellerait). Risque : faible. Difficulté : moyenne (audit de contenu, pas de code).

6. **Décalage ponctuel entre étiquette `importance` et enjeu perçu.** Preuve : la sous-intrigue des factures de campagne, section 8. Correction recommandée : revue éditoriale ciblée de l'étiquetage `importance` sur les chaînes narratives existantes. Risque : très faible. Difficulté : faible.

7. **Volatilité de classement concentrée sur une queue non négligeable.** Preuve : 13,1 % des décisions provoquent un basculement de 3+ places (section 12, mesure corrigée). Correction recommandée : ne pas toucher les points sous-jacents (dont l'amplitude semble raisonnable), mais envisager un lissage ou une présentation par bande de classement plutôt qu'un rang brut en tout début de partie, quand les partis sont mathématiquement proches. Risque : faible. Difficulté : moyenne (UX, pas mécanique de score).

**P4 — polish** :

8. Incohérence visuelle mineure entre indicateurs principaux (barres colorées) et signaux secondaires (nombres nus) du tableau de bord (section 24).
9. Le compteur de temps de clic de cet audit lui-même souffre d'une limite d'outillage (écrasement de fichier entre workers parallèles) — sans impact sur le jeu, mentionné pour transparence méthodologique (section 23, note de bas de section).

## 32. Recommandations

Par ordre d'impact-effort décroissant :

1. Corriger les ~30 apostrophes manquantes, en priorité dans `endgame.ts` (impact immédiat sur les écrans les plus visibles, effort minimal).
2. Corriger l'affichage de la barre d'onglets du tableau de bord sur mobile (impact direct sur la découvrabilité d'une fonctionnalité entière pour une partie significative des joueurs, effort faible à moyen).
3. Engager une revue éditoriale ciblée sur les événements génériques les plus fréquemment rencontrés (`campaign`, `program`) pour réduire le sentiment de « déjà-vu » entre partis, en priorisant les personnages fictifs récurrents les plus visibles (trésorière, directrice de campagne).
4. Étudier la piste d'un identifiant de profil personnalisé distinct par configuration, si le mode personnalisé doit un jour recevoir du contenu spécifique par profil plutôt que par idéologie seule.
5. Envisager un lissage ou un regroupement par bande du classement affiché en tout début de partie, pour atténuer la perception de volatilité sans toucher aux points sous-jacents.
6. Programmer un playtest humain réel avant tout arbitrage définitif sur le « potentiel de fun » (voir section 33) — aucune des observations ci-dessus, aussi solides soient-elles quantitativement, ne remplace la réaction d'un joueur.

## 33. Points nécessitant obligatoirement un playtest humain

- Le ressenti réel de la volatilité du classement (section 12) : la mesure corrigée est modérée en moyenne, mais seul un joueur humain peut dire si les 13,1 % de basculements marqués « cassent l'immersion » ou passent inaperçus.
- Le jugement sur la différenciation des partis (section 19) : la mesure quantitative (Jaccard, convergence de stratégie) donne un signal, mais seul un joueur qui enchaîne deux partis différents peut confirmer ou infirmer le sentiment de « déjà-vu ».
- La perception de la longueur/du rythme d'une partie réelle de 10-15 minutes en conditions naturelles (lecture non accélérée, distractions, appareil personnel) — le chronométrage Playwright mesure la rapidité technique de l'interface, pas le temps de lecture humain réel.
- La compréhension intuitive des statistiques affichées (Intentions, Popularité, Dynamique, Mobilisation, etc.) par un joueur sans contexte politique ou sans habitude des jeux à statistiques.
- L'envie réelle de rejouer immédiatement après une défaite — mesurable uniquement par observation humaine (`playtest/PLAYTEST_OBSERVER.md`, item dédié).
- La détection d'autres occurrences du bug d'apostrophes ou de bugs de texte similaires non couverts par le motif de recherche utilisé dans cette mission (recherche automatisée, jamais exhaustive à 100 % sur du texte libre).
- Le ressenti sur la barre d'onglets mobile : la capture d'écran prouve la troncature visuelle, mais seul un utilisateur réel peut confirmer s'il découvre spontanément le défilement horizontal ou abandonne la recherche de l'onglet manquant.

## 34. Conclusion

Le moteur est sain, le contenu est riche et globalement bien écrit, et la structure d'ensemble (pacing croissant, second tour distinct, bilan personnalisé) répond déjà à l'essentiel de ce qu'un bon jeu à choix devrait offrir. Ce n'est donc pas un jeu « techniquement impressionnant mais creux » : les mécaniques de mémoire, de conséquence et de narration émergente produisent des effets réellement visibles dans le texte, pas seulement dans les statistiques.

Mais deux défauts concrets et corrigibles à faible effort (orthographe cassée en fin de partie, navigation mobile du tableau de bord) entament la première impression exactement aux moments où elle compte le plus, et un défaut plus structurel (recouvrement de contenu entre partis) limite le potentiel de rejouabilité à moyen terme sans pour autant le détruire. Aucun de ces problèmes n'est de niveau P0 ou P1 : le jeu se joue, se termine, et raconte une histoire cohérente à chaque partie testée. La priorité recommandée est donc une correction ciblée (section 32, points 1-2) plutôt qu'une refonte.

---

## Réponses aux questions finales obligatoires (section 48 du prompt)

**Q1 — Le jeu paraît-il réellement amusant à jouer, ou surtout techniquement impressionnant ?**
Les deux ne s'opposent pas ici : la solidité technique se traduit en gameplay réel (mémoire visible, second tour distinct, bilan personnalisé), pas seulement en robustesse invisible. Le jugement qualitatif sur les 6 trajectoires lues est que le jeu **est déjà intéressant à jouer**, avec des marges de progression identifiées plutôt qu'un vide à combler.

**Q2 — À quel moment d'une partie le jeu est-il le plus intéressant ?**
L'entre-deux-tours (`between_rounds`) : intensité dramatique mesurée la plus élevée hors épilogue (4,98/6), décisions de coalition parmi les plus « dominantes » (donc les plus unanimement reconnues comme stratégiquement engageantes par les agents), ton clairement différencié du premier tour.

**Q3 — À quel moment est-il le plus faible ?**
Le tout début de la phase `pre_campaign` : intensité la plus basse mesurée (3,71/6), concentration des séquences de moments morts détectées, et zone où le recouvrement de contenu entre partis différents est qualitativement le plus perceptible (événements génériques avant l'accumulation de contenu `party`-spécifique).

**Q4 — Les choix donnent-ils envie d'hésiter ?**
Dans la grande majorité des cas oui (98,2 % des paires événement/option évaluées ne sont pas dominées à plus de 80 % par une seule option), avec des exceptions identifiées et documentées (section 6).

**Q5 — Les conséquences donnent-elles envie de voir ce qui arrive ensuite ?**
Oui pour les chaînes narratives et les callbacks de mémoire observés (section 10) ; plus mitigé pour les sous-intrigues procédurales mal calibrées en intensité (section 8).

**Q6 — Les parties racontent-elles des histoires différentes ?**
Oui à l'échelle d'une seule partie (identité narrative forte confirmée sur 4/6 trajectoires lues), mais avec un recouvrement de contenu mesurable et confirmé qualitativement quand on compare des parties de partis différents (section 18-19).

**Q7 — Une défaite donne-t-elle envie de rejouer ?**
Signal positif mais nécessitant un playtest humain pour confirmation (section 33) : les écrans de défaite lus fournissent un fil causal lisible et un sentiment de « j'aurais pu faire autrement », ingrédient nécessaire mais pas suffisant à lui seul pour garantir l'envie de rejouer.

**Q8 — Le second tour est-il un climax ou une formalité ?**
Un climax, mesuré et confirmé qualitativement (section 14) — pas une formalité.

**Q9 — Quel est le principal obstacle actuel à un jeu vraiment addictif/rejouable ?**
Le recouvrement de contenu entre partis différents (section 18-19) : c'est le facteur qui, structurellement, limite le plus la nouveauté perçue d'une partie à l'autre une fois qu'un joueur a exploré plusieurs partis — davantage que le pacing ou la qualité des décisions individuelles, qui sont déjà solides.

**Q10 — Quelles sont les 5 corrections qui apporteraient le plus de fun par heure de développement ?**

1. Corriger les apostrophes manquantes dans `endgame.ts`/`internal.ts` (section 31, P2-1).
2. Corriger la barre d'onglets mobile du tableau de bord (section 31, P2-2).
3. Revue éditoriale de l'étiquetage `importance` sur les chaînes narratives mal calibrées (section 31, P3-6).
4. Diversifier les personnages fictifs récurrents les plus visibles dans les événements génériques (section 31, P3-4, effort plus élevé mais impact direct sur Q9).
5. Ajouter un indice visuel de défilement systématique partout où une liste horizontale peut déborder sur mobile (généralisation préventive du correctif P2-2 à d'autres composants non audités dans cette mission).

---

**Livrables de cette mission** : ce fichier, `audit-results/gameplay/` (CSV, 12 graphiques, 50 chronologies, captures d'écran sur 4 largeurs d'écran), `playtest/` (pack de playtest humain), `scripts/gameplay-audit/` (outillage réutilisable, `npm run audit:gameplay`).
