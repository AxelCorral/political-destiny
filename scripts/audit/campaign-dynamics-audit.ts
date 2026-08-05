import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine";
import { hashSeed } from "../../src/game/engine/rng";
import type { GameState } from "../../src/game/types";

const SEEDS = Math.max(
  20,
  Math.min(250, Number.parseInt(process.env.AUDIT_DYNAMICS_SEEDS ?? "100", 10) || 100),
);

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function averageUndecided(state: GameState): number {
  return mean(Object.values(state.electorate.undecidedByBloc));
}

interface DynamicsRow {
  partyId: string;
  decisions: number;
  genericEvents: number;
  partySpecificEvents: number;
  ideologySpecificEvents: number;
  partyOrIdeologySpecificEvents: number;
  allPartyPrefixedEvents: number;
  duplicateEventIds: number;
  categoriesSeen: number;
  playerAllianceCount: number;
  playerIdeologyMovement: number;
  actorMemoriesWithContent: number;
  candidateReplacements: number;
  initialUndecided: number;
  finalUndecided: number;
  visiblePollSumDeviation: number;
  regionTotalsDeviation: number;
}

const started = performance.now();
const rows: DynamicsRow[] = [];
const eventById = new Map(gameContent.events.map((event) => [event.id, event]));
const isIdeologySpecific = (eventId: string) => {
  const event = eventById.get(eventId);
  return Boolean(
    event &&
    ((event.requiredTags?.length ?? 0) > 0 ||
      (event.eligibleIdeologyFamilies?.length ?? 0) > 0 ||
      event.eligibility.some((condition) =>
        ["ideology", "ideology_family", "statement_exists", "contradiction_count"].includes(
          condition.kind,
        ),
      )),
  );
};
for (const party of gameContent.parties) {
  for (let seedIndex = 0; seedIndex < SEEDS; seedIndex += 1) {
    const seed = `audit-dynamics-${seedIndex}`;
    const method = gameContent.methods[seedIndex % gameContent.methods.length];
    if (!method) throw new Error("Missing campaign method.");
    let state = createGame(
      { seed, mode: "existing_party", partyId: party.id, methodId: method.id },
      gameContent,
    );
    const initialIdeology = { ...state.parties[party.id]!.ideology };
    const initialCandidateIds = Object.fromEntries(
      Object.values(state.parties).map((candidateParty) => [
        candidateParty.id,
        candidateParty.candidateId,
      ]),
    );
    const initialUndecided = averageUndecided(state);
    const eventIds: string[] = [];
    let guard = 0;
    while (state.phase !== "finished" && guard < 50) {
      const event = currentEvent(state, gameContent.events);
      const index =
        hashSeed(`${seed}:${state.decisionIndex}:${event.id}:dynamics-choice`) %
        event.choices.length;
      const choice = event.choices[index];
      if (!choice) throw new Error(`Missing choice for ${event.id}.`);
      eventIds.push(event.id);
      state = resolveCurrentChoice(state, choice.id, gameContent).state;
      guard += 1;
    }
    if (!state.finalResult || !state.firstRoundResult) throw new Error("Unfinished audit run.");
    const finalParty = state.parties[party.id]!;
    const ideologyMovement = Object.keys(initialIdeology).reduce(
      (sum, axis) =>
        sum +
        Math.abs(
          finalParty.ideology[axis as keyof typeof initialIdeology] -
            initialIdeology[axis as keyof typeof initialIdeology],
        ),
      0,
    );
    const replacements = Object.values(state.parties).filter(
      (candidateParty) =>
        initialCandidateIds[candidateParty.id] !== undefined &&
        initialCandidateIds[candidateParty.id] !== candidateParty.candidateId,
    ).length;
    const visiblePollSums = state.pollHistory.map((poll) =>
      Object.values(poll.results).reduce((sum, value) => sum + value, 0),
    );
    const partySpecificEventIds = eventIds.filter((id) => id.startsWith(`party_${party.id}_`));
    const ideologySpecificEventIds = eventIds.filter(isIdeologySpecific);
    rows.push({
      partyId: party.id,
      decisions: state.decisionIndex,
      genericEvents: eventIds.filter((id) => !id.startsWith("party_")).length,
      partySpecificEvents: partySpecificEventIds.length,
      ideologySpecificEvents: ideologySpecificEventIds.length,
      partyOrIdeologySpecificEvents: new Set([
        ...partySpecificEventIds,
        ...ideologySpecificEventIds,
      ]).size,
      allPartyPrefixedEvents: eventIds.filter((id) => id.startsWith("party_")).length,
      duplicateEventIds: eventIds.length - new Set(eventIds).size,
      categoriesSeen: Object.keys(state.categoryCounts).length,
      playerAllianceCount: finalParty.alliedWith.length,
      playerIdeologyMovement: ideologyMovement,
      actorMemoriesWithContent: state.actorMemories.length,
      candidateReplacements: replacements,
      initialUndecided,
      finalUndecided: averageUndecided(state),
      visiblePollSumDeviation: Math.max(0, ...visiblePollSums.map((sum) => Math.abs(sum - 100))),
      regionTotalsDeviation: Math.max(
        0,
        ...state.firstRoundResult.regionalResults.map((region) =>
          Math.abs(Object.values(region.results).reduce((sum, value) => sum + value, 0) - 100),
        ),
      ),
    });
  }
  console.log(`${party.id}: ${SEEDS} dynamics runs`);
}

const aggregate = (group: typeof rows) => ({
  runs: group.length,
  averageDecisions: mean(group.map((row) => row.decisions)),
  averageGenericEvents: mean(group.map((row) => row.genericEvents)),
  averagePartySpecificEvents: mean(group.map((row) => row.partySpecificEvents)),
  averagePartySpecificShare:
    mean(group.map((row) => row.partySpecificEvents / Math.max(row.decisions, 1))) * 100,
  averageIdeologySpecificEvents: mean(group.map((row) => row.ideologySpecificEvents)),
  averagePartyOrIdeologySpecificEvents: mean(group.map((row) => row.partyOrIdeologySpecificEvents)),
  averagePartyOrIdeologySpecificShare:
    mean(group.map((row) => row.partyOrIdeologySpecificEvents / Math.max(row.decisions, 1))) * 100,
  runsWithDuplicateEventIds: group.filter((row) => row.duplicateEventIds > 0).length,
  averageCategoriesSeen: mean(group.map((row) => row.categoriesSeen)),
  runsWithPlayerAlliance: group.filter((row) => row.playerAllianceCount > 0).length,
  maximumPlayerAlliances: Math.max(0, ...group.map((row) => row.playerAllianceCount)),
  runsWithIdeologyMovement: group.filter((row) => row.playerIdeologyMovement > 0).length,
  maximumIdeologyMovement: Math.max(0, ...group.map((row) => row.playerIdeologyMovement)),
  runsWithActorMemoryContent: group.filter((row) => row.actorMemoriesWithContent > 0).length,
  totalCandidateReplacements: group.reduce((sum, row) => sum + row.candidateReplacements, 0),
  averageInitialUndecidedByBloc: mean(group.map((row) => row.initialUndecided)),
  averageFinalUndecidedByBloc: mean(group.map((row) => row.finalUndecided)),
  maximumVisiblePollSumDeviation: Math.max(...group.map((row) => row.visiblePollSumDeviation)),
  maximumRegionalSumDeviation: Math.max(...group.map((row) => row.regionTotalsDeviation)),
});

const elapsed = performance.now() - started;
const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    seedsPerParty: SEEDS,
    totalRuns: rows.length,
    strategy: "deterministic pseudo-random choice per event",
    command: "npx tsx scripts/audit/campaign-dynamics-audit.ts",
  },
  overall: aggregate(rows),
  byParty: Object.fromEntries(
    gameContent.parties.map((party) => [
      party.id,
      aggregate(rows.filter((row) => row.partyId === party.id)),
    ]),
  ),
  performance: { durationMs: elapsed, runsPerSecond: rows.length / (elapsed / 1_000) },
};

const root = resolve(import.meta.dirname, "../..");
await mkdir(resolve(root, "audit"), { recursive: true });
await writeFile(
  resolve(root, process.env.AUDIT_DYNAMICS_OUTPUT ?? "audit/campaign-dynamics-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(report, null, 2));
