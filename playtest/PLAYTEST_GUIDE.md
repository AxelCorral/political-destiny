# Guide de playtest — « Vers l'Élysée »

Ce guide sert à faire tester le jeu à une personne réelle, sans l'influencer. Il complète `GAMEPLAY_AUDIT.md`, qui documente ce qu'une analyse automatisée et une lecture qualitative approfondie peuvent établir — et surtout ce qu'elles ne peuvent pas établir sans joueur humain (voir la section 33 de ce rapport, « Points nécessitant obligatoirement un playtest humain »).

## Objectif

Observer une personne découvrir le jeu pour la première fois, sans lui expliquer les mécaniques, sans commenter ses choix, sans l'aider si elle hésite ou se trompe. Le but est de mesurer l'expérience réelle, pas l'expérience idéale.

## Avant la séance

- Prévoir 20 à 30 minutes en continu (une partie dure 10-15 minutes, ajoutez la découverte de l'interface et le questionnaire).
- Utiliser un appareil que le joueur maîtrise déjà (son propre téléphone si possible — l'audit UX automatisé a couvert desktop, mobile étroit, mobile large et tablette, mais rien ne remplace l'appareil réel du joueur).
- Ne montrez aucune capture d'écran, aucune explication préalable, aucun résumé des mécaniques.
- Ayez `PLAYTEST_OBSERVER.md` ouvert et prêt à remplir pendant la séance, pas après.

## Consignes à donner au joueur (à lire ou paraphraser fidèlement)

> « Voici un jeu où tu incarnes un candidat ou une candidate à l'élection présidentielle. Tu vas prendre des décisions de campagne pendant une partie d'environ 10 à 15 minutes. Joue comme tu le sens, il n'y a pas de bonne façon de jouer. Pense à voix haute si tu peux — dis ce que tu regardes, ce que tu comprends, ce qui te surprend. Je ne peux pas t'aider ni répondre à des questions sur le jeu pendant la partie, je note simplement ce qui se passe. »

## Ce qu'il ne faut PAS faire pendant la séance

- Ne pas expliquer une mécanique si le joueur ne comprend pas — noter l'incompréhension à la place.
- Ne pas suggérer une option ("je choisirais plutôt...").
- Ne pas commenter un résultat ("ah, tu vas perdre des points").
- Ne pas interrompre pour poser une question — attendre la fin de partie.
- Ne pas rassurer si le joueur semble frustré — observer et noter.

## Déroulé recommandé

1. Installer le joueur, lancer le site, laisser le joueur découvrir l'écran d'accueil seul.
2. Le joueur choisit un parti existant ou crée son propre mouvement (ne pas influencer ce choix).
3. Le joueur joue une partie complète jusqu'au bilan final (ou jusqu'à élimination).
4. Immédiatement après le bilan, faire remplir `PLAYTEST_FORM.md` — avant toute discussion.
5. Une fois le formulaire rempli, une discussion libre est possible, mais elle n'est plus consignée dans le formulaire (les biais rétroactifs faussent les réponses écrites).

## Après la séance

- Reporter les observations de `PLAYTEST_OBSERVER.md` et les réponses de `PLAYTEST_FORM.md` dans une ligne de `PLAYTEST_RESULTS_TEMPLATE.csv`.
- Aucune télémétrie n'est envoyée à distance : tout reste local, dans ces fichiers.
- Un seul playtest ne prouve rien statistiquement — l'objectif est d'accumuler plusieurs séances (viser au moins 5 à 8 profils de joueurs différents : familier des jeux narratifs, familier de la politique, néophyte des deux, joueur mobile, joueur desktop) avant de tirer des conclusions.
