import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { GAME_CONFIG } from "../../src/config/game";
import { gameContent } from "../../src/game/data";

const ROOT = resolve(import.meta.dirname, "../..");
const simulation = JSON.parse(
  await readFile(resolve(ROOT, "audit/simulation-report.json"), "utf8"),
) as {
  distributions: {
    achievements: Array<{ id: string; count: number }>;
    endings: Array<{ id: string; count: number }>;
    finalScoreBuckets: Array<{ id: string; count: number }>;
  };
};

const observed = new Map(simulation.distributions.achievements.map((row) => [row.id, row.count]));
const endings = new Map(simulation.distributions.endings.map((row) => [row.id, row.count]));

const eventEffects = gameContent.events.flatMap((event) =>
  event.choices.flatMap((choice) =>
    choice.outcomeGroups.flatMap((outcome) => [
      ...outcome.effects,
      ...(outcome.delayedEffects ?? []).flatMap((delayed) => delayed.effects),
    ]),
  ),
);
const positiveMemberDeltas = eventEffects.flatMap((effect) =>
  effect.kind === "party_stat" && effect.stat === "members" && effect.delta > 0
    ? [effect.delta]
    : [],
);
const positiveFinanceDeltas = eventEffects.flatMap((effect) =>
  effect.kind === "party_stat" && effect.stat === "finances" && effect.delta > 0
    ? [effect.delta]
    : [],
);
const maximumInitialMembers = Math.max(
  ...gameContent.parties.map((party) => party.baseline.members),
);
const maximumInitialFinances = Math.max(
  ...gameContent.parties.map((party) => party.baseline.finances),
);
const maximumTargetDecisions =
  GAME_CONFIG.targetDecisionsBeforeFirstRound +
  GAME_CONFIG.targetDecisionsBetweenRounds +
  GAME_CONFIG.targetGovernmentDecisions;

const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    scope: "All 58 achievement definitions, production effects and the 5,400-run simulation.",
    command: "npx tsx scripts/audit/badge-audit.ts",
    caveat:
      "Absence in simulation is not by itself proof of impossibility; structural findings below include an independent code or upper-bound proof.",
  },
  inventory: {
    totalAchievements: gameContent.achievements.length,
    observedInExistingPartySimulation: observed.size,
    unobservedInExistingPartySimulation: gameContent.achievements
      .filter((achievement) => !observed.has(achievement.id))
      .map((achievement) => achievement.id),
  },
  structuralImpossibilities: [
    {
      ids: ["kingmaker", "secret_ending"],
      proof:
        "scoreGame calls evaluateAchievements with provisional.endingId='' before endingForState assigns the actual ending.",
      corroboration: {
        kingmakerEndingRuns: endings.get("kingmaker") ?? 0,
        kingmakerBadgeRuns: observed.get("kingmaker") ?? 0,
      },
    },
    {
      ids: ["historic_score", "perfect_campaign"],
      proof:
        "scoreGame calls evaluateAchievements with provisional.score=0 before summing the score breakdown.",
      corroboration: {
        runsInScoreBucket90To99:
          simulation.distributions.finalScoreBuckets.find((row) => row.id === "90-99")?.count ?? 0,
        historicScoreBadgeRuns: observed.get("historic_score") ?? 0,
        perfectCampaignBadgeRuns: observed.get("perfect_campaign") ?? 0,
      },
    },
    {
      ids: ["coalition"],
      proof:
        "Each existing party has one eligible party-specific alliance event and custom parties have none; the badge requires two allies.",
      corroboration: { maximumAlliancesObservedIn900DynamicRuns: 1 },
    },
    {
      ids: ["solvent"],
      proof:
        "The maximum initial finances are 73; production event effects contain no positive finance delta, while the badge requires 80.",
      corroboration: {
        maximumInitialFinances,
        positiveFinanceEffectCount: positiveFinanceDeltas.length,
      },
    },
    {
      ids: ["million_members"],
      proof:
        "Even the deliberately generous upper bound of applying the largest positive member delta at every target decision remains below one million.",
      corroboration: {
        maximumInitialMembers,
        largestPositiveMemberDelta: Math.max(0, ...positiveMemberDeltas),
        maximumTargetDecisions,
        generousUpperBound:
          maximumInitialMembers + maximumTargetDecisions * Math.max(0, ...positiveMemberDeltas),
      },
    },
  ],
  automaticOrNearAutomaticInSimulation: simulation.distributions.achievements.filter(
    (row) => row.count === 5_400,
  ),
  observedFrequency: simulation.distributions.achievements,
};

await mkdir(resolve(ROOT, "audit"), { recursive: true });
await writeFile(
  resolve(ROOT, "audit/badge-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(report, null, 2));
