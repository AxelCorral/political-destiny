import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data";
import { createGame, simulateFirstRound, simulateSecondRound } from "../../src/game/engine";
import type { GameState } from "../../src/game/types";

const SEEDS = Math.max(
  100,
  Math.min(2_000, Number.parseInt(process.env.AUDIT_ELECTION_SEEDS ?? "500", 10) || 500),
);
const FIRST_ROUND_RESULTS: Record<string, number> = {
  rn: 28,
  ps: 24,
  renaissance: 14,
  lfi: 12,
  lr: 8,
  ecologistes: 5,
  horizons: 4,
  reconquete: 3,
  nouvelle_energie: 2,
};

function baseState(seedIndex: number): GameState {
  const state = createGame(
    {
      seed: `audit-election-extreme-${seedIndex}`,
      mode: "existing_party",
      partyId: "ps",
      methodId: "field_first",
    },
    gameContent,
  );
  state.qualifiedPartyIds = ["ps", "rn"];
  state.firstRoundResult = {
    round: 1,
    date: state.electionDate,
    results: { ...FIRST_ROUND_RESULTS },
    ranking: Object.entries(FIRST_ROUND_RESULTS)
      .sort((left, right) => right[1] - left[1])
      .map(([id]) => id),
    regionalResults: [],
    turnout: 70,
  };
  return state;
}

const scenarios = {
  baseline: () => undefined,
  ps_allied_with_lfi: (state: GameState) => {
    state.parties.ps!.alliedWith = ["lfi"];
    state.parties.lfi!.alliedWith = ["ps"];
  },
  ps_rejection_100: (state: GameState) => {
    state.parties.ps!.stats.rejection = 100;
  },
  ps_transferability_100: (state: GameState) => {
    state.parties.ps!.hidden.transferability = 100;
  },
  ps_extreme_ideology: (state: GameState) => {
    state.parties.ps!.perceivedIdeology = {
      economy: 100,
      society: 100,
      europe: -100,
      ecology: -100,
      authority: 100,
      immigration: 100,
    };
  },
  identical_finalists: (state: GameState) => {
    const ps = state.parties.ps!;
    const rn = state.parties.rn!;
    rn.perceivedIdeology = { ...ps.perceivedIdeology };
    rn.stats = { ...ps.stats };
    rn.hidden = { ...ps.hidden };
    state.firstRoundResult!.results.ps = 25;
    state.firstRoundResult!.results.rn = 25;
  },
} satisfies Record<string, (state: GameState) => void>;

const results: Record<
  keyof typeof scenarios,
  Array<{ ps: number; rn: number; winner: string; turnout: number }>
> = Object.fromEntries(Object.keys(scenarios).map((id) => [id, []])) as never;

for (let seedIndex = 0; seedIndex < SEEDS; seedIndex += 1) {
  for (const [scenarioId, prepare] of Object.entries(scenarios) as Array<
    [keyof typeof scenarios, (state: GameState) => void]
  >) {
    const state = baseState(seedIndex);
    prepare(state);
    const { result, winnerPartyId } = simulateSecondRound(state, gameContent.electorateBlocs);
    results[scenarioId].push({
      ps: result.results.ps ?? 0,
      rn: result.results.rn ?? 0,
      winner: winnerPartyId,
      turnout: result.turnout,
    });
  }
}

let disqualifiedRnReceivedVotes = 0;
let invalidFirstRoundTotals = 0;
for (let seedIndex = 0; seedIndex < SEEDS; seedIndex += 1) {
  const state = createGame(
    {
      seed: `audit-disqualified-${seedIndex}`,
      mode: "existing_party",
      partyId: "ps",
      methodId: "field_first",
    },
    gameContent,
  );
  const rn = state.parties.rn!;
  state.actors[rn.candidateId]!.candidateStatus = "disqualified";
  const { result } = simulateFirstRound(state, gameContent.electorateBlocs);
  if ((result.results.rn ?? 0) > 0) disqualifiedRnReceivedVotes += 1;
  const total = Object.values(result.results).reduce((sum, value) => sum + value, 0);
  if (Math.abs(total - 100) > 1e-9) invalidFirstRoundTotals += 1;
}

const mean = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
const baselineMean = mean(results.baseline.map((row) => row.ps));
const summary = Object.fromEntries(
  (Object.keys(scenarios) as Array<keyof typeof scenarios>).map((scenarioId) => {
    const group = results[scenarioId];
    const psScores = group.map((row) => row.ps);
    return [
      scenarioId,
      {
        runs: group.length,
        averagePsScore: mean(psScores),
        averageDeltaFromBaseline: mean(psScores) - baselineMean,
        minimumPsScore: Math.min(...psScores),
        maximumPsScore: Math.max(...psScores),
        psWinRate: group.filter((row) => row.winner === "ps").length / group.length,
        exactFiftyFiftyCount: group.filter((row) => row.ps === 50 && row.rn === 50).length,
        exactTieWinners: Object.fromEntries(
          [
            ...new Set(
              group.filter((row) => row.ps === 50 && row.rn === 50).map((row) => row.winner),
            ),
          ].map((winner) => [
            winner,
            group.filter((row) => row.ps === 50 && row.rn === 50 && row.winner === winner).length,
          ]),
        ),
        uniqueTurnoutValues: [...new Set(group.map((row) => row.turnout))],
      },
    ];
  }),
);

const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    pairedSeeds: SEEDS,
    firstRoundFixture: FIRST_ROUND_RESULTS,
    finalists: ["ps", "rn"],
    command: "npx tsx scripts/audit/electoral-extremes.ts",
    limitation:
      "Counterfactual state mutations are audit fixtures; they do not alter production rules or content.",
  },
  secondRoundScenarios: summary,
  firstRoundIntegrity: {
    runsWithDisqualifiedRnReceivingVotes: disqualifiedRnReceivedVotes,
    runsWithNationalTotalDifferentFrom100: invalidFirstRoundTotals,
  },
};

const root = resolve(import.meta.dirname, "../..");
await mkdir(resolve(root, "audit"), { recursive: true });
await writeFile(
  resolve(root, "audit/electoral-extremes.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(report, null, 2));
