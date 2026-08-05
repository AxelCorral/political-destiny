import type {
  GameEffect,
  GameState,
  PartyState,
  ScheduledEffect,
  VisibleEffect,
} from "@/game/types";

import { clamp } from "./math";
import { applyPartySplit } from "./partyDynamics";

function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

function getTargetParty(state: GameState, target?: "player" | string): PartyState | undefined {
  const partyId = !target || target === "player" ? state.playerPartyId : target;
  return state.parties[partyId];
}

function defaultLabel(effect: GameEffect): string {
  switch (effect.kind) {
    case "party_stat":
      return `${effect.stat} ${effect.delta >= 0 ? "+" : ""}${effect.delta}`;
    case "hidden_stat":
      return "La campagne évolue en profondeur";
    case "trait":
      return `${effect.trait} ${effect.delta >= 0 ? "+" : ""}${effect.delta}`;
    case "ideology":
      return `Position ${effect.axis} ajustée`;
    case "world":
      return `Contexte ${effect.stat} modifié`;
    case "bloc_trust":
      return `Confiance d’un électorat ${effect.delta >= 0 ? "renforcée" : "fragilisée"}`;
    case "flag":
      return "Une conséquence durable est enregistrée";
    case "candidate_status":
      return "La course change de visage";
    case "alliance":
      return effect.action === "add" ? "Une alliance prend forme" : "Une alliance se brise";
    case "party_split":
      return "Une dissidence quitte le mouvement";
    default: {
      const exhaustive: never = effect;
      return exhaustive;
    }
  }
}

function effectTone(effect: GameEffect): VisibleEffect["tone"] {
  if ("delta" in effect)
    return effect.delta > 0 ? "positive" : effect.delta < 0 ? "negative" : "neutral";
  if (effect.kind === "alliance") return effect.action === "add" ? "positive" : "negative";
  if (effect.kind === "party_split") return "negative";
  if (effect.kind === "candidate_status") {
    return effect.status === "official" ? "positive" : "negative";
  }
  return "neutral";
}

function applyOneEffect(state: GameState, effect: GameEffect): void {
  switch (effect.kind) {
    case "party_stat": {
      const party = getTargetParty(state, effect.target);
      if (!party) return;
      const current = party.stats[effect.stat];
      const maximum = effect.stat === "members" ? 5_000_000 : 100;
      party.stats[effect.stat] = clamp(current + effect.delta, 0, maximum);
      return;
    }
    case "hidden_stat": {
      const party = getTargetParty(state, effect.target);
      if (!party) return;
      party.hidden[effect.stat] = clamp(party.hidden[effect.stat] + effect.delta);
      return;
    }
    case "trait":
      state.player.traits[effect.trait] = clamp(state.player.traits[effect.trait] + effect.delta);
      return;
    case "ideology": {
      const party = state.parties[state.playerPartyId];
      if (!party) return;
      party.ideology[effect.axis] = clamp(party.ideology[effect.axis] + effect.delta, -100, 100);
      party.perceivedIdeology[effect.axis] = clamp(
        party.perceivedIdeology[effect.axis] + effect.delta * 0.8,
        -100,
        100,
      );
      return;
    }
    case "world":
      state.world[effect.stat] = clamp(state.world[effect.stat] + effect.delta);
      return;
    case "bloc_trust": {
      const bloc = state.electorate.trustModifiers[effect.blocId];
      if (!bloc) return;
      bloc[state.playerPartyId] = clamp((bloc[state.playerPartyId] ?? 0) + effect.delta, -40, 40);
      return;
    }
    case "flag":
      state.flags[effect.key] = effect.value;
      return;
    case "candidate_status": {
      const actor = state.actors[effect.actorId];
      if (!actor) return;
      actor.candidateStatus = effect.status;
      actor.active = !["withdrawn", "disqualified", "eliminated"].includes(effect.status);
      return;
    }
    case "alliance": {
      const party = state.parties[effect.partyId];
      const partner = state.parties[effect.withPartyId];
      if (!party || !partner || party.id === partner.id) return;
      if (effect.action === "add") {
        if (!party.alliedWith.includes(partner.id)) party.alliedWith.push(partner.id);
        if (!partner.alliedWith.includes(party.id)) partner.alliedWith.push(party.id);
      } else {
        party.alliedWith = party.alliedWith.filter((id) => id !== partner.id);
        partner.alliedWith = partner.alliedWith.filter((id) => id !== party.id);
      }
      return;
    }
    case "party_split":
      applyPartySplit(state, effect.partyId, effect.actorId);
      return;
    default: {
      const exhaustive: never = effect;
      return exhaustive;
    }
  }
}

export function applyEffects(
  sourceState: GameState,
  effects: GameEffect[],
): { state: GameState; visibleEffects: VisibleEffect[] } {
  const state = cloneState(sourceState);
  const visibleEffects: VisibleEffect[] = [];

  for (const effect of effects) {
    applyOneEffect(state, effect);
    if (effect.visibility !== "hidden") {
      visibleEffects.push({
        label: effect.label ?? defaultLabel(effect),
        tone: effectTone(effect),
      });
    }
  }
  return { state, visibleEffects };
}

export function scheduleEffects(
  sourceState: GameState,
  sourceEventId: string,
  delayedEffects: Array<{ afterDecisions: number; effects: GameEffect[]; narrative?: string }>,
): GameState {
  const state = cloneState(sourceState);
  for (const [index, delayed] of delayedEffects.entries()) {
    const scheduled: ScheduledEffect = {
      id: `${sourceEventId}-${state.decisionIndex}-${index}`,
      dueDecisionIndex: state.decisionIndex + Math.max(1, delayed.afterDecisions),
      sourceEventId,
      effects: delayed.effects,
      ...(delayed.narrative ? { narrative: delayed.narrative } : {}),
    };
    state.scheduledEffects.push(scheduled);
  }
  return state;
}

export function applyDueEffects(sourceState: GameState): {
  state: GameState;
  visibleEffects: VisibleEffect[];
  narratives: string[];
} {
  const due = sourceState.scheduledEffects.filter(
    (scheduled) => scheduled.dueDecisionIndex <= sourceState.decisionIndex,
  );
  let state = cloneState(sourceState);
  state.scheduledEffects = state.scheduledEffects.filter(
    (scheduled) => scheduled.dueDecisionIndex > state.decisionIndex,
  );
  const visibleEffects: VisibleEffect[] = [];
  const narratives: string[] = [];

  for (const scheduled of due) {
    const applied = applyEffects(state, scheduled.effects);
    state = applied.state;
    visibleEffects.push(...applied.visibleEffects);
    if (scheduled.narrative) narratives.push(scheduled.narrative);
  }
  return { state, visibleEffects, narratives };
}
