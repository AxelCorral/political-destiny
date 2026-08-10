# Baseline visuelle — mission de refonte de forme (post-gameplay)

## Identité de la baseline

- Commit de départ de cette mission : `73b41a6` (fin de
  `TARGETED_GAMEPLAY_PASS_REPORT.md`), branche `codex/v2-audit-improvements`.
- Vérifié explicitement (§1 du prompt) : `git diff --stat` entre le commit de fin de l'audit de
  forme (`6b709ed`) et ce commit de départ, restreint à `src/features`, `src/components` et
  `src/app`, est **vide**. La mission gameplay/fun ciblée n'a touché aucun fichier d'interface —
  confirmé fichier par fichier (`event-decision-card.tsx`, `campaign-screens.tsx`,
  `final-screen.tsx`, `globals.css`) par comparaison directe de leur contenu entre les deux
  commits (`diff` vide sur chacun).

## Pourquoi les captures sont réutilisées et non reprises depuis zéro

Puisque le code d'interface est bit-à-bit identique à celui audité par `AUDIT_FORME_GAME_FEEL.md`,
les 57 captures déjà produites pour cet audit (`audit-results/form-audit/screenshots/`) sont
directement valides comme baseline de cette mission — les reprendre aurait produit des fichiers
strictement identiques. Copiées ici telles quelles plutôt que régénérées.

## Résultats des vérifications de référence

Tous exécutés sur l'arbre au commit `73b41a6`, avant toute modification visuelle :

| Commande | Résultat |
| --- | --- |
| `npm run lint` | Réussi (0 avertissement) |
| `npm run typecheck` | Réussi |
| `npm run test` | Réussi — 182/182 (33 fichiers), suite stabilisée par la mission gameplay précédente |
| `npm run build` | Réussi |
| `npx playwright test` | 17/18 exécutés avec succès sur desktop ; 1 échec sur un scénario dont la seed déterministe (`e2e-ps-search-0`) produit désormais une qualification au lieu d'une élimination — dérive d'une fixture de seed causée par le rééquilibrage électoral d'une mission précédente (voir `TARGETED_GAMEPLAY_PASS_REPORT.md`), pas par cette mission qui n'a modifié aucune règle de jeu ; 6 scénarios mobiles suivants ignorés par dépendance de séquence au test en échec. Non corrigé ici : hors périmètre forme de cette mission. |

## Repères chiffrés de l'audit de forme à battre

Qualité visuelle globale 6,3/10 · Premium Game Feel 61/100 · Jeu vs web app 5/10 (HYBRIDE) ·
Direction artistique 7/10 · Hiérarchie 6/10 · Cartes d'événements 5/10 · Choix 5,5/10 ·
Conséquences 5/10 · Game feel 5/10 · Animations 4/10 · Tension visuelle 6/10 · Rares 3,5/10 ·
Chaînes 3/10 · Premier tour 8,5/10 · Second tour 6/10 · Victoire 6,5/10 · Défaite 7,5/10 ·
Bilan final 8,5/10 · Mobile 7/10 · Desktop 6/10 · Accessibilité 7/10 (qualitatif, non mesuré) ·
Design system 5,5/10 · Immersion 6/10.

Deux bugs P1 confirmés à corriger en premier (Phase B) : titre `party_nouvelle_energie_signature`
tronqué en plein mot à 390 px (capturé dans
`mobile/BUG-titre-tronque-mobile__party_nouvelle_energie_signature__390x844.png`) ; 4ᵉ onglet du
tableau de bord mobile invisible sans indice de défilement à 360-390 px.

## Couverture des captures

57 captures couvrant les 7 viewports requis (360×800, 390×844, 430×932, 768×1024, 1366×768,
1440×900, 1920×1080) et l'essentiel du parcours : accueil, choix de parti, écran de lancement,
carte d'événement (premiere-carte-evenement), conséquence ordinaire, tableau de bord (desktop et
mobile, y compris la version compacte 360 px), sondages/bulletin, chaîne d'événement spéciale
(`evenement-special-step1/7/8/9/10`), carte de débat, résultat premier tour, entre-deux-tours,
résultat second tour, bilan défaite, bilan victoire, gouvernement/épilogue.

**Limite assumée** : ce jeu de captures est organisé par écran de parcours, pas par niveau
mécanique d'`importance` (routine/major/decisive/rare). Il ne distingue donc pas explicitement une
carte "major" d'une carte "decisive", ni une conséquence "mineure" d'une conséquence "majeure" au
sens du champ `importance` — seule une conséquence "ordinaire" est capturée. La Phase C (architecture
des variantes de `DecisionCard`) et la Phase E (niveaux d'emphase des conséquences) devront donc
capturer leurs propres états `before/after` ciblés au moment de leur implémentation plutôt que de
s'appuyer sur cette baseline générale pour ces cas précis. Documenté ici plutôt que comblé
artificiellement pour ne pas retarder les phases d'implémentation à plus forte valeur.
