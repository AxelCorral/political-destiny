import type {
  EventFollowUpDefinition,
  GameEventDefinition,
  GameState,
  ScheduledEvent,
} from "@/game/types";

import { allConditionsMatch } from "./conditions";
import { random } from "./rng";

export function scheduleEventFollowUps(
  sourceState: GameState,
  sourceEventId: string,
  followUps: EventFollowUpDefinition[],
): GameState {
  const state = structuredClone(sourceState);
  for (const [index, followUp] of followUps.entries()) {
    const scheduled: ScheduledEvent = {
      id: `follow-up-${sourceEventId}-${state.decisionIndex}-${index}`,
      eventId: followUp.eventId,
      sourceEventId,
      dueDecisionIndex: state.decisionIndex + Math.max(1, followUp.afterDecisions),
      probability: Math.max(0, Math.min(1, followUp.probability)),
      conditions: structuredClone(followUp.conditions ?? []),
    };
    state.scheduledEvents.push(scheduled);
  }
  return state;
}

export function releaseDueScheduledEvents(sourceState: GameState): GameState {
  const state = structuredClone(sourceState);
  const due = state.scheduledEvents.filter(
    (scheduled) => scheduled.dueDecisionIndex <= state.decisionIndex,
  );
  state.scheduledEvents = state.scheduledEvents.filter(
    (scheduled) => scheduled.dueDecisionIndex > state.decisionIndex,
  );
  for (const scheduled of due) {
    if (!allConditionsMatch(state, scheduled.conditions)) continue;
    let roll: number;
    [roll, state.rng] = random(state.rng);
    if (roll <= scheduled.probability && !state.queuedEventIds.includes(scheduled.eventId))
      state.queuedEventIds.push(scheduled.eventId);
  }
  return state;
}

export function narrativeChainMatches(state: GameState, event: GameEventDefinition): boolean {
  const chain = event.chain;
  if (!chain?.followsEventIds?.length) return true;
  const predecessor = [...state.decisionHistory]
    .reverse()
    .find((record) => chain.followsEventIds?.includes(record.eventId));
  if (!predecessor) return false;
  const elapsed = state.decisionIndex - predecessor.decisionIndex;
  if (chain.minimumDelay !== undefined && elapsed < chain.minimumDelay) return false;
  if (chain.maximumDelay !== undefined && elapsed > chain.maximumDelay) return false;
  return true;
}

export function recordNarrativeProgress(
  sourceState: GameState,
  event: GameEventDefinition,
  allEvents: GameEventDefinition[],
): GameState {
  if (!event.chain) return sourceState;
  const state = structuredClone(sourceState);
  const current = state.narrativeThreads[event.chain.id];
  const maximumStep = Math.max(
    ...allEvents
      .filter((candidate) => candidate.chain?.id === event.chain?.id)
      .map((candidate) => candidate.chain?.step ?? 0),
  );
  state.narrativeThreads[event.chain.id] = current
    ? {
        ...current,
        currentStep: Math.max(current.currentStep, event.chain.step),
        status: event.chain.step >= maximumStep ? "resolved" : "active",
        lastEventId: event.id,
        history: [...current.history, event.id],
      }
    : {
        id: event.chain.id,
        currentStep: event.chain.step,
        status: event.chain.step >= maximumStep ? "resolved" : "active",
        startedAtDecisionIndex: state.decisionIndex,
        lastEventId: event.id,
        history: [event.id],
      };
  return state;
}
