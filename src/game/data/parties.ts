import type { ElectorateBlocId, IdeologyFamily, PartyDefinition, RegionId } from "@/game/types";

export const PLAYABLE_PARTY_IDS = [
  "lfi",
  "ps",
  "ecologistes",
  "renaissance",
  "horizons",
  "lr",
  "rn",
  "reconquete",
  "nouvelle_energie",
] as const;

const BLOC_IDS: ElectorateBlocId[] = [
  "young_urban_graduates",
  "young_precarious",
  "rural_working_class",
  "urban_working_class",
  "middle_class_workers",
  "executives",
  "entrepreneurs",
  "public_services",
  "moderate_retirees",
  "conservative_retirees",
  "green_progressives",
  "mobilisable_abstainers",
];

const REGION_IDS: RegionId[] = [
  "ile_de_france",
  "north",
  "east",
  "west",
  "south_west",
  "south_east",
  "central",
  "overseas",
];

function numberedRecord<T extends string>(keys: T[], values: number[]): Record<T, number> {
  return Object.fromEntries(keys.map((key, index) => [key, values[index] ?? 50])) as Record<
    T,
    number
  >;
}

const electorate = (...values: number[]) => numberedRecord(BLOC_IDS, values);
const regions = (...values: number[]) => numberedRecord(REGION_IDS, values);

const baseParties: PartyDefinition[] = [
  {
    id: "lfi",
    displayName: "La France insoumise",
    shortName: "LFI",
    aliases: ["France insoumise"],
    isRealOrganization: true,
    visual: { primaryColor: "#6b315d", secondaryColor: "#f4c89f", monogram: "FI", symbol: "↗" },
    ideology: {
      economy: -78,
      society: -58,
      europe: -48,
      ecology: 66,
      authority: -54,
      immigration: -38,
    },
    baseline: {
      baseSupport: 13,
      potentialSupport: 28,
      mobilization: 76,
      finances: 52,
      mediaPresence: 76,
      governingCredibility: 47,
      cohesion: 58,
      rejection: 59,
      localStrength: 49,
      electedSupport: 55,
      popularity: 52,
      members: 170_000,
      awareness: 91,
      momentum: 57,
    },
    strengths: [
      "Militants très mobilisables",
      "Message de rupture identifiable",
      "Forte présence numérique",
    ],
    weaknesses: [
      "Rejet élevé hors du socle",
      "Rapport complexe aux alliances",
      "Crédibilité gouvernementale disputée",
    ],
    program: [
      "Planifier la transition sociale et écologique",
      "Renforcer la redistribution",
      "Réformer profondément les institutions",
    ],
    electorateAffinity: electorate(78, 74, 57, 74, 60, 47, 31, 76, 33, 21, 79, 72),
    regionalAffinity: regions(67, 62, 48, 54, 68, 58, 48, 79),
    nominationModeWeights: { automatic: 5, primary: 1, internalVote: 2, leadershipCrisis: 2 },
    strategicArchetypes: ["consolidate_base", "media_momentum", "attack_favorite"],
    uniqueEventTags: ["popular_mobilization", "left_union", "institutions"],
    careerTitle: "Tribune des foules",
  },
  {
    id: "ps",
    displayName: "Parti socialiste",
    shortName: "PS",
    aliases: ["Parti Socialiste"],
    isRealOrganization: true,
    visual: { primaryColor: "#8a405d", secondaryColor: "#f1d9df", monogram: "PS", symbol: "✦" },
    ideology: {
      economy: -48,
      society: -52,
      europe: 48,
      ecology: 48,
      authority: -30,
      immigration: -24,
    },
    baseline: {
      baseSupport: 4.5,
      potentialSupport: 25,
      mobilization: 59,
      finances: 56,
      mediaPresence: 63,
      governingCredibility: 64,
      cohesion: 52,
      rejection: 70,
      localStrength: 72,
      electedSupport: 74,
      popularity: 55,
      members: 48_000,
      awareness: 92,
      momentum: 54,
    },
    strengths: ["Réseau d’élus locaux", "Expérience gouvernementale", "Capacité de coalition"],
    weaknesses: [
      "Ligne interne disputée",
      "Socle national à reconstruire",
      "Concurrence sur plusieurs flancs",
    ],
    program: [
      "Renforcer les services publics",
      "Organiser une transition écologique juste",
      "Négocier une réforme sociale européenne",
    ],
    electorateAffinity: electorate(72, 63, 51, 68, 70, 61, 40, 81, 66, 37, 72, 59),
    regionalAffinity: regions(67, 59, 55, 74, 78, 58, 65, 64),
    nominationModeWeights: { automatic: 1, primary: 4, internalVote: 4, leadershipCrisis: 2 },
    strategicArchetypes: ["prepare_alliance", "look_presidential", "poach_neighbor"],
    uniqueEventTags: ["left_union", "local_officials", "social_democracy"],
    careerTitle: "Parti ressuscité",
  },
  {
    id: "ecologistes",
    displayName: "Les Écologistes",
    shortName: "ÉCO",
    aliases: ["EELV", "Europe Écologie Les Verts"],
    isRealOrganization: true,
    visual: { primaryColor: "#376a67", secondaryColor: "#d9e7d9", monogram: "É", symbol: "◌" },
    ideology: {
      economy: -54,
      society: -72,
      europe: 62,
      ecology: 92,
      authority: -58,
      immigration: -55,
    },
    baseline: {
      baseSupport: 6.5,
      potentialSupport: 20,
      mobilization: 57,
      finances: 41,
      mediaPresence: 53,
      governingCredibility: 46,
      cohesion: 55,
      rejection: 37,
      localStrength: 58,
      electedSupport: 48,
      popularity: 49,
      members: 18_000,
      awareness: 79,
      momentum: 46,
    },
    strengths: [
      "Thème central clairement identifié",
      "Ancrage urbain et associatif",
      "Réserves chez les jeunes diplômés",
    ],
    weaknesses: [
      "Difficulté à élargir hors de l’écologie",
      "Moyens financiers limités",
      "Choix d’alliance délicat",
    ],
    program: [
      "Accélérer la rénovation et les transports propres",
      "Adapter l’économie aux limites écologiques",
      "Renforcer la démocratie locale",
    ],
    electorateAffinity: electorate(88, 60, 35, 55, 69, 76, 38, 71, 49, 24, 96, 56),
    regionalAffinity: regions(78, 49, 59, 75, 63, 67, 52, 49),
    nominationModeWeights: { automatic: 1, primary: 4, internalVote: 4, leadershipCrisis: 2 },
    strategicArchetypes: ["poach_neighbor", "prepare_alliance", "media_momentum"],
    uniqueEventTags: ["climate", "left_union", "grassroots"],
    careerTitle: "L’aiguillon vert",
  },
  {
    id: "renaissance",
    displayName: "Renaissance",
    shortName: "REN",
    aliases: ["En Marche", "La République en marche", "LREM"],
    isRealOrganization: true,
    visual: { primaryColor: "#315986", secondaryColor: "#e8dcc2", monogram: "R", symbol: "◎" },
    ideology: {
      economy: 48,
      society: -16,
      europe: 78,
      ecology: 38,
      authority: 20,
      immigration: 12,
    },
    baseline: {
      baseSupport: 14,
      potentialSupport: 31,
      mobilization: 49,
      finances: 73,
      mediaPresence: 78,
      governingCredibility: 72,
      cohesion: 49,
      rejection: 61,
      localStrength: 51,
      electedSupport: 76,
      popularity: 46,
      members: 35_000,
      awareness: 96,
      momentum: 42,
    },
    strengths: [
      "Crédibilité institutionnelle",
      "Forte visibilité médiatique",
      "Réserves au centre",
    ],
    weaknesses: [
      "Usure du pouvoir",
      "Militants moins mobilisés",
      "Succession stratégique incertaine",
    ],
    program: [
      "Soutenir l’investissement et l’innovation",
      "Approfondir la coopération européenne",
      "Réformer les services publics",
    ],
    electorateAffinity: electorate(68, 39, 33, 43, 74, 89, 78, 54, 77, 55, 59, 36),
    regionalAffinity: regions(85, 54, 63, 73, 68, 71, 60, 53),
    nominationModeWeights: { automatic: 2, primary: 2, internalVote: 3, leadershipCrisis: 4 },
    strategicArchetypes: ["look_presidential", "prepare_runoff", "limit_risk"],
    uniqueEventTags: ["incumbency", "succession", "europe"],
    careerTitle: "Héritier devenu chef",
  },
  {
    id: "horizons",
    displayName: "Horizons",
    shortName: "HOR",
    aliases: ["Horizons Le parti"],
    isRealOrganization: true,
    visual: { primaryColor: "#36566a", secondaryColor: "#e9e3d2", monogram: "H", symbol: "▱" },
    ideology: { economy: 55, society: 8, europe: 56, ecology: 22, authority: 34, immigration: 23 },
    baseline: {
      baseSupport: 4.5,
      potentialSupport: 21,
      mobilization: 46,
      finances: 58,
      mediaPresence: 58,
      governingCredibility: 71,
      // P1 (fun improvement mission) : rejection et cohesion étaient les deux
      // plus favorables du jeu simultanément (2e cohésion, 2e plus faible
      // rejet), ce qui donnait à Horizons un avantage structurel rare — voir
      // FUN_IMPROVEMENTS_REPORT.md section 3. Rééquilibrage léger : Horizons
      // reste nettement plus sûr que la moyenne (cohesion encore au-dessus de
      // PS/LR/Reconquête/Renaissance ; rejection encore sous RN/Reconquête/
      // Renaissance/LR), mais n'est plus le parti presque sans risque.
      cohesion: 62,
      rejection: 46,
      localStrength: 63,
      electedSupport: 61,
      popularity: 57,
      members: 24_000,
      awareness: 66,
      momentum: 46,
    },
    strengths: ["Image de gestion", "Réseau d’élus territoriaux", "Rejet relativement contenu"],
    weaknesses: [
      "Espace politique encombré",
      "Notoriété nationale inégale",
      "Dépendance aux alliances du centre",
    ],
    program: [
      "Planifier l’action publique sur le long terme",
      "Décentraliser les décisions",
      "Consolider l’autonomie stratégique européenne",
    ],
    electorateAffinity: electorate(56, 34, 43, 39, 72, 84, 81, 49, 82, 68, 42, 31),
    regionalAffinity: regions(66, 58, 61, 81, 66, 68, 72, 45),
    nominationModeWeights: { automatic: 5, primary: 1, internalVote: 3, leadershipCrisis: 1 },
    strategicArchetypes: ["look_presidential", "poach_neighbor", "prepare_alliance"],
    uniqueEventTags: ["local_officials", "center_alliance", "long_term"],
    careerTitle: "L’alternative patiente",
  },
  {
    id: "lr",
    displayName: "Les Républicains",
    shortName: "LR",
    aliases: ["Républicains"],
    isRealOrganization: true,
    visual: { primaryColor: "#364c78", secondaryColor: "#d9e0ec", monogram: "LR", symbol: "⬡" },
    ideology: {
      economy: 62,
      society: 43,
      europe: 20,
      ecology: -12,
      authority: 68,
      immigration: 62,
    },
    baseline: {
      baseSupport: 6.5,
      potentialSupport: 27,
      mobilization: 61,
      finances: 64,
      mediaPresence: 69,
      governingCredibility: 68,
      cohesion: 42,
      rejection: 60,
      localStrength: 81,
      electedSupport: 82,
      popularity: 51,
      members: 118_000,
      awareness: 95,
      momentum: 48,
    },
    strengths: [
      "Très forte implantation locale",
      "Expérience institutionnelle",
      "Socle militant organisé",
    ],
    weaknesses: [
      "Concurrence à droite",
      "Cohésion stratégique fragile",
      "Difficulté à incarner le renouvellement",
    ],
    program: [
      "Réduire la dépense et soutenir le travail",
      "Renforcer sécurité et autorité publique",
      "Décentraliser l’action de l’État",
    ],
    electorateAffinity: electorate(34, 28, 62, 38, 66, 74, 88, 41, 83, 91, 25, 38),
    regionalAffinity: regions(62, 66, 77, 73, 70, 82, 84, 52),
    nominationModeWeights: { automatic: 1, primary: 4, internalVote: 4, leadershipCrisis: 3 },
    strategicArchetypes: ["consolidate_base", "poach_neighbor", "useful_vote"],
    uniqueEventTags: ["right_union", "local_officials", "leadership"],
    careerTitle: "Le retour de la droite",
  },
  {
    id: "rn",
    displayName: "Rassemblement national",
    shortName: "RN",
    aliases: ["Rassemblement National", "Front national", "FN"],
    isRealOrganization: true,
    visual: { primaryColor: "#233a68", secondaryColor: "#d9c89d", monogram: "RN", symbol: "⬟" },
    ideology: {
      economy: -8,
      society: 68,
      europe: -58,
      ecology: -24,
      authority: 82,
      immigration: 92,
    },
    baseline: {
      baseSupport: 12.5,
      potentialSupport: 38,
      mobilization: 72,
      finances: 66,
      mediaPresence: 89,
      governingCredibility: 57,
      cohesion: 74,
      rejection: 85,
      localStrength: 62,
      electedSupport: 73,
      popularity: 60,
      members: 120_000,
      awareness: 98,
      momentum: 67,
    },
    strengths: [
      "Socle électoral large et fidèle",
      "Thèmes de campagne identifiés",
      "Forte visibilité nationale",
    ],
    weaknesses: [
      "Rejet élevé au second tour",
      "Crédibilité gouvernementale à consolider",
      "Alliances limitées",
    ],
    program: [
      "Durcir la politique migratoire",
      "Renforcer la priorité nationale dans l’action publique",
      "Réorienter les relations avec l’Union européenne",
    ],
    electorateAffinity: electorate(35, 68, 91, 71, 60, 34, 72, 38, 64, 86, 18, 79),
    regionalAffinity: regions(48, 91, 87, 61, 67, 84, 74, 69),
    nominationModeWeights: { automatic: 7, primary: 1, internalVote: 1, leadershipCrisis: 1 },
    strategicArchetypes: ["consolidate_base", "useful_vote", "look_presidential"],
    uniqueEventTags: ["national_union", "useful_vote", "udr"],
    careerTitle: "La marche du favori",
  },
  {
    id: "reconquete",
    displayName: "Reconquête",
    shortName: "REC",
    aliases: ["Reconquête !"],
    isRealOrganization: true,
    visual: { primaryColor: "#704338", secondaryColor: "#ead9c1", monogram: "R!", symbol: "▲" },
    ideology: {
      economy: 43,
      society: 88,
      europe: -62,
      ecology: -42,
      authority: 88,
      immigration: 100,
    },
    baseline: {
      baseSupport: 5,
      potentialSupport: 17,
      mobilization: 67,
      finances: 49,
      mediaPresence: 71,
      governingCredibility: 39,
      cohesion: 47,
      rejection: 72,
      localStrength: 27,
      electedSupport: 22,
      popularity: 41,
      members: 28_000,
      awareness: 86,
      momentum: 41,
    },
    strengths: [
      "Militants engagés",
      "Positionnement très identifiable",
      "Capacité à imposer une polémique",
    ],
    weaknesses: ["Rejet très élevé", "Faible implantation locale", "Vote utile défavorable"],
    program: [
      "Réduire fortement l’immigration",
      "Renforcer l’autorité et l’assimilation",
      "Alléger les normes économiques",
    ],
    electorateAffinity: electorate(26, 43, 71, 46, 44, 55, 79, 25, 52, 88, 12, 58),
    regionalAffinity: regions(51, 69, 72, 41, 49, 76, 60, 42),
    nominationModeWeights: { automatic: 6, primary: 1, internalVote: 2, leadershipCrisis: 2 },
    strategicArchetypes: ["attack_favorite", "media_momentum", "consolidate_base"],
    uniqueEventTags: ["right_union", "identity", "media_momentum"],
    careerTitle: "Le tribun solitaire",
  },
  {
    id: "nouvelle_energie",
    displayName: "Nouvelle Énergie",
    shortName: "NE",
    aliases: ["Une Nouvelle Énergie"],
    isRealOrganization: true,
    visual: { primaryColor: "#4a5c5e", secondaryColor: "#e8ddc8", monogram: "NE", symbol: "✧" },
    ideology: { economy: 84, society: 36, europe: 24, ecology: -8, authority: 58, immigration: 48 },
    baseline: {
      baseSupport: 4.5,
      potentialSupport: 19,
      mobilization: 48,
      finances: 48,
      mediaPresence: 44,
      governingCredibility: 59,
      cohesion: 72,
      rejection: 28,
      localStrength: 45,
      electedSupport: 32,
      popularity: 48,
      members: 12_000,
      awareness: 48,
      momentum: 47,
    },
    strengths: [
      "Rejet initial faible",
      "Discours économique distinctif",
      "Image de renouvellement",
    ],
    weaknesses: ["Notoriété limitée", "Réseau national incomplet", "Pression du vote utile"],
    program: [
      "Réduire fortement normes et dépenses",
      "Décentraliser vers les territoires",
      "Renforcer éducation et ordre public",
    ],
    electorateAffinity: electorate(39, 28, 49, 31, 63, 79, 96, 34, 69, 75, 22, 35),
    regionalAffinity: regions(57, 48, 56, 69, 64, 78, 67, 39),
    nominationModeWeights: { automatic: 6, primary: 1, internalVote: 2, leadershipCrisis: 1 },
    strategicArchetypes: ["media_momentum", "poach_neighbor", "look_presidential"],
    uniqueEventTags: ["liberal_reform", "local_officials", "right_union"],
    careerTitle: "L’outsider libéral",
  },
];

type PartyCampaignProfile = NonNullable<PartyDefinition["campaignProfile"]>;

const partyCampaignProfiles: Record<
  (typeof PLAYABLE_PARTY_IDS)[number],
  { ideologyFamily: IdeologyFamily; profile: PartyCampaignProfile }
> = {
  lfi: {
    ideologyFamily: "radical_left",
    profile: {
      coreElectorates: ["young_precarious", "urban_working_class", "mobilisable_abstainers"],
      targetElectorates: ["public_services", "green_progressives"],
      difficultElectorates: ["executives", "conservative_retirees", "entrepreneurs"],
      activistCulture:
        "Une campagne de mouvement, fondée sur les groupes locaux, les mobilisations de rue et les formats numériques longs.",
      publicImage:
        "Une force de rupture très identifiée, capable de mobiliser fortement mais exposée à un rejet élevé hors de son socle.",
      mediaRelationship:
        "Le rapport aux grands médias est conflictuel ; les formats directs et les meetings sont privilégiés.",
      internalTensions: [
        "Préserver une ligne de rupture ou négocier une candidature commune à gauche",
        "Donner davantage d’autonomie aux élus sans diluer la stratégie nationale",
      ],
      favorableTopics: ["public_services", "pensions", "civil_liberties", "ecology"],
      dangerousTopics: ["security", "europe"],
      naturalAllies: ["ecologistes", "ps"],
      directCompetitors: ["ps", "rn"],
      firstRoundStrategy:
        "Mobiliser les abstentionnistes et imposer un vote utile à gauche sans désarmer le programme de rupture.",
      runoffStrategy:
        "Élargir vers les sociaux-démocrates et les écologistes tout en limitant la démobilisation du socle.",
      contradictions: [
        "Élargissement électoral contre fidélité au programme",
        "Centralité de la candidature contre culture militante décentralisée",
      ],
      victoryConditions: [
        "Participation élevée des jeunes et des abstentionnistes mobilisables",
        "Absence d’une candidature de gauche concurrente dominante",
      ],
    },
  },
  ps: {
    ideologyFamily: "social_democrat",
    profile: {
      coreElectorates: ["public_services", "middle_class_workers", "moderate_retirees"],
      targetElectorates: ["young_urban_graduates", "green_progressives"],
      difficultElectorates: ["rural_working_class", "entrepreneurs", "conservative_retirees"],
      activistCulture:
        "Un parti de sections, d’élus locaux et de courants, efficace sur le terrain mais exigeant en compromis internes.",
      publicImage:
        "Une offre de gouvernement familière qui doit prouver son renouvellement et clarifier son rapport au reste de la gauche.",
      mediaRelationship:
        "Les formats institutionnels lui sont accessibles, mais chaque ambiguïté d’alliance devient une question de campagne.",
      internalTensions: [
        "Union de la gauche ou autonomie sociale-démocrate",
        "Réhabilitation du bilan gouvernemental ou rupture avec les quinquennats passés",
      ],
      favorableTopics: ["public_services", "work", "europe", "social_issues"],
      dangerousTopics: ["fiscality", "security"],
      naturalAllies: ["ecologistes", "lfi"],
      directCompetitors: ["lfi", "renaissance"],
      firstRoundStrategy:
        "Réunir électeurs de gauche modérée, agents publics et métropoles sans disparaître derrière une alliance.",
      runoffStrategy:
        "Obtenir les reports de toute la gauche puis rassurer le centre sur la capacité à gouverner.",
      contradictions: [
        "Promesse de transformation contre crédibilité budgétaire",
        "Synthèse des courants contre lisibilité du candidat",
      ],
      victoryConditions: [
        "Candidature de rassemblement crédible à gauche",
        "Reconquête des classes moyennes et des électeurs des services publics",
      ],
    },
  },
  ecologistes: {
    ideologyFamily: "green",
    profile: {
      coreElectorates: ["green_progressives", "young_urban_graduates"],
      targetElectorates: ["young_precarious", "public_services"],
      difficultElectorates: ["rural_working_class", "conservative_retirees", "entrepreneurs"],
      activistCulture:
        "Une culture fédérale et délibérative, riche en expertise locale mais vulnérable aux divisions de ligne nationale.",
      publicImage:
        "Une force compétente sur le climat qui doit relier l’écologie au quotidien et sortir d’une image trop métropolitaine.",
      mediaRelationship:
        "Les sujets climatiques ouvrent les antennes ; les controverses internes peuvent toutefois occuper tout l’espace.",
      internalTensions: [
        "Autonomie écologiste ou primaire commune à gauche",
        "Écologie de rupture ou coalition de gouvernement",
      ],
      favorableTopics: ["ecology", "public_services", "europe", "civil_liberties"],
      dangerousTopics: ["work", "security"],
      naturalAllies: ["ps", "lfi"],
      directCompetitors: ["ps", "renaissance"],
      firstRoundStrategy:
        "Transformer l’urgence écologique en projet social concret et démontrer l’utilité d’une candidature autonome.",
      runoffStrategy:
        "Négocier des garanties climatiques précises contre un soutien, sans donner l’impression d’un ralliement automatique.",
      contradictions: [
        "Radicalité des objectifs contre acceptabilité des transitions",
        "Démocratie interne contre vitesse de décision en crise",
      ],
      victoryConditions: [
        "Épisode climatique plaçant l’écologie au centre de la campagne",
        "Percée au-delà des métropoles et des diplômés urbains",
      ],
    },
  },
  renaissance: {
    ideologyFamily: "liberal_center",
    profile: {
      coreElectorates: ["executives", "moderate_retirees", "entrepreneurs"],
      targetElectorates: ["middle_class_workers", "young_urban_graduates"],
      difficultElectorates: ["rural_working_class", "urban_working_class", "young_precarious"],
      activistCulture:
        "Une organisation présidentielle récente, structurée par les élus, les comités et l’expérience gouvernementale.",
      publicImage:
        "Une offre centrale crédible pour gouverner, mais chargée du bilan du pouvoir et d’une forte fatigue de l’électorat.",
      mediaRelationship:
        "L’accès médiatique est large ; le candidat est sans cesse ramené au bilan et à son autonomie vis-à-vis de l’exécutif.",
      internalTensions: [
        "Défendre le bilan ou incarner une rupture de méthode",
        "Maintenir le bloc central ou choisir une alliance vers la droite ou la gauche",
      ],
      favorableTopics: ["europe", "economy", "institutions", "work"],
      dangerousTopics: ["pensions", "public_services"],
      naturalAllies: ["horizons", "lr"],
      directCompetitors: ["horizons", "ps", "lr"],
      firstRoundStrategy:
        "Réunifier le centre, revendiquer la compétence et prouver que la candidature n’est pas une simple continuation.",
      runoffStrategy:
        "Constituer un front large autour de la stabilité européenne et gouvernementale sans aggraver le rejet.",
      contradictions: [
        "Renouvellement promis contre continuité du bilan",
        "Dépassement partisan contre dépendance aux élus sortants",
      ],
      victoryConditions: [
        "Candidat central unique et crédible",
        "Diminution du rejet sans perte de crédibilité économique",
      ],
    },
  },
  horizons: {
    ideologyFamily: "center_right",
    profile: {
      coreElectorates: ["executives", "entrepreneurs", "moderate_retirees"],
      targetElectorates: ["middle_class_workers", "conservative_retirees"],
      difficultElectorates: ["young_precarious", "urban_working_class", "mobilisable_abstainers"],
      activistCulture:
        "Un réseau d’élus et de comités locaux qui valorise la gestion, la stabilité et l’implantation territoriale.",
      publicImage:
        "Une candidature de centre droit jugée expérimentée, mais menacée d’être confondue avec les autres offres du bloc central.",
      mediaRelationship:
        "Les entretiens longs favorisent l’image de sérieux ; la campagne doit créer de l’intensité sans perdre sa retenue.",
      internalTensions: [
        "Autonomie présidentielle ou accord préalable avec Renaissance",
        "Ligne de centre droit ou rapprochement avec Les Républicains",
      ],
      favorableTopics: ["economy", "institutions", "work", "europe"],
      dangerousTopics: ["social_issues", "ecology"],
      naturalAllies: ["renaissance", "lr"],
      directCompetitors: ["renaissance", "lr", "nouvelle_energie"],
      firstRoundStrategy:
        "Faire valoir l’expérience locale et présidentielle pour devenir le vote utile du centre droit.",
      runoffStrategy:
        "Additionner le centre et la droite modérée sans donner le sentiment d’un accord d’appareil conclu d’avance.",
      contradictions: [
        "Patience stratégique contre besoin d’exister tôt",
        "Autonomie du parti contre proximité avec le pouvoir sortant",
      ],
      victoryConditions: [
        "Éclatement du bloc central au bénéfice du candidat le plus crédible",
        "Ralliement d’élus locaux issus de la droite et du centre",
      ],
    },
  },
  lr: {
    ideologyFamily: "conservative_right",
    profile: {
      coreElectorates: ["conservative_retirees", "entrepreneurs", "rural_working_class"],
      targetElectorates: ["moderate_retirees", "middle_class_workers"],
      difficultElectorates: ["young_precarious", "green_progressives", "young_urban_graduates"],
      activistCulture:
        "Un parti d’élus, de fédérations et de militants expérimentés, traversé par une compétition stratégique sur ses frontières.",
      publicImage:
        "Une droite de gouvernement solidement implantée qui doit démontrer son autonomie entre le centre et la droite nationale.",
      mediaRelationship:
        "Les thèmes régaliens offrent une forte exposition ; chaque débat d’alliance devient un test d’autorité du candidat.",
      internalTensions: [
        "Accord avec le centre ou ligne d’opposition nette",
        "Frontière avec le RN ou stratégie d’union des droites",
      ],
      favorableTopics: ["security", "fiscality", "institutions", "work"],
      dangerousTopics: ["pensions", "europe"],
      naturalAllies: ["horizons", "renaissance", "nouvelle_energie"],
      directCompetitors: ["rn", "horizons", "renaissance"],
      firstRoundStrategy:
        "Rassembler la droite de gouvernement, reconquérir les retraités et résister au vote utile vers le RN.",
      runoffStrategy:
        "Obtenir les reports du centre et de la droite nationale sans renier les frontières posées pendant la campagne.",
      contradictions: [
        "Fermeté programmatique contre capacité de coalition",
        "Ancrage local puissant contre divisions nationales",
      ],
      victoryConditions: [
        "Candidat incontesté par les fédérations",
        "Recul simultané du bloc central et de la droite nationale",
      ],
    },
  },
  rn: {
    ideologyFamily: "national_right",
    profile: {
      coreElectorates: ["rural_working_class", "urban_working_class", "conservative_retirees"],
      targetElectorates: ["middle_class_workers", "young_precarious"],
      difficultElectorates: ["young_urban_graduates", "green_progressives", "public_services"],
      activistCulture:
        "Une organisation très centralisée, dotée d’un socle électoral fort et attentive à la discipline publique de ses cadres.",
      publicImage:
        "Une force installée au premier tour, dont le principal obstacle reste le rejet et la crédibilité d’une majorité de gouvernement.",
      mediaRelationship:
        "L’exposition est élevée ; la stratégie oscille entre normalisation présidentielle et mobilisation clivante du socle.",
      internalTensions: [
        "Normalisation de l’image ou durcissement identitaire",
        "Protection économique ou ligne libérale pour rassurer les entreprises",
      ],
      favorableTopics: ["immigration", "security", "fiscality", "institutions"],
      dangerousTopics: ["europe", "economy"],
      naturalAllies: ["reconquete"],
      directCompetitors: ["reconquete", "lr", "lfi"],
      firstRoundStrategy:
        "Préserver le socle populaire, étouffer la concurrence à droite et réduire le doute sur la capacité à gouverner.",
      runoffStrategy:
        "Abaisser le rejet, obtenir des soutiens à droite et convaincre les abstentionnistes sans démobiliser le socle.",
      contradictions: [
        "Normalisation présidentielle contre mobilisation identitaire",
        "Promesses sociales contre crédibilité budgétaire",
      ],
      victoryConditions: [
        "Qualification sans concurrence forte sur la droite nationale",
        "Baisse durable du rejet avant l’entre-deux-tours",
      ],
    },
  },
  reconquete: {
    ideologyFamily: "sovereigntist_right",
    profile: {
      coreElectorates: ["conservative_retirees", "entrepreneurs", "rural_working_class"],
      targetElectorates: ["middle_class_workers", "executives"],
      difficultElectorates: ["green_progressives", "young_precarious", "public_services"],
      activistCulture:
        "Une base militante numérique et événementielle très engagée, mais un appareil local et financier plus fragile.",
      publicImage:
        "Une offre idéologique très nette qui attire l’attention mais peine à élargir son électorat au-delà d’un noyau convaincu.",
      mediaRelationship:
        "La campagne recherche les confrontations et les formats viraux, avec un risque élevé de saturation et de rejet.",
      internalTensions: [
        "Maintenir la pureté de la ligne ou négocier avec le RN",
        "Campagne de témoignage ou stratégie de qualification",
      ],
      favorableTopics: ["immigration", "security", "institutions", "civil_liberties"],
      dangerousTopics: ["public_services", "ecology"],
      naturalAllies: ["rn"],
      directCompetitors: ["rn", "lr"],
      firstRoundStrategy:
        "Reprendre l’initiative idéologique au RN et convertir la visibilité en implantation et en vote utile.",
      runoffStrategy:
        "Négocier une influence programmatique ou devenir faiseur de roi si la qualification reste hors de portée.",
      contradictions: [
        "Radicalité de la ligne contre nécessité d’élargissement",
        "Personnalisation médiatique contre construction d’un parti durable",
      ],
      victoryConditions: [
        "Crise majeure de la candidature RN",
        "Transformation rapide de l’audience médiatique en réseau territorial",
      ],
    },
  },
  nouvelle_energie: {
    ideologyFamily: "center_right",
    profile: {
      coreElectorates: ["entrepreneurs", "executives", "moderate_retirees"],
      targetElectorates: ["middle_class_workers", "conservative_retirees"],
      difficultElectorates: ["young_precarious", "urban_working_class", "mobilisable_abstainers"],
      activistCulture:
        "Un mouvement récent appuyé sur des entrepreneurs, des élus locaux et des volontaires encore peu nombreux.",
      publicImage:
        "Une offre libérale et décentralisatrice identifiable, mais confrontée à un déficit de notoriété et au vote utile.",
      mediaRelationship:
        "Chaque passage doit d’abord expliquer l’existence du mouvement avant de pouvoir imposer une proposition de fond.",
      internalTensions: [
        "Conserver une candidature autonome ou fusionner avec une droite mieux implantée",
        "Priorité aux réformes économiques ou élargissement aux services publics",
      ],
      favorableTopics: ["economy", "fiscality", "institutions", "work"],
      dangerousTopics: ["public_services", "social_issues"],
      naturalAllies: ["lr", "horizons"],
      directCompetitors: ["horizons", "lr"],
      firstRoundStrategy:
        "Construire la notoriété par quelques réformes fortes et obtenir des relais territoriaux crédibles.",
      runoffStrategy:
        "Transformer un score modeste en accord programmatique ou en responsabilité gouvernementale identifiable.",
      contradictions: [
        "Rupture libérale contre protection des électeurs exposés",
        "Indépendance du mouvement contre besoin d’une alliance rapide",
      ],
      victoryConditions: [
        "Percée médiatique précoce suivie de ralliements locaux",
        "Espace laissé vacant entre Horizons et Les Républicains",
      ],
    },
  },
};

const runoffTransferability: Record<(typeof PLAYABLE_PARTY_IDS)[number], number> = {
  lfi: 40,
  ps: 42,
  ecologistes: 50,
  renaissance: 32,
  horizons: 28,
  lr: 28,
  rn: 20,
  reconquete: 20,
  nouvelle_energie: 38,
};

export const parties: PartyDefinition[] = baseParties.map((party) => {
  const configured = partyCampaignProfiles[party.id as (typeof PLAYABLE_PARTY_IDS)[number]];
  if (!configured) return party;
  return {
    ...party,
    baseline: {
      ...party.baseline,
      transferability: runoffTransferability[party.id as (typeof PLAYABLE_PARTY_IDS)[number]],
    },
    ideologyFamily: configured.ideologyFamily,
    campaignProfile: structuredClone(configured.profile),
  };
});

export function getPartyDefinition(id: string): PartyDefinition | undefined {
  return parties.find((party) => party.id === id);
}
