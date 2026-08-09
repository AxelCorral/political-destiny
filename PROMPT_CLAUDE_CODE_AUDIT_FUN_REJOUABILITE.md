# PROMPT MAÎTRE — AUDIT DU FUN, DU PLAISIR DE JEU ET DE LA REJOUABILITÉ
## Projet : « Vers l'Élysée »

Tu interviens comme **lead game designer**, **UX researcher**, **analyste de systèmes de jeu**, **spécialiste de simulations narratives**, **playtest designer** et **auditeur indépendant**.

Ta mission n’est PAS de vérifier seulement si le jeu fonctionne techniquement.

Tu dois répondre à une question beaucoup plus importante :

> **Est-ce que le jeu est réellement amusant à jouer, partie après partie, avec des partis différents, ou est-ce qu’il est seulement techniquement sophistiqué ?**

Le projet est un jeu de campagne présidentielle française : le joueur choisit ou crée un parti, traverse environ un an de campagne au fil d’événements, prend des décisions, affronte des adversaires autonomes, subit des événements aléatoires, peut faire évoluer son positionnement idéologique, puis joue le premier et éventuellement le second tour.

Le jeu vise une partie relativement courte, typiquement de l’ordre de 10 à 15 minutes, avec une forte rejouabilité.

L’audit précédent s’est principalement concentré sur :

- la diversité des choix ;
- la répétition des événements ;
- l’agence du joueur ;
- les conséquences ;
- la mémoire narrative ;
- les adversaires ;
- les déplacements idéologiques ;
- l’équilibrage électoral ;
- les répétitions intra-partie.

Le présent audit doit se concentrer sur **l’expérience réelle de jeu**.

Tu dois déterminer si les systèmes existants produisent effectivement :

- du plaisir ;
- de la tension ;
- de la surprise ;
- de la curiosité ;
- des histoires mémorables ;
- des dilemmes intéressants ;
- une envie de relancer une partie ;
- une identité différente selon le parti ;
- une impression de mener une campagne politique plutôt que de cliquer sur une suite de cartes.

IMPORTANT :

**Ne corrige rien pendant cet audit.**

Tu peux créer :

- des scripts ;
- des tests ;
- des logs ;
- des captures ;
- des rapports ;
- des métriques ;
- des outils de playtest.

Mais tu ne dois pas modifier les règles, événements, probabilités, statistiques, textes ou interfaces du jeu dans le but d’améliorer les résultats.

Tu dois auditer l’état réel actuel.

---

# 1. OBJECTIF PRINCIPAL

L’audit doit répondre clairement à ces questions.

### Question centrale

**Est-ce que « Vers l’Élysée » est amusant ?**

Puis, plus précisément :

1. Est-ce qu’une partie raconte réellement une histoire ?
2. Est-ce que les événements donnent envie de lire et réfléchir ?
3. Est-ce que les événements aléatoires apportent du plaisir ou seulement du bruit ?
4. Les événements rares sont-ils excitants lorsqu’ils apparaissent ?
5. Les décisions sont-elles intéressantes en elles-mêmes ?
6. Le joueur ressent-il de la tension avant certaines décisions ?
7. Le joueur est-il surpris par certaines conséquences ?
8. Le hasard produit-il des situations mémorables ?
9. Le hasard produit-il parfois des situations injustes ou frustrantes ?
10. La campagne monte-t-elle réellement en intensité ?
11. Le début, le milieu et la fin de partie donnent-ils des sensations différentes ?
12. Le premier tour constitue-t-il un vrai climax ?
13. Le second tour change-t-il suffisamment la façon de jouer ?
14. Perd-on parfois avec l’impression d’avoir vécu une bonne partie ?
15. Gagner est-il satisfaisant ?
16. Une victoire facile est-elle trop plate ?
17. Une défaite serrée donne-t-elle envie de recommencer ?
18. Le joueur comprend-il pourquoi il gagne ou perd ?
19. Les parties avec différents partis sont-elles réellement différentes ?
20. Peut-on sincèrement s’amuser avec un parti faible ?
21. Peut-on sincèrement s’amuser avec un parti favori ?
22. Certains partis sont-ils mécaniquement intéressants mais narrativement ennuyeux ?
23. Certains partis ont-ils trop peu de possibilités distinctives ?
24. Les partis extrêmes produisent-ils des parties différentes des partis centristes ?
25. Les partis proches idéologiquement se distinguent-ils suffisamment ?
26. Le jeu encourage-t-il plusieurs styles de jeu ?
27. Existe-t-il une stratégie dominante qui réduit l’intérêt des autres ?
28. Le joueur peut-il volontairement tenter une campagne atypique ?
29. Le jeu réagit-il suffisamment à cette campagne atypique ?
30. Après 5, 10 ou 20 parties, a-t-on encore envie d’en relancer une ?

---

# 2. PHILOSOPHIE DE L’AUDIT

Le fun n’est pas une seule statistique.

Tu dois donc combiner :

### A. Mesures objectives

- fréquence ;
- variété ;
- rythme ;
- distribution ;
- répétition ;
- taux de retournement ;
- proximité des résultats ;
- amplitude des conséquences ;
- chaînes narratives ;
- moments décisifs ;
- fréquence des événements rares ;
- écarts entre partis ;
- divergence entre styles de jeu.

### B. Analyse qualitative

- qualité des situations ;
- qualité des dilemmes ;
- surprise ;
- tension ;
- frustration ;
- humour ;
- absurdité ;
- vraisemblance politique ;
- cohérence narrative ;
- sentiment de progression ;
- attachement à la campagne.

### C. Playtests systématiques

Tu dois réellement jouer ou simuler des parties lisibles et analyser les chronologies complètes.

### D. Contrôle du code

Tu dois identifier les raisons systémiques expliquant les sensations observées.

Ne déduis jamais que le jeu est amusant uniquement parce qu’il contient beaucoup d’événements.

Ne déduis jamais qu’un événement est intéressant uniquement parce que son texte est unique.

Ne déduis jamais qu’une décision est satisfaisante uniquement parce qu’elle possède plusieurs effets.

---

# 3. PRÉPARATION

Commence par inspecter intégralement le dépôt.

Lis en priorité :

- `AUDIT_POST_CORRECTIONS.md`
- `POST_AUDIT_FIXES.md` s’il existe ;
- `audit-results/README.md`
- les résultats d’audit les plus récents ;
- les chronologies de parties ;
- `V2_DECISIONS.md`
- `V2_CHANGELOG.md`
- les documents de game design ;
- tous les fichiers décrivant les partis ;
- les événements ;
- les événements rares ;
- les chaînes narratives ;
- le moteur d’adversaires ;
- le moteur électoral ;
- les écrans de jeu ;
- les tests Playwright.

Note :

- commit ;
- branche ;
- git status ;
- version Node/npm ;
- nombre d’événements ;
- nombre de partis ;
- durée théorique d’une campagne ;
- nombre moyen de décisions.

Exécute avant tout audit :

```bash
npm run format:check
npm run lint
npm run typecheck
npm run data:validate
npm run test
npm run build
```

Puis exécute les audits existants pertinents.

Ne change aucune règle du jeu.

---

# 4. CRÉER UN OUTIL D’AUDIT DU FUN

Crée un dossier séparé, par exemple :

```text
scripts/fun-audit/
audit-results/fun-audit/
```

Ajoute si possible :

```bash
npm run audit:fun
```

L’outil doit produire des données reproductibles.

Utilise le moteur de production réel.

Ne réimplémente pas approximativement le jeu.

Chaque campagne doit enregistrer au minimum :

- seed ;
- parti ;
- stratégie/agent ;
- événements rencontrés ;
- choix effectués ;
- résultats ;
- sondages ;
- score final ;
- qualification ;
- victoire ;
- changements idéologiques ;
- événements rares ;
- chaînes narratives ;
- actions adverses ;
- revirements ;
- alliances ;
- scandales fictifs ;
- remplacements de candidats ;
- moments où le classement change ;
- moments où le joueur passe au-dessus ou sous le seuil de qualification ;
- marge avec le candidat suivant ;
- durée estimée de la partie ;
- nombre de décisions à forte conséquence.

---

# 5. AUDIT DU RYTHME DE PARTIE

Une bonne partie doit posséder un rythme.

Découpe chaque campagne en :

- début ;
- premier tiers ;
- milieu ;
- dernier tiers ;
- pré-premier tour ;
- premier tour ;
- entre-deux-tours ;
- second tour.

Mesure pour chaque phase :

- amplitude moyenne des événements ;
- nombre de changements significatifs ;
- volatilité des sondages ;
- fréquence des événements rares ;
- poids moyen des décisions ;
- nombre de chaînes narratives actives ;
- intensité des actions adverses ;
- probabilité de changement de classement ;
- probabilité de changement de qualification ;
- proximité de l’élection.

Cherche à savoir si la partie produit une courbe de tension.

Une campagne plate ressemble par exemple à :

```text
événement
→ petite variation
→ événement
→ petite variation
→ événement
→ petite variation
→ élection
```

Une campagne intéressante devrait plus souvent produire :

```text
installation
→ premières orientations
→ premier problème
→ opportunité
→ crise ou retournement
→ conséquences d’un ancien choix
→ accélération
→ tension de qualification
→ premier tour
→ recomposition
→ climax final
```

Identifie si cette montée existe réellement.

---

# 6. AUDIT DU « MOMENT-TO-MOMENT FUN »

Analyse chaque événement comme une unité de jeu.

Pour chaque événement, attribue des indicateurs calculés ou évalués :

- clarté de la situation ;
- enjeu compréhensible ;
- enjeu personnel pour la campagne ;
- dilemme réel ;
- différence entre options ;
- possibilité de surprise ;
- conséquence mémorable ;
- interaction avec l’historique ;
- interaction avec un adversaire ;
- potentiel humoristique ;
- potentiel dramatique ;
- potentiel politique ;
- potentiel de retournement.

Classe les événements :

### S — Moment fort

Événement susceptible d’être raconté après la partie.

### A — Très bon

Choix clairement intéressant.

### B — Correct

Fonctionne, mais peu mémorable.

### C — Faible

Remplit le temps mais apporte peu.

### D — Ennuyant

Choix évident, répétitif ou sans enjeu.

### F — Nuisible

Frustrant, incohérent, injuste ou casse le rythme.

Ne classe pas tout artificiellement en A/B.

Produis une vraie distribution.

Identifie :

- les 20 meilleurs événements ;
- les 20 plus faibles ;
- les événements qui paraissent intéressants dans le code mais pas en situation ;
- les événements qui deviennent intéressants uniquement grâce au contexte.

---

# 7. LES ÉVÉNEMENTS ALÉATOIRES APPORTENT-ILS VRAIMENT QUELQUE CHOSE ?

C’est une question centrale de l’audit.

Pour chaque catégorie d’événement aléatoire, mesure :

- fréquence ;
- surprise ;
- impact ;
- contexte ;
- conséquences ;
- variété ;
- influence sur le résultat ;
- influence sur l’histoire ;
- potentiel de frustration.

Distingue :

### Randomness intéressante

Le hasard crée :

- une opportunité ;
- un problème à résoudre ;
- une histoire ;
- un retournement ;
- une adaptation stratégique.

### Randomness neutre

Le hasard change quelques valeurs mais ne change pas la manière de jouer.

### Randomness frustrante

Le hasard :

- détruit une campagne sans contre-jeu ;
- produit un effet disproportionné ;
- annule plusieurs décisions antérieures ;
- donne une victoire gratuite ;
- déclenche un événement impossible à anticiper et sans réponse intéressante.

Calcule un ratio :

```text
hasard créant une décision intéressante
/
hasard créant seulement une variation numérique
```

Analyse également :

> Si on supprimait temporairement tous les événements aléatoires non obligatoires, est-ce que le jeu deviendrait clairement moins intéressant ?

Fais une expérience A/B uniquement dans un harnais d’audit temporaire :

### Variante A

Jeu normal.

### Variante B

Même moteur, mêmes graines, mais événements purement aléatoires désactivés dans le harnais.

Ne modifie pas le jeu de production.

Compare :

- variété des trajectoires ;
- volatilité ;
- nombre de moments décisifs ;
- nombre de chaînes ;
- différence entre parties ;
- tension ;
- résultat final.

Si retirer les événements aléatoires change très peu les parties, alors ils n’apportent probablement pas assez.

---

# 8. AUDIT DES ÉVÉNEMENTS RARES

Pour chacun des événements rares/legendary/secret :

Analyse :

- fréquence ;
- préconditions ;
- surprise ;
- impact ;
- originalité ;
- caractère mémorable ;
- cohérence ;
- capacité à créer une nouvelle trajectoire.

Pose la question :

> Quand cet événement apparaît, le joueur est-il réellement content/surpris/inquiet, ou voit-il seulement une autre carte ?

Classe les événements rares en :

- exceptionnel ;
- mémorable ;
- intéressant ;
- gadget ;
- trop fréquent ;
- trop rare ;
- trop puissant ;
- pas assez puissant.

Vérifie surtout s’ils produisent des situations que les événements normaux ne produisent jamais.

Un événement rare ne doit pas seulement être un événement normal avec un texte plus extravagant.

---

# 9. AUDIT DU FUN PAR PARTI

C’est une partie essentielle.

Pour CHAQUE parti jouable, réalise une analyse séparée.

Mesure :

- difficulté ;
- variété ;
- nombre d’événements spécifiques ;
- nombre de chaînes spécifiques ;
- fréquence de crises internes ;
- opportunités d’alliance ;
- marge idéologique ;
- risque de scission ;
- facilité de qualification ;
- potentiel de retournement ;
- styles de campagne viables ;
- adversaires naturels ;
- intérêt du second tour.

Attribue pour chaque parti :

### Fun immédiat /10

Est-ce agréable dès la première partie ?

### Profondeur /10

Peut-on apprendre à mieux le jouer ?

### Rejouabilité /10

Plusieurs campagnes donnent-elles des histoires différentes ?

### Identité /10

Est-ce que jouer ce parti donne une sensation propre ?

### Agence /10

Le joueur peut-il réellement changer sa trajectoire ?

### Tension /10

La partie produit-elle des moments de suspense ?

### Variété stratégique /10

Existe-t-il plusieurs styles viables ?

### Satisfaction victoire /10

La victoire est-elle méritée et satisfaisante ?

### Intérêt défaite /10

Une défaite peut-elle tout de même être une bonne partie ?

Puis calcule un score de fun global, mais affiche aussi les sous-scores.

Classe les partis.

Attention :

Le parti le plus fort ne doit PAS automatiquement avoir le meilleur score de fun.

Un outsider peut être plus amusant qu’un favori.

---

# 10. PEUT-ON S’AMUSER AVEC N’IMPORTE QUEL PARTI ?

Réponds explicitement à cette question.

Cherche les profils problématiques :

### Favori ennuyeux

- qualification presque acquise ;
- décisions peu importantes ;
- victoire trop fréquente ;
- faible tension.

### Outsider frustrant

- très peu de chances ;
- décisions insuffisantes pour revenir ;
- campagne souvent jouée d’avance.

### Parti monotone

- mêmes thèmes ;
- mêmes événements ;
- mêmes stratégies.

### Parti sans identité

- expérience proche d’un autre parti.

### Parti « puzzle »

- une stratégie clairement supérieure ;
- une fois comprise, la partie devient mécanique.

### Parti sandbox

- plusieurs trajectoires valables ;
- forte rejouabilité.

Identifie précisément les partis appartenant potentiellement à ces catégories.

---

# 11. AUDIT DES DIFFÉRENCES ENTRE PARTIS

Calcule la similarité des expériences.

Pour deux partis A et B, compare :

- événements vus ;
- catégories d’événements ;
- choix ;
- actions adverses ;
- évolution idéologique ;
- trajectoire électorale ;
- alliances ;
- profils de second tour ;
- variance du résultat.

Construis une matrice de similarité entre partis.

Si deux partis idéologiquement proches produisent 90 % de la même expérience, signale-le.

Si deux partis différents produisent mécaniquement les mêmes campagnes avec seulement des chiffres différents, signale-le.

---

# 12. AUDIT DE LA REJOUABILITÉ

Simule et analyse des séries de parties successives.

Pour chaque parti :

- partie 1 ;
- partie 2 ;
- partie 3 ;
- partie 5 ;
- partie 10 ;
- partie 20.

Mesure :

- événements nouveaux rencontrés ;
- nouvelles chaînes ;
- nouveaux événements rares ;
- nouvelles configurations adverses ;
- nouvelles finales ;
- nouveaux dilemmes ;
- nouvelles trajectoires idéologiques.

Calcule une courbe :

```text
% de contenu réellement nouveau
selon le nombre de parties déjà jouées
```

Mais ne te limite pas au contenu textuel.

Mesure aussi la nouveauté structurelle :

- situation électorale ;
- adversaires ;
- alliances ;
- ordre des événements ;
- conséquences ;
- résultat.

Détermine à quel moment la lassitude devient probable.

---

# 13. AUDIT DES CHOIX ÉVIDENTS

Pour chaque choix suffisamment fréquent :

mesure :

- fréquence de sélection ;
- effet moyen ;
- risque ;
- bénéfice ;
- score électoral ;
- score final ;
- cohésion ;
- rejet ;
- issue finale.

Détecte :

- choix dominant ;
- choix piège ;
- option presque jamais rationnelle ;
- option presque toujours optimale ;
- option seulement décorative ;
- option très contextuelle.

Un bon jeu ne doit pas nécessairement équilibrer toutes les options.

Mais un événement où :

```text
A est presque toujours meilleur que B et C
```

devient rapidement ennuyeux.

Identifie les événements dont le dilemme disparaît une fois que le joueur comprend le système.

---

# 14. AUDIT DE LA LISIBILITÉ DU RISQUE

Une décision intéressante nécessite que le joueur puisse raisonnablement anticiper la nature du risque.

Vérifie si les options permettent de comprendre :

- qui on peut gagner ;
- qui on peut perdre ;
- quel type de risque on prend ;
- si le risque est immédiat ou différé.

Évite d’exiger que le jeu révèle les probabilités exactes.

Analyse les labels tels que :

- risqué ;
- offensif ;
- technique ;
- institutionnel ;
- populaire ;
- clivant ;
- etc.

Vérifie qu’ils fournissent une information utile.

Signale :

- risque complètement opaque ;
- conséquence impossible à anticiper ;
- punition arbitraire ;
- choix dont le texte promet une chose mais le moteur fait autre chose.

---

# 15. AUDIT DU PLAISIR DE GAGNER

Analyse des parties gagnées.

Sélectionne :

- victoire facile ;
- victoire serrée ;
- remontée spectaculaire ;
- qualification surprise ;
- victoire après mauvaise première moitié ;
- victoire dominante.

Pour chacune :

- la victoire semble-t-elle méritée ?
- existe-t-il un climax ?
- le second tour apporte-t-il quelque chose ?
- le résumé final valorise-t-il le parcours ?
- les décisions importantes sont-elles rappelées ?
- le joueur peut-il comprendre ce qu’il a bien fait ?

Identifie les victoires qui semblent :

- automatiques ;
- aléatoires ;
- méritées ;
- mémorables.

---

# 16. AUDIT DU PLAISIR DE PERDRE

Une bonne simulation ne doit pas rendre toutes les défaites désagréables.

Analyse :

- élimination serrée ;
- effondrement ;
- campagne outsider honorable ;
- perte au second tour ;
- défaite après retournement ;
- campagne catastrophique.

Pose la question :

> Est-ce que cette partie donne envie d’en relancer une immédiatement ?

Les défaites problématiques sont :

- inexplicables ;
- inévitables ;
- produites par un seul événement sans contre-jeu ;
- jouées d’avance ;
- trop longues une fois la défaite certaine.

Mesure le nombre de décisions jouées alors qu’une qualification est mathématiquement ou pratiquement presque impossible.

Détecte les « dead runs ».

---

# 17. AUDIT DES RETOURNEMENTS

Mesure les comeback.

Pour chaque partie :

- position minimale ;
- position maximale ;
- plus forte chute ;
- plus forte remontée ;
- changement de qualification ;
- victoire après position défavorable ;
- défaite après forte avance.

Calcule :

- % de campagnes avec au moins un vrai retournement ;
- % avec plusieurs ;
- % sans aucun retournement significatif.

Un jeu où tout est décidé dès les premiers événements manque de tension.

Un jeu où le classement change constamment sans logique manque de crédibilité.

Cherche le bon équilibre.

---

# 18. AUDIT DES « STORIES WORTH TELLING »

Crée un indicateur de narrativité.

Une partie est considérée comme potentiellement mémorable si elle contient plusieurs éléments parmi :

- comeback ;
- rivalité ;
- crise interne ;
- événement rare ;
- alliance inattendue ;
- revirement ;
- trahison/dissidence fictive ;
- remplacement d’adversaire ;
- conséquence différée ;
- choix passé rappelé ;
- second tour serré ;
- victoire outsider ;
- effondrement favori.

Calcule :

```text
% de parties ayant au moins 1 élément mémorable
% ayant au moins 2
% ayant au moins 3
```

Sélectionne les 20 meilleures chronologies.

Résume-les en quelques lignes.

Pose ensuite la question :

> Ces parties ressemblent-elles réellement à des histoires différentes ?

---

# 19. AUDIT DE L’HUMOUR ET DE L’ABSURDE

Le jeu peut comporter de rares événements absurdes.

Analyse :

- fréquence ;
- timing ;
- ton ;
- contraste avec le reste ;
- impact.

Ils doivent rester rares.

Un événement absurde peut être excellent s’il devient une anecdote exceptionnelle.

Il devient nuisible s’il :

- casse régulièrement l’immersion ;
- apparaît trop souvent ;
- décide l’élection ;
- transforme le jeu sérieux en parodie permanente.

Classe leur contribution :

- excellente respiration ;
- amusant ;
- neutre ;
- cassant ;
- trop fréquent.

---

# 20. AUDIT DE L’IMMERSION POLITIQUE

Analyse si le joueur a réellement l’impression de mener une campagne présidentielle.

Cherche :

- gestion médiatique ;
- adversaires ;
- militantisme ;
- électorat ;
- programme ;
- alliances ;
- débats ;
- crises ;
- cohérence idéologique ;
- sondages ;
- territoires ;
- second tour.

Puis pose :

> Si on remplaçait les noms politiques par des équipes fictives, est-ce que les mécaniques resteraient presque exactement les mêmes ?

Si oui, l’identité politique est probablement trop superficielle.

Identifie les moments où le jeu exploite réellement son thème.

---

# 21. AUDIT DU SECOND TOUR COMME NOUVEL ACTE

Le second tour ne doit pas seulement être :

```text
mêmes événements
+ deux candidats
```

Analyse :

- nouvelles décisions ;
- nouvelles alliances ;
- consignes ;
- reports ;
- électeurs à convaincre ;
- rejet ;
- attaques ;
- rassemblement ;
- présidentialisation.

Mesure la proportion de contenu réellement spécifique au second tour.

Évalue le fun du second tour séparément.

---

# 22. AUDIT DE LA DURÉE

Mesure :

- nombre de décisions ;
- nombre de clics ;
- longueur moyenne des textes ;
- temps de lecture estimé ;
- animations ;
- écrans intermédiaires.

Estime la durée réelle :

- joueur rapide ;
- joueur normal ;
- joueur qui lit tout.

Compare à l’objectif 10–15 minutes.

Détecte :

- passages trop longs ;
- séries de cartes faibles ;
- écrans inutiles ;
- fin trop rapide ;
- second tour trop court.

---

# 23. PLAYTESTS BROWSER RÉELS

Utilise Playwright ou l’outil E2E existant pour effectuer des parties complètes dans l’interface.

Ne te contente pas du moteur headless.

Teste au minimum :

- desktop ;
- viewport mobile.

Sélectionne :

- un parti favori ;
- un parti intermédiaire ;
- un outsider ;
- gauche ;
- centre ;
- droite ;
- parti personnalisé.

Pendant ces playtests, note :

- friction ;
- rythme ;
- lisibilité ;
- densité ;
- fatigue ;
- répétition visuelle ;
- clarté des choix ;
- plaisir des conséquences ;
- tension des sondages ;
- effet des animations ;
- satisfaction de la fin.

Prends quelques captures pertinentes.

---

# 24. PANEL DE « JOUEURS SYNTHÉTIQUES »

Crée plusieurs profils de playtest.

Ils ne doivent pas seulement optimiser le résultat.

### Le stratège

Cherche à gagner.

### Le roleplayer

Reste cohérent idéologiquement.

### L’opportuniste

Change de position pour gagner.

### Le chaos player

Prend les décisions les plus provocatrices.

### Le prudent

Évite les risques.

### Le joueur narratif

Cherche les choix susceptibles de créer une histoire intéressante.

### Le débutant

Choisit surtout selon le texte visible sans comprendre les statistiques cachées.

Analyse :

- score ;
- fun potentiel ;
- variété ;
- trajectoires ;
- fréquence des moments mémorables.

Un jeu riche doit produire des campagnes intéressantes sous plusieurs styles.

---

# 25. TEST DE LA STRATÉGIE « FUN MAIS MAUVAISE »

Vérifie s’il est possible de choisir volontairement des options :

- amusantes ;
- provocatrices ;
- audacieuses ;
- atypiques ;

sans être systématiquement puni.

Le joueur doit pouvoir parfois accepter un risque pour créer une histoire.

Si toutes les options originales sont mécaniquement mauvaises, le jeu pousse vers une stratégie ennuyeuse.

Si toutes sont meilleures, le chaos devient optimal.

Cherche cet équilibre.

---

# 26. EXPÉRIENCES A/B SPÉCIFIQUES

Dans des harnais temporaires uniquement, compare :

### A. Jeu complet
vs
### B. Sans événements rares

### A. Jeu complet
vs
### C. Sans mémoire narrative

### A. Jeu complet
vs
### D. Sans actions adverses autonomes

### A. Jeu complet
vs
### E. Sans effets idéologiques

### A. Jeu complet
vs
### F. Sans conséquences différées

Le but est de mesurer :

> Quels systèmes contribuent réellement à rendre les parties différentes et intéressantes ?

Si supprimer un système change très peu les trajectoires, son existence technique n’est peut-être pas synonyme de valeur ludique.

---

# 27. SCORE DE FUN MULTIDIMENSIONNEL

Construis un score expérimental.

Ne prétends pas qu’il mesure objectivement le plaisir humain.

Utilise-le comme outil comparatif.

Par exemple :

```text
FUN SCORE /100

20 — qualité des dilemmes
15 — tension
15 — variété intra-partie
15 — rejouabilité
10 — narrativité
10 — identité du parti
5 — surprise
5 — satisfaction des résultats
5 — rythme
```

Tu peux ajuster la pondération si tu la justifies.

Calcule :

- score global ;
- score par parti ;
- score par phase ;
- score par type d’événement.

Ajoute une note de confiance.

---

# 28. AUDIT MANUEL OBLIGATOIRE

Les métriques ne suffisent pas.

Lis manuellement au moins :

- 50 événements aléatoires ;
- tous les événements rares ;
- 30 événements spécifiques à des partis ;
- 20 chaînes narratives complètes ;
- 20 événements de fin de campagne ;
- tout le contenu spécifique au second tour.

Pour chaque groupe, donne un avis qualitatif.

Ne confonds pas :

- unique ;
- original ;
- amusant.

---

# 29. CHRONOLOGIES COMPLÈTES

Génère au minimum 60 chronologies lisibles :

- 10 parties aléatoires ;
- 10 parties très serrées ;
- 10 victoires ;
- 10 défaites ;
- 5 outsiders performants ;
- 5 favoris en difficulté ;
- 5 parties riches en événements rares ;
- 5 parties volontairement chaotiques.

Puis sélectionne :

### TOP 10 parties les plus amusantes

Explique pourquoi.

### BOTTOM 10 parties les plus ennuyeuses

Explique pourquoi.

Cherche les motifs récurrents.

---

# 30. MESURES DE LASSITUDE

Détecte les séquences de faible intensité.

Définis une « carte faible » selon plusieurs critères :

- faible impact ;
- aucun lien avec l’historique ;
- aucune interaction ;
- choix mécaniquement proche ;
- faible enjeu narratif.

Calcule :

- nombre moyen de cartes faibles consécutives ;
- maximum ;
- probabilité de 3 faibles d’affilée ;
- probabilité de 5 faibles d’affilée.

Les longues séquences faibles sont probablement plus nuisibles que quelques événements faibles isolés.

---

# 31. ÉVALUER LE SENTIMENT D’AGENCE SANS REFAIRE L’AUDIT STATISTIQUE

L’audit précédent a déjà mesuré causalement l’agence.

Ici, mesure l’agence perçue.

Pose pour chaque chronologie :

- peut-on identifier les décisions qui ont changé la campagne ?
- ces décisions sont-elles racontées ?
- les conséquences apparaissent-elles assez vite ?
- les conséquences différées sont-elles reliées au choix initial ?
- le joueur peut-il comprendre après coup pourquoi la trajectoire a changé ?

Une mécanique peut être causalement importante mais ludquement invisible.

Signale ce cas.

---

# 32. CRITÈRES DE VERDICT

Attribue à chaque domaine :

- EXCELLENT ;
- BON ;
- CORRECT ;
- FAIBLE ;
- PROBLÉMATIQUE ;
- TRÈS PROBLÉMATIQUE.

Domaines obligatoires :

1. Fun global
2. Fun des choix
3. Fun des événements aléatoires
4. Fun des événements rares
5. Tension
6. Rythme
7. Rejouabilité
8. Variété entre partis
9. Fun avec les favoris
10. Fun avec les outsiders
11. Narrativité
12. Immersion politique
13. Second tour
14. Défaites
15. Victoires
16. Hasard
17. Frustration
18. Interface
19. Durée
20. Potentiel à long terme

---

# 33. RAPPORT FINAL

Crée à la racine :

```text
AUDIT_FUN_REJOUABILITE.md
```

Structure obligatoire :

## 1. Verdict exécutif

Répond immédiatement :

> Est-ce que le jeu est amusant aujourd’hui ?

Puis :

> Est-ce qu’on peut réellement s’amuser avec n’importe quel parti ?

Puis :

> Les événements aléatoires améliorent-ils réellement la partie ?

Puis :

> Est-ce que le jeu donne envie de recommencer ?

## 2. Méthodologie

## 3. Limites

## 4. Fun global

## 5. Rythme

## 6. Tension

## 7. Choix

## 8. Événements aléatoires

## 9. Événements rares

## 10. Rejouabilité

## 11. Analyse parti par parti

## 12. Similarité entre partis

## 13. Favoris vs outsiders

## 14. Narrativité

## 15. Immersion politique

## 16. Hasard et frustration

## 17. Comebacks

## 18. Victoires

## 19. Défaites

## 20. Second tour

## 21. Durée

## 22. UI/UX

## 23. Top événements

## 24. Événements faibles

## 25. Top 10 parties

## 26. Bottom 10 parties

## 27. Score de fun par parti

## 28. Problèmes prioritaires

## 29. Recommandations

## 30. Verdict final

---

# 34. TABLEAU DE SYNTHÈSE OBLIGATOIRE

Au début du rapport :

| Domaine | Score /10 | Verdict | Confiance | Principal constat |
|---|---:|---|---|---|
| Fun global | | | | |
| Choix | | | | |
| Événements aléatoires | | | | |
| Événements rares | | | | |
| Rythme | | | | |
| Tension | | | | |
| Rejouabilité | | | | |
| Variété entre partis | | | | |
| Favoris | | | | |
| Outsiders | | | | |
| Narrativité | | | | |
| Immersion | | | | |
| Second tour | | | | |
| Défaites | | | | |

---

# 35. TABLEAU PAR PARTI

Obligatoire :

| Parti | Fun | Identité | Rejouabilité | Agence | Tension | Variété stratégique | Victoire satisfaisante | Défaite intéressante |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| ... | | | | | | | | |

Ajoute ensuite un commentaire individuel pour chaque parti.

---

# 36. LIVRABLES DE DONNÉES

Crée selon pertinence :

```text
audit-results/fun-audit/
  summary.json
  party-fun.csv
  event-fun.csv
  random-event-value.csv
  rare-event-value.csv
  pacing.csv
  tension.csv
  comeback.csv
  replayability.csv
  party-similarity.csv
  choice-dominance.csv
  low-intensity-streaks.csv
  narrative-density.csv
  second-round-fun.csv
  run-summaries.csv
  selected-timelines/
  screenshots/
  charts/
  README.md
```

---

# 37. GRAPHIQUES

Produis des graphiques réellement utiles :

1. fun score par parti ;
2. tension moyenne au fil de la campagne ;
3. intensité des événements au fil de la campagne ;
4. fréquence des retournements ;
5. contenu nouveau selon le nombre de parties ;
6. proportion d’événements aléatoires utiles/neutres/frustrants ;
7. score de narrativité ;
8. similarité entre partis ;
9. fun favoris vs outsiders ;
10. cartes faibles consécutives ;
11. fun du premier tour vs second tour ;
12. impact A/B des systèmes narratifs.

---

# 38. RECOMMANDATIONS

À la fin, classe les problèmes :

### P0
Rend le jeu injouable ou fondamentalement non amusant.

### P1
Cause importante d’ennui, frustration ou absence d’agence.

### P2
Réduit fortement la rejouabilité.

### P3
Amélioration notable.

### P4
Polish.

Pour chaque recommandation :

- problème ;
- preuve ;
- impact joueur ;
- cause probable ;
- système concerné ;
- correction recommandée ;
- difficulté ;
- risque ;
- test d’acceptation.

Ne réalise aucune correction pendant cet audit.

---

# 39. QUESTIONS AUXQUELLES LE VERDICT FINAL DOIT RÉPONDRE SANS AMBIGUÏTÉ

Termine le rapport par des réponses directes :

1. Est-ce que tu recommanderais aujourd’hui le jeu à quelqu’un qui aime la politique ?
2. Est-ce qu’une première partie est amusante ?
3. Est-ce qu’une dixième partie est encore amusante ?
4. Est-ce que les événements aléatoires améliorent réellement le jeu ?
5. Est-ce que les événements rares sont suffisamment mémorables ?
6. Est-ce que les décisions provoquent de vrais dilemmes ?
7. Est-ce que le jeu produit des histoires racontables ?
8. Peut-on s’amuser avec tous les partis ?
9. Quel est le parti le plus amusant ?
10. Quel est le parti le moins amusant ?
11. Quel est le parti le plus rejouable ?
12. Quel parti a le plus besoin de contenu supplémentaire ?
13. Les favoris sont-ils trop faciles ?
14. Les outsiders sont-ils trop frustrants ?
15. Le hasard est-il excitant ou agaçant ?
16. Les défaites sont-elles intéressantes ?
17. Le second tour est-il un vrai nouvel acte ?
18. Le jeu est-il trop long, trop court ou bien rythmé ?
19. Quel système contribue le plus au fun ?
20. Quel système apporte étonnamment peu au fun ?
21. Quels sont les 5 changements qui augmenteraient le plus le plaisir de jeu ?

---

# 40. RÈGLE D’HONNÊTETÉ

Ne cherche pas à valider le projet.

Cherche à déterminer s’il est réellement amusant.

Si le jeu est techniquement impressionnant mais ennuyeux, dis-le.

Si certains partis sont mauvais à jouer, dis-le.

Si les événements rares sont gadgets, dis-le.

Si le hasard apporte peu, dis-le.

Si certains systèmes très complexes ne produisent presque aucun plaisir supplémentaire, dis-le.

Inversement, si un système simple crée beaucoup de fun, signale-le.

Ne transforme jamais :

```text
beaucoup de contenu
```

en :

```text
beaucoup de fun
```

sans preuve.

---

# 41. FIN DE MISSION

À la fin :

1. réexécute tous les tests ;
2. vérifie le build ;
3. vérifie que l’audit n’a pas modifié les règles du jeu ;
4. vérifie `git diff` ;
5. conserve uniquement l’outillage et les résultats d’audit ;
6. ne pousse rien vers le distant ;
7. affiche dans le terminal un résumé très clair.

Format :

```text
AUDIT FUN — VERDICT

Fun global : X/10
Rejouabilité : X/10
Événements aléatoires : X/10
Événements rares : X/10
Tension : X/10
Immersion politique : X/10
Variété entre partis : X/10

Peut-on s’amuser avec tous les partis ?
OUI / PLUTÔT OUI / MITIGÉ / PLUTÔT NON / NON

Le hasard améliore-t-il réellement le jeu ?
OUI / PARTIELLEMENT / NON

Le jeu donne-t-il envie de relancer une partie ?
OUI / PARTIELLEMENT / NON

Parti le plus amusant :
Parti le moins amusant :
Plus gros problème :
Plus grosse réussite :
Priorité P1 :
```

Commence immédiatement.

Ne t’arrête pas après avoir proposé une méthodologie.

Exécute réellement l’audit complet.
