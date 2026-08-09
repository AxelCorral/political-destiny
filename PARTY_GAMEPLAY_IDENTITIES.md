# PARTY_GAMEPLAY_IDENTITIES — matrice d'identité de gameplay

Document de conception produit pendant la Phase E de
`PROMPT_CLAUDE_CODE_AMELIORATION_FUN_POST_AUDIT.md` (P3/P4 — « les partis ne sont pas assez
différents dans la structure de leurs choix »).

`AUDIT_FUN_REJOUABILITE.md` §12 a mesuré une similarité de distribution des stratégies de choix
(`choiceStrategy`) de 0,979 à 0,996 entre tous les partis — le _type_ de décision proposée (négocier,
mobiliser, arbitrer une primaire...) est presque identique d'un parti à l'autre, même quand le
contenu politique change. Ce document ne prétend pas résoudre ce chiffre par une refonte complète du
catalogue (hors de portée d'une seule mission) : il fixe, pour chaque parti, une identité mécanique —
pas seulement narrative — qui doit guider tout contenu futur, et sert de référence pour le contenu
Renaissance ajouté par cette même mission (section 7 du prompt).

Chaque parti est défini par 5 axes, tirés des données réelles du jeu (statistiques de départ dans
`src/game/data/parties.ts`, contenu existant dans `src/game/data/events/v2/parties*.ts`, mesures de
`AUDIT_FUN_REJOUABILITE.md`) — pas des archétypes inventés a priori.

---

## LFI

- **Tension centrale** : mouvement horizontal (groupes d'action historiques) vs candidature
  centralisée autour d'une figure unique (Ariane Valmont).
- **Ressource forte** : mobilisation (76, la plus haute du jeu à l'origine) et notoriété (91).
- **Faiblesse structurelle** : rejet élevé (59) ; risque de fracture entre la ligne mouvementiste et
  la ligne présidentielle.
- **Dilemme récurrent** : radicaliser le message (désobéissance européenne, Sixième République) vs
  l'adoucir pour élargir.
- **Type de coalition** : gauche unie, contrat programmatique explicite à plusieurs partis.
- **Risque interne** : primaire éclair imposée par les groupes d'action si la centralisation va trop
  loin.
- **Électorat à conquérir** : abstentionnistes populaires.
- **Comportement de second tour** : négocie une coalition de gauche large, quitte à diluer des
  engagements pris au premier tour.
- **Mécanique narrative signature** : chaîne fronde interne → vote (`party_lfi_fronde`), déjà l'un
  des événements les mieux notés du jeu (§23 du fun audit).

## Parti socialiste (PS)

- **Tension centrale** : le poids d'un bilan gouvernemental déjà exercé vs le besoin de renouveau
  (primaire citoyenne).
- **Ressource forte** : réseau de maires, crédibilité gouvernementale (72, la plus haute avec
  Renaissance).
- **Faiblesse structurelle** : cohésion la plus basse du jeu après LR (49) — parti théoriquement
  fort, mécaniquement fragile en interne.
- **Dilemme récurrent** : assumer le bilan gouvernemental ou s'en démarquer publiquement (la
  contestation de synthèse d'Élise Marceau est le format récurrent de cette tension).
- **Type de coalition** : gauche de gouvernement, contrat de second tour avec LFI/Écologistes.
- **Risque interne** : contestation de synthèse, primaire citoyenne qui rebat les cartes.
- **Électorat à conquérir** : agents publics, classes moyennes urbaines.
- **Comportement de second tour** : rejoint la table de gauche presque mécaniquement (déjà l'un des
  choix les plus dominants mesurés du jeu, §7 du fun audit) — un signal de logique politique
  cohérente, pas un défaut en soi.
- **Mécanique narrative signature** : rappel du bilan gouvernemental passé (statements/consistency).

## Écologistes

- **Tension centrale** : pureté programmatique (sortie du nucléaire, radicalité climatique) vs
  alliance pragmatique avec le PS urbain.
- **Ressource forte** : la plus forte agence et profondeur mesurées du jeu (§11 du fun audit) — le
  parti où le style de jeu compte objectivement le plus ; rejet le plus bas des partis de gauche
  (37).
- **Faiblesse structurelle** : base électorale modeste (baseSupport 6,5), dépendance structurelle
  aux alliances pour peser.
- **Dilemme récurrent** : arbitrer entre électorat urbain (rénovation thermique, interdictions de
  location) et électorat rural (tournée des élus ruraux).
- **Type de coalition** : gauche + climat, coalition climatique explicitement nommée au second tour.
- **Risque interne** : débat nucléaire qui rouvre une fracture interne à chaque congrès.
- **Électorat à conquérir** : locataires modestes, élus ruraux.
- **Comportement de second tour** : coalition climatique obligatoire (`party_ecologistes_runoff`).
- **Mécanique narrative signature** : arbitrages taxe carbone/nucléaire qui redéfinissent
  l'idéologie perçue du parti à chaque partie.

## Renaissance

- **Tension centrale** : hériter du pouvoir sortant (crédibilité gouvernementale, financement,
  notoriété maximaux) vs exister comme candidature propre plutôt que comme simple prolongation.
- **Ressource forte** : financement (73, le plus haut du jeu), notoriété (96, la plus haute),
  crédibilité gouvernementale (72, ex æquo la plus haute).
- **Faiblesse structurelle** : identité de gameplay la plus faible mesurée du jeu (2,5/10, §11 du
  fun audit) — trop proche de PS/Horizons/Écologistes dans la structure de ses choix ; cohésion
  basse (49).
- **Dilemme récurrent** (renforcé par cette mission, voir section suivante) : défendre le bilan
  gouvernemental ou s'en démarquer publiquement sans le renier — la même tension que le PS, mais
  vécue depuis la position du pouvoir sortant plutôt que depuis l'opposition.
- **Type de coalition** : bloc central (Horizons, LR modéré).
- **Risque interne** : dissidence de l'establishment (d'anciens ministres publient leur propre
  manifeste).
- **Électorat à conquérir** : classes moyennes (« gain net »), retraités.
- **Comportement de second tour** : rassemble le bloc central, cherche des garanties du côté LR.
- **Mécanique narrative signature (nouvelle, cette mission)** : chaîne de l'héritage du pouvoir —
  voir section « Renaissance » ci-dessous.

## Horizons

- **Tension centrale (renforcée par cette mission, Phase B)** : hériter d'un mouvement fondé par
  d'autres (Paul Auriac) vs l'incarner en candidature présidentielle propre.
- **Ressource forte** : réseau d'élus locaux, crédibilité gouvernementale (71), cohésion élevée
  (62 après rééquilibrage — restait la 2e plus haute du jeu avant), rejet contenu (46 après
  rééquilibrage).
- **Faiblesse structurelle (nouvelle, cette mission)** : dépendance à la bénédiction des fondateurs ;
  risque d'image technocratique sans passion perçue (« le sketch du comité Excel »).
- **Dilemme récurrent** : campagne prudente qui préserve la crédibilité vs campagne audacieuse qui
  gagne en dynamique au prix du rejet ou de la cohésion.
- **Type de coalition** : centre droit (Renaissance, LR).
- **Risque interne** : guerre de succession avec Paul Auriac (deux embranchements mutuellement
  exclusifs, voir `party_horizons_founder_challenge`).
- **Électorat à conquérir** : retraités modérés, électorat central volatil disputé avec Renaissance
  (`party_horizons_center_poaching`).
- **Comportement de second tour** : négocie l'élargissement du bloc central ; peut désormais recevoir
  un climax spécifique (« Parlez-nous d'envie ») si son image technocratique n'a jamais été corrigée.
- **Mécanique narrative signature** : chaîne de succession (`horizons_succession`, deux follow-ups
  mutuellement exclusifs selon la décision du joueur).

## Les Républicains (LR)

- **Tension centrale** : fracture entre l'aile libérale-européenne et l'aile identitaire/sécuritaire
  — la vraie ligne de faille du parti, rejouée à chaque congrès interne.
- **Ressource forte** : implantation locale la plus forte du jeu (localStrength 81, electedSupport
  82), réseau militant le plus large après le RN (118 000 adhérents).
- **Faiblesse structurelle** : cohésion la plus basse du jeu (42) — un parti mécaniquement fracturé
  malgré une implantation maximale.
- **Dilemme récurrent** : négocier à droite du spectre (vers le RN, via Diane Mérande) ou tenir la
  ligne républicaine classique.
- **Type de coalition** : droite classique, ambiguïté structurelle vis-à-vis du RN.
- **Risque interne** : fédérations qui menacent une liste autonome (dissidence territoriale, pas
  seulement idéologique).
- **Électorat à conquérir** : retraités inquiets du financement des retraites, électorat sécuritaire.
- **Comportement de second tour** : chasse aux reports dans un paysage fragmenté
  (`party_lr_runoff` : « La droite qualifiée cherche ses reports »).
- **Mécanique narrative signature** : chaîne de vote de ligne interne (`party_lr_crisis_followup`,
  l'un des événements les mieux notés du jeu).

## Rassemblement national (RN)

- **Tension centrale** : stratégie de normalisation/dédiabolisation vs fidélité au noyau identitaire
  dur (Louis Ferran refuse la modération).
- **Ressource forte** : mobilisation, cohésion (74, la plus haute du jeu) et dynamique (momentum 67,
  la plus haute) — le parti à l'énergie de campagne la plus continue.
- **Faiblesse structurelle** : rejet extrême (85, très largement le plus haut du jeu) — un plafond de
  verre mesuré et documenté (`POST_AUDIT_FIXES.md` §4 : victoire\|qualifié la plus basse d'un grand
  parti malgré la qualification la plus facile).
- **Dilemme récurrent** : élargir sans démobiliser le noyau (« Le RN doit élargir sans démobiliser »).
- **Type de coalition** : structurellement isolé — aucune alliance de premier tour crédible dans le
  catalogue actuel.
- **Risque interne** : dissidence identitaire (un courant prépare sa propre candidature si la ligne
  Ferran est trop contrainte).
- **Électorat à conquérir** : abstentionnistes populaires, électorat sécuritaire de LR.
- **Comportement de second tour** : bataille du rejet plutôt que bataille des reports — le second
  tour RN se joue sur qui parvient à retourner le rejet, pas sur des alliances.
- **Mécanique narrative signature** : gestion du dosage dédiabolisation/radicalité, avec un vrai
  plafond mécanique (le rejet) que le joueur ne peut pas totalement désamorcer par de bons choix.

## Reconquête

- **Tension centrale** : viser réellement la qualification (statistiquement rare, 7-27 % selon les
  runs) vs accepter un objectif alternatif — peser sur le débat, devenir faiseur de voix.
- **Ressource forte** : identité la plus distincte du jeu (8,0/10 mesuré, quasiment aucun
  chevauchement de contenu avec les autres partis, §12 du fun audit), meilleure rejouabilité mesurée.
- **Faiblesse structurelle** : le potentiel électoral le plus bas du jeu (potentialSupport 17),
  implantation locale quasi nulle (localStrength 27, electedSupport 22, tous deux les plus bas).
- **Dilemme récurrent** : élargissement du mouvement (fusion, réseau de cadres) vs pureté de ligne
  (Hélène Saint-Cyr refuse l'élargissement).
- **Type de coalition** : rapprochement ambigu avec le RN (pacte de non-agression, désistements
  limités) sans fusion complète.
- **Risque interne** : fronde Saint-Cyr sur la stratégie d'élargissement.
- **Électorat à conquérir** : électorat RN déçu par la normalisation, souverainistes non alignés.
- **Comportement de second tour** : rarement atteint dans les faits ; le jeu propose déjà un objectif
  alternatif crédible (§10 du prompt de mission) — voir le renforcement apporté par cette mission en
  Phase F/G.
- **Mécanique narrative signature** : gestion de la campagne comme un pari à faible probabilité mais
  fort enjeu identitaire, plutôt que comme une course vers la victoire.

## Nouvelle Énergie

- **Tension centrale** : exister et être identifié (awareness 48, l'un des plus bas du jeu) vs être
  dilué par une fusion avec un parti plus installé (Horizons, ou son propre courant interne mené par
  Raphaël Ternois).
- **Ressource forte** : rejet quasi nul (28, le plus bas du jeu) et cohésion très haute (72) — un
  capital de confiance encore intact, jamais entamé par des années d'exercice du pouvoir.
- **Faiblesse structurelle** : notoriété très faible ; base électorale minimale (baseSupport 4,5).
- **Dilemme récurrent** : accepter une fusion qui apporte des moyens mais efface l'identité, ou
  rester seul au risque de ne jamais franchir le seuil de notoriété.
- **Type de coalition** : dépend fortement d'alliés du centre (Horizons) pour exister
  électoralement.
- **Risque interne** : pression de fusion qui menace l'existence même du parti en tant que tel.
- **Électorat à conquérir** : entrepreneurs, électorat central qui ne se reconnaît dans aucun grand
  parti.
- **Comportement de second tour** : outsider qui doit construire une majorité de toutes pièces
  (`party_nouvelle_energie_runoff` : « L'outsider doit former une majorité »).
- **Mécanique narrative signature** : lutte pour la reconnaissance plutôt que gestion d'un capital
  déjà acquis — c'est mécaniquement la source du meilleur score de fun mesuré du jeu (70,7/100,
  §27 du fun audit) : presque rien n'est acquis d'avance, donc chaque décision compte.

---

## Ce que ce document ne prétend pas résoudre

La similarité de 0,979-0,996 sur `choiceStrategy` mesurée par le fun audit vient de la structure même
du catalogue : la majorité des événements génériques (catégories `campaign`, `program`, `media`,
`internal`...) sont partagés entre tous les partis et recolorés par leur contexte, pas remplacés par
des mécaniques propres à chaque parti. Résoudre ce chiffre en profondeur demanderait de construire,
pour chaque parti, un nombre de mécaniques structurellement différentes (arbitrage de primaire,
gestion de coalition, chasse aux reports, etc.) comparable à celui du contenu générique lui-même —
un chantier bien au-delà d'une seule mission. Cette mission a ciblé les deux partis les plus mal
notés sur l'identité (Horizons 4,2/10 puis Renaissance 2,5/10, §11 et §35 du fun audit) avec du
contenu réellement nouveau plutôt que de tenter une réécriture générale, conformément à la consigne
du prompt de mission (« Ne modifie pas tous les partis de manière égale »).
