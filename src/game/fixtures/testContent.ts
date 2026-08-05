import type {
  ActorState,
  ElectorateBlocDefinition,
  ElectorateBlocId,
  GameContent,
  IdeologyVector,
  PartyDefinition,
  RegionId,
} from "@/game/types";

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

function vector(value: number): IdeologyVector {
  return {
    economy: value,
    society: value / 2,
    europe: value / 3,
    ecology: -value / 2,
    authority: value / 2,
    immigration: value / 2,
  };
}

function recordFor<T extends string>(keys: T[], value: number): Record<T, number> {
  return Object.fromEntries(keys.map((key) => [key, value])) as Record<T, number>;
}

function party(
  id: string,
  name: string,
  support: number,
  ideologicalPosition: number,
  color: string,
): PartyDefinition {
  return {
    id,
    displayName: name,
    shortName: id.toUpperCase(),
    aliases: [],
    isRealOrganization: false,
    visual: {
      primaryColor: color,
      secondaryColor: "#fffdf8",
      monogram: id[0]?.toUpperCase() ?? "P",
      symbol: "◆",
    },
    ideology: vector(ideologicalPosition),
    baseline: {
      baseSupport: support,
      potentialSupport: Math.min(60, support + 20),
      mobilization: 58,
      finances: 58,
      mediaPresence: 58,
      governingCredibility: 58,
      cohesion: 62,
      rejection: 38,
      localStrength: 55,
      electedSupport: 55,
      popularity: 56,
      members: 80_000,
      awareness: 75,
      momentum: 50,
    },
    strengths: ["Équipe stable", "Socle lisible", "Implantation régulière"],
    weaknesses: ["Réserves limitées", "Notoriété inégale", "Tensions stratégiques"],
    program: ["Renforcer les services publics", "Soutenir l’activité", "Rénover les institutions"],
    electorateAffinity: recordFor(BLOC_IDS, 50),
    regionalAffinity: recordFor(REGION_IDS, 50),
    nominationModeWeights: { automatic: 4, primary: 2, internalVote: 2, leadershipCrisis: 1 },
    strategicArchetypes: ["consolidate_base", "look_presidential"],
    uniqueEventTags: [],
    careerTitle: "Révélation de la campagne",
  };
}

const parties = [
  party("alpha", "Mouvement Alpha", 38, -35, "#315a9a"),
  party("beta", "Mouvement Bêta", 34, 35, "#8b3c4b"),
  party("gamma", "Mouvement Gamma", 28, 0, "#477057"),
];

function actor(partyId: string, suffix: string, role: ActorState["role"]): ActorState {
  const definition = parties.find((candidate) => candidate.id === partyId) ?? parties[0];
  if (!definition) throw new Error("Fixture de parti absente.");
  return {
    id: `${partyId}_${suffix}`,
    identityKind: "fictional",
    displayName: `${suffix === "candidate" ? "Camille" : "Morgan"} ${partyId.toUpperCase()}`,
    partyId,
    role,
    ideology: structuredClone(definition.ideology),
    traits: {
      charisma: 60,
      mediaSkill: 60,
      competence: 60,
      tactics: 60,
      integrity: 65,
      endurance: 62,
      authority: 58,
      empathy: 58,
      discipline: 60,
      coalitionSkill: 56,
    },
    legitimacy: role === "candidate" ? 72 : 55,
    ambition: 65,
    loyalty: 70,
    mediaSkill: 60,
    governingCredibility: 60,
    scandalRisk: 20,
    active: true,
    candidateStatus: role === "candidate" ? "official" : "potential",
    strategy: "consolidate_base",
    memory: { successfulActions: [], failedActions: [], rivalries: [], promises: [] },
  };
}

const actors = parties.flatMap((definition) => [
  actor(definition.id, "candidate", "candidate"),
  actor(definition.id, "cadre", "cadre"),
]);

const electorateBlocs: ElectorateBlocDefinition[] = BLOC_IDS.map((id, index) => ({
  id,
  label: `Bloc électoral de test ${index + 1}`,
  shortLabel: `Bloc ${index + 1}`,
  weight: index < 4 ? 8.4 : 8.3,
  ideology: vector(-55 + index * 10),
  priorities: index % 2 ? ["economy", "services"] : ["social", "ecology"],
  volatility: 40 + (index % 4) * 8,
  turnout: 60 + (index % 5) * 5,
  usefulVoteSensitivity: 45 + (index % 3) * 10,
  regionalAffinity: {},
}));

const successOutcome = {
  id: "success",
  title: "La séquence porte ses fruits",
  baseWeight: 3,
  modifiers: [{ source: "party_stat" as const, key: "credibility", coefficient: 0.8 }],
  publicNarrative:
    "Votre réponse paraît préparée sans sembler mécanique. Les soutiens repartent sur le terrain et la campagne gagne un peu de crédit.",
  effects: [
    {
      kind: "party_stat" as const,
      stat: "credibility" as const,
      delta: 2,
      label: "Crédibilité +2",
    },
    { kind: "party_stat" as const, stat: "momentum" as const, delta: 2, label: "Dynamique +2" },
  ],
};

const setbackOutcome = {
  id: "setback",
  title: "Le message se brouille",
  baseWeight: 1,
  modifiers: [{ source: "trait" as const, key: "discipline", coefficient: -0.5 }],
  publicNarrative:
    "Une formule imprécise retient davantage l’attention que votre proposition. L’équipe doit consacrer du temps à remettre le message en ordre.",
  effects: [
    { kind: "party_stat" as const, stat: "popularity" as const, delta: -1, label: "Popularité −1" },
    { kind: "party_stat" as const, stat: "cohesion" as const, delta: -1, label: "Cohésion −1" },
  ],
};

const standardChoices = [
  {
    id: "prudent_line",
    label: "Présenter une réponse précise et progressive",
    visibleTag: "PRUDENT" as const,
    outcomeGroups: [successOutcome, setbackOutcome],
  },
  {
    id: "risk_line",
    label: "Bousculer l’agenda par une annonce inattendue",
    visibleTag: "RISQUÉ" as const,
    outcomeGroups: [
      { ...successOutcome, id: "viral_success", baseWeight: 2 },
      { ...setbackOutcome, id: "risk_setback", baseWeight: 2 },
    ],
  },
];

const events: GameContent["events"] = [
  {
    id: "fixture_campaign",
    title: "Une journée décisive sur le terrain",
    category: "campaign",
    summary:
      "Une visite locale attire plus de monde que prévu. Votre équipe hésite entre approfondir les échanges préparés et profiter de l’attention pour déplacer le débat national.",
    phaseWeights: { pre_campaign: 1, campaign: 1, official_campaign: 1 },
    rarity: "common",
    baseWeight: 8,
    eligibility: [],
    cooldown: 0,
    oncePerRun: false,
    choices: standardChoices,
  },
  {
    id: "fixture_program",
    title: "Le programme doit se préciser",
    category: "program",
    summary:
      "À mesure que la campagne avance, les journalistes réclament une hiérarchie plus nette entre vos priorités. Un arbitrage public devient difficile à éviter.",
    phaseWeights: { campaign: 1, official_campaign: 1 },
    rarity: "common",
    baseWeight: 5,
    minDecisionIndex: 5,
    eligibility: [],
    cooldown: 2,
    oncePerRun: false,
    choices: standardChoices,
  },
  {
    id: "fixture_debate",
    title: "Le grand débat de la campagne",
    category: "debate",
    summary:
      "Les principaux candidats fictifs se retrouvent en direct. Votre temps de parole est court et chaque hésitation risque de devenir la séquence du lendemain.",
    phaseWeights: { campaign: 1, official_campaign: 1 },
    rarity: "uncommon",
    baseWeight: 4,
    minDecisionIndex: 10,
    eligibility: [],
    cooldown: 4,
    oncePerRun: false,
    choices: standardChoices,
  },
  {
    id: "fixture_runoff",
    title: "Le pays attend votre prochain geste",
    category: "between_rounds",
    summary:
      "Le premier tour a rebattu les cartes. Alliés, électeurs et adversaires observent la manière dont vous comptez peser pendant les deux dernières semaines.",
    phaseWeights: { between_rounds: 1 },
    rarity: "common",
    baseWeight: 10,
    eligibility: [],
    cooldown: 0,
    oncePerRun: false,
    choices: standardChoices,
  },
  {
    id: "fixture_government",
    title: "Les premiers équilibres du pouvoir",
    category: "government",
    summary:
      "La victoire ouvre déjà une bataille de symboles. Votre premier choix doit donner une direction sans enfermer le futur gouvernement dans une promesse impossible.",
    phaseWeights: { government_epilogue: 1 },
    rarity: "common",
    baseWeight: 10,
    eligibility: [],
    cooldown: 0,
    oncePerRun: false,
    choices: standardChoices,
  },
];

export const testContent: GameContent = {
  parties,
  actors,
  electorateBlocs,
  events,
  methods: [
    {
      id: "field",
      title: "Le terrain d’abord",
      description: "Mobiliser au plus près des électeurs.",
      symbol: "⌖",
      effects: [
        { kind: "party_stat", stat: "mobilization", delta: 5 },
        { kind: "party_stat", stat: "localStrength", delta: 4 },
      ],
      traitEffects: { empathy: 3 },
    },
  ],
  achievements: [
    {
      id: "first_choice",
      title: "Premier pas",
      description: "Prendre une décision.",
      category: "first_campaigns",
      icon: "◆",
    },
    {
      id: "campaign_complete",
      title: "Au bout",
      description: "Terminer une campagne.",
      category: "first_campaigns",
      icon: "✓",
    },
    {
      id: "runoff",
      title: "Au second tour",
      description: "Se qualifier.",
      category: "wins",
      icon: "Ⅱ",
    },
    {
      id: "elysee",
      title: "Locataire de l’Élysée",
      description: "Gagner.",
      category: "wins",
      icon: "★",
    },
  ],
  endings: [
    {
      id: "president",
      title: "Président de la République",
      narrative:
        "Votre campagne se conclut par une victoire. Le pouvoir commence là où la course s’arrête.",
    },
    {
      id: "runoff_defeat",
      title: "Stratège sans couronne",
      narrative:
        "Vous atteignez le duel final, mais une majorité différente se dessine dans les urnes.",
    },
    {
      id: "kingmaker",
      title: "Faiseur de roi",
      narrative:
        "Votre score ne suffit pas pour gagner, mais votre choix pèse sur la suite de la vie politique.",
    },
    {
      id: "narrow_elimination",
      title: "Éliminé de peu",
      narrative:
        "Quelques points vous séparent du duel final. La campagne laisse une force difficile à ignorer.",
    },
    {
      id: "strengthened_party",
      title: "Parti renforcé",
      narrative:
        "Sans atteindre l’Élysée, votre campagne agrandit durablement le socle du mouvement.",
    },
    {
      id: "divided_party",
      title: "Parti divisé",
      narrative:
        "La campagne se termine sur un mouvement plus exposé et traversé par de profondes tensions.",
    },
    {
      id: "collapse",
      title: "Campagne naufragée",
      narrative:
        "Les urnes confirment un recul sévère. Une longue reconstruction attend désormais votre équipe.",
    },
    {
      id: "honorable_campaign",
      title: "Campagne honorable",
      narrative:
        "Le résultat ne bouleverse pas la course, mais votre voix a trouvé sa place dans le débat.",
    },
  ],
};
