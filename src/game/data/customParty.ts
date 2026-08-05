import type {
  ElectorateBlocId,
  IdeologyVector,
  PartyDefinition,
  PoliticalTopic,
} from "@/game/types";

import { clamp, ideologyDistance } from "@/game/engine/math";

import { electorateBlocs } from "./electorate";
import { parties } from "./parties";

interface IdeologyOption {
  id: string;
  label: string;
  delta: Partial<IdeologyVector>;
}

export interface IdeologyQuestion {
  id: string;
  prompt: string;
  options: IdeologyOption[];
}

export interface SignatureMeasure {
  id: string;
  label: string;
  description: string;
  delta: Partial<IdeologyVector>;
}

export type LeadershipModel = "vertical" | "balanced" | "decentralized";
export type OrganizationPriority = "officials" | "members" | "experts";

export interface CustomPartyInput {
  name: string;
  shortName: string;
  primaryColor: string;
  symbol: string;
  answers: Record<string, string>;
  leadershipModel: LeadershipModel;
  organizationPriority: OrganizationPriority;
  measureIds: string[];
}

export const CUSTOM_PARTY_SYMBOLS = ["◆", "✦", "◌", "⬡", "↗", "◎", "▱", "✧"];
export const CUSTOM_PARTY_COLORS = [
  "#315986",
  "#6b315d",
  "#376a67",
  "#8a5638",
  "#514b78",
  "#8a405d",
];

export const ideologyQuestions: IdeologyQuestion[] = [
  {
    id: "pensions",
    prompt: "Quelle ligne pour les retraites ?",
    options: [
      { id: "earlier", label: "Abaisser l’âge et augmenter les recettes", delta: { economy: -28 } },
      {
        id: "stable",
        label: "Stabiliser les règles et négocier par métiers",
        delta: { economy: -5 },
      },
      { id: "later", label: "Relever progressivement l’âge légal", delta: { economy: 24 } },
    ],
  },
  {
    id: "taxation",
    prompt: "Comment arbitrer impôts et dépenses ?",
    options: [
      {
        id: "redistribute",
        label: "Taxer davantage les hauts revenus et investir",
        delta: { economy: -32 },
      },
      { id: "target", label: "Cibler les aides et préserver l’équilibre", delta: { economy: 4 } },
      { id: "reduce", label: "Réduire dépenses, normes et prélèvements", delta: { economy: 36 } },
    ],
  },
  {
    id: "immigration",
    prompt: "Quelle politique migratoire ?",
    options: [
      {
        id: "open",
        label: "Élargir les voies légales et l’intégration",
        delta: { immigration: -34 },
      },
      {
        id: "controlled",
        label: "Maintenir un contrôle avec garanties",
        delta: { immigration: 6 },
      },
      { id: "restrict", label: "Réduire fortement les admissions", delta: { immigration: 42 } },
    ],
  },
  {
    id: "security",
    prompt: "Sécurité ou libertés : où placer le curseur ?",
    options: [
      {
        id: "liberties",
        label: "Renforcer prévention et contrôle des pouvoirs",
        delta: { authority: -34 },
      },
      { id: "balance", label: "Combiner moyens, prévention et garanties", delta: { authority: 5 } },
      {
        id: "order",
        label: "Étendre les pouvoirs de sécurité et les peines",
        delta: { authority: 38 },
      },
    ],
  },
  {
    id: "europe",
    prompt: "Quelle place pour l’Union européenne ?",
    options: [
      { id: "sovereign", label: "Rendre des compétences aux États", delta: { europe: -38 } },
      { id: "reform", label: "Réformer les règles par négociation", delta: { europe: 8 } },
      { id: "federal", label: "Partager davantage de souveraineté", delta: { europe: 42 } },
    ],
  },
  {
    id: "ecology",
    prompt: "Quel rythme pour la transition écologique ?",
    options: [
      { id: "production", label: "Prioriser production et innovation", delta: { ecology: -28 } },
      { id: "transition", label: "Planifier une transition progressive", delta: { ecology: 22 } },
      {
        id: "transform",
        label: "Transformer rapidement production et usages",
        delta: { ecology: 47 },
      },
    ],
  },
  {
    id: "services",
    prompt: "Quel avenir pour les services publics ?",
    options: [
      { id: "expand", label: "Étendre les services et recruter", delta: { economy: -24 } },
      {
        id: "modernize",
        label: "Moderniser et contractualiser les objectifs",
        delta: { economy: 8 },
      },
      { id: "delegate", label: "Déléguer davantage au privé et au local", delta: { economy: 29 } },
    ],
  },
  {
    id: "institutions",
    prompt: "Comment réformer les institutions ?",
    options: [
      {
        id: "parliament",
        label: "Renforcer Parlement, proportionnelle et participation",
        delta: { society: -22, authority: -22 },
      },
      {
        id: "decentralize",
        label: "Décentraliser sans changer de République",
        delta: { authority: -5 },
      },
      { id: "executive", label: "Renforcer la stabilité de l’exécutif", delta: { authority: 28 } },
    ],
  },
];

export const signatureMeasures: SignatureMeasure[] = [
  {
    id: "citizen_convention",
    label: "Convention citoyenne permanente",
    description: "Associer des citoyens tirés au sort aux grandes réformes.",
    delta: { authority: -22, society: -18 },
  },
  {
    id: "public_investment",
    label: "Plan d’investissement public",
    description: "Financer transports, santé, école et rénovation.",
    delta: { economy: -28, ecology: 22 },
  },
  {
    id: "tax_simplification",
    label: "Grand choc de simplification",
    description: "Réduire normes et prélèvements sur l’activité.",
    delta: { economy: 34 },
  },
  {
    id: "climate_contract",
    label: "Contrat climatique territorial",
    description: "Fixer des objectifs écologiques adaptés à chaque région.",
    delta: { ecology: 32, authority: -8 },
  },
  {
    id: "security_pact",
    label: "Pacte sécurité-justice",
    description: "Renforcer les moyens avec une évaluation indépendante.",
    delta: { authority: 28 },
  },
  {
    id: "migration_compromise",
    label: "Pacte migration-intégration",
    description: "Lier contrôle des flux, accueil et intégration.",
    delta: { immigration: 3 },
  },
  {
    id: "european_defense",
    label: "Défense européenne commune",
    description: "Mutualiser des capacités stratégiques européennes.",
    delta: { europe: 30 },
  },
  {
    id: "local_referendum",
    label: "Référendum local d’initiative",
    description: "Donner davantage de pouvoir décisionnel aux territoires.",
    delta: { authority: -19 },
  },
  {
    id: "school_guarantee",
    label: "Garantie nationale pour l’école",
    description: "Assurer des moyens minimaux par élève et territoire.",
    delta: { economy: -18, society: -10 },
  },
  {
    id: "work_income",
    label: "Prime universelle d’activité",
    description: "Soutenir les revenus du travail avec un mécanisme simple.",
    delta: { economy: -4 },
  },
];

function applyDelta(vector: IdeologyVector, delta: Partial<IdeologyVector>): void {
  for (const [axis, value] of Object.entries(delta)) {
    const key = axis as keyof IdeologyVector;
    vector[key] = clamp(vector[key] + (value ?? 0), -100, 100);
  }
}

const MEASURE_TOPICS: Record<string, PoliticalTopic[]> = {
  citizen_convention: ["institutions", "civil_liberties"],
  public_investment: ["public_services", "ecology"],
  tax_simplification: ["fiscality", "economy"],
  climate_contract: ["ecology", "institutions"],
  security_pact: ["security", "civil_liberties"],
  migration_compromise: ["immigration", "social_issues"],
  european_defense: ["europe", "security"],
  local_referendum: ["institutions"],
  school_guarantee: ["public_services", "social_issues"],
  work_income: ["work", "fiscality"],
};

function customContradictions(input: CustomPartyInput): string[] {
  const contradictions: string[] = [];
  if (input.answers.taxation === "redistribute" && input.answers.services === "delegate")
    contradictions.push(
      "Redistribution nationale et délégation accrue au privé restent à articuler.",
    );
  if (input.answers.europe === "sovereign" && input.measureIds.includes("european_defense"))
    contradictions.push(
      "Le retour de compétences nationales contredit la défense européenne intégrée.",
    );
  if (input.answers.security === "liberties" && input.measureIds.includes("security_pact"))
    contradictions.push(
      "Les nouveaux pouvoirs de sécurité exigent des garanties absentes du pacte initial.",
    );
  if (input.answers.ecology === "transform" && input.measureIds.includes("tax_simplification"))
    contradictions.push(
      "La transformation écologique rapide manque encore d’outils réglementaires assumés.",
    );
  if (input.answers.taxation === "reduce" && input.measureIds.includes("public_investment"))
    contradictions.push(
      "Le plan d’investissement n’est pas financé par la baisse annoncée des prélèvements.",
    );
  if (input.leadershipModel === "decentralized" && input.answers.institutions === "executive")
    contradictions.push("L’organisation décentralisée défend un exécutif national renforcé.");
  return contradictions;
}

function topicProfile(ideology: IdeologyVector): {
  favorable: PoliticalTopic[];
  dangerous: PoliticalTopic[];
} {
  const ranked: Array<{ topic: PoliticalTopic; intensity: number }> = [
    { topic: "economy", intensity: Math.abs(ideology.economy) },
    { topic: "fiscality", intensity: Math.abs(ideology.economy) * 0.9 },
    { topic: "europe", intensity: Math.abs(ideology.europe) },
    { topic: "ecology", intensity: Math.abs(ideology.ecology) },
    { topic: "security", intensity: Math.abs(ideology.authority) },
    { topic: "immigration", intensity: Math.abs(ideology.immigration) },
    { topic: "institutions", intensity: Math.abs(ideology.authority) * 0.75 },
    { topic: "social_issues", intensity: Math.abs(ideology.society) },
  ];
  ranked.sort((left, right) => right.intensity - left.intensity);
  return {
    favorable: ranked.slice(0, 3).map((entry) => entry.topic),
    dangerous: ranked.slice(-2).map((entry) => entry.topic),
  };
}

export function buildCustomParty(input: CustomPartyInput): PartyDefinition {
  const ideology: IdeologyVector = {
    economy: 0,
    society: 0,
    europe: 0,
    ecology: 0,
    authority: 0,
    immigration: 0,
  };
  for (const question of ideologyQuestions) {
    const option = question.options.find(
      (candidate) => candidate.id === input.answers[question.id],
    );
    if (option) applyDelta(ideology, option.delta);
  }
  const selectedMeasures = signatureMeasures.filter((measure) =>
    input.measureIds.slice(0, 3).includes(measure.id),
  );
  for (const measure of selectedMeasures) applyDelta(ideology, measure.delta);

  const leadership = {
    vertical: { cohesion: 70, mobilization: 63, localStrength: 38, credibility: 52 },
    balanced: { cohesion: 64, mobilization: 58, localStrength: 53, credibility: 56 },
    decentralized: { cohesion: 54, mobilization: 65, localStrength: 68, credibility: 49 },
  }[input.leadershipModel];
  const priority = {
    officials: { electedSupport: 61, members: 16_000, credibility: 4 },
    members: { electedSupport: 34, members: 48_000, credibility: 0 },
    experts: { electedSupport: 37, members: 12_000, credibility: 8 },
  }[input.organizationPriority];

  const electorateAffinity = Object.fromEntries(
    electorateBlocs.map((bloc) => [
      bloc.id,
      clamp(86 - ideologyDistance(ideology, bloc.ideology) * 0.52, 18, 88),
    ]),
  ) as PartyDefinition["electorateAffinity"];
  const electorateRanking = Object.entries(electorateAffinity).sort(
    (left, right) => right[1] - left[1],
  ) as Array<[ElectorateBlocId, number]>;
  const contradictions = customContradictions(input);
  const profileContradictions = contradictions.length
    ? contradictions
    : ["La croissance rapide du mouvement peut dépasser sa capacité d’organisation territoriale."];
  const incoherence = clamp(contradictions.length * 18, 0, 90);
  const selectedTopics = Array.from(
    new Set(selectedMeasures.flatMap((measure) => MEASURE_TOPICS[measure.id] ?? [])),
  );
  const topics = topicProfile(ideology);
  const neighborRanking = parties
    .map((party) => ({ id: party.id, distance: ideologyDistance(ideology, party.ideology) }))
    .sort((left, right) => left.distance - right.distance);

  const safeName = input.name.trim().slice(0, 50) || "Mouvement citoyen";
  const safeShortName = input.shortName.trim().toUpperCase().slice(0, 8) || "MC";
  return {
    id: "custom_party",
    displayName: safeName,
    shortName: safeShortName,
    aliases: [],
    isRealOrganization: false,
    visual: {
      primaryColor: /^#[0-9a-fA-F]{6}$/.test(input.primaryColor)
        ? input.primaryColor
        : CUSTOM_PARTY_COLORS[0]!,
      secondaryColor: "#fffdf8",
      monogram: safeShortName.slice(0, 3),
      symbol: CUSTOM_PARTY_SYMBOLS.includes(input.symbol) ? input.symbol : CUSTOM_PARTY_SYMBOLS[0]!,
    },
    ideology,
    baseline: {
      baseSupport: 2.8,
      potentialSupport: 17,
      mobilization: leadership.mobilization,
      finances: 39,
      mediaPresence: 34,
      governingCredibility: leadership.credibility + priority.credibility,
      cohesion: clamp(leadership.cohesion - incoherence * 0.08),
      rejection: 28,
      localStrength: leadership.localStrength,
      electedSupport: priority.electedSupport,
      popularity: 46,
      members: priority.members,
      awareness: 32,
      momentum: 52,
    },
    strengths: ["Rejet initial faible", "Projet construit par le joueur", "Capacité de surprise"],
    weaknesses: ["Notoriété encore limitée", "Financement fragile", "Pression du vote utile"],
    program: selectedMeasures.length
      ? selectedMeasures.map((measure) => measure.label)
      : [
          "Rénover les institutions",
          "Soutenir les services de proximité",
          "Préparer la transition",
        ],
    electorateAffinity,
    regionalAffinity: {
      ile_de_france: 50,
      north: 50,
      east: 50,
      west: 50,
      south_west: 50,
      south_east: 50,
      central: 50,
      overseas: 50,
    },
    nominationModeWeights: { automatic: 6, primary: 1, internalVote: 2, leadershipCrisis: 1 },
    strategicArchetypes: ["media_momentum", "consolidate_base", "prepare_alliance"],
    uniqueEventTags: [
      "custom_party",
      `custom_leadership_${input.leadershipModel}`,
      `custom_priority_${input.organizationPriority}`,
      incoherence >= 35 ? "custom_incoherent" : "custom_coherent",
    ],
    ideologyFamily: "custom",
    campaignProfile: {
      coreElectorates: electorateRanking.slice(0, 2).map(([id]) => id),
      targetElectorates: electorateRanking.slice(2, 5).map(([id]) => id),
      difficultElectorates: electorateRanking.slice(-2).map(([id]) => id),
      activistCulture:
        input.organizationPriority === "members"
          ? "Militants nombreux, assemblées locales et campagnes de terrain"
          : input.organizationPriority === "officials"
            ? "Réseau d’élus locaux et culture de négociation territoriale"
            : "Petite équipe experte, production de notes et communication numérique",
      publicImage:
        incoherence >= 35
          ? "Offre nouvelle remarquée, mais encore difficile à résumer sans contradiction"
          : "Offre nouvelle dont la ligne paraît cohérente mais la capacité à gouverner reste à prouver",
      mediaRelationship:
        input.organizationPriority === "experts"
          ? "Accès facile aux formats de fond, difficulté à créer une dynamique populaire"
          : "Notoriété faible et accès médiatique dépendant des percées de campagne",
      internalTensions: profileContradictions,
      favorableTopics: Array.from(new Set([...selectedTopics, ...topics.favorable])).slice(0, 5),
      dangerousTopics: topics.dangerous,
      naturalAllies: neighborRanking.slice(0, 2).map(({ id }) => id),
      directCompetitors: neighborRanking.slice(0, 3).map(({ id }) => id),
      firstRoundStrategy:
        "Transformer la nouveauté en implantation et franchir le seuil du vote utile.",
      runoffStrategy: "Négocier des soutiens précis sans dissoudre la raison d’être du mouvement.",
      contradictions: profileContradictions,
      victoryConditions: [
        "Faire connaître la candidature au-delà de son premier électorat.",
        "Construire un réseau territorial avant la campagne officielle.",
        "Résoudre publiquement les contradictions programmatiques plutôt que les nier.",
      ],
    },
    organizationProfile: {
      leadershipStyle:
        input.leadershipModel === "vertical"
          ? "personal"
          : input.leadershipModel === "decentralized"
            ? "federal"
            : "collective",
      internalDemocracy:
        input.leadershipModel === "vertical" ? 32 : input.leadershipModel === "balanced" ? 64 : 82,
      volunteerReliance:
        input.organizationPriority === "members"
          ? 84
          : input.organizationPriority === "officials"
            ? 54
            : 38,
      fundingModel:
        input.organizationPriority === "members"
          ? "members"
          : input.organizationPriority === "officials"
            ? "elected_officials"
            : "mixed",
      priorityTopics: selectedTopics.length ? selectedTopics : topics.favorable,
      incoherence,
    },
    careerTitle: "Parti neuf, rêve ancien",
  };
}

export function describeCustomPartyElectorate(party: PartyDefinition): string {
  const strongest = electorateBlocs
    .map((bloc) => ({
      label: bloc.label.toLocaleLowerCase("fr"),
      affinity: party.electorateAffinity[bloc.id],
    }))
    .sort((left, right) => right.affinity - left.affinity);
  return `Votre mouvement attire d’abord ${strongest[0]?.label ?? "des électeurs en recherche d’alternative"} et ${strongest[1]?.label ?? "des actifs"}, mais doit encore convaincre ${strongest.at(-1)?.label ?? "les publics les plus éloignés"}.`;
}
