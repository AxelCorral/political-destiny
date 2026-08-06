import { describe, expect, it } from "vitest";

import { computeBranchSummary, type CounterfactualRow } from "../branch-summary";

function row(overrides: Partial<CounterfactualRow>): CounterfactualRow {
  return {
    partyId: "ps",
    seedIndex: 0,
    followUpAgent: "aleatoire",
    finalScore: 70,
    finalFirstRoundScore: 15,
    finalQualified: "true",
    finalWon: "false",
    scoreAtCheckpointPlus0: 10,
    scoreAtCheckpointPlus3: 10,
    scoreAtCheckpointPlus8: 10,
    ...overrides,
  };
}

describe("computeBranchSummary", () => {
  it("returns an empty-but-valid summary for zero rows (no division by zero)", () => {
    const summary = computeBranchSummary([]);
    expect(summary.available).toBe(false);
    expect(summary.branchGroups).toBe(0);
    expect(summary.averagePlus0Range).toBe(0);
  });

  it("computes a non-zero immediate-horizon range when the branches actually diverge immediately — regression test for the P6 hardcoded-0 chart bug", () => {
    // Same checkpoint (party/seed/agent), two branches from two different
    // choices: their scoreAtCheckpointPlus0 differ by construction (that's
    // the whole point of resolving each option separately). The chart used
    // to plot a literal `0` for this horizon regardless of the data.
    const rows: CounterfactualRow[] = [
      row({ scoreAtCheckpointPlus0: 12.5 }),
      row({ scoreAtCheckpointPlus0: 12.8 }),
    ];
    const summary = computeBranchSummary(rows);
    expect(summary.available).toBe(true);
    expect(summary.branchGroups).toBe(1);
    expect(summary.averagePlus0Range).toBeCloseTo(0.3, 5);
    expect(summary.shareOfGroupsWithZeroPlus0Range).toBe(0);
  });

  it("reports shareOfGroupsWithZeroPlus0Range = 1 only when every group is genuinely identical at checkpoint+0", () => {
    const rows: CounterfactualRow[] = [
      row({ partyId: "ps", scoreAtCheckpointPlus0: 10 }),
      row({ partyId: "ps", scoreAtCheckpointPlus0: 10 }),
    ];
    const summary = computeBranchSummary(rows);
    expect(summary.shareOfGroupsWithZeroPlus0Range).toBe(1);
  });

  it("detects an outcome change (qualification/victory) within a branch group", () => {
    const rows: CounterfactualRow[] = [
      row({ finalQualified: "true", finalWon: "false" }),
      row({ finalQualified: "false", finalWon: "false" }),
    ];
    const summary = computeBranchSummary(rows);
    expect(summary.shareWhereOutcomeChanged).toBe(1);
  });

  it("ignores groups with a single row (nothing to compare)", () => {
    const rows: CounterfactualRow[] = [row({ partyId: "lonely" })];
    const summary = computeBranchSummary(rows);
    expect(summary.branchGroups).toBe(0);
  });
});
