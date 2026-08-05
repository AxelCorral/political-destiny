export type ActorIdentityKind = "fictional" | "real_public_figure";

export type GameMode = "existing_party" | "custom_party" | "random";

export type GamePhase =
  | "setup"
  | "pre_campaign"
  | "campaign"
  | "official_campaign"
  | "first_round"
  | "between_rounds"
  | "second_round"
  | "government_epilogue"
  | "finished";

export type EventCategory =
  | "campaign"
  | "media"
  | "debate"
  | "program"
  | "internal"
  | "alliance"
  | "world"
  | "scandal"
  | "party"
  | "rare"
  | "between_rounds"
  | "government";

export type EventRarity = "common" | "uncommon" | "rare" | "legendary" | "secret";

export type EventImportance = "routine" | "notable" | "major" | "decisive";

export type PoliticalTopic =
  | "economy"
  | "fiscality"
  | "pensions"
  | "public_services"
  | "work"
  | "security"
  | "immigration"
  | "europe"
  | "ecology"
  | "institutions"
  | "civil_liberties"
  | "social_issues";

export type IdeologyFamily =
  | "radical_left"
  | "social_democrat"
  | "green"
  | "liberal_center"
  | "center_right"
  | "conservative_right"
  | "national_right"
  | "sovereigntist_right"
  | "custom";

export type ChoiceStrategy =
  | "policy_commitment"
  | "media_response"
  | "internal_discipline"
  | "negotiation"
  | "break"
  | "compromise"
  | "legal_action"
  | "symbolic_action"
  | "silence"
  | "grassroots_mobilization"
  | "program_shift"
  | "alliance"
  | "exclusion"
  | "personal_risk"
  | "long_term_strategy";

export type EntityCategory =
  | "party"
  | "public_figure"
  | "fictional_character"
  | "media"
  | "broadcast_format"
  | "institution"
  | "country"
  | "territory"
  | "organization"
  | "historical_event";

export type EntityReality = "real" | "fictional";

export type EditorialSensitivity = "none" | "contextual" | "sensitive" | "prohibited";

export interface EntityDefinition {
  id: string;
  displayName: string;
  category: EntityCategory;
  reality: EntityReality;
  allowedUses: string[];
  sensitivity: EditorialSensitivity;
  verifiedAt?: string;
  sourceMetadata?: SourceMetadata[];
  notes?: string;
}

export interface EntityReference {
  entityId: string;
  role: "subject" | "speaker" | "host" | "location" | "institution" | "context";
}

export type ChoiceTag =
  | "PRUDENT"
  | "RISQUÉ"
  | "CLIVANT"
  | "RASSEMBLEUR"
  | "OFFENSIF"
  | "LOYAL"
  | "OPPORTUNISTE"
  | "TECHNIQUE"
  | "POPULAIRE"
  | "PRÉSIDENTIEL"
  | "TRANSPARENT"
  | "SECRET";

export type IdeologyAxis =
  "economy" | "society" | "europe" | "ecology" | "authority" | "immigration";

export type IdeologyVector = Record<IdeologyAxis, number>;

export type PrimaryStatKey =
  "polling" | "popularity" | "mobilization" | "finances" | "credibility" | "cohesion";

export type SecondaryStatKey =
  | "members"
  | "mediaPresence"
  | "awareness"
  | "rejection"
  | "momentum"
  | "localStrength"
  | "electedSupport";

export type TraitKey =
  | "charisma"
  | "mediaSkill"
  | "competence"
  | "tactics"
  | "integrity"
  | "endurance"
  | "authority"
  | "empathy"
  | "discipline"
  | "coalitionSkill";

export type CandidateTraits = Record<TraitKey, number>;

export interface PartyStats extends Record<PrimaryStatKey, number> {
  members: number;
  mediaPresence: number;
  awareness: number;
  rejection: number;
  momentum: number;
  localStrength: number;
  electedSupport: number;
}

export interface HiddenPartyStats {
  baseSupport: number;
  potentialSupport: number;
  transferability: number;
  scandalRisk: number;
  cadreLoyalty: number;
  rivalAmbition: number;
  economicCompetence: number;
  securityCompetence: number;
  socialCompetence: number;
  fatigue: number;
  consistency: number;
}

export interface PartyVisual {
  primaryColor: string;
  secondaryColor: string;
  monogram: string;
  symbol: string;
}

export type RegionId =
  | "ile_de_france"
  | "north"
  | "east"
  | "west"
  | "south_west"
  | "south_east"
  | "central"
  | "overseas";

export type ElectorateBlocId =
  | "young_urban_graduates"
  | "young_precarious"
  | "rural_working_class"
  | "urban_working_class"
  | "middle_class_workers"
  | "executives"
  | "entrepreneurs"
  | "public_services"
  | "moderate_retirees"
  | "conservative_retirees"
  | "green_progressives"
  | "mobilisable_abstainers";

export interface SourceMetadata {
  title: string;
  publisher: string;
  url: string;
  publishedAt?: string;
  accessedAt: string;
  note?: string;
}

export interface PartyDefinition {
  id: string;
  displayName: string;
  shortName: string;
  aliases: string[];
  isRealOrganization: boolean;
  visual: PartyVisual;
  ideology: IdeologyVector;
  baseline: {
    baseSupport: number;
    potentialSupport: number;
    mobilization: number;
    finances: number;
    mediaPresence: number;
    governingCredibility: number;
    cohesion: number;
    rejection: number;
    localStrength: number;
    electedSupport: number;
    popularity: number;
    members: number;
    awareness: number;
    momentum: number;
  };
  strengths: string[];
  weaknesses: string[];
  program: string[];
  electorateAffinity: Record<ElectorateBlocId, number>;
  regionalAffinity: Record<RegionId, number>;
  nominationModeWeights: {
    automatic: number;
    primary: number;
    internalVote: number;
    leadershipCrisis: number;
  };
  strategicArchetypes: OpponentStrategy[];
  uniqueEventTags: string[];
  careerTitle: string;
  ideologyFamily?: IdeologyFamily;
  campaignProfile?: {
    coreElectorates: ElectorateBlocId[];
    targetElectorates: ElectorateBlocId[];
    difficultElectorates: ElectorateBlocId[];
    activistCulture: string;
    publicImage: string;
    mediaRelationship: string;
    internalTensions: string[];
    favorableTopics: PoliticalTopic[];
    dangerousTopics: PoliticalTopic[];
    naturalAllies: string[];
    directCompetitors: string[];
    firstRoundStrategy: string;
    runoffStrategy: string;
    contradictions: string[];
    victoryConditions: string[];
  };
  organizationProfile?: {
    leadershipStyle: "personal" | "collective" | "federal" | "movement";
    internalDemocracy: number;
    volunteerReliance: number;
    fundingModel: "members" | "donors" | "elected_officials" | "mixed";
    priorityTopics: PoliticalTopic[];
    incoherence: number;
  };
  sourceMetadata?: SourceMetadata[];
}

export interface PartyState {
  id: string;
  displayName: string;
  shortName: string;
  visual: PartyVisual;
  ideology: IdeologyVector;
  perceivedIdeology: IdeologyVector;
  ideologyFamily?: IdeologyFamily;
  stats: PartyStats;
  hidden: HiddenPartyStats;
  candidateId: string;
  active: boolean;
  alliedWith: string[];
  program: string[];
  electorateAffinity: Record<ElectorateBlocId, number>;
  regionalAffinity: Record<RegionId, number>;
  initialPolling: number;
}

export type ActorRole = "candidate" | "cadre" | "spokesperson" | "ally" | "context";

export type CandidateStatus =
  "none" | "potential" | "declared" | "official" | "withdrawn" | "disqualified" | "eliminated";

export type OpponentStrategy =
  | "consolidate_base"
  | "look_presidential"
  | "attack_favorite"
  | "poach_neighbor"
  | "media_momentum"
  | "prepare_alliance"
  | "limit_risk"
  | "useful_vote"
  | "prepare_runoff";

export interface ActorMemory {
  successfulActions: string[];
  failedActions: string[];
  rivalries: string[];
  promises: string[];
  entries?: ActorMemoryEntry[];
}

export type ActorMemoryKind =
  | "trust"
  | "hostility"
  | "political_debt"
  | "betrayal"
  | "support"
  | "humiliation"
  | "promise"
  | "alliance_refusal"
  | "exclusion"
  | "rallying";

export interface ActorMemoryEntry {
  id: string;
  actorId: string;
  kind: ActorMemoryKind;
  intensity: number;
  sourceEventId: string;
  createdDecisionIndex: number;
  targetActorId?: string;
  targetPartyId?: string;
  topic?: PoliticalTopic;
  active: boolean;
}

export interface ActorState {
  id: string;
  identityKind: ActorIdentityKind;
  displayName: string;
  partyId: string;
  role: ActorRole;
  ideology: IdeologyVector;
  traits: CandidateTraits;
  legitimacy: number;
  ambition: number;
  loyalty: number;
  mediaSkill: number;
  governingCredibility: number;
  scandalRisk: number;
  active: boolean;
  candidateStatus: CandidateStatus;
  strategy: OpponentStrategy;
  memory: ActorMemory;
}

export interface PlayerCandidate {
  id: string;
  displayName: string;
  identityKind: "fictional";
  archetype: string;
  traits: CandidateTraits;
}

export interface ElectorateBlocDefinition {
  id: ElectorateBlocId;
  label: string;
  shortLabel: string;
  weight: number;
  ideology: IdeologyVector;
  priorities: Array<"economy" | "social" | "security" | "ecology" | "europe" | "services">;
  volatility: number;
  turnout: number;
  usefulVoteSensitivity: number;
  regionalAffinity: Partial<Record<RegionId, number>>;
}

export interface ElectorateState {
  latentSupport: Record<ElectorateBlocId, Record<string, number>>;
  turnoutByBloc: Record<ElectorateBlocId, number>;
  undecidedByBloc: Record<ElectorateBlocId, number>;
  trustModifiers: Record<ElectorateBlocId, Record<string, number>>;
}

export interface WorldState {
  economicClimate: number;
  socialTension: number;
  securityConcern: number;
  climateConcern: number;
  incumbentFatigue: number;
  turnoutMood: number;
  dominantTheme: "economy" | "social" | "security" | "ecology" | "europe" | "services";
}

export interface RngState {
  seedHash: number;
  state: number;
  draws: number;
}

export type Condition =
  | { kind: "phase"; values: GamePhase[] }
  | { kind: "decision_min"; value: number }
  | { kind: "decision_max"; value: number }
  | { kind: "party_stat"; stat: keyof PartyStats; operator: "gte" | "lte"; value: number }
  | { kind: "trait"; trait: TraitKey; operator: "gte" | "lte"; value: number }
  | { kind: "flag"; key: string; equals: boolean | number | string }
  | { kind: "not_flag"; key: string }
  | { kind: "player_party"; partyIds: string[] }
  | { kind: "qualified"; value: boolean }
  | { kind: "game_mode"; values: GameMode[] }
  | { kind: "ideology"; axis: IdeologyAxis; operator: "gte" | "lte"; value: number }
  | { kind: "ideology_family"; values: IdeologyFamily[] }
  | { kind: "statement_exists"; topic: PoliticalTopic; value: boolean }
  | { kind: "contradiction_count"; operator: "gte" | "lte"; value: number }
  | {
      kind: "actor_memory";
      actorId: string;
      memory: ActorMemoryKind;
      minimumIntensity?: number;
    }
  | {
      kind: "party_relation";
      partyId: string;
      operator: "gte" | "lte";
      value: number;
    };

export type ModifierSource =
  | "party_stat"
  | "trait"
  | "world"
  | "flag"
  | "phase"
  | "history"
  | "ideology"
  | "statement"
  | "actor_memory"
  | "party_relation"
  | "electorate"
  | "consistency";

export interface ProbabilityModifier {
  source: ModifierSource;
  key: string;
  coefficient: number;
  expected?: boolean | number | string;
}

export type EffectVisibility = "visible" | "hidden";

export type GameEffect =
  | {
      kind: "party_stat";
      stat: keyof PartyStats;
      delta: number;
      target?: "player" | string;
      visibility?: EffectVisibility;
      label?: string;
    }
  | {
      kind: "hidden_stat";
      stat: keyof HiddenPartyStats;
      delta: number;
      target?: "player" | string;
      visibility?: EffectVisibility;
      label?: string;
    }
  | {
      kind: "trait";
      trait: TraitKey;
      delta: number;
      visibility?: EffectVisibility;
      label?: string;
    }
  | {
      kind: "ideology";
      axis: IdeologyAxis;
      delta: number;
      visibility?: EffectVisibility;
      label?: string;
    }
  | {
      kind: "world";
      stat: Exclude<keyof WorldState, "dominantTheme">;
      delta: number;
      visibility?: EffectVisibility;
      label?: string;
    }
  | {
      kind: "bloc_trust";
      blocId: ElectorateBlocId;
      delta: number;
      visibility?: EffectVisibility;
      label?: string;
    }
  | {
      kind: "flag";
      key: string;
      value: boolean | number | string;
      visibility?: EffectVisibility;
      label?: string;
    }
  | {
      kind: "candidate_status";
      actorId: string;
      status: CandidateStatus;
      visibility?: EffectVisibility;
      label?: string;
    }
  | {
      kind: "alliance";
      partyId: string;
      withPartyId: string;
      action: "add" | "remove";
      visibility?: EffectVisibility;
      label?: string;
    }
  | {
      kind: "party_split";
      partyId: string;
      actorId?: string;
      visibility?: EffectVisibility;
      label?: string;
    }
  | {
      kind: "actor_memory";
      actorId: string;
      memory: ActorMemoryKind;
      intensity: number;
      targetActorId?: string;
      targetPartyId?: string;
      topic?: PoliticalTopic;
      visibility?: EffectVisibility;
      label?: string;
    }
  | {
      kind: "party_relation";
      partyId: string;
      withPartyId: string;
      delta: number;
      visibility?: EffectVisibility;
      label?: string;
    }
  | {
      kind: "policy_position";
      topic: PoliticalTopic;
      stance: number;
      confidence?: number;
      visibility?: EffectVisibility;
      label?: string;
    }
  | {
      kind: "opponent_strategy";
      actorId: string;
      strategy: OpponentStrategy;
      visibility?: EffectVisibility;
      label?: string;
    };

export interface DelayedEffectDefinition {
  afterDecisions: number;
  effects: GameEffect[];
  narrative?: string;
}

export interface EventFollowUpDefinition {
  eventId: string;
  afterDecisions: number;
  probability: number;
  conditions?: Condition[];
}

export interface WeightedOutcome {
  id: string;
  baseWeight: number;
  modifiers: ProbabilityModifier[];
  title: string;
  publicNarrative: string;
  effects: GameEffect[];
  delayedEffects?: DelayedEffectDefinition[];
  setFlags?: Record<string, boolean | number | string>;
  enqueueEventIds?: string[];
  followUps?: EventFollowUpDefinition[];
  endingTrigger?: string;
}

export interface EventChoice {
  id: string;
  label: string;
  visibleTag?: ChoiceTag;
  strategy?: ChoiceStrategy;
  outcomeGroups: WeightedOutcome[];
  immediatePublicHint?: string;
  statement?: {
    topic: string;
    policyTopic?: PoliticalTopic;
    text: string;
    stance?: number;
    ideology?: Partial<IdeologyVector>;
  };
}

export interface SensitiveContentMeta {
  tags: Array<"crime" | "corruption" | "fraud" | "health" | "addiction" | "family" | "violence">;
  actorIds: string[];
  treatment: "fictional_only" | "verified_context";
}

export interface GameEventDefinition {
  id: string;
  title: string;
  category: EventCategory;
  summary: string;
  themes?: PoliticalTopic[];
  importance?: EventImportance;
  phaseWeights: Partial<Record<GamePhase, number>>;
  rarity: EventRarity;
  baseWeight: number;
  minDecisionIndex?: number;
  maxDecisionIndex?: number;
  eligibleParties?: string[];
  eligibleIdeologyFamilies?: IdeologyFamily[];
  excludedParties?: string[];
  incompatibleEventIds?: string[];
  requiredTags?: string[];
  forbiddenFlags?: string[];
  eligibility: Condition[];
  cooldown: number;
  oncePerRun: boolean;
  maxAppearances?: number;
  entityReferences?: EntityReference[];
  editorialSensitivity?: EditorialSensitivity;
  chain?: {
    id: string;
    step: number;
    followsEventIds?: string[];
    minimumDelay?: number;
    maximumDelay?: number;
  };
  successConditions?: Condition[];
  failureConditions?: Condition[];
  worldImpact?: boolean;
  sensitiveContent?: SensitiveContentMeta;
  choices: EventChoice[];
  sourceMetadata?: SourceMetadata[];
}

export interface ScheduledEffect {
  id: string;
  dueDecisionIndex: number;
  sourceEventId: string;
  effects: GameEffect[];
  narrative?: string;
}

export interface ScheduledEvent {
  id: string;
  eventId: string;
  sourceEventId: string;
  dueDecisionIndex: number;
  probability: number;
  conditions: Condition[];
}

export type StatementEvolution =
  | "initial_position"
  | "gradual_evolution"
  | "coherent_compromise"
  | "strategic_repositioning"
  | "contradiction"
  | "abrupt_reversal";

export interface StatementRecord {
  decisionIndex: number;
  eventId: string;
  topic: string;
  policyTopic?: PoliticalTopic;
  text: string;
  stance?: number;
  evolution?: StatementEvolution;
  contradictionWithDecisionIndex?: number;
  ideology?: Partial<IdeologyVector>;
}

export interface PolicyPositionState {
  topic: PoliticalTopic;
  stance: number;
  confidence: number;
  firstDecisionIndex: number;
  lastDecisionIndex: number;
  changes: number;
}

export interface NarrativeThreadState {
  id: string;
  currentStep: number;
  status: "active" | "resolved" | "failed";
  startedAtDecisionIndex: number;
  lastEventId: string;
  history: string[];
}

export interface OpponentActionRecord {
  decisionIndex: number;
  date: string;
  actorId: string;
  partyId: string;
  kind:
    | "strategy"
    | "crisis"
    | "alliance"
    | "endorsement"
    | "withdrawal"
    | "replacement"
    | "primary"
    | "dissidence"
    | "rallying";
  summary: string;
}

export interface VisibleEffect {
  label: string;
  tone: "positive" | "negative" | "neutral";
}

export interface DecisionRecord {
  decisionIndex: number;
  date: string;
  eventId: string;
  eventTitle: string;
  eventCategory: EventCategory;
  choiceId: string;
  choiceLabel: string;
  choiceStrategy?: ChoiceStrategy;
  outcomeId: string;
  outcomeTitle: string;
  narrative: string;
  visibleEffects: VisibleEffect[];
  decisiveFactors?: string[];
  statementEvolution?: StatementEvolution;
  internalRoll: number;
  internalProbabilities: Record<string, number>;
}

export interface NewsItem {
  id: string;
  date: string;
  headline: string;
  body: string;
  tone: "positive" | "negative" | "neutral";
  partyId?: string;
}

export interface PollSnapshot {
  id: string;
  date: string;
  decisionIndex: number;
  instituteLabel: string;
  results: Record<string, number>;
  playerRank: number;
  playerTrend: number;
}

export interface RegionalResult {
  regionId: RegionId;
  winnerPartyId: string;
  results: Record<string, number>;
}

export interface ElectionRoundResult {
  round: 1 | 2;
  date: string;
  results: Record<string, number>;
  ranking: string[];
  regionalResults: RegionalResult[];
  turnout: number;
}

export interface ScoreBreakdown {
  electoralPerformance: number;
  progression: number;
  qualificationAndVictory: number;
  partyGrowth: number;
  consistency: number;
  legacy: number;
  specialAchievements: number;
}

export interface FinalResult {
  endingId: string;
  title: string;
  narrative: string;
  score: number;
  breakdown: ScoreBreakdown;
  firstRound: ElectionRoundResult;
  secondRound?: ElectionRoundResult;
  playerRank: number;
  finalVoteShare: number;
  won: boolean;
  qualified: boolean;
  startingPolling: number;
  pollingProgression: number;
  strongestRegions: RegionId[];
  highlightDecisionIds: number[];
  bestDecisionIndex?: number;
  costliestDecisionIndex?: number;
  rivalPartyId: string;
  unlockedAchievementIds: string[];
}

export interface GameState {
  version: number;
  runId: string;
  runInstanceId: string;
  seed: string;
  rng: RngState;
  mode: GameMode;
  phase: GamePhase;
  currentDate: string;
  electionDate: string;
  decisionIndex: number;
  maxTargetDecisions: number;
  player: PlayerCandidate;
  playerPartyId: string;
  parties: Record<string, PartyState>;
  actors: Record<string, ActorState>;
  electorate: ElectorateState;
  world: WorldState;
  pollHistory: PollSnapshot[];
  decisionHistory: DecisionRecord[];
  publicNews: NewsItem[];
  scheduledEffects: ScheduledEffect[];
  scheduledEvents: ScheduledEvent[];
  eventCooldowns: Record<string, number>;
  eventAppearanceCounts: Record<string, number>;
  seenEventIds: string[];
  queuedEventIds: string[];
  categoryCounts: Partial<Record<EventCategory, number>>;
  recentCategories: EventCategory[];
  currentEventId?: string;
  flags: Record<string, boolean | number | string>;
  statementLedger: StatementRecord[];
  policyPositions: Partial<Record<PoliticalTopic, PolicyPositionState>>;
  actorMemories: ActorMemoryEntry[];
  partyRelations: Record<string, Record<string, number>>;
  narrativeThreads: Record<string, NarrativeThreadState>;
  opponentActions: OpponentActionRecord[];
  achievementsUnlocked: string[];
  firstRoundResult?: ElectionRoundResult;
  secondRoundResult?: ElectionRoundResult;
  qualifiedPartyIds?: [string, string];
  endingId?: string;
  finalResult?: FinalResult;
}

export interface CampaignMethod {
  id: string;
  title: string;
  description: string;
  symbol: string;
  effects: GameEffect[];
  traitEffects: Partial<CandidateTraits>;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category:
    | "first_campaigns"
    | "wins"
    | "party"
    | "communication"
    | "ideology"
    | "alliances"
    | "records"
    | "secret_endings";
  icon: string;
  secret?: boolean;
  criteria?: {
    mode: "all" | "any";
    conditions: AchievementCriterion[];
  };
}

export type AchievementMetric =
  | "campaign_completed"
  | "won"
  | "qualified"
  | "party_id"
  | "game_mode"
  | "ending_id"
  | "score"
  | "first_round_score"
  | "second_round_score"
  | "polling_progression"
  | "starting_polling"
  | "final_rank"
  | "decisions"
  | "positive_outcomes"
  | "scandals"
  | "statement_topics"
  | "contradictions"
  | "alliances"
  | "actor_memories"
  | "members"
  | "party_stat"
  | "hidden_stat"
  | "choice_strategy";

export interface AchievementCriterion {
  metric: AchievementMetric;
  operator: "eq" | "gte" | "lte" | "contains";
  value: boolean | number | string;
  key?: string;
}

export interface EndingDefinition {
  id: string;
  title: string;
  narrative: string;
  secret?: boolean;
}

export interface CompletedRunSummary {
  id: string;
  version: number;
  completedAt: string;
  seed: string;
  mode: GameMode;
  candidateName: string;
  partyId: string;
  partyName: string;
  partyShortName: string;
  partyVisual: PartyVisual;
  score: number;
  resultTitle: string;
  finalVoteShare: number;
  won: boolean;
  badges: string[];
  bestFeat: string;
  finalResult: FinalResult;
  pollHistory: PollSnapshot[];
  decisions: DecisionRecord[];
}

export interface GameContent {
  contentVersion?: 1 | 2;
  parties: PartyDefinition[];
  actors: ActorState[];
  electorateBlocs: ElectorateBlocDefinition[];
  events: GameEventDefinition[];
  methods: CampaignMethod[];
  achievements: AchievementDefinition[];
  endings: EndingDefinition[];
  entities?: EntityDefinition[];
}

export interface RealPartySnapshot {
  id: string;
  displayName: string;
  aliases: string[];
  officialWebsite: string;
  reviewedAt: string;
  status: "verified" | "NEEDS_EDITORIAL_REVIEW";
}

export interface RealPublicFigureSnapshot {
  id: string;
  displayName: string;
  role: string;
  sourceMetadata: SourceMetadata[];
  status: "verified" | "NEEDS_EDITORIAL_REVIEW";
}

export interface RealWorldSnapshot {
  snapshotDate: string;
  lastEditorialReviewAt: string;
  electionDateStatus: "configured" | "official" | "unknown";
  parties: RealPartySnapshot[];
  publicFigures: RealPublicFigureSnapshot[];
  sourceMetadata: SourceMetadata[];
  editorialNotes: string[];
}

export interface NewGameOptions {
  seed: string;
  mode: GameMode;
  partyId: string;
  methodId: string;
  candidateName?: string;
  customParty?: PartyDefinition;
  electionDate?: string;
  runInstanceId?: string;
}

export interface ChoiceResolution {
  state: GameState;
  record: DecisionRecord;
  outcome: WeightedOutcome;
}
