# Playtest 1 — Horizons, desktop (1920×1080), méthode « Présidentiable »

Style de jeu : PRÉSIDENTIEL / TRANSPARENT / RASSEMBLEUR (cohérent, institutionnel). Résultat réel :
qualifiée 2ᵉ au premier tour (13,3 %, écart de 0,6 pt avec la 3ᵉ place), défaite au second tour
(46,8 % contre 53,2 %). Score final 81/100 (« Stratège sans couronne »).

**Première impression** : très bonne sur l'accueil et l'écran de lancement (hero navy/or, gros
titre condensé, bandeau diagonal) ; nette baisse dès l'écran « Choisissez votre point de départ »
et la liste des 9 partis, qui ressemblent à des cartes de sélection de plan SaaS malgré les
emblèmes colorés.

**Lisibilité** : excellente. Titres énormes, contraste fort, une seule question à la fois, choix
A/B/C très lisibles. Aucune surcharge cognitive rencontrée en 31 décisions.

**Immersion** : correcte mais jamais forte. Le texte fait le travail (contexte, enjeux, ton), la
mise en scène visuelle reste minimale sur l'essentiel de la partie (carte blanche identique du
début à la fin). Les deux ruptures franches — écran de lancement et soirées électorales (fond
navy) — sont les seuls moments où le jeu « sort du formulaire ».

**Game feel** : correct mais plat. Les clics sont réactifs (retour visuel immédiat via bordure
bleue + option non choisie qui passe à 50 % d'opacité), mais aucune animation d'entrée sur les
cartes, aucun compteur qui « monte » sur les résultats électoraux, aucune vibration/poids visuel
proportionnel à l'importance de la conséquence.

**Événement le mieux mis en scène** : les deux soirées électorales (premier et second tour) —
bascule totale de palette (cream → navy + or), gros score en évidence, classement avec barres
colorées par parti, carte régionale. Le seul moment où on « sent » vraiment le climax.

**Moment le plus plat** : les événements de catégorie « Parti » / « Programme » / « Vie interne »
— indiscernables visuellement d'un événement de campagne ordinaire malgré une importance
mécanique parfois plus grande (ce sont ces catégories qui portent l'identité de chaque
mouvement).

**Premier tour** : très réussi — écran dédié, classement serré et lisible (4 partis en moins d'un
point), carte régionale, transition claire vers l'entre-deux-tours.

**Second tour** : entrée peu marquée formellement — le débat d'entre-deux-tours réutilise
exactement le même gabarit visuel (navy header) que n'importe quel débat de mi-campagne ; seul le
texte indique qu'on est dans la dernière ligne droite. Bug de contenu confirmé et déjà connu
(`GAMEPLAY_AUDIT.md`) : apostrophe manquante dans « Le débat de lentre-deux-tours ».

**Fin** : bilan de défaite très réussi — titre digne (« Stratège sans couronne »), jauge circulaire
de score, répartition « pourquoi ce score », carte de résultat partageable (Partager / Télécharger
le PNG), graine copiable. Un des écrans les plus aboutis de tout le jeu.

**Bug UI confirmé (déjà connu, toujours présent)** : à 360 px et 390 px de large, la barre
d'onglets du tableau de bord (Synthèse / Programme / Décisions / Actualités) tronque le 4ᵉ onglet
sans aucun indice visuel de défilement (`10-tableau-de-bord__mobile-*.png`).

**Note forme : 6/10** — lisible, sobre, professionnel, mais très proche d'un « formulaire de
campagne » sur 90 % du temps de jeu ; seuls les écrans de rupture (accueil, lancement, soirées
électorales, bilan) atteignent un niveau vraiment premium.
