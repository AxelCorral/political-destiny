# PROMPT MAÎTRE — REFONTE CIBLÉE DE LA FORME, DU GAME FEEL ET DE LA MISE EN SCÈNE
## Projet : « Vers l’Élysée »
### À exécuter APRÈS la passe ciblée gameplay/fun

Tu interviens comme **lead UI/UX designer de jeu**, **art director**, **senior front-end engineer Next.js/React/TypeScript/Tailwind**, **game feel designer**, **motion designer UI**, **expert responsive/mobile-first**, **auditeur d’accessibilité** et **responsable qualité visuelle**.

Cette mission intervient APRÈS :
- les audits fonctionnels ;
- l’audit fun/rejouabilité ;
- la passe d’amélioration du fun ;
- la passe ciblée gameplay/fun encore ouverte ;
- l’audit de forme `AUDIT_FORME_GAME_FEEL.md`.

Ta mission est maintenant d’**implémenter réellement les améliorations de forme identifiées dans `AUDIT_FORME_GAME_FEEL.md`**, sans modifier le fond fonctionnel du jeu.

Le principe directeur est simple :

> **Le jeu possède déjà de très bons écrans de rupture (accueil, lancement, soirées électorales, bilan final). Il faut étendre intelligemment ce niveau de finition à la boucle de jeu quotidienne sans uniformiser tous les écrans en navy/or, sans transformer le jeu en dashboard technique, et sans toucher à l’équilibrage ou aux règles.**

La direction recommandée par l’audit est :

> **A. « Soirée électorale premium »**

Tu dois utiliser cette direction comme base de travail, sauf si l’état du dépôt APRÈS la passe gameplay a changé de manière substantielle et documentée.

---

# 1. GATE DE DÉMARRAGE — NE PAS COMMENCER TROP TÔT

Cette mission ne doit commencer QUE lorsque la mission gameplay/fun précédente est complètement terminée.

Avant toute modification visuelle, vérifie que les éléments suivants existent :

- `TARGETED_GAMEPLAY_PASS_REPORT.md`
- le verdict final de la passe ciblée gameplay ;
- les commits locaux de cette passe ;
- les tests de fond terminés ;
- le dépôt est dans un état cohérent.

Lis intégralement `TARGETED_GAMEPLAY_PASS_REPORT.md`.

Si la passe précédente a modifié :
- les écrans ;
- les composants ;
- les tests E2E ;
- les événements ;
- les flows ;
- les états de campagne ;

alors adapte la baseline visuelle à l’état ACTUEL.

Ne te base jamais aveuglément sur des captures anciennes si l’interface a changé.

---

# 2. SOURCE DE VÉRITÉ

Lis intégralement :

- `AUDIT_FORME_GAME_FEEL.md`
- `TARGETED_GAMEPLAY_PASS_REPORT.md`
- `FUN_IMPROVEMENTS_REPORT.md`
- `AUDIT_FUN_REJOUABILITE.md`
- `GAMEPLAY_AUDIT.md`
- `AUDIT_POST_CORRECTIONS.md`
- `POST_AUDIT_FIXES.md`
- `PARTY_GAMEPLAY_IDENTITIES.md`
- `V2_DECISIONS.md`
- `V2_CHANGELOG.md`
- README et documentation de design.

Lis également les résultats :

```text
audit-results/form-audit/
```

notamment :
- `summary.json`
- `screen-audit.csv`
- `visual-hierarchy.csv`
- `importance-vs-presentation.csv`
- `responsive-issues.csv`
- `design-system-inconsistencies.csv`
- `accessibility.csv`
- `animation-inventory.csv`
- toutes les captures desktop/mobile/tablette
- les playtests.

Inspecte ensuite directement le code actuel.

---

# 3. CE QUE L’AUDIT A CONCLU — BASELINE À BATTRE

Baseline de forme :

```text
Qualité visuelle globale : 6,3/10
Premium Game Feel : 61/100
Jeu vs web app : 5/10 — HYBRIDE
Direction artistique : 7/10
Hiérarchie : 6/10
Cartes d’événements : 5/10
Conséquences : 5/10
Game feel : 5/10
Animations : 4/10
Tension visuelle : 6/10
Premier tour : 8,5/10
Second tour : 6/10
Victoire : 6,5/10
Défaite : 7,5/10
Mobile : 7/10
Desktop : 6/10
Immersion : 6/10
```

Constat central :

> Les écrans premium existent déjà, mais environ 90 % de la boucle quotidienne ressemble encore à un formulaire de campagne bien habillé.

Plus grande faiblesse :

> Un seul gabarit visuel sert presque toutes les catégories d’événement ; routine, rare, chaîne, décisif et gouvernement sont insuffisamment distingués.

Plus grande force :

> Les écrans de rupture navy/or et data-journalisme sont déjà convaincants.

Ne reconstruis donc PAS tout le design system depuis zéro.

---

# 4. INTERDICTION ABSOLUE DE MODIFIER LE GAMEPLAY

Cette mission concerne la FORME uniquement.

Ne modifie PAS :

- statistiques des partis ;
- probabilités ;
- event weights ;
- conséquences ;
- scoring ;
- électorat ;
- transferts ;
- sélection d’événements ;
- agence ;
- choix disponibles ;
- narrations de gameplay sauf correction purement typographique/orthographique ;
- conditions de chaînes ;
- résultats électoraux ;
- règles du premier/second tour.

Si un changement visuel semble nécessiter un changement de gameplay, cherche d’abord une solution de présentation.

Toute exception doit être strictement technique, neutre sur le comportement et documentée.

---

# 5. PHILOSOPHIE VISUELLE À RESPECTER

Direction :

## « Soirée électorale premium »

Principes :

1. **Étendre le langage visuel existant**, ne pas remplacer l’identité actuelle.
2. Navy/or/cream restent la base.
3. Le crème reste le registre de lecture et de respiration.
4. Le navy/or sert à hiérarchiser les moments importants.
5. Plus l’événement est important, plus la mise en scène peut monter en intensité.
6. Les événements de routine restent sobres.
7. Les événements rares et les chaînes gagnent des signatures propres.
8. Le jeu doit sembler moins « formulaire », sans perdre sa lisibilité.
9. Les animations sont courtes, fonctionnelles et signifiantes.
10. Mobile reste lecture-first et réellement natif.

Ne généralise pas le navy sombre à tous les écrans.

L’audit avertit explicitement qu’une sur-utilisation du navy/or détruirait l’effet de climax.

---

# 6. PHASE 0 — BASELINE VISUELLE APRÈS GAMEPLAY

Avant modification :

Exécute :

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright test
```

Utilise les scripts exacts du projet s’ils diffèrent.

Toute suite défaillante doit être diagnostiquée.

IMPORTANT :
L’audit de forme précédent signalait :
- `155/156` sur Vitest, test flaky ;
- `17/18` E2E avec une seed devenue obsolète après un ancien rééquilibrage.

La mission gameplay précédente est censée traiter la stabilité CI. Vérifie l’état actuel plutôt que de recopier ces chiffres.

Créer :

```text
audit-results/form-improvement/baseline/
```

Capturer les viewports :

```text
360 × 800
390 × 844
430 × 932
768 × 1024
1366 × 768
1440 × 900
1920 × 1080
```

Inclure au minimum :

- accueil ;
- choix parti ;
- événement routine ;
- événement major ;
- événement decisive ;
- rare ;
- chaîne/follow-up ;
- conséquence mineure ;
- conséquence majeure ;
- sondage ;
- premier tour ;
- second tour ;
- victoire ;
- défaite ;
- gouvernement ;
- bilan ;
- dashboard mobile.

Archiver le commit exact.

---

# 7. P1 — CORRIGER LES DEUX BUGS RESPONSIVE RÉELS

## 7.1 Titre d’événement tronqué sur mobile

Bug confirmé :
`party_nouvelle_energie_signature`, titre coupé en plein mot à ~390 px.

Cause probable :
- `overflow-hidden`
- `leading-[0.98]`
- titre condensé et long
- wrapping insuffisant.

Corriger structurellement.

Exigences :
- titres complets à 360, 390, 430 px ;
- aucun mot rogné ;
- pas de chevauchement ;
- pas de réduction absurde de police ;
- conserver le registre typographique.

Ajouter un test visuel ou DOM dédié avec titre long.

Tester plusieurs titres longs du catalogue, pas seulement celui signalé.

## 7.2 Onglet mobile invisible

Dashboard :
4e onglet hors champ à 360-390 px sans indice de scroll.

Corriger par une solution claire :
- gradient de bord ;
- scroll hint ;
- scroll-snap ;
- compression intelligente ;
- autre approche robuste.

Ne supprime pas un onglet.

Critère :
un utilisateur découvrant le dashboard doit comprendre qu’il existe davantage d’onglets.

---

# 8. P2 PRINCIPAL — REFONDRE `StandardDecisionCard` EN SYSTÈME DE VARIANTES

Le problème central n’est pas que la carte actuelle est mauvaise.

Le problème est qu’elle traite visuellement presque tout de la même manière.

Créer une architecture propre avec une base commune et plusieurs niveaux de présentation.

## 8.1 Ne pas créer 12 composants complètement séparés

Préférer :

```text
DecisionCardShell
+
visualVariant
+
importance
+
rarity
+
chainState
+
category
```

ou architecture équivalente.

Maintenir :
- cohérence ;
- testabilité ;
- responsive ;
- accessibilité.

## 8.2 Taxonomie minimale à implémenter

### Routine
- crème/paper
- liseré discret
- animation minimale
- aucune dramatisation inutile

### Important / Major
- accent plus présent
- typographie/eyebrow plus affirmé
- changement subtil de bordure/surface
- pas de plein écran dramatique

### Decisive
- traitement plus fort
- bandeau navy/or ou framing renforcé
- indication explicite de l’importance
- mise en scène courte à l’entrée

### Rare
- signature visuelle reconnaissable immédiatement
- registre « flash info / édition spéciale »
- pas de lootbox
- pas d’effets néon
- pas de particules excessives
- rareté perceptible avant lecture

### Chain / Follow-up
- marqueur « Retour de dossier » ou équivalent
- rappel visuel de l’événement d’origine
- éventuellement acteur concerné
- impression claire qu’un ancien choix revient

### Second round
- environnement plus tendu
- signal clair d’entrée dans l’acte final
- réutiliser le vocabulaire électoral existant

### Government / Epilogue
- gabarit de rupture spécifique
- statut de président visible
- continuité visuelle avec la soirée électorale
- ne doit plus ressembler à une carte de mi-campagne

## 8.3 Priorités de surcharge visuelle

Si plusieurs états s’appliquent :

```text
government
> rare/decisive
> chain
> major
> routine
```

mais une chaîne rare doit pouvoir combiner subtilement les deux signaux.

Documenter la règle.

---

# 9. ÉVÉNEMENTS RARES — « FLASH INFO », PAS LOOTBOX

L’audit les note seulement `3,5/10` visuellement.

Objectif :
> avant même de lire, le joueur comprend qu’il voit quelque chose d’inhabituel.

Possible vocabulaire :
- bandeau « ÉDITION SPÉCIALE »
- ligne or
- icône dédiée
- transition courte
- surface navy partielle
- timestamp/news flash

Éviter :
- glow excessif ;
- pulsation infinie ;
- confettis ;
- gacha ;
- couleurs arc-en-ciel ;
- animation longue.

Tester :
- événement rare sérieux ;
- événement rare absurde ;
- rare chain.

Ils doivent rester cohérents mais pas identiques.

---

# 10. CHAÎNES NARRATIVES — RENDRE LA MÉMOIRE VISIBLE

L’audit fonctionnel a montré que les chaînes sont le contenu le plus fort du jeu.

Visuellement elles sont aujourd’hui notées `3/10`.

Créer un langage visuel de continuité.

À l’arrivée d’un follow-up, afficher par exemple :

```text
RETOUR DE DOSSIER
Il y a X décisions…
« Titre ou extrait du choix précédent »
```

ou une variante plus élégante.

Exigences :
- court ;
- pas de mur de texte ;
- doit provenir des données déjà disponibles ;
- aucun nouveau gameplay ;
- aucun spoiler ;
- doit aider à comprendre cause → conséquence.

Si l’identité d’acteur est connue :
- initiales ;
- mini-monogramme ;
- badge acteur ;
- petite signature.

Ne crée pas un système complexe de portraits photoréalistes dans cette mission.

---

# 11. CONSÉQUENCES — DONNER DU POIDS AUX EFFETS IMPORTANTS

Baseline :
une conséquence mineure et une conséquence majeure utilisent presque le même écran.

Créer plusieurs niveaux d’emphase, dérivés des données existantes.

Exemples :

### Minor
- transition simple
- pills existantes

### Significant
- titre plus marqué
- animation courte des valeurs
- indication avant/après si appropriée

### Major/Decisive
- framing fort
- changement visuel explicite
- animation de résultat plus marquée
- éventuellement résumé « tournant de campagne »

IMPORTANT :
ne révèle pas de données cachées ou probabilités.

Le niveau visuel doit venir d’informations déjà publiques ou d’un `importance` déjà existant.

---

# 12. GAME FEEL DES CHOIX

Baseline :
les options ressemblent à un questionnaire A/B/C.

Objectif :
réduire l’impression formulaire sans changer la neutralité des options.

À expérimenter :
- remplacer la lettre dominante par un numéro/repère plus discret ;
- transformer le bouton en « décision card row » ;
- augmenter le rôle du texte ;
- micro-feedback de sélection ;
- animation d’engagement courte ;
- distinction hover/pressed plus tactile.

Contraintes :
- toutes les options restent de poids visuel équivalent ;
- aucun choix ne doit paraître recommandé ;
- conserver excellente lisibilité ;
- conserver les tags de ton sans les rendre prescriptifs.

Tester au clavier et au tactile.

---

# 13. ANIMATIONS — AJOUTER DU SENS, PAS DE LA DÉCORATION

Baseline animations : `4/10`.

Créer une petite grammaire de mouvement.

## A. Interaction courante
100–180 ms :
- hover ;
- pressed ;
- sélection.

## B. Transition de carte
180–300 ms :
- fade/slide léger ;
- continuité.

## C. Événement important
250–450 ms :
- reveal du bandeau ;
- accent.

## D. Résultat électoral
500–900 ms :
- barres de classement révélées progressivement ;
- léger stagger.

## E. Victoire/climax
courte séquence dédiée, pas un écran animé pendant plusieurs secondes.

Respect obligatoire :
- `prefers-reduced-motion`
- toggle existant
- pas d’animation bloquante
- pas d’animation qui retarde systématiquement les clics.

---

# 14. ANIMATION DU CLASSEMENT ÉLECTORAL — PRIORITÉ FORTE

L’audit relève une incohérence :
les sondages ordinaires sont animés, mais le résultat électoral apparaît déjà rempli.

Corriger `ElectionRanking`.

Objectif :
- révéler les barres de façon lisible ;
- créer du suspense ;
- conserver résultat immédiatement compréhensible.

Approche :
- width 0 → valeur finale ;
- 600–800 ms ;
- stagger léger par candidat ;
- valeur numérique stable ou reveal synchronisé ;
- reduced motion = affichage immédiat.

Tester premier ET second tour.

---

# 15. GOUVERNEMENT / ÉPILOGUE — PRIORITÉ FORTE

C’est le plus gros écart mécanique/visuel de l’audit :

```text
importance mécanique 5/5
importance visuelle 1/5
```

La formation du gouvernement est le moment où le joueur réalise réellement sa victoire.

Créer un gabarit spécifique.

Il doit communiquer :
- « vous êtes désormais au pouvoir » ;
- changement de phase ;
- gravité institutionnelle ;
- récompense.

Réutiliser :
- navy ;
- or ;
- bandeau diagonal ;
- PartyMark ;
- langage du bilan.

Ne pas créer un nouveau style sans rapport avec le reste.

---

# 16. SECOND TOUR — ENTRÉE CLAIRE DANS L’ACTE FINAL

Baseline :
le résultat est bon, mais l’entrée dans le second tour ressemble à un débat normal.

Créer une rupture claire à l’entrée :

- écran court « ENTRE-DEUX-TOURS » ;
- duel visuel entre deux candidats/partis ;
- J−14 / phase finale ;
- soutiens/réserves si déjà publics ;
- ambiance plus forte.

Ne change pas le contenu du second tour.

Corriger également toute faute typographique ou apostrophe cassée observée dans le titre, si elle existe encore dans le HEAD actuel.

---

# 17. VICTOIRE VS DÉFAITE

Baseline :
- victoire 6,5/10
- défaite 7,5/10
- structure quasi identique.

Préserver absolument la dignité de la défaite.

Créer une différenciation subtile :

## Victoire
- chaleur/or plus présent ;
- léger accent lumineux ;
- formulation/ornement spécifique ;
- animation de score plus gratifiante.

## Défaite
- navy plus sobre ;
- accent argent/cream éventuel ;
- ne jamais désaturer au point d’être punitive ;
- conserver la qualité du bilan.

La différence doit être perceptible en 5 secondes.

---

# 18. DESIGN SYSTEM — NETTOYAGE CIBLÉ

## 18.1 Rayons

Le token `--radius` existe mais n’est pas utilisé.

Unifier :
- Card ;
- Dialog ;
- buttons ;
- panels.

Ne force pas strictement un seul rayon partout.
Créer une petite échelle sémantique si nécessaire :

```text
--radius-sm
--radius-md
--radius-lg
```

## 18.2 Animation de Dialog

La classe `animate-in` est actuellement morte sans plugin.

Choisir :
- implémentation CSS native existante ;
- ou dépendance justifiée ;
- ou retrait de la fausse classe.

Préférer une solution légère.

## 18.3 Icônes

Factoriser :
- `EVENT_ICONS`
- `CATEGORY_ICONS`

en une source de vérité commune.

## 18.4 Bouton compact

`min-h-9` = 36 px.

Corriger pour respecter la cible tactile 44 px dans les contextes tactiles.

Si desktop compact doit rester plus petit :
utiliser média query/pointer ou variante spécifique, sans dégrader mobile.

## 18.5 Liens footer

Augmenter zone tactile mobile sans nécessairement agrandir le texte.

---

# 19. STAT GAUGES — POLARITÉ SÉMANTIQUE

Problème :
toutes les jauges utilisent le même dégradé, y compris `Rejet`.

Créer une représentation sémantique contrôlée.

Exemples :
- favorable ;
- défavorable ;
- neutre.

Attention :
ne transforme pas l’UI en feu tricolore simpliste.

La polarité doit être :
- cohérente ;
- accessible ;
- doublée par texte/label ;
- pas uniquement couleur.

---

# 20. DESKTOP LARGE

À 1920×1080, plusieurs écrans laissent un vide important.

Ne fais pas simplement `max-width: 100%`.

Explorer :
- grille 12 colonnes ;
- carte principale légèrement plus large ;
- sidebar proportionnelle ;
- contenu contextuel ;
- recentrage optique.

Conserver une longueur de ligne confortable.

Tester :
- 1366×768
- 1440×900
- 1920×1080

Le 1366 actuel est déjà bon : ne le dégrade pas.

---

# 21. IDENTITÉ VISUELLE DU PARTI — DIFFUSION SUBTILE

`PartyMark` fonctionne très bien.

Ne crée pas 9 skins.

Utiliser la couleur du parti comme accent secondaire contrôlé :

- petite ligne ;
- badge ;
- halo subtil ;
- repère de sondage ;
- bordure secondaire.

Ne recolore pas tous les CTA selon le parti.

Le bleu principal doit conserver sa cohérence produit.

---

# 22. ACTEURS — CONTINUITÉ VISUELLE LÉGÈRE

L’audit note que les acteurs n’existent que comme noms.

Ne lance pas une production massive de portraits.

Créer un système léger :

- initiales ;
- monogrammes ;
- badges de rôle ;
- couleur relationnelle subtile ;
- mini « actor chip ».

Utiliser uniquement quand :
- l’acteur est récurrent ;
- la chaîne narrative le nécessite ;
- cela aide à reconnaître une relation.

Pas de portraits de personnes réelles générés automatiquement.

---

# 23. CALENDRIER — SENSATION D’ACCÉLÉRATION

La barre actuelle est linéaire et ne donne pas de sentiment d’accélération.

Sans modifier le calendrier réel :

ajouter une mise en scène par phase :

```text
PRÉ-CAMPAGNE
CAMPAGNE
DERNIÈRE LIGNE DROITE
1ER TOUR
ENTRE-DEUX-TOURS
```

Utiliser :
- libellé ;
- accent ;
- changement léger du header ;
- densité visuelle.

Ne manipule pas les dates.

---

# 24. SONDAGES — ÉTENDRE LE SUCCÈS DE `RaceBulletinScreen`

Le bulletin est l’un des meilleurs écrans.

Ne l’affiche pas partout en grand.

Créer éventuellement un mini état de course compact :
- position ;
- gap ;
- tendance ;
- « à portée / sous pression ».

Il doit rester discret.

Ne crée pas de dashboard permanent.

---

# 25. MOBILE — CONSERVATION DU « MOBILE NATIF »

L’audit conclut que le mobile est réellement natif.

Ne dégrade pas cet acquis.

Chaque nouvelle variante doit être testée à :
- 360×800
- 390×844
- 430×932

Vérifier :
- titres ;
- boutons ;
- bandeaux rares ;
- rappel chain ;
- government ;
- second tour ;
- dialogs ;
- tabs.

Pas de scroll horizontal non intentionnel.

---

# 26. ACCESSIBILITÉ — MESURE RÉELLE

L’audit précédent n’a pas mesuré les contrastes avec un outil dédié.

Cette passe doit le faire.

Utiliser un outil automatisé approprié si disponible :
- axe-core ;
- Playwright accessibility ;
- librairie de contraste ;
- autre outil local.

Vérifier :
- WCAG AA sur textes normaux ;
- focus ;
- labels ;
- reduced motion ;
- taille tactile ;
- couleur non unique ;
- animations.

Créer un rapport `accessibility-post.csv`.

---

# 27. VISUAL REGRESSION TESTING

Ajouter une suite de screenshots de référence ou snapshots visuels Playwright pour les écrans critiques.

Cibles minimales :

- routine card ;
- rare card ;
- chain card ;
- decisive card ;
- government ;
- result first round ;
- result second round ;
- victory ;
- defeat ;
- dashboard mobile ;
- title-long mobile.

Viewports :
- 390×844
- 1366×768
- au moins quelques cas 1920×1080.

Éviter des snapshots instables :
- seeds déterministes ;
- animations désactivées ou figées pendant screenshot ;
- dates déterministes ;
- fonts chargées.

---

# 28. NE PAS DÉGRADER LES ÉCRANS DÉJÀ EXCELLENTS

Préserver en priorité :

- accueil ;
- écran de lancement ;
- premier tour ;
- bilan final ;
- partage PNG.

Le but n’est pas de « refaire » ces écrans.

Utilise-les comme référence visuelle.

Si un changement global les dégrade :
revenir en arrière ou créer une variante ciblée.

---

# 29. SHAREABILITY

Le bilan final possède déjà une excellente carte partageable.

Ne réinvente pas ce système.

Optionnel si faible coût :
- permettre une capture dédiée d’un événement rare ;
- ou d’un résultat électoral spectaculaire.

Mais uniquement après tous les P1/P2.

Pas de scope creep.

---

# 30. PHASAGE OBLIGATOIRE

Travaille dans cet ordre :

## Phase A
Baseline + tests + captures.

## Phase B
Bugs mobile P1.

## Phase C
Architecture des variantes de DecisionCard.

## Phase D
Rare + chain.

## Phase E
Conséquences + game feel des choix.

## Phase F
Animations + ElectionRanking.

## Phase G
Second tour + government.

## Phase H
Victoire/défaite.

## Phase I
Design system + accessibilité.

## Phase J
Desktop large + accents parti + acteurs/calendrier si justifié.

## Phase K
Visual regression + playtests + audit post-refonte.

Après chaque phase :
1. lint/typecheck ciblé ;
2. tests ;
3. captures ;
4. vérification mobile/desktop ;
5. commit local atomique.

Ne pousse rien.

---

# 31. CRITÈRES D’ACCEPTATION QUANTITATIFS

Ne traite pas ces cibles comme des métriques à truquer.

Cibles indicatives :

```text
Premium Game Feel :
61/100 → >= 72/100 souhaité

Jeu vs web app :
5/10 → >= 7/10 souhaité

Cartes événements :
5/10 → >= 7/10

Conséquences :
5/10 → >= 7/10

Game feel :
5/10 → >= 7/10

Animations :
4/10 → >= 7/10

Rares :
3,5/10 → >= 7/10

Chaînes :
3/10 → >= 7/10

Second tour :
6/10 → >= 7,5/10

Victoire :
6,5/10 → >= 7,5/10
```

Mais :
- si une note n’augmente pas malgré une amélioration réelle, documenter ;
- ne jamais modifier la grille d’audit juste pour gagner des points.

---

# 32. CRITÈRES DE NON-RÉGRESSION

Doivent rester au minimum :

- Première impression >= 8/10
- Lisibilité >= 8/10
- Premier tour >= 8/10
- Défaite >= 7/10
- Bilan final >= 8/10
- Mobile >= 7/10
- aucun P0
- aucune troncature de texte
- aucune navigation cachée
- aucun scroll horizontal involontaire
- reduced motion fonctionnel
- build vert
- tests fonctionnels verts
- aucune règle gameplay modifiée.

---

# 33. PLAYTESTS POST-REFONTE

Jouer réellement via navigateur :

## Desktop
- une campagne complète
- une rare
- une chain
- premier tour
- second tour
- victoire ou défaite
- gouvernement si victoire

## Mobile
- une campagne complète à 390×844
- vérification 360×800
- dashboard
- rare
- chain
- résultat.

Comparer directement avec la baseline.

Pour chaque playtest :
- impression de jeu vs web app ;
- hiérarchie ;
- fatigue ;
- clarté ;
- animation ;
- climax ;
- bugs ;
- envie de continuer.

---

# 34. RAPPORT FINAL

Créer :

```text
FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md
```

Structure :

1. Résumé exécutif
2. Baseline post-gameplay
3. Bugs P1
4. Architecture DecisionCard
5. Événements rares
6. Chaînes narratives
7. Choix
8. Conséquences
9. Game feel
10. Animations
11. Élection
12. Second tour
13. Gouvernement
14. Victoire / défaite
15. Design system
16. Mobile
17. Desktop
18. Accessibilité
19. Visual regression
20. Playtests
21. Comparaison avant/après
22. Non-régressions
23. Problèmes ouverts
24. Verdict final

---

# 35. TABLEAU AVANT/APRÈS OBLIGATOIRE

| Domaine | Audit avant | Après | Δ | Verdict |
|---|---:|---:|---:|---|
| Qualité visuelle globale | 6,3 | | | |
| Premium Game Feel | 61/100 | | | |
| Jeu vs web app | 5/10 | | | |
| Direction artistique | 7/10 | | | |
| Hiérarchie | 6/10 | | | |
| Cartes événements | 5/10 | | | |
| Choix | 5,5/10 | | | |
| Conséquences | 5/10 | | | |
| Game feel | 5/10 | | | |
| Animations | 4/10 | | | |
| Tension visuelle | 6/10 | | | |
| Rares | 3,5/10 | | | |
| Chaînes | 3/10 | | | |
| Premier tour | 8,5/10 | | | |
| Second tour | 6/10 | | | |
| Victoire | 6,5/10 | | | |
| Défaite | 7,5/10 | | | |
| Bilan final | 8,5/10 | | | |
| Mobile | 7/10 | | | |
| Desktop | 6/10 | | | |
| Accessibilité | 7/10 | | | |
| Design system | 5,5/10 | | | |
| Immersion | 6/10 | | | |

---

# 36. VÉRIFICATIONS FINALES

Exécuter :

```bash
npm run format:check
npm run lint
npm run typecheck
npm run data:validate
npm run test
npm run build
npx playwright test
```

Puis la suite de visual regression.

Faire plusieurs runs si des flaky tests existent.

Afficher :

```bash
git status
git diff --stat
git log --oneline --decorate -n 20
```

Ne pousser aucun commit.

---

# 37. VERDICT TERMINAL OBLIGATOIRE

Afficher :

```text
FORM / GAME FEEL IMPROVEMENT — VERDICT

Premium Game Feel
Avant : 61/100
Après :
Verdict :

Jeu vs web app
Avant : 5/10 HYBRIDE
Après :
Verdict :

Cartes d’événements
Avant : 5/10
Après :
Verdict :

Événements rares
Avant : 3,5/10
Après :
Verdict :

Chaînes narratives
Avant : 3/10
Après :
Verdict :

Conséquences
Avant : 5/10
Après :
Verdict :

Animations
Avant : 4/10
Après :
Verdict :

Second tour
Avant : 6/10
Après :
Verdict :

Gouvernement
Avant : importance visuelle 1/5
Après :
Verdict :

Victoire
Avant : 6,5/10
Après :
Verdict :

Mobile
Avant : 7/10
Après :
Bugs P1 corrigés :
Verdict :

Desktop
Avant : 6/10
Après :
Verdict :

Accessibilité
Avant : 7/10 qualitatif
Après :
Contrastes mesurés :
Verdict :

Non-régressions
Gameplay inchangé :
Premier tour :
Défaite :
Bilan final :
Responsive :
Reduced motion :
Tests :
Build :

Commits locaux :
Fichiers majeurs modifiés :
Problèmes encore ouverts :
```

---

# 38. RÈGLE DE FIN

Ne déclare pas la mission terminée avant :

- correction des deux bugs P1 ;
- variants événements fonctionnels ;
- rare et chain réellement différenciés ;
- animation électorale en place ;
- government dédié ;
- tests mobile ;
- tests desktop ;
- reduced motion ;
- visual regression ;
- rapport final ;
- suite de tests propre.

Ne demande pas de validation intermédiaire à l’utilisateur.

Travaille de manière autonome jusqu’au verdict final.

Ne pousse rien vers le dépôt distant.
