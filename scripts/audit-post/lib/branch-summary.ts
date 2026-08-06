import { mean, median } from "./stats";

export interface CounterfactualRow {
  partyId: string;
  seedIndex: string | number;
  followUpAgent: string;
  finalScore: string | number;
  finalFirstRoundScore: string | number;
  finalQualified: string | boolean;
  finalWon: string | boolean;
  scoreAtCheckpointPlus0: string | number;
  scoreAtCheckpointPlus3: string | number;
  scoreAtCheckpointPlus8: string | number;
}

export interface BranchSummary {
  available: boolean;
  branchGroups: number;
  totalBranches: number;
  averageFinalScoreRange: number;
  medianFinalScoreRange: number;
  averageFirstRoundRange: number;
  averagePlus0Range: number;
  medianPlus0Range: number;
  shareOfGroupsWithZeroPlus0Range: number;
  averagePlus3Range: number;
  averagePlus8Range: number;
  shareWhereOutcomeChanged: number;
}

const toNumber = (value: string | number): number =>
  typeof value === "number" ? value : Number.parseFloat(value) || 0;

/**
 * Aggregates raw counterfactual branch rows (same game state, one choice
 * differs) into range-of-divergence statistics per horizon. Pure function so
 * the P6 regression (the immediate-horizon chart used to plot a hardcoded 0
 * instead of this value) can be unit tested directly.
 */
export function computeBranchSummary(rows: CounterfactualRow[]): BranchSummary {
  if (rows.length === 0) {
    return {
      available: false,
      branchGroups: 0,
      totalBranches: 0,
      averageFinalScoreRange: 0,
      medianFinalScoreRange: 0,
      averageFirstRoundRange: 0,
      averagePlus0Range: 0,
      medianPlus0Range: 0,
      shareOfGroupsWithZeroPlus0Range: 0,
      averagePlus3Range: 0,
      averagePlus8Range: 0,
      shareWhereOutcomeChanged: 0,
    };
  }

  const groups = new Map<string, CounterfactualRow[]>();
  for (const row of rows) {
    const key = `${row.partyId}:${row.seedIndex}:${row.followUpAgent}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  const divergences = [...groups.values()]
    .filter((group) => group.length >= 2)
    .map((group) => {
      const finals = group.map((r) => toNumber(r.finalScore));
      const firstRounds = group.map((r) => toNumber(r.finalFirstRoundScore));
      const plus0 = group.map((r) => toNumber(r.scoreAtCheckpointPlus0));
      const plus3 = group.map((r) => toNumber(r.scoreAtCheckpointPlus3));
      const plus8 = group.map((r) => toNumber(r.scoreAtCheckpointPlus8));
      const outcomes = new Set(
        group.map((r) => `${String(r.finalQualified)}:${String(r.finalWon)}`),
      );
      return {
        finalScoreRange: Math.max(...finals) - Math.min(...finals),
        firstRoundRange: Math.max(...firstRounds) - Math.min(...firstRounds),
        plus0Range: Math.max(...plus0) - Math.min(...plus0),
        plus3Range: Math.max(...plus3) - Math.min(...plus3),
        plus8Range: Math.max(...plus8) - Math.min(...plus8),
        outcomeChanged: outcomes.size > 1,
      };
    });

  if (divergences.length === 0) {
    return {
      available: true,
      branchGroups: 0,
      totalBranches: rows.length,
      averageFinalScoreRange: 0,
      medianFinalScoreRange: 0,
      averageFirstRoundRange: 0,
      averagePlus0Range: 0,
      medianPlus0Range: 0,
      shareOfGroupsWithZeroPlus0Range: 0,
      averagePlus3Range: 0,
      averagePlus8Range: 0,
      shareWhereOutcomeChanged: 0,
    };
  }

  return {
    available: true,
    branchGroups: divergences.length,
    totalBranches: rows.length,
    averageFinalScoreRange: Number(mean(divergences.map((d) => d.finalScoreRange)).toFixed(2)),
    medianFinalScoreRange: Number(median(divergences.map((d) => d.finalScoreRange)).toFixed(2)),
    averageFirstRoundRange: Number(mean(divergences.map((d) => d.firstRoundRange)).toFixed(2)),
    averagePlus0Range: Number(mean(divergences.map((d) => d.plus0Range)).toFixed(4)),
    medianPlus0Range: Number(median(divergences.map((d) => d.plus0Range)).toFixed(4)),
    shareOfGroupsWithZeroPlus0Range: Number(
      (divergences.filter((d) => d.plus0Range === 0).length / divergences.length).toFixed(3),
    ),
    averagePlus3Range: Number(mean(divergences.map((d) => d.plus3Range)).toFixed(2)),
    averagePlus8Range: Number(mean(divergences.map((d) => d.plus8Range)).toFixed(2)),
    shareWhereOutcomeChanged: Number(
      (divergences.filter((d) => d.outcomeChanged).length / divergences.length).toFixed(3),
    ),
  };
}
