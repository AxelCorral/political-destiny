import type { GameEventDefinition } from "@/game/types";

import {
  bloc,
  candidateStatus,
  decision,
  event,
  flag,
  hidden,
  memory,
  opponentStrategy,
  outcome,
  partySplit,
  relation,
  stat,
} from "../authoring";

/**
 * P2 (post-audit corrections): the audit found only 2 events in the whole
 * catalog using an effect that actually reaches an opponent's own state
 * (opponent_strategy / candidate_status / party_split — see
 * scripts/audit-post/catalog-audit.ts's eventsAffectingOpponent). The
 * adversarial world was otherwise reactive only (opponents evolve on their
 * own turn, see engine/opponentSimulation.ts), never something the player's
 * own choices could reach into directly. These events give the player real,
 * bounded leverage over a specific named rival — never enough to eliminate
 * a candidate outright from a single ordinary choice (see the effects
 * ceiling in each outcome), always remembered by the actor targeted, and
 * spread across debate/campaign/alliance/world categories and several
 * ideological pairings rather than one repeated shape.
 */

const opponentPhases = { campaign: 0.9, official_campaign: 1.1 } as const;

export const v2OpponentInteractionEvents: GameEventDefinition[] = [
  event({
    id: "debate_challenge_frontrunner",
    title: "Provoquer le favori en duel",
    category: "debate",
    summary:
      "Les sondages placent Élise Montclar (RN) en tête. Une chaîne d’information propose d’organiser un face-à-face avec elle avant le premier tour, sous réserve que les deux camps s’accordent sur le format.",
    themes: ["institutions"],
    importance: "major",
    phaseWeights: opponentPhases,
    minDecisionIndex: 8,
    excludedParties: ["rn"],
    entityReferences: [{ entityId: "rn", role: "subject" }],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "challenge_frontrunner_own_terms",
        label: "Accepter le duel en imposant un format contradictoire strict, sans notes",
        tag: "OFFENSIF",
        strategy: "personal_risk",
        result: outcome(
          "challenge_frontrunner_accepted_hard",
          "Un duel exigeant, accepté sous conditions",
          "La chaîne valide le format et l’équipe adverse le juge agressif mais ne peut refuser sans paraître fuir le débat. Élise Montclar prépare une riposte médiatique pour les jours suivants.",
          [
            stat("mediaPresence", 4, "Duel très attendu"),
            stat("credibility", 2, "Prise de risque assumée"),
            memory("rn_candidate", "hostility", 55, { topic: "institutions" }),
            opponentStrategy("rn_candidate", "attack_favorite", "Riposte annoncée par le camp RN"),
          ],
          {
            setFlags: { frontrunner_debate_accepted_hard: true },
            followUps: [
              { eventId: "debate_frontrunner_retaliation", afterDecisions: 2, probability: 0.65 },
            ],
          },
        ),
      }),
      decision({
        id: "challenge_frontrunner_neutral_format",
        label: "Proposer un format neutre coanimé par deux rédactions concurrentes",
        tag: "RASSEMBLEUR",
        strategy: "negotiation",
        result: outcome(
          "challenge_frontrunner_neutral_accepted",
          "Un cadre équilibré, plus consensuel",
          "Le format coanimé rassure les deux équipes et limite le risque d’un dérapage. Il attire moins d’audience qu’un duel frontal, mais renforce votre image d’acteur institutionnel.",
          [
            hidden("consistency", 2),
            stat("credibility", 3, "Méthode jugée équilibrée"),
            relation("player", "rn", -3, "Concurrence assumée mais courtoise"),
          ],
        ),
      }),
      decision({
        id: "challenge_frontrunner_decline",
        label: "Décliner le duel et publier un communiqué comparant les programmes chiffrés",
        tag: "PRUDENT",
        strategy: "silence",
        result: outcome(
          "challenge_frontrunner_declined",
          "Le terrain du programme plutôt que du plateau",
          "Le communiqué évite le risque d’un dérapage en direct et documente vos chiffres. Le camp adverse et une partie de la presse dénoncent une esquive, ce qui alimente le sujet plus longtemps que prévu.",
          [
            stat("mediaPresence", -2, "Absence du plateau commentée"),
            stat("rejection", 1, "Esquive reprochée"),
            hidden("economicCompetence", 2),
          ],
        ),
      }),
      decision({
        id: "challenge_frontrunner_single_topic",
        label: "Négocier un duel restreint au seul thème économique, sans autre sujet",
        tag: "TECHNIQUE",
        strategy: "negotiation",
        result: outcome(
          "challenge_frontrunner_single_topic_set",
          "Un duel resserré sur un seul thème",
          "Le format ciblé vous permet de préparer un terrain que vous maîtrisez mieux. Le camp adverse accepte mais prévient qu’il exploitera l’absence des autres sujets pour vous accuser d’éviter le reste du débat.",
          [
            stat("credibility", 2, "Sujet maîtrisé"),
            hidden("economicCompetence", 2),
            opponentStrategy(
              "rn_candidate",
              "media_momentum",
              "Le camp RN prépare une critique du format restreint",
            ),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "debate_frontrunner_retaliation",
    title: "La riposte du favori",
    category: "debate",
    summary:
      "Élise Montclar consacre son passage télévisé du lendemain à répondre point par point à votre prestation, avec une ligne d’attaque préparée sur votre programme économique.",
    themes: ["institutions"],
    importance: "notable",
    phaseWeights: opponentPhases,
    excludedParties: ["rn"],
    oncePerRun: true,
    eligibility: [{ kind: "flag", key: "frontrunner_debate_accepted_hard", equals: true }],
    entityReferences: [{ entityId: "rn", role: "subject" }],
    choices: [
      decision({
        id: "frontrunner_retaliation_counter",
        label: "Publier une contre-réponse chiffrée dans les vingt-quatre heures",
        tag: "TECHNIQUE",
        strategy: "media_response",
        result: outcome(
          "frontrunner_retaliation_countered",
          "Une réponse rapide et documentée",
          "La contre-attaque limite les dégâts et occupe à nouveau l’espace médiatique. L’échange nourrit un climat de confrontation directe avec le camp RN pour le reste de la semaine.",
          [
            stat("credibility", 3, "Réponse rapide saluée"),
            stat("mediaPresence", 2, "Échange très suivi"),
            stat("momentum", -2, "Semaine happée par la polémique"),
            relation("player", "rn", -5, "Confrontation ouverte"),
          ],
        ),
      }),
      decision({
        id: "frontrunner_retaliation_ignore",
        label: "Ne pas répondre et recentrer la semaine sur le terrain",
        tag: "PRUDENT",
        strategy: "silence",
        result: outcome(
          "frontrunner_retaliation_ignored",
          "Le silence plutôt que la surenchère",
          "Le choix évite d’alimenter l’affrontement et laisse la semaine de terrain se dérouler sans interruption. Certains soutiens s’impatientent de ce silence tant que la ligne d’attaque reste sans réponse directe.",
          [
            stat("credibility", 2, "Sérénité remarquée"),
            stat("mobilization", 1, "Terrain préservé"),
            bloc("urban_working_class", 1),
            hidden("consistency", 1),
          ],
        ),
      }),
      decision({
        id: "frontrunner_retaliation_right_of_reply",
        label: "Demander un droit de réponse écrit publié par la même chaîne",
        tag: "INSTITUTIONNEL",
        strategy: "legal_action",
        result: outcome(
          "frontrunner_retaliation_right_of_reply_granted",
          "Une réponse formelle, publiée à égalité",
          "Le droit de réponse garantit une visibilité comparable à celle de l’attaque initiale. La procédure prend plusieurs jours, pendant lesquels la ligne d’attaque adverse circule sans contestation directe.",
          [
            stat("credibility", 2, "Procédure respectée"),
            stat("mediaPresence", 1, "Réponse publiée à égalité"),
            hidden("consistency", 1),
          ],
        ),
      }),
      decision({
        id: "frontrunner_retaliation_deride",
        label: "Publier une courte intervention qui tourne l’attaque en dérision",
        tag: "RISQUÉ",
        strategy: "symbolic_action",
        result: outcome(
          "frontrunner_retaliation_derided",
          "La dérision plutôt que la contre-attaque",
          "Le ton léger désamorce une partie de la tension et circule bien sur les réseaux. Une partie de la presse juge le procédé peu sérieux face à des arguments économiques précis.",
          [
            stat("mediaPresence", 3, "Intervention très partagée"),
            stat("momentum", 2, "Ton qui marque"),
            stat("rejection", 2, "Ton jugé peu sérieux par certains"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "campaign_attacked_by_rival_pole",
    title: "Une attaque frontale de La France insoumise",
    category: "campaign",
    summary:
      "Ariane Valmont vous accuse publiquement d’avoir édulcoré vos positions sociales pour séduire un électorat plus modéré. L’accusation circule largement avant que vous ayez pu y répondre.",
    themes: ["work", "public_services"],
    importance: "notable",
    phaseWeights: opponentPhases,
    minDecisionIndex: 5,
    excludedParties: ["lfi"],
    entityReferences: [{ entityId: "lfi", role: "subject" }],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "attacked_by_lfi_detailed_reply",
        label: "Détailler par écrit chaque mesure sociale du programme, chiffres à l’appui",
        tag: "TECHNIQUE",
        strategy: "media_response",
        result: outcome(
          "attacked_by_lfi_detailed",
          "Le détail plutôt que la polémique",
          "La réponse factuelle désamorce une partie de la polémique auprès des observateurs. L’échange reste identifié comme une passe d’armes avec le camp insoumis pour la suite de la campagne.",
          [
            stat("credibility", 3, "Réponse documentée"),
            relation("player", "lfi", -4, "Différend rendu public"),
            memory("lfi_candidate", "hostility", 30, { topic: "work" }),
          ],
        ),
      }),
      decision({
        id: "attacked_by_lfi_counter_attack",
        label: "Répondre en accusant le programme adverse d’être financièrement irréaliste",
        tag: "OFFENSIF",
        strategy: "break",
        result: outcome(
          "attacked_by_lfi_counter",
          "L’escalade plutôt que la désescalade",
          "La contre-attaque marque les esprits et mobilise votre camp. Elle ferme aussi la porte à toute discussion ultérieure avec cet électorat, qui se sent visé à son tour.",
          [
            stat("mobilization", 3, "Base mobilisée par la riposte"),
            bloc("young_precarious", -4),
            relation("player", "lfi", -12, "Rupture publique du dialogue"),
            opponentStrategy("lfi_candidate", "attack_favorite", "La riposte insoumise se durcit"),
          ],
        ),
      }),
      decision({
        id: "attacked_by_lfi_ignore",
        label: "Ne pas répondre publiquement et poursuivre le calendrier de campagne prévu",
        tag: "PRUDENT",
        strategy: "silence",
        result: outcome(
          "attacked_by_lfi_ignored",
          "Poursuivre sans réagir",
          "L’absence de réponse limite la durée de vie de la polémique dans l’agenda médiatique. Une partie de vos soutiens juge le silence gênant face à une accusation aussi directe.",
          [stat("mediaPresence", -1, "Accusation non relevée"), hidden("consistency", 1)],
        ),
      }),
    ],
  }),
  event({
    id: "alliance_poach_rival_cadre",
    title: "Un cadre écologiste tenté par un ralliement",
    category: "alliance",
    summary:
      "Maya Lestang, cadre du mouvement écologiste, laisse entendre en privé qu’elle serait ouverte à rejoindre une dynamique plus large si votre offre programmatique évolue sur un point précis.",
    themes: ["ecology"],
    importance: "notable",
    phaseWeights: opponentPhases,
    minDecisionIndex: 10,
    excludedParties: ["ecologistes"],
    entityReferences: [{ entityId: "ecologistes", role: "subject" }],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "poach_rival_cadre_public_invite",
        label: "L’inviter publiquement à rejoindre votre équipe de campagne",
        tag: "OFFENSIF",
        strategy: "grassroots_mobilization",
        result: outcome(
          "poach_rival_cadre_public",
          "Une invitation publique et risquée",
          "Le geste médiatise la démarche et met la pression sur le mouvement écologiste. Il expose aussi la cadre concernée à une réaction immédiate de son propre camp, avant même sa décision.",
          [
            stat("mediaPresence", 3, "Tentative de ralliement commentée"),
            relation("player", "ecologistes", -8, "Débauchage rendu public"),
            memory("ecologistes_lestang", "rallying", 40, { topic: "ecology" }),
          ],
        ),
      }),
      decision({
        id: "poach_rival_cadre_private_talks",
        label: "Négocier en privé, sans aucune annonce avant un accord ferme",
        tag: "SECRET",
        strategy: "negotiation",
        result: outcome(
          "poach_rival_cadre_private",
          "Une négociation discrète",
          "La discrétion protège la cadre concernée et évite une confrontation prématurée avec son mouvement. Rien n’est acquis, et une fuite dans la presse reste possible à tout moment.",
          [hidden("transferability", 2), stat("credibility", 1, "Approche jugée respectueuse")],
        ),
      }),
      decision({
        id: "poach_rival_cadre_decline",
        label: "Décliner et proposer une plateforme commune sur l’écologie sans débauchage",
        tag: "RASSEMBLEUR",
        strategy: "compromise",
        result: outcome(
          "poach_rival_cadre_declined",
          "La coopération plutôt que le débauchage",
          "La proposition de plateforme commune est bien reçue et évite toute tension personnelle. Elle produit moins d’effet immédiat qu’un ralliement individuel, mais préserve la relation avec le mouvement.",
          [
            relation("player", "ecologistes", 6, "Coopération proposée sans arrière-pensée"),
            hidden("consistency", 2),
            bloc("green_progressives", 2),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "debate_expose_contradiction_centrist",
    title: "Une contradiction chez le camp centriste",
    category: "debate",
    summary:
      "Une recherche d’archives révèle qu’Agathe Belcourt (Horizons) défendait, deux ans plus tôt, une position inverse à celle qu’elle porte aujourd’hui dans votre débat commun sur les retraites.",
    themes: ["pensions"],
    importance: "notable",
    phaseWeights: opponentPhases,
    minDecisionIndex: 6,
    excludedParties: ["horizons"],
    entityReferences: [{ entityId: "horizons", role: "subject" }],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "expose_contradiction_public",
        label: "Présenter la contradiction en direct avec les deux citations à l’appui",
        tag: "CLIVANT",
        strategy: "personal_risk",
        result: outcome(
          "expose_contradiction_public_done",
          "La contradiction mise en lumière",
          "L’extrait est aussitôt repris et fragilise la crédibilité adverse sur ce sujet précis. Le procédé, jugé efficace par certains, est perçu comme agressif par d’autres observateurs du débat.",
          [
            stat("credibility", 3, "Contradiction démontrée"),
            opponentStrategy(
              "horizons_candidate",
              "limit_risk",
              "Le camp Horizons resserre sa communication",
            ),
            relation("player", "horizons", -6, "Attaque frontale en direct"),
            memory("horizons_candidate", "hostility", 35, { topic: "pensions" }),
          ],
        ),
      }),
      decision({
        id: "expose_contradiction_question_only",
        label: "Poser la question sans citer les archives, en laissant l’adversaire répondre",
        tag: "TECHNIQUE",
        strategy: "media_response",
        result: outcome(
          "expose_contradiction_questioned",
          "Une question ouverte, sans pièce à conviction",
          "La question met l’adversaire en difficulté sans donner l’impression d’une embuscade préparée. Elle laisse aussi la porte ouverte à une réponse convaincante qui limiterait l’effet recherché.",
          [stat("mediaPresence", 2, "Échange remarqué"), hidden("consistency", 1)],
        ),
      }),
      decision({
        id: "expose_contradiction_skip",
        label: "Ne pas soulever le sujet et concentrer le débat sur votre propre programme",
        tag: "PRUDENT",
        strategy: "long_term_strategy",
        result: outcome(
          "expose_contradiction_skipped",
          "Le choix de ne pas attaquer",
          "Le débat reste concentré sur votre propre offre programmatique, plus valorisante pour vous. Une partie de la presse spécialisée note après coup que l’occasion n’a pas été saisie.",
          [
            stat("credibility", 1, "Ligne programmatique claire"),
            stat("mediaPresence", -1, "Occasion non saisie"),
          ],
        ),
      }),
      decision({
        id: "expose_contradiction_offer_debate",
        label: "Proposer un débat de fond sur les retraites sans mentionner l’archive",
        tag: "RASSEMBLEUR",
        strategy: "compromise",
        result: outcome(
          "expose_contradiction_debate_offered",
          "Le fond plutôt que l’archive",
          "La proposition de débat de fond est saluée pour sa hauteur de vue et évite tout procès d’intention. Elle prive votre camp d’un angle d’attaque immédiat que certains auraient préféré voir exploité.",
          [
            stat("credibility", 3, "Débat de fond salué"),
            relation("player", "horizons", 3, "Contradiction non exploitée"),
            hidden("consistency", 1),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "world_rival_leadership_tension",
    title: "Tensions internes chez Reconquête",
    category: "world",
    summary:
      "La presse rapporte des tensions ouvertes entre Victor d’Aubrac et une partie de son état-major, sur fond de désaccord stratégique à un mois du premier tour. Votre équipe débat de l’attitude à adopter publiquement.",
    themes: ["institutions"],
    importance: "notable",
    phaseWeights: opponentPhases,
    minDecisionIndex: 12,
    excludedParties: ["reconquete"],
    entityReferences: [{ entityId: "reconquete", role: "subject" }],
    worldImpact: true,
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "rival_leadership_tension_amplify",
        label: "Publier une déclaration soulignant l’instabilité du mouvement adverse",
        tag: "OFFENSIF",
        strategy: "break",
        result: outcome(
          "rival_leadership_tension_amplified",
          "La crise adverse commentée publiquement",
          "Le commentaire attire l’attention sur les difficultés internes de Reconquête et accentue la pression sur son état-major. Une partie de l’opinion juge le procédé opportuniste plutôt que porteur d’un message de fond.",
          [
            stat("mediaPresence", 3, "Crise adverse commentée"),
            stat("rejection", 1, "Procédé jugé opportuniste par certains"),
            flag("reconquete_crisis_amplified", true),
          ],
          {
            followUps: [
              { eventId: "world_rival_leadership_split", afterDecisions: 3, probability: 0.55 },
            ],
          },
        ),
      }),
      decision({
        id: "rival_leadership_tension_silent",
        label: "Ne faire aucun commentaire et laisser le sujet suivre son cours",
        tag: "PRUDENT",
        strategy: "silence",
        result: outcome(
          "rival_leadership_tension_silence",
          "Aucun commentaire de votre part",
          "Le silence évite d’apparaître opportuniste sur une difficulté qui ne vous concerne pas directement. Le sujet continue néanmoins d’occuper l’actualité sans votre intervention.",
          [hidden("consistency", 1)],
        ),
      }),
      decision({
        id: "rival_leadership_tension_solidarity",
        label: "Reconnaître publiquement que les tensions internes sont le lot de tous les partis",
        tag: "RASSEMBLEUR",
        strategy: "compromise",
        result: outcome(
          "rival_leadership_tension_solidary",
          "Un ton mesuré sur les difficultés d’autrui",
          "La remarque est saluée pour son ton mesuré, y compris par des commentateurs peu favorables à votre ligne. Elle prive votre camp d’un angle d’attaque que certains auraient souhaité voir exploité.",
          [
            stat("credibility", 4, "Ton apaisé salué"),
            hidden("consistency", 2),
            relation("player", "reconquete", 4, "Retenue remarquée"),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "world_rival_leadership_split",
    title: "La dissidence prend forme chez Reconquête",
    category: "world",
    summary:
      "La crise interne évoquée quelques jours plus tôt débouche sur une rupture ouverte : une partie de l’état-major de Victor d’Aubrac annonce vouloir présenter une liste concurrente sous ses propres couleurs.",
    themes: ["institutions"],
    importance: "major",
    phaseWeights: opponentPhases,
    excludedParties: ["reconquete"],
    oncePerRun: true,
    worldImpact: true,
    eligibility: [{ kind: "flag", key: "reconquete_crisis_amplified", equals: true }],
    entityReferences: [{ entityId: "reconquete", role: "subject" }],
    choices: [
      decision({
        id: "rival_leadership_split_welcome",
        label: "Se dire ouvert à dialoguer avec la future liste dissidente",
        tag: "OPPORTUNISTE",
        strategy: "negotiation",
        result: outcome(
          "rival_leadership_split_welcomed",
          "Une porte ouverte à la dissidence naissante",
          "Le signal d’ouverture est immédiatement relevé par la presse spécialisée. Il fragilise un peu plus le camp Reconquête, déjà affaibli par la rupture qui vient de se confirmer.",
          [
            partySplit("reconquete", "reconquete_saint_cyr", "Rupture confirmée chez Reconquête"),
            hidden("transferability", 3),
            relation("player", "reconquete", -5, "Ouverture jugée opportuniste"),
          ],
        ),
      }),
      decision({
        id: "rival_leadership_split_neutral",
        label: "Reconnaître la rupture sans prendre position sur ses conséquences",
        tag: "PRUDENT",
        strategy: "silence",
        result: outcome(
          "rival_leadership_split_observed",
          "Un constat sans prise de position",
          "La rupture est actée dans le paysage politique sans que vous ayez à vous positionner sur elle. Le camp Reconquête traverse la période affaibli, indépendamment de votre choix.",
          [partySplit("reconquete", "reconquete_saint_cyr", "Rupture confirmée chez Reconquête")],
        ),
      }),
    ],
  }),
  event({
    id: "campaign_defend_unfairly_attacked_rival",
    title: "Une accusation jugée infondée vise un adversaire",
    category: "campaign",
    summary:
      "Une rumeur non vérifiée sur les comptes de campagne de Clara Villedieu circule en ligne. Vos propres équipes ont vérifié l’information et n’ont trouvé aucun élément la confirmant.",
    themes: ["institutions"],
    importance: "notable",
    phaseWeights: opponentPhases,
    minDecisionIndex: 9,
    excludedParties: ["ps"],
    entityReferences: [{ entityId: "ps", role: "subject" }],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "defend_rival_publicly",
        label: "Demander publiquement que la rumeur cesse tant qu’aucune preuve n’existe",
        tag: "LOYAL",
        strategy: "legal_action",
        result: outcome(
          "defend_rival_public_done",
          "Une prise de position publique et rare",
          "Le geste est salué pour son intégrité, y compris par des électeurs peu proches de votre ligne. Le camp socialiste prend acte du soutien inattendu, qui laisse une trace durable dans la relation entre les deux équipes.",
          [
            stat("credibility", 4, "Intégrité saluée"),
            relation("player", "ps", 10, "Soutien dans l’adversité"),
            memory("ps_candidate", "support", 45, { topic: "institutions" }),
            opponentStrategy(
              "ps_candidate",
              "consolidate_base",
              "Le camp PS resserre les rangs après le soutien reçu",
            ),
          ],
        ),
      }),
      decision({
        id: "defend_rival_stay_neutral",
        label: "Ne pas commenter et laisser chacun se faire son opinion",
        tag: "PRUDENT",
        strategy: "silence",
        result: outcome(
          "defend_rival_neutral_done",
          "Aucune prise de position",
          "La neutralité évite de s’exposer sur une affaire qui ne concerne pas directement votre camp. Elle prive aussi votre image d’un geste qui aurait pu être remarqué favorablement.",
          [hidden("consistency", 1)],
        ),
      }),
      decision({
        id: "defend_rival_amplify_doubt",
        label: "Diffuser la rumeur sous forme de question, sans l’affirmer directement",
        tag: "OPPORTUNISTE",
        strategy: "symbolic_action",
        result: outcome(
          "defend_rival_amplify_done",
          "Le doute entretenu sans affirmation directe",
          "Le procédé maintient la rumeur dans le débat public sans engager formellement votre responsabilité. Il est identifié comme tel par plusieurs médias, ce qui abîme votre propre crédibilité plus que celle visée.",
          [
            stat("rejection", 3, "Procédé jugé déloyal"),
            relation("player", "ps", -10, "Rumeur relayée sans preuve"),
            memory("ps_candidate", "hostility", 40, { topic: "institutions" }),
          ],
        ),
      }),
    ],
  }),
  event({
    id: "campaign_non_aggression_overture",
    title: "Une proposition de pacte de non-agression",
    category: "campaign",
    summary:
      "À l’approche d’un meeting régional partagé entre plusieurs candidatures, l’équipe de Maël Dargent (Renaissance) propose discrètement un pacte de non-agression médiatique pour la durée de l’événement commun, afin d’éviter tout incident qui nuirait à l’image de la rencontre.",
    themes: ["institutions"],
    importance: "routine",
    phaseWeights: opponentPhases,
    minDecisionIndex: 4,
    excludedParties: ["renaissance"],
    entityReferences: [{ entityId: "renaissance", role: "subject" }],
    editorialSensitivity: "none",
    choices: [
      decision({
        id: "non_aggression_accept",
        label: "Accepter le pacte pour la durée du meeting commun",
        tag: "RASSEMBLEUR",
        strategy: "negotiation",
        result: outcome(
          "non_aggression_accepted",
          "Une trêve limitée et respectée",
          "L’événement se déroule sans accroc et les deux équipes en sortent sur une image apaisée. Certains soutiens plus offensifs regrettent l’absence de contraste marqué ce jour-là.",
          [
            relation("player", "renaissance", 6, "Trêve respectée"),
            opponentStrategy(
              "renaissance_candidate",
              "look_presidential",
              "Le camp Renaissance mise sur l’apaisement",
            ),
            hidden("consistency", 1),
          ],
        ),
      }),
      decision({
        id: "non_aggression_conditional",
        label: "Accepter à condition d’un accord écrit valable jusqu’au premier tour",
        tag: "TECHNIQUE",
        strategy: "negotiation",
        result: outcome(
          "non_aggression_conditional_done",
          "Une trêve élargie, mais négociée âprement",
          "L’accord écrit sécurise une période plus longue de retenue mutuelle. La négociation, plus longue que prévu, retarde d’autres priorités de votre agenda de campagne cette semaine-là.",
          [
            relation("player", "renaissance", 9, "Accord formalisé"),
            hidden("transferability", 2),
            stat("mediaPresence", -1, "Semaine consacrée à la négociation"),
          ],
        ),
      }),
      decision({
        id: "non_aggression_refuse",
        label: "Refuser et maintenir une ligne critique y compris pendant le meeting commun",
        tag: "OFFENSIF",
        strategy: "break",
        result: outcome(
          "non_aggression_refused",
          "Le contraste maintenu jusqu’au bout",
          "Le refus marque une différence claire de méthode et mobilise les électeurs qui attendaient un contraste net. Il est aussi commenté comme un signe de tension entre les deux équipes lors d’un événement censé rassembler.",
          [
            stat("mobilization", 2, "Ligne critique maintenue"),
            relation("player", "renaissance", -7, "Trêve refusée publiquement"),
            candidateStatus(
              "renaissance_candidate",
              "official",
              "La candidature adverse n’est pas ébranlée",
            ),
          ],
        ),
      }),
    ],
  }),
];
