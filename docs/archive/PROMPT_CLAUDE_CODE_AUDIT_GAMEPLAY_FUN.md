# PROMPT MAÎTRE — AUDIT GAMEPLAY QUALITATIF / « EST-CE QUE LE JEU EST VRAIMENT FUN ? »
## Projet : « Vers l’Élysée »

Tu interviens comme une équipe virtuelle composée de :

- lead game designer ;
- narrative designer ;
- UX designer mobile/web ;
- analyste de gameplay ;
- spécialiste des jeux à choix et roguelite narratifs ;
- spécialiste des simulations politiques ;
- QA senior ;
- analyste statistique ;
- développeur TypeScript/Next.js senior.

Le projet est le jeu politique français **« Vers l’Élysée »** : le joueur choisit ou crée un parti, traverse environ un an de campagne présidentielle au moyen d’événements et de décisions, puis tente de remporter l’élection.

Les audits techniques précédents ont déjà largement validé :

- la diversité des événements ;
- l’absence de répétitions intra-partie ;
- l’impact réel des décisions ;
- le fonctionnement du monde politique autonome ;
- la mémoire des choix ;
- les mouvements idéologiques ;
- l’équilibrage général du premier et du second tour ;
- le déterminisme ;
- les tests ;
- la stabilité technique.

**Cette mission n’est PAS un nouvel audit d’équilibrage statistique général.**

La question centrale est désormais :

> **Est-ce que le jeu est réellement intéressant, lisible, rythmé, surprenant, cohérent et amusant à jouer pendant une partie de 10–15 minutes ?**

Tu dois réaliser un **audit gameplay qualitatif approfondi**, combinant simulations, lecture de trajectoires complètes, tests d’interface, analyses de contenu, métriques de pacing et inspection manuelle systématique.

Tu ne dois pas modifier les mécaniques ou le contenu pour les « corriger » pendant cette mission.
Tu peux créer des scripts d’audit, tests, rapports, captures, outils temporaires ou exports nécessaires à l’analyse, tant qu’ils ne modifient pas le comportement du jeu.

À la fin, produis un diagnostic et des recommandations priorisées.

Ne pousse rien vers le dépôt distant.

---

# 1. DOCUMENTS ET CONTEXTE À LIRE AVANT TOUT

Commence par lire intégralement les fichiers disponibles parmi :

- `AUDIT_POST_CORRECTIONS.md`
- `POST_AUDIT_FIXES.md`
- `P1_P5_FINAL_FIXES.md`
- `audit-results/post-fix/COMPARISON.md`
- `audit-results/p1-p5-final/COMPARISON.md`
- `audit-results/p1-p5-final/README.md`
- `V2_DECISIONS.md`
- `V2_CHANGELOG.md`
- les README du projet ;
- les fichiers de game design ;
- les catalogues d’événements ;
- les scripts d’audit existants ;
- les tests E2E ;
- les composants d’interface du flux de jeu ;
- les écrans de début de partie, événement, sondage, élection et bilan final.

Inspecte aussi :

- l’arborescence du dépôt ;
- les commits récents ;
- la branche courante ;
- `git status`.

Consigne dans le rapport :

- branche ;
- commit ;
- date ;
- version Node/npm ;
- éventuelles modifications non commitées ;
- commandes exécutées.

---

# 2. RÈGLE FONDAMENTALE : NE PAS CONFONDRE « BONNE SIMULATION » ET « BON JEU »

Les audits précédents ont montré que le moteur est beaucoup plus sain.

Mais un jeu peut être :

- statistiquement équilibré ;
- techniquement robuste ;
- narrativement varié ;

...et malgré tout être ennuyeux.

Tu dois donc évaluer séparément :

1. **qualité du moteur** ;
2. **qualité des décisions** ;
3. **qualité narrative** ;
4. **rythme** ;
5. **lisibilité** ;
6. **tension** ;
7. **sentiment d’agence** ;
8. **surprise** ;
9. **rejouabilité** ;
10. **plaisir potentiel**.

Ne déduis jamais automatiquement que :

> « les choix ont un impact statistique » ⇒ « les choix sont intéressants ».

---

# 3. LIMITES DE L’AUDIT

Tu dois être explicite :

Tu peux analyser :

- structure ;
- pacing ;
- variété ;
- cohérence ;
- lisibilité ;
- intérêt apparent des arbitrages ;
- domination mécanique ;
- répétition cognitive ;
- qualité des arcs ;
- friction UX ;
- qualité des feedbacks ;
- rejouabilité structurelle.

Mais tu ne peux pas mesurer avec certitude le **fun humain réel** sans joueurs humains.

Ton rapport doit donc distinguer :

- **preuve objective** ;
- **signal fort** ;
- **jugement qualitatif argumenté** ;
- **point nécessitant un playtest humain**.

Ne prétends jamais avoir prouvé scientifiquement que le jeu est « fun ».

---

# 4. BASELINE TECHNIQUE RAPIDE

Avant l’audit gameplay, exécute les validations existantes :

```bash
npm run format:check
npm run lint
npm run typecheck
npm run data:validate
npm run test
npm run build
npm run audit:smoke
```

Ne relance pas immédiatement une énorme campagne statistique déjà réalisée sauf si une métrique gameplay spécifique l’exige.

L’objectif principal n’est plus de recalculer les η².

---

# 5. CRÉER UN OUTILLAGE D’AUDIT GAMEPLAY DÉDIÉ

Crée si nécessaire :

```text
scripts/gameplay-audit/
audit-results/gameplay/
```

Ajoute une commande de reproduction simple, par exemple :

```bash
npm run audit:gameplay
```

L’outil doit :

- utiliser le vrai moteur ;
- accepter des seeds déterministes ;
- enregistrer les trajectoires complètes ;
- exporter les événements rencontrés ;
- exporter les choix ;
- exporter les conséquences ;
- exporter l’évolution temporelle ;
- exporter les sondages ;
- exporter les changements idéologiques ;
- exporter les relations ;
- exporter les moments critiques ;
- exporter le premier et le second tour ;
- produire des résumés lisibles par partie.

Aucune API payante.

Aucun appel LLM externe.

---

# 6. CONSTITUER UN CORPUS DE PARTIES À INSPECTER

Génère un corpus représentatif d’au moins **150 parties complètes**, stratifiées.

Inclure au minimum :

## Par parti

Au moins 10 parties pour chacun des principaux partis jouables.

## Par résultat

- victoires confortables ;
- victoires serrées ;
- défaites serrées ;
- éliminations précoces ;
- remontées spectaculaires ;
- effondrements ;
- parties avec événement rare ;
- parties avec changement important d’idéologie ;
- parties avec alliance ;
- parties avec conflit avec un adversaire ;
- parties avec chaîne narrative ;
- parties avec second tour.

## Par style de joueur

Utilise plusieurs agents réalistes :

- prudent ;
- risqué ;
- idéologiquement cohérent ;
- opportuniste ;
- médiatique ;
- parti d’abord ;
- aléatoire ;
- contrarien.

Ne juge pas le gameplay uniquement à travers les agents optimisateurs extrêmes.

---

# 7. SÉLECTIONNER DES PARTIES POUR LECTURE INTÉGRALE

Parmi le corpus, sélectionne au minimum **50 parties** pour lecture qualitative complète.

Pour chacune, produis une timeline contenant :

- date/période ;
- situation politique ;
- événement ;
- texte affiché ;
- options proposées ;
- option choisie ;
- conséquence narrative ;
- conséquence mécanique résumée ;
- sondage avant/après ;
- effet différé éventuel ;
- callback éventuel ;
- adversaire affecté ;
- importance estimée de la décision ;
- état final.

Lis ces 50 trajectoires comme un joueur, pas seulement comme un analyste de données.

---

# 8. AUDIT DE LA QUALITÉ DES DÉCISIONS

Pour chaque événement analysé, évalue :

### A. Clarté
Le joueur comprend-il ce qu’il décide ?

### B. Arbitrage
Les options représentent-elles de véritables stratégies différentes ?

### C. Tentation
Existe-t-il au moins deux options raisonnablement attirantes ?

### D. Risque
Le choix comporte-t-il un vrai coût potentiel ?

### E. Lisibilité sans transparence excessive
Le joueur peut-il anticiper vaguement le type de conséquence sans connaître les probabilités ?

### F. Cohérence politique
Les réponses correspondent-elles au thème ?

### G. Cohérence avec le parti
Certaines options sont-elles naturellement plus risquées pour certains partis sans être interdites ?

### H. Effet futur
Le choix peut-il influencer quelque chose au-delà du panneau de conséquence immédiat ?

### I. Différenciation
Les options ont-elles des conséquences mécaniques/narratives réellement distinctes ?

### J. Dilemme réel
Le joueur hésiterait-il probablement plusieurs secondes ?

Attribue un score par événement sur :

- clarté /10 ;
- intérêt /10 ;
- dilemme /10 ;
- conséquence /10 ;
- cohérence /10.

Ne transforme pas ces scores en pseudo-science : ce sont des outils comparatifs.

---

# 9. DÉTECTER LES « FAUX CHOIX INTÉRESSANTS »

Cherche les événements qui paraissent variés mais dont :

- une option est presque toujours meilleure ;
- une option est quasiment toujours mauvaise ;
- les effets se compensent exactement ;
- le wording crée un faux dilemme ;
- le joueur peut deviner une réponse « correcte » trop facilement ;
- les trois options correspondent à « gentil / méchant / intelligent » ;
- une réponse est manifestement absurde sauf roleplay ;
- un choix ne dépend jamais du contexte.

Mesure pour les événements fréquents :

- taux de sélection par agent ;
- performance moyenne par option ;
- variance ;
- effet contextuel ;
- domination d’une option.

Un choix peut être mécaniquement différent et malgré tout être mauvais en game design s’il existe une réponse dominante évidente.

---

# 10. AUDIT DU PACING GLOBAL

Une partie cible environ **10–15 minutes** et ~30 décisions.

Analyse le rythme sur toute la campagne.

Découpe en phases :

1. début de campagne ;
2. montée en puissance ;
3. milieu ;
4. entrée dans la dernière ligne droite ;
5. premier tour ;
6. second tour éventuel ;
7. épilogue.

Mesure :

- nombre de décisions par phase ;
- longueur moyenne des textes ;
- densité d’événements majeurs ;
- densité d’événements mineurs ;
- durée estimée de lecture ;
- temps approximatif entre deux événements importants ;
- fréquence des sondages ;
- fréquence des changements de tendance ;
- événements dramatiques trop rapprochés ;
- périodes trop plates.

Cherche :

- débuts trop lents ;
- milieux monotones ;
- fin précipitée ;
- second tour trop court ;
- climax trop tôt ;
- absence de montée dramatique ;
- succession de crises sans respiration ;
- longue série de micro-choix sans enjeu.

---

# 11. MODÉLISER L’INTENSITÉ DRAMATIQUE

Attribue à chaque événement une intensité approximative :

- 1 : anecdote ;
- 2 : micro-gestion ;
- 3 : événement de campagne ;
- 4 : événement important ;
- 5 : moment majeur ;
- 6 : événement exceptionnel / tournant de partie.

Trace pour plusieurs parties :

```text
temps → intensité
```

Une bonne partie devrait généralement présenter une courbe avec :

- quelques respirations ;
- plusieurs pics ;
- une montée vers l’élection ;
- un climax autour des moments électoraux.

Ne force pas artificiellement une structure parfaite, mais détecte les parties « plates » ou « hystériques ».

---

# 12. AUDIT DES ÉVÉNEMENTS MAJEURS

Identifie les événements qui devraient être mémorables :

- débat télévisé ;
- scandale ;
- crise majeure ;
- ralliement ;
- rupture ;
- alliance ;
- primaire ;
- remplacement d’un candidat ;
- événement rare ;
- premier tour ;
- second tour.

Pour chacun, vérifie :

- fréquence ;
- mise en scène ;
- nombre d’options ;
- conséquence ;
- impact ;
- callback ;
- mémorabilité ;
- place dans le calendrier.

Un événement « légendaire » ne doit pas donner l’impression d’un événement normal avec un label différent.

---

# 13. AUDIT DE LA NARRATION ÉMERGENTE

Pour chaque partie qualitative, demande :

> Peut-on résumer cette campagne en 2–4 phrases comme une histoire spécifique ?

Classe :

- très forte identité narrative ;
- identité correcte ;
- générique ;
- incohérente.

Repère les campagnes qui ressemblent simplement à :

> événement → choix → +stat → événement → choix → +stat → élection.

---

# 14. AUDIT DE LA MÉMOIRE

Vérifie qualitativement si le jeu « se souvient » réellement des actions.

Cherche :

- rappel d’une ancienne déclaration ;
- contradiction ;
- soutien passé ;
- trahison ;
- ancienne alliance ;
- choix programmatique ;
- revirement ;
- relation avec un adversaire ;
- promesse tenue/non tenue.

Mesure :

- proportion de parties avec callback visible ;
- nombre moyen de callbacks ;
- délai entre cause et rappel ;
- qualité narrative du rappel.

Un flag technique ne compte pas comme mémoire gameplay si le joueur ne peut jamais percevoir sa conséquence.

---

# 15. AUDIT DES CONSÉQUENCES

Évalue les écrans de conséquence :

- donnent-ils une information utile ?
- sont-ils trop longs ?
- trop explicatifs ?
- trop vagues ?
- trop similaires en ton ?
- annoncent-ils toujours « bonne nouvelle / mauvaise nouvelle » ?
- expliquent-ils le lien entre choix et effet ?
- révèlent-ils trop le moteur ?
- laissent-ils parfois une ambiguïté intéressante ?

Repère les formulations répétitives non exactes.

Même si les textes sont techniquement uniques, ils peuvent produire une répétition **cognitive**.

---

# 16. RÉPÉTITION COGNITIVE

L’audit précédent a éliminé les doublons textuels exacts.

Ici, cherche :

> Est-ce que le joueur a l’impression de refaire le même type d’action ?

Catégorise les événements :

- interview ;
- débat ;
- programme ;
- polémique ;
- meeting ;
- alliance ;
- conflit interne ;
- crise ;
- économie ;
- social ;
- sécurité ;
- international ;
- adversaire ;
- média ;
- stratégie ;
- etc.

Mesure dans chaque partie :

- occurrences par catégorie ;
- séquences de catégories identiques ;
- répétition de structures décisionnelles ;
- répétition d’émotions ;
- répétition de conséquences.

---

# 17. AUDIT DES SONDAGES

Analyse les courbes de sondage.

Cherche :

- mouvements trop fréquents ;
- mouvements trop faibles ;
- zigzags artificiels ;
- stagnation trop longue ;
- sauts inexplicables ;
- score qui change avant que le joueur comprenne pourquoi ;
- dynamique trop facile à lire ;
- dynamique totalement chaotique.

Le joueur doit sentir :

- que ses choix comptent ;
- qu’il existe de l’incertitude ;
- qu’un sondage n’est pas une vérité absolue ;
- qu’un momentum peut se construire ;
- qu’un retournement peut arriver.

---

# 18. AUDIT DU PREMIER TOUR

Vérifie :

- montée de tension avant le premier tour ;
- clarté de l’enjeu ;
- animation ;
- rythme ;
- présentation des résultats ;
- lisibilité du classement ;
- élimination ;
- qualification ;
- conséquences narratives.

Le premier tour doit être un moment majeur.

---

# 19. AUDIT DU SECOND TOUR

Vérifie :

- différence de ton avec le premier tour ;
- sentiment de duel ;
- présence de nouveaux enjeux ;
- alliances ;
- consignes ;
- reports ;
- adaptation de stratégie ;
- tension ;
- climax.

Le second tour ne doit pas donner l’impression de simplement cliquer 2 fois avant l’écran final.

Si nécessaire, signale qu’il manque du contenu — ne l’ajoute pas dans cette mission.

---

# 20. AUDIT DE LA DÉFAITE

Analyse :

- élimination au premier tour ;
- défaite serrée au second ;
- défaite lourde ;
- campagne catastrophique.

Le joueur obtient-il :

- un résumé intéressant ?
- une raison de sa défaite ?
- des statistiques intéressantes ?
- un score ?
- des événements marquants ?
- un sentiment de « j’aurais pu faire autrement » ?
- une envie de recommencer ?

---

# 21. AUDIT DE LA VICTOIRE

Vérifie :

- montée finale ;
- résultat ;
- animation ;
- résumé ;
- comparaison avec le départ ;
- événements marquants ;
- score final ;
- héritage de la campagne ;
- partage.

La victoire ne doit pas être un écran statistique froid.

---

# 22. AUDIT DU BILAN FINAL

Évalue si le bilan permet au joueur de raconter sa partie.

Il devrait idéalement montrer, sans surcharge :

- parti ;
- candidat ;
- score initial ;
- score premier tour ;
- score second tour ;
- résultat ;
- progression ;
- adhérents ;
- idéologie ;
- moments clés ;
- alliances ;
- adversaires ;
- événements marquants ;
- score /100 ;
- badges/succès ;
- possibilité de partage.

---

# 23. AUDIT DE LA REJOUABILITÉ

Compare des parties du même parti avec différentes seeds.

Mesure :

- taux de recouvrement des événements ;
- taux de recouvrement des catégories ;
- diversité des adversaires ;
- diversité des arcs ;
- diversité des résultats ;
- diversité idéologique ;
- diversité des événements rares.

Utilise notamment :

- Jaccard des événements ;
- Jaccard des catégories ;
- longueur des sous-séquences communes ;
- taux de chaînes différentes.

Une partie peut avoir 0 doublon interne mais être identique à la précédente.

Cherche donc la répétition **entre parties**.

---

# 24. AUDIT DU MODE PARTI PERSONNALISÉ

Joue plusieurs configurations :

- extrême gauche ;
- gauche ;
- centre ;
- droite ;
- extrême droite ;
- libertarien ;
- écologiste radical ;
- souverainiste ;
- profil volontairement incohérent.

Vérifie :

- onboarding ;
- questions de création ;
- clarté ;
- conséquences ;
- positionnement obtenu ;
- statistiques de départ ;
- événements disponibles ;
- difficulté ;
- cohérence du récit.

---

# 25. AUDIT DES PARTIS EXISTANTS

Pour chaque parti jouable :

- identité gameplay ;
- difficulté ;
- avantage principal ;
- faiblesse principale ;
- type de dilemmes ;
- électorat ;
- style de campagne probable ;
- différence avec les autres partis.

Demande :

> Si on masque le nom du parti, peut-on quand même sentir qu’une partie LFI ne ressemble pas à une partie Horizons ou RN ?

Signale les partis trop interchangeables.

---

# 26. AUDIT UX DES ÉCRANS

Utilise Playwright sur :

- desktop ;
- smartphone étroit ;
- smartphone large ;
- tablette si pertinent.

Inspecte :

- écran d’accueil ;
- sélection du parti ;
- création du parti ;
- événement ;
- conséquence ;
- sondage ;
- journal ;
- premier tour ;
- second tour ;
- résultat final ;
- historique.

Vérifie :

- hiérarchie ;
- taille des textes ;
- zones tactiles ;
- scroll ;
- boutons ;
- modal ;
- safe areas ;
- navigation retour ;
- lisibilité ;
- contraste ;
- états disabled ;
- feedback après clic ;
- transitions ;
- chargement.

Prends des captures représentatives.

---

# 27. VITESSE ET FLUIDITÉ PERÇUE

Observe :

- temps entre clic et conséquence ;
- transition ;
- animation ;
- temps de passage à l’événement suivant ;
- écrans inutiles ;
- clics nécessaires ;
- confirmation superflue.

Une partie de 10–15 minutes doit rester fluide.

Repère les actions où le joueur doit cliquer sans décider.

---

# 28. CHARGE COGNITIVE

Analyse :

- longueur des événements ;
- longueur des choix ;
- nombre moyen de mots ;
- jargon ;
- acronymes ;
- statistiques visibles ;
- informations simultanées ;
- nombre de panneaux.

Détecte les événements trop longs par rapport à leur importance.

---

# 29. TON ET STYLE

Vérifie la cohérence éditoriale :

- sérieux ;
- satire légère ;
- réalisme ;
- événements absurdes rares.

Repère :

- rupture de ton ;
- humour trop fréquent ;
- humour au mauvais moment ;
- langage artificiel ;
- texte « écrit par IA » ;
- formulation bureaucratique ;
- répétitions de structure ;
- exagération.

Le jeu doit avoir une voix identifiable.

---

# 30. POLITIQUE ET NEUTRALITÉ DU GAME DESIGN

Vérifie :

- aucun parti caricaturé systématiquement ;
- aucun parti présenté comme intrinsèquement « intelligent » ou « stupide » ;
- les forces/faiblesses reposent sur des mécaniques explicables ;
- les options radicales peuvent parfois fonctionner ;
- les options modérées peuvent parfois échouer ;
- les événements ne servent pas de propagande implicite.

Le jeu peut être satirique, mais il doit rester jouable avec n’importe quel parti.

---

# 31. ANALYSE DE LA TENSION

Détermine si le joueur ressent probablement :

- urgence ;
- incertitude ;
- progression ;
- risque ;
- anticipation.

Mesure des proxys :

- fréquence des changements de classement ;
- fréquence des sondages serrés ;
- écarts avant premier tour ;
- écarts avant second tour ;
- événements critiques ;
- possibilité de comeback.

Repère :

- parties gagnées trop tôt ;
- parties perdues trop tôt ;
- parties où le résultat semble évident à mi-parcours.

---

# 32. « MOMENTS MÉMORABLES »

Pour les 50 parties qualitatives, identifie le meilleur moment potentiel de chaque partie.

Classe :

- débat ;
- crise ;
- retournement ;
- alliance ;
- scandale ;
- ralliement ;
- sondage ;
- résultat ;
- événement rare ;
- autre.

Mesure la part de parties pour lesquelles aucun moment réellement mémorable ne peut être identifié.

---

# 33. « MOMENTS MORTS »

Identifie les séquences de 3 événements ou plus où :

- l’enjeu est faible ;
- aucune stat importante ne bouge ;
- aucun contexte n’évolue ;
- aucune chaîne ne se prépare ;
- aucune tension électorale ne change.

Mesure :

- nombre moyen par partie ;
- position dans la campagne ;
- catégories concernées.

---

# 34. ANALYSE DES CHOIX DOMINANTS

Pour chaque événement fréquent :

- option choisie par chaque agent ;
- valeur moyenne ;
- résultat ;
- contexte.

Repère les événements où une option gagne dans presque tous les contextes.

Seuil indicatif de vigilance :

- une option sélectionnée comme meilleure par >80 % des politiques réalistes ;
- ou un rendement supérieur aux autres dans presque toutes les simulations.

---

# 35. ÉVALUER LA REJOUABILITÉ À COURT TERME

Simule conceptuellement l’expérience :

- première partie ;
- deuxième partie avec le même parti ;
- troisième partie avec un autre parti ;
- mode aléatoire ;
- parti personnalisé.

Réponds :

> Le joueur a-t-il une bonne raison de cliquer immédiatement sur « Nouvelle partie » ?

Analyse :

- découverte ;
- réussite ;
- badges ;
- fins rares ;
- stratégies alternatives ;
- partis ;
- événements ;
- résultats.

---

# 36. MODE TOUT ALÉATOIRE

Audite spécifiquement ce mode.

Il doit :

- lancer rapidement ;
- produire des situations amusantes ;
- favoriser la découverte ;
- ne pas générer trop souvent des configurations absurdes sans intérêt.

Mesure la diversité et la viabilité de plusieurs dizaines de runs.

---

# 37. ANALYSE DES SUCCÈS / BADGES

Vérifie :

- compréhension ;
- variété ;
- difficulté ;
- caractère amusant ;
- incitation à rejouer ;
- absence de grind inutile.

Classe les succès :

- naturel ;
- challenge ;
- roleplay ;
- secret ;
- rare ;
- absurde.

Repère ceux qui n’influencent pas réellement la motivation.

---

# 38. SCORING FINAL

Analyse le score /100 :

- correspond-il à la qualité réelle de la campagne ?
- une défaite remarquable peut-elle scorer haut ?
- une victoire médiocre peut-elle scorer moins qu’une très belle défaite ?
- le joueur comprend-il pourquoi il obtient ce score ?
- le score donne-t-il envie de rejouer ?

Teste des cas extrêmes.

---

# 39. CRÉER UNE GRILLE DE QUALITÉ GLOBALE

À la fin, attribue des notes sur 100 avec justification :

| Domaine | Note |
|---|---:|
| Qualité des décisions | /100 |
| Pacing | /100 |
| Narration émergente | /100 |
| Sentiment d’agence | /100 |
| Lisibilité | /100 |
| Tension | /100 |
| Mémorabilité | /100 |
| Rejouabilité | /100 |
| Différenciation des partis | /100 |
| Qualité du premier tour | /100 |
| Qualité du second tour | /100 |
| Bilan final | /100 |
| UX mobile | /100 |
| UX desktop | /100 |
| Potentiel de fun | /100 |

Le « potentiel de fun » doit être présenté comme un jugement qualitatif, pas comme une mesure scientifique.

---

# 40. CLASSER LES PROBLÈMES

Classe tous les problèmes détectés :

- **P0** — empêche de jouer ;
- **P1** — détruit fortement le plaisir ou l’agence ;
- **P2** — dégrade nettement le gameplay ;
- **P3** — amélioration importante ;
- **P4** — polish.

Pour chaque problème :

- preuve ;
- fréquence ;
- impact ;
- exemples ;
- fichiers concernés ;
- correction recommandée ;
- risque ;
- difficulté ;
- test d’acceptation.

---

# 41. NE PAS CORRIGER LE GAMEPLAY DANS CETTE MISSION

Important :

**Ne commence aucune correction de contenu ou de mécanique.**

Tu peux uniquement :

- créer l’outillage d’audit ;
- ajouter des tests non invasifs ;
- exporter des données ;
- produire des captures ;
- générer des rapports.

Le but est d’obtenir une liste fiable avant de relancer un chantier de modifications.

---

# 42. PRODUIRE UN « HUMAN PLAYTEST PACK »

Comme le fun réel nécessite des humains, crée :

```text
playtest/
```

Avec :

## `PLAYTEST_GUIDE.md`
Instructions pour faire tester le jeu à une personne sans l’influencer.

## `PLAYTEST_FORM.md`
Questionnaire court, idéalement 10–15 questions :

- as-tu compris quoi faire ?
- as-tu hésité sur les choix ?
- quels moments t’ont marqué ?
- as-tu compris pourquoi les sondages bougeaient ?
- as-tu senti que tes décisions comptaient ?
- y a-t-il eu des moments ennuyeux ?
- résultat juste/injuste ?
- envie de rejouer ?
- parti essayé ?
- note /10.

## `PLAYTEST_OBSERVER.md`
Checklist pour quelqu’un qui regarde jouer :

- hésitations ;
- incompréhensions ;
- scroll ;
- clics ratés ;
- réactions ;
- moments d’ennui ;
- surprise ;
- frustration ;
- fin de partie.

## `PLAYTEST_RESULTS_TEMPLATE.csv`
Colonnes permettant d’agréger les tests humains ultérieurement.

Ne mets aucune télémétrie distante.

---

# 43. LIVRABLE PRINCIPAL

Crée :

```text
GAMEPLAY_AUDIT.md
```

Structure obligatoire :

1. Résumé exécutif
2. Méthodologie
3. Limites
4. Corpus analysé
5. Qualité des décisions
6. Faux choix et choix dominants
7. Pacing
8. Intensité dramatique
9. Narration émergente
10. Mémoire et callbacks
11. Répétition cognitive
12. Sondages
13. Premier tour
14. Second tour
15. Victoire
16. Défaite
17. Bilan final
18. Rejouabilité
19. Différenciation des partis
20. Parti personnalisé
21. Mode aléatoire
22. Succès/badges
23. UX mobile
24. UX desktop
25. Charge cognitive
26. Ton éditorial
27. Neutralité du game design
28. Moments mémorables
29. Moments morts
30. Scores de qualité
31. Problèmes P0–P4
32. Recommandations
33. Points nécessitant obligatoirement un playtest humain
34. Conclusion

---

# 44. FICHIERS DE RÉSULTATS

Crée selon besoin :

```text
audit-results/gameplay/
  README.md
  runs.csv
  events.csv
  choices.csv
  choice-quality.csv
  pacing.csv
  cognitive-repetition.csv
  dominant-choices.csv
  poll-trajectories.csv
  replayability.csv
  narrative-arcs.csv
  memorable-moments.csv
  dead-zones.csv
  party-identity.csv
  final-scores.csv
  screenshots/
  timelines/
  charts/
```

Ne commite pas de fichiers gigantesques inutiles.

---

# 45. GRAPHIQUES

Produis au minimum :

1. intensité dramatique moyenne selon la progression de la campagne ;
2. distribution du nombre de moments forts par partie ;
3. moments morts par phase ;
4. longueur moyenne des textes par type d’événement ;
5. répétition cognitive par catégorie ;
6. Jaccard d’événements entre parties ;
7. diversité par parti ;
8. trajectoires de sondage représentatives ;
9. fréquence des catégories d’événements ;
10. choix dominants ;
11. taux de callbacks ;
12. distribution des scores finaux.

---

# 46. ÉCHANTILLONS QUALITATIFS

Dans le rapport, cite au moins :

- 10 excellents événements ;
- 10 événements moyens ;
- 10 événements faibles ;
- 5 excellentes parties complètes ;
- 5 parties faibles ;
- 5 parties avec bonne narration émergente ;
- 5 parties trop plates.

Pour chaque exemple faible, explique précisément pourquoi.

Ne modifie pas ces événements dans cette mission.

---

# 47. TEST UX AUTOMATISÉ

Utilise Playwright pour jouer plusieurs parties réelles sur :

- Chromium desktop ;
- viewport mobile étroit ;
- viewport mobile large.

Teste :

- démarrage ;
- partie existante ;
- parti personnalisé ;
- choix ;
- conséquence ;
- journal ;
- sondage ;
- premier tour ;
- second tour ;
- bilan ;
- nouvelle partie.

Chronomètre approximativement le flux.

Vérifie qu’une partie cible reste compatible avec 10–15 minutes de lecture normale.

---

# 48. QUESTIONS FINALES OBLIGATOIRES

À la fin du rapport, réponds explicitement :

### Q1
**Est-ce que le jeu paraît aujourd’hui réellement amusant à jouer, ou surtout techniquement impressionnant ?**

### Q2
**À quel moment d’une partie le jeu est-il le plus intéressant ?**

### Q3
**À quel moment est-il le plus faible ?**

### Q4
**Les choix donnent-ils envie d’hésiter ?**

### Q5
**Les conséquences donnent-elles envie de voir ce qui arrive ensuite ?**

### Q6
**Les parties racontent-elles des histoires différentes ?**

### Q7
**Une défaite donne-t-elle envie de rejouer ?**

### Q8
**Le second tour est-il un climax ou une formalité ?**

### Q9
**Quel est le principal obstacle actuel à un jeu vraiment addictif/rejouable ?**

### Q10
**Quelles sont les 5 corrections qui apporteraient le plus de fun par heure de développement ?**

---

# 49. VERDICT FINAL TERMINAL

Affiche à la fin :

```text
AUDIT GAMEPLAY — VERDICT FINAL

Qualité des décisions : XX/100
Pacing : XX/100
Narration émergente : XX/100
Agence perçue : XX/100
Tension : XX/100
Mémorabilité : XX/100
Rejouabilité : XX/100
UX mobile : XX/100
UX desktop : XX/100
Potentiel de fun : XX/100

Nombre de problèmes :
P0 :
P1 :
P2 :
P3 :
P4 :

Principal point fort :
Principal point faible :
Meilleure phase de la partie :
Phase la plus faible :
Meilleure amélioration possible :
Besoin de playtest humain : OUI

Rapport :
GAMEPLAY_AUDIT.md

Human playtest pack :
playtest/

Aucune mécanique de jeu corrigée pendant cet audit.
Aucun push distant effectué.
```

---

# 50. DÉMARRAGE IMMÉDIAT

Commence maintenant.

Ordre obligatoire :

1. inspecter le dépôt ;
2. lire les audits précédents ;
3. vérifier l’état technique ;
4. créer l’outillage gameplay ;
5. générer le corpus ;
6. sélectionner les 50 timelines ;
7. effectuer l’analyse quantitative ;
8. lire qualitativement les trajectoires ;
9. tester l’interface ;
10. produire le Human Playtest Pack ;
11. rédiger `GAMEPLAY_AUDIT.md` ;
12. classer les problèmes ;
13. afficher le verdict final ;
14. ne corriger aucune mécanique sans nouvelle instruction ;
15. ne pousser aucun commit vers le distant.

Ne demande l’intervention de l’utilisateur que si une information strictement indispensable est absente et impossible à déduire du dépôt.
