# PROMPT MAÎTRE — AUDIT DE LA FORME, DE LA DIRECTION ARTISTIQUE, DU GAME FEEL ET DE L’EXPÉRIENCE VISUELLE
## Projet : « Vers l’Élysée »

Tu interviens comme **lead UI/UX designer de jeu**, **art director**, **game feel designer**, **product designer senior**, **front-end specialist Next.js/React/Tailwind**, **expert responsive/mobile-first**, **auditeur d’accessibilité** et **playtesteur visuel**.

Ta mission est volontairement différente des audits précédents.

Les audits déjà réalisés ont principalement vérifié le **fond fonctionnel du jeu** : moteur de simulation, diversité et impact des choix, événements aléatoires, chaînes narratives, rejouabilité, tension, identité mécanique des partis, second tour, agence du joueur, équilibre des campagnes et fun systémique.

Le présent audit doit répondre à une autre question :

> **Même si le moteur fonctionne et que le jeu est intéressant sur le fond, est-ce que sa présentation donne réellement l’impression de jouer à un jeu politique premium, moderne, clair et mémorable — ou à une application web fonctionnelle affichant des cartes et des statistiques ?**

Cette mission est centrée sur la direction artistique, la hiérarchie visuelle, l’identité graphique, le game feel, les animations, les transitions, la mise en scène, les feedbacks, l’ergonomie, la densité, la lisibilité, le responsive, la cohérence desktop/mobile, la perception de qualité, l’immersion politique et la mise en scène des moments de climax.

---

# 1. RÈGLE PRINCIPALE : AUDIT UNIQUEMENT

**Ne corrige rien pendant cette mission.**

Tu peux créer des scripts d’audit, tests Playwright, screenshots, séries de captures, rapports, tableaux et outils de mesure.

Tu ne dois PAS modifier les règles du jeu, le contenu des événements, les statistiques, les probabilités, l’équilibrage, la logique électorale, les textes de gameplay, le design final ou les animations de production dans le but de les améliorer.

L’objectif est d’établir un diagnostic fiable AVANT une future passe de refonte.

---

# 2. SOURCE DE VÉRITÉ

Lis intégralement les fichiers disponibles parmi :

- `AUDIT_FUN_REJOUABILITE.md`
- `FUN_IMPROVEMENTS_REPORT.md`
- `GAMEPLAY_AUDIT.md`
- `AUDIT_POST_CORRECTIONS.md`
- `POST_AUDIT_FIXES.md`
- `PARTY_GAMEPLAY_IDENTITIES.md`
- `V2_DECISIONS.md`
- `V2_CHANGELOG.md`
- README et documentation produit
- éventuelles maquettes/design docs existantes.

Le but est de comprendre quels moments sont mécaniquement importants, quels événements sont rares, quels événements forment des chaînes, quand le jeu entre en climax, quelles informations sont cachées et quelles différences entre partis sont intentionnelles.

**Ne ré-audite pas les mathématiques du moteur sauf lorsqu’elles sont nécessaires pour comprendre la présentation.**

---

# 3. ÉTAT INITIAL À CONSIGNER

Avant toute analyse, note :

- branche ;
- commit ;
- `git status` ;
- Node/npm ;
- stack UI exacte ;
- Tailwind/shadcn ou autres bibliothèques ;
- librairie d’icônes ;
- librairie d’animation ;
- polices ;
- système de couleurs ;
- variables CSS/tokens ;
- breakpoints ;
- composants réutilisés ;
- organisation des écrans de campagne.

Exécute :

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

et les E2E existants.

---

# 4. QUESTION CENTRALE

Le rapport doit répondre sans ambiguïté à :

> **Est-ce que le jeu a visuellement et interactionnellement le niveau de finition attendu d’un vrai jeu indépendant premium, ou ressemble-t-il encore trop à une web app / dashboard ?**

Puis :

1. La première impression donne-t-elle envie de jouer ?
2. Le jeu possède-t-il une identité graphique mémorable ?
3. Peut-on reconnaître une capture du jeu sans voir son titre ?
4. Le jeu ressemble-t-il à un jeu ou à un produit SaaS ?
5. Les événements importants paraissent-ils réellement importants ?
6. Les événements rares paraissent-ils rares ?
7. Les chaînes narratives semblent-elles connectées visuellement ?
8. Les conséquences donnent-elles une sensation de cause → effet ?
9. Les sondages produisent-ils de la tension visuelle ?
10. Le premier tour constitue-t-il un vrai climax visuel ?
11. Le second tour paraît-il être un nouvel acte ?
12. Une victoire est-elle mise en scène ?
13. Une défaite est-elle mise en scène ?
14. Les changements importants sont-ils perceptibles sans lire toutes les petites valeurs ?
15. Le joueur sait-il naturellement où regarder ?
16. Le mobile paraît-il conçu spécifiquement pour mobile ou simplement compressé ?
17. La densité d’information fatigue-t-elle ?
18. Les couleurs et composants sont-ils cohérents ?
19. Les animations renforcent-elles le sens ou ne sont-elles que décoratives ?
20. Quelles améliorations de forme produiraient le plus gros gain de qualité perçue ?

---

# 5. MÉTHODE D’AUDIT

Combiner obligatoirement :

### A. Inspection du code UI
Analyser l’architecture des composants, design tokens, variantes, responsive, animations, iconographie, affichage des événements, résultats, sondages, cartes, navigation, modales, onboarding, choix/création de parti, campagne, premier tour, second tour, épilogue, historique/succès.

### B. Playtests navigateur
Utiliser l’application réelle.

### C. Screenshots systématiques
Créer un corpus comparable.

### D. Analyse visuelle manuelle
Ne jamais se contenter d’un audit automatisé.

### E. Comparaison avec les objectifs produit
Évaluer la cohérence avec un jeu politique français, sérieux institutionnel, tension électorale, lisibilité rapide, partie courte, mobile-first, ton premium et légère stylisation.

---

# 6. MATRICE DE VIEWPORTS OBLIGATOIRE

Auditer au minimum :

```text
Mobile compact       : 360 × 800
Mobile moderne       : 390 × 844
Mobile large         : 430 × 932
Tablette portrait    : 768 × 1024
Desktop laptop       : 1366 × 768
Desktop standard     : 1440 × 900
Desktop large        : 1920 × 1080
```

Pour les écrans les plus critiques, comparer au moins 390×844, 1366×768 et 1920×1080.

---

# 7. PARCOURS À CAPTURER

Créer des captures propres pour :

1. écran d’accueil ;
2. disclaimer ;
3. choix du parti ;
4. création de parti ;
5. choix du profil/méthode de campagne ;
6. première carte d’événement ;
7. événement ordinaire ;
8. conséquence ordinaire ;
9. événement majeur ;
10. événement rare ;
11. événement appartenant à une chaîne ;
12. follow-up de chaîne ;
13. crise interne ;
14. interaction avec adversaire ;
15. sondages ;
16. situation proche de la qualification ;
17. pré-premier tour ;
18. résultats premier tour ;
19. élimination ;
20. entre-deux-tours qualifié ;
21. entre-deux-tours éliminé ;
22. débat final ;
23. résultat présidentiel ;
24. victoire ;
25. défaite ;
26. gouvernement/épilogue ;
27. bilan final ;
28. succès/historique si présents.

Pour chaque écran critique : desktop + mobile.

---

# 8. AUDIT DE LA PREMIÈRE IMPRESSION

Évaluer les 30 premières secondes.

Questions :

- Le joueur comprend-il immédiatement le concept ?
- Le CTA principal ressort-il ?
- L’identité française est-elle claire sans tomber dans le cliché bleu-blanc-rouge permanent ?
- L’écran paraît-il professionnel ?
- Existe-t-il un élément visuel signature ?
- L’utilisateur sait-il ce qu’il va faire ?
- La promesse ludique est-elle visible ?
- Le jeu donne-t-il envie de commencer immédiatement ?

Attribuer : impact visuel /10, clarté /10, originalité /10, qualité perçue /10, désir de jouer /10.

---

# 9. « JEU VIDÉO » VS « WEB APP »

C’est un axe central.

Rechercher les marqueurs de web app :

- cartes blanches uniformes ;
- dashboard permanent ;
- grilles de KPI ;
- boutons génériques ;
- composants shadcn reconnaissables sans customisation ;
- trop nombreux pills/badges ;
- menus SaaS ;
- densité de tableaux ;
- absence de mise en scène ;
- transitions instantanées ;
- feedbacks purement numériques.

Rechercher les marqueurs de jeu :

- progression ;
- anticipation ;
- révélation ;
- rythme ;
- transitions ;
- feedback ;
- changement d’état ;
- scénographie ;
- événements différenciés ;
- moments de climax ;
- narration visuelle ;
- tension.

Attribuer un indice :

```text
0 = dashboard SaaS
5 = hybride
10 = vrai jeu immédiatement identifiable
```

Justifier avec des captures précises.

---

# 10. DIRECTION ARTISTIQUE

Auditer palette, contraste, surfaces, fonds, ombres, bordures, rayons, gradients, iconographie, illustrations éventuelles, motifs, texture, typographie et densité.

Questions :

- Existe-t-il une vraie DA ou uniquement un design system propre ?
- Les écrans racontent-ils le même univers ?
- Les couleurs politiques dominent-elles trop ?
- Le bleu institutionnel est-il trop générique ?
- La DA paraît-elle moderne ?
- Existe-t-il trop de blanc/gris neutre ?
- Le rendu paraît-il premium ?
- Existe-t-il des éléments visuels distinctifs que l’on pourrait utiliser comme signature ?

---

# 11. TYPOGRAPHIE

Analyser famille(s), hiérarchie, poids, tailles, longueur des lignes, contraste, interlignage, capitales, nombres, sondages, titres, boutons et badges.

Question :

> Une carte peut-elle être scannée en 2 secondes avant d’être lue en détail ?

---

# 12. HIÉRARCHIE VISUELLE

Pour chaque écran critique, déterminer :

### Niveau 1
Ce que l’œil voit d’abord.

### Niveau 2
Ce que l’œil voit ensuite.

### Niveau 3
Informations secondaires.

Comparer cette hiérarchie avec ce qui DEVRAIT être important mécaniquement.

Créer un tableau :

| Écran | Priorité gameplay | Élément visuellement dominant | Aligné ? | Problème |
|---|---|---|---|---|

---

# 13. CARTES D’ÉVÉNEMENTS

Auditer dimensions, densité, titre, contexte, interlocuteur, importance, options, tags, CTA et lecture mobile.

Questions :

- Toutes les cartes se ressemblent-elles trop ?
- Un débat est-il visuellement différent d’une crise interne ?
- Un scandale est-il différent d’un déplacement ?
- Un événement mondial paraît-il distinct ?
- Une carte rare est-elle immédiatement reconnaissable ?
- Un événement décisif reçoit-il une mise en scène particulière ?
- Les événements de parti possèdent-ils une identité propre ?

Créer une taxonomie visuelle idéale :

```text
routine
important
major
decisive
rare
chain
second_round
result
```

Puis comparer avec l’état réel.

---

# 14. OPTIONS DE CHOIX

Analyser lisibilité, différenciation, taille des zones cliquables, texte, labels, iconographie, risque, ordre, hover, pressed, focus et feedback mobile.

Questions :

- Les choix ressemblent-ils trop à des boutons de formulaire ?
- Le joueur comprend-il le « ton » d’un choix ?
- Les choix dangereux paraissent-ils différents sans révéler les probabilités ?
- L’interface influence-t-elle involontairement la sélection via couleur/taille/position ?

Détecter tout dark pattern involontaire.

---

# 15. CARTE DE CONSÉQUENCE

Auditer la sensation :

```text
JE CHOISIS
→ QUELQUE CHOSE S’EST PASSÉ
```

Mesurer qualitativement délai, animation, transition, changement des stats, journal, texte, son si présent et haptique éventuelle.

Question fondamentale :

> Une conséquence importante « frappe-t-elle » suffisamment ?

Comparer effet mineur, effet majeur, perte, gain, contradiction, fracture interne et événement décisif.

---

# 16. GAME FEEL

Auditer clic, hover, sélection, loading, reveal, compteur, changement de sondage, progression temporelle, passage d’une carte à l’autre et changement de phase.

Attribuer /10 à :

- réactivité ;
- satisfaction ;
- fluidité ;
- poids des actions ;
- anticipation ;
- feedback.

Identifier les moments instantanés et plats, trop lents, trop animés ou satisfaisants.

---

# 17. ANIMATIONS

Inventorier les animations existantes : durée, easing, trigger, fréquence, fonction.

Classer :

- fonctionnelle ;
- narrative ;
- décorative ;
- nuisible.

Questions :

- Y a-t-il trop peu d’animation ?
- Trop ?
- Les mêmes transitions sont-elles utilisées partout ?
- Les moments importants ont-ils une animation spécifique ?
- Les transitions respectent-elles `prefers-reduced-motion` ?

---

# 18. SONDAGES ET TENSION

Auditer intention de vote, rang, écart au second, évolution, qualification, incertitude et momentum.

Le fun audit a montré que la tension mécanique n’est pas toujours alignée avec la fin de campagne.

Ici, ne modifie pas les chiffres.

Évalue :

> **La présentation actuelle exploite-t-elle au maximum la tension existante ?**

Vérifier micro-variations trop mises en avant, gros basculements pas assez visibles, manque de comparaison, absence de tendance, surcharge de chiffres, besoin éventuel d’un « race bulletin ».

---

# 19. TEMPS ET CALENDRIER

Le joueur doit sentir qu’il se rapproche de l’élection.

Auditer date, T−X, barre de progression, phases et changement de campagne.

Question :

> Peut-on sentir visuellement que la campagne s’accélère sans regarder la date ?

---

# 20. CHAÎNES NARRATIVES

Le fond fonctionnel a démontré que les chaînes sont le contenu le plus apprécié.

Auditer si leur FORME exploite cela.

Questions :

- Le joueur comprend-il qu’un ancien choix revient ?
- Le follow-up cite-t-il ou rappelle-t-il visuellement l’événement précédent ?
- Existe-t-il un indicateur de « conséquence d’un choix passé » ?
- Une rivalité récurrente est-elle reconnaissable ?
- Un acteur possède-t-il une identité visuelle persistante ?

Proposer éventuellement, sans implémenter :

- « Retour de dossier » ;
- mini-rappel visuel ;
- avatar/initiales ;
- fil narratif ;
- reprise de citation ;
- marqueur « conséquence différée ».

---

# 21. ÉVÉNEMENTS RARES

Auditer si la rareté est perceptible avant même de lire.

Évaluer cadre, fond, animation, transition, label, iconographie, son éventuel et rythme.

Un événement rare doit créer :

> « Oh, je n’avais encore jamais vu ça. »

sans donner l’impression d’un lootbox ou d’un jeu mobile agressif.

---

# 22. ACTEURS ET ADVERSAIRES

Auditer la présence humaine dans l’interface.

Questions :

- Les adversaires semblent-ils être des acteurs ou seulement des noms dans des tableaux ?
- Les rivaux récurrents sont-ils reconnaissables ?
- Les changements de relation sont-ils perceptibles ?
- Les acteurs fictifs internes possèdent-ils assez de continuité visuelle ?
- Le joueur peut-il savoir qui est important ?

Évaluer si portraits stylisés, avatars, initiales, silhouettes ou cartes de relation seraient utiles ou superflus.

---

# 23. IDENTITÉ VISUELLE DES PARTIS

Ne pas faire neuf thèmes complètement différents.

Auditer si le choix du parti change suffisamment l’atmosphère via accent color, éléments secondaires, icônes et framing.

Question :

> Sans changer toute l’interface, peut-on sentir légèrement quel parti on incarne ?

Attention à ne pas utiliser de logos officiels si leur licence n’est pas claire.

---

# 24. PREMIER TOUR

Auditer comme climax.

Avant : anticipation, dernier bulletin, transition.

Pendant : révélation des résultats, ordre, animation, suspense, carte, scores.

Après : qualifié, éliminé, transition.

Questions :

- Les résultats arrivent-ils trop brutalement ?
- Les chiffres sont-ils immédiatement lisibles ?
- La qualification produit-elle une émotion ?
- L’élimination produit-elle une émotion ?

---

# 25. SECOND TOUR

Le fond fonctionne bien.

Auditer la forme : changement d’ambiance, simplification à deux candidats, duel, soutiens, reports, débat, intensité.

Question :

> Visuellement, sait-on immédiatement que le jeu est entré dans sa phase finale ?

---

# 26. VICTOIRE

Auditer révélation, score, animation, texte, carte, résumé, sentiment de récompense, durée de la séquence et possibilité de partage.

Attribuer :

```text
Impact émotionnel victoire /10
```

---

# 27. DÉFAITE

La défaite est fonctionnellement bien traitée.

Auditer sa forme : dignité, compréhension, bilan, continuité, envie de rejouer.

Attribuer :

```text
Qualité de mise en scène défaite /10
```

---

# 28. BILAN FINAL

Auditer score /100, histoire, décisions importantes, trajectoire, idéologie, adversaires et résultat.

Questions :

- ressemble-t-il à un vrai écran de fin ?
- donne-t-il envie de partager ?
- permet-il de comprendre la campagne d’un coup d’œil ?
- le joueur pourrait-il faire une capture et l’envoyer à un ami ?

---

# 29. SOUND DESIGN / HAPTIQUE

Même si aucun son n’existe, auditer l’opportunité.

Identifier les moments où un feedback audio/haptique léger aurait un fort ROI :

- validation d’un choix ;
- gros changement de sondage ;
- événement rare ;
- résultat premier tour ;
- qualification ;
- victoire ;
- défaite.

Classer : indispensable / utile / facultatif / inutile.

---

# 30. MOBILE-FIRST RÉEL

Pour chaque écran mobile : largeur, scroll, CTA, zones tactiles, sticky elements, tabs, textes, densité, safe areas.

Créer une section spécifique :

```text
MOBILE NATIF OU DESKTOP COMPRESSÉ ?
```

Verdict obligatoire.

---

# 31. DESKTOP

Sur grand écran, vérifier trop de vide, dashboard trop dispersé, carte de jeu trop petite, navigation trop éloignée, largeur de lecture excessive ou contenu secondaire trop dominant.

Vérifier 1366 et 1920 séparément.

---

# 32. ACCESSIBILITÉ VISUELLE

Auditer contrastes WCAG, focus clavier, taille cible, zoom, reduced motion, couleur comme seul signal, lisibilité des badges, ARIA et navigation clavier.

---

# 33. COHÉRENCE DU DESIGN SYSTEM

Lister tailles de boutons, rayons, ombres, espacements, tags, cartes, modales, titres, couleurs et icônes.

Identifier variantes accidentelles, magic numbers, composants quasi identiques, styles divergents et composants trop génériques.

Créer :

```text
Cohérence design system /10
```

---

# 34. DENSITÉ ET FATIGUE

Repérer les moments où l’utilisateur peut passer en mode :

> « je clique sans vraiment regarder ».

Identifier la cause visuelle : trop de chiffres, trop de badges, cartes trop semblables, CTA répétitifs, manque de respiration.

---

# 35. « SCREENSHOT MOMENTS »

Lister les moments actuellement partageables : événement rare, résultat spectaculaire, victoire, bilan.

Attribuer :

```text
Shareability /10
```

---

# 36. AUDIT DE L’ICONOGRAPHIE

Vérifier cohérence du set, sens, répétition, taille, alignement et surcharge.

Signaler les icônes ambiguës, trop génériques, décoratives inutiles ou utilisées avec plusieurs sens.

---

# 37. ANALYSE « 5 SECONDES »

Pour accueil, choix parti, événement, conséquence, sondage, résultat premier tour, second tour, victoire et bilan final :

> Si l’utilisateur ne regarde cet écran que 5 secondes, que comprend-il ?

Comparer à ce qu’il DEVRAIT comprendre.

---

# 38. IMPORTANCE MÉCANIQUE VS IMPORTANCE VISUELLE

Créer une matrice :

```text
importance mécanique
vs
importance visuelle
```

Chercher surtout les événements importants mécaniquement mais faibles visuellement.

Lister les 20 plus gros écarts.

---

# 39. PLAYTESTS OBLIGATOIRES

Faire au minimum :

### Desktop
- Horizons ;
- Écologistes ;
- Reconquête.

### Mobile
- Renaissance ;
- Nouvelle Énergie.

Observer uniquement forme, rythme visuel, feedback, hiérarchie, fatigue, immersion et climax.

Pour chaque playtest :

```text
Première impression :
Lisibilité :
Immersion :
Game feel :
Événement le mieux mis en scène :
Moment le plus plat :
Premier tour :
Second tour :
Fin :
Note forme /10 :
```

---

# 40. GRILLE DE QUALITÉ VISUELLE

Attribuer /10 à :

1. Direction artistique
2. Première impression
3. Identité visuelle
4. Hiérarchie
5. Lisibilité
6. Cartes d’événements
7. Choix
8. Conséquences
9. Game feel
10. Animations
11. Sondages
12. Tension visuelle
13. Événements rares
14. Chaînes narratives
15. Premier tour
16. Second tour
17. Victoire
18. Défaite
19. Bilan final
20. Mobile
21. Desktop
22. Accessibilité
23. Design system
24. Immersion politique
25. Qualité perçue globale

---

# 41. ÉCHELLE DE VERDICT

Pour chaque domaine :

- EXCELLENT
- TRÈS BON
- BON
- CORRECT
- FAIBLE
- PROBLÉMATIQUE

---

# 42. SCORE « PREMIUM GAME FEEL »

Créer un score expérimental /100.

Exemple :

```text
15 — direction artistique
15 — hiérarchie / lisibilité
15 — game feel
10 — événements / choix
10 — mise en scène des conséquences
10 — climax électoral
10 — mobile
5  — animation
5  — immersion
5  — cohérence
```

Justifier les poids.

---

# 43. LIVRABLES

Créer :

```text
AUDIT_FORME_GAME_FEEL.md
```

Et :

```text
audit-results/form-audit/
  summary.json
  screen-audit.csv
  visual-hierarchy.csv
  importance-vs-presentation.csv
  responsive-issues.csv
  design-system-inconsistencies.csv
  accessibility.csv
  animation-inventory.csv
  screenshots/
    mobile/
    tablet/
    desktop/
  playtests/
  README.md
```

---

# 44. RAPPORT FINAL — STRUCTURE

1. Verdict exécutif
2. Méthodologie
3. Première impression
4. Direction artistique
5. Jeu vs web app
6. Design system
7. Typographie
8. Hiérarchie
9. Cartes d’événements
10. Choix
11. Conséquences
12. Game feel
13. Animations
14. Sondages et tension
15. Calendrier/progression
16. Chaînes narratives
17. Événements rares
18. Adversaires/acteurs
19. Identité des partis
20. Premier tour
21. Second tour
22. Victoire
23. Défaite
24. Bilan final
25. Mobile
26. Desktop
27. Accessibilité
28. Densité/fatigue
29. Shareability
30. Top 10 écrans
31. Bottom 10 écrans
32. Problèmes prioritaires
33. Recommandations
34. Verdict final

---

# 45. RECOMMANDATIONS

Classer :

### P0
Bloque l’utilisation.

### P1
Empêche le jeu de paraître premium ou détruit un moment clé.

### P2
Réduit fortement immersion, lisibilité ou game feel.

### P3
Amélioration notable.

### P4
Polish.

Pour chaque recommandation :

- problème ;
- capture concernée ;
- impact ;
- cause probable ;
- composant/fichier probable ;
- correction recommandée ;
- difficulté ;
- risque ;
- gain estimé ;
- test d’acceptation.

---

# 46. NE PAS PROPOSER UNE REFONTE GRATUITE

Toute recommandation doit partir d’un problème observé.

Ne recommande pas automatiquement glassmorphism, gradients, 3D, illustrations, dark mode, animations partout, grandes photos ou effets néon.

---

# 47. DISTINGUER « PLUS JOLI » ET « MEILLEUR JEU »

Pour chaque recommandation, préciser :

```text
Type :
- esthétique pure
- lisibilité
- immersion
- game feel
- compréhension
- tension
- climax
```

Prioriser les modifications qui améliorent plusieurs dimensions.

---

# 48. TOP 10 — ROI VISUEL / GAME FEEL

À la fin du rapport, produire les 10 changements qui apporteraient environ 80 % du gain de qualité perçue, classés selon :

- gain qualité perçue ;
- gain ludique ;
- coût de développement ;
- risque.

---

# 49. TROIS DIRECTIONS VISUELLES FUTURES

Sans implémenter, proposer 3 directions visuelles possibles.

Pour chacune :

- nom conceptuel ;
- principes ;
- palette ;
- typographie ;
- cartes ;
- sondages ;
- événements rares ;
- climax électoral ;
- mobile ;
- avantages ;
- risques.

Puis recommander UNE direction.

Familles possibles à considérer, sans les recopier aveuglément :

### A. « Soirée électorale premium »
Plateaux d’élections, infographies TV modernes, data journalism.

### B. « Carnet de campagne »
Presse, notes, dossiers, coupures, éditorial moderne.

### C. « War room présidentielle »
Cartes, briefing, sondages, équipe de campagne, écrans de situation.

Le choix final doit découler de l’état réel du jeu.

---

# 50. VERDICT TERMINAL

Afficher :

```text
AUDIT FORME / GAME FEEL — VERDICT

Qualité visuelle globale : X/10
Premium game feel : X/100
Jeu vs web app : X/10
Direction artistique : X/10
Hiérarchie : X/10
Cartes d’événements : X/10
Conséquences : X/10
Game feel : X/10
Animations : X/10
Tension visuelle : X/10
Premier tour : X/10
Second tour : X/10
Victoire : X/10
Défaite : X/10
Mobile : X/10
Desktop : X/10
Immersion : X/10

Le jeu ressemble-t-il à un vrai jeu ?
OUI / PLUTÔT OUI / HYBRIDE / PLUTÔT WEB APP / WEB APP

Plus grande force :
Plus grande faiblesse :
Moment le mieux mis en scène :
Moment le moins bien mis en scène :
Écran le plus réussi :
Écran à refaire en priorité :

TOP 5 corrections prioritaires :
1.
2.
3.
4.
5.

Direction visuelle recommandée :
```

---

# 51. FIN DE MISSION

Avant de terminer :

- réexécuter tests/build ;
- vérifier que les règles du jeu n’ont pas changé ;
- vérifier `git diff` ;
- ne conserver que l’outillage d’audit et les résultats ;
- ne pousser aucun commit distant.

Ne commence aucune refonte.

Le livrable final doit permettre de rédiger ensuite un **prompt de refonte visuelle ciblé et fondé sur des preuves**, et non une refonte basée sur des goûts arbitraires.

Commence immédiatement.
