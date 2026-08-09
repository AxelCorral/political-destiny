import type {
  GameEffect,
  GameState,
  PartyState,
  ScheduledEffect,
  VisibleEffect,
} from "@/game/types";

import {
  humanizeInternalKey,
  IDEOLOGY_AXIS_LABELS,
  PRIMARY_STAT_LABELS,
  SECONDARY_STAT_LABELS,
  TRAIT_LABELS,
  WORLD_STAT_LABELS,
} from "./internalKeyLabels";
import { clamp } from "./math";
import { applyPartySplit } from "./partyDynamics";

function statLabel(stat: string): string {
  return PRIMARY_STAT_LABELS[stat] ?? SECONDARY_STAT_LABELS[stat] ?? humanizeInternalKey(stat);
}

/**
 * Below this fraction of a stat's ceiling, positive party_stat effects apply
 * at full strength. Above it, gains taper linearly to zero at the ceiling.
 * Setbacks (delta <= 0) are never tapered — losing ground stays as easy as
 * the content defines it, only climbing gets harder near the top.
 *
 * Diagnosed for P1 (see POST_AUDIT_FIXES.md): with a flat clamp, most agents
 * drove credibility to ~99-100 within a normal campaign regardless of
 * strategy (the catalog's credibility effects are overwhelmingly positive),
 * which erased the stat's ability to differentiate agent behavior — it fed
 * into partyAppeal()'s competence term as a near-constant across every run,
 * leaving the party's fixed baseSupport as the dominant source of variance.
 */
const DIMINISHING_RETURNS_THRESHOLD_RATIO = 0.75;

function scaledPositiveDelta(current: number, delta: number, maximum: number): number {
  if (delta <= 0 || current >= maximum) return delta <= 0 ? delta : 0;
  const threshold = maximum * DIMINISHING_RETURNS_THRESHOLD_RATIO;
  if (current <= threshold) return delta;
  const remaining = maximum - current;
  const taperRange = maximum - threshold;
  return delta * clamp(remaining / taperRange, 0, 1) ** 1.3;
}

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
      return `${statLabel(effect.stat)} ${effect.delta >= 0 ? "+" : ""}${effect.delta}`;
    case "hidden_stat":
      return "La campagne évolue en profondeur";
    case "trait":
      return `${TRAIT_LABELS[effect.trait] ?? humanizeInternalKey(effect.trait)} ${effect.delta >= 0 ? "+" : ""}${effect.delta}`;
    case "ideology":
      return `Positionnement ${IDEOLOGY_AXIS_LABELS[effect.axis] ?? humanizeInternalKey(effect.axis)} ajusté`;
    case "world":
      return `Le contexte évolue : ${WORLD_STAT_LABELS[effect.stat] ?? humanizeInternalKey(effect.stat)}`;
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
    case "actor_memory":
      return "Cette relation politique gardera une trace de votre décision";
    case "party_relation":
      return effect.delta >= 0
        ? "Le dialogue entre les deux camps progresse"
        : "Les deux camps s’éloignent";
    case "policy_position":
      return "Votre ligne politique se précise";
    case "opponent_strategy":
      return "Un adversaire adapte sa stratégie";
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
  if (effect.kind === "actor_memory") {
    return ["trust", "political_debt", "support", "promise", "rallying"].includes(effect.memory)
      ? "positive"
      : "negative";
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
      const appliedDelta =
        effect.stat === "members"
          ? effect.delta
          : scaledPositiveDelta(current, effect.delta, maximum);
      party.stats[effect.stat] = clamp(current + appliedDelta, 0, maximum);
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
      const party = state.parties[actor.partyId];
      if (party?.candidateId === actor.id) party.active = actor.active;
      return;
    }
    case "alliance": {
      const partyId = effect.partyId === "player" ? state.playerPartyId : effect.partyId;
      const partnerId = effect.withPartyId === "player" ? state.playerPartyId : effect.withPartyId;
      const party = state.parties[partyId];
      const partner = state.parties[partnerId];
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
    case "party_split": {
      const partyId = effect.partyId === "player" ? state.playerPartyId : effect.partyId;
      applyPartySplit(state, partyId, effect.actorId);
      return;
    }
    case "actor_memory": {
      const actorId = effect.actorId === "player" ? state.player.id : effect.actorId;
      const actor = state.actors[actorId];
      if (!actor) return;
      const memory = {
        id: `memory-${actorId}-${state.decisionIndex}-${state.actorMemories.length}`,
        actorId,
        kind: effect.memory,
        intensity: clamp(effect.intensity, -100, 100),
        sourceEventId: state.currentEventId ?? "system",
        createdDecisionIndex: state.decisionIndex,
        ...(effect.targetActorId ? { targetActorId: effect.targetActorId } : {}),
        ...(effect.targetPartyId ? { targetPartyId: effect.targetPartyId } : {}),
        ...(effect.topic ? { topic: effect.topic } : {}),
        active: true,
      } as const;
      state.actorMemories.push(memory);
      actor.memory.entries ??= [];
      actor.memory.entries.push(structuredClone(memory));
      return;
    }
    case "party_relation": {
      const partyId = effect.partyId === "player" ? state.playerPartyId : effect.partyId;
      const partnerId = effect.withPartyId === "player" ? state.playerPartyId : effect.withPartyId;
      if (!state.parties[partyId] || !state.parties[partnerId] || partyId === partnerId) return;
      state.partyRelations[partyId] ??= {};
      state.partyRelations[partnerId] ??= {};
      const next = clamp((state.partyRelations[partyId][partnerId] ?? 0) + effect.delta, -100, 100);
      state.partyRelations[partyId][partnerId] = next;
      state.partyRelations[partnerId][partyId] = next;
      return;
    }
    case "policy_position": {
      const current = state.policyPositions[effect.topic];
      state.policyPositions[effect.topic] = current
        ? {
            ...current,
            stance: clamp(effect.stance, -100, 100),
            confidence: clamp(effect.confidence ?? current.confidence),
            lastDecisionIndex: state.decisionIndex,
            changes: current.changes + Number(Math.abs(current.stance - effect.stance) >= 8),
          }
        : {
            topic: effect.topic,
            stance: clamp(effect.stance, -100, 100),
            confidence: clamp(effect.confidence ?? 60),
            firstDecisionIndex: state.decisionIndex,
            lastDecisionIndex: state.decisionIndex,
            changes: 0,
          };
      return;
    }
    case "opponent_strategy": {
      const actor = state.actors[effect.actorId];
      if (actor && actor.id !== state.player.id) actor.strategy = effect.strategy;
      return;
    }
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
