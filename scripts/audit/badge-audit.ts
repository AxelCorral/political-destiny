import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data";
import { validateContentQuality } from "../../src/game/data/qualityValidation";

interface FrequencyRow {
  id: string;
  count: number;
}

interface SimulationReport {
  methodology: { totalRuns: number };
  distributions: {
    achievements: FrequencyRow[];
    endings: FrequencyRow[];
    finalScoreBuckets: FrequencyRow[];
  };
}

const ROOT = resolve(import.meta.dirname, "../..");
const input = resolve(ROOT, process.env.AUDIT_BADGE_SIM_INPUT ?? "audit/v2-simulation-report.json");
const output = resolve(ROOT, process.env.AUDIT_BADGE_OUTPUT ?? "audit/v2-badge-report.json");
const simulation = JSON.parse(await readFile(input, "utf8")) as SimulationReport;
const observed = new Map(simulation.distributions.achievements.map((row) => [row.id, row.count]));
const endingCounts = new Map(simulation.distributions.endings.map((row) => [row.id, row.count]));
const quality = validateContentQuality(gameContent);

const endingBadgeChecks = gameContent.achievements
  .filter((achievement) =>
    achievement.criteria?.conditions.some((condition) => condition.metric === "ending_id"),
  )
  .map((achievement) => {
    const endingIds =
      achievement.criteria?.conditions
        .filter((condition) => condition.metric === "ending_id")
        .map((condition) => String(condition.value)) ?? [];
    return {
      achievementId: achievement.id,
      endingIds,
      matchingEndingRuns: endingIds.reduce(
        (total, endingId) => total + (endingCounts.get(endingId) ?? 0),
        0,
      ),
      unlockedRuns: observed.get(achievement.id) ?? 0,
    };
  });

const structuralErrors = quality.errors.filter((error) => /succès|seuil impossible/iu.test(error));
const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    scope: "All production achievement criteria plus the paired V2 simulation.",
    simulationRuns: simulation.methodology.totalRuns,
    command: "npx tsx scripts/audit/badge-audit.ts",
    caveat:
      "An unobserved badge is not considered impossible unless the structural validator proves that its criterion or reference cannot be reached.",
  },
  inventory: {
    totalAchievements: gameContent.achievements.length,
    withTypedCriteria: gameContent.achievements.filter(
      (achievement) => (achievement.criteria?.conditions.length ?? 0) > 0,
    ).length,
    observedInExistingPartySimulation: observed.size,
    unobservedInExistingPartySimulation: gameContent.achievements
      .filter((achievement) => !observed.has(achievement.id))
      .map((achievement) => achievement.id),
  },
  structuralImpossibilities: structuralErrors,
  automaticOrNearAutomaticInSimulation: simulation.distributions.achievements.filter(
    (row) => row.count / Math.max(simulation.methodology.totalRuns, 1) >= 0.98,
  ),
  endingBadgeChecks,
  observedFrequency: simulation.distributions.achievements,
};

await mkdir(resolve(ROOT, "audit"), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify(
    {
      ...report.inventory,
      structuralImpossibilities: structuralErrors.length,
      automaticOrNearAutomatic: report.automaticOrNearAutomaticInSimulation.length,
    },
    null,
    2,
  ),
);
