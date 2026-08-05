import type { GameEventDefinition } from "@/game/types";

import { choice, event, hidden, outcome, stat } from "../authoring";

const openCampaign = { pre_campaign: 1, campaign: 1, official_campaign: 0.35 } as const;
const middleCampaign = { pre_campaign: 0.2, campaign: 1, official_campaign: 0.75 } as const;
const lateCampaign = { campaign: 0.25, official_campaign: 1 } as const;

export const v2CampaignEvents: GameEventDefinition[] = [
  event({
    id: "campaign_official_launch",
    title: "Le lancement depuis Saint-Denis",
    category: "campaign",
    summary:
      "À Saint-Denis, le premier grand meeting doit relier votre programme à la vie quotidienne. Les chaînes d’information prendront quinze minutes en direct ; les images reprises demain fixeront votre thème de départ.",
    themes: ["economy", "institutions"],
    importance: "major",
    phaseWeights: { pre_campaign: 1 },
    minDecisionIndex: 0,
    maxDecisionIndex: 3,
    entityReferences: [
      { entityId: "franceinfo", role: "context" },
      { entityId: "saint_denis", role: "location" },
    ],
    editorialSensitivity: "none",
    choices: [
      choice({
        id: "launch_costed_purchasing_power",
        label: "Ouvrir par le pouvoir d’achat, son coût et sa source de financement",
        tag: "TECHNIQUE",
        strategy: "policy_commitment",
        statement: {
          topic: "économie",
          policyTopic: "economy",
          text: "Le lancement place le pouvoir d’achat et son financement au premier rang",
          stance: -20,
        },
        outcomes: [
          outcome(
            "launch_costed_clear",
            "Le chiffrage installe votre sérieux",
            "Les extraits diffusés reprennent vos deux montants et leur financement. Votre équipe économique gagne en autorité, mais un contrôle détaillé est désormais attendu.",
            [stat("credibility", 4, "Crédibilité économique renforcée"), hidden("consistency", 2)],
            {
              weight: 2,
              modifiers: [
                { source: "party_stat", key: "credibility", coefficient: 0.9 },
                { source: "trait", key: "competence", coefficient: 0.7 },
              ],
              followUps: [
                { eventId: "media_fact_check_followup", afterDecisions: 2, probability: 0.75 },
              ],
              setFlags: { launch_theme: "economy" },
            },
          ),
          outcome(
            "launch_costed_gap",
            "Une ligne du budget reste floue",
            "Le propos convainc sur l’objectif, puis une dépense mal expliquée domine les questions. Le lancement reste utile, au prix d’un fact-check plus dangereux.",
            [
              stat("mediaPresence", 2, "Le chiffrage nourrit les questions"),
              stat("credibility", -2, "Une dépense reste sans réponse"),
            ],
            {
              weight: 1,
              modifiers: [{ source: "party_stat", key: "credibility", coefficient: -0.6 }],
              followUps: [
                { eventId: "media_fact_check_followup", afterDecisions: 1, probability: 1 },
              ],
              setFlags: { launch_theme: "economy", launch_costing_gap: true },
            },
          ),
        ],
      }),
      choice({
        id: "launch_institutional_break",
        label: "Consacrer le direct à une convention citoyenne constitutionnelle",
        tag: "CLIVANT",
        strategy: "program_shift",
        statement: {
          topic: "institutions",
          policyTopic: "institutions",
          text: "Une convention citoyenne préparera une réforme constitutionnelle",
          stance: -45,
          ideology: { authority: -6 },
        },
        outcomes: [
          outcome(
            "launch_institutions_surprise",
            "La proposition déplace le lancement",
            "La réforme institutionnelle remplace les images attendues de meeting. Les militants les plus réformateurs s’enthousiasment, tandis que les cadres découvrent le projet en direct.",
            [
              stat("mediaPresence", 5, "La surprise domine les antennes"),
              stat("cohesion", -3, "Les cadres ont été pris de court"),
            ],
            {
              setFlags: {
                launch_theme: "institutions",
                unexpected_constitutional_convention: true,
              },
            },
          ),
        ],
      }),
      choice({
        id: "launch_territorial_voices",
        label: "Confier la moitié du direct à trois militants de territoires différents",
        tag: "RASSEMBLEUR",
        strategy: "grassroots_mobilization",
        outcomes: [
          outcome(
            "launch_voices_shared",
            "Les militants deviennent les visages",
            "Les témoignages de Lille, Marseille et la Guadeloupe circulent davantage que votre discours. La base se reconnaît dans la soirée, malgré un message national moins net.",
            [
              stat("mobilization", 5, "Les équipes locales se sentent reconnues"),
              stat("localStrength", 3, "Implantation territoriale visible"),
              stat("mediaPresence", -1, "Votre message central se disperse"),
            ],
            { setFlags: { launch_theme: "territories" } },
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_factory_visit",
    title: "L’atelier industriel de Saint-Nazaire",
    category: "campaign",
    summary:
      "À Saint-Nazaire, les salariés d’un sous-traitant aéronautique vous interrogent sur les commandes publiques, la formation et l’électricité. La direction accepte la visite à condition d’éviter les images de production sensibles.",
    themes: ["economy", "work"],
    importance: "notable",
    phaseWeights: openCampaign,
    entityReferences: [{ entityId: "nantes", role: "context" }],
    choices: [
      choice({
        id: "factory_training_contract",
        label: "Proposer un contrat de formation financé avec la région et l’entreprise",
        tag: "TECHNIQUE",
        strategy: "policy_commitment",
        statement: {
          topic: "travail",
          policyTopic: "work",
          text: "Les reconversions industrielles seront cofinancées localement",
          stance: -15,
        },
        outcomes: [
          outcome(
            "factory_training_grounded",
            "Le contrat trouve ses partenaires",
            "Le représentant régional confirme que le montage existe déjà ailleurs. Les salariés obtiennent une réponse applicable et votre proposition gagne en crédibilité locale.",
            [
              stat("credibility", 3, "Mesure applicable"),
              stat("localStrength", 2, "Relais régional consolidé"),
            ],
          ),
        ],
      }),
      choice({
        id: "factory_public_orders",
        label: "Annoncer une préférence européenne dans les futures commandes publiques",
        tag: "CLIVANT",
        strategy: "program_shift",
        statement: {
          topic: "Europe",
          policyTopic: "europe",
          text: "Les commandes stratégiques privilégieront une production européenne",
          stance: 38,
        },
        outcomes: [
          outcome(
            "factory_orders_debate",
            "La commande publique ouvre un débat",
            "Les syndicats applaudissent l’objectif industriel, tandis que les juristes européens demandent des précisions. Votre ligne devient lisible et immédiatement contestée sur sa faisabilité.",
            [
              stat("mediaPresence", 3, "La préférence européenne fait débat"),
              stat("credibility", -1, "Le cadre juridique reste incomplet"),
              hidden("economicCompetence", 2),
            ],
          ),
        ],
      }),
      choice({
        id: "factory_listen_shift",
        label: "Renoncer au discours préparé et tenir une réunion avec l’équipe de nuit",
        tag: "POPULAIRE",
        strategy: "grassroots_mobilization",
        outcomes: [
          outcome(
            "factory_night_shift",
            "L’équipe de nuit impose ses priorités",
            "Les échanges font remonter le coût des transports et les horaires de garde. Vous gagnez la confiance du site, mais aucune annonce nationale ne ressort.",
            [
              stat("popularity", 3, "Écoute directe appréciée"),
              stat("mediaPresence", -2, "Peu d’images nationales"),
            ],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_market_walkabout",
    title: "Le marché sous pression",
    category: "campaign",
    summary:
      "Sur le marché de Rouen, des commerçants vous montrent leurs factures d’énergie quand un collectif vous interpelle sur les loyers. Les deux groupes réclament une réponse avant votre départ.",
    themes: ["economy", "fiscality"],
    importance: "routine",
    phaseWeights: openCampaign,
    entityReferences: [{ entityId: "rouen", role: "location" }],
    choices: [
      choice({
        id: "market_energy_receipts",
        label: "Publier trois factures anonymisées et demander un plafonnement ciblé",
        tag: "TRANSPARENT",
        strategy: "policy_commitment",
        outcomes: [
          outcome(
            "market_bills_documented",
            "Les factures donnent du poids au déplacement",
            "Les documents vérifiés remplacent les échanges confus par un cas concret. Le plafonnement séduit les petits commerces, tout en soulevant une question de financement.",
            [
              stat("credibility", 2, "Cas documenté"),
              stat("popularity", 2, "Réponse aux petits commerces"),
              hidden("economicCompetence", -1),
            ],
          ),
        ],
      }),
      choice({
        id: "market_rent_mediation",
        label: "Convoquer bailleurs et commerçants pour négocier les renouvellements de loyers",
        tag: "RASSEMBLEUR",
        strategy: "negotiation",
        outcomes: [
          outcome(
            "market_rents_table",
            "Une table locale est obtenue",
            "La mairie accepte d’accueillir la médiation la semaine suivante. Vous ne promettez pas de baisse immédiate, mais la méthode apaise les deux groupes présents.",
            [
              stat("localStrength", 3, "La mairie relaie la médiation"),
              stat("popularity", 1, "Le conflit s’apaise"),
            ],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_volunteer_surge",
    title: "Le siège déborde de bénévoles",
    category: "campaign",
    summary:
      "Après une vidéo très partagée, huit cents volontaires proposent leur aide en quarante-huit heures. Le siège ne peut ni les former ni leur confier les fichiers électoraux sans organisation supplémentaire.",
    themes: ["institutions"],
    importance: "notable",
    phaseWeights: openCampaign,
    choices: [
      choice({
        id: "volunteers_local_training",
        label: "Former cent référents locaux avant de répartir les nouveaux bénévoles",
        tag: "PRUDENT",
        strategy: "grassroots_mobilization",
        outcomes: [
          outcome(
            "volunteers_network_ready",
            "Le réseau absorbe l’afflux",
            "Les référents prennent le temps d’expliquer les règles et les outils. La mobilisation progresse moins vite cette semaine, mais l’organisation gagne une capacité durable.",
            [
              stat("mobilization", 4, "Réseau de référents formé"),
              stat("localStrength", 3, "Organisation locale durable"),
              stat("momentum", -1, "Déploiement moins immédiat"),
            ],
          ),
        ],
      }),
      choice({
        id: "volunteers_weekend_canvass",
        label: "Mobiliser immédiatement les volontaires pour un week-end de porte-à-porte",
        tag: "RISQUÉ",
        strategy: "grassroots_mobilization",
        outcomes: [
          outcome(
            "volunteers_weekend_wave",
            "Le week-end couvre cent communes",
            "La vague militante produit des milliers de conversations et plusieurs erreurs de coordination. L’élan est réel, mais les équipes locales réclament désormais des règles communes.",
            [
              stat("momentum", 5, "Vague de terrain visible"),
              stat("mobilization", 3, "Nouveaux volontaires engagés"),
              stat("cohesion", -2, "Consignes appliquées inégalement"),
            ],
          ),
        ],
      }),
      choice({
        id: "volunteers_data_research",
        label: "Confier aux bénévoles une enquête téléphonique sans accès aux données sensibles",
        tag: "TECHNIQUE",
        strategy: "long_term_strategy",
        outcomes: [
          outcome(
            "volunteers_listening_report",
            "L’enquête révèle trois préoccupations",
            "Les appels font remonter la santé, les prix alimentaires et l’accès aux transports. Votre équipe gagne des informations utiles sans exposer le fichier électoral.",
            [stat("credibility", 2, "Enquête encadrée"), hidden("potentialSupport", 2)],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_poster_shortage",
    title: "Les affiches manquent dans six villes",
    category: "campaign",
    summary:
      "Le prestataire annonce cinq jours de retard et six équipes locales n’ont plus d’affiches. Le budget permet soit une impression d’urgence, soit une campagne numérique géolocalisée.",
    themes: ["economy"],
    importance: "routine",
    phaseWeights: middleCampaign,
    choices: [
      choice({
        id: "posters_local_printers",
        label: "Répartir la commande entre trois imprimeurs locaux et publier les coûts",
        tag: "TRANSPARENT",
        strategy: "internal_discipline",
        outcomes: [
          outcome(
            "posters_local_recovery",
            "Les imprimeurs rattrapent le retard",
            "Les premières affiches arrivent sous quarante-huit heures. La solution coûte davantage, mais les sections disposent enfin d’un calendrier et de factures consultables.",
            [
              stat("finances", -3, "Impression d’urgence financée"),
              stat("cohesion", 2, "Calendrier partagé avec les sections"),
            ],
          ),
        ],
      }),
      choice({
        id: "posters_digital_switch",
        label: "Renoncer aux affiches et financer une campagne numérique dans les six villes",
        tag: "OPPORTUNISTE",
        strategy: "media_response",
        outcomes: [
          outcome(
            "posters_digital_pivot",
            "Le budget bascule vers les écrans",
            "Les vidéos locales touchent rapidement les moins de trente ans. Les militants chargés de l’affichage dénoncent cependant une décision prise sans leur avis.",
            [
              stat("mediaPresence", 3, "Campagne locale très diffusée"),
              stat("cohesion", -2, "Équipes d’affichage écartées"),
              stat("finances", -1, "Achat média ciblé"),
            ],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_endorsements_missing",
    title: "Les parrainages restent sous le seuil",
    category: "campaign",
    summary:
      "À trois semaines du dépôt, votre équipe compte encore plusieurs dizaines de parrainages manquants. Des maires ruraux acceptent de vous recevoir, mais refusent toute pression publique.",
    themes: ["institutions"],
    importance: "major",
    phaseWeights: openCampaign,
    maxDecisionIndex: 12,
    entityReferences: [
      { entityId: "conseil_constitutionnel", role: "institution" },
      { entityId: "association_maires_france", role: "context" },
    ],
    choices: [
      choice({
        id: "endorsements_private_route",
        label: "Rencontrer individuellement les maires et garantir la confidentialité des échanges",
        tag: "PRUDENT",
        strategy: "negotiation",
        outcomes: [
          outcome(
            "endorsements_quiet_progress",
            "La collecte avance sans spectacle",
            "Les rendez-vous produisent des signatures régulières et peu d’images. Votre candidature se sécurise, tandis que la campagne nationale perd deux journées précieuses.",
            [
              stat("localStrength", 4, "Réseau de maires consolidé"),
              stat("mediaPresence", -2, "Deux journées sans séquence nationale"),
              hidden("baseSupport", 1),
            ],
            { setFlags: { endorsements_secured: true } },
          ),
        ],
      }),
      choice({
        id: "endorsements_public_appeal",
        label: "Publier la liste des territoires manquants et appeler les élus à parrainer",
        tag: "OFFENSIF",
        strategy: "media_response",
        outcomes: [
          outcome(
            "endorsements_public_pressure",
            "L’appel accélère et braque",
            "Plusieurs élus répondent publiquement, d’autres annulent leur rendez-vous en dénonçant la pression. Le seuil se rapproche, mais votre méthode laissera des traces locales.",
            [
              stat("mediaPresence", 4, "Appel national relayé"),
              stat("localStrength", -2, "Des élus locaux se ferment"),
              stat("momentum", 2, "La collecte accélère"),
            ],
            { setFlags: { endorsements_public_pressure: true } },
          ),
        ],
      }),
      choice({
        id: "endorsements_cross_party",
        label: "Négocier des parrainages pluralistes sans demander de soutien politique",
        tag: "INSTITUTIONNEL",
        strategy: "negotiation",
        outcomes: [
          outcome(
            "endorsements_pluralist_path",
            "Le pluralisme protège la candidature",
            "Des élus de sensibilités différentes acceptent de distinguer parrainage et soutien. La démarche renforce votre image institutionnelle et crée plusieurs dettes politiques limitées.",
            [stat("credibility", 3, "Démarche pluraliste reconnue"), hidden("transferability", 2)],
            { setFlags: { endorsements_secured: true, pluralist_endorsements: true } },
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_budget_arbitration",
    title: "Le budget impose trois renoncements",
    category: "campaign",
    summary:
      "Le trésorier fictif vous présente un déficit prévisionnel : maintenir tous les déplacements épuiserait les réserves avant le premier tour. Il faut réduire un poste dès ce soir.",
    themes: ["fiscality"],
    importance: "major",
    phaseWeights: middleCampaign,
    editorialSensitivity: "sensitive",
    choices: [
      choice({
        id: "budget_cut_large_rallies",
        label: "Annuler deux grands meetings et préserver les équipes départementales",
        tag: "PRUDENT",
        strategy: "long_term_strategy",
        outcomes: [
          outcome(
            "budget_ground_preserved",
            "Le terrain garde ses moyens",
            "Les sections conservent leurs véhicules et leurs permanences. Deux salles restent vides et les chaînes d’information réduisent leur couverture de votre campagne.",
            [
              stat("finances", 5, "Deux meetings annulés"),
              stat("localStrength", 2, "Moyens départementaux préservés"),
              stat("mediaPresence", -3, "Moins de grands directs"),
            ],
          ),
        ],
      }),
      choice({
        id: "budget_cut_consultants",
        label: "Rompre les contrats de conseil et internaliser le chiffrage du programme",
        tag: "TRANSPARENT",
        strategy: "internal_discipline",
        outcomes: [
          outcome(
            "budget_expertise_internalized",
            "Les experts internes reprennent la main",
            "Les contrats cessent et les permanents récupèrent les dossiers. Les économies sont nettes, mais l’équipe devra défendre seule les hypothèses les plus techniques.",
            [
              stat("finances", 4, "Contrats de conseil interrompus"),
              stat("cohesion", 2, "Responsabilités confiées aux permanents"),
              hidden("economicCompetence", -2),
            ],
          ),
        ],
      }),
      choice({
        id: "budget_emergency_fundraising",
        label: "Lancer une collecte publique en publiant le besoin et chaque dépense prévue",
        tag: "RISQUÉ",
        strategy: "grassroots_mobilization",
        outcomes: [
          outcome(
            "budget_donors_answer",
            "La collecte finance la dernière ligne droite",
            "Les petits dons dépassent l’objectif et les comptes publiés rassurent. La campagne sauve son calendrier, au prix de trois jours entièrement consacrés à l’argent.",
            [
              stat("finances", 7, "Petits dons au-dessus de l’objectif"),
              stat("mobilization", 2, "Donateurs transformés en relais"),
              stat("mediaPresence", -1, "Trois jours centrés sur la collecte"),
            ],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_regional_rally",
    title: "Le meeting quitte la capitale",
    category: "campaign",
    summary:
      "L’équipe hésite entre Lille, Toulouse et Strasbourg pour le prochain grand meeting. Chaque ville correspond à un électorat et à un thème différents, sans budget pour trois déplacements.",
    themes: ["work", "europe"],
    importance: "notable",
    phaseWeights: middleCampaign,
    choices: [
      choice({
        id: "regional_lille_industry",
        label: "Tenir le meeting à Lille et détailler le plan de réindustrialisation",
        tag: "POPULAIRE",
        strategy: "policy_commitment",
        statement: {
          topic: "industrie",
          policyTopic: "economy",
          text: "La réindustrialisation ciblera d’abord les bassins d’emploi fragiles",
          stance: -18,
        },
        outcomes: [
          outcome(
            "regional_lille_workers",
            "Lille replace l’industrie au centre",
            "Les images d’anciens sites industriels donnent une matière concrète au discours. Le message progresse chez les salariés, moins auprès des électeurs centrés sur les services.",
            [stat("localStrength", 3, "Relais dans les Hauts-de-France"), hidden("baseSupport", 1)],
          ),
        ],
      }),
      choice({
        id: "regional_toulouse_climate",
        label: "Tenir le meeting à Toulouse et proposer un plan chaleur-logement",
        tag: "TECHNIQUE",
        strategy: "policy_commitment",
        statement: {
          topic: "écologie",
          policyTopic: "ecology",
          text: "Les logements exposés aux fortes chaleurs seront rénovés en priorité",
          stance: -42,
        },
        outcomes: [
          outcome(
            "regional_toulouse_heat",
            "Toulouse concrétise l’adaptation climatique",
            "Le plan relie climat, logement et santé avec un calendrier municipal. Les associations saluent la précision, tandis que son coût national reste discuté.",
            [
              stat("credibility", 3, "Plan d’adaptation détaillé"),
              stat("localStrength", 2, "Appui territorial en Occitanie"),
              hidden("economicCompetence", -1),
            ],
          ),
        ],
      }),
      choice({
        id: "regional_strasbourg_europe",
        label: "Tenir le meeting à Strasbourg et défendre une coalition industrielle européenne",
        tag: "PRÉSIDENTIEL",
        strategy: "alliance",
        statement: {
          topic: "Europe",
          policyTopic: "europe",
          text: "La France défendra une coalition industrielle européenne",
          stance: 55,
        },
        outcomes: [
          outcome(
            "regional_strasbourg_union",
            "Strasbourg donne une portée européenne",
            "Le décor et les partenaires invités renforcent votre crédibilité internationale. Les militants eurosceptiques jugent toutefois que le message national s’efface derrière la coalition.",
            [
              stat("credibility", 3, "Portée européenne du meeting"),
              stat("cohesion", -1, "Réserves des militants eurosceptiques"),
              stat("mediaPresence", 2, "Images reprises à l’étranger"),
            ],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_door_to_door",
    title: "Cent quartiers en porte-à-porte",
    category: "campaign",
    summary:
      "Les équipes proposent une opération nationale dans cent quartiers où l’abstention dépasse la moyenne. Elles peuvent écouter sans questionnaire, défendre une mesure ou inscrire de nouveaux relais.",
    themes: ["institutions", "work"],
    importance: "notable",
    phaseWeights: middleCampaign,
    choices: [
      choice({
        id: "doors_listening_notebooks",
        label: "Confier aux équipes un carnet d’écoute et publier la synthèse nationale",
        tag: "RASSEMBLEUR",
        strategy: "grassroots_mobilization",
        outcomes: [
          outcome(
            "doors_concerns_mapped",
            "Les préoccupations dessinent une carte",
            "Les carnets font apparaître des écarts nets entre transports, sécurité et santé. La campagne adapte ses déplacements sans prétendre que l’échantillon vaut sondage.",
            [
              stat("localStrength", 4, "Cent quartiers documentés"),
              stat("credibility", 2, "Méthode présentée avec prudence"),
              hidden("potentialSupport", 2),
            ],
          ),
        ],
      }),
      choice({
        id: "doors_registration_drive",
        label:
          "Mobiliser les volontaires pour vérifier inscriptions et procurations sans démarchage partisan",
        tag: "INSTITUTIONNEL",
        strategy: "grassroots_mobilization",
        outcomes: [
          outcome(
            "doors_registration_help",
            "L’aide civique élargit la participation",
            "Les permanences orientent des centaines d’électeurs vers les démarches officielles. Votre logo reste discret, mais les associations locales retiennent le sérieux de l’opération.",
            [
              stat("mobilization", 3, "Participation facilitée"),
              stat("localStrength", 3, "Associations locales partenaires"),
              hidden("transferability", 1),
            ],
          ),
        ],
      }),
      choice({
        id: "doors_single_measure",
        label: "Défendre la mesure phare à chaque porte et recueillir les objections précises",
        tag: "OFFENSIF",
        strategy: "policy_commitment",
        outcomes: [
          outcome(
            "doors_measure_tested",
            "La mesure résiste aux objections",
            "Les militants reviennent avec trois critiques récurrentes et des réponses améliorées. Le socle se mobilise, même si certains habitants ont refusé une discussion trop cadrée.",
            [
              stat("mobilization", 4, "Militants mieux armés"),
              stat("popularity", -1, "Démarchage parfois jugé insistant"),
              hidden("consistency", 2),
            ],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_bus_breakdown",
    title: "Le car tombe en panne",
    category: "campaign",
    summary:
      "À quatre-vingts kilomètres du prochain rendez-vous, le car de campagne s’immobilise. Une gare, une visioconférence et un café associatif offrent trois manières de sauver la journée.",
    themes: ["work"],
    importance: "routine",
    phaseWeights: middleCampaign,
    choices: [
      choice({
        id: "bus_train_with_press",
        label: "Prendre le train avec la presse et maintenir le rendez-vous en retard",
        tag: "POPULAIRE",
        strategy: "symbolic_action",
        outcomes: [
          outcome(
            "bus_train_story",
            "Le retard devient un récit de campagne",
            "Le trajet ordinaire produit des échanges spontanés et des images sobres. Le rendez-vous commence tard, mais les participants apprécient que vous ne l’ayez pas annulé.",
            [stat("popularity", 2, "Déplacement sans mise en scène"), hidden("fatigue", 2)],
          ),
        ],
      }),
      choice({
        id: "bus_remote_townhall",
        label: "Maintenir la réunion en visioconférence et envoyer votre équipe sur place",
        tag: "PRUDENT",
        strategy: "media_response",
        outcomes: [
          outcome(
            "bus_remote_kept",
            "La réunion tient malgré la distance",
            "L’équipe locale conduit les échanges pendant que vous répondez à l’écran. Le format fonctionne, sans remplacer la présence attendue par les habitants.",
            [
              stat("credibility", 1, "Engagement tenu"),
              stat("localStrength", 1, "Équipe locale responsabilisée"),
              stat("popularity", -1, "Absence physique remarquée"),
            ],
          ),
        ],
      }),
      choice({
        id: "bus_cafe_exchange",
        label: "Annuler la scène prévue et ouvrir un échange dans le café voisin",
        tag: "RISQUÉ",
        strategy: "personal_risk",
        outcomes: [
          outcome(
            "bus_cafe_improvised",
            "Le café offre une conversation inattendue",
            "Quarante personnes discutent sans pupitre ni musique. La séquence touche par sa simplicité, mais l’équipe qui attendait à destination se sent abandonnée.",
            [
              stat("popularity", 3, "Conversation directe appréciée"),
              stat("cohesion", -2, "Équipe d’accueil désavouée"),
              stat("mediaPresence", 1, "Images improvisées reprises"),
            ],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_citizens_convention",
    title: "La convention citoyenne réclame une réponse",
    category: "campaign",
    summary:
      "Une convention locale tirée au sort vous remet douze propositions sur les transports et l’accès aux services. Elle demande lesquelles entreront réellement dans votre programme avant de vous recevoir.",
    themes: ["institutions", "public_services"],
    importance: "major",
    phaseWeights: middleCampaign,
    choices: [
      choice({
        id: "convention_commit_three",
        label: "Accepter trois propositions chiffrées et expliquer le refus des neuf autres",
        tag: "TRANSPARENT",
        strategy: "policy_commitment",
        statement: {
          topic: "services publics",
          policyTopic: "public_services",
          text: "Trois propositions citoyennes chiffrées entreront au programme",
          stance: -30,
        },
        outcomes: [
          outcome(
            "convention_three_adopted",
            "Trois propositions entrent au programme",
            "La convention apprécie la réponse détaillée, y compris les refus. Les trois engagements deviennent vérifiables et pourront être rappelés lors de votre prochain déplacement territorial.",
            [stat("credibility", 4, "Engagements précis et vérifiables"), hidden("consistency", 2)],
            { setFlags: { citizens_proposals_adopted: 3 } },
          ),
        ],
      }),
      choice({
        id: "convention_program_vote",
        label: "Proposer un vote des adhérents sur les douze propositions avant intégration",
        tag: "INSTITUTIONNEL",
        strategy: "internal_discipline",
        outcomes: [
          outcome(
            "convention_members_decide",
            "Les adhérents obtiennent le dernier mot",
            "La convention accepte le calendrier, mais refuse de devenir un simple fournisseur d’idées. Les militants gagnent en pouvoir et la décision finale est retardée.",
            [stat("cohesion", 3, "Adhérents associés"), stat("momentum", -2, "Décision repoussée")],
            {
              followUps: [
                { eventId: "internal_program_committee", afterDecisions: 2, probability: 0.7 },
              ],
            },
          ),
        ],
      }),
      choice({
        id: "convention_local_experiment",
        label: "Négocier une expérimentation locale avec évaluation publique après un an",
        tag: "TECHNIQUE",
        strategy: "compromise",
        outcomes: [
          outcome(
            "convention_experiment_agreed",
            "L’expérimentation débloque l’accord",
            "Les élus locaux acceptent de tester deux mesures de transport avec des indicateurs publiés. Votre méthode convainc les gestionnaires sans satisfaire les partisans d’une application nationale.",
            [
              stat("localStrength", 4, "Expérimentation portée par les élus"),
              stat("credibility", 2, "Évaluation annoncée"),
              stat("mobilization", -1, "Les militants voulaient une mesure nationale"),
            ],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_farmers_roundtable",
    title: "La table ronde agricole se tend",
    category: "campaign",
    summary:
      "À Clermont-Ferrand, la FNSEA et la Confédération paysanne vous interrogent ensemble sur les revenus, l’eau et les normes. Elles refusent un discours qui promettrait tout aux deux modèles.",
    themes: ["ecology", "economy"],
    importance: "major",
    phaseWeights: middleCampaign,
    entityReferences: [
      { entityId: "clermont_ferrand", role: "location" },
      { entityId: "fnsea", role: "subject" },
      { entityId: "confederation_paysanne", role: "subject" },
    ],
    choices: [
      choice({
        id: "farmers_floor_price",
        label: "Proposer un prix plancher contrôlé dans les contrats avec la grande distribution",
        tag: "POPULAIRE",
        strategy: "policy_commitment",
        statement: {
          topic: "agriculture",
          policyTopic: "economy",
          text: "Des prix planchers encadreront certains contrats agricoles",
          stance: -38,
        },
        outcomes: [
          outcome(
            "farmers_price_commitment",
            "Le revenu devient votre priorité agricole",
            "Les deux syndicats reconnaissent l’effort sur les contrats, puis divergent sur le contrôle. La mesure gagne en visibilité et doit maintenant être juridiquement précisée.",
            [
              stat("popularity", 3, "Priorité donnée au revenu"),
              stat("credibility", -1, "Contrôle juridique à préciser"),
              stat("mediaPresence", 2, "Annonce agricole reprise"),
            ],
          ),
        ],
      }),
      choice({
        id: "farmers_water_contracts",
        label: "Négocier des contrats de bassin liant aides publiques et économies d’eau",
        tag: "TECHNIQUE",
        strategy: "negotiation",
        statement: {
          topic: "écologie",
          policyTopic: "ecology",
          text: "Les aides agricoles intégreront des contrats territoriaux sur l’eau",
          stance: -28,
        },
        outcomes: [
          outcome(
            "farmers_water_basin",
            "Les bassins versants deviennent le compromis",
            "Les représentants acceptent de travailler sur des objectifs locaux plutôt qu’un plafond national. Le compromis réduit le conflit, mais reporte les chiffres essentiels.",
            [
              stat("credibility", 2, "Méthode territoriale crédible"),
              stat("localStrength", 2, "Dialogue agricole maintenu"),
              stat("momentum", -1, "Chiffrage reporté"),
            ],
          ),
        ],
      }),
      choice({
        id: "farmers_norm_pause",
        label: "Suspendre deux nouvelles normes et demander une évaluation à la Cour des comptes",
        tag: "PRUDENT",
        strategy: "legal_action",
        outcomes: [
          outcome(
            "farmers_audit_pause",
            "La pause ouvre un contrôle public",
            "La suspension apaise une partie de la salle et l’évaluation limite la promesse. Les associations environnementales craignent cependant un recul dissimulé.",
            [
              stat("popularity", 2, "Pause réglementaire entendue"),
              stat("credibility", 2, "Évaluation indépendante demandée"),
              hidden("scandalRisk", -1),
            ],
            {
              followUps: [
                { eventId: "world_budget_warning", afterDecisions: 4, probability: 0.25 },
              ],
            },
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_student_forum",
    title: "Le forum étudiant refuse les slogans",
    category: "campaign",
    summary:
      "À Rennes, quatre associations étudiantes exigent une mesure sur le logement, une sur les bourses et une réponse sur la sélection. Elles publieront votre intervention intégrale.",
    themes: ["public_services", "work"],
    importance: "notable",
    phaseWeights: middleCampaign,
    entityReferences: [{ entityId: "rennes", role: "location" }],
    choices: [
      choice({
        id: "students_rent_guarantee",
        label: "Proposer une garantie publique de loyer ciblée sur les étudiants sans caution",
        tag: "TECHNIQUE",
        strategy: "policy_commitment",
        outcomes: [
          outcome(
            "students_guarantee_concrete",
            "La garantie répond au premier obstacle",
            "Les associations reconnaissent une mesure directement utilisable et demandent son financement. Votre équipe obtient un soutien prudent, sans régler la pénurie de logements.",
            [
              stat("popularity", 3, "Mesure concrète pour les étudiants"),
              hidden("economicCompetence", -1),
            ],
          ),
        ],
      }),
      choice({
        id: "students_grants_index",
        label: "Indexer les bourses sur les loyers locaux et publier le coût par ville",
        tag: "TRANSPARENT",
        strategy: "policy_commitment",
        statement: {
          topic: "services publics",
          policyTopic: "public_services",
          text: "Les bourses étudiantes suivront le coût local du logement",
          stance: -52,
        },
        outcomes: [
          outcome(
            "students_grants_mapped",
            "La carte des bourses convainc",
            "Le coût par ville rend la proposition lisible et révèle de grands écarts. Les étudiants saluent la méthode, tandis que votre marge budgétaire se réduit.",
            [
              stat("credibility", 3, "Coût territorial publié"),
              stat("popularity", 2, "Bourses mieux adaptées"),
              stat("finances", -2, "Promesse plus coûteuse"),
            ],
          ),
        ],
      }),
      choice({
        id: "students_selection_debate",
        label: "Refuser une réponse unique et ouvrir un débat filière par filière",
        tag: "PRUDENT",
        strategy: "compromise",
        outcomes: [
          outcome(
            "students_selection_unsettled",
            "La sélection reste sans ligne nationale",
            "Les responsables de filières acceptent le travail proposé, mais les associations dénoncent un report. Vous évitez une promesse impossible et perdez le moment politique.",
            [
              stat("credibility", 1, "Promesse irréaliste évitée"),
              stat("momentum", -2, "Réponse jugée dilatoire"),
            ],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_hospital_night",
    title: "Une nuit avec les urgences",
    category: "campaign",
    summary:
      "À l’hôpital de Dijon, les soignants acceptent votre présence sans caméra dans les services. Au matin, ils demandent quelle décision concrète vous annoncerez et avec quel calendrier.",
    themes: ["public_services", "work"],
    importance: "major",
    phaseWeights: middleCampaign,
    entityReferences: [{ entityId: "dijon", role: "location" }],
    choices: [
      choice({
        id: "hospital_night_staff",
        label: "Annoncer un renfort d’équipes de nuit financé par redéploiement administratif",
        tag: "TECHNIQUE",
        strategy: "policy_commitment",
        statement: {
          topic: "santé",
          policyTopic: "public_services",
          text: "Les équipes hospitalières de nuit seront renforcées en priorité",
          stance: -44,
        },
        outcomes: [
          outcome(
            "hospital_night_roster",
            "Les gardes obtiennent une réponse ciblée",
            "Le calendrier de recrutement est accueilli avec soulagement, mais les services administratifs contestent le redéploiement. La mesure devient un engagement précis de campagne.",
            [
              stat("credibility", 3, "Calendrier hospitalier précis"),
              stat("popularity", 2, "Renforts de nuit attendus"),
              stat("cohesion", -1, "Redéploiement contesté"),
            ],
          ),
        ],
      }),
      choice({
        id: "hospital_bed_dashboard",
        label: "Publier chaque semaine les lits fermés et convoquer les agences régionales",
        tag: "TRANSPARENT",
        strategy: "internal_discipline",
        outcomes: [
          outcome(
            "hospital_beds_visible",
            "Les fermetures deviennent vérifiables",
            "Le tableau de bord donne aux soignants un outil de pression et oblige votre équipe à assumer les écarts régionaux. Les gestionnaires redoutent une lecture trop brute.",
            [
              stat("credibility", 3, "Données hospitalières publiques"),
              stat("mediaPresence", 2, "Les écarts régionaux font débat"),
            ],
          ),
        ],
      }),
      choice({
        id: "hospital_silent_report",
        label: "Renoncer à une annonce immédiate et publier un rapport après trois visites",
        tag: "PRUDENT",
        strategy: "long_term_strategy",
        outcomes: [
          outcome(
            "hospital_report_expected",
            "Le silence crée une obligation de résultat",
            "Les soignants acceptent la méthode parce que vous fixez une date. La presse souligne l’absence d’annonce et attend désormais un document beaucoup plus solide.",
            [
              stat("credibility", 1, "Date de restitution annoncée"),
              stat("mediaPresence", -2, "Aucune mesure immédiate"),
            ],
            { followUps: [{ eventId: "program_health", afterDecisions: 3, probability: 1 }] },
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_small_business",
    title: "La PME teste votre réforme",
    category: "campaign",
    summary:
      "Une entreprise de quarante salariés à Bordeaux accepte de simuler votre réforme du travail sur ses comptes. La dirigeante et les représentants du personnel obtiennent des résultats opposés.",
    themes: ["work", "fiscality"],
    importance: "notable",
    phaseWeights: middleCampaign,
    entityReferences: [{ entityId: "bordeaux", role: "location" }],
    choices: [
      choice({
        id: "sme_publish_both",
        label: "Publier les deux simulations et corriger le seuil qui crée l’écart",
        tag: "TRANSPARENT",
        strategy: "program_shift",
        outcomes: [
          outcome(
            "sme_threshold_corrected",
            "Le cas réel améliore la réforme",
            "La correction réduit l’avantage initial de l’entreprise et protège davantage les salariés. Vous assumez le changement, ce qui renforce la méthode et mécontente certains soutiens économiques.",
            [
              stat("credibility", 4, "Programme corrigé sur un cas réel"),
              stat("cohesion", -1, "Soutiens économiques contrariés"),
              hidden("consistency", 1),
            ],
          ),
        ],
      }),
      choice({
        id: "sme_defend_macro",
        label: "Maintenir la réforme et défendre ses effets à l’échelle nationale",
        tag: "OFFENSIF",
        strategy: "policy_commitment",
        outcomes: [
          outcome(
            "sme_macro_line",
            "La ligne nationale résiste au cas local",
            "Votre équipe explique que l’entreprise ne représente pas tout le tissu productif. La cohérence rassure vos soutiens, mais les salariés présents jugent leur situation écartée.",
            [
              stat("cohesion", 2, "Ligne programmatique maintenue"),
              stat("popularity", -2, "Cas local laissé sans réponse"),
              hidden("consistency", 2),
            ],
          ),
        ],
      }),
      choice({
        id: "sme_independent_test",
        label: "Confier la simulation à un économiste indépendant avant toute conclusion",
        tag: "PRUDENT",
        strategy: "long_term_strategy",
        outcomes: [
          outcome(
            "sme_external_review",
            "La vérification suspend le duel",
            "Les deux parties acceptent le protocole et transmettent leurs hypothèses. Vous gagnez du temps et une expertise, mais laissez vos adversaires définir le récit jusqu’au rapport.",
            [
              stat("credibility", 2, "Vérification indépendante"),
              stat("momentum", -2, "Conclusion reportée"),
            ],
            {
              followUps: [
                { eventId: "media_fact_check_followup", afterDecisions: 2, probability: 0.55 },
              ],
            },
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_peripheral_town",
    title: "La périphérie demande un calendrier",
    category: "campaign",
    summary:
      "Dans une commune périurbaine d’Occitanie, les habitants relient carburant, temps de trajet et fermeture des guichets. Ils refusent que le déplacement se termine par une promesse générale.",
    themes: ["public_services", "ecology", "work"],
    importance: "notable",
    phaseWeights: middleCampaign,
    entityReferences: [{ entityId: "occitanie", role: "location" }],
    choices: [
      choice({
        id: "periphery_transport_contract",
        label: "Proposer un contrat régional pour cars express et guichets multiservices",
        tag: "TECHNIQUE",
        strategy: "policy_commitment",
        outcomes: [
          outcome(
            "periphery_contract_linked",
            "Transport et services avancent ensemble",
            "La région accepte d’étudier trois lignes et deux guichets partagés. La proposition lie les problèmes quotidiens, mais dépend d’un cofinancement encore incertain.",
            [
              stat("localStrength", 4, "Contrat territorial proposé"),
              stat("credibility", 2, "Réponse liée aux usages"),
              hidden("economicCompetence", -1),
            ],
          ),
        ],
      }),
      choice({
        id: "periphery_fuel_rebate",
        label: "Annoncer une remise carburant limitée aux travailleurs sans transport collectif",
        tag: "POPULAIRE",
        strategy: "policy_commitment",
        statement: {
          topic: "travail",
          policyTopic: "work",
          text: "Une aide carburant ciblera les salariés sans alternative de transport",
          stance: -25,
        },
        outcomes: [
          outcome(
            "periphery_rebate_targeted",
            "La remise répond aux trajets contraints",
            "Le ciblage évite une aide générale et parle aux actifs présents. Les critères d’accès deviennent aussitôt un sujet national et compliquent la promesse.",
            [
              stat("popularity", 4, "Aide aux trajets contraints"),
              stat("mediaPresence", 2, "Les critères font débat"),
              stat("credibility", -1, "Mise en œuvre complexe"),
            ],
          ),
        ],
      }),
      choice({
        id: "periphery_one_month_audit",
        label: "Demander un audit communal d’un mois avant de choisir la mesure",
        tag: "PRUDENT",
        strategy: "long_term_strategy",
        outcomes: [
          outcome(
            "periphery_audit_rejected",
            "Le diagnostic paraît déjà connu",
            "Les élus acceptent de transmettre les données, mais la salle estime avoir décrit le problème depuis des années. Votre prudence protège le budget et coûte politiquement.",
            [
              stat("credibility", 1, "Décision fondée sur des données"),
              stat("popularity", -3, "Nouvelle étude mal reçue"),
            ],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_overseas_trip",
    title: "Le déplacement en Guadeloupe engage",
    category: "campaign",
    summary:
      "En Guadeloupe, les élus et associations placent l’eau potable, la vie chère et la continuité territoriale avant votre thème national. Ils demandent des compétences, un budget et une date.",
    themes: ["public_services", "institutions"],
    importance: "major",
    phaseWeights: middleCampaign,
    entityReferences: [{ entityId: "guadeloupe", role: "location" }],
    choices: [
      choice({
        id: "overseas_water_authority",
        label: "Proposer une autorité locale de l’eau avec budget pluriannuel contrôlé",
        tag: "INSTITUTIONNEL",
        strategy: "policy_commitment",
        statement: {
          topic: "services publics",
          policyTopic: "public_services",
          text: "La gouvernance de l’eau en Guadeloupe recevra un budget pluriannuel contrôlé",
          stance: -35,
        },
        outcomes: [
          outcome(
            "overseas_water_governance",
            "L’eau obtient une architecture claire",
            "Les associations saluent la durée du financement et demandent une majorité locale au conseil. La proposition devient vérifiable et vous engage au-delà de la campagne.",
            [
              stat("credibility", 4, "Gouvernance et budget précisés"),
              stat("localStrength", 3, "Dialogue ultramarin renforcé"),
            ],
            { setFlags: { guadeloupe_water_commitment: true } },
          ),
        ],
      }),
      choice({
        id: "overseas_price_observatory",
        label: "Renforcer l’observatoire des prix et publier les marges par filière",
        tag: "TRANSPARENT",
        strategy: "legal_action",
        outcomes: [
          outcome(
            "overseas_margins_visible",
            "Les marges deviennent un objet politique",
            "La publication promise reçoit un soutien large et inquiète plusieurs distributeurs. Vous gagnez sur la transparence, sans pouvoir garantir une baisse immédiate des prix.",
            [
              stat("popularity", 3, "Transparence sur les filières"),
              stat("mediaPresence", 2, "Débat national sur les marges"),
              hidden("economicCompetence", 1),
            ],
          ),
        ],
      }),
      choice({
        id: "overseas_local_conference",
        label:
          "Convoquer une conférence territoriale et laisser les élus fixer la première priorité",
        tag: "RASSEMBLEUR",
        strategy: "negotiation",
        outcomes: [
          outcome(
            "overseas_priority_local",
            "Les élus choisissent la continuité territoriale",
            "La conférence place les transports avant votre préférence pour l’eau. Vous respectez le mandat local et devez réécrire une partie du déplacement prévu.",
            [
              stat("localStrength", 4, "Priorité choisie localement"),
              stat("cohesion", -1, "Programme de visite révisé"),
              hidden("transferability", 1),
            ],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_rural_desert",
    title: "Trois villages sans médecin",
    category: "campaign",
    summary:
      "Dans le Grand Est, trois maires partagent un cabinet vide et des délais de consultation croissants. Ils veulent savoir si vous contraignez l’installation, financez une équipe mobile ou déléguez davantage.",
    themes: ["public_services"],
    importance: "major",
    phaseWeights: middleCampaign,
    entityReferences: [{ entityId: "grand_est", role: "location" }],
    choices: [
      choice({
        id: "rural_mobile_team",
        label: "Financer une équipe médicale mobile partagée par les trois communes",
        tag: "TECHNIQUE",
        strategy: "policy_commitment",
        outcomes: [
          outcome(
            "rural_mobile_calendar",
            "Une permanence hebdomadaire devient possible",
            "L’agence régionale confirme qu’un véhicule et quatre professionnels peuvent commencer sous six mois. La réponse est concrète, mais elle ne remplace pas un médecin permanent.",
            [
              stat("credibility", 3, "Calendrier médical réaliste"),
              stat("localStrength", 3, "Trois communes associées"),
            ],
          ),
        ],
      }),
      choice({
        id: "rural_training_contract",
        label: "Proposer un contrat d’installation aux internes financé pendant cinq ans",
        tag: "POPULAIRE",
        strategy: "policy_commitment",
        statement: {
          topic: "santé",
          policyTopic: "public_services",
          text: "Les internes pourront signer un contrat de cinq ans dans les zones sous-dotées",
          stance: -32,
        },
        outcomes: [
          outcome(
            "rural_intern_contract",
            "Le contrat attire et interroge",
            "Les maires soutiennent l’incitation et les étudiants demandent des garanties de logement. Le dispositif paraît durable, avec un coût supérieur à l’équipe mobile.",
            [
              stat("popularity", 3, "Installation médicale encouragée"),
              stat("finances", -2, "Contrats sur cinq ans"),
              hidden("potentialSupport", 1),
            ],
          ),
        ],
      }),
      choice({
        id: "rural_installation_rule",
        label: "Conditionner les nouvelles installations aux besoins définis par territoire",
        tag: "CLIVANT",
        strategy: "legal_action",
        outcomes: [
          outcome(
            "rural_installation_conflict",
            "La régulation fracture le débat médical",
            "Les élus applaudissent la contrainte territoriale et plusieurs syndicats de médecins annoncent leur opposition. Votre décision devient nationale avant même son chiffrage.",
            [
              stat("mediaPresence", 4, "Conflit national sur l’installation"),
              stat("popularity", 1, "Soutien des communes rurales"),
              stat("rejection", 2, "Opposition professionnelle forte"),
            ],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_union_meeting",
    title: "Le face-à-face avec les syndicats",
    category: "campaign",
    summary:
      "La CGT, la CFDT et Force ouvrière vous reçoivent séparément le même jour. Toutes demandent votre méthode sur les salaires, mais divergent sur la conférence sociale et la loi.",
    themes: ["work", "fiscality"],
    importance: "major",
    phaseWeights: middleCampaign,
    entityReferences: [
      { entityId: "cgt", role: "subject" },
      { entityId: "cfdt", role: "subject" },
      { entityId: "force_ouvriere", role: "subject" },
    ],
    choices: [
      choice({
        id: "union_wage_conference",
        label: "Convoquer une conférence salariale avec accord majoritaire avant toute loi",
        tag: "RASSEMBLEUR",
        strategy: "negotiation",
        statement: {
          topic: "salaires",
          policyTopic: "work",
          text: "Une conférence salariale précédera toute intervention législative",
          stance: -30,
        },
        outcomes: [
          outcome(
            "union_conference_terms",
            "La méthode obtient un accord prudent",
            "Les syndicats acceptent le principe à condition de publier la représentativité et le calendrier. Les employeurs réclament aussitôt une place égale à la table.",
            [stat("credibility", 3, "Méthode sociale précisée"), hidden("transferability", 2)],
          ),
        ],
      }),
      choice({
        id: "union_minimum_wage_law",
        label: "Annoncer une hausse légale du salaire minimum dès le premier budget",
        tag: "POPULAIRE",
        strategy: "policy_commitment",
        statement: {
          topic: "salaires",
          policyTopic: "work",
          text: "Le salaire minimum augmentera dès le premier budget",
          stance: -65,
        },
        outcomes: [
          outcome(
            "union_wage_commitment",
            "La hausse fixe un clivage net",
            "Les syndicats soutiennent l’engagement et le patronat conteste son coût. Votre socle comprend immédiatement la ligne, qui devient centrale dans le débat économique.",
            [
              stat("mobilization", 4, "Socle social mobilisé"),
              stat("rejection", 2, "Opposition patronale"),
              stat("mediaPresence", 3, "Clivage salarial national"),
            ],
          ),
        ],
      }),
      choice({
        id: "union_branch_bargaining",
        label: "Renforcer les minima de branche et sanctionner les grilles sous le salaire minimum",
        tag: "TECHNIQUE",
        strategy: "legal_action",
        outcomes: [
          outcome(
            "union_branches_enforced",
            "Les branches deviennent le levier",
            "La proposition convainc les négociateurs habitués aux grilles salariales. Elle produit moins d’enthousiasme public, mais renforce votre crédibilité sur le dialogue social.",
            [
              stat("credibility", 4, "Levier de branche maîtrisé"),
              stat("mediaPresence", -1, "Mesure moins spectaculaire"),
              hidden("economicCompetence", 2),
            ],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_donation_drive",
    title: "La collecte se bloque",
    category: "campaign",
    summary:
      "Les dons du mois sont inférieurs d’un tiers au budget prévu. L’équipe peut solliciter les petits donateurs, réduire la tournée ou demander une avance bancaire encadrée.",
    themes: ["fiscality"],
    importance: "notable",
    phaseWeights: middleCampaign,
    choices: [
      choice({
        id: "donations_small_match",
        label: "Lancer une semaine de petits dons avec un objectif public quotidien",
        tag: "TRANSPARENT",
        strategy: "grassroots_mobilization",
        outcomes: [
          outcome(
            "donations_daily_goal",
            "Les petits dons relancent la caisse",
            "Les objectifs quotidiens sont atteints quatre jours sur sept. La somme ne couvre pas tout, mais transforme plusieurs donateurs en bénévoles actifs.",
            [
              stat("finances", 5, "Collecte citoyenne relancée"),
              stat("mobilization", 3, "Donateurs devenus bénévoles"),
            ],
          ),
        ],
      }),
      choice({
        id: "donations_tour_cut",
        label: "Annuler la tournée la plus coûteuse et expliquer chaque économie",
        tag: "PRUDENT",
        strategy: "internal_discipline",
        outcomes: [
          outcome(
            "donations_costs_cut",
            "Les comptes retrouvent une marge",
            "La suppression de quatre étapes stabilise la trésorerie et rassure le siège. Les territoires concernés dénoncent une campagne qui les abandonne en premier.",
            [
              stat("finances", 6, "Quatre étapes supprimées"),
              stat("localStrength", -3, "Territoires retirés de la tournée"),
              stat("credibility", 1, "Arbitrage budgétaire assumé"),
            ],
          ),
        ],
      }),
      choice({
        id: "donations_bank_advance",
        label: "Demander une avance bancaire et publier le taux ainsi que l’échéancier",
        tag: "TECHNIQUE",
        strategy: "long_term_strategy",
        outcomes: [
          outcome(
            "donations_credit_obtained",
            "Le crédit maintient la tournée",
            "La banque accepte un montant inférieur à votre demande. L’échéancier transparent évite la polémique, mais le remboursement pèsera sur la fin de campagne.",
            [
              stat("finances", 4, "Avance bancaire obtenue"),
              stat("credibility", 2, "Conditions publiées"),
              hidden("fatigue", 1),
            ],
            {
              delayedEffects: [
                {
                  afterDecisions: 5,
                  effects: [stat("finances", -3, "Première échéance remboursée")],
                  narrative:
                    "La première échéance de l’avance bancaire réduit les moyens disponibles pour la dernière semaine.",
                },
              ],
            },
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_rally_security",
    title: "Le meeting change de dispositif",
    category: "campaign",
    summary:
      "La préfecture recommande de déplacer les files d’entrée après une alerte non ciblée. Le meeting peut être maintenu, réduit ou converti en intervention sans public.",
    themes: ["security", "civil_liberties"],
    importance: "major",
    phaseWeights: middleCampaign,
    entityReferences: [{ entityId: "ministere_interieur", role: "institution" }],
    choices: [
      choice({
        id: "security_follow_protocol",
        label: "Maintenir le meeting en appliquant intégralement le protocole préfectoral",
        tag: "PRUDENT",
        strategy: "internal_discipline",
        outcomes: [
          outcome(
            "security_meeting_orderly",
            "Le meeting se tient sans incident",
            "Les contrôles retardent l’ouverture et la salle reste calme. Vous montrez que la campagne peut continuer, sans transformer l’alerte en argument politique.",
            [
              stat("credibility", 3, "Protocole respecté"),
              stat("mobilization", -1, "Entrée plus lente"),
            ],
          ),
        ],
      }),
      choice({
        id: "security_smaller_room",
        label: "Réduire la jauge et réserver les places aux équipes déjà inscrites",
        tag: "INSTITUTIONNEL",
        strategy: "compromise",
        outcomes: [
          outcome(
            "security_capacity_reduced",
            "La jauge protège et déçoit",
            "Le dispositif devient plus simple et plusieurs centaines de sympathisants restent dehors. Les équipes comprennent la décision, mais la mobilisation visible recule.",
            [
              stat("credibility", 2, "Décision proportionnée"),
              stat("mobilization", -3, "Sympathisants laissés dehors"),
            ],
          ),
        ],
      }),
      choice({
        id: "security_remote_address",
        label: "Annuler le public et prononcer le discours depuis le siège en direct",
        tag: "PRUDENT",
        strategy: "media_response",
        outcomes: [
          outcome(
            "security_address_remote",
            "Le direct remplace la salle",
            "L’intervention atteint davantage de spectateurs que prévu, sans énergie militante. Vos adversaires jugent l’annulation excessive et le débat se déplace sur votre sang-froid.",
            [
              stat("mediaPresence", 3, "Audience numérique élevée"),
              stat("mobilization", -2, "Rassemblement annulé"),
              stat("rejection", 1, "Prudence contestée"),
            ],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_calendar_conflict",
    title: "Deux invitations au même horaire",
    category: "campaign",
    summary:
      "France 2 propose un entretien économique à l’heure où vous devez rencontrer des maires ruraux à Limoges. Les deux rendez-vous refusent de changer leur calendrier.",
    themes: ["economy", "institutions"],
    importance: "routine",
    phaseWeights: middleCampaign,
    entityReferences: [
      { entityId: "france_2", role: "host" },
      { entityId: "association_maires_france", role: "subject" },
    ],
    choices: [
      choice({
        id: "calendar_choose_mayors",
        label: "Maintenir la rencontre des maires et envoyer votre porte-parole sur France 2",
        tag: "LOYAL",
        strategy: "grassroots_mobilization",
        outcomes: [
          outcome(
            "calendar_mayors_kept",
            "Les maires obtiennent votre présence",
            "La rencontre locale débouche sur trois soutiens et votre porte-parole tient l’entretien. L’absence du candidat limite néanmoins la portée économique nationale.",
            [
              stat("localStrength", 4, "Trois maires se rapprochent"),
              stat("mediaPresence", -1, "Entretien délégué"),
            ],
          ),
        ],
      }),
      choice({
        id: "calendar_choose_tv",
        label: "Choisir France 2 et proposer une visioconférence privée aux maires le lendemain",
        tag: "PRÉSIDENTIEL",
        strategy: "media_response",
        outcomes: [
          outcome(
            "calendar_tv_priority",
            "L’entretien national prend le dessus",
            "Votre argument économique atteint un large public et deux maires refusent la visioconférence. Le choix gagne en exposition ce qu’il perd en confiance territoriale.",
            [
              stat("mediaPresence", 4, "Entretien économique très vu"),
              stat("localStrength", -3, "Deux maires se retirent"),
            ],
          ),
        ],
      }),
      choice({
        id: "calendar_split_trip",
        label: "Avancer le déplacement, rejoindre le studio en train et supprimer les répétitions",
        tag: "RISQUÉ",
        strategy: "personal_risk",
        outcomes: [
          outcome(
            "calendar_both_kept",
            "Les deux rendez-vous survivent",
            "Vous tenez les deux engagements avec peu de préparation et une fatigue visible. L’image d’endurance plaît, tandis que plusieurs réponses télévisées manquent de précision.",
            [
              stat("localStrength", 2, "Rencontre maintenue"),
              stat("mediaPresence", 2, "Studio rejoint à temps"),
              stat("credibility", -2, "Réponses moins préparées"),
              hidden("fatigue", 4),
            ],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_slogan_test",
    title: "Le slogan divise le siège",
    category: "campaign",
    summary:
      "Deux slogans testés en groupe qualitatif racontent des campagnes opposées : l’un promet une rupture nette, l’autre une méthode de gouvernement. Aucun ne convainc tous vos électorats.",
    themes: ["institutions"],
    importance: "routine",
    phaseWeights: openCampaign,
    choices: [
      choice({
        id: "slogan_choose_break",
        label: "Choisir le slogan de rupture et l’accompagner de trois engagements précis",
        tag: "CLIVANT",
        strategy: "media_response",
        outcomes: [
          outcome(
            "slogan_break_defined",
            "La rupture reçoit un contenu",
            "Les trois engagements empêchent le slogan de rester abstrait. Le socle se mobilise, mais les électeurs recherchant la stabilité deviennent plus méfiants.",
            [
              stat("mobilization", 4, "Socle stimulé par la rupture"),
              stat("rejection", 2, "Électeurs modérés plus méfiants"),
              hidden("consistency", 1),
            ],
          ),
        ],
      }),
      choice({
        id: "slogan_choose_govern",
        label: "Choisir le slogan de gouvernement et publier votre calendrier des cent jours",
        tag: "PRÉSIDENTIEL",
        strategy: "long_term_strategy",
        outcomes: [
          outcome(
            "slogan_calendar_governs",
            "Le calendrier crédibilise la méthode",
            "Les cent jours donnent de la matière aux entretiens et rassurent sur votre préparation. Une partie des militants regrette une campagne trop administrative.",
            [
              stat("credibility", 4, "Calendrier gouvernemental publié"),
              stat("mobilization", -1, "Militants moins enthousiastes"),
              hidden("consistency", 2),
            ],
          ),
        ],
      }),
      choice({
        id: "slogan_drop_both",
        label: "Refuser les deux slogans et conserver seulement le nom de la campagne",
        tag: "PRUDENT",
        strategy: "silence",
        outcomes: [
          outcome(
            "slogan_campaign_unframed",
            "La campagne garde son nom",
            "Les affiches restent sobres et aucun slogan ne détourne le programme. Les équipes locales manquent toutefois d’une formule commune pour lancer leurs réunions.",
            [
              stat("credibility", 1, "Communication sans promesse vide"),
              stat("mobilization", -2, "Pas de formule de ralliement"),
            ],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_weather_disaster",
    title: "La pluie emporte la tournée",
    category: "campaign",
    summary:
      "Des pluies intenses rendent deux routes impraticables et le meeting en plein air doit être annulé. Les services locaux demandent aux équipes de ne pas gêner les interventions.",
    themes: ["ecology", "public_services"],
    importance: "notable",
    phaseWeights: middleCampaign,
    choices: [
      choice({
        id: "weather_cancel_help",
        label: "Annuler la tournée et mettre les véhicules du parti à disposition des associations",
        tag: "RASSEMBLEUR",
        strategy: "symbolic_action",
        outcomes: [
          outcome(
            "weather_vehicles_useful",
            "Les véhicules servent aux distributions",
            "Les associations coordonnent l’aide sans transformer l’opération en meeting. Votre retrait des images partisanes est remarqué et les équipes perdent une journée de campagne.",
            [
              stat("popularity", 3, "Aide logistique sans récupération"),
              stat("momentum", -2, "Journée de campagne annulée"),
              hidden("transferability", 1),
            ],
          ),
        ],
      }),
      choice({
        id: "weather_remote_climate",
        label: "Tenir un point presse à distance sur l’adaptation aux pluies extrêmes",
        tag: "TECHNIQUE",
        strategy: "media_response",
        statement: {
          topic: "écologie",
          policyTopic: "ecology",
          text: "L’adaptation aux pluies extrêmes recevra un financement dédié",
          stance: -40,
        },
        outcomes: [
          outcome(
            "weather_adaptation_plan",
            "L’adaptation remplace le meeting",
            "Le point presse relie l’événement à des investissements précis sans commenter les opérations en cours. La séquence gagne en fond, malgré des accusations de récupération.",
            [
              stat("credibility", 3, "Mesures d’adaptation détaillées"),
              stat("mediaPresence", 2, "Plan repris dans les journaux"),
              stat("rejection", 1, "Récupération dénoncée"),
            ],
          ),
        ],
      }),
      choice({
        id: "weather_silent_safety",
        label: "Suspendre toute communication jusqu’à la réouverture officielle des routes",
        tag: "PRUDENT",
        strategy: "silence",
        outcomes: [
          outcome(
            "weather_silence_respected",
            "Le silence laisse travailler les secours",
            "Aucun message de campagne ne concurrence les consignes locales. La retenue protège votre image institutionnelle, mais la journée disparaît entièrement du récit national.",
            [
              stat("credibility", 2, "Consignes locales respectées"),
              stat("mediaPresence", -3, "Aucune présence nationale"),
            ],
          ),
        ],
      }),
    ],
  }),
  event({
    id: "campaign_final_rally",
    title: "Le dernier grand meeting",
    category: "campaign",
    summary:
      "À quarante-huit heures du silence électoral, votre dernier meeting doit consolider le socle sans fermer la porte aux indécis. Le temps ne permet plus de corriger une promesse nouvelle.",
    themes: ["institutions", "economy"],
    importance: "decisive",
    phaseWeights: lateCampaign,
    minDecisionIndex: 18,
    choices: [
      choice({
        id: "final_rally_contract",
        label: "Récapituler cinq engagements déjà chiffrés et annoncer leur ordre d’exécution",
        tag: "PRÉSIDENTIEL",
        strategy: "long_term_strategy",
        outcomes: [
          outcome(
            "final_rally_sequence_clear",
            "Le contrat ordonne la campagne",
            "Les cinq engagements rappellent vos décisions les plus cohérentes et donnent une chronologie. Le meeting rassure les indécis sans provoquer de pic spectaculaire.",
            [
              stat("credibility", 4, "Engagements ordonnés"),
              stat("momentum", 2, "Fin de campagne maîtrisée"),
              hidden("consistency", 3),
            ],
          ),
        ],
      }),
      choice({
        id: "final_rally_turnout",
        label: "Mobiliser les abstentionnistes avec un plan de procurations et de transports",
        tag: "POPULAIRE",
        strategy: "grassroots_mobilization",
        outcomes: [
          outcome(
            "final_rally_turnout_network",
            "La salle devient une organisation électorale",
            "Les participants repartent avec des responsabilités concrètes pour dimanche. L’intervention parle moins de programme et augmente nettement votre capacité de mobilisation.",
            [
              stat("mobilization", 6, "Réseau du scrutin activé"),
              stat("credibility", -1, "Peu de réponses programmatiques"),
              hidden("baseSupport", 1),
            ],
          ),
        ],
      }),
      choice({
        id: "final_rally_new_pledge",
        label: "Annoncer une baisse fiscale nouvelle pour créer un dernier mouvement",
        tag: "RISQUÉ",
        strategy: "personal_risk",
        statement: {
          topic: "fiscalité",
          policyTopic: "fiscality",
          text: "Une baisse fiscale supplémentaire sera inscrite au premier budget",
          stance: 55,
        },
        outcomes: [
          outcome(
            "final_rally_tax_shock",
            "La dernière promesse secoue les comptes",
            "L’annonce domine la soirée et attire des électeurs sensibles aux impôts. Votre équipe ne dispose d’aucun délai pour chiffrer, ce qui fragilise la cohérence finale.",
            [
              stat("mediaPresence", 5, "Annonce de dernière minute"),
              stat("momentum", 3, "Nouveau débat fiscal"),
              stat("credibility", -4, "Promesse non chiffrée"),
              hidden("consistency", -5),
            ],
            { setFlags: { late_uncosted_tax_pledge: true } },
          ),
        ],
      }),
    ],
  }),
];
