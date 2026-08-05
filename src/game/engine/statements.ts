import type {
  ElectorateBlocDefinition,
  IdeologyAxis,
  PartyState,
  PoliticalTopic,
  StatementEvolution,
  StatementRecord,
  VisibleEffect,
  GameState,
} from "@/game/types";

import { clamp } from "./math";

const TOPIC_AXIS: Record<PoliticalTopic, IdeologyAxis> = {
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

const LEGACY_TOPICS: Array<[RegExp, PoliticalTopic]> = [
  [/fiscal|imp[oô]t|taxe/iu, "fiscality"],
  [/retraite/iu, "pensions"],
  [/services? publics?|sant[eé]|[eé]cole|h[oô]pital/iu, "public_services"],
  [/travail|salaire|emploi|ch[oô]mage/iu, "work"],
  [/s[eé]curit[eé]|police|justice/iu, "security"],
  [/immigration|asile|fronti[eè]re/iu, "immigration"],
  [/europe|union europ[eé]enne/iu, "europe"],
  [/[eé]cologie|climat|[eé]nergie/iu, "ecology"],
  [/institution|constitution|r[eé]f[eé]rendum/iu, "institutions"],
  [/libert[eé]|surveillance/iu, "civil_liberties"],
  [/soci[eé]t[eé]|famille|[eé]galit[eé]/iu, "social_issues"],
  [/[eé]conomie|industrie|logement|pouvoir d.achat/iu, "economy"],
];

export interface StatementInput {
  topic: string;
  policyTopic?: PoliticalTopic;
  text: string;
  stance?: number;
  ideology?: Partial<Record<IdeologyAxis, number>>;
}

export interface StatementResolution {
  state: GameState;
  record: StatementRecord;
  visibleEffects: VisibleEffect[];
}

export function normalizePolicyTopic(topic: string): PoliticalTopic | undefined {
  return LEGACY_TOPICS.find(([pattern]) => pattern.test(topic))?.[1];
}

function classifyEvolution(
  previousStance: number | undefined,
  nextStance: number,
): StatementEvolution {
  if (previousStance === undefined) return "initial_position";
  const change = Math.abs(nextStance - previousStance);
  if (change <= 10) return "gradual_evolution";
  if (change <= 25) return "coherent_compromise";
  if (change <= 45) return "strategic_repositioning";
  if (change <= 70) return "contradiction";
  return "abrupt_reversal";
}

function inferredStance(
  party: PartyState,
  topic: PoliticalTopic,
  statement: StatementInput,
): number {
  if (statement.stance !== undefined) return clamp(statement.stance, -100, 100);
  const axis = TOPIC_AXIS[topic];
  const ideologicalSignal = statement.ideology?.[axis];
  if (ideologicalSignal !== undefined)
    return clamp(party.perceivedIdeology[axis] + ideologicalSignal, -100, 100);
  return party.perceivedIdeology[axis];
}

function applyElectorateResponse(
  state: GameState,
  blocs: ElectorateBlocDefinition[],
  topic: PoliticalTopic,
  stance: number,
  confidence: number,
): void {
  const axis = TOPIC_AXIS[topic];
  for (const bloc of blocs) {
    const trust = state.electorate.trustModifiers[bloc.id];
    if (!trust) continue;
    const distance = Math.abs(stance - bloc.ideology[axis]);
    const fit = 1 - distance / 200;
    const priorityBoost = bloc.priorities.some((priority) =>
      topic === "public_services"
        ? priority === "services"
        : topic === "security" || topic === "civil_liberties"
          ? priority === "security"
          : priority === axis,
    )
      ? 1.35
      : 0.75;
    const delta = (fit - 0.58) * 2.8 * priorityBoost * (confidence / 100);
    trust[state.playerPartyId] = clamp((trust[state.playerPartyId] ?? 0) + delta, -40, 40);
  }
}

function applyEvolutionCosts(party: PartyState, evolution: StatementEvolution): VisibleEffect[] {
  const effects: VisibleEffect[] = [];
  const consistencyDelta: Record<StatementEvolution, number> = {
    initial_position: 1,
    gradual_evolution: 2,
    coherent_compromise: 1,
    strategic_repositioning: -2,
    contradiction: -8,
    abrupt_reversal: -16,
  };
  party.hidden.consistency = clamp(party.hidden.consistency + consistencyDelta[evolution]);

  if (evolution === "contradiction" || evolution === "abrupt_reversal") {
    const severe = evolution === "abrupt_reversal";
    party.stats.cohesion = clamp(party.stats.cohesion - (severe ? 7 : 4));
    party.stats.rejection = clamp(party.stats.rejection + (severe ? 6 : 3));
    party.stats.mediaPresence = clamp(party.stats.mediaPresence + (severe ? 4 : 2));
    party.stats.members = Math.max(0, Math.round(party.stats.members * (severe ? 0.95 : 0.98)));
    effects.push(
      {
        label: severe ? "Revirement brutal relevé" : "Contradiction relevée",
        tone: "negative",
      },
      { label: "La fronde interne gagne du terrain", tone: "negative" },
      { label: "La séquence attire les médias", tone: "neutral" },
    );
  } else if (evolution === "gradual_evolution" || evolution === "coherent_compromise") {
    party.stats.credibility = clamp(party.stats.credibility + 1);
    effects.push({ label: "Ligne politique jugée cohérente", tone: "positive" });
  }
  return effects;
}

export function recordStatement(
  sourceState: GameState,
  eventId: string,
  statement: StatementInput,
  decisionIndex: number,
  blocs: ElectorateBlocDefinition[],
): StatementResolution {
  const state = structuredClone(sourceState);
  const party = state.parties[state.playerPartyId];
  if (!party)
    throw new Error("Le parti joueur est absent lors de l’enregistrement d’une position.");
  const policyTopic = statement.policyTopic ?? normalizePolicyTopic(statement.topic);
  if (!policyTopic) {
    const record: StatementRecord = {
      decisionIndex,
      eventId,
      topic: statement.topic,
      text: statement.text,
      ...(statement.ideology ? { ideology: structuredClone(statement.ideology) } : {}),
    };
    state.statementLedger.push(record);
    return { state, record, visibleEffects: [] };
  }

  const previous = state.policyPositions[policyTopic];
  const stance = inferredStance(party, policyTopic, statement);
  const evolution = classifyEvolution(previous?.stance, stance);
  const confidence = clamp(statement.stance === undefined ? 55 : 70);
  const axis = TOPIC_AXIS[policyTopic];
  const ideologicalDelta = (stance - party.perceivedIdeology[axis]) * 0.1;
  party.ideology[axis] = clamp(party.ideology[axis] + ideologicalDelta * 0.35, -100, 100);
  party.perceivedIdeology[axis] = clamp(
    party.perceivedIdeology[axis] + ideologicalDelta,
    -100,
    100,
  );
  for (const [ideologyAxis, delta] of Object.entries(statement.ideology ?? {})) {
    const key = ideologyAxis as IdeologyAxis;
    party.ideology[key] = clamp(party.ideology[key] + (delta ?? 0) * 0.35, -100, 100);
    party.perceivedIdeology[key] = clamp(party.perceivedIdeology[key] + (delta ?? 0), -100, 100);
  }

  state.policyPositions[policyTopic] = previous
    ? {
        ...previous,
        stance,
        confidence,
        lastDecisionIndex: decisionIndex,
        changes: previous.changes + Number(Math.abs(previous.stance - stance) >= 8),
      }
    : {
        topic: policyTopic,
        stance,
        confidence,
        firstDecisionIndex: decisionIndex,
        lastDecisionIndex: decisionIndex,
        changes: 0,
      };
  applyElectorateResponse(state, blocs, policyTopic, stance, confidence);
  const visibleEffects = applyEvolutionCosts(party, evolution);
  const previousStatement = [...state.statementLedger]
    .reverse()
    .find((candidate) => candidate.policyTopic === policyTopic);
  const record: StatementRecord = {
    decisionIndex,
    eventId,
    topic: statement.topic,
    policyTopic,
    text: statement.text,
    stance,
    evolution,
    ...(evolution === "contradiction" || evolution === "abrupt_reversal"
      ? { contradictionWithDecisionIndex: previousStatement?.decisionIndex }
      : {}),
    ...(statement.ideology ? { ideology: structuredClone(statement.ideology) } : {}),
  };
  state.statementLedger.push(record);
  return { state, record, visibleEffects };
}
