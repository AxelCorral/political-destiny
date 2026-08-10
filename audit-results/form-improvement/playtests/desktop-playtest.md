# Playtest post-refonte — Desktop (1366×768)

Joué réellement au clavier/souris via navigateur (Edge/Chromium, `playwright-cli`), campagne
LFI/Le terrain d'abord, graine `always-first-gov-lfi-1` (qualifiée puis victorieuse) complétée
jusqu'au gouvernement, plus deux graines dédiées (`always-first-rare-lfi-1`,
`always-first-chain-lfi-3`) pour garantir la rencontre d'un événement rare et d'une chaîne dans le
budget de ce playtest. Captures dans ce dossier : `pt-desktop-01` à `pt-desktop-12`.

## Accueil → lancement → première carte (`pt-desktop-01/02/03`)

Écran inchangé (confirmé par diff de code nul depuis l'audit et par capture) : première impression
toujours forte, aucune dégradation. La première carte de campagne montre désormais le bandeau de
phase « PRÉ-CAMPAGNE » à côté du compte à rebours J − 365, et le liseré de 3px sous l'en-tête porte
déjà la couleur du parti (bordeaux LFI) — un détail d'identité qui n'existait pas avant cette
mission.

- **Jeu vs web app** : nettement plus « jeu ». Le marqueur numéroté discret (au lieu des lettres
  A/B/C en gros badge) et le liseré de couleur retirent l'impression de formulaire.
- **Hiérarchie** : titre / résumé / choix toujours clairs, renforcés par le bandeau de phase.
- **Fatigue** : aucune — écran calme, pas de sur-sollicitation.
- **Clarté** : bonne, aucune ambiguïté sur l'action attendue.
- **Animation** : légère apparition de la carte (`animate-card-enter`, ~280ms), imperceptible en
  tant que gêne, perceptible en tant que continuité.
- **Bugs** : aucun.

## Événement rare (`pt-desktop-04`)

Bandeau navy « ÉDITION SPÉCIALE » avec bordure or, icône Sparkles, fond légèrement texturé —
immédiatement identifiable comme « inhabituel » avant même de lire le texte, exactement l'objectif
du prompt. Comparé à la baseline (carte identique à un événement ordinaire, notée 3,5/10), le
changement est net.

- **Jeu vs web app** : très favorable — c'est l'écran qui ressemble le moins à un CMS.
- **Climax** : léger mais réel — le contraste navy/or capte l'attention sans être criard (pas de
  glow, pas de particules, conforme à la contrainte du prompt).
- **Bugs** : aucun.
- **Envie de continuer** : oui — le registre « flash info » donne envie de savoir ce qui se passe.

## Chaîne narrative + décisif combinés (`pt-desktop-05`)

Un seul état de jeu illustre deux signaux à la fois : bandeau « DÉCISIF » et rappel « RETOUR DE
DOSSIER · Il y a 3 décisions · « Accorder un mois de campagne… » » dans le même en-tête navy. C'est
la combinaison « subtile » explicitement autorisée par le prompt (§8.3) plutôt qu'un empilement
maladroit. Avant cette mission, les chaînes étaient notées 3/10 avec aucun signal visuel de
continuité ; on voit ici directement, sans ouvrir le tableau de bord, qu'un choix passé revient.

- **Hiérarchie/clarté** : le rappel reste court (une ligne), ne spoile rien, aide à comprendre
  cause → conséquence sans mur de texte.
- **Bugs** : aucun.

## Tableau de bord (`pt-desktop-06`)

La jauge « Rejet » utilise désormais un dégradé bleu→rouge distinct des jauges favorables et porte
le texte « (à limiter) » — polarité visible sans dépendre uniquement de la couleur. Le reste du
panneau est inchangé et reste l'un des écrans les mieux notés du jeu (sondage, indicateurs).

## Premier tour (`pt-desktop-08`)

Les barres de classement se révèlent maintenant en s'animant (largeur 0 → finale, léger
décalage par rang) au lieu d'apparaître déjà remplies — l'incohérence relevée par l'audit face aux
sondages ordinaires est corrigée. La capture montre l'état final stable ; le comportement en
mouvement a été vérifié séparément en Phase F (bar mid-animation vs finale, premier ET second tour).
Cet écran était déjà le mieux noté du jeu (8,5/10) : rien d'autre n'a été touché.

## Entre-deux-tours (`pt-desktop-09`)

Nouvel écran court et dédié : duel visuel PartyMark vs PartyMark, scores du premier tour, signal
« J − 14 · PHASE FINALE ». Avant cette mission, cet instant n'existait pas — on passait directement
du résultat du premier tour à un événement de campagne ordinaire, ce que l'audit critiquait
explicitement (« l'entrée dans le second tour ressemble à un débat normal »). Le climax de la
qualification est maintenant marqué par une vraie rupture d'écran.

- **Climax** : nettement amélioré — c'est le changement le plus perceptible de toute la mission
  sur ce point précis.
- **Bugs** : aucun ; le contenu du second tour lui-même n'a pas été touché.

## Second tour (`pt-desktop-10`)

Mêmes qualités que le premier tour (barres animées, cohérence visuelle), même verdict.

## Gouvernement (`pt-desktop-11`)

C'était l'écart le plus important de tout l'audit (importance mécanique 5/5, importance visuelle
1/5, gabarit identique à une carte de mi-campagne). Désormais : hero navy avec bandeau diagonal
doré (vocabulaire du bilan final réutilisé), PartyMark du joueur, « VOUS GOUVERNEZ DÉSORMAIS » en
lettres d'or, bandeau de phase « GOUVERNEMENT » dans l'en-tête. On ne peut plus confondre cet écran
avec une décision de campagne ordinaire.

- **Jeu vs web app** : c'est, avec l'entre-deux-tours et le rare, le changement le plus net de
  toute la mission.
- **Envie de continuer** : la mise en scène donne un vrai sentiment d'arrivée au pouvoir.
- **Bugs** : aucun.

## Victoire (`pt-desktop-12`)

Ton chaud/or nettement plus présent (halo radial et bandeau diagonal dorés plus intenses),
« Victoire fictive » en toutes lettres dans l'eyebrow, score en or avec une courte animation de
« pop » gratifiante (scale 0,82 → 1,06 → 1 sur ~620ms, jamais un écran animé de plusieurs
secondes). Le reste du bilan (score détaillé, positionnement, territoires, moments marquants,
badges, partage PNG, graine) est identique à la baseline — aucune dégradation de cet écran déjà
noté 8,5/10 pour le bilan et 6,5/10 pour la victoire elle-même.

## Synthèse desktop

| Critère            | Constat                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Jeu vs web app     | Progrès net sur rare/chain/gouvernement/entre-deux-tours ; le reste (premier tour, bilan) était déjà bon et reste bon |
| Hiérarchie         | Cohérente partout, renforcée par les bandeaux de variante                                                             |
| Fatigue            | Aucune surcharge constatée sur 30 décisions + 2 tours + gouvernement                                                  |
| Clarté             | Toujours élevée, y compris pour les nouveaux signaux (chain/rare/décisif)                                             |
| Animation          | Perceptible mais jamais bloquante ; aucun retard de clic observé                                                      |
| Climax             | Nettement amélioré à l'entre-deux-tours, au gouvernement, et à la victoire                                            |
| Bugs               | Aucun rencontré pendant ce playtest                                                                                   |
| Envie de continuer | Oui, en particulier après l'entrée dans le duel final                                                                 |
