/**
 * TARGETED_GAMEPLAY_PASS_REPORT.md, Phase B (§7.4) — strict counterfactual
 * experiment for the three Horizons trajectories (continuity / rupture /
 * coalition): same party, same seed, same starting method, same decision
 * policy at every choice point EXCEPT the single fork at
 * party_horizons_founder_challenge, where the trajectory-defining choice is
 * forced. Everywhere else the policy is deterministic (always choice index
 * 0), so any divergence between the three runs of a given seed is
 * attributable to the trajectory itself, not to noise in later choices.
 *
 * Real engine only (createGame/currentEvent/resolveCurrentChoice), never a
 * reimplementation of the rules.
 *
 * Usage: npx tsx scripts/targeted-pass/horizons-counterfactual.ts [--seeds=N]
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

import { gameContent } from "../../src/game/data/index";
import {
  createGame,
  currentEvent,
  resolveCurrentChoice,
  validateGameState,
} from "../../src/game/engine/index";
import type { GameState } from "../../src/game/types/index";

const args = process.argv.slice(2);
const seedsArg = args.find((a) => a.startsWith("--seeds="));
const SEED_COUNT = seedsArg ? Number.parseInt(seedsArg.split("=")[1]!, 10) : 60;

const TRAJECTORY_CHOICE_ID: Record<"continuity" | "rupture" | "coalition", string> = {
  continuity: "horizons_founder_defer",
  rupture: "horizons_founder_break_free",
  coalition: "horizons_founder_role_split",
};

// Choices that "lean into" each trajectory whenever the event pool happens
// to surface them — used only by the --prefer variant below, never by the
// strict minimal-intervention counterfactual (playFixedPolicy).
const LEAN_IN_CHOICE_IDS: Record<"continuity" | "rupture" | "coalition", string[]> = {
  continuity: [
    "horizons_founder_defer",
    "horizons_continuity_grant_seats",
    "horizons_continuity_own_the_label",
    "horizons_blessing_amplify",
    "horizons_runoff_continuity_formalize",
  ],
  rupture: [
    "horizons_founder_break_free",
    "horizons_rupture_claim_it",
    "horizons_rupture_open_talks",
    "horizons_revenge_face_it",
    "horizons_runoff_rupture_lean_on_new_ally",
  ],
  coalition: [
    "horizons_founder_role_split",
    "horizons_coalition_accept_broad",
    "horizons_coalition_ambiguous_text",
    "horizons_runoff_coalition_full_display",
  ],
};

const PREFER_MODE = args.includes("--prefer");

function playFixedPolicy(seed: string, trajectory: "continuity" | "rupture" | "coalition") {
  const method = gameContent.methods[0]!;
  let state: GameState = createGame(
    { seed, mode: "existing_party", partyId: "horizons", methodId: method.id },
    gameContent,
  );
  let guard = 0;
  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, gameContent.events);
    let choice = event.choices[0]!;
    if (event.id === "party_horizons_founder_challenge") {
      choice =
        event.choices.find((c) => c.id === TRAJECTORY_CHOICE_ID[trajectory]) ?? event.choices[0]!;
    } else if (PREFER_MODE) {
      const preferred = event.choices.find((c) => LEAN_IN_CHOICE_IDS[trajectory].includes(c.id));
      if (preferred) choice = preferred;
    }
    state = resolveCurrentChoice(state, choice.id, gameContent).state;
    guard += 1;
  }
  return state;
}

interface RunSummary {
  seed: string;
  trajectory: string;
  valid: boolean;
  firstRoundScore: number;
  firstRoundRank: number;
  qualified: boolean;
  secondRoundOpponent: string | null;
  won: boolean;
  finalScore: number | null;
  transferability: number;
  alliedWithCount: number;
  alliedWith: string[];
  bestRelation: number;
  worstRelation: number;
  narrativeThreadCount: number;
  trajectoryEventsSeen: number;
}

function summarize(state: GameState, seed: string, trajectory: string): RunSummary {
  const validation = validateGameState(state);
  const own = state.parties.horizons;
  const relations = Object.values(state.partyRelations.horizons ?? {});
  const trajectoryEventIds = [
    "party_horizons_continuity_elders_dividend",
    "party_horizons_continuity_late_test",
    "party_horizons_runoff_continuity",
    "party_horizons_rupture_old_guard_distances",
    "party_horizons_rupture_new_courtship",
    "party_horizons_runoff_rupture",
    "party_horizons_coalition_outreach",
    "party_horizons_coalition_stretch_test",
    "party_horizons_runoff_coalition",
  ];
  const seenIds = new Set(state.decisionHistory.map((d) => d.eventId));
  return {
    seed,
    trajectory,
    valid: validation.valid,
    firstRoundScore: state.firstRoundResult?.results.horizons ?? 0,
    firstRoundRank: (state.firstRoundResult?.ranking.indexOf("horizons") ?? -2) + 1,
    qualified: Boolean(state.qualifiedPartyIds?.includes("horizons")),
    secondRoundOpponent:
      state.qualifiedPartyIds?.find((id) => id !== "horizons") ??
      (state.secondRoundResult
        ? (state.secondRoundResult.ranking.find((id) => id !== "horizons") ?? null)
        : null),
    won: state.secondRoundResult?.ranking[0] === "horizons",
    finalScore: state.finalResult?.score ?? null,
    transferability: own?.hidden.transferability ?? 0,
    alliedWithCount: own?.alliedWith.length ?? 0,
    alliedWith: own?.alliedWith ?? [],
    bestRelation: relations.length ? Math.max(...relations) : 0,
    worstRelation: relations.length ? Math.min(...relations) : 0,
    narrativeThreadCount: Object.keys(state.narrativeThreads).length,
    trajectoryEventsSeen: trajectoryEventIds.filter((id) => seenIds.has(id)).length,
  };
}

const rows: RunSummary[] = [];
for (let i = 0; i < SEED_COUNT; i += 1) {
  const seed = `horizons-cf-${i}`;
  for (const trajectory of ["continuity", "rupture", "coalition"] as const) {
    const state = playFixedPolicy(seed, trajectory);
    rows.push(summarize(state, seed, trajectory));
  }
}

const invalid = rows.filter((r) => !r.valid);
const bySeed = new Map<string, RunSummary[]>();
for (const row of rows) {
  const list = bySeed.get(row.seed) ?? [];
  list.push(row);
  bySeed.set(row.seed, list);
}

let outcomeDivergentSeeds = 0;
let opponentDivergentSeeds = 0;
let scoreDivergenceSum = 0;
let scoreDivergenceCount = 0;
for (const [, group] of bySeed) {
  const qualifiedSet = new Set(group.map((r) => r.qualified));
  const wonSet = new Set(group.map((r) => r.won));
  if (qualifiedSet.size > 1 || wonSet.size > 1) outcomeDivergentSeeds += 1;
  const opponents = new Set(group.map((r) => r.secondRoundOpponent).filter(Boolean));
  if (opponents.size > 1) opponentDivergentSeeds += 1;
  const scores = group.map((r) => r.firstRoundScore).filter((s) => s > 0);
  if (scores.length >= 2) {
    scoreDivergenceSum += Math.max(...scores) - Math.min(...scores);
    scoreDivergenceCount += 1;
  }
}

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

const byTrajectory = (["continuity", "rupture", "coalition"] as const).map((trajectory) => {
  const group = rows.filter((r) => r.trajectory === trajectory);
  return {
    trajectory,
    n: group.length,
    qualificationRate: mean(group.map((r) => (r.qualified ? 1 : 0))),
    victoryRate: mean(group.map((r) => (r.won ? 1 : 0))),
    meanFirstRoundScore: Number(mean(group.map((r) => r.firstRoundScore)).toFixed(2)),
    meanTransferability: Number(mean(group.map((r) => r.transferability)).toFixed(2)),
    meanAlliedWithCount: Number(mean(group.map((r) => r.alliedWithCount)).toFixed(2)),
    meanBestRelation: Number(mean(group.map((r) => r.bestRelation)).toFixed(2)),
    meanWorstRelation: Number(mean(group.map((r) => r.worstRelation)).toFixed(2)),
    meanFinalScore: Number(
      mean(group.filter((r) => r.finalScore !== null).map((r) => r.finalScore!)).toFixed(2),
    ),
    trajectoryContentReachRate: mean(group.map((r) => (r.trajectoryEventsSeen > 0 ? 1 : 0))),
  };
});

const summary = {
  seedCount: SEED_COUNT,
  totalRuns: rows.length,
  invalidRuns: invalid.length,
  outcomeDivergentSeedsShare: Number((outcomeDivergentSeeds / bySeed.size).toFixed(3)),
  opponentDivergentSeedsShare: Number((opponentDivergentSeeds / bySeed.size).toFixed(3)),
  meanFirstRoundScoreSpreadPerSeed: Number(
    (scoreDivergenceCount ? scoreDivergenceSum / scoreDivergenceCount : 0).toFixed(3),
  ),
  byTrajectory,
};

console.log(JSON.stringify(summary, null, 2));

const outDir = path.join(process.cwd(), "audit-results", "targeted-pass", "post");
const suffix = PREFER_MODE ? "-prefer" : "-strict";
writeFileSync(
  path.join(outDir, `horizons-counterfactual-summary${suffix}.json`),
  JSON.stringify(summary, null, 2),
);
const header = Object.keys(rows[0]!).join(",");
const csv = [
  header,
  ...rows.map((row) =>
    Object.values(row)
      .map((v) => (Array.isArray(v) ? `"${v.join("|")}"` : v))
      .join(","),
  ),
].join("\n");
writeFileSync(path.join(outDir, `horizons-counterfactual-runs${suffix}.csv`), csv);
console.log(
  `\nÉcrit : ${outDir}/horizons-counterfactual-summary${suffix}.json et -runs${suffix}.csv`,
);
