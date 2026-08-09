import type {
  EventChoice,
  GameEventDefinition,
  GameState,
  ProbabilityModifier,
  WeightedOutcome,
} from "@/game/types";

import {
  humanizeInternalKey,
  IDEOLOGY_AXIS_LABELS,
  PRIMARY_STAT_LABELS,
  SECONDARY_STAT_LABELS,
  TRAIT_LABELS,
  WORLD_STAT_LABELS,
} from "./internalKeyLabels";
import { softmax } from "./math";
import { random } from "./rng";

function modifierValue(state: GameState, modifier: ProbabilityModifier): number {
  const party = state.parties[state.playerPartyId];
  if (!party) return 0;

  switch (modifier.source) {
    case "party_stat": {
      const value = party.stats[modifier.key as keyof typeof party.stats];
      return typeof value === "number" ? (value - 50) / 50 : 0;
    }
    case "trait": {
      const value = state.player.traits[modifier.key as keyof typeof state.player.traits];
      return typeof value === "number" ? (value - 50) / 50 : 0;
    }
    case "world": {
      const value = state.world[modifier.key as keyof typeof state.world];
      return typeof value === "number" ? (value - 50) / 50 : 0;
    }
    case "flag":
      return state.flags[modifier.key] === modifier.expected ? 1 : -0.35;
    case "phase":
      return state.phase === modifier.key ? 1 : 0;
    case "history":
      return state.decisionHistory.some(
        (record) => record.eventId === modifier.key || record.eventCategory === modifier.key,
      )
        ? 1
        : 0;
    case "ideology": {
      const value = party.perceivedIdeology[modifier.key as keyof typeof party.perceivedIdeology];
      return typeof value === "number" ? value / 100 : 0;
    }
    case "statement":
      return state.statementLedger.some(
        (statement) => statement.policyTopic === modifier.key || statement.topic === modifier.key,
      )
        ? 1
        : -0.25;
    case "actor_memory": {
      const [actorId, memoryKind] = modifier.key.split(":");
      const intensity = state.actorMemories
        .filter(
          (memory) =>
            memory.active &&
            (!actorId || memory.actorId === actorId) &&
            (!memoryKind || memory.kind === memoryKind),
        )
        .reduce((sum, memory) => sum + memory.intensity, 0);
      return Math.max(-1, Math.min(1, intensity / 100));
    }
    case "party_relation":
      return (state.partyRelations[state.playerPartyId]?.[modifier.key] ?? 0) / 100;
    case "electorate":
      return (
        (state.electorate.trustModifiers[
          modifier.key as keyof typeof state.electorate.trustModifiers
        ]?.[state.playerPartyId] ?? 0) / 40
      );
    case "consistency":
      return (party.hidden.consistency - 50) / 50;
    default: {
      const exhaustive: never = modifier.source;
      return exhaustive;
    }
  }
}

/**
 * P3 (fun improvement mission, section 12) — `modifier.key` is a raw
 * internal identifier whose shape depends on `source`: for party_stat/
 * trait/world/ideology it's a camelCase stat/trait/axis key (never
 * underscored, so a plain `replaceAll("_", " ")` left it untouched — the
 * second, independent leak site found alongside effectProcessor.ts's
 * defaultLabel). Routed through the same tables used there; every other
 * source falls back to humanizeInternalKey's safe camelCase/snake_case
 * splitter.
 */
function humanizeKeyForSource(source: ProbabilityModifier["source"], key: string): string {
  switch (source) {
    case "party_stat":
      return PRIMARY_STAT_LABELS[key] ?? SECONDARY_STAT_LABELS[key] ?? humanizeInternalKey(key);
    case "trait":
      return TRAIT_LABELS[key] ?? humanizeInternalKey(key);
    case "world":
      return WORLD_STAT_LABELS[key] ?? humanizeInternalKey(key);
    case "ideology":
      return IDEOLOGY_AXIS_LABELS[key] ?? humanizeInternalKey(key);
    default:
      return humanizeInternalKey(key);
  }
}

function modifierLabel(modifier: ProbabilityModifier): string {
  const sourceLabels: Record<ProbabilityModifier["source"], string> = {
    party_stat: "État de campagne",
    trait: "Aptitude personnelle",
    world: "Contexte national",
    flag: "Décision antérieure",
    phase: "Moment de la campagne",
    history: "Historique de campagne",
    ideology: "Positionnement idéologique",
    statement: "Déclaration antérieure",
    actor_memory: "Mémoire d’un acteur",
    party_relation: "Relation entre partis",
    electorate: "Confiance de l’électorat",
    consistency: "Cohérence de la ligne",
  };
  const readableKey = humanizeKeyForSource(modifier.source, modifier.key);
  return `${sourceLabels[modifier.source]} · ${readableKey}`;
}

function decisiveFactors(state: GameState, outcome: WeightedOutcome): string[] {
  return outcome.modifiers
    .map((modifier) => ({
      label: modifierLabel(modifier),
      contribution: modifier.coefficient * modifierValue(state, modifier),
    }))
    .filter(({ contribution }) => Math.abs(contribution) >= 0.08)
    .sort((left, right) => Math.abs(right.contribution) - Math.abs(left.contribution))
    .slice(0, 3)
    .map(
      ({ label, contribution }) =>
        `${label} : ${contribution > 0 ? "a favorisé cette issue" : "a pesé contre cette issue"}`,
    );
}

export function outcomeProbabilities(state: GameState, choice: EventChoice): number[] {
  const logits = choice.outcomeGroups.map((outcome) => {
    const base = Math.log(Math.max(0.0001, outcome.baseWeight));
    return (
      base +
      outcome.modifiers.reduce(
        (sum, modifier) => sum + modifier.coefficient * modifierValue(state, modifier),
        0,
      )
    );
  });
  return softmax(logits);
}

export function resolveWeightedOutcome(
  state: GameState,
  event: GameEventDefinition,
  choiceId: string,
): {
  outcome: WeightedOutcome;
  choice: EventChoice;
  probabilities: number[];
  roll: number;
  decisiveFactors: string[];
  state: GameState;
} {
  const choice = event.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) throw new Error(`Choix inconnu « ${choiceId} » pour l’événement « ${event.id} ».`);
  if (choice.outcomeGroups.length === 0)
    throw new Error(`Le choix « ${choice.id} » ne contient aucune issue.`);

  const probabilities = outcomeProbabilities(state, choice);
  const [roll, rng] = random(state.rng);
  let cumulative = 0;
  let selectedIndex = probabilities.length - 1;
  for (let index = 0; index < probabilities.length; index += 1) {
    cumulative += probabilities[index] ?? 0;
    if (roll <= cumulative) {
      selectedIndex = index;
      break;
    }
  }
  const outcome = choice.outcomeGroups[selectedIndex];
  if (!outcome) throw new Error(`Impossible de résoudre le choix « ${choice.id} ».`);
  return {
    outcome,
    choice,
    probabilities,
    roll,
    decisiveFactors: decisiveFactors(state, outcome),
    state: { ...state, rng },
  };
}
