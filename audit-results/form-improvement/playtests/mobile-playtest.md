# Playtest post-refonte — Mobile (390×844, vérification 360×800)

Joué réellement via navigateur mobile émulé (`playwright-cli`), plusieurs graines déterministes
pour couvrir premiere carte, rare, chaîne, tableau de bord, premier tour, victoire, et un
spot-check dédié à 360×800 sur la carte la plus dense (chaîne + décisive combinées). Captures
`pt-mobile-01` à `pt-mobile-07`.

## Non-régression du P1 « mobile natif »

L'audit concluait déjà que le mobile était réellement natif (7/10) et demandait explicitement de
ne pas dégrader cet acquis. Vérifié : aucun scroll horizontal involontaire sur les 7 captures,
aucune barre de défilement inattendue, tous les boutons restent atteignables au pouce.

## Première carte (`pt-mobile-01-premiere-carte-390`)

Identique en substance à la baseline, avec le liseré de couleur du parti désormais visible sous
l'en-tête même à cette largeur. Bandeau de phase masqué en dessous de `sm:` (640px) par choix
délibéré (§25 : ne pas surcharger l'en-tête mobile) — le compte à rebours J − N reste seul visible,
comme avant.

## Correction du bug P1 — titre tronqué

Vérifiée séparément en Phase B sur l'événement exact signalé par l'audit
(`party_nouvelle_energie_signature`, « Le permis d'entreprendre doit être défini ») à 360px et
390px : le mot long s'enroule désormais sur deux lignes au lieu d'être coupé et masqué par
`overflow-hidden`. Non re-capturé dans ce dossier de playtest pour éviter la duplication ; voir
`audit-results/form-improvement/baseline/screenshots/mobile/BUG-titre-tronque-mobile__party_nouvelle_energie_signature__390x844.png`
pour le « avant » et la suite de visual regression (`title-long-mobile-390.png`) pour le « après ».

## Événement rare (`pt-mobile-02-rare-390`)

Le bandeau « ÉDITION SPÉCIALE » et la bordure or restent parfaitement lisibles à 390px, aucune
compression de texte, icône et date alignées proprement. Même verdict qu'au desktop : le registre
« flash info » est immédiatement identifiable.

## Tableau de bord mobile (`pt-mobile-03-dashboard-390`)

Correction du second bug P1 : le 4ᵉ onglet (« Actualités ») était totalement invisible sans indice
de défilement. Le dégradé de bord droit apparaît maintenant nettement sur la capture, signalant
sans ambiguïté qu'il reste du contenu à faire défiler. La jauge « Rejet (à limiter) » avec son
dégradé bleu→rouge est également visible sans être coupée.

## Premier tour (`pt-mobile-04-premier-tour-390`)

Rendu correct, hiérarchie identique au desktop en plus étroit ; les barres de classement (vérifiées
en mouvement en Phase F) ne provoquent aucun débordement horizontal au repos.

## Chaîne + décisive, 390 puis 360 (`pt-mobile-05`, `pt-mobile-06`)

La combinaison la plus dense visuellement (bandeau « DÉCISIF » + rappel « RETOUR DE DOSSIER » sur
deux lignes + titre) reste intégralement lisible à 390px et surtout à 360px, le viewport le plus
contraint du prompt (§25). Aucun texte coupé, aucun débordement horizontal, le rappel de chaîne
s'enroule proprement sur deux lignes sans déborder de sa bulle.

## Victoire (`pt-mobile-07-victoire-390`)

Même différenciation chaude/or que sur desktop, lisible sans recadrage : eyebrow « Victoire
fictive », halo doré, score en or. Aucune régression par rapport à la baseline mobile du bilan
(déjà bien noté).

## Synthèse mobile

| Critère            | Constat                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------- |
| Jeu vs web app     | Amélioré sur rare/chaîne comme au desktop, sans perdre le caractère « natif » déjà acquis |
| Hiérarchie         | Stable à 390 et 360px                                                                     |
| Fatigue            | Aucune, y compris sur l'écran le plus dense (chaîne + décisif à 360px)                    |
| Clarté             | Les deux bugs P1 (titre tronqué, onglet invisible) sont résolus et vérifiés               |
| Animation          | Aucune gêne perçue, aucun retard de clic                                                  |
| Climax             | Rare et gouvernement lisibles et impactants malgré l'espace réduit                        |
| Bugs               | Aucun nouveau bug rencontré ; les deux bugs connus sont corrigés                          |
| Envie de continuer | Oui, l'expérience reste fluide au pouce sur l'ensemble du parcours testé                  |
