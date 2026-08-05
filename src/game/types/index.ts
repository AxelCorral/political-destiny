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
  sourceMetadata?: SourceMetadata[];
}

export interface PartyState {
  id: string;
  displayName: string;
  shortName: string;
  visual: PartyVisual;
  ideology: IdeologyVector;
  perceivedIdeology: IdeologyVector;
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
  | { kind: "qualified"; value: boolean };

export type ModifierSource = "party_stat" | "trait" | "world" | "flag" | "phase" | "history";

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
    };

export interface DelayedEffectDefinition {
  afterDecisions: number;
  effects: GameEffect[];
  narrative?: string;
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
  endingTrigger?: string;
}

export interface EventChoice {
  id: string;
  label: string;
  visibleTag?: ChoiceTag;
  outcomeGroups: WeightedOutcome[];
  immediatePublicHint?: string;
  statement?: {
    topic: string;
    text: string;
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
  phaseWeights: Partial<Record<GamePhase, number>>;
  rarity: EventRarity;
  baseWeight: number;
  minDecisionIndex?: number;
  maxDecisionIndex?: number;
  eligibleParties?: string[];
  excludedParties?: string[];
  requiredTags?: string[];
  forbiddenFlags?: string[];
  eligibility: Condition[];
  cooldown: number;
  oncePerRun: boolean;
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

export interface StatementRecord {
  decisionIndex: number;
  eventId: string;
  topic: string;
  text: string;
  ideology?: Partial<IdeologyVector>;
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
  outcomeId: string;
  outcomeTitle: string;
  narrative: string;
  visibleEffects: VisibleEffect[];
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
  eventCooldowns: Record<string, number>;
  seenEventIds: string[];
  queuedEventIds: string[];
  categoryCounts: Partial<Record<EventCategory, number>>;
  recentCategories: EventCategory[];
  currentEventId?: string;
  flags: Record<string, boolean | number | string>;
  statementLedger: StatementRecord[];
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
  parties: PartyDefinition[];
  actors: ActorState[];
  electorateBlocs: ElectorateBlocDefinition[];
  events: GameEventDefinition[];
  methods: CampaignMethod[];
  achievements: AchievementDefinition[];
  endings: EndingDefinition[];
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
}

export interface ChoiceResolution {
  state: GameState;
  record: DecisionRecord;
  outcome: WeightedOutcome;
}
