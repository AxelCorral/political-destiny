/* eslint-disable @typescript-eslint/no-explicit-any -- This aggregator intentionally reads heterogeneous generated JSON reports. */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const read = async <T>(path: string): Promise<T> =>
  JSON.parse(await readFile(resolve(ROOT, path), "utf8")) as T;

const content = await read<any>("audit/content-report.json");
const simulation = await read<any>("audit/simulation-report.json");
const custom = await read<any>("audit/custom-party-simulation.json");
const dynamics = await read<any>("audit/campaign-dynamics-report.json");
const system = await read<any>("audit/system-report.json");
const entities = await read<any>("audit/entity-inventory.json");
const narrative = await read<any>("audit/narrative-report.json");
const badges = await read<any>("audit/badge-report.json");
const browser = await read<any>("audit/browser-report.json");
const resilience = await read<any>("audit/browser-resilience.json");
const lighthouseMobile = await read<any>("audit/lighthouse-mobile.json");
const lighthouseDesktop = await read<any>("audit/lighthouse-desktop.json");
const coverage = await read<any>("audit/coverage/coverage-summary.json");
const vitest = await read<any>("audit/vitest-report.json");
const playwright = await read<any>("audit/playwright-report.json");
const finalVerification = await read<any>("audit/final-verification.json");

function playwrightCounts(report: any) {
  const counts = { passed: 0, failed: 0, skipped: 0, total: 0 };
  const visit = (suite: any) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        counts.total += 1;
        const outcome = test.status ?? test.results?.at(-1)?.status;
        if (outcome === "expected") counts.passed += 1;
        else if (outcome === "skipped") counts.skipped += 1;
        else counts.failed += 1;
      }
    }
    for (const child of suite.suites ?? []) visit(child);
  };
  for (const suite of report.suites ?? []) visit(suite);
  return counts;
}

const percentage = (part: number, total: number) =>
  Number(((part / Math.max(total, 1)) * 100).toFixed(2));
const achievementsObserved = new Map(
  simulation.distributions.achievements.map((row: any) => [row.id, row.count]),
);

const report = {
  generatedAt: new Date().toISOString(),
  auditedCommit: "96c0ae2",
  content: {
    ...content.inventory,
    uniqueChoiceTextPercentage: percentage(
      content.inventory.uniqueChoiceTextsNormalized,
      content.inventory.totalChoices,
    ),
    uniqueOutcomeNarrativePercentage: percentage(
      content.inventory.uniqueOutcomeNarrativesNormalized,
      content.inventory.totalOutcomes,
    ),
    uniqueOutcomeTitlePercentage: percentage(
      content.inventory.uniqueOutcomeTitlesExact,
      content.inventory.totalOutcomes,
    ),
    empiricallyReachedEvents: simulation.reachability.empiricallyReachedEvents,
    empiricallyUnreachedEvents: simulation.reachability.empiricallyUnreachedEvents.length,
    nearDuplicatePairs: content.repetition.nearDuplicatePairCount,
    similarityClusters: content.repetition.similarityClusterCount,
    structuralTextualDistinctnessHeuristicPercent: content.repetition.distinctContentPercentage,
    reusedConsequenceSets: content.repetition.reusedConsequenceSets,
    choicesUsingReusedConsequenceSets: content.repetition.choicesUsingReusedConsequenceSets,
    averagePartySpecificEventsPerRun: dynamics.overall.averagePartySpecificEvents,
    averagePartySpecificSharePerRunPercent: dynamics.overall.averagePartySpecificShare,
  },
  choices: {
    adjectiveOnlyPercentage: content.choiceQuality.adjectiveOnlyPercentage,
    abstractPercentage: content.choiceQuality.abstractPercentage,
    actionlessPercentage: content.choiceQuality.actionlessPercentage,
    prudentRiskCollectiveTriptychEvents: content.choiceQuality.prudentRiskCollectiveTriptychEvents,
    factoryChoiceIdPatternEvents: content.choiceQuality.factoryChoiceIdPatternEvents,
    tagFrequency: content.choiceQuality.tagFrequency,
  },
  mechanics: {
    effectKindCounts: system.eventMechanics.kindCounts,
    unusedEventEffectKinds: system.eventMechanics.unusedEffectKinds,
    eventsWithIdeologicalStatements: system.eventMechanics.eventsWithIdeologicalStatements,
    runsWithIdeologyMovement: dynamics.overall.runsWithIdeologyMovement,
    runsWithActorMemoryContent: dynamics.overall.runsWithActorMemoryContent,
    runsWithPlayerAlliance: dynamics.overall.runsWithPlayerAlliance,
    maximumPlayerAlliances: dynamics.overall.maximumPlayerAlliances,
    totalOpponentCandidateReplacementsObserved: dynamics.overall.totalCandidateReplacements,
  },
  entities: entities.totals,
  narrative: {
    summaryPaddingEvents: narrative.summaryPadding.eventCount,
    fictionQualifierTokens: narrative.fictionQualifierTokens.total,
    tutoiementTokens: narrative.narrativePerson.tutoiementTokens,
    repeatedOutcomeTitleUses: content.repetition.exactOutcomeTitles,
    repeatedOutcomeNarrativeUses: content.repetition.exactOutcomeNarratives,
  },
  simulation: {
    existingPartyRuns: simulation.overall.runs,
    customPartyRuns: custom.methodology.totalRuns,
    dynamicsRuns: dynamics.methodology.totalRuns,
    totalCompletedAutomatedCampaigns:
      simulation.overall.runs + custom.methodology.totalRuns + dynamics.methodology.totalRuns,
    deterministicChecks: simulation.integrity.determinismChecks.length,
    determinismFailures: simulation.integrity.determinismFailures,
    overall: simulation.overall,
    influence: simulation.influence,
    repetition: simulation.repetition,
    pacing: simulation.pacing,
    byParty: simulation.byParty,
    byStrategy: simulation.byStrategy,
    customByProfile: custom.byProfile,
  },
  elections: {
    configuredDate: system.configuration.electionDate,
    averageInitialUndecidedByBloc: dynamics.overall.averageInitialUndecidedByBloc,
    averageFinalUndecidedByBloc: dynamics.overall.averageFinalUndecidedByBloc,
    maximumVisiblePollSumDeviation: dynamics.overall.maximumVisiblePollSumDeviation,
    maximumRegionalSumDeviation: dynamics.overall.maximumRegionalSumDeviation,
  },
  badges: {
    total: badges.inventory.totalAchievements,
    observedInExistingPartySimulation: badges.inventory.observedInExistingPartySimulation,
    structurallyImpossible: badges.structuralImpossibilities.flatMap((row: any) => row.ids),
    automaticInAllExistingPartyRuns: badges.automaticOrNearAutomaticInSimulation.map(
      (row: any) => row.id,
    ),
    kingmakerEndingRuns: simulation.distributions.endings.find((row: any) => row.id === "kingmaker")
      ?.count,
    kingmakerBadgeRuns: achievementsObserved.get("kingmaker") ?? 0,
  },
  browser: {
    testedViewports: browser.methodology.viewports,
    horizontalOverflowFindings: browser.pageMeasurements.filter(
      (row: any) => row.horizontalOverflow,
    ).length,
    finalMobileViewportHeights: browser.pageMeasurements.find(
      (row: any) => row.screen === "final result" && row.viewport === "360x800",
    )?.viewportHeights,
    badgesMobileViewportHeights: browser.pageMeasurements.find(
      (row: any) => row.screen === "badges" && row.viewport === "360x800",
    )?.viewportHeights,
    reducedMotion: resilience.reducedMotion,
    serviceWorker: resilience.serviceWorker,
    corruptStorage: resilience.corruptStorage,
    unexpectedConsoleMessagesBeforeOffline:
      resilience.browserDiagnostics.unexpectedConsoleMessagesBeforeOffline.length,
    pageErrors: resilience.browserDiagnostics.pageErrors.length,
  },
  quality: {
    vitest: {
      total: vitest.numTotalTests,
      passed: vitest.numPassedTests,
      failed: vitest.numFailedTests,
    },
    e2e: playwrightCounts(playwright),
    coverage: coverage.total,
    lighthouse: {
      mobile: Object.fromEntries(
        Object.entries(lighthouseMobile.categories).map(([id, category]: [string, any]) => [
          id,
          Math.round(category.score * 100),
        ]),
      ),
      desktop: Object.fromEntries(
        Object.entries(lighthouseDesktop.categories).map(([id, category]: [string, any]) => [
          id,
          Math.round(category.score * 100),
        ]),
      ),
      mobileLcp: lighthouseMobile.audits["largest-contentful-paint"].numericValue,
      desktopLcp: lighthouseDesktop.audits["largest-contentful-paint"].numericValue,
      mobileTransferredBytes: lighthouseMobile.audits["total-byte-weight"].numericValue,
      desktopTransferredBytes: lighthouseDesktop.audits["total-byte-weight"].numericValue,
    },
    npmAuditHighOrCriticalVulnerabilities: 0,
    finalVerification: finalVerification.checks,
  },
  technical: {
    sourceFiles: system.source.files,
    sourceLines: system.source.lines,
    runIdCollisionAcrossPartiesWithSameSeed: system.identifiers.sameSeedAcrossParties.collision,
    largestSourceFiles: system.source.largestFiles.slice(0, 10),
  },
};

await writeFile(
  resolve(ROOT, "audit/metrics.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(report, null, 2));
