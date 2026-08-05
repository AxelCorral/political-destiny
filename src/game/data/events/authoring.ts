import type {
  ChoiceStrategy,
  ChoiceTag,
  EventChoice,
  GameEffect,
  GameEventDefinition,
  ProbabilityModifier,
  WeightedOutcome,
} from "@/game/types";

export interface AuthoredOutcomeInput {
  id: string;
  weight?: number;
  title: string;
  narrative: string;
  effects: GameEffect[];
  modifiers?: ProbabilityModifier[];
  delayedEffects?: WeightedOutcome["delayedEffects"];
  setFlags?: WeightedOutcome["setFlags"];
  enqueueEventIds?: string[];
  followUps?: WeightedOutcome["followUps"];
}

export function authoredOutcome(input: AuthoredOutcomeInput): WeightedOutcome {
  return {
    id: input.id,
    baseWeight: input.weight ?? 1,
    modifiers: structuredClone(input.modifiers ?? []),
    title: input.title,
    publicNarrative: input.narrative,
    effects: structuredClone(input.effects),
    ...(input.delayedEffects ? { delayedEffects: structuredClone(input.delayedEffects) } : {}),
    ...(input.setFlags ? { setFlags: structuredClone(input.setFlags) } : {}),
    ...(input.enqueueEventIds ? { enqueueEventIds: [...input.enqueueEventIds] } : {}),
    ...(input.followUps ? { followUps: structuredClone(input.followUps) } : {}),
  };
}

export function authoredChoice(choice: EventChoice): EventChoice {
  return structuredClone(choice);
}

export interface AuthoredChoiceInput {
  id: string;
  label: string;
  tag?: ChoiceTag;
  strategy: ChoiceStrategy;
  hint?: string;
  statement?: EventChoice["statement"];
  outcomes: AuthoredOutcomeInput[];
}

export function choice(input: AuthoredChoiceInput): EventChoice {
  return {
    id: input.id,
    label: input.label,
    strategy: input.strategy,
    ...(input.tag ? { visibleTag: input.tag } : {}),
    ...(input.hint ? { immediatePublicHint: input.hint } : {}),
    ...(input.statement ? { statement: structuredClone(input.statement) } : {}),
    outcomeGroups: input.outcomes.map(authoredOutcome),
  };
}

export function outcome(
  id: string,
  title: string,
  narrative: string,
  effects: GameEffect[],
  options: Omit<AuthoredOutcomeInput, "id" | "title" | "narrative" | "effects"> = {},
): AuthoredOutcomeInput {
  return { id, title, narrative, effects, ...options };
}

export function stat(
  statName: Extract<GameEffect, { kind: "party_stat" }>["stat"],
  delta: number,
  label: string,
  visibility: "visible" | "hidden" = "visible",
): GameEffect {
  return { kind: "party_stat", stat: statName, delta, label, visibility };
}

export function hidden(
  statName: Extract<GameEffect, { kind: "hidden_stat" }>["stat"],
  delta: number,
): GameEffect {
  return { kind: "hidden_stat", stat: statName, delta, visibility: "hidden" };
}

export function trait(
  traitName: Extract<GameEffect, { kind: "trait" }>["trait"],
  delta: number,
  label?: string,
): GameEffect {
  return { kind: "trait", trait: traitName, delta, ...(label ? { label } : {}) };
}

export function ideology(
  axis: Extract<GameEffect, { kind: "ideology" }>["axis"],
  delta: number,
  label?: string,
): GameEffect {
  return { kind: "ideology", axis, delta, ...(label ? { label } : {}) };
}

export function bloc(
  blocId: Extract<GameEffect, { kind: "bloc_trust" }>["blocId"],
  delta: number,
  label?: string,
): GameEffect {
  return { kind: "bloc_trust", blocId, delta, ...(label ? { label } : {}) };
}

export function memory(
  actorId: string,
  memoryKind: Extract<GameEffect, { kind: "actor_memory" }>["memory"],
  intensity: number,
  options: Omit<
    Extract<GameEffect, { kind: "actor_memory" }>,
    "kind" | "actorId" | "memory" | "intensity"
  > = {},
): GameEffect {
  return { kind: "actor_memory", actorId, memory: memoryKind, intensity, ...options };
}

export function relation(
  partyId: string,
  withPartyId: string,
  delta: number,
  label?: string,
): GameEffect {
  return { kind: "party_relation", partyId, withPartyId, delta, ...(label ? { label } : {}) };
}

export function alliance(
  withPartyId: string,
  action: "add" | "remove",
  label?: string,
): GameEffect {
  return { kind: "alliance", partyId: "player", withPartyId, action, ...(label ? { label } : {}) };
}

export function flag(key: string, value: boolean | number | string, label?: string): GameEffect {
  return { kind: "flag", key, value, ...(label ? { label } : {}) };
}

export function candidateStatus(
  actorId: string,
  status: Extract<GameEffect, { kind: "candidate_status" }>["status"],
  label?: string,
): GameEffect {
  return { kind: "candidate_status", actorId, status, ...(label ? { label } : {}) };
}

export function partySplit(partyId: string, actorId?: string, label?: string): GameEffect {
  return {
    kind: "party_split",
    partyId,
    ...(actorId ? { actorId } : {}),
    ...(label ? { label } : {}),
  };
}

export function policyPosition(
  topic: Extract<GameEffect, { kind: "policy_position" }>["topic"],
  stance: number,
  confidence?: number,
  label?: string,
): GameEffect {
  return {
    kind: "policy_position",
    topic,
    stance,
    ...(confidence !== undefined ? { confidence } : {}),
    ...(label ? { label } : {}),
  };
}

export function opponentStrategy(
  actorId: string,
  strategy: Extract<GameEffect, { kind: "opponent_strategy" }>["strategy"],
  label?: string,
): GameEffect {
  return { kind: "opponent_strategy", actorId, strategy, ...(label ? { label } : {}) };
}

export function world(
  statName: Extract<GameEffect, { kind: "world" }>["stat"],
  delta: number,
  label?: string,
): GameEffect {
  return { kind: "world", stat: statName, delta, ...(label ? { label } : {}) };
}

export interface SingleOutcomeChoiceInput extends Omit<AuthoredChoiceInput, "outcomes"> {
  result: AuthoredOutcomeInput;
}

/**
 * Compact authoring helper for a decision with one certain resolution. It never writes prose:
 * every player-facing sentence remains explicit at the call site.
 */
export function decision(input: SingleOutcomeChoiceInput): EventChoice {
  return choice({ ...input, outcomes: [input.result] });
}

export function directChoice(
  id: string,
  label: string,
  strategy: ChoiceStrategy,
  tag: ChoiceTag | undefined,
  outcomeId: string,
  title: string,
  narrative: string,
  effects: GameEffect[],
  options: {
    hint?: string;
    statement?: EventChoice["statement"];
    outcome?: Omit<AuthoredOutcomeInput, "id" | "title" | "narrative" | "effects">;
  } = {},
): EventChoice {
  return decision({
    id,
    label,
    strategy,
    ...(tag ? { tag } : {}),
    ...(options.hint ? { hint: options.hint } : {}),
    ...(options.statement ? { statement: options.statement } : {}),
    result: outcome(outcomeId, title, narrative, effects, options.outcome),
  });
}

export function authoredEvent(event: GameEventDefinition): GameEventDefinition {
  return structuredClone(event);
}

export type AuthoredEventInput = Omit<
  GameEventDefinition,
  "rarity" | "baseWeight" | "eligibility" | "cooldown" | "oncePerRun"
> & {
  rarity?: GameEventDefinition["rarity"];
  baseWeight?: number;
  eligibility?: GameEventDefinition["eligibility"];
  cooldown?: number;
  oncePerRun?: boolean;
};

export function event(input: AuthoredEventInput): GameEventDefinition {
  return {
    ...structuredClone(input),
    rarity: input.rarity ?? "common",
    baseWeight: input.baseWeight ?? 1,
    eligibility: structuredClone(input.eligibility ?? []),
    cooldown: input.cooldown ?? 8,
    oncePerRun: input.oncePerRun ?? true,
  };
}
