# V3 — casting réel, campagne vivante et scènes 3D

Branche `v2/3d-real-cast` (novembre 2026). La « V2 » demandée par Axel correspond à la
troisième itération technique du jeu (la V2 interne date d'août 2026).

## Casting réel

- Candidats déclarés au 5 novembre 2026 (franceinfo, Wikipédia) : voir
  `docs/POLITICAL_BASELINE_2026-11.md`.
- 9 candidatures jouables (Mélenchon, Glucksmann / Faure / Royal, Tondelier, Attal, Philippe,
  Retailleau, Le Pen / Bardella, Zemmour, Lisnard) et 6 candidatures secondaires non jouables
  (Roussel, Ruffin, Villepin, Cazeneuve, Dupont-Aignan, Arthaud), soumises aux parrainages.
- Socles électoraux recalés sur l'Ifop/LCI du 27-29 octobre 2026. Le modèle d'appel électoral
  compresse volontairement les écarts : le RN reste favori net (qualifié dans ~95 % des
  parties) sans atteindre ses 35 % réels.
- Politique éditoriale révisée (`docs/EDITORIAL_POLICY.md`) : fiction satirique, aucune
  citation ni accusation inventée sur une personne réelle ; scandales réservés aux cadres
  fictifs.

## Campagne vivante (directeur de campagne)

`src/game/engine/campaignDirector.ts`, cartes dans `src/game/data/events/v3/director.ts`.

- Départ en septembre 2026, 30 décisions avant le premier tour (≈ 20 minutes).
- Agenda : chaque thème (pouvoir d'achat, sécurité, climat…) a un poids qui monte avec les
  chocs et les mouvements sociaux ; les partis crédibles sur le thème dominant progressent.
- Chocs extérieurs à tout moment (2 à 3 par partie) : gazole et guerre au Moyen-Orient,
  attentat, incendies, cyberattaque hospitalière, procédure européenne, fermetures d'usines.
- Mouvements sociaux (agriculteurs, ronds-points, soignants, étudiants) qui se propagent de
  région en région selon votre position ; carte « mouvement national » au-delà de 4 régions.
- Primaire du pôle socialiste rejouée (le joueur PS peut la perdre : ralliement ou
  dissidence) ; primaire contextuelle de la droite et du centre si le bloc est fragmenté.
- Parrainages : les petites candidatures peuvent échouer ; le joueur mal implanté aussi.
- Un coup de théâtre au plus par partie (~45 %) : scénario de la Cour de cassation
  (Bardella remplace Le Pen), dissidence de Xavier Bertrand, percée de Dominique de Villepin.
- Réglage « Événements tragiques » (paramètres) pour exclure attentats et catastrophes.

## Scènes 3D

Three.js / React Three Fiber, chargés à la demande, désactivables (« Scènes 3D »), respectant
« Réduire les animations ».

- 19 figurines « vinyl toy » procédurales et animées (repos, discours, victoire, défaite,
  salut, poignée de main) — planche : `/casting`.
- Accueil : les candidats sur une France en diorama.
- Pendant la campagne : diorama vivant (votre figurine réagit au dernier résultat, rivaux,
  foules de manifestants, repères des chocs en cours).
- Débats : plateau télévisé avec pupitres.
- Soirées électorales : podium animé. Bilan : l'Élysée.

## Limites connues

- Difficulté : comme en V2, un joueur qui choisit au hasard se qualifie très souvent ; à
  rééquilibrer dans une passe dédiée.
- Les figurines restent des caricatures procédurales ; l'essai de modèles générés par IA est
  documenté séparément.
