import type { GameEventDefinition } from "@/game/types";

import { alliance, bloc, directChoice, hidden, memory, relation, stat } from "../authoring";
import { partyEvent } from "./partyAuthoring";

export const v2RenaissancePartyEvents: GameEventDefinition[] = [
  partyEvent("renaissance", {
    id: "party_renaissance_identity",
    title: "Renaissance choisit continuité ou rupture",
    summary:
      "Les cadres sortants veulent défendre le bilan du bloc central, tandis que l’équipe de Maël Dargent réclame une autonomie visible. Le premier discours doit fixer la frontière sans renier les soutiens gouvernementaux.",
    themes: ["institutions", "economy"],
    importance: "major",
    entityReferences: [
      { entityId: "renaissance", role: "subject" },
      { entityId: "renaissance_candidate", role: "subject" },
    ],
    editorialSensitivity: "contextual",
    choices: [
      directChoice(
        "renaissance_identity_record",
        "Présenter cinq réformes à poursuivre et reconnaître publiquement deux méthodes à abandonner",
        "media_response",
        "TRANSPARENT",
        "renaissance_identity_inventory",
        "Le bilan reçoit une frontière précise",
        "L’inventaire protège les acquis économiques tout en ouvrant une rupture de méthode. Les soutiens les plus fidèles au pouvoir sortant regrettent que les erreurs occupent le titre.",
        [
          stat("credibility", 6, "Inventaire précis"),
          stat("rejection", -3, "Erreurs reconnues"),
          stat("cohesion", -2, "Fidèles contrariés"),
          hidden("consistency", 4),
        ],
        { outcome: { setFlags: { renaissance_selective_continuity: true } } },
      ),
      directChoice(
        "renaissance_identity_new_cycle",
        "Retirer les ministres sortants de l’affiche et lancer une convention avec des élus locaux",
        "long_term_strategy",
        "PRÉSIDENTIEL",
        "renaissance_identity_new_faces",
        "Une nouvelle équipe occupe la scène",
        "Les images rompent avec la campagne de succession et attirent des profils territoriaux. Plusieurs ministres continuent pourtant à intervenir sans coordination et fragilisent la cohésion du mouvement.",
        [
          stat("popularity", 4, "Nouveaux visages"),
          stat("localStrength", 5, "Élus invités"),
          stat("cohesion", -4, "Ministres écartés"),
          hidden("rivalAmbition", 3),
        ],
        { outcome: { setFlags: { renaissance_new_cycle: true } } },
      ),
      directChoice(
        "renaissance_identity_coalition",
        "Créer un conseil de coalition où Renaissance, Horizons et les indépendants valident les priorités",
        "alliance",
        "RASSEMBLEUR",
        "renaissance_identity_central_council",
        "Le bloc central se donne une instance",
        "La structure évite plusieurs candidatures concurrentes et rassure les élus. Maël Dargent doit désormais négocier chaque déplacement programmatique avec des partenaires qui disposent d’un veto politique.",
        [
          stat("cohesion", 5, "Conseil de coalition"),
          hidden("transferability", 5),
          relation("player", "horizons", 6),
          stat("credibility", 3, "Bloc organisé"),
        ],
      ),
    ],
  }),
  partyEvent("renaissance", {
    id: "party_renaissance_fronde",
    title: "Salomé Varenne défend le bilan",
    summary:
      "Salomé Varenne, cadre fictive de Renaissance, refuse que la campagne traite le quinquennat comme un fardeau. Elle rassemble des élus et demande un discours de continuité économique sans ambiguïté.",
    themes: ["economy", "institutions"],
    importance: "major",
    minDecisionIndex: 6,
    entityReferences: [{ entityId: "renaissance_varenne", role: "subject" }],
    editorialSensitivity: "contextual",
    chain: { id: "renaissance_record_conflict", step: 1 },
    choices: [
      directChoice(
        "renaissance_fronde_shared_speech",
        "Écrire avec Salomé Varenne un discours séparant résultats économiques et erreurs de méthode",
        "compromise",
        "RASSEMBLEUR",
        "renaissance_fronde_shared_record",
        "Le bilan devient un terrain commun",
        "Le discours évite la rupture personnelle et conserve les élus sortants en campagne. Chaque nouvelle critique de méthode devra cependant respecter une frontière minutieusement négociée.",
        [
          stat("cohesion", 6, "Discours commun"),
          stat("credibility", 4, "Bilan ordonné"),
          hidden("consistency", 3),
          memory("renaissance_varenne", "trust", 6, { targetPartyId: "player", topic: "economy" }),
        ],
        {
          outcome: {
            followUps: [
              {
                eventId: "party_renaissance_crisis_followup",
                afterDecisions: 5,
                probability: 0.65,
              },
            ],
            setFlags: { renaissance_record_compromise: true },
          },
        },
      ),
      directChoice(
        "renaissance_fronde_remove",
        "Retirer Salomé Varenne du comité stratégique et confier le bilan à une équipe indépendante",
        "internal_discipline",
        "OFFENSIF",
        "renaissance_fronde_removed",
        "La campagne reprend la maîtrise du bilan",
        "L’équipe indépendante publie des données utilisables et Maël Dargent gagne en autonomie. Les élus proches de Salomé Varenne suspendent leurs déplacements et attendent une occasion de peser.",
        [
          stat("credibility", 5, "Évaluation indépendante"),
          stat("cohesion", -7, "Cadre écartée"),
          stat("localStrength", -3, "Élus en retrait"),
          memory("renaissance_varenne", "humiliation", 8, {
            targetPartyId: "player",
            topic: "institutions",
          }),
        ],
        {
          outcome: {
            followUps: [
              {
                eventId: "party_renaissance_crisis_followup",
                afterDecisions: 3,
                probability: 0.86,
              },
            ],
            setFlags: { renaissance_varenne_removed: true },
          },
        },
      ),
    ],
  }),
  partyEvent("renaissance", {
    id: "party_renaissance_alliance",
    title: "Horizons propose une candidature commune",
    summary:
      "Horizons offre de retirer sa candidature si un accord fixe le programme économique, la place des élus locaux et la méthode de désignation du Premier ministre. Renaissance doit répondre avant une conférence annoncée.",
    themes: ["institutions", "economy"],
    importance: "decisive",
    entityReferences: [{ entityId: "horizons", role: "context" }],
    editorialSensitivity: "contextual",
    choices: [
      directChoice(
        "renaissance_alliance_full",
        "Signer l’accord et réserver un tiers du comité de campagne aux représentants d’Horizons",
        "alliance",
        "RASSEMBLEUR",
        "renaissance_alliance_central_unity",
        "Le centre présente une candidature commune",
        "Le retrait concurrent consolide les intentions de vote et ouvre les réseaux de maires. Les équipes Renaissance perdent des postes et doivent accepter plusieurs priorités de centre droit.",
        [
          stat("polling", 3, "Candidature centrale unique"),
          stat("localStrength", 5, "Maires partenaires"),
          stat("cohesion", -3, "Partage des postes"),
          alliance("horizons", "add", "Candidature commune"),
          relation("player", "horizons", 12),
        ],
      ),
      directChoice(
        "renaissance_alliance_second_round",
        "Proposer seulement un pacte de désistement réciproque pour le second tour",
        "negotiation",
        "PRUDENT",
        "renaissance_alliance_runoff_only",
        "Les deux candidatures restent en lice",
        "Le pacte limite la violence des attaques et prépare des reports de voix. La concurrence continue néanmoins à diviser le même électorat pendant toute la campagne officielle.",
        [
          hidden("transferability", 6),
          relation("player", "horizons", 5),
          stat("polling", -1, "Bloc toujours divisé"),
          stat("cohesion", 3, "Équipe préservée"),
        ],
      ),
      directChoice(
        "renaissance_alliance_refuse",
        "Refuser toute négociation et publier les divergences économiques avec Horizons",
        "break",
        "CLIVANT",
        "renaissance_alliance_competition",
        "La compétition du centre devient publique",
        "La clarification distingue le programme de Maël Dargent et remobilise les adhérents. Horizons utilise aussitôt le document pour cibler les électeurs de centre droit.",
        [
          stat("mobilization", 4, "Autonomie défendue"),
          stat("credibility", 3, "Différences publiques"),
          relation("player", "horizons", -10),
          hidden("transferability", -5),
        ],
      ),
    ],
  }),
  partyEvent("renaissance", {
    id: "party_renaissance_signature",
    title: "Le fonds industriel européen se précise",
    summary:
      "La campagne veut financer les technologies bas-carbone à l’échelle européenne. Les entreprises demandent un accès rapide, tandis que les partenaires veulent des contreparties sociales et une préférence de production.",
    themes: ["europe", "economy", "ecology"],
    importance: "major",
    entityReferences: [
      { entityId: "commission_europeenne", role: "institution" },
      { entityId: "union_europeenne", role: "context" },
    ],
    editorialSensitivity: "none",
    choices: [
      directChoice(
        "renaissance_signature_european_fund",
        "Conditionner les aides européennes à la production en Europe et à un accord salarial d’entreprise",
        "policy_commitment",
        "TECHNIQUE",
        "renaissance_signature_conditional_fund",
        "Le fonds associe industrie et salaires",
        "Les contreparties rendent le projet défendable auprès des syndicats et des partenaires européens. Certaines entreprises jugent les conditions trop lentes pour leurs calendriers d’investissement.",
        [
          stat("credibility", 6, "Conditions vérifiables"),
          bloc("executives", 4),
          bloc("public_services", 2),
          bloc("entrepreneurs", -1),
          hidden("consistency", 4),
        ],
        {
          statement: {
            topic: "european_industry_fund",
            policyTopic: "europe",
            text: "Les aides industrielles européennes exigeront production locale et négociation salariale",
            stance: 54,
            ideology: { europe: 6, economy: 2 },
          },
        },
      ),
      directChoice(
        "renaissance_signature_fast_track",
        "Réserver un guichet accéléré aux projets capables d’ouvrir une usine sous deux ans",
        "program_shift",
        "OFFENSIF",
        "renaissance_signature_fast_factories",
        "Les projets rapides passent devant",
        "Le calendrier industriel devient concret et attire plusieurs annonces d’investissement. Les régions moins préparées et les syndicats craignent que la vitesse réduise les garanties locales.",
        [
          bloc("entrepreneurs", 6),
          stat("momentum", 5, "Usines annoncées"),
          stat("localStrength", -2, "Territoires inégaux"),
          hidden("consistency", 1),
        ],
      ),
    ],
  }),
  partyEvent("renaissance", {
    id: "party_renaissance_local_asset",
    title: "Les parlementaires proposent cent permanences",
    summary:
      "Des députés et sénateurs du bloc central mettent leurs permanences à disposition de la campagne. Ils souhaitent choisir les thèmes locaux et apparaître sur les supports distribués dans leur circonscription.",
    themes: ["institutions"],
    importance: "notable",
    entityReferences: [
      { entityId: "assemblee_nationale", role: "context" },
      { entityId: "senat", role: "context" },
    ],
    editorialSensitivity: "none",
    choices: [
      directChoice(
        "renaissance_local_constituency_contracts",
        "Signer avec chaque parlementaire un contrat local limité à deux priorités vérifiables",
        "negotiation",
        "INSTITUTIONNEL",
        "renaissance_local_contracts",
        "Cent contrats relient le programme aux territoires",
        "Les élus ouvrent leurs réseaux et produisent des engagements adaptés sans réécrire tout le programme. Le suivi de deux cents priorités mobilise une équipe nationale entière.",
        [
          stat("localStrength", 7, "Permanences ouvertes"),
          stat("mobilization", 4, "Réseaux d’élus"),
          stat("credibility", 3, "Priorités vérifiables"),
          stat("finances", -2, "Équipe de suivi"),
        ],
      ),
      directChoice(
        "renaissance_local_national_kit",
        "Fournir le même matériel national aux permanences et refuser toute adaptation programmatique",
        "internal_discipline",
        "PRUDENT",
        "renaissance_local_uniform_material",
        "Le réseau diffuse une campagne uniforme",
        "Les supports arrivent vite et le message reste cohérent sur tout le territoire. Plusieurs parlementaires utilisent leurs permanences sans s’engager personnellement dans les réunions publiques.",
        [
          stat("awareness", 4, "Diffusion nationale"),
          hidden("consistency", 4),
          stat("localStrength", 2, "Soutiens distants"),
          stat("cohesion", 2, "Cadre commun"),
        ],
      ),
    ],
  }),
  partyEvent("renaissance", {
    id: "party_renaissance_crisis_followup",
    title: "Les élus du bilan demandent réparation",
    summary:
      "Le conflit sur l’héritage gouvernemental revient au bureau exécutif. Salomé Varenne veut une place formelle dans le dispositif ou un vote qui oblige la candidate à assumer sa stratégie.",
    themes: ["institutions", "economy"],
    importance: "major",
    rarity: "uncommon",
    minDecisionIndex: 10,
    entityReferences: [{ entityId: "renaissance_varenne", role: "subject" }],
    editorialSensitivity: "contextual",
    chain: {
      id: "renaissance_record_conflict",
      step: 2,
      followsEventIds: ["party_renaissance_fronde"],
    },
    choices: [
      directChoice(
        "renaissance_crisis_record_committee",
        "Créer un comité du bilan présidé par Salomé Varenne avec un droit de réponse public",
        "compromise",
        "RASSEMBLEUR",
        "renaissance_crisis_committee",
        "Le bilan obtient son propre comité",
        "Les élus reviennent dans la campagne et disposent d’un lieu pour corriger les attaques. Deux lignes de communication coexistent désormais et devront éviter de se contredire.",
        [
          stat("cohesion", 6, "Élus réintégrés"),
          stat("localStrength", 4, "Soutiens revenus"),
          hidden("consistency", -2),
          memory("renaissance_varenne", "support", 6, {
            targetPartyId: "player",
            topic: "institutions",
          }),
        ],
      ),
      directChoice(
        "renaissance_crisis_confidence_vote",
        "Demander un vote de confiance sur votre autonomie et annoncer le départ des opposants",
        "personal_risk",
        "RISQUÉ",
        "renaissance_crisis_candidate_wins",
        "Le parti choisit la candidate plutôt que le bilan",
        "La majorité confirme la ligne et les interventions deviennent cohérentes. Une minorité d’élus quitte les instances, privant la campagne de relais dans plusieurs territoires disputés.",
        [
          stat("credibility", 7, "Autorité validée"),
          hidden("consistency", 5),
          stat("localStrength", -6, "Élus partis"),
          stat("cohesion", -4, "Départs assumés"),
        ],
      ),
    ],
  }),
  partyEvent("renaissance", {
    id: "party_renaissance_electorate",
    title: "Les classes moyennes demandent un gain net",
    summary:
      "Des panels d’électeurs comprennent les réformes proposées mais ne voient pas leur effet sur le revenu disponible. L’équipe doit choisir une mesure simple sans abandonner la crédibilité budgétaire.",
    themes: ["fiscality", "work"],
    importance: "major",
    choices: [
      directChoice(
        "renaissance_electorate_work_credit",
        "Créer un crédit d’impôt mensuel pour les salariés modestes financé par la suppression de niches ciblées",
        "policy_commitment",
        "POPULAIRE",
        "renaissance_electorate_monthly_credit",
        "Le gain apparaît sur chaque fiche de paie",
        "La mesure répond à la demande de lisibilité et cible les actifs. Les secteurs bénéficiaires des niches supprimées organisent rapidement leur opposition et contestent les estimations.",
        [
          bloc("middle_class_workers", 7),
          stat("popularity", 5, "Gain mensuel"),
          bloc("entrepreneurs", -2),
          stat("credibility", 3, "Financement identifié"),
        ],
        {
          statement: {
            topic: "monthly_work_credit",
            policyTopic: "fiscality",
            text: "Un crédit d’impôt mensuel augmentera le revenu des salariés modestes",
            stance: 16,
            ideology: { economy: 2 },
          },
        },
      ),
      directChoice(
        "renaissance_electorate_public_services",
        "Garantir plutôt la gratuité de plusieurs services essentiels pour les ménages sous le revenu médian",
        "program_shift",
        "RASSEMBLEUR",
        "renaissance_electorate_service_guarantee",
        "Le gain passe par les dépenses évitées",
        "Les familles comprennent le bénéfice sur les transports et la garde d’enfants. Le changement brouille la ligne fiscale initiale et exige des accords avec les collectivités.",
        [
          bloc("middle_class_workers", 5),
          bloc("public_services", 5),
          stat("localStrength", 2, "Collectivités associées"),
          hidden("consistency", -3),
        ],
      ),
    ],
  }),
  partyEvent("renaissance", {
    id: "party_renaissance_program_dilemma",
    title: "La réforme des retraites revient",
    summary:
      "Les adversaires ramènent chaque entretien à l’âge de départ. Les équipes hésitent entre défendre la réforme, l’aménager pour les carrières longues ou ouvrir une négociation entièrement nouvelle.",
    themes: ["pensions", "work"],
    importance: "decisive",
    choices: [
      directChoice(
        "renaissance_program_long_careers",
        "Maintenir le cadre et garantir un départ anticipé automatique après quarante-trois années cotisées",
        "compromise",
        "TECHNIQUE",
        "renaissance_program_career_amendment",
        "Les carrières longues obtiennent une règle simple",
        "L’aménagement répond à une injustice clairement identifiée sans rouvrir tout le financement. Les syndicats demandent encore la prise en compte de la pénibilité et des interruptions.",
        [
          bloc("middle_class_workers", 5),
          stat("credibility", 4, "Règle cotisée"),
          stat("cohesion", 2, "Cadre maintenu"),
          hidden("consistency", 3),
        ],
        {
          statement: {
            topic: "long_careers_retirement",
            policyTopic: "pensions",
            text: "Quarante-trois années cotisées ouvriront automatiquement un départ anticipé",
            stance: 28,
            ideology: { economy: 2 },
          },
        },
      ),
      directChoice(
        "renaissance_program_social_conference",
        "Suspendre les prochaines étapes et convoquer une conférence de financement avec les partenaires sociaux",
        "negotiation",
        "PRUDENT",
        "renaissance_program_pension_conference",
        "La réforme retourne à la négociation",
        "Les syndicats reprennent les échanges et le rejet recule parmi les salariés. Les soutiens réformateurs dénoncent un renoncement qui fragilise la crédibilité économique de la candidate.",
        [
          stat("rejection", -5, "Dialogue rouvert"),
          bloc("public_services", 4),
          stat("credibility", -3, "Réforme suspendue"),
          hidden("consistency", -4),
        ],
      ),
    ],
  }),
  partyEvent("renaissance", {
    id: "party_renaissance_runoff",
    title: "Le bloc républicain demande des preuves",
    summary:
      "Qualifié, Maël Dargent reçoit des soutiens conditionnels venus du centre, de la gauche et de la droite modérée. Leur électorat veut des engagements démocratiques plutôt qu’un simple appel contre l’adversaire.",
    themes: ["institutions", "civil_liberties", "europe"],
    importance: "decisive",
    phaseWeights: { between_rounds: 1.4 },
    eligibility: [
      { kind: "qualified", value: true },
      { kind: "party_not_opponent", partyIds: ["horizons", "ps"] },
    ],
    choices: [
      directChoice(
        "renaissance_runoff_democratic_contract",
        "Signer un contrat sur le Parlement, les libertés publiques et l’Europe avec les soutiens du second tour",
        "alliance",
        "RASSEMBLEUR",
        "renaissance_runoff_contract",
        "Le front de second tour reçoit trois garanties",
        "Les soutiens peuvent défendre des engagements positifs et leurs réseaux se mobilisent. Plusieurs mesures économiques restent hors de l’accord et continueront d’alimenter le rejet social.",
        [
          hidden("transferability", 9),
          stat("mobilization", 6, "Soutiens actifs"),
          stat("rejection", -3, "Garanties démocratiques"),
          alliance("horizons", "add", "Contrat de second tour"),
          relation("player", "ps", 4),
        ],
      ),
      directChoice(
        "renaissance_runoff_no_bargain",
        "Refuser les négociations d’appareil et publier uniquement une adresse personnelle aux électeurs éliminés",
        "media_response",
        "PRÉSIDENTIEL",
        "renaissance_runoff_direct_appeal",
        "La candidate parle sans accord intermédiaire",
        "Le message conserve une image d’autonomie et obtient une forte audience. Les partis éliminés donnent des consignes plus froides et prêtent peu de militants à la dernière semaine.",
        [
          stat("mediaPresence", 7, "Adresse nationale"),
          stat("credibility", 4, "Autonomie maintenue"),
          hidden("transferability", 3),
          stat("mobilization", -2, "Appareils distants"),
        ],
      ),
    ],
  }),
  partyEvent("renaissance", {
    id: "party_renaissance_rare",
    title: "Des anciens ministres publient leur manifeste",
    summary:
      "Un groupe de ministres fictifs et d’anciens responsables de la majorité publie un manifeste pour une candidature de continuité. Ils ne citent personne, mais leur calendrier vise directement Maël Dargent.",
    themes: ["institutions", "economy"],
    importance: "decisive",
    rarity: "rare",
    baseWeight: 0.24,
    minDecisionIndex: 9,
    entityReferences: [{ entityId: "renaissance_candidate", role: "subject" }],
    editorialSensitivity: "contextual",
    choices: [
      directChoice(
        "renaissance_rare_open_convention",
        "Inviter les signataires à défendre leur manifeste lors d’une convention retransmise et conclure le débat",
        "personal_risk",
        "RISQUÉ",
        "renaissance_rare_public_arbitration",
        "La fracture se règle devant les adhérents",
        "Le débat rend les divergences compréhensibles et Maël Dargent peut obtenir un mandat net. Une prestation faible transformerait toutefois une contestation diffuse en alternative organisée.",
        [
          stat("mediaPresence", 7, "Convention retransmise"),
          stat("mobilization", 4, "Débat suivi"),
          hidden("rivalAmbition", 5),
          stat("cohesion", -2, "Divergences exposées"),
        ],
        { outcome: { setFlags: { renaissance_manifesto_debated: true } } },
      ),
      directChoice(
        "renaissance_rare_policy_absorption",
        "Reprendre deux propositions du manifeste et offrir aux signataires un comité de suivi sans pouvoir de veto",
        "compromise",
        "OPPORTUNISTE",
        "renaissance_rare_manifesto_absorbed",
        "Le manifeste perd son rôle de candidature",
        "Les propositions absorbées réduisent l’espace d’une contestation concurrente et ramènent plusieurs élus. L’opération nourrit le soupçon d’un programme ajusté pour régler les rapports de force.",
        [
          stat("cohesion", 5, "Signataires associés"),
          stat("localStrength", 3, "Élus revenus"),
          hidden("consistency", -4),
          stat("rejection", 2, "Arrangement visible"),
        ],
      ),
    ],
  }),

  // --- P3/P4 (fun improvement mission) : identité de gameplay — voir
  // PARTY_GAMEPLAY_IDENTITIES.md et FUN_IMPROVEMENTS_REPORT.md. Renaissance
  // avait le score d'identité le plus bas du jeu (2,5/10,
  // AUDIT_FUN_REJOUABILITE.md §11) : les événements suivants donnent au
  // parti sa propre tension mécanique — l'héritage d'un pouvoir déjà
  // exercé, testé contre les faits plutôt que simplement revendiqué ou
  // renié — et raccordent un événement rare existant
  // (party_renaissance_rare) qui posait déjà un flag jamais consommé.
  partyEvent("renaissance", {
    id: "party_renaissance_legacy_test",
    title: "Le bilan face aux chiffres",
    summary:
      "Une émission compare, colonne par colonne, les engagements pris par la majorité sortante et ce qui a été réellement livré. Deux colonnes sur cinq affichent un écart net. Maël Dargent doit répondre en direct, sans notes préparées à l’avance.",
    themes: ["economy", "institutions"],
    importance: "decisive",
    minDecisionIndex: 9,
    maxDecisionIndex: 18,
    entityReferences: [{ entityId: "renaissance_candidate", role: "subject" }],
    editorialSensitivity: "none",
    chain: { id: "renaissance_legacy_arc", step: 1 },
    choices: [
      directChoice(
        "renaissance_legacy_own_gaps",
        "Reconnaître les deux écarts sans détour et expliquer précisément ce qui a manqué",
        "media_response",
        "TRANSPARENT",
        "renaissance_legacy_gaps_owned",
        "Le bilan admet ses limites en direct",
        "L’aveu précis surprend par son absence de langue de bois et coupe court à l’accusation d’arrogance du pouvoir. Une partie des cadres sortants juge que l’exercice fragilise inutilement cinq années de travail.",
        [
          stat("credibility", 6, "Écarts reconnus"),
          stat("rejection", -3, "Sincérité perçue"),
          stat("cohesion", -3, "Cadres sortants contrariés"),
          hidden("consistency", 3),
        ],
        {
          outcome: {
            setFlags: { renaissance_legacy_gaps_owned: true },
            followUps: [
              {
                eventId: "party_renaissance_legacy_credited",
                afterDecisions: 5,
                probability: 0.65,
              },
            ],
          },
        },
      ),
      directChoice(
        "renaissance_legacy_defend_all",
        "Défendre l’intégralité du bilan et attribuer les deux écarts à un contexte extérieur",
        "policy_commitment",
        "PRÉSIDENTIEL",
        "renaissance_legacy_defended",
        "Le bilan est défendu sans concession",
        "La ligne rassure les électeurs qui craignaient un désaveu du travail accompli. Les deux écarts, non reconnus comme tels, reviennent régulièrement dans la bouche des adversaires pendant le reste de la campagne.",
        [
          stat("credibility", 3, "Bilan défendu"),
          stat("cohesion", 4, "Ligne unifiée"),
          hidden("consistency", -2),
          stat("rejection", 2, "Défense jugée rigide"),
        ],
        {
          outcome: {
            setFlags: { renaissance_legacy_defended_fully: true },
            followUps: [
              {
                eventId: "party_renaissance_legacy_confronted",
                afterDecisions: 5,
                probability: 0.65,
              },
            ],
          },
        },
      ),
      directChoice(
        "renaissance_legacy_pivot_future",
        "Refuser de s’attarder sur le passé et consacrer la réponse au mandat à venir",
        "long_term_strategy",
        "OPPORTUNISTE",
        "renaissance_legacy_future_pivot",
        "La réponse saute directement au futur",
        "Le pivot évite d’entrer dans le détail des deux écarts et donne un ton résolument tourné vers l’avenir. Les chroniqueurs notent que la question posée n’a, à aucun moment, reçu de réponse directe.",
        [
          stat("mediaPresence", 2, "Ton tourné vers l’avenir"),
          stat("credibility", -1, "Question éludée"),
        ],
      ),
    ],
  }),
  partyEvent("renaissance", {
    id: "party_renaissance_legacy_confronted",
    title: "Les deux écarts reviennent en boucle",
    summary:
      "Faute d’avoir été reconnus, les deux écarts du bilan sont désormais cités par chaque adversaire comme la preuve d’un déni. Une association de contrôle des politiques publiques propose de les documenter avec vous, en contradictoire, avant qu’un tiers ne le fasse sans vous.",
    themes: ["economy", "institutions"],
    importance: "major",
    rarity: "uncommon",
    minDecisionIndex: 14,
    editorialSensitivity: "none",
    chain: {
      id: "renaissance_legacy_arc",
      step: 2,
      followsEventIds: ["party_renaissance_legacy_test"],
    },
    eligibility: [{ kind: "flag", key: "renaissance_legacy_defended_fully", equals: true }],
    choices: [
      directChoice(
        "legacy_confronted_join",
        "Participer à l’exercice contradictoire et corriger publiquement la position initiale",
        "compromise",
        "TRANSPARENT",
        "legacy_confronted_corrected",
        "La correction arrive tard, mais elle arrive",
        "La participation limite les dégâts et permet de documenter enfin les deux écarts avec précision. Le revirement, après une défense totale, alimente une accusation de manque de constance.",
        [
          stat("credibility", 3, "Correction documentée"),
          hidden("consistency", -3),
          stat("rejection", -1, "Exercice contradictoire salué"),
        ],
      ),
      directChoice(
        "legacy_confronted_hold",
        "Refuser l’exercice et maintenir que le bilan ne comporte aucun écart réel",
        "break",
        "CLIVANT",
        "legacy_confronted_denied",
        "Le déni devient la ligne officielle",
        "Le refus évite tout aveu tardif mais laisse le sujet entièrement occupé par les adversaires. Le déni, répété, devient lui-même un angle d’attaque distinct des deux écarts d’origine.",
        [
          stat("cohesion", 2, "Ligne maintenue"),
          stat("credibility", -4, "Déni prolongé"),
          stat("rejection", 3, "Constance jugée aveugle"),
        ],
      ),
    ],
  }),
  partyEvent("renaissance", {
    id: "party_renaissance_legacy_credited",
    title: "L’aveu initial est mis à l’épreuve du concret",
    summary:
      "Après avoir reconnu les deux écarts, Renaissance est désormais attendue sur des engagements précis pour les corriger, avec calendrier et financement. Un aveu sans plan concret ferait apparaître la transparence initiale comme un simple exercice de communication.",
    themes: ["economy", "institutions"],
    importance: "major",
    rarity: "uncommon",
    minDecisionIndex: 14,
    editorialSensitivity: "none",
    chain: {
      id: "renaissance_legacy_arc",
      step: 2,
      followsEventIds: ["party_renaissance_legacy_test"],
    },
    eligibility: [{ kind: "flag", key: "renaissance_legacy_gaps_owned", equals: true }],
    choices: [
      directChoice(
        "legacy_credited_plan",
        "Publier un calendrier chiffré de correction des deux écarts, engagement par engagement",
        "policy_commitment",
        "TECHNIQUE",
        "legacy_credited_plan_published",
        "L’aveu se transforme en plan vérifiable",
        "Le calendrier donne un contenu concret à la sincérité déjà reconnue et devient une référence que la presse peut suivre. Chaque retard, désormais mesurable, pourra aussi être reproché plus précisément.",
        [
          stat("credibility", 6, "Plan chiffré"),
          hidden("economicCompetence", 3),
          hidden("consistency", 3),
        ],
      ),
      directChoice(
        "legacy_credited_general",
        "Présenter des engagements généraux sans calendrier précis pour garder de la marge",
        "media_response",
        "PRUDENT",
        "legacy_credited_generalized",
        "La sincérité reste sans échéance",
        "La prudence évite un calendrier qui pourrait devenir un boulet, mais elle rapproche la démarche d’une déclaration d’intention. Une partie de la presse qui avait salué l’aveu initial exprime sa déception.",
        [
          stat("credibility", -2, "Engagements jugés flous"),
          stat("rejection", 1, "Sincérité affaiblie"),
        ],
      ),
    ],
  }),
  partyEvent("renaissance", {
    id: "party_renaissance_manifesto_aftermath",
    title: "Le débat du manifeste laisse des traces",
    summary:
      "La convention retransmise avec les anciens ministres signataires a eu lieu. Certains veulent maintenant un rôle formel dans la campagne ; d’autres estiment que le débat a suffi et souhaitent en rester là.",
    themes: ["institutions"],
    importance: "major",
    rarity: "uncommon",
    minDecisionIndex: 12,
    entityReferences: [{ entityId: "renaissance_candidate", role: "subject" }],
    editorialSensitivity: "contextual",
    chain: {
      id: "renaissance_manifesto_arc",
      step: 2,
      followsEventIds: ["party_renaissance_rare"],
    },
    eligibility: [{ kind: "flag", key: "renaissance_manifesto_debated", equals: true }],
    choices: [
      directChoice(
        "manifesto_aftermath_formalize",
        "Créer un comité consultatif formel pour les signataires les plus constructifs",
        "alliance",
        "RASSEMBLEUR",
        "manifesto_aftermath_committee",
        "Le débat se prolonge en structure",
        "Le comité canalise l’énergie du manifeste vers un rôle défini et réduit le risque d’une candidature concurrente. Certains signataires jugent le rôle purement consultatif insuffisant après un débat aussi exposé.",
        [
          stat("cohesion", 4, "Signataires canalisés"),
          hidden("transferability", 3),
          hidden("rivalAmbition", -2),
        ],
      ),
      directChoice(
        "manifesto_aftermath_close",
        "Considérer le débat comme clos et revenir à l’agenda de campagne prévu",
        "silence",
        "PRUDENT",
        "manifesto_aftermath_closed",
        "La séquence se referme sans suite organisée",
        "Le retour à l’agenda évite de donner davantage de place à une contestation déjà exposée publiquement. Les signataires les plus déterminés estiment ne pas avoir reçu de réponse et gardent leurs réseaux mobilisés.",
        [hidden("rivalAmbition", 3), stat("cohesion", -1, "Signataires sans réponse")],
      ),
    ],
  }),
  partyEvent("renaissance", {
    id: "party_renaissance_defend_center",
    title: "Horizons et Nouvelle Énergie visent le même électorat",
    summary:
      "Les instituts de sondage confirment que Renaissance perd des électeurs modérés au profit d’Horizons et de Nouvelle Énergie sur exactement les mêmes thèmes de compétence économique et de sérieux budgétaire. La ligne qui a fait la force du mouvement devient aussi son terrain le plus disputé.",
    themes: ["economy", "institutions"],
    importance: "major",
    minDecisionIndex: 10,
    entityReferences: [
      { entityId: "horizons", role: "subject" },
      { entityId: "nouvelle_energie", role: "subject" },
    ],
    editorialSensitivity: "none",
    choices: [
      directChoice(
        "defend_center_differentiate",
        "Augmenter volontairement l’ambition d’une mesure économique pour se distinguer nettement des deux concurrents",
        "policy_commitment",
        "CLIVANT",
        "defend_center_sharpened",
        "Une ligne plus tranchée redessine la frontière",
        "La mesure durcie donne un contraste net avec Horizons et Nouvelle Énergie et redonne de la visibilité à la candidature. Une partie de l’électorat central le plus modéré juge le virage plus risqué que nécessaire.",
        [
          stat("mediaPresence", 4, "Ligne distincte"),
          hidden("economicCompetence", 3),
          stat("rejection", 2, "Virage jugé risqué"),
        ],
      ),
      directChoice(
        "defend_center_absorb",
        "Intégrer discrètement dans le programme les mesures les plus reprises par les deux concurrents",
        "program_shift",
        "OPPORTUNISTE",
        "defend_center_absorbed",
        "Le programme s’élargit sans le dire",
        "L’intégration réduit l’écart perçu avec Horizons et Nouvelle Énergie sur leurs propres thèmes. Les électeurs les plus attentifs remarquent la ressemblance grandissante et posent la question de la différence réelle.",
        [
          hidden("transferability", 3),
          stat("credibility", -2, "Ressemblance remarquée"),
          hidden("consistency", -2),
        ],
      ),
      directChoice(
        "defend_center_ignore",
        "Maintenir le programme actuel et miser sur l’expérience gouvernementale comme différence suffisante",
        "long_term_strategy",
        "PRÉSIDENTIEL",
        "defend_center_unchanged",
        "L’expérience seule doit faire la différence",
        "Le choix évite toute agitation programmatique et mise sur un contraste déjà établi. Les instituts confirment la semaine suivante que la perte d’électeurs modérés se poursuit au même rythme.",
        [stat("credibility", 1, "Ligne stable"), stat("popularity", -2, "Érosion continue")],
      ),
    ],
  }),

  // --- Passe ciblée post-fun (TARGETED_GAMEPLAY_PASS_REPORT.md), Phase C.
  // Diagnostic préalable (scripts/targeted-pass/renaissance-diagnostic.ts) :
  // l'arc héritage n'apparaît que dans ~21 % des campagnes et ne pèse que
  // ~7 % des décisions spécifiques au parti — il n'est PAS structurellement
  // sur-représenté (l'hypothèse de concentration excessive est infirmée par
  // la mesure, pas supposée). Le renfort porte donc sur la diversité
  // d'ensemble : deux axes indépendants supplémentaires, dont un qui
  // consomme enfin le drapeau renaissance_new_cycle posé par
  // party_renaissance_identity depuis la mission précédente sans jamais
  // être lu par aucun événement.

  // Axe 1 — renouvellement de génération (ne dépend pas de l'arc héritage).
  partyEvent("renaissance", {
    id: "party_renaissance_generation_test",
    title: "Les nouveaux visages doivent livrer, pas seulement apparaître",
    summary:
      "Les élus territoriaux mis en avant au lancement de la campagne ont assuré la photo. Les cadres sortants, eux, attendent de voir s’ils obtiennent une vraie responsabilité ou s’ils restent des figurants soigneusement choisis.",
    themes: ["institutions"],
    importance: "major",
    minDecisionIndex: 13,
    maxDecisionIndex: 17,
    editorialSensitivity: "none",
    chain: { id: "renaissance_generation_arc", step: 1 },
    eligibility: [{ kind: "flag", key: "renaissance_new_cycle", equals: true }],
    choices: [
      directChoice(
        "renaissance_generation_delegate",
        "Confier à deux élus territoriaux la responsabilité réelle d’un volet entier du programme",
        "long_term_strategy",
        "RASSEMBLEUR",
        "renaissance_generation_delegated",
        "Le renouvellement obtient un vrai pouvoir",
        "La délégation donne un contenu concret au discours de rupture générationnelle et responsabilise des figures jusque-là décoratives. Plusieurs cadres sortants jugent la manœuvre prématurée et resserrent leurs propres réseaux d’influence.",
        [
          stat("localStrength", 6, "Responsabilité déléguée"),
          stat("momentum", 4, "Renouvellement crédibilisé"),
          stat("cohesion", -4, "Cadres sortants resserrés"),
          hidden("rivalAmbition", 2),
        ],
        {
          outcome: {
            setFlags: { renaissance_generation_delivered: true },
            followUps: [
              {
                eventId: "party_renaissance_generation_payoff",
                afterDecisions: 4,
                probability: 0.7,
              },
            ],
          },
        },
      ),
      directChoice(
        "renaissance_generation_keep_advisory",
        "Garder les décisions centralisées et limiter les nouveaux visages à un rôle consultatif",
        "internal_discipline",
        "PRUDENT",
        "renaissance_generation_advisory_only",
        "Le renouvellement reste une image",
        "La prudence évite tout couac de débutant à un moment sensible de la campagne. Le contraste entre le discours de renouvellement et l’absence de responsabilité réelle commence à être relevé par la presse spécialisée.",
        [
          stat("credibility", 2, "Aucun couac"),
          stat("momentum", -3, "Renouvellement jugé cosmétique"),
          stat("rejection", 1, "Contraste relevé"),
        ],
        { outcome: { setFlags: { renaissance_generation_cosmetic: true } } },
      ),
    ],
  }),
  partyEvent("renaissance", {
    id: "party_renaissance_generation_payoff",
    title: "Une figure de la nouvelle génération sort du cadre",
    summary:
      "L’un des élus territoriaux auxquels vous avez confié une vraie responsabilité improvise en direct une position plus tranchée que la ligne officielle sur un sujet sensible. L’extrait circule déjà largement.",
    themes: ["institutions"],
    importance: "decisive",
    rarity: "uncommon",
    minDecisionIndex: 15,
    editorialSensitivity: "none",
    chain: {
      id: "renaissance_generation_arc",
      step: 2,
      followsEventIds: ["party_renaissance_generation_test"],
    },
    eligibility: [{ kind: "flag", key: "renaissance_generation_delivered", equals: true }],
    choices: [
      directChoice(
        "generation_payoff_back",
        "Soutenir publiquement la sortie et l’intégrer à la ligne de campagne",
        "media_response",
        "RISQUÉ",
        "generation_payoff_backed",
        "La candidate assume le dérapage assumé",
        "Le soutien donne du relief à une candidature encore jugée trop lisse et confirme que le renouvellement pèse vraiment. La ligne officielle, désormais moins prévisible, devient plus difficile à tenir pour le reste de l’équipe.",
        [
          stat("momentum", 6, "Renouvellement assumé"),
          stat("mediaPresence", 4, "Sortie remarquée"),
          hidden("consistency", -3),
          stat("cohesion", -2, "Ligne moins prévisible"),
        ],
      ),
      directChoice(
        "generation_payoff_rein_in",
        "Reprendre publiquement le contrôle du message et recadrer la sortie de l’élu",
        "internal_discipline",
        "PRUDENT",
        "generation_payoff_reined_in",
        "Le contrôle du message reprend le dessus",
        "Le recadrage rassure sur la discipline de la campagne mais dément aussitôt le discours de responsabilité réelle donné aux nouveaux visages. La figure recadrée en tire une leçon dont l’équipe se souviendra.",
        [
          stat("cohesion", 3, "Message recentré"),
          stat("credibility", 2, "Discipline réaffirmée"),
          stat("momentum", -4, "Renouvellement démenti"),
        ],
      ),
    ],
  }),

  // Axe 3 — réseau gouvernemental hérité vs autonomie de campagne
  // (indépendant des axes 1 et 2, ne partage aucun drapeau avec eux).
  partyEvent("renaissance", {
    id: "party_renaissance_network_or_autonomy",
    title: "Faut-il encore s’appuyer sur l’ancien réseau ?",
    summary:
      "Les sondages hésitent. Une partie de l’état-major veut mobiliser à plein le réseau national d’élus et de ministres issus du gouvernement sortant pour la logistique et la crédibilité. Une autre veut construire, indépendamment de ce réseau, une organisation de campagne qui doit tout à elle-même.",
    themes: ["institutions"],
    importance: "decisive",
    minDecisionIndex: 12,
    maxDecisionIndex: 19,
    entityReferences: [
      { entityId: "assemblee_nationale", role: "context" },
      { entityId: "senat", role: "context" },
    ],
    editorialSensitivity: "none",
    choices: [
      directChoice(
        "renaissance_network_lean_on",
        "Mobiliser pleinement le réseau national d’élus et de ministres sortants pour la logistique",
        "grassroots_mobilization",
        "INSTITUTIONNEL",
        "renaissance_network_leaned_on",
        "Le réseau hérité prend en charge le terrain",
        "L’organisation gagne en rapidité et en couverture territoriale grâce à un appareil déjà rodé. Le lien avec un gouvernement sortant diversement apprécié colle à chaque déplacement organisé par ce réseau.",
        [
          stat("localStrength", 7, "Réseau national mobilisé"),
          stat("credibility", 3, "Organisation rodée"),
          stat("rejection", 2, "Lien avec le pouvoir sortant"),
          hidden("consistency", 1),
        ],
        { outcome: { setFlags: { renaissance_leaned_on_network: true } } },
      ),
      directChoice(
        "renaissance_network_build_autonomous",
        "Construire une organisation de campagne autonome, indépendante du réseau gouvernemental",
        "long_term_strategy",
        "RISQUÉ",
        "renaissance_network_built_autonomous",
        "Une organisation qui repart de zéro",
        "L’autonomie donne un signal de rupture avec le gouvernement sortant et attire des bénévoles qui ne voulaient pas rejoindre l’ancien appareil. La construction coûte cher et laisse plusieurs territoires moins couverts que prévu.",
        [
          stat("momentum", 5, "Signal de rupture"),
          stat("mediaPresence", 3, "Organisation nouvelle"),
          stat("localStrength", -3, "Couverture inégale"),
          stat("finances", -4, "Construction coûteuse"),
        ],
        { outcome: { setFlags: { renaissance_built_autonomy: true } } },
      ),
    ],
  }),
];
