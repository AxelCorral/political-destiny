/**
 * Eight decision agents for the post-corrections audit.
 *
 * Every agent reads only information already present on the current GameState
 * and on the event/choice definitions — none of them peek at the actual PRNG
 * draw that will resolve a choice. Where an agent needs to estimate the
 * consequence of a choice, it uses `outcomeProbabilities()` (the engine's own,
 * already-computed weight distribution for the *current* state) combined with
 * a hand-written utility function over declared effects. This is knowledge a
 * reasonably well-informed player could approximate from the visible tags and
 * hints — not knowledge of the eventual roll.
 *
 * All tie-breaks are seeded and deterministic (hashSeed), so re-running the
 * same seed/party/agent combination always reproduces the same campaign.
 */
import { hashSeed, outcomeProbabilities } from "../../../src/game/engine/index";
import type {
  EventChoice,
  GameEffect,
  GameEventDefinition,
  GameState,
  WeightedOutcome,
} from "../../../src/game/types/index";

export const AGENT_NAMES = [
  "aleatoire",
  "prudent",
  "risque",
  "ideologiquement_coherent",
  "opportuniste_electoral",
  "parti_dabord",
  "mediatique",
  "contrarien",
] as const;

export type AgentName = (typeof AGENT_NAMES)[number];

export const AGENT_DEFINITIONS: Record<AgentName, string> = {
  aleatoire: "Sélectionne uniformément une option disponible (seedée, sans mémoire stratégique).",
  prudent:
    "Classe les options par variance croissante des issues (utilité pondérée par les probabilités du moteur) ; départage par l'étiquette PRUDENT et les stratégies temps long/action légale/silence.",
  risque:
    "Classe les options par variance décroissante et par gain maximal atteignable ; départage par l'étiquette RISQUÉ et les stratégies rupture/risque personnel/exclusion.",
  ideologiquement_coherent:
    "Pour les choix portant une déclaration, minimise la distance entre la position proposée et la position déjà connue du parti sur ce sujet (ou son idéologie de départ à défaut) ; sinon maximise l'utilité espérée pondérée vers les stratégies d'engagement programmatique et de compromis cohérent.",
  opportuniste_electoral:
    "Maximise l'effet immédiat espéré (hors effets différés) sur les sondages et la popularité uniquement.",
  parti_dabord:
    "Maximise l'effet espéré sur la cohésion, les adhérents et la mobilisation, y compris les effets différés.",
  mediatique:
    "Maximise l'effet espéré sur la notoriété et la présence médiatique ; bonus pour les étiquettes OFFENSIF/CLIVANT/POPULAIRE et les stratégies de réponse médiatique/action symbolique.",
  contrarien:
    "Calcule le même score que l'agent idéologiquement cohérent puis choisit systématiquement l'option la moins bien classée par ce score.",
};

function seededIndex(seed: string, salt: string, length: number): number {
  if (length <= 0) return 0;
  return hashSeed(`${seed}:${salt}`) % length;
}

function pickBySeed(seed: string, salt: string, choices: EventChoice[]): EventChoice {
  return choices[seededIndex(seed, salt, choices.length)] ?? choices[0]!;
}

// --- Effect utility model -------------------------------------------------
// Shared by every agent that needs to estimate "how good" an outcome is.
// The weights are an audit-only approximation documented here; they are not
// part of the production engine and were not tuned against it.

const PARTY_STAT_WEIGHTS: Record<string, number> = {
  polling: 1.4,
  popularity: 1,
  mobilization: 0.85,
  finances: 0.35,
  credibility: 1.1,
  cohesion: 0.65,
  members: 0.0004,
  mediaPresence: 0.5,
  awareness: 0.6,
  rejection: -1,
  momentum: 0.9,
  localStrength: 0.55,
  electedSupport: 0.5,
};

const HIDDEN_STAT_WEIGHTS: Record<string, number> = {
  baseSupport: 1.6,
  potentialSupport: 1.2,
  transferability: 0.7,
  scandalRisk: -0.6,
  cadreLoyalty: 0.5,
  rivalAmbition: -0.35,
  economicCompetence: 0.6,
  securityCompetence: 0.6,
  socialCompetence: 0.6,
  fatigue: -0.55,
  consistency: 0.7,
};

function genericEffectUtility(effect: GameEffect): number {
  if (!("delta" in effect)) {
    if (effect.kind === "alliance") return effect.action === "add" ? 5 : -4;
    if (effect.kind === "party_split") return -7;
    if (effect.kind === "candidate_status")
      return ["withdrawn", "disqualified", "eliminated"].includes(effect.status) ? -8 : 3;
    return 0;
  }
  switch (effect.kind) {
    case "party_stat":
      return effect.delta * (PARTY_STAT_WEIGHTS[effect.stat] ?? 0.5);
    case "hidden_stat":
      return effect.delta * (HIDDEN_STAT_WEIGHTS[effect.stat] ?? 0.4);
    case "trait":
      return effect.delta * 0.55;
    case "bloc_trust":
      return effect.delta * 0.5;
    default:
      return 0;
  }
}

/** Utility restricted to a specific subset of party_stat keys — used by focused agents. */
function focusedEffectUtility(effect: GameEffect, focus: Set<string>): number {
  if ("delta" in effect && effect.kind === "party_stat" && focus.has(effect.stat)) {
    return effect.delta;
  }
  return 0;
}

interface OutcomeMoments {
  expected: number;
  variance: number;
  max: number;
  min: number;
}

function outcomeMoments(
  state: GameState,
  choice: EventChoice,
  utilityOf: (outcome: WeightedOutcome, immediateOnly: boolean) => number,
  immediateOnly: boolean,
): OutcomeMoments {
  const probabilities = outcomeProbabilities(state, choice);
  const utilities = choice.outcomeGroups.map((outcome) => utilityOf(outcome, immediateOnly));
  const expected = utilities.reduce((sum, u, index) => sum + u * (probabilities[index] ?? 0), 0);
  const variance = utilities.reduce(
    (sum, u, index) => sum + (probabilities[index] ?? 0) * (u - expected) ** 2,
    0,
  );
  return {
    expected,
    variance,
    max: utilities.length ? Math.max(...utilities) : 0,
    min: utilities.length ? Math.min(...utilities) : 0,
  };
}

function genericOutcomeUtility(outcome: WeightedOutcome, immediateOnly: boolean): number {
  const immediate = outcome.effects.reduce((sum, effect) => sum + genericEffectUtility(effect), 0);
  if (immediateOnly) return immediate;
  const delayed = (outcome.delayedEffects ?? []).reduce(
    (sum, scheduled) =>
      sum + scheduled.effects.reduce((s, effect) => s + genericEffectUtility(effect), 0),
    0,
  );
  return immediate + delayed * 0.75;
}

function focusedOutcomeUtility(
  outcome: WeightedOutcome,
  focus: Set<string>,
  immediateOnly: boolean,
): number {
  const immediate = outcome.effects.reduce(
    (sum, effect) => sum + focusedEffectUtility(effect, focus),
    0,
  );
  if (immediateOnly) return immediate;
  const delayed = (outcome.delayedEffects ?? []).reduce(
    (sum, scheduled) =>
      sum + scheduled.effects.reduce((s, effect) => s + focusedEffectUtility(effect, focus), 0),
    0,
  );
  return immediate + delayed * 0.75;
}

const IDEOLOGY_AXIS_BY_TOPIC: Record<string, string> = {
  economy: "economy",
  fiscality: "economy",
  pensions: "economy",
  public_services: "economy",
  work: "economy",
  security: "authority",
  immigration: "immigration",
  europe: "europe",
  ecology: "ecology",
  institutions: "authority",
  civil_liberties: "authority",
  social_issues: "society",
};

function coherenceScore(state: GameState, choice: EventChoice): number {
  let score = 0;
  const statement = choice.statement;
  if (statement?.policyTopic && statement.stance !== undefined) {
    const existing = state.policyPositions[statement.policyTopic];
    const party = state.parties[state.playerPartyId];
    const axis = IDEOLOGY_AXIS_BY_TOPIC[statement.policyTopic] ?? "economy";
    const reference =
      existing?.stance ??
      (party?.perceivedIdeology as Record<string, number> | undefined)?.[axis] ??
      0;
    const distance = Math.abs(statement.stance - reference);
    score += 60 - distance;
    if (existing && distance > 30) score -= 20;
  } else {
    const moments = outcomeMoments(state, choice, genericOutcomeUtility, false);
    score += moments.expected * 0.25;
  }
  if (
    choice.strategy === "policy_commitment" ||
    choice.strategy === "long_term_strategy" ||
    choice.strategy === "compromise"
  )
    score += 6;
  if (choice.visibleTag === "OPPORTUNISTE") score -= 10;
  if (choice.visibleTag === "TRANSPARENT" || choice.visibleTag === "LOYAL") score += 4;
  return score;
}

export function pickChoice(
  state: GameState,
  event: GameEventDefinition,
  agent: AgentName,
  seed: string,
): EventChoice {
  const choices = event.choices;
  if (choices.length === 1) return choices[0]!;
  const salt = `${state.decisionIndex}:${event.id}:${agent}`;

  switch (agent) {
    case "aleatoire":
      return pickBySeed(seed, `${salt}:random`, choices);

    case "prudent": {
      const preferred = choices.filter(
        (choice) =>
          choice.visibleTag === "PRUDENT" ||
          choice.strategy === "long_term_strategy" ||
          choice.strategy === "legal_action" ||
          choice.strategy === "silence",
      );
      const pool = preferred.length ? preferred : choices;
      const ranked = pool
        .map((choice) => ({
          choice,
          moments: outcomeMoments(state, choice, genericOutcomeUtility, false),
        }))
        .sort(
          (a, b) =>
            a.moments.variance - b.moments.variance ||
            b.moments.expected - a.moments.expected ||
            a.choice.id.localeCompare(b.choice.id),
        );
      return ranked[0]?.choice ?? pickBySeed(seed, `${salt}:fallback`, choices);
    }

    case "risque": {
      const preferred = choices.filter(
        (choice) =>
          choice.visibleTag === "RISQUÉ" ||
          choice.strategy === "personal_risk" ||
          choice.strategy === "break" ||
          choice.strategy === "exclusion",
      );
      const pool = preferred.length ? preferred : choices;
      const ranked = pool
        .map((choice) => ({
          choice,
          moments: outcomeMoments(state, choice, genericOutcomeUtility, false),
        }))
        .sort(
          (a, b) =>
            b.moments.variance - a.moments.variance ||
            b.moments.max - a.moments.max ||
            a.choice.id.localeCompare(b.choice.id),
        );
      return ranked[0]?.choice ?? pickBySeed(seed, `${salt}:fallback`, choices);
    }

    case "ideologiquement_coherent": {
      const ranked = choices
        .map((choice) => ({ choice, score: coherenceScore(state, choice) }))
        .sort((a, b) => b.score - a.score || a.choice.id.localeCompare(b.choice.id));
      return ranked[0]?.choice ?? choices[0]!;
    }

    case "contrarien": {
      const ranked = choices
        .map((choice) => ({ choice, score: coherenceScore(state, choice) }))
        .sort((a, b) => a.score - b.score || a.choice.id.localeCompare(b.choice.id));
      return ranked[0]?.choice ?? choices[0]!;
    }

    case "opportuniste_electoral": {
      const focus = new Set(["polling", "popularity"]);
      const ranked = choices
        .map((choice) => ({
          choice,
          moments: outcomeMoments(
            state,
            choice,
            (outcome, immediateOnly) => focusedOutcomeUtility(outcome, focus, immediateOnly),
            true,
          ),
        }))
        .sort(
          (a, b) =>
            b.moments.expected - a.moments.expected || a.choice.id.localeCompare(b.choice.id),
        );
      return ranked[0]?.choice ?? pickBySeed(seed, `${salt}:fallback`, choices);
    }

    case "parti_dabord": {
      const focus = new Set(["cohesion", "members", "mobilization"]);
      const ranked = choices
        .map((choice) => ({
          choice,
          moments: outcomeMoments(
            state,
            choice,
            (outcome, immediateOnly) => focusedOutcomeUtility(outcome, focus, immediateOnly),
            false,
          ),
        }))
        .sort(
          (a, b) =>
            b.moments.expected - a.moments.expected || a.choice.id.localeCompare(b.choice.id),
        );
      return ranked[0]?.choice ?? pickBySeed(seed, `${salt}:fallback`, choices);
    }

    case "mediatique": {
      const focus = new Set(["awareness", "mediaPresence"]);
      const ranked = choices
        .map((choice) => {
          const moments = outcomeMoments(
            state,
            choice,
            (outcome, immediateOnly) => focusedOutcomeUtility(outcome, focus, immediateOnly),
            false,
          );
          let bonus = 0;
          if (["OFFENSIF", "CLIVANT", "POPULAIRE"].includes(choice.visibleTag ?? "")) bonus += 4;
          if (choice.strategy === "symbolic_action") bonus += 3;
          return { choice, score: moments.expected + bonus };
        })
        .sort((a, b) => b.score - a.score || a.choice.id.localeCompare(b.choice.id));
      return ranked[0]?.choice ?? pickBySeed(seed, `${salt}:fallback`, choices);
    }

    default:
      return pickBySeed(seed, `${salt}:default`, choices);
  }
}
