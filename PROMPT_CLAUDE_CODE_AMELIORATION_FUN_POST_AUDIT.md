# PROMPT MAÎTRE — AMÉLIORATION DU FUN, DE LA REJOUABILITÉ ET DE L’IDENTITÉ DES PARTIS
## Projet : « Vers l’Élysée »

Tu interviens comme **lead game designer**, **gameplay programmer senior TypeScript**, **narrative systems designer**, **analyste de simulations probabilistes**, **UX designer** et **responsable qualité**.

Le projet est un jeu de simulation de campagne présidentielle française. Le joueur choisit ou crée un parti, traverse environ un an de campagne événement par événement, prend des décisions, subit des crises, interagit avec des adversaires autonomes et tente de se qualifier puis de gagner l’élection.

Cette mission intervient APRÈS plusieurs audits techniques et après un audit spécifique du fun/rejouabilité.

Ta mission est maintenant de **corriger les problèmes réellement observés dans `AUDIT_FUN_REJOUABILITE.md` et d’implémenter les améliorations proposées**, sans dégrader les acquis techniques et narratifs déjà validés.

Tu dois travailler directement dans le dépôt, modifier réellement le code et le contenu, exécuter les tests et simulations, comparer avant/après et poursuivre jusqu’à obtenir une version validée.

Ne t’arrête pas à un plan. Ne pousse rien vers le dépôt distant.

---

# 1. DOCUMENTS À LIRE AVANT TOUTE MODIFICATION

Commence par lire intégralement tous les fichiers disponibles parmi :

- `AUDIT_FUN_REJOUABILITE.md`
- `AUDIT_POST_CORRECTIONS.md`
- `POST_AUDIT_FIXES.md`
- `GAMEPLAY_AUDIT.md`
- `V2_DECISIONS.md`
- `V2_CHANGELOG.md`
- `audit-results/fun-audit/README.md`
- `audit-results/fun-audit/summary.json`
- `audit-results/fun-audit/party-fun.csv`
- `audit-results/fun-audit/event-fun.csv`
- `audit-results/fun-audit/random-event-value.csv`
- `audit-results/fun-audit/rare-event-value.csv`
- `audit-results/fun-audit/pacing.csv`
- `audit-results/fun-audit/tension.csv`
- `audit-results/fun-audit/comeback.csv`
- `audit-results/fun-audit/replayability.csv`
- `audit-results/fun-audit/party-similarity.csv`
- `audit-results/fun-audit/choice-dominance.csv`
- `audit-results/fun-audit/low-intensity-streaks.csv`
- `audit-results/fun-audit/narrative-density.csv`
- `audit-results/fun-audit/second-round-fun.csv`
- les chronologies `audit-results/fun-audit/selected-timelines/`
- les graphiques du fun audit
- les fichiers de données des partis et événements
- le moteur électoral, le moteur d’événements et le moteur d’adversaires
- les tests unitaires, d’intégration et Playwright.

Inspecte aussi l’historique Git récent.

Avant de modifier quoi que ce soit, note : branche, commit, `git status`, Node/npm, fichiers non suivis/modifiés et commandes de validation disponibles.

---

# 2. CE QUE L’AUDIT A VALIDÉ — À PRÉSERVER ABSOLUMENT

Le jeu n’est PAS globalement ennuyeux. Les améliorations précédentes ont produit plusieurs acquis importants :

- les chaînes narratives avec mémoire d’acteur sont le meilleur contenu du jeu ;
- 99,8 % des campagnes ont au moins un signal narratif mémorable ;
- 81,7 % en cumulent au moins trois ;
- le rythme global monte correctement en intensité ;
- le second tour est un vrai acte distinct et plus intense que le premier tour ;
- les défaites sont bien mises en scène et restent jouables ;
- la majorité écrasante des choix constituent de vrais dilemmes ;
- les répétitions historiques ont déjà été corrigées ;
- le moteur est déterministe et auditable ;
- la narration émergente existe réellement.

Principe directeur :

> **Le meilleur système du jeu est déjà identifié : décision → mémoire → conséquence ultérieure → nouvel arbitrage. Toute amélioration du fun doit prioritairement exploiter ce patron.**

---

# 3. P1 — HORIZONS EST STRUCTURELLEMENT TROP FACILE ET DONC SOUVENT TROP PLAT

Baseline du fun audit :

- qualification : environ `85,6 %` ;
- victoire conditionnelle à qualification : environ `88,3 %` ;
- fun composite : `44,3/100`, plus faible du jeu ;
- agence : `2,0/10`, plus faible du jeu ;
- profondeur : très faible ;
- 5 des 10 parties les moins amusantes du corpus concernent Horizons ;
- certaines campagnes restent rang 1 du début à la fin.

Le problème n’est PAS que le parti est fort. Le problème est :

> **faible risque de qualification + très forte probabilité de victoire + contenu interne peu menaçant = peu de suspense et peu de décisions perçues comme décisives.**

## Objectif

Horizons doit rester un parti crédible, structuré et relativement fort, mais jouer Horizons doit demander de **transformer un capital institutionnel en dynamique présidentielle**.

Il doit être possible de :

- mal lancer sa campagne ;
- perdre son statut de favori ;
- provoquer une guerre de succession ;
- souffrir d’une image technocratique ou d’un manque de différenciation ;
- échouer à élargir son électorat ;
- être rattrapé par Renaissance/LR/Nouvelle Énergie selon la partie ;
- remonter par une stratégie réussie.

## Méthode recommandée

Ne commence PAS par un simple nerf de statistiques.

Diagnostique d’abord : stats initiales, potentiel de soutien, rejet, transferts, médias, cohésion, événements spécifiques et second tour.

Puis combine si nécessaire :

1. léger rééquilibrage statistique ;
2. contenu spécifique plus conflictuel ;
3. davantage de conséquences différées ;
4. au moins une vraie vulnérabilité structurelle ;
5. plusieurs trajectoires possibles.

## Arcs Horizons à créer ou renforcer

### A. « Être candidat ou rester héritier ? »
Tension entre attendre, s’émanciper, provoquer une clarification et négocier avec le bloc central.

### B. « Réseau d’élus vs dynamique populaire »
Le parti possède des élus et de la crédibilité gouvernementale, mais peut manquer de militants, de ferveur et de notoriété populaire.

### C. « Cannibalisation du centre »
Décisions autour de Renaissance, Nouvelle Énergie, LR modéré et de l’électorat central volatil.

### D. « Favori sans passion »
Une campagne trop prudente peut préserver la crédibilité mais faire baisser momentum/mobilisation. Une campagne plus audacieuse peut gagner en dynamique mais augmenter rejet, divisions ou risques.

## Critères P1

Après modification :

- réduire nettement la proportion de runs Horizons où le joueur reste rang 1 presque toute la campagne ;
- augmenter la variance entre styles de jeu ;
- augmenter les retournements et la densité narrative ;
- rapprocher le fun d’Horizons de la médiane du jeu ;
- ne pas transformer Horizons en outsider artificiel ;
- ne pas nerfer directement le parti uniquement pour atteindre un chiffre.

---

# 4. P2 — LES ÉVÉNEMENTS RARES SONT MÉMORABLES MAIS PAS « EXCEPTIONNELS »

Le fun audit établit :

- les événements rares ont un bon ton ;
- environ 9 événements rares rencontrés sur 12 sont jugés mémorables ;
- aucun des 9 `rare_*` génériques n’ouvre de chaîne narrative ;
- le mécanisme de chaîne produit pourtant tous les meilleurs événements du jeu.

## Objectif

Faire en sorte qu’un événement rare puisse parfois devenir :

> **« Tu te souviens de la partie où X est arrivé, puis trois décisions plus tard Y s’est produit à cause de ce que j’avais choisi ? »**

Il ne faut PAS transformer tous les événements rares en longues chaînes.

Les one-shots absurdes ou respirations comiques peuvent rester ponctuels.

## Travail demandé

Lire intégralement `rare.ts`.

Classer chaque événement rare en :

- one-shot volontaire ;
- candidat à chaîne sérieuse ;
- candidat à mini-chaîne ;
- à conserver tel quel.

Sélectionner environ **3 à 5 événements rares** adaptés aux chaînes, priorité aux événements rares sérieux/institutionnels.

Créer pour chacun une structure de type :

```text
RARE INITIAL
→ décision forte
→ mémoire/flag
→ délai
→ follow-up conditionnel
→ nouvelle décision
→ conséquence durable ou nouvel embranchement
```

Prévoir :

- au moins une chaîne qui peut s’éteindre ;
- au moins une chaîne avec deux follow-ups possibles ;
- au moins une chaîne dont l’effet dépend d’une décision passée ;
- au moins une chaîne qui affecte un adversaire ou une alliance.

Les follow-ups ne doivent pas forcément être garantis.

## Contraintes

- garder les événements rares réellement rares ;
- ne pas multiplier artificiellement leur fréquence ;
- ne pas faire d’un événement absurde un facteur électoral décisif ;
- éviter les arcs qui durent toute la partie ;
- utiliser l’infrastructure `chain` existante.

## Critères

- plusieurs événements rares génériques produisent des chaînes ;
- au moins 1-2 sont classés « exceptionnel » par l’audit recalculé ;
- les chaînes rares sont observées en simulation ;
- pas de hausse excessive du taux de rareté total ;
- pas de répétitions ni de dead chains.

---

# 5. P2 — LE HASARD CHANGE LA PARTIE PLUS QU’IL NE L’ENRICHIT

Baseline : parmi 24 événements `world`/`scandal`, 8 intéressants, 10 neutres et 6 frustrants.

Les événements explicitement signalés incluent :

- `world_national_strike`
- `world_economic_slowdown`
- `world_heatwave`
- `scandal_campaign_data`
- `world_international_crisis`
- `world_security_attack`

Le dernier dispose d’un échantillon très faible : ne le modifie pas automatiquement sans nouvelle vérification.

## Objectif

Transformer le hasard de :

> « une pénalité ou un bonus qui tombe »

en :

> « un contexte imprévu auquel je dois politiquement réagir ».

## Pour chaque événement problématique

Analyser :

- pourquoi il est frustrant ;
- si une option domine ;
- si les conséquences sont trop plates ;
- si l’impact est disproportionné ;
- s’il ignore les décisions précédentes ;
- s’il pourrait utiliser une mémoire, une position idéologique ou un adversaire.

Pattern souhaité :

```text
CRISE
→ ancienne position cohérente : option spécifique disponible

ou

CRISE
→ ancienne promesse incompatible : coût de contradiction

ou

CRISE
→ adversaire déjà positionné : confrontation / triangulation / accord
```

## Réviser les événements neutres

Ne transforme pas tous les événements neutres en crises majeures. Les cartes de respiration ont une fonction utile.

Pour les 10 événements neutres :

- identifier les bons « breathers » ;
- les conserver ;
- enrichir les autres par un contexte ou un petit embranchement.

## Critères

- réduire le nombre d’événements clairement frustrants ;
- augmenter le ratio « intéressant » ;
- conserver quelques événements modérés ;
- ne pas augmenter artificiellement l’amplitude moyenne de sondage ;
- rendre le hasard plus contextuel que punitif.

---

# 6. P3 — LA REJOUABILITÉ S’ÉRODE TROP VITE SUR UN MÊME PARTI

Baseline :

- partie 1 : 100 % nouveau ;
- partie 2 : ~70 % ;
- partie 3 : ~56 % ;
- partie 5 : ~36 % ;
- partie 10 : ~9 % ;
- partie 20 : ~2 %.

La lassitude devient probable vers la 8e-10e partie du même parti.

## Objectif

Augmenter la rejouabilité structurelle sans doubler artificiellement les textes, créer des clones, rallonger les parties ou réintroduire des répétitions.

## Priorité : branches, pas volume brut

Privilégier :

1. événements conditionnels ;
2. chaînes alternatives ;
3. conséquences différées ;
4. branches selon idéologie ;
5. branches selon stratégie suivie ;
6. arcs mutuellement exclusifs ;
7. rivalités différentes selon adversaires ;
8. variantes de crise interne ;
9. objectifs spécifiques au contexte.

## Créer des « familles de campagne »

Le moteur doit permettre qu’un même parti puisse connaître des runs de type :

- campagne d’unité ;
- campagne de fronde ;
- campagne de percée médiatique ;
- campagne de crise ;
- campagne d’alliance ;
- campagne de recentrage ;
- campagne de radicalisation ;
- campagne de survie ;
- campagne de favori sous pression.

Ces familles ne doivent pas être explicitement choisies dans un menu. Elles doivent émerger du contenu et des décisions.

Utiliser flags, actor memory, idéologie, relations, momentum, cohésion, random seeds et adversaires pour débloquer des sous-pools mutuellement exclusifs.

## Critères

- déplacer significativement le point de lassitude ;
- augmenter la nouveauté de la 10e partie ;
- idéalement viser environ 15 % ou davantage de contenu structurel nouveau à la 10e partie, si cela peut être atteint sans baisser la qualité ;
- ne pas atteindre la cible via de simples reformulations textuelles ;
- mesurer aussi la diversité des histoires.

---

# 7. P3/P4 — LES PARTIS NE SONT PAS ASSEZ DIFFÉRENTS DANS LA STRUCTURE DE LEURS CHOIX

Constat : similarité des `choiceStrategy` entre partis entre `0,979` et `0,996`.

Le contenu politique change, mais la forme des décisions reste presque identique.

Les partis les plus proches incluent notamment PS, Renaissance, Écologistes et Horizons. Reconquête est nettement plus distinct.

## Objectif

Faire ressentir :

> « je ne gère pas seulement les mêmes cartes avec des positions différentes ; ce parti possède ses propres problèmes et ses propres leviers ».

## Construire une matrice d’identité de gameplay

Créer :

```text
PARTY_GAMEPLAY_IDENTITIES.md
```

Pour chaque parti, définir 3 à 5 axes spécifiques :

- tension centrale ;
- ressource forte ;
- faiblesse structurelle ;
- dilemme récurrent ;
- type de coalition ;
- risque interne ;
- électorat à conquérir ;
- comportement naturel de second tour ;
- mécanique narrative signature.

Les différences doivent être MÉCANIQUES autant que narratives.

Créer des choix dont la structure varie réellement : certains partis négocient, certains mobilisent, certains arbitrent des primaires, certains gèrent une coalition, certains affrontent des élus, certains doivent gagner en notoriété, certains doivent contenir le rejet, certains peuvent tenter une OPA électorale et certains risquent une dissidence.

---

# 8. PRIORITÉ PARTI — RENAISSANCE

Baseline :

- identité : `2,5/10`, plus basse du jeu ;
- narrativité moyenne inférieure aux meilleurs ;
- forte proximité avec PS/Horizons/Écologistes.

## Objectif

Faire de Renaissance une expérience immédiatement reconnaissable.

Ne te limite pas à « ajouter davantage d’événements Renaissance ».

Créer une vraie structure de campagne spécifique autour, selon ce que les données réelles confirment, de tensions telles que :

- héritage du pouvoir sortant ;
- nécessité de se distinguer sans renier ;
- réseaux d’anciens ministres/élus ;
- concurrence avec Horizons/Nouvelle Énergie ;
- électorat central volatil ;
- crédibilité institutionnelle vs fatigue du pouvoir ;
- alliances de second tour ;
- tensions continuité vs renouvellement.

Créer plusieurs arcs spécifiques.

Cible indicative :

- 6-10 nouveaux événements/branches réellement distinctifs ;
- 2-3 chaînes ;
- au moins une mécanique spécifique de relation ou mémoire.

Ne crée aucun scandale fictif attribué à une personnalité réelle.

---

# 9. PRIORITÉ PARTI — HORIZONS : CONTENU

Créer plusieurs versions possibles d’une campagne Horizons :

- favori institutionnel ;
- challenger du bloc central ;
- candidat trop prudent ;
- candidat ayant rompu avec ses alliés ;
- candidat qui tente une coalition élargie.

Éviter que toutes les campagnes Horizons racontent :

```text
gestion interne
→ maintien du rang 1
→ qualification
→ victoire
```

Ajouter notamment : conflits d’agenda, alliances conditionnelles, dilemmes de différenciation, réactions de partis voisins et conséquences d’une campagne trop prudente.

---

# 10. AMÉLIORATIONS SECONDAIRES PARTI PAR PARTI

Ne modifie pas tous les partis de manière égale. Utilise les sous-scores comme signaux, pas comme vérités absolues.

## Nouvelle Énergie

Préserver son excellente tension. Ajouter davantage de styles viables si cela augmente agence/variété stratégique sans la rendre confortable.

## Écologistes

Préserver forte agence et profondeur. Ne pas ajouter du contenu inutile. Étudier uniquement sa rejouabilité longue si les métriques le justifient.

## LR

Préserver forte tension. Ajouter surtout des branches alternatives pour améliorer profondeur/rejouabilité.

## Reconquête

Identité et rejouabilité fortes, mais tension faible car beaucoup de runs ne flirtent jamais avec le top 2.

Ne buffe pas simplement le score électoral.

Créer des **objectifs intermédiaires et tensions d’outsider** : dépasser un rival direct, seuil symbolique, imposer un thème, devenir faiseur de voix, négocier une fusion, survivre à une fronde, préparer le second tour même sans qualification.

Le joueur doit avoir quelque chose à perdre ou gagner même s’il n’est pas top 2.

## LFI

Globalement solide. Préserver agence, narrativité et campagnes contrastées.

## PS

Identité/rejouabilité faibles mais défaites intéressantes. Enrichir des tensions propres au parti si cela réduit la proximité avec Renaissance/Écologistes.

## RN

Ne pas traiter comme Horizons. Préserver le profil : qualification souvent attendue, second tour réellement incertain. Améliorer si nécessaire la satisfaction de victoire via narration/climax plutôt qu’en buffant mécaniquement la victoire.

---

# 11. P3 — PROFIL DE TENSION INVERSÉ

Constat : beaucoup de changements de rang au début, beaucoup moins à la fin alors que l’enjeu perçu augmente.

Ne transforme pas la fin de campagne en roulette.

## Diagnostic obligatoire

Déterminer combien vient de : proximité statistique initiale, bruit de sondage, affichage du classement, événements, sélection, rythme des effets et second tour.

## Approche préférée

Avant de modifier le moteur électoral :

1. réduire la surinterprétation visuelle des micro-mouvements précoces ;
2. mieux mettre en scène les écarts avec la barre de qualification ;
3. afficher tendance/momentum plutôt que seulement rang brut ;
4. renforcer les événements à enjeu du dernier tiers ;
5. créer davantage de conséquences différées qui se résolvent en fin de campagne.

Options UX possibles :

- bandeau « à portée du second tour » ;
- écart au deuxième ;
- tendance sur plusieurs sondages ;
- incertitude qualitative ;
- événement de climax conditionné à une course serrée.

## Critères

- ne pas augmenter artificiellement le chaos électoral ;
- améliorer la tension perçue du dernier tiers ;
- conserver la croissance d’intensité déjà validée.

---

# 12. P3 — CORRIGER LES FUITES DE LIBELLÉS TECHNIQUES

Bug observé :

```text
Contexte climateConcern modifié
```

Ne corrige pas seulement `climateConcern`.

Faire un audit automatique de toutes les valeurs internes susceptibles d’être visibles : context keys, effect types, flags, actor memory types, stats, ideology keys et relation keys.

Créer un mapping humain en français et un fallback qui n’expose jamais une clé camelCase brute.

Ajouter des tests de rendu.

---

# 13. CHOIX DOMINANTS À RÉVISER

Cas signalés :

- `debate_frontrunner_retaliation`
- `party_ps_runoff`
- `party_ecologistes_runoff`

`debate_frontrunner_retaliation` est narrativement excellent : ne le simplifie pas ou ne le supprime pas.

Rééquilibre les options pour que plusieurs réponses soient contextuellement valides via coûts différents, relations, cohérence, long terme, coalition, élargissement ou second tour.

Pour les choix de coalition, le dilemme peut être :

```text
accord avantageux électoralement
vs
coût programmatique
vs
indépendance plus risquée mais cohérente
```

Réduire la dominance sans détruire la logique politique.

---

# 14. ÉVÉNEMENTS FAIBLES — NE PAS CONFONDRE RESPIRATION ET ENNUI

Événements signalés notamment :

- `internal_local_sections`
- `media_front_page`
- `internal_headquarters_move`
- `campaign_peripheral_town`

Ne supprime pas automatiquement ces cartes.

Pour chacun, décider explicitement :

- breather volontaire à conserver ;
- événement à enrichir ;
- événement à fusionner ;
- événement à remplacer.

Un bon breather peut donner du monde, renforcer un personnage, poser un futur conflit, donner une petite récompense qualitative ou offrir un choix de style sans bouleverser les sondages.

---

# 15. AMPLIFIER LE SYSTÈME LE PLUS FUN — LES CHAÎNES NARRATIVES

Tous les meilleurs événements notés S sont des maillons de chaîne.

Augmenter la densité de chaînes de manière contrôlée.

Créer une « narrative chain budget » : plusieurs fils potentiels par partie, environ 1 à 3 arcs effectivement résolus, rares parties plus riches, jamais une avalanche de follow-ups.

Nouvelles familles possibles :

- promesse → contradiction future ;
- attaque → riposte ;
- alliance → exigence ;
- transfuge → problème de loyauté ;
- fronde → vote ;
- sondage → repositionnement ;
- débat → clip viral → réponse ;
- déclaration → rappel médiatique ;
- événement mondial → test de cohérence.

Chaque chaîne doit avoir une raison politique. Les décisions précédentes doivent réellement modifier le follow-up.

---

# 16. REJOUABILITÉ PAR MUTUAL EXCLUSION

Pour éviter de gonfler le catalogue inutilement, créer des arcs mutuellement exclusifs.

Exemple abstrait :

```text
si stratégie de rupture → pool A
si stratégie de coalition → pool B
si cohésion faible → pool C
si notoriété faible → pool D
```

Cela permet à peu d’événements de produire davantage de diversité qu’un gros pool générique.

Créer des tests qui vérifient qu’une run ne voit pas deux arcs contradictoires, que les arcs sont atteignables et que plusieurs familles apparaissent réellement sur un corpus.

---

# 17. ÉVITER LA SUR-CORRECTION

Ne cherche PAS à faire monter artificiellement tous les partis à 70/100 de fun.

Le score de fun est un outil comparatif.

Un jeu intéressant peut avoir des partis plus difficiles, des styles différents, des parties plus calmes et des événements de respiration.

La cible est :

> **réduire les expériences réellement plates ou interchangeables et augmenter la proportion d’histoires distinctes.**

---

# 18. RÈGLES DE CONTENU POLITIQUE

Pour tout contenu nouveau :

- utiliser les partis réels uniquement comme contexte politique ;
- utiliser des candidats/cadres fictifs pour les arcs inventés ;
- ne pas inventer de scandale criminel, sexuel, financier ou judiciaire attribué à une vraie personne ;
- ne pas inventer de secret personnel sur une personnalité réelle ;
- ne pas écrire de contenu de persuasion politique réelle ciblant des groupes démographiques ;
- rester dans une simulation neutre et satirique ;
- conserver le disclaimer fictionnel du jeu.

---

# 19. BASELINE AVANT MODIFICATION

Avant toute correction, exécuter :

```bash
npm run format:check
npm run lint
npm run typecheck
npm run data:validate
npm run test
npm run build
npm run audit:fun
```

et les autres audits de non-régression disponibles.

Sauvegarder les résultats dans :

```text
audit-results/fun-improvement/baseline/
```

Inclure commit, paramètres, seeds, party-fun, replayability, narrative-density, choice-dominance, random-event-value, rare-event-value, party-similarity, comeback, tension et résultats électoraux.

---

# 20. PHASAGE D’IMPLÉMENTATION

Travaille dans cet ordre :

## Phase A
Instrumentation et baseline.

## Phase B
Horizons : diagnostic, contenu, équilibrage si nécessaire, simulations.

## Phase C
Événements rares : sélection, chaînes, tests.

## Phase D
World/scandal : événements frustrants, neutres à enrichir, tests.

## Phase E
Identité des partis : `PARTY_GAMEPLAY_IDENTITIES.md`, Renaissance, Horizons, ajustements ciblés ailleurs.

## Phase F
Rejouabilité : arcs mutuellement exclusifs, branches conditionnelles, contenu additionnel ciblé.

## Phase G
Tension : présentation, événements de dernier tiers, effets différés.

## Phase H
Choix dominants et événements faibles.

## Phase I
Bug de libellés techniques et polish.

## Phase J
Audit complet post-amélioration.

Après chaque phase : tests, simulation ciblée, comparaison, commit local atomique. Ne pousse rien.

---

# 21. TESTS À AJOUTER

Ajouter des tests automatisés pour :

### Narration
- follow-up atteignable ;
- follow-up conditionnel ;
- chaînes sans cible cassée ;
- mémoire correcte ;
- branche exclusive.

### Rares
- rare initial n’augmente pas de fréquence accidentellement ;
- follow-up rare non requalifié comme tirage rare indépendant ;
- pas de chaîne infinie.

### Partis
- événements spécifiques accessibles ;
- flags correctement scoped ;
- aucun événement Horizons/Renaissance inaccessible.

### UI
- aucune clé technique brute affichée ;
- labels français ;
- pas de camelCase visible.

### Équilibrage
- déterminisme ;
- aucun NaN ;
- aucune statistique hors bornes ;
- résultats valides.

---

# 22. CRITÈRES DE NON-RÉGRESSION

Les améliorations ne doivent pas dégrader les acquis suivants :

- répétitions intra-partie : 0 ;
- diversité textuelle élevée ;
- diversité mécanique élevée ;
- 98 %+ de choix non dominés à >80 % ;
- second tour plus intense que le premier ;
- défaites narrativement jouables ;
- 99 %+ des parties avec au moins un signal narratif ;
- déterminisme ;
- build/tests propres ;
- événements rares accessibles ;
- aucune accusation inventée contre une personne réelle.

---

# 23. AUDIT POST-AMÉLIORATION

Relancer exactement le fun audit sur les mêmes seeds principales.

Créer :

```text
audit-results/fun-improvement/post/
```

Produire une comparaison avant/après.

Tableau obligatoire :

| Mesure | Avant | Après | Évolution | Verdict |
|---|---:|---:|---:|---|
| Fun Horizons | 44,3 | | | |
| Runs Horizons plats | baseline | | | |
| Agency Horizons | 2,0/10 | | | |
| Identity Renaissance | 2,5/10 | | | |
| Similarité stratégies inter-partis | 0,979–0,996 | | | |
| Rares avec chaîne | 0/9 génériques | | | |
| Rares « exceptionnels » | 0 | | | |
| World/scandal intéressants | 8/24 | | | |
| World/scandal frustrants | 6/24 | | | |
| Nouveauté partie 10 | 8,9 % moyenne | | | |
| Narrativité ≥3 signaux | 81,7 % | | | |
| Choix dominants >80 % | 1,8 % | | | |
| Tension fin de campagne | baseline | | | |
| Clés techniques visibles | ≥1 observée | | | |

---

# 24. PLAYTESTS MANUELS OBLIGATOIRES APRÈS CORRECTION

Jouer réellement via navigateur au minimum :

### Horizons
- prudent ;
- opportuniste ;
- audacieux/chaos.

### Renaissance
- cohérent ;
- opportuniste.

### Reconquête
- outsider réussi ;
- outsider éliminé.

### Un parti déjà excellent
- Écologistes ou Nouvelle Énergie.

Pour chaque partie, noter : histoire en 3 phrases, moments forts, cartes faibles, tension, décisions marquantes, résultat et envie de rejouer.

---

# 25. DOCUMENT FINAL

Créer à la racine :

```text
FUN_IMPROVEMENTS_REPORT.md
```

Structure :

1. Résumé exécutif
2. Baseline
3. Changements Horizons
4. Événements rares
5. World/scandal
6. Identité des partis
7. Renaissance
8. Rejouabilité
9. Tension
10. Choix dominants
11. Événements faibles
12. UI/immersion
13. Tests
14. Simulations
15. Comparaison avant/après
16. Playtests
17. Régressions évitées
18. Problèmes encore ouverts
19. Recommandations futures
20. Verdict final

---

# 26. NE PAS CONFONDRE « PLUS DE CONTENU » ET « PLUS DE FUN »

Pour chaque nouvel événement, justifier au moins une contribution parmi :

- choix intéressant ;
- mémoire ;
- tension ;
- identité ;
- branche ;
- relation ;
- surprise ;
- climax ;
- rejouabilité ;
- caractérisation d’un acteur.

Si un événement n’apporte aucune de ces dimensions, ne l’ajoute pas simplement pour augmenter le compteur.

---

# 27. CRITÈRE DE QUALITÉ DES NOUVEAUX ÉVÉNEMENTS

Chaque événement nouveau doit passer une revue :

### Situation
Compréhensible immédiatement ?

### Enjeu
Pourquoi le joueur devrait-il s’en soucier ?

### Choix
Les options représentent-elles de vraies stratégies ?

### Trade-off
Chaque option a-t-elle un coût ?

### Contexte
La réponse peut-elle dépendre de la partie ?

### Mémoire
Peut-elle produire un écho futur ?

### Parti
Cette situation pourrait-elle être exactement la même pour un autre parti ?

Si oui, justifier pourquoi l’événement doit être générique.

---

# 28. CRITÈRES DE SUCCÈS GLOBAUX

La mission est réussie si :

1. Horizons n’est plus un favori systématiquement plat.
2. Renaissance a une identité de gameplay plus nette.
3. Plusieurs événements rares deviennent de vrais arcs.
4. Les événements aléatoires problématiques créent davantage d’adaptation et moins de frustration.
5. La 10e partie d’un même parti offre davantage de nouveauté structurelle.
6. Les partis se distinguent davantage dans leurs types de dilemmes.
7. Le dernier tiers de campagne paraît plus tendu sans devenir chaotique.
8. Les choix dominants identifiés sont plus contextuels.
9. aucune clé technique brute n’apparaît dans l’UI.
10. Les acquis précédents sont tous conservés.

Ne déclare pas la mission réussie sur la base du score composite seul.

---

# 29. FIN DE MISSION

À la fin, exécute :

```bash
npm run format:check
npm run lint
npm run typecheck
npm run data:validate
npm run test
npm run build
npm run audit:fun
```

Puis les audits de non-régression pertinents et Playwright sans retries si possible.

Afficher :

```bash
git status
git diff --stat
git log --oneline --decorate -n 20
```

Ne pousse rien.

---

# 30. VERDICT TERMINAL OBLIGATOIRE

Afficher :

```text
FUN IMPROVEMENT — VERDICT FINAL

Horizons
Avant :
Après :
Verdict :

Renaissance / identité
Avant :
Après :
Verdict :

Événements rares
Chaînes avant :
Chaînes après :
Verdict :

Événements aléatoires
Intéressants avant :
Intéressants après :
Frustrants avant :
Frustrants après :
Verdict :

Rejouabilité
Nouveauté partie 10 avant :
Après :
Verdict :

Tension fin de campagne
Avant :
Après :
Verdict :

Choix dominants
Avant :
Après :
Verdict :

Immersion UI
Clés techniques avant :
Après :
Verdict :

Non-régressions
Répétitions :
Narrativité :
Second tour :
Défaites :
Déterminisme :
Tests :
Build :

Playtests manuels :
Résumé :

Commits locaux créés :
Fichiers majeurs modifiés :
Problèmes encore ouverts :
```

---

# 31. DÉMARRAGE

Commence immédiatement par :

1. lire intégralement les audits ;
2. inspecter le code actuel ;
3. créer la baseline post-audit ;
4. identifier les fichiers exacts concernés ;
5. rédiger `PARTY_GAMEPLAY_IDENTITIES.md` ;
6. commencer par Horizons ;
7. continuer phase par phase jusqu’au post-audit final.

Ne demande pas à l’utilisateur de valider chaque phase. Travaille de manière autonome. Ne pousse rien vers le distant.
