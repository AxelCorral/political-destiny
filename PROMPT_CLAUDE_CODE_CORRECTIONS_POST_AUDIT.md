# PROMPT MAÎTRE — CORRECTIONS POST-AUDIT DU JEU « VERS L'ÉLYSÉE »

Tu interviens comme **lead game designer système**, **ingénieur TypeScript senior**, **spécialiste des simulations probabilistes**, **analyste statistique** et **responsable qualité**.

Le projet est un jeu de campagne présidentielle française, mobile-first, inspiré dans son organisation générale de Destiny Eleven : le joueur choisit ou crée un parti, traverse une campagne d’environ un an au moyen d’événements et de décisions, puis tente de gagner l’élection.

Tu dois maintenant **corriger les problèmes restants mis en évidence par l’audit post-corrections**, tout en préservant les améliorations déjà obtenues.

Travaille directement dans le dépôt courant. Tu peux installer les dépendances nécessaires, créer des scripts, modifier le moteur, les données, l’interface et les tests. Tu dois exécuter les commandes, mesurer les effets, corriger les régressions et aller jusqu’à une version fonctionnelle et validée.

Ne t’arrête pas à un plan. Ne te contente pas de proposer des modifications : implémente-les réellement.

---

## 1. SOURCE DE VÉRITÉ ET CONTEXTE

Commence par lire intégralement, dans cet ordre, tous les fichiers disponibles parmi :

- `AUDIT_POST_CORRECTIONS.md`
- `audit-results/README.md`
- `audit-results/summary.json`
- `audit-results/variance-decomposition.csv`
- `audit-results/counterfactuals.csv`
- `audit-results/world-events.csv`
- `audit-results/ideology-trajectories.csv`
- `audit-results/repetition-by-run.csv`
- `audit-results/choice-similarity.csv`
- `audit-results/consequence-similarity.csv`
- `audit/V2_COMPARISON.md`
- `V2_DECISIONS.md`
- `V2_CHANGELOG.md`
- tous les README, ADR, documents de conception et rapports d’audit pertinents
- les scripts existants dans `scripts/audit/` et `scripts/audit-post/`

Inspecte ensuite :

- l’arborescence complète ;
- le moteur de jeu ;
- le moteur électoral ;
- le scoring ;
- les données des partis ;
- les effets d’événements ;
- les adversaires ;
- les reports de voix ;
- les statistiques cachées ;
- la création de parti ;
- les tests unitaires et E2E ;
- l’historique Git récent.

Note avant toute modification :

- branche ;
- commit courant ;
- `git status` ;
- version de Node et npm ;
- commandes de validation existantes ;
- fichiers non suivis ou modifiés.

Ne pousse rien vers le dépôt distant.

---

## 2. CONSTATS DE L’AUDIT À TRAITER

L’audit post-corrections a confirmé que plusieurs problèmes historiques sont désormais corrigés :

- choix génériques presque éliminés ;
- conséquences narratives et mécaniques fortement diversifiées ;
- répétitions intra-partie ramenées à zéro ;
- mémoire, idéologie et monde adverse actifs ;
- influence causale réelle des décisions.

Ces acquis doivent être préservés.

Les problèmes restants à corriger sont les suivants.

### P1 — Agence insuffisante sur la progression électorale

Mesures observées :

- influence du parti sur le score du premier tour : environ `46,06 %` ;
- influence de l’agent sur ce score : environ `5,36 %` ;
- influence du parti sur la progression par rapport au sondage initial : environ `75,87 %` ;
- influence de l’agent sur cette progression : environ `2,40 %`.

Le problème principal est donc que la variable « progression » reste trop largement prédéterminée par le parti initial.

### P2 — Faible capacité du joueur à affecter directement ses adversaires

Le monde adverse est vivant, mais il évolue surtout de manière autonome.

Le catalogue statique contient très peu d’événements dans lesquels un choix du joueur modifie directement :

- un adversaire précis ;
- sa crédibilité ;
- sa cohésion ;
- sa candidature ;
- son alliance ;
- son retrait ;
- sa stratégie ;
- ses reports de voix ;
- sa relation avec le joueur.

### P3 — Déplacements idéologiques déséquilibrés

L’axe économique bouge beaucoup plus que les autres.

Ordres de grandeur observés :

- économie : mouvement moyen absolu d’environ `6,71` ;
- Europe, autorité, écologie : environ `1,8 à 2,0` ;
- immigration : environ `0,91` ;
- société : environ `0,30`.

Le système idéologique fonctionne, mais le contenu et/ou les amplitudes rendent plusieurs axes presque inertes.

### P4 — Deux définitions différentes des agents de simulation

Deux jeux d’agents existent :

- les stratégies historiques de `scripts/audit/simulation-audit.ts` ;
- les agents plus réalistes de `scripts/audit-post/lib/agents.ts`.

Ils produisent des estimations différentes de l’agence du joueur.

Ce problème est principalement documentaire et méthodologique, mais il faut éviter toute confusion future.

### P5 — Équilibrage du second tour à contrôler et corriger si nécessaire

Les graphiques post-audit suggèrent des écarts très importants entre :

- taux de qualification ;
- taux de victoire ;
- probabilité de gagner conditionnellement à une qualification.

Exemple observé dans les graphiques :

- certains partis très souvent qualifiés gagnent relativement peu ;
- certains partis moins souvent qualifiés semblent gagner presque systématiquement une fois au second tour.

Cela peut être cohérent avec le rejet, les réserves de voix et les reports électoraux, mais le moteur peut aussi être trop déterministe ou trop fortement calibré par des biais fixes.

Tu dois diagnostiquer ce point rigoureusement et le corriger si l’analyse confirme un déséquilibre excessif.

### P6 — Incohérence potentielle du graphique contrefactuel immédiat

Le graphique de divergence contrefactuelle indique apparemment un effet immédiat de `0,00`, alors que le rapport affirme qu’il est non nul par construction.

Il faut déterminer s’il s’agit :

- d’un arrondi ;
- d’une mauvaise métrique ;
- d’un mauvais champ ;
- d’un défaut dans le script de graphique ;
- d’une erreur dans le rapport ;
- d’un problème réel du moteur.

Corrige la source du problème, sans maquiller les données.

### P7 — Tests Playwright instables

Trois scénarios E2E sont parfois flaky autour de la fenêtre initiale de mise en garde :

- démarrage avec un parti existant ;
- autosauvegarde et reprise ;
- élimination contrôlée au premier tour.

Ils passent lors d’une nouvelle tentative, mais cette instabilité doit être supprimée.

---

## 3. PRINCIPES NON NÉGOCIABLES

### 3.1 Ne détruis pas les acquis

Les corrections ne doivent pas réintroduire :

- choix génériques ;
- conséquences clonées ;
- événements répétitifs ;
- textes dupliqués ;
- faux dilemmes ;
- événements inaccessibles ;
- non-déterminisme ;
- monde adverse statique ;
- effets d’idéologie inutilisés ;
- mémoire non exploitée.

### 3.2 Ne triche pas avec les métriques

Interdictions :

- modifier les scripts d’audit pour rendre les résultats artificiellement favorables ;
- supprimer des métriques gênantes ;
- filtrer les parties défavorables ;
- changer les graines après avoir vu les résultats ;
- modifier les CSV à la main ;
- hardcoder des résultats de simulation ;
- écrire des bonus/malus par parti uniquement pour atteindre une courbe cible ;
- homogénéiser tous les partis ;
- affaiblir artificiellement les partis forts ou renforcer les partis faibles sans justification systémique.

Les modifications doivent améliorer le comportement réel du jeu.

### 3.3 Préserver l’identité des partis

Les partis doivent rester différents en :

- socle électoral ;
- difficulté ;
- rejet ;
- réserves de voix ;
- militantisme ;
- cohésion ;
- crédibilité ;
- potentiel de progression ;
- comportement au second tour.

L’objectif n’est pas que tous aient la même probabilité de gagner.

### 3.4 Réalisme juridique et éditorial

Pour tout nouveau contenu :

- ne crée aucune accusation précise attribuée à une vraie personne ;
- n’invente aucun délit, scandale sexuel, corruption ou affaire judiciaire associé à une personne réelle identifiable ;
- utilise des candidats fictifs, cadres fictifs ou formulations génériques quand l’événement est inventé ;
- distingue clairement les éléments factuels publics des événements fictionnels ;
- conserve le disclaimer de fiction et de non-prédiction.

---

## 4. MÉTHODE DE TRAVAIL OBLIGATOIRE

Travaille par phases.

Pour chaque phase :

1. établis un diagnostic ;
2. écris les tests qui reproduisent le problème ;
3. implémente la correction ;
4. lance les tests ciblés ;
5. lance les simulations nécessaires ;
6. mesure avant/après ;
7. documente la décision ;
8. commite localement la phase si tout est propre.

Ne pousse aucun commit.

Utilise des commits atomiques avec des messages explicites, par exemple :

- `fix(scoring): normalize campaign progression by reachable potential`
- `feat(events): add direct opponent interaction chains`
- `balance(ideology): strengthen underused ideological axes`
- `fix(election): calibrate second-round transfer saturation`
- `fix(audit): correct immediate counterfactual chart metric`
- `test(e2e): remove disclaimer dialog flakiness`

---

# PHASE 0 — BASELINE ET GARDE-FOUS

## 5. Exécuter la validation initiale

Avant toute modification, exécute les commandes existantes, notamment si elles existent :

```bash
npm run format:check
npm run lint
npm run typecheck
npm run data:validate
npm run test
npm run build
npm run audit:game
npm run test:e2e
```

Si les noms diffèrent, utilise ceux du projet.

Archive les résultats de référence dans un nouveau dossier, par exemple :

```text
audit-results/pre-fix-baseline/
```

Conserve au minimum :

- `summary.json`
- `variance-decomposition.csv`
- `counterfactuals.csv`
- `world-events.csv`
- `ideology-trajectories.csv`
- taux de qualification et victoire par parti
- taux de victoire conditionnel à la qualification
- résultats des tests
- commit et paramètres de simulation
- graines utilisées

Ne remplace pas les fichiers officiels avant d’avoir terminé les corrections.

## 6. Créer un test de non-régression global

Ajoute une commande légère, adaptée à une exécution fréquente, par exemple :

```bash
npm run audit:smoke
```

Elle doit vérifier rapidement :

- déterminisme ;
- absence de répétition ;
- absence d’identifiants dupliqués ;
- absence de chaînes cassées ;
- événements accessibles ;
- absence de faux dilemme évident ;
- utilisation d’effets d’idéologie ;
- utilisation de mémoire ;
- taux de parties valides ;
- absence de NaN et valeurs hors bornes.

La campagne complète reste contrôlée par `npm run audit:game`.

---

# PHASE 1 — CORRIGER L’AGENCE SUR LA PROGRESSION

## 7. Diagnostiquer précisément le calcul actuel

Inspecte notamment :

- `src/game/engine/scoring.ts`
- `src/game/engine/game.ts`
- `src/game/engine/election.ts`
- les données de `hidden.potentialSupport`
- les sondages initiaux ;
- les plafonds et planchers ;
- la conversion entre statistiques et intentions de vote ;
- le bruit des sondages ;
- le calcul du score final ;
- le calcul de `pollingProgression`.

Réponds dans un document de décision :

- pourquoi le parti explique 75,9 % de la progression ;
- si la métrique utilise un delta brut biaisé par le point de départ ;
- si les partis à haut score initial ont mécaniquement moins de marge ;
- si les partis faibles ont un potentiel irréaliste ou insuffisant ;
- si les choix modifient réellement le soutien latent ;
- si les effets de campagne se saturent trop vite ;
- si des caps, clamps ou arrondis écrasent les différences ;
- si la progression mesure bien ce que l’interface prétend montrer.

## 8. Concevoir une métrique de progression plus juste

La nouvelle logique doit distinguer au minimum :

1. progression brute :
   `score final - score initial`;

2. progression relative au potentiel atteignable :
   rapport entre le gain obtenu et la marge de progression réaliste du parti ;

3. surperformance ou sous-performance par rapport à une campagne neutre :
   différence entre le résultat obtenu et le résultat moyen attendu pour le même parti avec un agent neutre/aléatoire ;

4. résultat électoral absolu :
   score réel au premier tour et victoire éventuelle.

Ne remplace pas nécessairement l’ancienne métrique partout.

Choisis une architecture claire :

- conserver le delta brut pour l’affichage factuel ;
- utiliser une métrique normalisée pour le score de performance ;
- afficher une formulation compréhensible au joueur ;
- documenter ce qui est caché et ce qui est visible.

Exemples d’approches possibles à évaluer, sans les appliquer aveuglément :

### Option A — Normalisation par marge de progression

```text
margePositive = max(potentialSupport - initialPoll, epsilon)
progressionNormalisee = gain / margePositive
```

Prévoir aussi correctement les campagnes négatives.

### Option B — Surperformance par rapport à une baseline du parti

```text
surperformance = scoreFinal - expectedScoreForPartyUnderNeutralPolicy
```

La baseline doit être calculée ou paramétrée de manière reproductible, pas improvisée.

### Option C — Combinaison robuste

```text
performanceCampagne =
  poids1 * progressionNormalisee
  + poids2 * surperformanceBaseline
  + poids3 * scoreAbsolu
  + poids4 * issueElectorale
```

Les poids doivent être justifiés et testés.

## 9. Renforcer l’effet cumulatif des décisions sans rendre chaque choix explosif

Le but n’est pas de donner `+3 points` de sondage à chaque clic.

Privilégie :

- effets progressifs ;
- interactions avec cohérence idéologique ;
- crédibilité thématique ;
- mémoire de campagne ;
- réputation ;
- mobilisation ;
- réserves de voix ;
- dynamique ;
- conséquences différées ;
- multiplicateurs contextuels modérés ;
- rendements décroissants ;
- coût des revirements ;
- effets différents selon l’électorat touché.

Une bonne campagne cohérente doit produire une trajectoire significativement différente d’une campagne incohérente.

Évite :

- bonus directs arbitraires ;
- inflation générale des sondages ;
- choix dominants ;
- boucle exponentielle ;
- effet boule de neige irréversible trop tôt ;
- résultat quasi garanti après quelques choix.

## 10. Critères d’acceptation P1

Après correction, sur une simulation de taille suffisante :

- l’influence du parti sur la progression normalisée doit baisser nettement par rapport à `75,87 %` ;
- l’influence de l’agent sur cette progression doit augmenter nettement par rapport à `2,40 %` ;
- cible indicative raisonnable :
  - η²(agent) sur progression normalisée : au moins `5 %`, idéalement `7–15 %` ;
  - η²(parti) sur progression normalisée : idéalement sous `65 %`, sans obligation de descendre artificiellement sous `50 %` ;
- le parti peut rester le premier facteur sur le score absolu ;
- le score au premier tour ne doit pas devenir chaotique ;
- le taux de changement d’issue entre agents à parti+graine identiques ne doit pas diminuer ;
- une décision isolée doit conserver un effet modeste mais mesurable ;
- une politique cohérente sur toute la partie doit avoir un effet cumulé important ;
- les outsiders doivent pouvoir surperformer sans devenir systématiquement favoris ;
- aucune option ne doit devenir dominante.

Si les cibles chiffrées entrent en conflit avec la qualité du jeu, documente l’arbitrage au lieu de tricher.

---

# PHASE 2 — DONNER AU JOUEUR PLUS D’ACTION SUR LES ADVERSAIRES

## 11. Concevoir de nouveaux mécanismes d’interaction directe

Ajoute un ensemble limité mais significatif d’événements permettant au joueur d’affecter directement un adversaire nommé ou une coalition.

Cible minimale indicative :

- au moins `12 à 20` événements nouveaux ou branches significativement enrichies ;
- répartis entre plusieurs périodes de campagne ;
- répartis entre plusieurs familles idéologiques ;
- aucun copier-coller de structure ;
- plusieurs événements conditionnels ou chaînés.

Types d’interactions possibles :

- proposer ou refuser un pacte de non-agression ;
- répondre à une attaque ciblée ;
- exploiter ou refuser d’exploiter une contradiction publique ;
- proposer un débat en duel ;
- tendre la main à un électorat adverse ;
- accueillir un transfuge ;
- refuser un transfuge controversé ;
- négocier un désistement ;
- proposer une plateforme commune ;
- provoquer une clarification idéologique chez un adversaire ;
- répondre à une primaire adverse ;
- encourager ou décourager une dissidence ;
- défendre un adversaire attaqué injustement ;
- négocier une consigne de vote ;
- mettre en difficulté une alliance adverse par une proposition politique ;
- contester une information sans inventer de scandale ;
- transformer une polémique en duel programmatique ;
- imposer un thème de campagne qui pénalise certains adversaires.

## 12. Effets autorisés

Les choix peuvent agir sur :

- relation bilatérale ;
- hostilité ;
- respect ;
- probabilité d’alliance ;
- probabilité de retrait ;
- cohésion adverse ;
- crédibilité adverse ;
- exposition médiatique ;
- stratégie adverse ;
- électorat transférable ;
- réserves de voix ;
- loyauté d’un cadre fictif ;
- légitimité du candidat ;
- probabilité de dissidence ;
- calendrier d’une primaire ;
- condition de déclenchement d’une chaîne.

Ne fais pas de manipulation omnipotente.

Le joueur ne doit pas pouvoir détruire un candidat adverse avec un seul choix ordinaire.

## 13. Réactivité et mémoire

Un adversaire affecté doit pouvoir :

- répondre plus tard ;
- se souvenir de l’attaque ou du soutien ;
- refuser une alliance ;
- soutenir le joueur au second tour ;
- lancer une contre-offensive ;
- modifier sa stratégie ;
- provoquer une chaîne narrative.

Ajoute des tests de trajectoire :

```text
choix du joueur
→ état adverse modifié
→ mémoire enregistrée
→ réaction ultérieure
→ impact électoral ou relationnel
```

## 14. Critères d’acceptation P2

- `eventsAffectingOpponent` doit augmenter nettement au-delà de 2 ;
- les nouveaux mécanismes doivent être atteignables ;
- ils doivent apparaître dans une proportion mesurable de campagnes ;
- ils ne doivent pas dominer chaque partie ;
- au moins plusieurs types d’effets adverses doivent être utilisés ;
- les adversaires doivent répondre dans des chaînes réelles ;
- les événements doivent rester textuellement et mécaniquement divers ;
- aucune répétition intra-partie ne doit réapparaître ;
- aucune accusation inventée contre une personnalité réelle.

---

# PHASE 3 — RÉÉQUILIBRER LES AXES IDÉOLOGIQUES

## 15. Auditer le contenu par axe

Crée un inventaire indiquant pour chaque axe :

- nombre d’événements qui le modifient ;
- nombre de choix concernés ;
- amplitude moyenne ;
- amplitude maximale ;
- fréquence d’apparition ;
- périodes de campagne ;
- partis concernés ;
- thèmes politiques ;
- conséquences sur le socle ;
- conséquences sur les indécis ;
- conséquences sur la cohésion ;
- conséquences sur les reports de voix.

Distingue :

- manque de contenu ;
- amplitudes trop faibles ;
- conditions trop rares ;
- effets correctement enregistrés mais sans conséquence ;
- axes redondants ou mal mappés.

## 16. Ajouter ou enrichir du contenu sous-représenté

Priorités :

1. société ;
2. immigration ;
3. autorité ;
4. écologie ;
5. Europe.

Ajoute des événements sur des arbitrages concrets, par exemple :

### Société

- fin de vie ;
- bioéthique ;
- laïcité ;
- droits civils ;
- politique familiale ;
- école et valeurs communes ;
- libertés numériques.

### Immigration

- régularisation ;
- quotas ;
- asile ;
- intégration ;
- regroupement familial ;
- contrôle aux frontières ;
- immigration économique.

### Autorité et libertés

- maintien de l’ordre ;
- surveillance ;
- état d’urgence ;
- justice ;
- police de proximité ;
- manifestations ;
- libertés publiques.

### Écologie

- nucléaire ;
- taxe carbone ;
- rénovation ;
- agriculture ;
- transport ;
- sobriété ;
- industrie verte.

### Europe

- règles budgétaires ;
- défense européenne ;
- souveraineté juridique ;
- politique commerciale ;
- élargissement ;
- énergie ;
- frontières européennes.

Chaque événement doit présenter de vrais arbitrages, pas des versions renommées de prudent/risqué/rassembleur.

## 17. Propager les effets idéologiques

Un déplacement d’axe doit pouvoir modifier :

- cohérence ;
- opportunisme perçu ;
- adhérents ;
- mobilisation ;
- électorat cible ;
- électorat adjacent ;
- relation avec alliés ;
- reports de voix ;
- disponibilité de futurs événements ;
- risque de fronde ou dissidence.

Les axes ne doivent pas devenir de simples compteurs décoratifs.

## 18. Critères d’acceptation P3

- tous les axes doivent bouger dans une proportion non triviale de campagnes ;
- l’axe société ne doit plus être quasi nul ;
- les cinq axes sous-représentés doivent augmenter sans réduire artificiellement l’économie ;
- aucun axe ne doit être forcé à une égalité parfaite ;
- cible indicative :
  - mouvement moyen absolu d’au moins `1,5–3` sur société, immigration, autorité, écologie et Europe selon leur rôle ;
  - part des campagnes avec mouvement supérieur à 5 points nettement accrue pour les axes sous-représentés ;
- les mouvements doivent être cohérents avec les décisions ;
- les changements brutaux doivent avoir un coût ;
- les trajectoires cohérentes doivent être distinctes des trajectoires opportunistes.

---

# PHASE 4 — CALIBRER LE SECOND TOUR

## 19. Produire un diagnostic détaillé

Ajoute un rapport par parti contenant :

- taux de qualification ;
- taux de victoire global ;
- taux de victoire conditionnel à la qualification ;
- adversaires rencontrés au second tour ;
- score moyen au second tour ;
- rejet moyen ;
- réserves de voix ;
- reports reçus par origine ;
- abstention ;
- consignes de vote ;
- effets des alliances ;
- dispersion des résultats ;
- sensibilité aux agents ;
- sensibilité aux graines.

Produis aussi une matrice :

```text
parti A contre parti B
→ nombre de duels
→ taux de victoire de A
→ score moyen
→ reports moyens
→ rejet moyen
```

## 20. Détecter les causes d’un éventuel surdéterminisme

Inspecte :

- poids du rejet ;
- poids de la proximité idéologique ;
- reports fixes ;
- consignes de vote ;
- taux de participation ;
- saturation des réserves ;
- caps et clamps ;
- bonus de crédibilité ;
- pénalités de radicalité ;
- effet des alliances ;
- bruit électoral ;
- ordre des calculs ;
- double comptage d’un facteur ;
- dépendance excessive à une stat cachée ;
- coefficients spécifiques aux partis.

Teste notamment :

- même candidat avec rejet variant de ±5 ;
- même duel avec relations différentes ;
- même duel avec consignes différentes ;
- même duel avec plusieurs graines ;
- même duel avec campagne excellente ou mauvaise ;
- mêmes partis mais trajectoires idéologiques différentes.

## 21. Corriger le modèle si le diagnostic confirme un problème

Privilégie :

- normalisation des reports ;
- rendements décroissants du rejet ;
- saturation progressive plutôt que seuil brutal ;
- interaction entre rejet, proximité et crédibilité ;
- abstention différenciée ;
- bruit contrôlé ;
- effet réel de la campagne de second tour ;
- impact des alliances mémorisées ;
- impact des contradictions ;
- limites aux reports automatiques.

Évite :

- quota de victoire par parti ;
- résultat prédéfini ;
- nerf direct « RN -X » ou buff « Horizons +Y » sans justification systémique ;
- équilibrage vers 50/50 uniforme ;
- randomisation excessive.

## 22. Critères d’acceptation P5

- le taux de victoire conditionnel à la qualification doit être explicable par le moteur ;
- aucun parti ne doit gagner presque automatiquement tous ses seconds tours uniquement à cause d’un coefficient fixe caché ;
- les duels doivent présenter une variance réelle ;
- une bonne ou mauvaise campagne doit déplacer significativement les chances ;
- le rejet doit rester important sans être seul déterminant ;
- les alliances et consignes doivent compter ;
- les résultats doivent rester politiquement différenciés ;
- les valeurs extrêmes doivent être documentées si elles subsistent.

Ne force pas une plage arbitraire si les simulations montrent une justification systémique solide, mais toute probabilité conditionnelle supérieure à environ 85–90 % doit être examinée et explicitement justifiée.

---

# PHASE 5 — CORRIGER L’OUTILLAGE D’AUDIT

## 23. Corriger le graphique contrefactuel

Inspecte :

- la génération de `counterfactuals.csv` ;
- la métrique immédiate ;
- les arrondis ;
- les unités ;
- le script SVG ;
- le titre et les axes ;
- le texte du rapport.

Le graphique et le rapport doivent raconter la même chose.

Si l’effet immédiat est réellement non nul mais inférieur à 0,005 :

- augmente la précision affichée ;
- ou change l’unité ;
- ou affiche une annotation lisible ;
- sans falsifier la valeur.

Si la métrique était mal calculée :

- corrige le calcul ;
- ajoute un test ;
- régénère le graphique ;
- documente la correction.

## 24. Unifier ou documenter les agents

Choisis l’une de ces approches :

### Approche recommandée

Créer une bibliothèque commune d’agents d’audit avec :

- identifiant ;
- description ;
- plausibilité humaine ;
- accès ou non aux utilités attendues ;
- caractère extrême ou réaliste ;
- métrique visée.

Les deux scripts doivent importer ou référencer cette source commune.

### Approche minimale

Ajouter une documentation croisée claire :

- agents réalistes ;
- agents extrêmes ;
- raison de l’écart entre 5,4 % et 14,2 % ;
- cas d’usage de chaque mesure.

Ne supprime pas une série de mesures simplement parce qu’elle donne un résultat différent.

## 25. Tests de l’outillage

Ajoute des tests pour :

- CSV avec en-tête même s’il est vide ;
- mêmes seeds → mêmes résultats ;
- graphique immédiat cohérent avec le CSV ;
- matrice de duels correcte ;
- taux conditionnel correctement calculé ;
- pas de division par zéro ;
- intervalle de confiance stable ;
- fichiers de sortie documentés.

---

# PHASE 6 — SUPPRIMER LES FLAKY TESTS PLAYWRIGHT

## 26. Diagnostiquer la fenêtre de mise en garde

Ne masque pas le problème en augmentant simplement les timeouts ou les retries.

Vérifie :

- hydratation ;
- animation ;
- stockage local ;
- ordre de montage ;
- portal ;
- focus trap ;
- clic intercepté ;
- transition ;
- sélecteur ambigu ;
- persistance de l’acceptation ;
- état partagé entre tests ;
- nettoyage du contexte.

## 27. Corriger les tests et/ou l’interface

Objectif :

- modal déterministe ;
- bouton détectable par rôle accessible ;
- helper E2E commun pour l’accepter ;
- isolation du localStorage ;
- aucune dépendance à un timeout arbitraire ;
- animations désactivables en test si nécessaire ;
- pas de retry nécessaire pour réussir.

Ajoute, si utile :

- `data-testid` uniquement là où les rôles accessibles ne suffisent pas ;
- fixture Playwright ;
- fonction `acceptDisclaimerIfPresent(page)` ;
- attente sur un état stable et explicite.

## 28. Critère d’acceptation P7

Exécute les tests E2E plusieurs fois :

```bash
npx playwright test --repeat-each=10 --retries=0
```

ou équivalent adapté.

Cible :

- 0 échec ;
- 0 flaky ;
- 0 retry nécessaire ;
- pas d’augmentation déraisonnable des timeouts.

---

# PHASE 7 — VALIDATION STATISTIQUE COMPLÈTE

## 29. Relancer un audit post-fix

Crée un dossier séparé :

```text
audit-results/post-fix/
```

Relance l’outillage avec :

- mêmes graines principales que la baseline ;
- même nombre de campagnes ;
- même définition d’agents ;
- mêmes paramètres ;
- simulations supplémentaires si nécessaire.

Produis une comparaison avant/après correction.

## 30. Mesures obligatoires

Au minimum :

- η² parti, agent, interaction et résiduel sur :
  - premier tour ;
  - score final ;
  - progression brute ;
  - progression normalisée ;
  - surperformance baseline ;
- qualification ;
- victoire ;
- changement d’issue à parti+seed identiques ;
- effet contrefactuel immédiat, +3, +8, premier tour et score final ;
- taux de qualification ;
- taux de victoire ;
- taux conditionnel de victoire ;
- matrice des duels ;
- mémoire ;
- actions adverses ;
- événements affectant directement un adversaire ;
- mouvement idéologique par axe ;
- répétitions ;
- similarité ;
- événements rares ;
- parties invalides ;
- erreurs.

## 31. Comparer les trois états

Lorsque possible, compare :

1. V1 historique ;
2. V2 post-corrections avant ce chantier ;
3. version corrigée finale.

N’utilise pas des métriques différentes sans l’indiquer.

---

# PHASE 8 — CONTRÔLES DE NON-RÉGRESSION

## 32. Contraintes à préserver

La version finale doit conserver au minimum :

- 0 répétition exacte de titre dans les campagnes simulées ;
- 0 répétition exacte de récit ;
- aucun retour massif du triptyque prudent/risqué/rassembleur ;
- unicité narrative élevée ;
- diversité mécanique élevée ;
- 0 faux dilemme important ;
- tous les événements rares atteignables ;
- 0 erreur de simulation ;
- 0 état invalide ;
- déterminisme parfait à seed et décisions identiques ;
- build réussi ;
- typecheck réussi ;
- lint réussi ;
- tests réussis.

Si une correction détériore un acquis, corrige la régression avant de continuer.

---

# PHASE 9 — INTERFACE ET LISIBILITÉ

## 33. Afficher les nouvelles informations sans surcharger le jeu

Le joueur ne doit pas voir toutes les statistiques cachées.

Cependant, l’interface doit rendre lisibles les conséquences importantes :

- progression réussie ou sous-performance ;
- relation avec un adversaire ;
- revirement idéologique ;
- soutien ou hostilité d’un parti ;
- dynamique de second tour ;
- effet différé qui se déclenche.

Utilise :

- formulations narratives ;
- badges discrets ;
- journal de campagne ;
- variations synthétiques ;
- récapitulatif final.

Évite un tableau de bord surchargé.

## 34. Résumé final

Le bilan de partie doit distinguer clairement :

- score initial ;
- score final ;
- progression brute ;
- surperformance ajustée ;
- qualification ;
- victoire ;
- évolution idéologique ;
- relations majeures ;
- événements déterminants ;
- adversaires affectés ;
- score final sur 100.

Ne présente pas une métrique normalisée comme un pourcentage électoral réel.

---

# PHASE 10 — DOCUMENTATION ET LIVRABLES

## 35. Documents à créer ou mettre à jour

Crée :

### `POST_AUDIT_FIXES.md`

Contenu :

1. résumé exécutif ;
2. problèmes traités ;
3. diagnostic de chaque problème ;
4. décisions de conception ;
5. fichiers modifiés ;
6. tests ajoutés ;
7. résultats statistiques avant/après ;
8. compromis ;
9. limites restantes ;
10. recommandations futures.

### `audit-results/post-fix/README.md`

Explique :

- paramètres ;
- graines ;
- agents ;
- fichiers ;
- reproduction ;
- limites.

### `audit-results/post-fix/COMPARISON.md`

Tableau obligatoire :

| Mesure                                         |  V1 | V2 avant corrections finales | Après | Évolution | Verdict |
| ---------------------------------------------- | --: | ---------------------------: | ----: | --------: | ------- |
| η² parti — 1er tour                            |     |                              |       |           |         |
| η² agent — 1er tour                            |     |                              |       |           |         |
| η² parti — progression                         |     |                              |       |           |         |
| η² agent — progression                         |     |                              |       |           |         |
| Changement d’issue apparié                     |     |                              |       |           |         |
| Événements affectant directement un adversaire |     |                              |       |           |         |
| Mouvement société                              |     |                              |       |           |         |
| Mouvement immigration                          |     |                              |       |           |         |
| Mouvement autorité                             |     |                              |       |           |         |
| Mouvement écologie                             |     |                              |       |           |         |
| Mouvement Europe                               |     |                              |       |           |         |
| Titres répétés                                 |     |                              |       |           |         |
| Récits répétés                                 |     |                              |       |           |         |
| Tests E2E flaky                                |     |                              |       |           |         |

## 36. Graphiques à régénérer

Régénère au minimum :

- variance expliquée par facteur ;
- distribution des scores par parti ;
- distribution par agent ;
- divergence contrefactuelle ;
- répétitions ;
- mouvements idéologiques ;
- relation score initial/final ;
- qualification/victoire ;
- victoire conditionnelle à qualification ;
- matrice de duels ;
- progression brute vs progression normalisée.

Chaque graphique doit préciser :

- commit ;
- taille d’échantillon ;
- métrique ;
- unité ;
- source de données.

---

# PHASE 11 — VALIDATION FINALE

## 37. Exécuter toutes les validations

À la fin, exécute :

```bash
npm run format:check
npm run lint
npm run typecheck
npm run data:validate
npm run test
npm run build
npm run audit:smoke
npm run audit:game
npm run test:e2e
```

Puis :

```bash
npx playwright test --repeat-each=10 --retries=0
```

Adapte seulement si les scripts portent d’autres noms.

## 38. Inspection Git finale

Affiche :

```bash
git status
git diff --stat
git log --oneline --decorate -n 15
```

Vérifie :

- aucun fichier temporaire inutile ;
- aucun secret ;
- aucun artefact massif non maîtrisé ;
- aucune modification accidentelle ;
- aucun fichier de sauvegarde utilisateur ;
- aucune donnée manuelle maquillée.

Ne pousse rien.

---

# 39. VERDICT FINAL OBLIGATOIRE

À la fin de la mission, affiche dans le terminal un verdict structuré :

```text
CORRECTIONS POST-AUDIT — VERDICT FINAL

P1 Agence sur la progression :
- Avant :
- Après :
- Verdict :

P2 Action directe sur les adversaires :
- Avant :
- Après :
- Verdict :

P3 Axes idéologiques :
- Avant :
- Après :
- Verdict :

P4 Agents d’audit :
- Avant :
- Après :
- Verdict :

P5 Second tour :
- Diagnostic :
- Correction :
- Verdict :

P6 Graphique contrefactuel :
- Cause :
- Correction :
- Verdict :

P7 Playwright :
- Avant :
- Après :
- Verdict :

Non-régressions :
- Répétitions :
- Diversité :
- Déterminisme :
- Tests :
- Build :

Commits locaux créés :
Fichiers principaux modifiés :
Commandes pour reproduire :
Problèmes encore ouverts :
```

Ne déclare un problème corrigé que si les mesures et les tests le démontrent.

---

# 40. DÉMARRAGE IMMÉDIAT

Commence maintenant par :

1. inspecter le dépôt ;
2. lire intégralement l’audit et ses résultats ;
3. exécuter la baseline ;
4. produire un plan de travail dans `POST_AUDIT_FIXES.md` ;
5. écrire les premiers tests reproduisant P1, P5, P6 et P7 ;
6. implémenter les corrections phase par phase ;
7. poursuivre de manière autonome jusqu’à validation complète.

Ne demande l’intervention de l’utilisateur que si une information absolument indispensable est introuvable et impossible à déduire du dépôt.

Ne pousse rien vers le dépôt distant.
