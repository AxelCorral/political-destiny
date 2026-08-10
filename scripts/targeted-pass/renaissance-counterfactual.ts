/**
 * TARGETED_GAMEPLAY_PASS_REPORT.md §13 — same-seed counterfactual for
 * Renaissance's three narrative axes (heritage / generation renewal /
 * network-autonomy). Same seed, same starting method, deterministic
 * "always choice 0" policy everywhere except the axis-defining fork, to
 * isolate each axis's causal effect on diversity of outcome the same way
 * scripts/targeted-pass/horizons-counterfactual.ts does for Horizons.
 *
 * Usage: npx tsx scripts/targeted-pass/renaissance-counterfactual.ts [--seeds=N]
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";
import type { GameState } from "../../src/game/types/index";

const args = process.argv.slice(2);
const seedsArg = args.find((a) => a.startsWith("--seeds="));
const SEED_COUNT = seedsArg ? Number.parseInt(seedsArg.split("=")[1]!, 10) : 60;

type Axis = "heritage" | "generation" | "network_autonomy" | "baseline";

function playAxis(seed: string, axis: Axis): GameState {
  const method = gameContent.methods[0]!;
  let state: GameState = createGame(
    { seed, mode: "existing_party", partyId: "renaissance", methodId: method.id },
    gameContent,
  );
  let guard = 0;
  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, gameContent.events);
    let choice = event.choices[0]!;
    if (axis === "heritage" && event.id === "party_renaissance_legacy_test") {
      choice = event.choices.find((c) => c.id === "renaissance_legacy_own_gaps") ?? choice;
    } else if (axis === "generation" && event.id === "party_renaissance_identity") {
      choice = event.choices.find((c) => c.id === "renaissance_identity_new_cycle") ?? choice;
    } else if (axis === "generation" && event.id === "party_renaissance_generation_test") {
      choice = event.choices.find((c) => c.id === "renaissance_generation_delegate") ?? choice;
    } else if (
      axis === "network_autonomy" &&
      event.id === "party_renaissance_network_or_autonomy"
    ) {
      choice = event.choices.find((c) => c.id === "renaissance_network_build_autonomous") ?? choice;
    }
    state = resolveCurrentChoice(state, choice.id, gameContent).state;
    guard += 1;
  }
  return state;
}

interface RunSummary {
  seed: string;
  axis: Axis;
  finalScore: number | null;
  qualified: boolean;
  won: boolean;
  axisEventsSeen: number;
  distinctSpecificEventsSeen: number;
}

const AXIS_EVENT_IDS: Record<Exclude<Axis, "baseline">, string[]> = {
  heritage: [
    "party_renaissance_legacy_test",
    "party_renaissance_legacy_confronted",
    "party_renaissance_legacy_credited",
  ],
  generation: ["party_renaissance_generation_test", "party_renaissance_generation_payoff"],
  network_autonomy: ["party_renaissance_network_or_autonomy"],
};

const rows: RunSummary[] = [];
const axes: Axis[] = ["heritage", "generation", "network_autonomy"];
for (let i = 0; i < SEED_COUNT; i += 1) {
  const seed = `renaissance-cf-${i}`;
  for (const axis of axes) {
    const state = playAxis(seed, axis);
    const seenIds = new Set(state.decisionHistory.map((d) => d.eventId));
    const axisEventsSeen = AXIS_EVENT_IDS[axis as Exclude<Axis, "baseline">].filter((id) =>
      seenIds.has(id),
    ).length;
    const specificIds = gameContent.events
      .filter((e) => e.category === "party" && e.eligibleParties?.includes("renaissance"))
      .map((e) => e.id);
    rows.push({
      seed,
      axis,
      finalScore: state.finalResult?.score ?? null,
      qualified: Boolean(state.qualifiedPartyIds?.includes("renaissance")),
      won: state.secondRoundResult?.ranking[0] === "renaissance",
      axisEventsSeen,
      distinctSpecificEventsSeen: specificIds.filter((id) => seenIds.has(id)).length,
    });
  }
}

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

const byAxis = axes.map((axis) => {
  const group = rows.filter((r) => r.axis === axis);
  return {
    axis,
    n: group.length,
    axisContentReachRate: Number(mean(group.map((r) => (r.axisEventsSeen > 0 ? 1 : 0))).toFixed(3)),
    meanFinalScore: Number(
      mean(group.filter((r) => r.finalScore !== null).map((r) => r.finalScore!)).toFixed(2),
    ),
    qualificationRate: Number(mean(group.map((r) => (r.qualified ? 1 : 0))).toFixed(3)),
    victoryRate: Number(mean(group.map((r) => (r.won ? 1 : 0))).toFixed(3)),
    meanDistinctSpecificEventsSeen: Number(
      mean(group.map((r) => r.distinctSpecificEventsSeen)).toFixed(2),
    ),
  };
});

// Diversity check: for each seed, do the 3 axes lead to visibly different
// timelines (measured as Jaccard distance between the sets of Renaissance-
// specific events encountered)?
let jaccardSum = 0;
let pairCount = 0;
const bySeed = new Map<string, RunSummary[]>();
for (const row of rows) {
  const list = bySeed.get(row.seed) ?? [];
  list.push(row);
  bySeed.set(row.seed, list);
}
for (const [seed, group] of bySeed) {
  for (let i = 0; i < group.length; i += 1) {
    for (let j = i + 1; j < group.length; j += 1) {
      const stateA = playAxis(seed, group[i]!.axis);
      const stateB = playAxis(seed, group[j]!.axis);
      const idsA = new Set(stateA.decisionHistory.map((d) => d.eventId));
      const idsB = new Set(stateB.decisionHistory.map((d) => d.eventId));
      const union = new Set([...idsA, ...idsB]);
      const intersection = [...idsA].filter((id) => idsB.has(id));
      const jaccard = union.size ? 1 - intersection.length / union.size : 0;
      jaccardSum += jaccard;
      pairCount += 1;
    }
  }
}

const summary = {
  seedCount: SEED_COUNT,
  byAxis,
  meanTimelineDivergenceJaccard: Number((jaccardSum / pairCount).toFixed(3)),
};

console.log(JSON.stringify(summary, null, 2));
const outDir = path.join(process.cwd(), "audit-results", "targeted-pass", "post");
writeFileSync(
  path.join(outDir, "renaissance-counterfactual-summary.json"),
  JSON.stringify(summary, null, 2),
);
