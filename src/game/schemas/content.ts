import { z } from "zod";

const boundedStat = z.number().finite().min(0).max(100);
const ideologyValue = z.number().finite().min(-100).max(100);

export const ideologySchema = z.object({
  economy: ideologyValue,
  society: ideologyValue,
  europe: ideologyValue,
  ecology: ideologyValue,
  authority: ideologyValue,
  immigration: ideologyValue,
});

export const traitsSchema = z.object({
  charisma: boundedStat,
  mediaSkill: boundedStat,
  competence: boundedStat,
  tactics: boundedStat,
  integrity: boundedStat,
  endurance: boundedStat,
  authority: boundedStat,
  empathy: boundedStat,
  discipline: boundedStat,
  coalitionSkill: boundedStat,
});

const regions = [
  "ile_de_france",
  "north",
  "east",
  "west",
  "south_west",
  "south_east",
  "central",
  "overseas",
] as const;

const blocs = [
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
] as const;

const strategies = [
  "consolidate_base",
  "look_presidential",
  "attack_favorite",
  "poach_neighbor",
  "media_momentum",
  "prepare_alliance",
  "limit_risk",
  "useful_vote",
  "prepare_runoff",
] as const;

export const partyDefinitionSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  displayName: z.string().min(2).max(80),
  shortName: z.string().min(1).max(16),
  aliases: z.array(z.string().min(1).max(80)),
  isRealOrganization: z.boolean(),
  visual: z.object({
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    monogram: z.string().min(1).max(5),
    symbol: z.string().min(1).max(8),
  }),
  ideology: ideologySchema,
  baseline: z.object({
    baseSupport: boundedStat,
    potentialSupport: boundedStat,
    mobilization: boundedStat,
    finances: boundedStat,
    mediaPresence: boundedStat,
    governingCredibility: boundedStat,
    cohesion: boundedStat,
    rejection: boundedStat,
    localStrength: boundedStat,
    electedSupport: boundedStat,
    popularity: boundedStat,
    members: z.number().finite().int().nonnegative().max(5_000_000),
    awareness: boundedStat,
    momentum: boundedStat,
  }),
  strengths: z.array(z.string().min(3).max(120)).min(3),
  weaknesses: z.array(z.string().min(3).max(120)).min(3),
  program: z.array(z.string().min(3).max(160)).min(3).max(5),
  electorateAffinity: z.record(z.enum(blocs), boundedStat),
  regionalAffinity: z.record(z.enum(regions), boundedStat),
  nominationModeWeights: z.object({
    automatic: z.number().positive(),
    primary: z.number().positive(),
    internalVote: z.number().positive(),
    leadershipCrisis: z.number().positive(),
  }),
  strategicArchetypes: z.array(z.enum(strategies)).min(1),
  uniqueEventTags: z.array(z.string()),
  careerTitle: z.string().min(3).max(80),
  sourceMetadata: z
    .array(
      z.object({
        title: z.string(),
        publisher: z.string(),
        url: z.url(),
        publishedAt: z.string().optional(),
        accessedAt: z.string(),
        note: z.string().optional(),
      }),
    )
    .optional(),
});

export const actorSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  identityKind: z.enum(["fictional", "real_public_figure"]),
  displayName: z.string().min(2).max(80),
  partyId: z.string(),
  role: z.enum(["candidate", "cadre", "spokesperson", "ally", "context"]),
  ideology: ideologySchema,
  traits: traitsSchema,
  legitimacy: boundedStat,
  ambition: boundedStat,
  loyalty: boundedStat,
  mediaSkill: boundedStat,
  governingCredibility: boundedStat,
  scandalRisk: boundedStat,
  active: z.boolean(),
  candidateStatus: z.enum([
    "none",
    "potential",
    "declared",
    "official",
    "withdrawn",
    "disqualified",
    "eliminated",
  ]),
  strategy: z.enum(strategies),
  memory: z.object({
    successfulActions: z.array(z.string()),
    failedActions: z.array(z.string()),
    rivalries: z.array(z.string()),
    promises: z.array(z.string()),
  }),
});

const effectSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("party_stat"),
    stat: z.enum([
      "polling",
      "popularity",
      "mobilization",
      "finances",
      "credibility",
      "cohesion",
      "members",
      "mediaPresence",
      "awareness",
      "rejection",
      "momentum",
      "localStrength",
      "electedSupport",
    ]),
    delta: z.number().finite(),
    target: z.string().optional(),
    visibility: z.enum(["visible", "hidden"]).optional(),
    label: z.string().optional(),
  }),
  z.object({
    kind: z.literal("hidden_stat"),
    stat: z.enum([
      "baseSupport",
      "potentialSupport",
      "transferability",
      "scandalRisk",
      "cadreLoyalty",
      "rivalAmbition",
      "economicCompetence",
      "securityCompetence",
      "socialCompetence",
      "fatigue",
      "consistency",
    ]),
    delta: z.number().finite(),
    target: z.string().optional(),
    visibility: z.enum(["visible", "hidden"]).optional(),
    label: z.string().optional(),
  }),
  z.object({
    kind: z.literal("trait"),
    trait: z.enum([
      "charisma",
      "mediaSkill",
      "competence",
      "tactics",
      "integrity",
      "endurance",
      "authority",
      "empathy",
      "discipline",
      "coalitionSkill",
    ]),
    delta: z.number().finite(),
    visibility: z.enum(["visible", "hidden"]).optional(),
    label: z.string().optional(),
  }),
  z.object({
    kind: z.literal("ideology"),
    axis: z.enum(["economy", "society", "europe", "ecology", "authority", "immigration"]),
    delta: z.number().finite(),
    visibility: z.enum(["visible", "hidden"]).optional(),
    label: z.string().optional(),
  }),
  z.object({
    kind: z.literal("world"),
    stat: z.enum([
      "economicClimate",
      "socialTension",
      "securityConcern",
      "climateConcern",
      "incumbentFatigue",
      "turnoutMood",
    ]),
    delta: z.number().finite(),
    visibility: z.enum(["visible", "hidden"]).optional(),
    label: z.string().optional(),
  }),
  z.object({
    kind: z.literal("bloc_trust"),
    blocId: z.enum(blocs),
    delta: z.number().finite(),
    visibility: z.enum(["visible", "hidden"]).optional(),
    label: z.string().optional(),
  }),
  z.object({
    kind: z.literal("flag"),
    key: z.string(),
    value: z.union([z.boolean(), z.number(), z.string()]),
    visibility: z.enum(["visible", "hidden"]).optional(),
    label: z.string().optional(),
  }),
  z.object({
    kind: z.literal("candidate_status"),
    actorId: z.string(),
    status: z.enum([
      "none",
      "potential",
      "declared",
      "official",
      "withdrawn",
      "disqualified",
      "eliminated",
    ]),
    visibility: z.enum(["visible", "hidden"]).optional(),
    label: z.string().optional(),
  }),
  z.object({
    kind: z.literal("alliance"),
    partyId: z.string(),
    withPartyId: z.string(),
    action: z.enum(["add", "remove"]),
    visibility: z.enum(["visible", "hidden"]).optional(),
    label: z.string().optional(),
  }),
  z.object({
    kind: z.literal("party_split"),
    partyId: z.string(),
    actorId: z.string().optional(),
    visibility: z.enum(["visible", "hidden"]).optional(),
    label: z.string().optional(),
  }),
]);

const conditionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("phase"),
    values: z.array(
      z.enum([
        "setup",
        "pre_campaign",
        "campaign",
        "official_campaign",
        "first_round",
        "between_rounds",
        "second_round",
        "government_epilogue",
        "finished",
      ]),
    ),
  }),
  z.object({ kind: z.literal("decision_min"), value: z.number().int().nonnegative() }),
  z.object({ kind: z.literal("decision_max"), value: z.number().int().nonnegative() }),
  z.object({
    kind: z.literal("party_stat"),
    stat: z.string(),
    operator: z.enum(["gte", "lte"]),
    value: z.number(),
  }),
  z.object({
    kind: z.literal("trait"),
    trait: z.string(),
    operator: z.enum(["gte", "lte"]),
    value: z.number(),
  }),
  z.object({
    kind: z.literal("flag"),
    key: z.string(),
    equals: z.union([z.boolean(), z.number(), z.string()]),
  }),
  z.object({ kind: z.literal("not_flag"), key: z.string() }),
  z.object({ kind: z.literal("player_party"), partyIds: z.array(z.string()).min(1) }),
  z.object({ kind: z.literal("qualified"), value: z.boolean() }),
]);

const modifierSchema = z.object({
  source: z.enum(["party_stat", "trait", "world", "flag", "phase", "history"]),
  key: z.string(),
  coefficient: z.number().finite().min(-10).max(10),
  expected: z.union([z.boolean(), z.number(), z.string()]).optional(),
});

const outcomeSchema = z.object({
  id: z.string().min(2),
  baseWeight: z.number().positive(),
  modifiers: z.array(modifierSchema),
  title: z.string().min(3).max(100),
  publicNarrative: z.string().min(20).max(700),
  effects: z.array(effectSchema),
  delayedEffects: z
    .array(
      z.object({
        afterDecisions: z.number().int().positive().max(30),
        effects: z.array(effectSchema).min(1),
        narrative: z.string().min(10).max(500).optional(),
      }),
    )
    .optional(),
  setFlags: z.record(z.string(), z.union([z.boolean(), z.number(), z.string()])).optional(),
  enqueueEventIds: z.array(z.string()).optional(),
  endingTrigger: z.string().optional(),
});

export const eventSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  title: z.string().min(3).max(100),
  category: z.enum([
    "campaign",
    "media",
    "debate",
    "program",
    "internal",
    "alliance",
    "world",
    "scandal",
    "party",
    "rare",
    "between_rounds",
    "government",
  ]),
  summary: z.string().min(25).max(700),
  phaseWeights: z.record(z.string(), z.number().nonnegative()),
  rarity: z.enum(["common", "uncommon", "rare", "legendary", "secret"]),
  baseWeight: z.number().positive(),
  minDecisionIndex: z.number().int().nonnegative().optional(),
  maxDecisionIndex: z.number().int().nonnegative().optional(),
  eligibleParties: z.array(z.string()).optional(),
  excludedParties: z.array(z.string()).optional(),
  requiredTags: z.array(z.string()).optional(),
  forbiddenFlags: z.array(z.string()).optional(),
  eligibility: z.array(conditionSchema),
  cooldown: z.number().int().nonnegative(),
  oncePerRun: z.boolean(),
  worldImpact: z.boolean().optional(),
  sensitiveContent: z
    .object({
      tags: z.array(
        z.enum(["crime", "corruption", "fraud", "health", "addiction", "family", "violence"]),
      ),
      actorIds: z.array(z.string()).min(1),
      treatment: z.enum(["fictional_only", "verified_context"]),
    })
    .optional(),
  choices: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(4).max(100),
        visibleTag: z
          .enum([
            "PRUDENT",
            "RISQUÉ",
            "CLIVANT",
            "RASSEMBLEUR",
            "OFFENSIF",
            "LOYAL",
            "OPPORTUNISTE",
            "TECHNIQUE",
            "POPULAIRE",
            "PRÉSIDENTIEL",
            "TRANSPARENT",
            "SECRET",
          ])
          .optional(),
        outcomeGroups: z.array(outcomeSchema).min(1),
        immediatePublicHint: z.string().optional(),
        statement: z
          .object({
            topic: z.string(),
            text: z.string(),
            ideology: ideologySchema.partial().optional(),
          })
          .optional(),
      }),
    )
    .min(2)
    .max(5),
});

export const electorateBlocSchema = z.object({
  id: z.enum(blocs),
  label: z.string().min(3),
  shortLabel: z.string().min(2),
  weight: z.number().positive(),
  ideology: ideologySchema,
  priorities: z
    .array(z.enum(["economy", "social", "security", "ecology", "europe", "services"]))
    .min(1),
  volatility: boundedStat,
  turnout: boundedStat,
  usefulVoteSensitivity: boundedStat,
  regionalAffinity: z.partialRecord(z.enum(regions), z.number()),
});

export const campaignMethodSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  symbol: z.string(),
  effects: z.array(effectSchema),
  traitEffects: traitsSchema.partial(),
});

export const achievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum([
    "first_campaigns",
    "wins",
    "party",
    "communication",
    "ideology",
    "alliances",
    "records",
    "secret_endings",
  ]),
  icon: z.string(),
  secret: z.boolean().optional(),
});

export const endingSchema = z.object({
  id: z.string(),
  title: z.string(),
  narrative: z.string().min(20),
  secret: z.boolean().optional(),
});

export const gameContentSchema = z.object({
  parties: z.array(partyDefinitionSchema).min(2),
  actors: z.array(actorSchema).min(2),
  electorateBlocs: z.array(electorateBlocSchema).length(12),
  events: z.array(eventSchema).min(1),
  methods: z.array(campaignMethodSchema).min(1),
  achievements: z.array(achievementSchema).min(1),
  endings: z.array(endingSchema).min(1),
});
