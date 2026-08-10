# Playtest 5 — Nouvelle Énergie, mobile 390×844, méthode « La campagne numérique »

Style de jeu : OFFENSIF / OPPORTUNISTE / POPULAIRE / RISQUÉ (opportuniste, volatile — cohérent avec
la méthode « viralité/notoriété »). Résultat : victoire au second tour, 18,7 % au premier tour,
+14,2 points de progression. Score « Président de la République ».

**Première impression** : identité graphique bien reconnaissable (vert sauge/olive distinct des
autres partis), fiche de parti lisible sans défaut.

**Lisibilité** : **bug réel trouvé ici** — le titre de l'événement de parti signature
(`party_nouvelle_energie_signature`, « Le permis d'entreprendre doit être défini ») est
**visuellement tronqué au milieu d'un mot** à 390 px de large : le mot « ENTREPRENDRE » s'affiche
coupé en « ENTREPRENDRI », vraisemblablement à cause du `overflow-hidden` de `Card` combiné à un
`leading-[0.98]` très serré sur le titre `text-4xl` qui rogne la ligne suivante quand le mot ne
casse pas proprement. Capture : `screenshots/BUG-titre-tronque-mobile__party_nouvelle_energie_signature__390x844.png`.
C'est le seul bug de rendu visuel réel (texte réellement illisible, pas juste esthétiquement
perfectible) rencontré sur l'ensemble des 5 playtests de cette mission.

**Immersion** : cohérente avec les autres playtests mobiles — même mise en page reflow à une
colonne, même traitement des écrans de rupture (accueil, soirées électorales, bilan).

**Game feel** : rien de spécifique au style « opportuniste » choisi — les tags RISQUÉ/OPPORTUNISTE
ne changent ni la couleur ni l'animation du bouton, seulement leur libellé (cohérent avec
`V2_DECISIONS.md` D-003 : les tags restent des métadonnées secondaires, pas des leviers visuels —
un choix de design assumé, pas un oubli).

**Événement le mieux mis en scène** : la soirée électorale, comme dans tous les autres playtests —
c'est systématiquement le pic de qualité formelle du jeu, quel que soit le parti ou le style.

**Moment le plus plat** : l'événement au titre tronqué lui-même, qui cumule un problème de forme
(texte cassé) sur un événement qui devrait porter l'identité du parti.

**Premier tour** : bonne progression lisible (+14,2 points affichés clairement dans le bilan final,
avant même le graphique).

**Second tour** : victoire nette, aucune perte d'information sur mobile.

**Fin** : bilan complet et cohérent avec les autres, aucun problème de mise en page hormis le bug
du milieu de partie déjà signalé.

**Note forme : 5,5/10** — la seule note la plus basse des 5 playtests, entièrement due au bug de
troncature de titre : un problème de forme suffisamment grave (texte du jeu rendu illisible) pour
peser significativement sur l'évaluation malgré une expérience par ailleurs cohérente avec les
autres parties.
