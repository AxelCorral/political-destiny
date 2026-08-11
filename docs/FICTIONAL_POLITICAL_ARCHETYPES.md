# Archétypes politiques fictifs — document de correspondance interne

**Ce document n'est jamais affiché au joueur.** Il documente, pour chaque personnage important du
jeu, le profil politique réel dont il s'inspire structurellement (fonction, ancrage, famille
idéologique, génération) — jamais un « reskin » nom-pour-nom, mais une architecture cohérente. Voir
`docs/POLITICAL_BASELINE_2026-04.md` pour les sources datées, `docs/EDITORIAL_POLICY.md` pour les
règles éditoriales générales. Référence temporelle du monde du jeu : 18 avril 2026.

Interdictions de contenu sensible pour TOUS les personnages ci-dessous : aucun crime, corruption,
violence, affaire sexuelle, addiction, diagnostic médical, secret familial, enrichissement illégal ou
propos discriminatoire inventés et attribués à l'archétype. Tout scandale doit toucher un personnage
secondaire entièrement fictif (trésorier, consultant, élu local — voir `src/game/data/actors.ts`,
groupe `sensitiveFictionalActors`), jamais l'archétype lui-même.

---

## Candidats de parti (profil par défaut)

### `lfi_candidate` — Ariane Valmont
- **Fonction** : candidate déclarée de La France insoumise.
- **Type de personnage** : candidat de parti, profil unique (candidature présumée, non déclarée
  formellement au 18/04/2026 dans la réalité, mais quasi-certaine — pas de deuxième profil créé).
- **Profil politique réel de référence** : figure de la gauche radicale française, tribun/tribune de
  mouvement, ligne rupturiste (Sixième République, désobéissance européenne).
- **Traits à préserver** : orateur/oratrice (charisme et compétence média élevés), mobilisation et
  notoriété fortes, rejet élevé, tension mouvement horizontal vs personnalisation.
- **Traits qui peuvent varier** : intensité de la ligne (radicalisation vs élargissement) selon les
  choix du joueur, alliances de second tour.
- **Événements compatibles** : fronde interne (`party_lfi_fronde`), coalition de gauche large.
- **Événements incohérents** : soutien naturel à une plateforme économique libérale/pro-marché, ligne
  institutionnelle sans tension avec les groupes d'action.
- **Contenu sensible interdit** : idem règle générale.

### `ps_candidate` — Clara Villedieu (profil A — continuité)
- **Fonction** : candidate déclarée du Parti socialiste, ligne de continuité institutionnelle.
- **Type de personnage** : un des deux `CandidateProfile` du PS (voir §3 de
  `docs/REALITY_GROUNDED_SIMULATION.md` pour le mécanisme).
- **Profil politique réel de référence** : aile gouvernementale/institutionnelle du PS, proche du
  profil d'un premier secrétaire cherchant à défendre le bilan et la maison plutôt qu'à l'ouvrir.
- **Traits à préserver** : négociatrice, réseau de maires, crédibilité gouvernementale, cohésion
  fragile en interne.
- **Traits qui peuvent varier** : degré d'ouverture programmatique vers le centre-gauche.
- **Baseline (profil A)** : bas de la fourchette PS (proche de 4,5 %, cf. baseline réelle Faure).
- **Événements compatibles** : bilan gouvernemental, primaire citoyenne, contestation de synthèse.
- **Événements incohérents** : posture de rupture radicale avec l'appareil du parti.

### `ps_rassemblement` — Nadia Ferreira (profil B — rassemblement, NOUVEAU)
- **Fonction** : figure de rassemblement social-démocrate/pro-européenne, hors appareil PS strict,
  ralliée pour porter une candidature large de l'espace social-démocrate.
- **Type de personnage** : deuxième `CandidateProfile` du PS — nouvel acteur créé pour cette mission
  (aucun acteur existant ne correspondait structurellement).
- **Profil politique réel de référence** : figure d'ouverture pro-européenne du même espace politique
  que le PS mais positionnée au-delà de l'appareil partisan strict — ancrage eurodéputé, ligne
  réformiste, capacité de rassemblement plus large que la ligne de continuité.
- **Traits à préserver** : charisme et présence médiatique plus hauts que le profil A, plafond
  électoral plus élevé, ancrage européen marqué, moindre dépendance à l'appareil du parti.
- **Traits qui peuvent varier** : degré de proximité avec Renaissance/Horizons sur l'Europe (jamais au
  point de devenir indiscernable du bloc central).
- **Baseline (profil B)** : haut de la fourchette PS/social-démocrate (proche de 10,5 %).
- **Événements compatibles** : ouverture programmatique, dialogue avec les Écologistes, positionnement
  pro-européen appuyé.
- **Événements incohérents** : ligne de rupture avec l'Union européenne, alliance naturelle et non
  justifiée avec le RN ou Reconquête.

### `ecologistes_candidate` — Éloi Vernet
- **Fonction** : candidat déclaré des Écologistes.
- **Type de personnage** : profil unique (candidature réglée en interne au 18/04/2026, cf. baseline).
- **Profil politique réel de référence** : ligne interne des Écologistes ayant already tranché la
  question du repli en cas d'échec de la primaire élargie — porte-parole d'une écologie de
  gouvernement plutôt que de rupture totale, en tension avec l'aile la plus radicale du mouvement.
- **Traits à préserver** : organisateur, rejet le plus bas des partis de gauche, dépendance
  structurelle aux alliances.
- **Événements incohérents** : négation du changement climatique, alliance naturelle avec la droite
  identitaire.

### `renaissance_candidate` — Maël Dargent
- **Fonction** : candidat déclaré de Renaissance, secrétaire général du mouvement.
- **Type de personnage** : profil unique (candidature présumée mais non déclarée au 18/04/2026 dans
  la réalité — traité comme quasi-certain, pas de deuxième profil).
- **Profil politique réel de référence** : ligne libérale-centriste héritière du pouvoir sortant,
  en tension de légitimité avec l'espace Horizons pour incarner le bloc central.
- **Traits à préserver** : financement et notoriété les plus hauts du jeu, crédibilité gouvernementale
  élevée, identité de gameplay volontairement proche de PS/Horizons/Écologistes (tension structurelle
  documentée dans `PARTY_GAMEPLAY_IDENTITIES.md`).
- **Événements incohérents** : rupture totale avec le bilan du pouvoir sortant sans justification.

### `horizons_candidate` — Agathe Belcourt
- **Fonction** : candidate déclarée d'Horizons.
- **Type de personnage** : profil unique — mais **de très loin la candidature la mieux établie et la
  plus forte électoralement des neuf espaces étudiés** (baseline réelle 20,5-25,5 %, cf.
  `docs/POLITICAL_BASELINE_2026-04.md` §6). Aucune incertitude réelle de candidature ; l'incertitude du
  jeu porte sur la relation avec le fondateur du mouvement (voir `party_horizons_founder_challenge`),
  pas sur l'identité du candidat.
- **Profil politique réel de référence** : maire d'une grande ville, ancien(ne) Premier ministre,
  ligne libérale-réformatrice, réseau d'élus locaux, image technocratique à gérer plutôt qu'à subir.
- **Traits à préserver** : crédibilité gouvernementale et cohésion parmi les plus hautes du jeu, réseau
  local fort, risque d'image technocratique (« le sketch du comité Excel »), dépendance symbolique à la
  bénédiction du fondateur.
- **Événements incohérents** : rupture populiste avec les institutions, absence de réseau d'élus.

### `lr_candidate` — Bastien Rochefort
- **Fonction** : candidat déclaré des Républicains.
- **Type de personnage** : profil unique — candidature quasi réglée (auto-déclaration le 12 février
  2026 réelle, ratification interne le lendemain de la date de début du jeu). Pas de deuxième profil ;
  une touche narrative optionnelle peut évoquer la ratification imminente sans en faire un mécanisme.
- **Profil politique réel de référence** : ligne droite classique/sécuritaire du parti, en tension
  connue avec une aile plus proche du RN (voir `Diane Mérande` ci-dessous) et une aile plus libérale.
- **Traits à préserver** : implantation locale la plus forte du jeu, cohésion la plus basse du jeu.
- **Événements incohérents** : rejet total de toute discussion avec la droite identitaire (la tension
  réelle du parti est justement l'ambiguïté, pas le refus catégorique).

### `rn_candidate` — Élise Montclar (profil B — jeune dauphine)
- **Fonction** : candidate déclarée du RN dans le scénario où la ligne de normalisation l'emporte.
- **Type de personnage** : un des deux `CandidateProfile` du RN (le cas d'usage explicite de la
  mission). Acteur déjà existant, réutilisé tel quel.
- **Profil politique réel de référence** : génération plus jeune, ligne de dédiabolisation/normalisation,
  style plus communicationnel, positionnement économique plus ouvert que la ligne historique.
- **Traits à préserver** : mobilisation et cohésion parmi les plus hautes du jeu, rejet extrême
  (plafond de verre mesuré et documenté), style orateur/oratrice.
- **Baseline (profil B)** : haut de la fourchette RN réelle (proche de 35 %) — légèrement supérieur au
  profil A dans la recherche datée (28 mars 2026, Elabe).
- **Événements incohérents** : rupture ouverte avec la stratégie de normalisation, discours
  explicitement révolutionnaire anticapitaliste.

### `rn_ferran` — Louis Ferran (profil A — figure historique, RÉAFFECTÉ)
- **Fonction** : cadre historique du RN devenant candidat dans le scénario où la ligne dure l'emporte
  (déjà présent dans `src/game/data/actors.ts` comme cadre ; promu candidat alternatif pour cette
  mission).
- **Type de personnage** : deuxième `CandidateProfile` du RN.
- **Profil politique réel de référence** : génération antérieure, ligne plus sociale-étatiste et
  protectionniste, fidélité plus marquée du noyau historique, refuse la modération
  (`PARTY_GAMEPLAY_IDENTITIES.md` : « Louis Ferran refuse la modération »).
- **Traits à préserver** : électorat populaire plus solide, intervention économique plus assumée,
  rejet personnel spécifique, crossover différent vers la droite libérale (plus faible).
- **Baseline (profil A)** : bas de la fourchette RN réelle (proche de 31,5 %).
- **Événements incohérents** : ligne économique libérale-pure, rapprochement explicite et non conflictuel
  avec le bloc central.

### `reconquete_candidate` — Victor d'Aubrac
- **Fonction** : candidat déclaré de Reconquête.
- **Type de personnage** : profil unique. La réalité montre une incertitude réelle (Zemmour indécis),
  mais l'ampleur électorale du parti (3-5 %) ne justifie pas la complexité d'un système à deux profils
  distincts — traité comme une candidature présumée avec une note documentée, pas un mécanisme.
- **Profil politique réel de référence** : ligne identitaire/souverainiste distincte du RN, fracture
  interne réelle sur la stratégie d'élargissement (voir `Hélène Saint-Cyr`).
- **Traits à préserver** : identité la plus distincte du jeu, potentiel électoral le plus bas,
  implantation locale quasi nulle.
- **Événements incohérents** : fusion complète et sans tension avec le RN (la réalité montre une
  fracture, pas une fusion — cf. Marion Maréchal soutenant Le Pen plutôt que Zemmour).

### `nouvelle_energie_candidate` — Nora Vaillant
- **Fonction** : candidate/dirigeante de Nouvelle Énergie, maire d'une grande ville du littoral.
- **Type de personnage** : profil unique.
- **Profil politique réel de référence** : **maire de Cannes, droite libérale-réformatrice**, ayant
  quitté LR pour fonder un mouvement propre, doctrine ordolibérale, identité distincte de LR
  traditionnel et du bloc central — voir §0.3 du prompt de mission, directement confirmé par la
  recherche datée (`docs/POLITICAL_BASELINE_2026-04.md` §9 : parti réel fondé le 31 mars 2026 par le
  maire de Cannes).
- **Traits à préserver impérativement** : élu(e) local(e) exécutif, ancrage littoral/entrepreneurial,
  droite libérale distincte de LR, PAS un(e) aristocrate, PAS un(e) haut fonctionnaire de l'ENA, PAS
  un(e) syndicaliste révolutionnaire, PAS un(e) ancien(ne) ministre socialiste (interdictions
  explicites du prompt de mission §0.3).
- **Traits qui peuvent varier** : degré d'ouverture vers Horizons (allié naturel potentiel) selon les
  choix du joueur.
- **Événements compatibles** : rejet quasi nul, cohésion très haute, lutte pour la reconnaissance
  plutôt que gestion d'un capital acquis.
- **Événements incohérents** : discours anticapitaliste, alliance naturelle avec la gauche radicale ou
  le RN, biographie d'ancien haut fonctionnaire parisien.

---

## Cadres secondaires porteurs de tension structurelle (déjà présents dans le contenu existant)

Ces personnages alimentent déjà des chaînes narratives (`party_horizons_founder_challenge`,
`party_lr_crisis_followup`, etc.) qui préfigurent exactement la mécanique de candidature incertaine
demandée par cette mission. Documentés ici pour que tout nouveau contenu structurel (retrait,
remplacement) reste cohérent avec leur profil déjà établi.

- **`horizons_auriac` — Paul Auriac** : fondateur historique du mouvement Horizons dont hérite la
  candidate actuelle. Référence réelle : fondateur d'un parti centriste, ancien Premier ministre resté
  influent dans son propre mouvement. Ne doit jamais apparaître comme hostile à la ligne libérale du
  parti — sa tension est générationnelle/de légitimité, pas idéologique.
- **`lr_merande` — Diane Mérande** : cadre LR de l'aile la plus proche du RN. Ne doit jamais être
  positionnée plus à gauche que la ligne LR classique.
- **`rn_nerac`, `rn_vauvert`** : cadres RN existants, cohérents avec les deux profils de candidature
  (peuvent apparaître comme soutiens de l'un ou l'autre profil selon le contexte narratif, jamais
  comme porteurs d'une ligne économique franchement libérale-pure).
- **`reconquete_saint_cyr` — Hélène Saint-Cyr** : cadre Reconquête refusant l'élargissement du
  mouvement. Cohérente avec la fracture réelle Zemmour/Maréchal documentée en §8 de
  `docs/POLITICAL_BASELINE_2026-04.md`.
- **`nouvelle_energie_ternois` — Raphaël Ternois** : courant interne de Nouvelle Énergie plaidant pour
  une fusion avec Horizons. Cohérent avec la proximité réelle entre les deux espaces libéraux/centristes
  — ne doit jamais plaider pour une fusion avec la gauche ou le RN.

---

## Personnalités étrangères pseudonymisées (`worldFigureProfile`)

Catalogue volontairement restreint (priorité à la qualité, §31 du prompt de mission). Chaque figure
porte des `affinityTags`/`hostilityTags` structurels qui conditionnent son éligibilité aux
`MajorEndorsement` — jamais codés dans le texte libre d'un événement.

### `world_argentina_president` — Mateo Álvarez, président argentin
- **Pays/fonction** : Argentine, président en exercice (période de référence : 2026).
- **Type de personnage** : figure étrangère pseudonymisée.
- **Profil politique réel de référence** : droite libertarienne/radicalement pro-marché, dérégulation
  économique assumée comme marque de gouvernement.
- **Traits à préserver** : `economicAxis` fortement pro-marché, `affinityTags` = [dérégulation,
  rupture libérale, réduction de la dépense publique].
- **Traits qui peuvent varier** : intensité de la prise de position selon l'événement, jamais son sens.
- **Événements compatibles** : salue une dérégulation, félicite une orientation économique libérale
  (Nouvelle Énergie, aile économique de LR/Renaissance/Horizons, RN profil dédiabolisé sur le volet
  économique).
- **Événements incohérents** : appel à une révolution anticapitaliste, soutien à LFI sans justification
  extraordinaire documentée (aucune prévue dans cette mission).
- **Contenu sensible interdit** : idem règle générale.

### `world_germany_chancellor` — Elke Brandt, chancelière allemande
- **Pays/fonction** : Allemagne, chancelière en exercice.
- **Profil politique réel de référence** : centre-droit chrétien-démocrate, pro-européenne, orthodoxie
  budgétaire, partenariat franco-allemand comme totem.
- **Traits à préserver** : `affinityTags` = [Europe, stabilité budgétaire, partenariat franco-allemand],
  `hostilityTags` = [rupture avec l'UE, souverainisme].
- **Événements compatibles** : soutien contextuel à Renaissance, Horizons, LR pro-européen ; réserve
  publique face à une ligne anti-UE.
- **Événements incohérents** : soutien à une candidature ouvertement souverainiste ou anti-UE (RN,
  Reconquête) sans rupture extraordinaire de sa propre ligne.

### `world_uk_pm` — Daniel Ashworth, premier ministre britannique
- **Pays/fonction** : Royaume-Uni, premier ministre en exercice.
- **Profil politique réel de référence** : centre-gauche travailliste, réformisme social-démocrate,
  pragmatisme européen post-Brexit.
- **Traits à préserver** : `affinityTags` = [social-démocratie, coopération européenne pragmatique],
  `hostilityTags` = [ligne identitaire dure].
- **Événements compatibles** : soutien contextuel à PS/espace social-démocrate, Écologistes.
- **Événements incohérents** : soutien au RN ou à Reconquête.

### `world_us_president` — Carter Whitfield, président des États-Unis
- **Pays/fonction** : États-Unis, président en exercice.
- **Profil politique réel de référence** : droite populiste/nationale, ligne protectionniste,
  scepticisme envers le multilatéralisme.
- **Traits à préserver** : `affinityTags` = [ligne nationale, protectionnisme, scepticisme migratoire],
  `hostilityTags` = [multilatéralisme appuyé, ligne pro-immigration].
- **Événements compatibles** : soutien contextuel au RN (profil A comme B) ou à Reconquête — **jamais
  universellement positif** : un tel soutien mobilise une partie de l'électorat mais dégrade la
  crédibilité auprès d'un électorat plus centriste (§18 du prompt de mission — un soutien n'est jamais
  un bonus universel).
- **Événements incohérents** : soutien au PS, à LFI ou aux Écologistes sans rupture extraordinaire.

---

## Personnalités nationales pseudonymisées (`nationalFigures.ts`)

PROMPT_CLAUDE_CODE_RECOMPOSITIONS_STRATEGIQUES_SOUTIENS_CHOCS.md §18-23 — huit figures, une par
archétype demandé (§19), catalogue volontairement restreint (§31). Chaque figure porte des
`affinityTags`/`hostilityTags` structurels qui conditionnent son éligibilité aux
`MajorEndorsement` (`figureKind: "fictional_prestige_figure"`) — jamais codés dans le texte libre
d'un événement. Mêmes interdictions de contenu sensible que les candidats de parti (voir en-tête de
ce document).

### `national_former_centrist_pm` — Bertrand Cazalis
- **Fonction** : ancien Premier ministre de centre droit, resté influent dans son propre courant.
- **Profil politique réel de référence** : figure de continuité institutionnelle, partenariat
  franco-allemand et réformisme pragmatique — même famille que `horizons_auriac` (Paul Auriac) mais
  une personne distincte, pour ne pas surcharger un seul personnage de tous les rôles d'endorsement.
- **Traits à préserver** : `affinityTags` = [continuité institutionnelle, réforme pragmatique],
  `hostilityTags` = [rupture institutionnelle, souverainisme].
- **Événements compatibles** : Horizons, Renaissance, LR — soutien de sérieux gouvernemental.
- **Événements incohérents** : soutien à une ligne de rupture radicale (LFI, RN, Reconquête).

### `national_historic_right_figure` — Henri de Ravignan
- **Fonction** : ancien ministre régalien, figure tutélaire de la droite parlementaire.
- **Profil politique réel de référence** : droite classique/sécuritaire d'une génération antérieure,
  socle militant fidèle.
- **Traits à préserver** : `affinityTags` = [tradition droite, fermeté sécuritaire], `hostilityTags`
  = [gauche radicale, laxisme sécuritaire].
- **Événements compatibles** : LR, Reconquête.
- **Événements incohérents** : soutien à la gauche ou aux Écologistes.

### `national_social_democrat_minister` — Sylvie Chastagnier
- **Fonction** : ancienne ministre des Affaires sociales.
- **Profil politique réel de référence** : social-démocratie réformiste, solidarité active.
- **Traits à préserver** : `affinityTags` = [social-démocratie, réformisme], `hostilityTags` =
  [libéralisme dérégulé, ligne identitaire].
- **Événements compatibles** : PS, Écologistes.
- **Événements incohérents** : soutien au RN, à Reconquête ou à une ligne ultralibérale.

### `national_left_intellectual` — Antoine Kervadec
- **Fonction** : essayiste et universitaire, figure de la critique sociale.
- **Profil politique réel de référence** : gauche intellectuelle, critique du capitalisme, écologie
  populaire.
- **Traits à préserver** : `affinityTags` = [justice sociale, critique du capitalisme],
  `hostilityTags` = [libéralisme économique, ligne sécuritaire].
- **Événements compatibles** : LFI, Écologistes.
- **Événements incohérents** : soutien à la droite ou au bloc central.

### `national_liberal_entrepreneur` — Guillaume Estèves
- **Fonction** : chef d'entreprise, figure médiatique du monde économique.
- **Profil politique réel de référence** : libéralisme entrepreneurial, innovation économique.
- **Traits à préserver** : `affinityTags` = [liberté d'entreprendre, innovation économique],
  `hostilityTags` = [fiscalité punitive, étatisme].
- **Événements compatibles** : Nouvelle Énergie, Renaissance, Horizons.
- **Événements incohérents** : soutien à une ligne anticapitaliste ou protectionniste dure.

### `national_sovereigntist_figure` — Odile Brancourt
- **Fonction** : ancienne parlementaire, porte-voix de la ligne souverainiste.
- **Profil politique réel de référence** : souverainisme, contrôle des frontières, identité
  nationale.
- **Traits à préserver** : `affinityTags` = [souveraineté nationale, contrôle des frontières],
  `hostilityTags` = [fédéralisme européen, immigration ouverte].
- **Événements compatibles** : RN, Reconquête, LR (aile la plus proche du RN, cf. Diane Mérande).
- **Événements incohérents** : soutien à la gauche, aux Écologistes ou à une ligne europhile.

### `national_influential_local_elected` — Marc Ferrandi
- **Fonction** : président de conseil départemental, réputé pour son ancrage de terrain.
- **Profil politique réel de référence** : élu local pragmatique, gestion de proximité.
- **Traits à préserver** : `affinityTags` = [ancrage local, gestion de proximité], `hostilityTags` =
  [discours hors-sol, clivage idéologique pur].
- **Événements compatibles** : Horizons, LR, Nouvelle Énergie.
- **Événements incohérents** : soutien à une ligne de rupture nationale sans ancrage local.

### `national_former_green_official` — Camille Aurousseau
- **Fonction** : ancienne responsable nationale des Écologistes, désormais éloignée du mouvement.
- **Profil politique réel de référence** : écologie de gouvernement, transition pragmatique,
  cohérente avec la tension déjà documentée pour `ecologistes_candidate` (ligne de gouvernement vs
  aile radicale).
- **Traits à préserver** : `affinityTags` = [écologie de gouvernement, transition pragmatique],
  `hostilityTags` = [écologie punitive, climatoscepticisme].
- **Événements compatibles** : Écologistes, PS, Renaissance.
- **Événements incohérents** : soutien à une ligne climatosceptique (RN, Reconquête).

---

## Personnages fictifs sans correspondance réelle recherchée (inchangés)

Les personnages secondaires strictement sensibles (trésoriers, consultants, prestataires — groupe
`sensitiveFictionalActors` de `src/game/data/actors.ts`) restent **sans** correspondance avec une
personne réelle, par construction éditoriale (voir `docs/EDITORIAL_POLICY.md` — les scandales doivent
toucher des personnages secondaires entièrement fictifs). Ce n'est PAS une contradiction avec la
pseudo-réalité du reste du monde : ce sont précisément les personnages pour lesquels aucune
correspondance réelle ne doit exister, afin qu'aucune intrigue sensible ne puisse jamais retomber sur
un archétype reconnaissable.
