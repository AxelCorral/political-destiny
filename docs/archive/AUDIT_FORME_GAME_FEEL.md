# AUDIT_FORME_GAME_FEEL — « Vers l'Élysée » : le jeu ressemble-t-il à un jeu ?

Audit exécuté selon `PROMPT_CLAUDE_CODE_AUDIT_FORME_GAME_FEEL.md`. Contrairement aux audits
précédents (`AUDIT_FUN_REJOUABILITE.md`, `FUN_IMPROVEMENTS_REPORT.md`, `GAMEPLAY_AUDIT.md`,
`AUDIT_POST_CORRECTIONS.md`, `POST_AUDIT_FIXES.md`), qui ont vérifié le **fond** (moteur, choix,
équilibrage, rejouabilité, tension mécanique, identité mécanique des partis), cette mission évalue
exclusivement la **forme** : direction artistique, hiérarchie visuelle, game feel, animations,
mise en scène, responsive, qualité perçue. **Aucune règle du jeu, probabilité, statistique ou
contenu d'événement n'a été modifié.** Aucun commit n'a été poussé vers un dépôt distant (aucun
`remote` n'est configuré sur ce dépôt).

---

## 1. Verdict exécutif

**Le jeu a une vraie direction artistique et des moments de mise en scène réellement forts — mais
sur 90 % du temps de jeu, il se comporte comme un formulaire de campagne bien habillé plutôt que
comme un jeu.** Les trois écrans de rupture (accueil, écran de lancement, soirées électorales) et
le bilan final atteignent un niveau de finition premium, sincèrement comparable à un vrai jeu
indépendant. Entre ces pics, la boucle quotidienne — une carte blanche, un titre, trois boutons
lettrés A/B/C, un clic, une carte de conséquence — ne varie jamais de gabarit, quelle que soit la
catégorie de l'événement (routine, majeur, rare, chaîne narrative, crise, épilogue de victoire).
C'est le même constat, sous un angle différent, que celui de `GAMEPLAY_AUDIT.md` (« ressemble à
une web app affichant des cartes et des statistiques ») — cette mission le confirme, le mesure
précisément et y ajoute deux bugs de rendu concrets et une liste chiffrée d'écarts entre
importance mécanique et importance visuelle.

Deux bugs réels ont été trouvés et documentés avec capture (voir §35 et
`audit-results/form-audit/responsive-issues.csv`) :

- La barre d'onglets du tableau de bord tronque son 4ᵉ onglet sans indice de défilement à
  360-390 px — **déjà connu** (`GAMEPLAY_AUDIT.md` §23), toujours présent.
- Le titre d'un événement de parti (Nouvelle Énergie) est **visuellement coupé au milieu d'un
  mot** à 390 px — **nouveau, découvert par cette mission**.

Score « Premium game feel » : **61/100** (détail et pondération en §34). Indice « jeu vs web
app » : **5/10 — HYBRIDE** (détail en §5).

## 2. Méthodologie

1. Lecture intégrale des sources de vérité fonctionnelles listées en section 2 du prompt de
   mission (`AUDIT_FUN_REJOUABILITE.md`, `FUN_IMPROVEMENTS_REPORT.md`, `GAMEPLAY_AUDIT.md`,
   `AUDIT_POST_CORRECTIONS.md`, `POST_AUDIT_FIXES.md`, `PARTY_GAMEPLAY_IDENTITIES.md`,
   `V2_DECISIONS.md`, `V2_CHANGELOG.md`, `README.md`) pour identifier ce qui est mécaniquement
   important (chaînes narratives, rares, climax, information cachée, différences intentionnelles
   entre partis) avant de juger la forme.
2. État initial consigné : branche `codex/v2-audit-improvements`, commit
   `ff086df7aa92ff6a8edd3c04cdafba6ff335af8c`, arbre propre (hors le fichier de prompt lui-même),
   Node v24.16.0 / npm 11.13.0. `npm run lint`, `typecheck`, `test`, `build` et la suite E2E
   Playwright complète exécutés avant toute analyse (détail en §38).
3. Inspection directe du code UI : composants (`src/components/ui`, `src/components/game`),
   design tokens (`src/app/globals.css`), gabarits de carte d'événement
   (`src/features/campaign/event-decision-card.tsx`), écrans de campagne
   (`src/features/campaign/campaign-screens.tsx`), écran final
   (`src/features/results/final-screen.tsx`), tableau de bord
   (`src/features/campaign/campaign-dashboard.tsx`), onboarding
   (`src/features/onboarding/setup-screens.tsx`) — pas seulement les captures d'écran. Chaque
   affirmation « ce composant fait X » a été vérifiée dans le code, pas devinée depuis un
   screenshot.
4. Playtests navigateur réels (Edge via `playwright-cli`, jamais de simulation) sur un serveur
   `npm run dev` local : 5 campagnes complètes jouées manette-en-main (3 desktop : Horizons,
   Écologistes, Reconquête ; 2 mobile : Renaissance, Nouvelle Énergie), avec captures à chaque
   écran de transition.
5. Corpus systématique de captures : 57 captures PNG couvrant les 7 largeurs de la matrice
   obligatoire (360, 390, 430, 768, 1366, 1440, 1920) sur les écrans les plus critiques, et au
   minimum desktop + mobile sur chacun des ~28 écrans du parcours demandé. Organisées dans
   `audit-results/form-audit/screenshots/{mobile,tablet,desktop}/`.
6. Analyse visuelle manuelle de chaque capture (pas d'outil automatisé de détection visuelle) —
   conforme à l'exigence explicite du prompt (§5.D : « ne jamais se contenter d'un audit
   automatisé »).
7. Production de 7 tableaux CSV transversaux (`audit-results/form-audit/*.csv`) et d'un
   `summary.json`.
8. Rédaction de ce rapport, grille de qualité /10 × 25, score premium /100, top 10 ROI, 3
   directions visuelles futures, verdict terminal.

**Limites assumées** : les contrastes WCAG sont évalués qualitativement (lecture directe des
captures), pas mesurés avec un outil de contraste dédié — signalé explicitement dans
`accessibility.csv` (`A_VERIFIER`) plutôt que déclaré conforme sans preuve. Aucun lecteur d'écran
réel n'a été utilisé (même limite déjà documentée dans `V2_CHANGELOG.md`). Les 5 playtests
couvrent 5 des 9 partis existants (ceux imposés par le prompt) ; les 4 autres ont été observés
uniquement via le code et les captures ponctuelles, pas via une campagne complète jouée.

## 3. Première impression (30 premières secondes)

Évalué sur l'écran d'accueil (`screenshots/desktop/01-accueil__desktop-large_1920x1080.png` et
son équivalent mobile) et l'enchaînement jusqu'au premier choix.

- Le concept est immédiatement compris : titre « Vers l'Élysée », sous-titre « Une année. Une
  campagne. Trente décisions. », durée annoncée (10-15 min), deux CTA clairement hiérarchisés
  (« Lancer une campagne » en plein bleu, « Comment fonctionne la simulation ? » en contour).
- Identité française lisible sans étalage tricolore permanent : palette navy/or/rouge sombre
  institutionnelle, aucun bleu-blanc-rouge criard.
- Élément signature réel : le bandeau diagonal doré traversant le hero, repris ensuite à l'écran
  de lancement et au bilan final — c'est le seul motif graphique récurrent du jeu, et il
  fonctionne comme une signature discrète.
- Le joueur sait exactement ce qu'il va faire (« Lancer une campagne » → choix du parti → méthode
  → jouer) ; aucune ambiguïté de parcours observée.

| Critère        | Note /10 |
| -------------- | -------- |
| Impact visuel  | 8        |
| Clarté         | 9        |
| Originalité    | 6        |
| Qualité perçue | 8        |
| Désir de jouer | 8        |

## 4. Direction artistique

Palette : `--navy-950/900`, `--blue-700/600/400`, `--gold-400/300`, `--red-800/700`,
`--cream-50`, `--slate-700/500`, plus des tokens sémantiques (`--surface`, `--ink`, `--line`,
`--success`, `--warning`, `--focus`) — un vrai système de tokens CSS, pas des couleurs Tailwind
génériques codées en dur (`src/app/globals.css`). Typographie : Inter pour le corps, une pile
condensée (« Arial Narrow », « Roboto Condensed », Impact) pour les titres via `.font-display` —
choix cohérent avec un registre « affiche électorale / gros titre de presse ».

- **Une vraie DA existe**, pas seulement un design system propre : la combinaison navy profond +
  or + condensé majuscule est reconnaissable et cohérente sur les écrans de rupture.
- **Les écrans ne racontent pas tous le même univers avec la même intensité** : les écrans de
  rupture (accueil, lancement, soirées électorales, bilan) exploitent pleinement navy+or ; la
  boucle de jeu quotidienne (90 % du temps passé) est presque entièrement crème/blanc/bleu clair,
  visuellement neutre.
- Le bleu institutionnel (`--blue-600`) est le CTA principal partout — cohérent, mais générique
  (le même bleu qu'on trouverait sur n'importe quel produit institutionnel ou bancaire).
- Beaucoup de blanc/crème neutre pendant la boucle de jeu : `--surface` (#f8f5ee) et `--paper`
  (#fffdf8) dominent visuellement plus que n'importe quelle couleur d'accent une fois en
  campagne.
- Rendu premium confirmé sur les écrans de rupture (ombres douces, rayons généreux, typographie
  massive) ; rendu plus neutre/générique pendant la boucle (voir §9).
- Élément distinctif exploitable comme signature : le bandeau diagonal or, et l'emblème coloré à
  motif de chaque parti (voir §19).

**Verdict : BON.**

## 5. Jeu vs web app

Indice mesuré : **5/10 — HYBRIDE**, justifié capture à l'appui.

Marqueurs de web app relevés :

- Cartes blanches uniformes (`Card` : `rounded-[1.25rem] border bg-[var(--paper)] shadow`) —
  utilisée telle quelle pour 11 des 12 catégories d'événements, la liste des 9 partis, les fiches
  de parti, le tableau de bord, les archives.
- Grille de 3 cartes identiques pour choisir son point de départ
  (`screenshots/desktop/03-choix-point-depart__desktop-large_1920x1080.png`) — indiscernable
  d'une page de tarification SaaS dans sa composition (icône pastel + titre + description +
  lien).
- Choix A/B/C sous forme de boutons lettrés dans des rectangles à bordure — la forme la plus
  proche d'un formulaire/questionnaire de tout le jeu
  (`screenshots/desktop/08-premiere-carte-evenement__desktop-large_1920x1080.png`).
- Transitions instantanées entre la quasi-totalité des écrans (voir §13, §17).
- Tableau de bord en `Dialog` avec onglets — motif SaaS classique (« paramètres du compte »).

Marqueurs de jeu relevés :

- Rupture totale de palette aux moments de climax (soirées électorales, écran de lancement).
- Progression visible et sensation de calendrier qui s'accélère (voir §15).
- Scénographie réelle du bilan final (jauge de score, carte partageable).
- Identité de parti perceptible via l'emblème coloré (voir §19).
- Une narration écrite dense et cohérente (héritée du fond, pas de la forme, mais elle contribue
  à l'impression générale).

Le jeu bascule donc nettement du côté « jeu » à ses moments de rupture et nettement du côté « web
app » dans sa boucle quotidienne — d'où l'indice médian de 5/10 plutôt qu'un verdict tranché.

## 6. Design system

Analyse de `src/components/ui/{button,card,dialog}.tsx` et `src/components/game/*.tsx`.

- **Boutons** (`cva`) : 4 variantes (primary/secondary/ghost/danger) × 4 tailles
  (default/compact/large/icon), cohérentes et bien nommées.
- **Incohérence vérifiée** : le variant `compact` descend à `min-h-9` (36 px), sous la cible
  tactile de 44 px que le projet documente et respecte partout ailleurs
  (`V2_DECISIONS.md` D-009).
- **Rayons de bordure incohérents** : un token `--radius: 1.25rem` est déclaré dans
  `globals.css` mais **n'est utilisé nulle part** (0 occurrence de `var(--radius)` dans tout le
  code, vérifié par recherche exhaustive) ; `Card` code en dur `rounded-[1.25rem]` (la même
  valeur, dupliquée), `Dialog` code en dur `rounded-[1.4rem]` (une valeur différente et
  inexpliquée), et les boutons utilisent l'échelle Tailwind standard (`rounded-lg/xl/2xl`) sans
  rapport avec le token. Au moins 5 valeurs de rayon coexistent sans système commun.
- **Classe d'animation morte** : le fond du `Dialog` porte
  `data-[state=open]:animate-in`, mais **aucune dépendance `tailwindcss-animate` n'est installée**
  (absente de `package.json`, absente de `package-lock.json`, absente de `node_modules/tailwindcss`
  — vérifié directement). Cette classe ne produit aucune règle CSS : l'ouverture d'une modale est
  instantanée, sans fondu, malgré l'intention affichée dans le code.
- **Duplication de mapping d'icônes** : `EVENT_ICONS` (`event-decision-card.tsx`) et
  `CATEGORY_ICONS` (`campaign-screens.tsx`) redéfinissent séparément la même association des 12
  catégories d'événement vers une icône Lucide — une seule source de vérité serait plus sûre.
- **Jauges sans polarité sémantique** : `StatGauge` applique le même dégradé bleu→or à toutes les
  statistiques, y compris celles dont la hausse est défavorable (ex. « Rejet ») — aucune
  différenciation visuelle entre une stat qu'on veut voir monter et une qu'on veut voir baisser.

Détail complet dans `audit-results/form-audit/design-system-inconsistencies.csv`.

**Cohérence design system : 5,5/10.**

## 7. Typographie

Hiérarchie à 2 registres : `.font-display` (condensé, majuscules, noir) pour les titres
d'écran/carte, Inter pour le corps de texte et les libellés. Les titres d'événement utilisent
`text-4xl`/`text-5xl` avec `leading-[0.98]` (interlignage très serré, cohérent avec l'esprit
« gros titre de presse ») — mais c'est ce même interlignage serré combiné à `overflow-hidden` sur
`Card` qui cause le bug de troncature documenté en §9/§32 lorsqu'un mot long ne casse pas
proprement sur mobile.

> Une carte peut-elle être scannée en 2 secondes avant d'être lue en détail ?

**Oui, sur desktop et dans la quasi-totalité des cas mobiles** : catégorie (pastille + icône),
titre en gros caractères, puis 2-4 choix bien séparés visuellement. L'exception est le bug de
troncature identifié, qui rend un titre illisible en l'état plutôt que simplement dense.

## 8. Hiérarchie visuelle

Tableau complet dans `audit-results/form-audit/visual-hierarchy.csv` (10 lignes). Constat
principal : la hiérarchie **macro** (titre > texte de contexte > choix) est bonne et constante sur
tous les écrans. La hiérarchie **méso** — qu'est-ce qui devrait dominer visuellement _entre_
plusieurs écrans selon leur importance mécanique — est quasiment absente : un événement mineur de
campagne et l'épilogue de victoire présidentielle utilisent exactement le même poids visuel de
titre, la même taille de carte, le même traitement.

## 9. Cartes d'événements

Un seul gabarit visuel (`StandardDecisionCard`) sert 11 des 12 catégories d'événement
(campagne, média, programme, interne, alliance, monde, scandale, parti, rare, entre-deux-tours,
gouvernement). Seule la catégorie « débat » reçoit un second gabarit
(`DebateDecisionCard`, fond navy). Concrètement :

- Un scandale n'est **pas** visuellement différent d'un déplacement de campagne.
- Un événement mondial n'est **pas** visuellement distinct d'une crise interne.
- Un événement rare est identifiable **uniquement** par une petite icône Sparkles dans la
  pastille de catégorie — même carte, même taille de titre, aucun cadre ni fond dédié.
- Un événement décisif ne reçoit aucune mise en scène particulière.
- Les événements de parti ont une identité de **texte** propre (voir `PARTY_GAMEPLAY_IDENTITIES.md`)
  mais aucune identité **visuelle** propre au-delà du texte.

Taxonomie idéale du prompt vs état réel :

| Catégorie visée | Gabarit réel observé                                                     |
| --------------- | ------------------------------------------------------------------------ |
| routine         | StandardDecisionCard                                                     |
| important       | StandardDecisionCard (identique)                                         |
| major           | StandardDecisionCard (identique)                                         |
| decisive        | StandardDecisionCard (identique)                                         |
| rare            | StandardDecisionCard + 1 icône différente                                |
| chain           | StandardDecisionCard (identique, aucun rappel)                           |
| second_round    | StandardDecisionCard ou DebateDecisionCard (identique à un débat normal) |
| result          | ElectionNightScreen (seul cas réellement différencié)                    |

**Verdict : PROBLÉMATIQUE** sur la différenciation par catégorie ; le seul palier de rupture
visuelle réussi est « campagne » vs « résultat électoral ».

## 10. Choix

Options rendues comme des boutons rectangulaires larges (`min-h-16` desktop / `min-h-20` sur les
cartes de débat), lettre A/B/C dans un badge, texte du choix en gras, indice public optionnel en
dessous, tag secondaire (PRUDENT/RISQUÉ/CLIVANT/etc.) en petite pastille. Cible tactile large et
confortable sur mobile, feedback de sélection clair (bordure bleue + `bg-blue-50` sur le choix
retenu, `opacity-50` sur les autres).

- Les choix ressemblent-ils à des boutons de formulaire ? **Oui, structurellement** — la lettre +
  rectangle + texte est le langage visuel d'un quiz, pas d'un dialogue de jeu narratif.
- Le joueur comprend-il le « ton » d'un choix ? Oui, via le tag secondaire (texte, jamais
  décoratif) — conforme à `V2_DECISIONS.md` D-003 qui interdit explicitement de laisser le tag
  piloter la présentation.
- Aucun dark pattern involontaire détecté : les 3-4 options d'un même événement ont une taille de
  bouton identique, aucune n'est visuellement mise en avant par la couleur, la taille ou la
  position pour orienter le choix.

## 11. Conséquences

`OutcomeScreen` : icône neutre, mot-clé « Conséquence », titre, narration, pastilles d'effets
colorées par tonalité (vert/rouge/neutre), bloc de succès débloqué le cas échéant, bouton
« Continuer ». La sensation JE CHOISIS → QUELQUE CHOSE S'EST PASSÉ fonctionne au niveau du texte
(narration bien écrite, effets nommés) mais **pas au niveau visuel** : une conséquence mineure et
une conséquence majeure (un gain de 1 point vs un basculement de 8 points) produisent exactement
la même mise en page, la même taille de pastille, la même absence d'animation d'entrée.

> Une conséquence importante « frappe »-t-elle suffisamment ? **Non — le texte porte tout le
> poids, la forme n'ajoute aucune emphase proportionnelle à l'ampleur de l'effet.**

## 12. Game feel

| Critère           | Note /10 |
| ----------------- | -------- |
| Réactivité        | 7        |
| Satisfaction      | 5        |
| Fluidité          | 6        |
| Poids des actions | 4        |
| Anticipation      | 4        |
| Feedback          | 5        |

Moments plats et instantanés identifiés : sélection d'un choix (transition générique 150 ms,
correcte mais générique), ouverture du tableau de bord (modale sans fondu — classe morte, §6),
apparition des barres de classement électoral au premier/second tour (**aucune** transition —
elles apparaissent déjà pleines, voir §17). Aucun moment jugé « trop animé ». Le seul élément
réellement satisfaisant retrouvé dans le jeu est la jauge circulaire de score du bilan final, qui
scale visuellement avec la performance réelle (voir §22).

## 13. Animations

Inventaire complet dans `audit-results/form-audit/animation-inventory.csv` (7 animations
recensées). Résumé :

| Élément                            | Durée                          | Fonction                     | `prefers-reduced-motion` |
| ---------------------------------- | ------------------------------ | ---------------------------- | ------------------------ |
| Barre de sondage                   | 700 ms                         | fonctionnelle                | respecté                 |
| Jauge de statistique               | 500 ms                         | fonctionnelle                | respecté                 |
| Barre de progression du calendrier | 500 ms                         | fonctionnelle                | respecté (règle globale) |
| Survol bouton primaire             | 150 ms                         | décorative utile             | respecté                 |
| Sélection d'un choix               | 150 ms                         | fonctionnelle                | respecté (règle globale) |
| Overlay de modale                  | classe morte, 0 ms réel        | **nuisible** (code trompeur) | sans objet               |
| Barres de classement électoral     | **aucune transition déclarée** | absente                      | sans objet               |

- Y a-t-il trop peu d'animation ? **Oui.** Le jeu a globalement très peu d'animations, et celles
  qui existent sont concentrées sur des barres de progression secondaires plutôt que sur les
  moments les plus mécaniquement importants.
- Trop ? Non, aucun excès observé.
- Les mêmes transitions sont-elles utilisées partout ? Oui — une seule transition générique
  (150 ms, propriétés par défaut de Tailwind) couvre l'essentiel des interactions.
- Les moments importants ont-ils une animation spécifique ? **Non — c'est l'inverse : l'écran de
  résultat électoral, le moment le plus important visuellement du jeu, est le seul endroit où
  une barre de classement s'affiche sans aucune transition.**
- `prefers-reduced-motion` est bien respecté globalement (règle CSS `!important` sur `*` dans
  `globals.css`, doublée d'un attribut manuel `data-reduce-motion`) — un vrai point fort, au-delà
  du minimum requis par `V2_DECISIONS.md` D-009.

## 14. Sondages et tension

`RaceBulletinScreen` (« État de la course ») est le meilleur exemple du jeu sur ce point : rang
explicite, écart chiffré et nommé au concurrent le plus proche (« avance de 0,6 % sur Les
Écologistes (3ᵉ) » ou « 0,6 % vous séparent de… »), pastille de tendance (+/− avec icône), classement
à barres colorées par parti, mini-carte régionale. Lors du playtest 1, cet écran a affiché un
classement à 4 partis en moins d'un point d'écart — la présentation en tire un vrai effet de
tension (« à portée du second tour »), conforme à l'esprit d'un vrai bulletin de soirée
électorale.

> La présentation actuelle exploite-t-elle au maximum la tension existante ?

**Oui pour le bulletin dédié, non pour le reste du jeu.** En dehors de cet écran spécifique (qui
n'apparaît qu'à certains paliers de décision), le joueur ne voit ses chiffres que dans la petite
colonne latérale (3 stats) ou dans le tableau de bord — aucune alerte visuelle, aucune couleur
d'urgence, aucun signal quand on approche du seuil de qualification en dehors du texte explicite
du bulletin. Pas de sur-affichage de micro-variations non plus (pas de bruit visuel excessif) —
le problème est une sous-exploitation, pas une surcharge.

## 15. Calendrier / progression

Le calendrier est affiché en permanence dans l'en-tête (« J − 365 » décroissant, barre de
progression fine bleue). Le nombre de jours restants est visible sans avoir à naviguer, et la
barre se remplit à mesure que les décisions avancent (transition 500 ms).

> Peut-on sentir visuellement que la campagne s'accélère sans regarder la date ?

**Non.** La barre de progression avance de façon strictement linéaire (proportionnelle au nombre
de décisions, pas au calendrier narratif), et aucun élément visuel (couleur, densité, rythme des
cartes) ne change entre le début et la fin de la campagne. Le rythme perçu vient entièrement du
texte (mentions d'« entre-deux-tours », de dates qui se rapprochent dans les libellés), jamais de
la forme.

## 16. Chaînes narratives

Le fond fonctionnel a établi que les chaînes sont le contenu le mieux noté du jeu (voir
`FUN_IMPROVEMENTS_REPORT.md` §4 : 4 événements rares passés d'« aucune chaîne » à
« exceptionnel » après l'ajout de suites narratives). La forme n'exploite **pas du tout** cet
acquis :

- Le joueur ne dispose d'aucun signal indiquant qu'un choix passé revient (observé en playtest 4 :
  un débat cite explicitement un adversaire via son nom et sa position passée dans le texte, mais
  rien à l'écran ne le distingue visuellement d'un événement sans lien).
- Aucun rappel visuel de l'événement déclencheur (pas de citation encadrée, pas de vignette de
  rappel).
- Aucun indicateur générique de type « conséquence d'un choix passé ».
- Une rivalité récurrente n'est identifiable que par le nom du personnage dans le texte — aucune
  fiche de relation, aucun avatar, aucune continuité visuelle.
- Aucun acteur (fondateur de parti, rival, allié) ne possède d'identité visuelle persistante
  au-delà de son nom écrit.

Pistes possibles, **non implémentées, à seule fin d'illustration** (conforme à la consigne « sans
implémenter ») : un bandeau « Retour de dossier » en haut de carte quand `chain`/`followUps` est
actif ; un court rappel visuel citant l'événement d'origine ; des initiales/avatar cohérents pour
un acteur nommé plusieurs fois ; un petit marqueur « conséquence différée » sur les effets qui
proviennent d'un `outcome.followUps` retardé.

## 17. Événements rares

Sur les 12 événements rares/légendaires actifs après la mission d'amélioration du fun (voir
`FUN_IMPROVEMENTS_REPORT.md` §4, §15), aucun ne reçoit de traitement visuel différencié au-delà
d'une icône Sparkles dans la pastille de catégorie — même carte, même taille de titre, même fond
crème que n'importe quel événement de routine. Le sentiment « Oh, je n'avais encore jamais vu ça »
que le prompt vise comme cible repose donc entièrement sur le texte (bien écrit, souvent
spectaculaire dans son contenu, cf. les captures d'événements rares du fun audit) et jamais sur la
forme. À l'inverse, le risque de sur-effet « lootbox » évoqué par le prompt est nul — il n'y a tout
simplement aucun effet, ni dans un sens ni dans l'autre.

## 18. Adversaires / acteurs

Aucun portrait, avatar, silhouette ou illustration de personnage nulle part dans le jeu — chaque
personnage (joueur, rivaux, fondateurs, cadres) n'existe que sous forme de nom écrit dans le
texte. Le seul élément visuel « humain » du jeu est l'emblème coloré du **parti** (monogramme +
symbole, voir §19), jamais du candidat individuel. Les changements de relation (alliance, rivalité,
trahison) sont uniquement lisibles dans le texte du fil d'actualité et dans l'onglet Programme du
tableau de bord — jamais sur la carte d'événement elle-même. Un joueur ne peut identifier « qui
est important » que par la fréquence à laquelle un nom revient dans les textes, pas par un signal
visuel dédié.

## 19. Identité visuelle des partis

Le point le plus positif de l'identité graphique du jeu : `PartyMark` génère un emblème abstrait
propre à chaque parti — dégradé de la couleur principale, bordure de la couleur secondaire, un
monogramme (2-3 lettres), un symbole de fond semi-transparent (▱ pour Horizons, ◎ pour Renaissance,
▲ pour Reconquête, etc.). Cet emblème est réutilisé de façon cohérente sur la liste des partis, la
fiche de parti, l'en-tête de campagne, le bulletin de sondage, les résultats électoraux et le
bilan final — un vrai fil visuel qui tient sur toute la partie.

> Sans changer toute l'interface, peut-on sentir légèrement quel parti on incarne ?

**Oui, mais seulement via cet emblème.** La couleur d'accent du parti n'irrigue **pas** le reste
de l'interface (boutons, fond de carte, barres restent dans la palette bleu/or générique quel que
soit le parti joué, vérifié sur les 5 playtests). L'identité de parti est donc réelle mais
cantonnée à un seul composant plutôt que diffusée en accent secondaire dans le reste de l'écran.
Aucun logo officiel utilisé — conforme à l'avertissement du prompt sur les questions de licence.

## 20. Premier tour

Climax le mieux exécuté du jeu, confirmé sur les 3 playtests desktop.

- **Avant** : aucune montée en tension formelle dédiée — la dernière carte avant la soirée
  électorale a la même apparence qu'une carte ordinaire.
- **Pendant** : bascule totale de palette (crème → navy/or), titre géant («&nbsp;Vous êtes au
  second tour&nbsp;» / «&nbsp;3ᵉ au premier tour&nbsp;»), score en gros chiffre doré, classement
  national à barres colorées par parti, carte régionale schématique. Lors du playtest 1, un
  classement à 4 partis en moins d'un point d'écart a produit un effet de suspense réel rien qu'à
  la lecture des barres.
- **Après** : transition claire vers l'entre-deux-tours ou vers le bilan, aucune ambiguïté.

> Les résultats arrivent-ils trop brutalement ? Un peu — aucune anticipation formelle avant
> l'écran, la bascule est immédiate (voir §13 : aucune animation de reveal sur les barres
> elles-mêmes, qui apparaissent déjà pleines).
> Les chiffres sont-ils immédiatement lisibles ? Oui, sans ambiguïté.
> La qualification produit-elle une émotion ? Oui, via le texte et le contexte (score serré) —
> jamais via la forme (pas de couleur ou d'effet spécifique à la qualification).
> L'élimination produit-elle une émotion ? Oui, texte digne, aucun ton moqueur, présentation
> identique en qualité à une qualification.

## 21. Second tour

> Visuellement, sait-on immédiatement que le jeu est entré dans sa phase finale ?

**Seulement au moment du résultat, pas à l'entrée.** Le débat d'entre-deux-tours réutilise
exactement le gabarit `DebateDecisionCard` d'un débat de mi-campagne ordinaire (même fond navy,
même structure) — seul le texte du titre (« Le débat de l'entre-deux-tours ») indique l'enjeu
particulier. À noter, bug de contenu confirmé lors du playtest 1 (déjà documenté par
`GAMEPLAY_AUDIT.md` comme catégorie de bug, ~30 occurrences à l'époque) : apostrophe manquante
dans ce titre précis (« Le débat de **l**ntre-deux-tours »). Le résultat du second tour, en
revanche, reprend la même mise en scène réussie que le premier tour (§20).

## 22. Victoire

Impact émotionnel victoire : **6,5/10.**

Confirmé sur les 3 playtests qui se sont soldés par une victoire (Écologistes, Renaissance,
Nouvelle Énergie) : titre fort et spécifique par partie (« Président de la République »), jauge
circulaire de score qui **scale réellement avec la performance** (comparé visuellement : ~81 %
d'arc doré à 81/100, ~41 % d'arc à 41/100 lors du playtest Reconquête — un des rares éléments du
jeu à offrir un vrai retour visuel proportionnel), résumé narratif citant un tournant concret de
la campagne, carte de résultat exportable en PNG. Ce qui limite la note : **la structure est
strictement identique à celle d'une défaite** (voir §23) — aucune couleur, aucun ornement,
aucune durée de séquence supplémentaire ne distingue formellement une victoire d'un échec digne.
Le seul signal de victoire est le texte du titre. Pas de partage natif testé au-delà du bouton
(fonctionnel, non vérifié pour son rendu final hors de l'app).

## 23. Défaite

Qualité de mise en scène défaite : **7,5/10.**

Confirmée sur 2 playtests (Horizons en défaite de second tour, Reconquête en élimination de
premier tour). Points forts : titres dignes et spécifiques (« Stratège sans couronne », « Parti
divisé »), aucun ton moqueur ni imagerie punitive, bilan chiffré complet (positions tenues,
alliances, contradictions, tournant retenu cité explicitement), continuité claire vers Rejouer/
Archives. C'est le point le plus solide déjà confirmé par `AUDIT_POST_CORRECTIONS.md` (« la
défaite est fonctionnellement bien traitée ») — cette mission confirme que la **forme** suit
également bien le fond sur ce point précis. La seule réserve : comme pour la victoire, la défaite
ne reçoit aucun traitement de palette distinct (toujours navy/or), ce qui la rend digne mais pas
davantage différenciée émotionnellement qu'une victoire dans sa seule mise en page.

## 24. Bilan final

Le meilleur écran du jeu, sans réserve majeure.

- Ressemble-t-il à un vrai écran de fin ? **Oui** — hero navy avec bandeau diagonal (même motif
  que l'accueil et le lancement, cohérence de signature confirmée), jauge de score circulaire
  proportionnelle, 4 cartes de statistiques (premier tour, second tour, progression,
  participation), graphique d'évolution des intentions de vote, décomposition « pourquoi ce
  score ? », badges débloqués.
- Donne-t-il envie de partager ? **Oui, littéralement** — une section dédiée « Partagez votre
  campagne » avec bascule Portrait/Paysage, aperçu de la carte de résultat générée (fond navy,
  titre, score, 3 indicateurs), boutons « Partager » et « Télécharger le PNG ». C'est exactement
  la fonctionnalité que la question du prompt appelait de ses vœux — **elle existe déjà**.
- Permet-il de comprendre la campagne d'un coup d'œil ? Oui — le premier tiers d'écran (titre +
  score + résumé en 4 phrases) suffit à saisir l'essentiel.
- Le joueur pourrait-il faire une capture et l'envoyer à un ami ? **Oui, sans même avoir besoin de
  faire sa propre capture d'écran** — le bouton dédié génère déjà une carte optimisée pour le
  partage.

## 25. Mobile

Vérifié pour chaque écran critique à 390×844 (et 360×800/430×932 pour les écrans les plus
sensibles) : largeur, scroll, CTA, zones tactiles, éléments collants, onglets, textes, densité.

- **Largeur / scroll** : aucun débordement horizontal observé sur l'ensemble des 21 captures
  mobiles de cette mission, hormis le contenu qui déborde _verticalement_ du fait du bug de
  troncature (§9, §35).
- **CTA** : toujours en pleine largeur ou clairement isolés en bas de carte, jamais perdus dans
  une grille dense.
- **Zones tactiles** : `min-h-11` (44 px) respecté sur les boutons de choix et la navigation
  principale ; non respecté sur le variant `compact` (36 px) et les liens de pied de page (§27).
- **Éléments collants** : aucun header/footer collant intrusif observé ; l'en-tête de campagne
  scrolle avec le contenu plutôt que de rester fixe en permanence — choix cohérent qui laisse plus
  de place à la lecture.
- **Onglets** : le seul cas d'onglets horizontaux du jeu (tableau de bord) est justement le seul
  point noir mobile confirmé (§9, §35, P1-2).
- **Densité** : aucune surcharge, la mise en page mobile reste toujours à une seule information
  principale par écran.

La colonne latérale (séquence, stats, dernière nouvelle), affichée **à côté** de la carte
d'événement sur desktop, passe **en dessous** sur mobile — un vrai choix de réorganisation, pas un
simple empilement mécanique de la grille desktop (playtest 4).

```
MOBILE NATIF OU DESKTOP COMPRESSÉ ?

Verdict : MOBILE NATIF (avec deux bugs ponctuels à corriger).

La mise en page mobile n'est pas une version réduite du desktop : la grille change de structure
(colonne latérale repositionnée sous la carte plutôt qu'écrasée à côté), le nombre de colonnes de
la liste de partis s'adapte (3 -> 2 -> 1 selon la largeur, vérifié à 1920/768/390), et aucun
texte n'est lu en dessous d'une taille confortable. Les deux bugs identifiés (onglets tronqués,
titre coupé) sont des défauts d'implémentation locaux, pas des symptômes d'une conception
"desktop d'abord, mobile en résidu" -- le reste du parcours mobile dément cette hypothèse.
```

Résumé chiffré : mise en page réellement recolonnée (pas juste réduite), textes non tronqués dans
l'immense majorité des cas, cibles tactiles majoritairement confortables. Deux bugs concrets
confirmés à 390 px (§9 dashboard, §32 titre tronqué, détaillés en §35).

## 26. Desktop

Vérifié séparément à 1366×768 et 1920×1080.

- **1366×768** : bonne utilisation de l'espace, carte principale + colonne latérale bien
  proportionnées, pas de vide excessif observé.
- **1920×1080** : vide résiduel net sous plusieurs écrans (accueil, choix du point de départ,
  carte d'événement) — la mise en page semble conçue pour ~1440 px de large et n'exploite pas
  l'espace supplémentaire au-delà (elle ne l'étire pas non plus de façon disproportionnée, elle le
  laisse simplement vide). Sur la carte d'événement, une colonne crème vide d'environ 350 px
  sépare le bord droit de la colonne latérale (300 px de large) du bord de la fenêtre.
- Aucune navigation jugée trop éloignée, aucun contenu secondaire jugé dominant.

## 27. Accessibilité visuelle

Détail complet dans `audit-results/form-audit/accessibility.csv` (11 critères). Points forts
vérifiés dans le code : `prefers-reduced-motion` respecté globalement (règle CSS `!important` sur
`*`, doublée d'un toggle manuel `data-reduce-motion`) ; focus clavier visible (`focus-visible:ring`
présent sur tous les composants interactifs inspectés) ; couleur jamais utilisée comme seul signal
(chaque pastille d'effet combine couleur et texte) ; emblèmes de partis avec `role="img"` et
`aria-label` explicite ; navigation icône avec `aria-label` malgré le texte masqué en `<sm`.
Points faibles vérifiés : le variant de bouton `compact` (36 px) et les liens du pied de page
sont sous la cible tactile de 44 px que le projet s'impose lui-même — ce dernier point est déjà
documenté dans `V2_CHANGELOG.md` (Phase H) comme non corrigé, toujours vrai à la lecture du code
actuel. Contraste non mesuré avec un outil dédié (limite assumée, §2).

## 28. Densité et fatigue

Aucun écran de la boucle de jeu principale n'a paru surchargé (2-4 choix maximum, une seule
question à la fois). Le seul moment de surcharge potentielle relevé : la toute première
conséquence de la partie (playtest 1) a débloqué **3 succès simultanément**, chacun avec titre +
description, en plus de l'effet narratif normal — un empilement d'informations sur un écran censé
célébrer une seule petite action. Le tableau de bord (onglet Synthèse) affiche 6 jauges + 6
indicateurs secondaires sur un seul écran, dense mais organisé en grille régulière, pas
chaotique. Aucun signe de mode « clic sans regarder » observé sur les 5 playtests — les choix
restent toujours peu nombreux et bien espacés.

## 29. Shareability

Shareability : **7,5/10.**

Moments actuellement partageables : le bilan final (carte PNG dédiée déjà fonctionnelle, voir
§24) est de loin le meilleur candidat et fonctionne déjà. Les écrans de résultat électoral (premier
et second tour) seraient également de bons candidats au partage (classement serré, gros chiffres)
mais ne proposent pas de bouton de capture dédié — seul le bilan final en dispose. Les événements
rares, malgré leur potentiel narratif fort, ne génèrent aucun artefact partageable (pas de carte,
pas de citation formatée).

## 30. Audit de l'iconographie

Un seul set cohérent (Lucide) utilisé pour toutes les icônes fonctionnelles (catégories
d'événement, navigation, stats, achievements). Tailles cohérentes (`size-4`/`size-5` selon le
contexte). Aucune icône décorative superflue relevée. Deux réserves mineures : (1) les icônes de
catégorie sont dupliquées dans deux fichiers séparés (§6, risque de divergence future plutôt que
problème actuel) ; (2) la navigation d'en-tête mobile n'affiche que des icônes sans texte
(Archives/Succès/À propos) — accessible au lecteur d'écran (`aria-label` présent) mais
potentiellement ambigu pour un utilisateur voyant découvrant le jeu pour la première fois sur
mobile, une icône « médaille » ou « bâtiment » n'étant pas universellement явна sans légende.

## 31. Analyse « 5 secondes »

| Écran                        | Compris en 5 s                                     | Devrait être compris                                                                  |
| ---------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Accueil                      | Concept + CTA + durée                              | ✓ aligné                                                                              |
| Choix du parti               | 9 mouvements disponibles, un nom + 2 forces chacun | ✓ aligné                                                                              |
| Carte d'événement            | Le sujet + qu'il faut choisir entre 3 options      | ✓ aligné, mais pas la rareté/l'importance de l'événement                              |
| Conséquence                  | Ce qui a changé (titre + 1-2 pastilles)            | ✓ aligné pour un effet simple, insuffisant pour un effet majeur (pas de poids visuel) |
| Sondage (bulletin)           | Rang, écart au concurrent, tendance                | ✓ très bien aligné                                                                    |
| Résultat premier tour        | Qualifié ou non, score                             | ✓ très bien aligné                                                                    |
| Second tour (débat d'entrée) | Qu'on est en phase finale                          | ✗ pas aligné — ressemble à un débat ordinaire                                         |
| Victoire/défaite             | Le résultat et un score /100                       | ✓ aligné pour le résultat, pas pour la distinction victoire/défaite au-delà du texte  |
| Bilan final                  | Score, tournant clé, envie de partager             | ✓ très bien aligné                                                                    |

## 32. Importance mécanique vs importance visuelle

20 écarts les plus importants listés et justifiés dans
`audit-results/form-audit/importance-vs-presentation.csv`. Les 5 plus significatifs :

1. **Formation du gouvernement (épilogue de victoire)** — importance mécanique maximale (5/5),
   importance visuelle minimale (1/5) : rendu comme un événement de mi-campagne quelconque alors
   qu'il s'agit du seul moment où le joueur devient effectivement président·e.
2. **Événement rare** — 4/5 vs 1/5 : rareté confirmée par simulation, aucun poids visuel dédié.
3. **Événement de chaîne narrative** — 4/5 vs 1/5 : contenu le mieux noté du fond fonctionnel
   (`FUN_IMPROVEMENTS_REPORT.md`), zéro signal visuel de continuité.
4. **Bug de troncature de titre mobile** (`party_nouvelle_energie_signature`) — un texte de jeu
   rendu litéralement illisible, découvert par cette mission (voir §9, §35).
5. **4ᵉ onglet du tableau de bord invisible sur mobile** — bug déjà documenté par
   `GAMEPLAY_AUDIT.md`, toujours non corrigé à la date de cet audit.

## 33. Grille de qualité visuelle

Notes /10 par domaine, échelle de verdict qualitative en regard (EXCELLENT / TRÈS BON / BON /
CORRECT / FAIBLE / PROBLÉMATIQUE), reprenant et consolidant les scores déjà justifiés section par
section ci-dessus.

| #   | Domaine                | Note /10 | Verdict  |
| --- | ---------------------- | -------- | -------- |
| 1   | Direction artistique   | 7        | BON      |
| 2   | Première impression    | 8        | TRÈS BON |
| 3   | Identité visuelle      | 6        | BON      |
| 4   | Hiérarchie             | 6        | BON      |
| 5   | Lisibilité             | 8,5      | TRÈS BON |
| 6   | Cartes d'événements    | 5        | CORRECT  |
| 7   | Choix                  | 5,5      | CORRECT  |
| 8   | Conséquences           | 5        | CORRECT  |
| 9   | Game feel              | 5        | CORRECT  |
| 10  | Animations             | 4        | FAIBLE   |
| 11  | Sondages               | 7,5      | BON      |
| 12  | Tension visuelle       | 6        | BON      |
| 13  | Événements rares       | 3,5      | FAIBLE   |
| 14  | Chaînes narratives     | 3        | FAIBLE   |
| 15  | Premier tour           | 8,5      | TRÈS BON |
| 16  | Second tour            | 6        | BON      |
| 17  | Victoire               | 6,5      | BON      |
| 18  | Défaite                | 7,5      | BON      |
| 19  | Bilan final            | 8,5      | TRÈS BON |
| 20  | Mobile                 | 7        | BON      |
| 21  | Desktop                | 6        | BON      |
| 22  | Accessibilité          | 7        | BON      |
| 23  | Design system          | 5,5      | CORRECT  |
| 24  | Immersion politique    | 6        | BON      |
| 25  | Qualité perçue globale | 6        | BON      |

Aucun domaine n'atteint EXCELLENT ni ne tombe en PROBLÉMATIQUE à l'échelle de cette grille
consolidée — cohérent avec le verdict d'ensemble « hybride » : le jeu n'échoue nulle part
gravement, mais n'atteint l'excellence que ponctuellement (premier tour, bilan final, première
impression), jamais sur la durée de la boucle de jeu.

## 34. Score « Premium Game Feel » (/100)

Pondération justifiée poste par poste, sur le modèle proposé par le prompt de mission :
domaine × poids, note ramenée sur 10 puis multipliée par le poids.

| Poste                          | Poids   | Note moyenne /10 utilisée      | Sous-score   |
| ------------------------------ | ------- | ------------------------------ | ------------ |
| Direction artistique           | 15      | 7 (grille #1)                  | 10,5         |
| Hiérarchie / lisibilité        | 15      | 7,25 (moyenne grille #4 et #5) | 10,9         |
| Game feel                      | 15      | 5 (grille #9)                  | 7,5          |
| Événements / choix             | 10      | 5,25 (moyenne grille #6 et #7) | 5,25         |
| Mise en scène des conséquences | 10      | 5 (grille #8)                  | 5            |
| Climax électoral               | 10      | 7,1 (moyenne grille #15-18)    | 7,1          |
| Mobile                         | 10      | 7 (grille #20)                 | 7            |
| Animation                      | 5       | 4 (grille #10)                 | 2            |
| Immersion                      | 5       | 6 (grille #24)                 | 3            |
| Cohérence                      | 5       | 5,5 (grille #23)               | 2,75         |
| **Total**                      | **100** |                                | **≈ 61/100** |

**Justification des poids** : direction artistique, hiérarchie/lisibilité et game feel pèsent le
plus lourd (15 chacun) car ce sont les trois dimensions qui déterminent le plus directement la
question centrale du prompt (« ressemble-t-il à un jeu premium ou à une web app ? ») et qui
s'appliquent à 100 % du temps de jeu, contrairement au climax qui ne concerne que quelques
écrans. Événements/choix, conséquences, climax et mobile pèsent 10 chacun car ce sont des
dimensions importantes mais plus ponctuelles ou déjà partiellement réussies (climax, mobile).
Animation, immersion et cohérence pèsent 5 chacun car ce sont des dimensions transverses qui
amplifient ou atténuent les autres postes sans porter, seules, l'impression d'ensemble.

Un score de 61/100 traduit un jeu qui a dépassé le stade « web app fonctionnelle » sur ses
fondations (lisibilité, direction artistique, climax) mais n'a pas encore franchi le seuil d'un
vrai jeu premium sur sa boucle quotidienne (game feel, animations, différenciation des
événements) — cohérent avec le verdict « HYBRIDE » de la section 5.

## 35. Problèmes prioritaires

### P0 — bloque l'utilisation

Aucun trouvé. Le jeu se joue de bout en bout sans blocage sur les 5 playtests et l'ensemble des
captures — cohérent avec les audits fonctionnels précédents qui n'avaient également trouvé aucun
P0.

### P1 — empêche le jeu de paraître premium ou détruit un moment clé

1. **Titre d'événement de parti tronqué au milieu d'un mot à 390 px**
   (`party_nouvelle_energie_signature`, « ENTREPRENDRE » → « ENTREPRENDRI »).
   - Capture : `screenshots/mobile/BUG-titre-tronque-mobile__party_nouvelle_energie_signature__390x844.png`
   - Impact : un texte de jeu devient littéralement illisible ; le seul bug de ce niveau trouvé
     sur les 5 playtests.
   - Cause probable : `leading-[0.98]` très serré sur un `h1` `text-4xl` combiné à
     `overflow-hidden` sur `Card`, quand le mot ne trouve pas de point de coupure avant la limite
     de largeur.
   - Composant/fichier probable : `src/features/campaign/event-decision-card.tsx`
     (`StandardDecisionCard`, classe `overflow-hidden` du `Card` + `leading-[0.98]` du `h1`).
   - Correction recommandée : autoriser plus de hauteur au titre sur mobile (retirer
     `overflow-hidden` du conteneur de titre ou l'appliquer seulement au `Card` global sans qu'il
     rogne le texte, augmenter légèrement `leading` en mobile) — **non implémenté dans cette
     mission, audit uniquement**.
   - Difficulté : faible. Risque : faible (changement CSS local). Gain estimé : élevé (bug visible
     dès la première rencontre de cet événement).
   - Test d'acceptation : afficher `party_nouvelle_energie_signature` à 360-430 px de large et
     vérifier que chaque mot du titre est entièrement visible, sans chevauchement de ligne.

2. **4ᵉ onglet du tableau de bord invisible sans indice de défilement à 360-390 px.**
   - Capture : `screenshots/mobile/10-tableau-de-bord__mobile-compact_360x800.png` et
     `mobile-moderne_390x844.png`.
   - Impact : une fonctionnalité entière (fil d'actualité de campagne) devient indécouvrable pour
     une partie significative des joueurs mobiles.
   - Cause probable : `overflow-x-auto` sans indice visuel de défilement (pas de dégradé de fondu,
     pas de flèche, pas de point indicateur).
   - Composant/fichier probable : `src/features/campaign/campaign-dashboard.tsx` (ligne du
     conteneur `role="tablist"`).
   - Correction recommandée : ajouter un dégradé de fondu sur le bord droit du conteneur
     d'onglets quand il déborde, ou compresser les libellés sur très petit écran — **non
     implémenté, audit uniquement**.
   - Difficulté : faible. Risque : faible. Gain estimé : élevé (déjà signalé une fois par
     `GAMEPLAY_AUDIT.md`, toujours vrai des mois plus tard).
   - Test d'acceptation : à 360 px de large, l'utilisateur doit voir un signal visuel clair
     (dégradé, flèche) indiquant qu'un 4ᵉ onglet existe au-delà du bord visible.

### P2 — réduit fortement immersion, lisibilité ou game feel

3. **Aucune différenciation visuelle entre catégories d'événement (rare, chaîne, décisif,
   routine).** Fichier probable : `event-decision-card.tsx`. Correction envisageable : 2-3
   variantes supplémentaires de `StandardDecisionCard` (accent de bordure ou bandeau supérieur
   différencié selon `rarity`/`isChain`/`importance`), sans réécrire tout le composant. Difficulté
   moyenne, risque faible (design additif), gain élevé (touche §9, §16, §17 simultanément).

4. **Aucune animation de reveal sur les barres de classement électoral**
   (`ElectionRanking` dans `campaign-screens.tsx`), alors que les barres de sondage courantes
   (`PollChart`) et les jauges de stats en ont une. Correction : ajouter
   `transition-[width] duration-700` (cohérent avec `PollChart`) + un léger décalage entre
   chaque ligne du classement. Difficulté faible, risque faible, gain élevé (c'est l'écran le
   plus regardé du jeu).

5. **Victoire et défaite partagent une mise en page rigoureusement identique** au-delà du texte.
   Fichier : `src/features/results/final-screen.tsx`. Correction envisageable : un accent de
   couleur différent (ex. dégradé légèrement plus chaud en victoire, plus sobre en défaite) sans
   changer la structure ni le ton digne déjà réussi de la défaite. Difficulté faible, risque
   faible à moyen (à calibrer pour ne jamais rendre la défaite punitive), gain moyen-élevé.

6. **Épilogue de gouvernement identique à un événement de mi-campagne.** Fichier :
   `event-decision-card.tsx` / `campaign-screens.tsx`. Correction envisageable : un gabarit
   dédié pour la catégorie `government` réutilisant l'esthétique navy/or du résultat électoral
   qui le précède immédiatement. Difficulté moyenne, risque faible, gain élevé.

### P3 — amélioration notable

7. Classe `animate-in` morte sur le `Dialog` (§6) — retirer la classe ou installer le plugin
   correspondant pour un vrai fondu d'ouverture. Difficulté très faible.
8. Rayons de bordure incohérents (§6) — unifier autour du token `--radius` déjà déclaré mais
   inutilisé. Difficulté faible.
9. Vide résiduel en desktop large ≥1440 px (§26). Difficulté moyenne (implique de revoir la
   grille de la carte principale).
10. Variant de bouton `compact` sous la cible tactile de 44 px (§27). Difficulté très faible.

### P4 — polish

11. Liens du pied de page sous la cible tactile de 44 px (déjà documenté, non corrigé).
12. Duplication de `EVENT_ICONS`/`CATEGORY_ICONS` (§6) — factoriser en une seule constante
    partagée.
13. Jauges de stats sans polarité sémantique (§6) — envisager une variante de couleur pour les
    stats « négatives » comme le Rejet.
14. Navigation d'en-tête mobile en icônes seules sans légende visible (§30).

## 36. Recommandations : top 10 ROI visuel / game feel

Classées par gain de qualité perçue × gain ludique, en tenant compte du coût et du risque. Chaque
recommandation part d'un problème observé et documenté ci-dessus — aucune n'est une refonte
esthétique gratuite (voir §46 du prompt).

| #   | Changement                                                                            | Type                       | Gain qualité perçue | Gain ludique | Coût        | Risque      |
| --- | ------------------------------------------------------------------------------------- | -------------------------- | ------------------- | ------------ | ----------- | ----------- |
| 1   | Corriger le titre tronqué (`party_nouvelle_energie_signature`, mobile)                | lisibilité                 | élevé               | moyen        | très faible | très faible |
| 2   | Indice de défilement sur la barre d'onglets mobile du tableau de bord                 | lisibilité, compréhension  | élevé               | moyen        | très faible | très faible |
| 3   | Animation de reveal sur les barres de classement électoral                            | game feel, climax          | élevé               | élevé        | faible      | très faible |
| 4   | Gabarit dédié pour l'épilogue de gouvernement (victoire)                              | climax, immersion          | élevé               | élevé        | moyen       | faible      |
| 5   | Différenciation visuelle minimale des événements rares (cadre/bandeau)                | immersion, climax          | élevé               | élevé        | moyen       | faible      |
| 6   | Différenciation visuelle minimale des événements de chaîne (rappel visuel)            | immersion, compréhension   | élevé               | élevé        | moyen       | faible      |
| 7   | Accent de couleur distinct victoire vs défaite (sans perdre la dignité de la défaite) | climax, esthétique pure    | moyen               | moyen        | faible      | moyen       |
| 8   | Retirer/remplacer la classe `animate-in` morte du Dialog                              | game feel                  | faible              | faible       | très faible | très faible |
| 9   | Unifier les rayons de bordure autour du token `--radius`                              | cohérence                  | faible              | nul          | faible      | très faible |
| 10  | Réduire le vide résiduel en desktop large (≥1440 px)                                  | esthétique pure, cohérence | moyen               | nul          | moyen       | faible      |

Ces 10 changements ciblent directement les écarts mesurés en §32/§9/§16/§17 plutôt que
d'introduire de nouveaux éléments décoratifs : ils touchent tous un problème déjà documenté par
une capture ou une lecture de code, pas une préférence esthétique.

## 37. Trois directions visuelles futures (sans implémentation)

Le choix ci-dessous découle de l'état réel observé : le jeu possède déjà, à l'état latent, une
esthétique « TV élection night » forte (navy/or, gros classements à barres, bulletin de sondage
façon data-journalisme) qui n'est exploitée qu'à quelques moments. Les trois directions explorent
des façons différentes de traiter cet acquis.

### A. « Soirée électorale premium » (recommandée)

- **Principes** : généraliser à toute la boucle de jeu l'esthétique déjà réussie des écrans de
  résultat (navy/or, gros chiffres, classements à barres) plutôt que de la réserver aux 3-4
  écrans de climax actuels.
- **Palette** : la palette existante (navy/gold/cream) ne change pas — elle est simplement
  utilisée plus tôt et plus souvent, avec le crème réservé aux moments de respiration (lecture)
  et le navy aux moments de décision à enjeu élevé (rare, décisif, second tour).
- **Typographie** : conserver le condensé majuscule actuel, déjà cohérent avec un habillage TV
  d'actualité.
- **Cartes** : un bandeau supérieur de couleur/intensité variable selon la catégorie
  (routine=fin liseré actuel, décisif/rare=bandeau plus épais et navy, chaîne=bandeau avec un
  petit rappel du titre précédent).
- **Sondages** : généraliser le format `RaceBulletinScreen` (déjà excellent) à un mini-résumé
  visible plus souvent, pas seulement à ses paliers dédiés.
- **Événements rares** : traiter comme un « flash info » — bref bandeau navy/or qui encadre la
  carte, cohérent avec le vocabulaire déjà établi par les soirées électorales.
- **Climax électoral** : ajouter l'animation de reveal manquante (#3 du top 10) — c'est le seul
  vrai manque de cette esthétique déjà là.
- **Mobile** : ne change rien à la réorganisation déjà correcte en une colonne (§25) ; seul le
  vocabulaire visuel des cartes évolue.
- **Avantages** : coût de développement le plus faible des trois pistes (étend un système déjà
  construit et déjà bien noté par cet audit, ne demande aucune nouvelle métaphore visuelle) ;
  cohérence immédiate avec l'identité déjà perçue par les joueurs aux moments forts.
- **Risques** : sur-utiliser le navy/or pourrait diluer son effet de rupture actuel si mal dosé —
  nécessite de conserver une vraie hiérarchie d'intensité entre routine et climax plutôt que de
  tout uniformiser.

### B. « Carnet de campagne »

- **Principes** : les événements deviennent des « dossiers de presse » — coupures, notes de
  briefing, éditorial. Registre plus littéraire/journalistique que TV.
- **Palette** : dominante papier/kraft plus prononcée, encre plutôt que couleurs vives, accents de
  parti en filigrane plutôt qu'en aplat.
- **Typographie** : une police serif éditoriale pour les titres plutôt que le condensé actuel —
  rupture de ton plus nette.
- **Cartes** : effet « coupure de presse » (bord irrégulier léger, tampon de catégorie).
- **Sondages** : présentés comme un encart statistique de journal plutôt que comme un graphique TV.
- **Événements rares** : un « dossier spécial » avec trombone/tampon visuel.
- **Climax électoral** : une « une » de journal plutôt qu'un plateau TV.
- **Mobile** : bon candidat pour du scroll long-form (lecture de dossier), cohérent avec le mobile
  déjà lecture-first du jeu.
- **Avantages** : différenciation forte vis-à-vis des jeux politiques déjà existants qui misent
  tous sur l'esthétique TV/plateau.
- **Risques** : demande une nouvelle police, de nouveaux motifs de texture, un travail de
  direction artistique bien plus large que la piste A ; risque de perdre en lisibilité rapide
  (contrainte forte du jeu, §7) si le style « coupure de presse » est mal exécuté.

### C. « War room présidentielle »

- **Principes** : esthétique de salle de crise/briefing stratégique — cartes, écrans de
  situation, notes d'équipe.
- **Palette** : plus sombre et technique en permanence (proche du navy actuel mais généralisé),
  accents façon "écran de contrôle".
- **Typographie** : monospace pour les données chiffrées, condensé pour les titres.
- **Cartes** : présentées comme des « fiches de briefing » avec minuteur/horodatage plus visible.
- **Sondages** : tableau de bord façon salle de crise, avec alertes visuelles sur les seuils
  critiques.
- **Événements rares** : alerte de type « flash » avec code couleur d'urgence.
- **Climax électoral** : compte à rebours et éléments de suivi en temps réel façon centre de
  contrôle.
- **Mobile** : plus difficile à décliner sans perdre en légèreté — un registre « salle de crise »
  dense convient mieux au grand écran.
- **Avantages** : cohérent avec le nom « Quartier général » déjà utilisé pour le tableau de bord.
- **Risques** : le plus éloigné du ton « premium mais léger » visé par le prompt (§5.E) ; risque
  de basculer vers un registre trop technique/dashboard, à l'opposé de l'objectif « moins web
  app ».

### Direction recommandée

**A. « Soirée électorale premium »** — parce qu'elle part de ce qui fonctionne déjà
manifestement le mieux dans le jeu actuel (les écrans de résultat, unanimement les mieux notés
dans cet audit et dans les playtests), coûte le moins cher à mettre en œuvre (extension d'un
système existant plutôt que nouvelle direction artistique), et répond directement aux écarts
mesurés les plus importants (§32 : rare, chaîne, épilogue, climax) sans jamais nécessiter une
refonte esthétique gratuite.

## 38. Fin de mission — vérifications

- `npm run lint` : succès, 0 avertissement.
- `npm run typecheck` : succès.
- `npm run test` : 155/156 (1 échec pré-existant déjà documenté par les missions précédentes,
  confirmé une fois de plus non lié à cette mission — passe 3/3 en isolation).
- `npm run build` : succès.
- Suite E2E Playwright (`npx playwright test`) : 17/18 exécutés avec succès ; 1 échec sur un
  scénario desktop dont la graine déterministe attendait une élimination de premier tour du PS et
  observe désormais une qualification — un effet de dérive d'une fixture de seed suite au
  rééquilibrage électoral d'une mission précédente (`FUN_IMPROVEMENTS_REPORT.md`), pas une
  régression introduite par cette mission qui n'a modifié aucune règle de jeu ; 6 scénarios
  mobiles suivants ignorés par dépendance de séquence au test en échec. Aucune correction
  apportée (hors du périmètre forme de cette mission).
- `git diff` / `git status` vérifiés : **aucun fichier sous `src/`, `scripts/` ou tout autre
  chemin de code n'a été modifié** pendant cette mission. Seuls ont été ajoutés : ce rapport
  (`AUDIT_FORME_GAME_FEEL.md`), le répertoire `audit-results/form-audit/` (captures, CSV,
  playtests, résumé), et le fichier de prompt de mission lui-même (déjà présent au démarrage).
- Aucun commit n'a été poussé vers un dépôt distant — aucun `remote` n'est configuré sur ce
  dépôt (`git remote -v` vide).
- Aucune règle de jeu, probabilité, statistique ou contenu d'événement n'a été modifié.

---

# VERDICT TERMINAL

```
AUDIT FORME / GAME FEEL — VERDICT

Qualité visuelle globale : 6,3/10
Premium game feel : 61/100
Jeu vs web app : 5/10
Direction artistique : 7/10
Hiérarchie : 6/10
Cartes d'événements : 5/10
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

Le jeu ressemble-t-il à un vrai jeu ?
HYBRIDE

Plus grande force :
  Les écrans de rupture (accueil, écran de lancement, soirées électorales, bilan final) —
  identité navy/or cohérente, mise en scène réellement premium, carte de résultat partageable
  déjà fonctionnelle.

Plus grande faiblesse :
  Un seul gabarit de carte pour 11 des 12 catégories d'événement — un événement rare, un
  événement de chaîne narrative et l'épilogue de victoire présidentielle sont visuellement
  indiscernables d'un événement de routine.

Moment le mieux mis en scène :
  La soirée électorale du premier tour (bascule totale de palette, classement serré à barres
  colorées, carte régionale).

Moment le moins bien mis en scène :
  La formation du gouvernement après une victoire (épilogue) — rendu comme un événement de
  mi-campagne quelconque alors qu'il est le sommet mécanique de toute la partie.

Écran le plus réussi :
  Le bilan final (FinalScreen) — jauge de score proportionnelle, résumé narratif, carte de
  résultat exportable en PNG déjà implémentée.

Écran à refaire en priorité :
  La carte d'événement standard (StandardDecisionCard) — pas à jeter, mais à décliner en
  quelques variantes selon la catégorie/l'importance plutôt que de rester un gabarit unique.

TOP 5 corrections prioritaires :
1. Corriger le titre tronqué au milieu d'un mot sur mobile (party_nouvelle_energie_signature, 390px)
2. Ajouter un indice de défilement à la barre d'onglets du tableau de bord mobile (bug connu, non corrigé)
3. Animer l'apparition des barres de classement électoral (premier et second tour)
4. Donner un gabarit visuel dédié à la formation du gouvernement (épilogue de victoire)
5. Différencier visuellement au moins les événements rares et les événements de chaîne narrative

Direction visuelle recommandée :
  A. « Soirée électorale premium » — généraliser à toute la boucle de jeu l'esthétique
  navy/or/data-journalisme déjà construite et déjà la mieux notée du jeu, plutôt que de la
  réserver aux 4 écrans de climax actuels.
```
