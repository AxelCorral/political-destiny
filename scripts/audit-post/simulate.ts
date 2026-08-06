/**
 * Post-corrections audit — main simulation grid (section 9).
 *
 * Runs the REAL production engine (createGame / currentEvent /
 * resolveCurrentChoice) headlessly, once per (party, agent, seed) triple, for
 * every one of the 9 playable parties and all 8 audit agents. No parallel
 * reimplementation of the rules.
 *
 * Env vars:
 *   AUDIT_SEEDS_PER_COMBO   default 60   seeds per (party, agent) cell
 *   AUDIT_INCLUDE_CUSTOM    default 1    also run a smaller custom-party grid
 *   AUDIT_CUSTOM_SEEDS      default 30
 *
 * Outputs (audit-results/):
 *   raw-runs.csv                one row per completed campaign
 *   decisions.csv                one row per decision across every campaign
 *   world-events.csv             one row per opponent-world action encountered
 *   ideology-trajectories.csv    one row per (run, axis) ideology delta
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import {
  createGame,
  currentEvent,
  resolveCurrentChoice,
  validateGameState,
} from "../../src/game/engine/index";
import type { GameState, IdeologyAxis } from "../../src/game/types/index";
import { AGENT_NAMES, type AgentName, pickChoice } from "./lib/agents";
import { toCsv } from "./lib/csv";
import { normalize } from "./lib/text-similarity";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results");

const SEEDS_PER_COMBO = Math.max(
  10,
  Math.min(300, Number.parseInt(process.env.AUDIT_SEEDS_PER_COMBO ?? "60", 10) || 60),
);
const INCLUDE_CUSTOM = (process.env.AUDIT_INCLUDE_CUSTOM ?? "1") !== "0";
const CUSTOM_SEEDS = Math.max(
  5,
  Math.min(200, Number.parseInt(process.env.AUDIT_CUSTOM_SEEDS ?? "30", 10) || 30),
);

const IDEOLOGY_AXES: IdeologyAxis[] = [
  "economy",
  "society",
  "europe",
  "ecology",
  "authority",
  "immigration",
];
const PARTIES = gameContent.parties;

interface RepetitionStats {
  repeatedTitlesExact: number;
  repeatedTitlesNormalized: number;
  repeatedNarrativesExact: number;
  repeatedNarrativesNormalized: number;
  repeatsWithin5: number;
  repeatsWithin10: number;
  chainJustifiedRepeats: number;
}

function repeatedOccurrences(values: string[]): number {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let sum = 0;
  for (const count of counts.values()) sum += Math.max(0, count - 1);
  return sum;
}

function computeRepetitionStats(state: GameState, chainEventIds: Set<string>): RepetitionStats {
  const history = state.decisionHistory;
  const titles = history.map((d) => d.eventTitle);
  const titlesNorm = titles.map(normalize);
  const narratives = history.map((d) => d.narrative);
  const narrativesNorm = narratives.map(normalize);

  let repeatsWithin5 = 0;
  let repeatsWithin10 = 0;
  let chainJustifiedRepeats = 0;
  const lastSeenAt = new Map<string, number>();
  history.forEach((decision, index) => {
    const previous = lastSeenAt.get(decision.eventId);
    if (previous !== undefined) {
      const gap = index - previous;
      if (gap <= 5) repeatsWithin5 += 1;
      if (gap <= 10) repeatsWithin10 += 1;
      if (chainEventIds.has(decision.eventId)) chainJustifiedRepeats += 1;
    }
    lastSeenAt.set(decision.eventId, index);
  });

  return {
    repeatedTitlesExact: repeatedOccurrences(titles),
    repeatedTitlesNormalized: repeatedOccurrences(titlesNorm),
    repeatedNarrativesExact: repeatedOccurrences(narratives),
    repeatedNarrativesNormalized: repeatedOccurrences(narrativesNorm),
    repeatsWithin5,
    repeatsWithin10,
    chainJustifiedRepeats,
  };
}

const chainSourceEventIds = new Set(
  gameContent.events
    .filter((e) =>
      e.choices.some((c) => c.outcomeGroups.some((o) => (o.followUps?.length ?? 0) > 0)),
    )
    .map((e) => e.id),
);
const chainTargetEventIds = new Set(
  gameContent.events.flatMap((e) =>
    e.choices.flatMap((c) =>
      c.outcomeGroups.flatMap((o) => (o.followUps ?? []).map((f) => f.eventId)),
    ),
  ),
);
const chainRelatedEventIds = new Set([...chainSourceEventIds, ...chainTargetEventIds]);

interface RawRunRow {
  partyId: string;
  partyKind: string;
  agent: AgentName;
  seedIndex: number;
  seed: string;
  methodId: string;
  decisions: number;
  qualified: boolean;
  won: boolean;
  finalScore: number;
  firstRoundScore: number;
  secondRoundScore: number | null;
  progression: number;
  endingId: string;
  finalRank: number;
  achievementsUnlocked: number;
  valid: boolean;
  statementCount: number;
  contradictionCount: number;
  abruptReversalCount: number;
  actorMemoryEntries: number;
  activeRelationsAtEnd: number;
  opponentActionCount: number;
  opponentActionKinds: string;
  alliancesFormed: number;
  candidateReplacements: number;
  narrativeThreadsStarted: number;
  narrativeThreadsResolved: number;
  narrativeThreadsFailed: number;
  ideologyMovementTotal: number;
  ideologyMovementMax: number;
  repeatedTitlesExact: number;
  repeatedTitlesNormalized: number;
  repeatedNarrativesExact: number;
  repeatedNarrativesNormalized: number;
  repeatsWithin5: number;
  repeatsWithin10: number;
  chainJustifiedRepeats: number;
  finalSignature: string;
}

interface DecisionRow {
  runKey: string;
  partyId: string;
  agent: AgentName;
  seedIndex: number;
  decisionIndex: number;
  eventId: string;
  eventCategory: string;
  choiceId: string;
  choiceTag: string;
  choiceStrategy: string;
  outcomeId: string;
  outcomeTitle: string;
  statementEvolution: string;
}

interface WorldEventRow {
  runKey: string;
  partyId: string;
  agent: AgentName;
  seedIndex: number;
  decisionIndex: number;
  kind: string;
  actorPartyId: string;
}

interface IdeologyRow {
  runKey: string;
  partyId: string;
  agent: AgentName;
  seedIndex: number;
  axis: string;
  startTrue: number;
  endTrue: number;
  startPerceived: number;
  endPerceived: number;
  deltaTrue: number;
  deltaPerceived: number;
}

function runCampaign(
  partyId: string,
  agent: AgentName,
  seedIndex: number,
  seedPrefix: string,
  customParty?: (typeof gameContent.parties)[number],
): {
  raw: RawRunRow;
  decisions: DecisionRow[];
  worldEvents: WorldEventRow[];
  ideology: IdeologyRow[];
} {
  const seed = `${seedPrefix}-${seedIndex}`;
  const method = gameContent.methods[seedIndex % gameContent.methods.length]!;
  let state = createGame(
    customParty
      ? { seed, mode: "custom_party", partyId, methodId: method.id, customParty }
      : { seed, mode: "existing_party", partyId, methodId: method.id },
    gameContent,
  );
  const startIdeology = { ...state.parties[partyId]!.ideology };
  const startPerceived = { ...state.parties[partyId]!.perceivedIdeology };

  const decisions: DecisionRow[] = [];
  const worldEvents: WorldEventRow[] = [];
  const runKey = `${partyId}:${agent}:${seedIndex}`;
  let guard = 0;
  const seenOpponentActions = 0;
  void seenOpponentActions;

  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, gameContent.events);
    const choice = pickChoice(state, event, agent, seed);
    const resolution = resolveCurrentChoice(state, choice.id, gameContent);
    state = resolution.state;
    guard += 1;
  }
  if (state.phase !== "finished" || !state.finalResult || !state.firstRoundResult) {
    throw new Error(`Partie inachevée: ${partyId}/${agent}/${seedIndex}`);
  }

  for (const record of state.decisionHistory) {
    decisions.push({
      runKey,
      partyId,
      agent,
      seedIndex,
      decisionIndex: record.decisionIndex,
      eventId: record.eventId,
      eventCategory: record.eventCategory,
      choiceId: record.choiceId,
      choiceTag: record.choiceTag ?? "",
      choiceStrategy: record.choiceStrategy ?? "",
      outcomeId: record.outcomeId,
      outcomeTitle: record.outcomeTitle,
      statementEvolution: record.statementEvolution ?? "",
    });
  }

  state.opponentActions.forEach((action) => {
    worldEvents.push({
      runKey,
      partyId,
      agent,
      seedIndex,
      decisionIndex: action.decisionIndex,
      kind: action.kind,
      actorPartyId: action.partyId,
    });
  });

  const endIdeology = state.parties[partyId]?.ideology ?? startIdeology;
  const endPerceived = state.parties[partyId]?.perceivedIdeology ?? startPerceived;
  const ideologyRows: IdeologyRow[] = IDEOLOGY_AXES.map((axis) => ({
    runKey,
    partyId,
    agent,
    seedIndex,
    axis,
    startTrue: startIdeology[axis],
    endTrue: (endIdeology as Record<string, number>)[axis] ?? startIdeology[axis],
    startPerceived: startPerceived[axis],
    endPerceived: (endPerceived as Record<string, number>)[axis] ?? startPerceived[axis],
    deltaTrue:
      ((endIdeology as Record<string, number>)[axis] ?? startIdeology[axis]) - startIdeology[axis],
    deltaPerceived:
      ((endPerceived as Record<string, number>)[axis] ?? startPerceived[axis]) -
      startPerceived[axis],
  }));
  const ideologyMovements = ideologyRows.map((row) => Math.abs(row.deltaTrue));

  const opponentActionKinds = [...new Set(state.opponentActions.map((a) => a.kind))]
    .sort()
    .join("|");
  const validation = validateGameState(state);
  const repetition = computeRepetitionStats(state, chainRelatedEventIds);
  const result = state.finalResult;
  const finalRank =
    Object.values(state.parties)
      .filter((p) => p.active)
      .sort((a, b) => b.stats.polling - a.stats.polling)
      .findIndex((p) => p.id === partyId) + 1;

  const finalSignature = createHash("sha1")
    .update(
      JSON.stringify({
        decisions: state.decisionHistory.map((d) => [d.eventId, d.choiceId, d.outcomeId]),
        firstRound: state.firstRoundResult.results,
        secondRound: state.secondRoundResult?.results,
        result,
      }),
    )
    .digest("hex");

  const raw: RawRunRow = {
    partyId,
    partyKind: customParty ? "custom" : "existing",
    agent,
    seedIndex,
    seed,
    methodId: method.id,
    decisions: state.decisionIndex,
    qualified: result.qualified,
    won: result.won,
    finalScore: result.score,
    firstRoundScore: state.firstRoundResult.results[partyId] ?? 0,
    secondRoundScore: state.secondRoundResult?.results[partyId] ?? null,
    progression: result.pollingProgression,
    endingId: result.endingId,
    finalRank,
    achievementsUnlocked: result.unlockedAchievementIds.length,
    valid: validation.valid,
    statementCount: state.statementLedger.length,
    contradictionCount: state.statementLedger.filter((s) => s.evolution === "contradiction").length,
    abruptReversalCount: state.statementLedger.filter((s) => s.evolution === "abrupt_reversal")
      .length,
    actorMemoryEntries: state.actorMemories.length,
    activeRelationsAtEnd: Object.values(state.partyRelations[partyId] ?? {}).filter(
      (v) => Math.abs(v) >= 15,
    ).length,
    opponentActionCount: state.opponentActions.length,
    opponentActionKinds,
    alliancesFormed: state.parties[partyId]?.alliedWith.length ?? 0,
    candidateReplacements: state.opponentActions.filter((a) => a.kind === "replacement").length,
    narrativeThreadsStarted: Object.keys(state.narrativeThreads).length,
    narrativeThreadsResolved: Object.values(state.narrativeThreads).filter(
      (t) => t.status === "resolved",
    ).length,
    narrativeThreadsFailed: Object.values(state.narrativeThreads).filter(
      (t) => t.status === "failed",
    ).length,
    ideologyMovementTotal: Number(ideologyMovements.reduce((a, b) => a + b, 0).toFixed(2)),
    ideologyMovementMax: Number(Math.max(0, ...ideologyMovements).toFixed(2)),
    repeatedTitlesExact: repetition.repeatedTitlesExact,
    repeatedTitlesNormalized: repetition.repeatedTitlesNormalized,
    repeatedNarrativesExact: repetition.repeatedNarrativesExact,
    repeatedNarrativesNormalized: repetition.repeatedNarrativesNormalized,
    repeatsWithin5: repetition.repeatsWithin5,
    repeatsWithin10: repetition.repeatsWithin10,
    chainJustifiedRepeats: repetition.chainJustifiedRepeats,
    finalSignature,
  };

  return { raw, decisions, worldEvents, ideology: ideologyRows };
}

const startedAt = performance.now();
const rawRows: RawRunRow[] = [];
const decisionRows: DecisionRow[] = [];
const worldEventRows: WorldEventRow[] = [];
const ideologyRows: IdeologyRow[] = [];
const errors: Array<{ partyId: string; agent: string; seedIndex: number; message: string }> = [];

for (const party of PARTIES) {
  for (const agent of AGENT_NAMES) {
    for (let seedIndex = 0; seedIndex < SEEDS_PER_COMBO; seedIndex += 1) {
      try {
        const { raw, decisions, worldEvents, ideology } = runCampaign(
          party.id,
          agent,
          seedIndex,
          "post-audit",
        );
        rawRows.push(raw);
        decisionRows.push(...decisions);
        worldEventRows.push(...worldEvents);
        ideologyRows.push(...ideology);
      } catch (error) {
        errors.push({
          partyId: party.id,
          agent,
          seedIndex,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
  console.log(`simulate.ts: ${party.id} terminé (${rawRows.length} campagnes cumulées).`);
}

if (INCLUDE_CUSTOM) {
  const { CUSTOM_PARTY_PROFILES } = await import("./lib/custom-profiles");
  for (const profile of CUSTOM_PARTY_PROFILES) {
    for (const agent of AGENT_NAMES) {
      for (let seedIndex = 0; seedIndex < CUSTOM_SEEDS; seedIndex += 1) {
        try {
          const { raw, decisions, worldEvents, ideology } = runCampaign(
            "custom_party",
            agent,
            seedIndex,
            `post-audit-custom-${profile.id}`,
            profile.definition,
          );
          rawRows.push(raw);
          decisionRows.push(...decisions);
          worldEventRows.push(...worldEvents);
          ideologyRows.push(...ideology);
        } catch (error) {
          errors.push({
            partyId: `custom:${profile.id}`,
            agent,
            seedIndex,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
    console.log(`simulate.ts: profil personnalisé ${profile.id} terminé.`);
  }
}

await mkdir(OUT_DIR, { recursive: true });
await writeFile(
  resolve(OUT_DIR, "raw-runs.csv"),
  toCsv(rawRows as unknown as Record<string, unknown>[]),
  "utf8",
);
await writeFile(
  resolve(OUT_DIR, "decisions.csv"),
  toCsv(decisionRows as unknown as Record<string, unknown>[]),
  "utf8",
);
await writeFile(
  resolve(OUT_DIR, "world-events.csv"),
  toCsv(worldEventRows as unknown as Record<string, unknown>[]),
  "utf8",
);
await writeFile(
  resolve(OUT_DIR, "ideology-trajectories.csv"),
  toCsv(ideologyRows as unknown as Record<string, unknown>[]),
  "utf8",
);
await writeFile(
  resolve(OUT_DIR, "errors.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), simulateErrors: errors }, null, 2)}\n`,
  "utf8",
);

const durationMs = performance.now() - startedAt;
console.log(
  JSON.stringify(
    {
      totalRuns: rawRows.length,
      totalDecisions: decisionRows.length,
      errors: errors.length,
      seedsPerCombo: SEEDS_PER_COMBO,
      includeCustom: INCLUDE_CUSTOM,
      durationMs: Math.round(durationMs),
      runsPerSecond: Number((rawRows.length / (durationMs / 1000)).toFixed(2)),
    },
    null,
    2,
  ),
);
