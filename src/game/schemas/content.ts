import { z } from "zod";

const boundedStat = z.number().finite().min(0).max(100);
const ideologyValue = z.number().finite().min(-100).max(100);

const politicalTopics = [
  "economy",
  "fiscality",
  "pensions",
  "public_services",
  "work",
  "security",
  "immigration",
  "europe",
  "ecology",
  "institutions",
  "civil_liberties",
  "social_issues",
] as const;

const ideologyFamilies = [
  "radical_left",
  "social_democrat",
  "green",
  "liberal_center",
  "center_right",
  "conservative_right",
  "national_right",
  "sovereigntist_right",
  "custom",
] as const;

const choiceStrategies = [
  "policy_commitment",
  "media_response",
  "internal_discipline",
  "negotiation",
  "break",
  "compromise",
  "legal_action",
  "symbolic_action",
  "silence",
  "grassroots_mobilization",
  "program_shift",
  "alliance",
  "exclusion",
  "personal_risk",
  "long_term_strategy",
] as const;

const memoryKinds = [
  "trust",
  "hostility",
  "political_debt",
  "betrayal",
  "support",
  "humiliation",
  "promise",
  "alliance_refusal",
  "exclusion",
  "rallying",
] as const;

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
  ideologyFamily: z.enum(ideologyFamilies).optional(),
  campaignProfile: z
    .object({
      coreElectorates: z.array(z.enum(blocs)).min(1),
      targetElectorates: z.array(z.enum(blocs)).min(1),
      difficultElectorates: z.array(z.enum(blocs)).min(1),
      activistCulture: z.string().min(10).max(300),
      publicImage: z.string().min(10).max(300),
      mediaRelationship: z.string().min(10).max(300),
      internalTensions: z.array(z.string().min(5).max(200)).min(1),
      favorableTopics: z.array(z.enum(politicalTopics)).min(1),
      dangerousTopics: z.array(z.enum(politicalTopics)).min(1),
      naturalAllies: z.array(z.string()),
      directCompetitors: z.array(z.string()),
      firstRoundStrategy: z.string().min(10).max(300),
      runoffStrategy: z.string().min(10).max(300),
      contradictions: z.array(z.string().min(5).max(200)).min(1),
      victoryConditions: z.array(z.string().min(5).max(200)).min(1),
    })
    .optional(),
  organizationProfile: z
    .object({
      leadershipStyle: z.enum(["personal", "collective", "federal", "movement"]),
      internalDemocracy: boundedStat,
      volunteerReliance: boundedStat,
      fundingModel: z.enum(["members", "donors", "elected_officials", "mixed"]),
      priorityTopics: z.array(z.enum(politicalTopics)).min(1),
      incoherence: boundedStat,
    })
    .optional(),
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
    entries: z
      .array(
        z.object({
          id: z.string(),
          actorId: z.string(),
          kind: z.enum(memoryKinds),
          intensity: z.number().finite().min(-100).max(100),
          sourceEventId: z.string(),
          createdDecisionIndex: z.number().int().nonnegative(),
          targetActorId: z.string().optional(),
          targetPartyId: z.string().optional(),
          topic: z.enum(politicalTopics).optional(),
          active: z.boolean(),
        }),
      )
      .optional(),
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
  z.object({
    kind: z.literal("actor_memory"),
    actorId: z.string(),
    memory: z.enum(memoryKinds),
    intensity: z.number().finite().min(-100).max(100),
    targetActorId: z.string().optional(),
    targetPartyId: z.string().optional(),
    topic: z.enum(politicalTopics).optional(),
    visibility: z.enum(["visible", "hidden"]).optional(),
    label: z.string().optional(),
  }),
  z.object({
    kind: z.literal("party_relation"),
    partyId: z.string(),
    withPartyId: z.string(),
    delta: z.number().finite().min(-100).max(100),
    visibility: z.enum(["visible", "hidden"]).optional(),
    label: z.string().optional(),
  }),
  z.object({
    kind: z.literal("policy_position"),
    topic: z.enum(politicalTopics),
    stance: ideologyValue,
    confidence: boundedStat.optional(),
    visibility: z.enum(["visible", "hidden"]).optional(),
    label: z.string().optional(),
  }),
  z.object({
    kind: z.literal("opponent_strategy"),
    actorId: z.string(),
    strategy: z.enum(strategies),
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
  z.object({
    kind: z.literal("game_mode"),
    values: z.array(z.enum(["existing_party", "custom_party", "random"])).min(1),
  }),
  z.object({
    kind: z.literal("ideology"),
    axis: z.enum(["economy", "society", "europe", "ecology", "authority", "immigration"]),
    operator: z.enum(["gte", "lte"]),
    value: ideologyValue,
  }),
  z.object({
    kind: z.literal("ideology_family"),
    values: z.array(z.enum(ideologyFamilies)).min(1),
  }),
  z.object({
    kind: z.literal("statement_exists"),
    topic: z.enum(politicalTopics),
    value: z.boolean(),
  }),
  z.object({
    kind: z.literal("contradiction_count"),
    operator: z.enum(["gte", "lte"]),
    value: z.number().int().nonnegative(),
  }),
  z.object({
    kind: z.literal("actor_memory"),
    actorId: z.string(),
    memory: z.enum(memoryKinds),
    minimumIntensity: z.number().finite().min(-100).max(100).optional(),
  }),
  z.object({
    kind: z.literal("party_relation"),
    partyId: z.string(),
    operator: z.enum(["gte", "lte"]),
    value: z.number().finite().min(-100).max(100),
  }),
]);

const modifierSchema = z.object({
  source: z.enum([
    "party_stat",
    "trait",
    "world",
    "flag",
    "phase",
    "history",
    "ideology",
    "statement",
    "actor_memory",
    "party_relation",
    "electorate",
    "consistency",
  ]),
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
  followUps: z
    .array(
      z.object({
        eventId: z.string(),
        afterDecisions: z.number().int().positive().max(30),
        probability: z.number().finite().min(0).max(1),
        conditions: z.array(conditionSchema).optional(),
      }),
    )
    .optional(),
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
  themes: z.array(z.enum(politicalTopics)).min(1).max(4).optional(),
  importance: z.enum(["routine", "notable", "major", "decisive"]).optional(),
  phaseWeights: z.record(z.string(), z.number().nonnegative()),
  rarity: z.enum(["common", "uncommon", "rare", "legendary", "secret"]),
  baseWeight: z.number().positive(),
  minDecisionIndex: z.number().int().nonnegative().optional(),
  maxDecisionIndex: z.number().int().nonnegative().optional(),
  eligibleParties: z.array(z.string()).optional(),
  eligibleIdeologyFamilies: z.array(z.enum(ideologyFamilies)).min(1).optional(),
  excludedParties: z.array(z.string()).optional(),
  incompatibleEventIds: z.array(z.string()).optional(),
  requiredTags: z.array(z.string()).optional(),
  forbiddenFlags: z.array(z.string()).optional(),
  eligibility: z.array(conditionSchema),
  cooldown: z.number().int().nonnegative(),
  oncePerRun: z.boolean(),
  maxAppearances: z.number().int().positive().max(10).optional(),
  entityReferences: z
    .array(
      z.object({
        entityId: z.string(),
        role: z.enum(["subject", "speaker", "host", "location", "institution", "context"]),
      }),
    )
    .optional(),
  editorialSensitivity: z.enum(["none", "contextual", "sensitive", "prohibited"]).optional(),
  chain: z
    .object({
      id: z.string().regex(/^[a-z0-9_]+$/),
      step: z.number().int().positive(),
      followsEventIds: z.array(z.string()).optional(),
      minimumDelay: z.number().int().nonnegative().optional(),
      maximumDelay: z.number().int().nonnegative().optional(),
    })
    .optional(),
  successConditions: z.array(conditionSchema).optional(),
  failureConditions: z.array(conditionSchema).optional(),
  worldImpact: z.boolean().optional(),
  sensitiveContent: z
    .object({
      tags: z.array(
        z.enum(["crime", "corruption", "fraud", "health", "addiction", "family", "violence"]),
      ),
      actorIds: z.array(z.string()),
      treatment: z.enum(["fictional_only", "verified_context"]),
    })
    .optional(),
  choices: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(4).max(140),
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
            "INSTITUTIONNEL",
            "POPULAIRE",
            "PRÉSIDENTIEL",
            "TRANSPARENT",
            "SECRET",
          ])
          .optional(),
        strategy: z.enum(choiceStrategies).optional(),
        outcomeGroups: z.array(outcomeSchema).min(1),
        immediatePublicHint: z.string().optional(),
        statement: z
          .object({
            topic: z.string(),
            policyTopic: z.enum(politicalTopics).optional(),
            text: z.string(),
            stance: ideologyValue.optional(),
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
  traitEffects: z
    .object({
      charisma: z.number().finite().min(-100).max(100),
      mediaSkill: z.number().finite().min(-100).max(100),
      competence: z.number().finite().min(-100).max(100),
      tactics: z.number().finite().min(-100).max(100),
      integrity: z.number().finite().min(-100).max(100),
      endurance: z.number().finite().min(-100).max(100),
      authority: z.number().finite().min(-100).max(100),
      empathy: z.number().finite().min(-100).max(100),
      discipline: z.number().finite().min(-100).max(100),
      coalitionSkill: z.number().finite().min(-100).max(100),
    })
    .partial(),
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
  criteria: z
    .object({
      mode: z.enum(["all", "any"]),
      conditions: z
        .array(
          z.object({
            metric: z.enum([
              "campaign_completed",
              "won",
              "qualified",
              "party_id",
              "game_mode",
              "ending_id",
              "score",
              "first_round_score",
              "second_round_score",
              "second_round_margin",
              "polling_progression",
              "starting_polling",
              "final_rank",
              "decisions",
              "polls",
              "positive_outcomes",
              "positive_event_outcomes",
              "scandals",
              "statement_topics",
              "contradictions",
              "alliances",
              "actor_memories",
              "members",
              "party_stat",
              "hidden_stat",
              "choice_strategy",
              "choice_tag",
              "event_category",
              "outcome_id",
            ]),
            operator: z.enum(["eq", "gte", "lte", "contains"]),
            value: z.union([z.boolean(), z.number(), z.string()]),
            key: z.string().optional(),
          }),
        )
        .min(1),
    })
    .optional(),
});

export const endingSchema = z.object({
  id: z.string(),
  title: z.string(),
  narrative: z.string().min(20),
  secret: z.boolean().optional(),
});

export const gameContentSchema = z.object({
  contentVersion: z.union([z.literal(1), z.literal(2)]).optional(),
  parties: z.array(partyDefinitionSchema).min(2),
  actors: z.array(actorSchema).min(2),
  electorateBlocs: z.array(electorateBlocSchema).length(12),
  events: z.array(eventSchema).min(1),
  methods: z.array(campaignMethodSchema).min(1),
  achievements: z.array(achievementSchema).min(1),
  endings: z.array(endingSchema).min(1),
  entities: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9_]+$/),
        displayName: z.string().min(2).max(120),
        category: z.enum([
          "party",
          "public_figure",
          "fictional_character",
          "media",
          "broadcast_format",
          "institution",
          "country",
          "territory",
          "organization",
          "historical_event",
        ]),
        reality: z.enum(["real", "fictional"]),
        allowedUses: z.array(z.string().min(3)).min(1),
        sensitivity: z.enum(["none", "contextual", "sensitive", "prohibited"]),
        verifiedAt: z.string().optional(),
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
        notes: z.string().optional(),
      }),
    )
    .optional(),
});
