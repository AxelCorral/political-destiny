/**
 * Post-corrections audit — statistical analysis (sections 11, 12, 13, 14, 15,
 * 16). Consumes the raw CSV output of simulate.ts and branch-experiment.ts;
 * does not run the engine itself.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { computeBranchSummary, type CounterfactualRow } from "./lib/branch-summary";
import { bool, num, parseCsv, str, toCsv } from "./lib/csv";
import {
  bootstrapCI,
  cramersV,
  etaSquaredOneWay,
  frequency,
  mean,
  median,
  percentile,
  stddev,
  twoWayAnova,
} from "./lib/stats";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results");

async function readCsv(name: string): Promise<Record<string, string>[]> {
  const text = await readFile(resolve(OUT_DIR, name), "utf8");
  return parseCsv(text);
}

const rawRuns = await readCsv("raw-runs.csv");
const decisions = await readCsv("decisions.csv");
const worldEvents = await readCsv("world-events.csv");
const ideology = await readCsv("ideology-trajectories.csv");
let counterfactuals: Record<string, string>[] = [];
try {
  counterfactuals = await readCsv("counterfactuals.csv");
} catch {
  counterfactuals = [];
}

const existingRuns = rawRuns.filter((r) => r.partyKind === "existing");
const customRuns = rawRuns.filter((r) => r.partyKind === "custom");

// --- P1: surperformance vs baseline neutre du parti -------------------------
// Option B (§8 du prompt post-audit) : le delta brut/normalisé reste dominé
// par la trajectoire "typique" propre à chaque parti (son socle, son
// potentiel, les événements qu'il croise), même une fois normalisé par la
// marge atteignable — cette trajectoire moyenne diffère déjà d'un parti à
// l'autre indépendamment de l'agent. Pour isoler ce que l'agent apporte
// spécifiquement, on retranche à chaque partie la progression normalisée
// MOYENNE obtenue par l'agent "aleatoire" pour CE MÊME parti : ce qui reste
// est la sur/sous-performance imputable à la stratégie de décision, pas à
// l'identité du parti.
const neutralBaselineByParty = new Map<string, number>();
for (const partyId of new Set(existingRuns.map((r) => str(r.partyId)))) {
  const neutralRuns = existingRuns.filter(
    (r) => str(r.partyId) === partyId && str(r.agent) === "aleatoire",
  );
  neutralBaselineByParty.set(
    partyId,
    neutralRuns.length ? mean(neutralRuns.map((r) => num(r.progressionNormalized))) : 0,
  );
}
for (const run of existingRuns) {
  const baseline = neutralBaselineByParty.get(str(run.partyId)) ?? 0;
  run.overperformanceVsNeutral = String(num(run.progressionNormalized) - baseline);
}

// --- 11. Variance decomposition (party x agent) -----------------------------

const metrics: Array<{ key: string; label: string }> = [
  { key: "firstRoundScore", label: "Score au premier tour" },
  { key: "finalScore", label: "Score final (/100)" },
  { key: "progression", label: "Progression vs sondage initial (brute, points)" },
  {
    key: "progressionNormalized",
    label: "Progression normalisée (part de la marge atteignable, P1)",
  },
  {
    key: "overperformanceVsNeutral",
    label: "Sur/sous-performance vs baseline neutre du parti (P1, audit uniquement)",
  },
];

const anovaRows = metrics.map(({ key, label }) => {
  const anova = twoWayAnova(
    existingRuns,
    (r) => str(r.partyId),
    (r) => str(r.agent),
    (r) => num(r[key]),
  );
  return {
    metric: key,
    label,
    etaSquaredParty: Number(anova.etaSquaredA.toFixed(4)),
    etaSquaredAgent: Number(anova.etaSquaredB.toFixed(4)),
    etaSquaredInteraction: Number(anova.etaSquaredInteraction.toFixed(4)),
    etaSquaredResidual: Number(anova.etaSquaredResidual.toFixed(4)),
    partialEtaSquaredParty: Number(anova.partialEtaSquaredA.toFixed(4)),
    partialEtaSquaredAgent: Number(anova.partialEtaSquaredB.toFixed(4)),
    balancedDesign: anova.balanced,
  };
});

const bootstrapPartyEta = bootstrapCI(
  existingRuns,
  (sample) =>
    etaSquaredOneWay(
      sample,
      (r) => str(r.partyId),
      (r) => num(r.firstRoundScore),
    ),
  500,
  42,
);
const bootstrapAgentEta = bootstrapCI(
  existingRuns,
  (sample) =>
    etaSquaredOneWay(
      sample,
      (r) => str(r.agent),
      (r) => num(r.firstRoundScore),
    ),
  500,
  43,
);

const cramersVQualifiedByParty = cramersV(
  existingRuns,
  (r) => str(r.partyId),
  (r) => str(r.qualified),
);
const cramersVQualifiedByAgent = cramersV(
  existingRuns,
  (r) => str(r.agent),
  (r) => str(r.qualified),
);
const cramersVWonByParty = cramersV(
  existingRuns,
  (r) => str(r.partyId),
  (r) => str(r.won),
);
const cramersVWonByAgent = cramersV(
  existingRuns,
  (r) => str(r.agent),
  (r) => str(r.won),
);

// Matched-pairs: same party + seedIndex, compare across agents (this is the
// existing-parties grid's own counterfactual structure — every cell shares a
// seed with every other agent for the same party).
const matchedGroups = new Map<string, Record<string, string>[]>();
for (const run of existingRuns) {
  const key = `${run.partyId}:${run.seedIndex}`;
  matchedGroups.set(key, [...(matchedGroups.get(key) ?? []), run]);
}
const matchedRows = [...matchedGroups.entries()]
  .filter(([, group]) => group.length >= 2)
  .map(([key, group]) => {
    const scores = group.map((r) => num(r.firstRoundScore));
    const finals = group.map((r) => num(r.finalScore));
    const outcomes = new Set(group.map((r) => `${r.qualified}:${r.won}`));
    return {
      key,
      firstRoundRange: Math.max(...scores) - Math.min(...scores),
      finalScoreRange: Math.max(...finals) - Math.min(...finals),
      outcomeChanged: outcomes.size > 1,
    };
  });

// "Can a great run with a hard party beat a bad run with a favorite party?"
const partyAverageFirstRound = new Map<string, number>();
for (const party of new Set(existingRuns.map((r) => str(r.partyId)))) {
  partyAverageFirstRound.set(
    party,
    mean(existingRuns.filter((r) => r.partyId === party).map((r) => num(r.firstRoundScore))),
  );
}
const rankedParties = [...partyAverageFirstRound.entries()].sort((a, b) => b[1] - a[1]);
const favoriteParty = rankedParties[0]?.[0];
const underdogParty = rankedParties[rankedParties.length - 1]?.[0];
const favoriteRuns = existingRuns.filter((r) => r.partyId === favoriteParty);
const underdogRuns = existingRuns.filter((r) => r.partyId === underdogParty);
const favoriteWorstDecile = percentile(
  favoriteRuns.map((r) => num(r.finalScore)),
  0.1,
);
const underdogBestDecile = percentile(
  underdogRuns.map((r) => num(r.finalScore)),
  0.9,
);
const underdogBeatsFavoriteCount = underdogRuns.filter(
  (r) => num(r.finalScore) > favoriteWorstDecile,
).length;
const underdogBeatsFavoriteRate = underdogRuns.length
  ? underdogBeatsFavoriteCount / underdogRuns.length
  : 0;

await mkdir(OUT_DIR, { recursive: true });
await writeFile(resolve(OUT_DIR, "variance-decomposition.csv"), toCsv(anovaRows), "utf8");

// --- 12. Choice strength (correlational, not causal — see report caveats) ---

interface ChoiceAgg {
  eventId: string;
  choiceId: string;
  choiceTag: string;
  n: number;
  avgFinalScore: number;
  avgQualified: number;
  avgWon: number;
}
const decisionsByEventChoice = new Map<string, { rows: Record<string, string>[]; tag: string }>();
const runByKey = new Map(rawRuns.map((r) => [`${r.partyId}:${r.agent}:${r.seedIndex}`, r]));
for (const decision of decisions) {
  const key = `${decision.eventId}::${decision.choiceId}`;
  if (!decisionsByEventChoice.has(key))
    decisionsByEventChoice.set(key, { rows: [], tag: str(decision.choiceTag) });
  decisionsByEventChoice.get(key)!.rows.push(decision);
}
const choiceStrength: ChoiceAgg[] = [...decisionsByEventChoice.entries()]
  .map(([key, { rows, tag }]) => {
    const [eventId, choiceId] = key.split("::");
    const linkedRuns = rows
      .map((d) => runByKey.get(str(d.runKey)))
      .filter((r): r is Record<string, string> => Boolean(r));
    return {
      eventId: eventId!,
      choiceId: choiceId!,
      choiceTag: tag,
      n: linkedRuns.length,
      avgFinalScore: Number(mean(linkedRuns.map((r) => num(r.finalScore))).toFixed(2)),
      avgQualified: Number(mean(linkedRuns.map((r) => Number(bool(r.qualified)))).toFixed(3)),
      avgWon: Number(mean(linkedRuns.map((r) => Number(bool(r.won)))).toFixed(3)),
    };
  })
  .filter((row) => row.n >= 15);

const choiceStrengthByEvent = new Map<string, ChoiceAgg[]>();
for (const row of choiceStrength) {
  choiceStrengthByEvent.set(row.eventId, [...(choiceStrengthByEvent.get(row.eventId) ?? []), row]);
}
const dominantOptionEvents = [...choiceStrengthByEvent.entries()]
  .filter(([, options]) => options.length >= 2)
  .map(([eventId, options]) => {
    const sorted = [...options].sort((a, b) => b.avgFinalScore - a.avgFinalScore);
    const spread =
      (sorted[0]?.avgFinalScore ?? 0) - (sorted[sorted.length - 1]?.avgFinalScore ?? 0);
    return {
      eventId,
      spread,
      best: sorted[0],
      worst: sorted[sorted.length - 1],
      optionCount: options.length,
    };
  })
  .sort((a, b) => b.spread - a.spread);

await writeFile(
  resolve(OUT_DIR, "choice-strength.csv"),
  toCsv(choiceStrength as unknown as Record<string, unknown>[]),
  "utf8",
);

// --- 13/14/15. Memory, world, ideology --------------------------------------

const worldEventKindFrequency = frequency(worldEvents.map((w) => str(w.kind)));
const runsWithAtLeastOneRecall = existingRuns.filter((r) => num(r.actorMemoryEntries) > 0).length;
const runsWithContradiction = existingRuns.filter((r) => num(r.contradictionCount) > 0).length;
const runsWithAbruptReversal = existingRuns.filter((r) => num(r.abruptReversalCount) > 0).length;
const runsWithReplacement = existingRuns.filter((r) => num(r.candidateReplacements) > 0).length;
const runsWithAlliance = existingRuns.filter((r) => num(r.alliancesFormed) > 0).length;
const runsWithNarrativeThread = existingRuns.filter(
  (r) => num(r.narrativeThreadsStarted) > 0,
).length;

const ideologyByAxis = new Map<string, number[]>();
for (const row of ideology) {
  const axis = str(row.axis);
  ideologyByAxis.set(axis, [...(ideologyByAxis.get(axis) ?? []), num(row.deltaTrue)]);
}

const rareEventIds = new Set(
  gameContent.events
    .filter((e) => ["rare", "legendary", "secret"].includes(e.rarity))
    .map((e) => e.id),
);
const rareEventOccurrences = frequency(
  decisions.filter((d) => rareEventIds.has(str(d.eventId))).map((d) => str(d.eventId)),
);
const rareEventsNeverReached = [...rareEventIds].filter(
  (id) => !rareEventOccurrences.some((row) => row.id === id),
);
const ideologySummary = [...ideologyByAxis.entries()].map(([axis, deltas]) => ({
  axis,
  meanAbsMovement: Number(mean(deltas.map(Math.abs)).toFixed(2)),
  maxAbsMovement: Number(Math.max(0, ...deltas.map(Math.abs)).toFixed(2)),
  stddevMovement: Number(stddev(deltas).toFixed(2)),
  shareWithMovementOver5: Number(
    (deltas.filter((d) => Math.abs(d) > 5).length / Math.max(deltas.length, 1)).toFixed(3),
  ),
}));

// --- 16. Repetition-by-run extract ------------------------------------------

const repetitionByRun = existingRuns.map((r) => ({
  partyId: r.partyId,
  agent: r.agent,
  seedIndex: r.seedIndex,
  decisions: r.decisions,
  repeatedTitlesExact: r.repeatedTitlesExact,
  repeatedTitlesNormalized: r.repeatedTitlesNormalized,
  repeatedNarrativesExact: r.repeatedNarrativesExact,
  repeatedNarrativesNormalized: r.repeatedNarrativesNormalized,
  repeatsWithin5: r.repeatsWithin5,
  repeatsWithin10: r.repeatsWithin10,
  chainJustifiedRepeats: r.chainJustifiedRepeats,
}));
await writeFile(resolve(OUT_DIR, "repetition-by-run.csv"), toCsv(repetitionByRun), "utf8");

function distributionStats(values: number[]) {
  return {
    mean: Number(mean(values).toFixed(3)),
    median: Number(median(values).toFixed(3)),
    stddev: Number(stddev(values).toFixed(3)),
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0,
    p90: Number(percentile(values, 0.9).toFixed(3)),
    p95: Number(percentile(values, 0.95).toFixed(3)),
  };
}

// --- Counterfactual branch summary ------------------------------------------
// Delegated to lib/branch-summary.ts (a pure, unit-tested function) so the P6
// immediate-horizon bug — the chart used to plot a hardcoded 0 instead of
// this computed value — cannot silently regress.

const branchSummary = computeBranchSummary(counterfactuals as unknown as CounterfactualRow[]);

// --- summary.json ------------------------------------------------------------

const summary = {
  generatedAt: new Date().toISOString(),
  sampleSizes: {
    existingPartyRuns: existingRuns.length,
    customPartyRuns: customRuns.length,
    totalRuns: rawRuns.length,
    totalDecisions: decisions.length,
    totalWorldEvents: worldEvents.length,
    counterfactualBranches: counterfactuals.length,
  },
  varianceDecomposition: {
    anovaByMetric: anovaRows,
    bootstrapPartyEtaSquaredFirstRound: bootstrapPartyEta,
    bootstrapAgentEtaSquaredFirstRound: bootstrapAgentEta,
    cramersV: {
      qualifiedByParty: Number(cramersVQualifiedByParty.toFixed(4)),
      qualifiedByAgent: Number(cramersVQualifiedByAgent.toFixed(4)),
      wonByParty: Number(cramersVWonByParty.toFixed(4)),
      wonByAgent: Number(cramersVWonByAgent.toFixed(4)),
    },
    matchedPairs: {
      groups: matchedRows.length,
      averageFirstRoundRange: Number(mean(matchedRows.map((r) => r.firstRoundRange)).toFixed(2)),
      medianFirstRoundRange: Number(median(matchedRows.map((r) => r.firstRoundRange)).toFixed(2)),
      averageFinalScoreRange: Number(mean(matchedRows.map((r) => r.finalScoreRange)).toFixed(2)),
      shareWhereOutcomeChanged: Number(
        (
          matchedRows.filter((r) => r.outcomeChanged).length / Math.max(matchedRows.length, 1)
        ).toFixed(3),
      ),
    },
    underdogBeatsFavorite: {
      favoriteParty,
      underdogParty,
      favoriteAverageFirstRound: Number(
        (partyAverageFirstRound.get(favoriteParty ?? "") ?? 0).toFixed(2),
      ),
      underdogAverageFirstRound: Number(
        (partyAverageFirstRound.get(underdogParty ?? "") ?? 0).toFixed(2),
      ),
      favoriteWorstDecileFinalScore: Number(favoriteWorstDecile.toFixed(2)),
      underdogBestDecileFinalScore: Number(underdogBestDecile.toFixed(2)),
      underdogRunsExceedingFavoriteWorstDecile: underdogBeatsFavoriteCount,
      underdogRunsTotal: underdogRuns.length,
      rate: Number(underdogBeatsFavoriteRate.toFixed(3)),
      interpretation:
        "Part des campagnes du parti le plus faible (score moyen 1er tour) dont le score final dépasse le 10e centile du parti le plus fort — mesure si un mauvais parcours favori peut être dépassé par un bon parcours outsider, sans que ce soit la norme.",
    },
  },
  counterfactualBranching: branchSummary,
  choiceStrength: {
    evaluatedChoiceCells: choiceStrength.length,
    minimumSampleSize: 15,
    top10SpreadEvents: dominantOptionEvents.slice(0, 10),
    caveat:
      "Ces écarts sont corrélationnels : ils comparent les campagnes qui ONT CHOISI chaque option, sans contrôler l'agent ni le parti qui l'ont choisie. Voir counterfactuals.csv pour la mesure causale isolée (même état initial, un seul choix qui diffère).",
  },
  memoryAndWorld: {
    runsWithActorMemoryContentShare: Number(
      (runsWithAtLeastOneRecall / existingRuns.length).toFixed(3),
    ),
    runsWithContradictionShare: Number((runsWithContradiction / existingRuns.length).toFixed(3)),
    runsWithAbruptReversalShare: Number((runsWithAbruptReversal / existingRuns.length).toFixed(3)),
    runsWithCandidateReplacementShare: Number(
      (runsWithReplacement / existingRuns.length).toFixed(3),
    ),
    runsWithAllianceShare: Number((runsWithAlliance / existingRuns.length).toFixed(3)),
    runsWithNarrativeThreadShare: Number(
      (runsWithNarrativeThread / existingRuns.length).toFixed(3),
    ),
    opponentActionKindFrequency: worldEventKindFrequency,
    actorMemoryEntriesDistribution: distributionStats(
      existingRuns.map((r) => num(r.actorMemoryEntries)),
    ),
    opponentActionCountDistribution: distributionStats(
      existingRuns.map((r) => num(r.opponentActionCount)),
    ),
  },
  ideology: {
    byAxis: ideologySummary,
  },
  rareEvents: {
    totalRareEventsInCatalog: rareEventIds.size,
    occurrences: rareEventOccurrences,
    neverReachedInThisSample: rareEventsNeverReached,
  },
  repetition: {
    repeatedTitlesExact: distributionStats(existingRuns.map((r) => num(r.repeatedTitlesExact))),
    repeatedTitlesNormalized: distributionStats(
      existingRuns.map((r) => num(r.repeatedTitlesNormalized)),
    ),
    repeatedNarrativesExact: distributionStats(
      existingRuns.map((r) => num(r.repeatedNarrativesExact)),
    ),
    repeatedNarrativesNormalized: distributionStats(
      existingRuns.map((r) => num(r.repeatedNarrativesNormalized)),
    ),
    runsWithZeroRepeatedTitles: existingRuns.filter((r) => num(r.repeatedTitlesExact) === 0).length,
    runsWithZeroRepeatedNarratives: existingRuns.filter((r) => num(r.repeatedNarrativesExact) === 0)
      .length,
    chainJustifiedRepeatsShareOfAllRepeats: (() => {
      const totalRepeats = existingRuns.reduce((sum, r) => sum + num(r.repeatedTitlesExact), 0);
      const chainRepeats = existingRuns.reduce((sum, r) => sum + num(r.chainJustifiedRepeats), 0);
      return totalRepeats ? Number((chainRepeats / totalRepeats).toFixed(3)) : 0;
    })(),
  },
  determinismAndValidity: {
    invalidRuns: rawRuns.filter((r) => !bool(r.valid)).length,
    totalRuns: rawRuns.length,
  },
};

await writeFile(resolve(OUT_DIR, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      existingPartyRuns: existingRuns.length,
      partyEtaSquaredFirstRound: anovaRows.find((r) => r.metric === "firstRoundScore")
        ?.etaSquaredParty,
      agentEtaSquaredFirstRound: anovaRows.find((r) => r.metric === "firstRoundScore")
        ?.etaSquaredAgent,
      partyEtaSquaredProgressionNormalized: anovaRows.find(
        (r) => r.metric === "progressionNormalized",
      )?.etaSquaredParty,
      agentEtaSquaredProgressionNormalized: anovaRows.find(
        (r) => r.metric === "progressionNormalized",
      )?.etaSquaredAgent,
      matchedPairsOutcomeChangedShare:
        summary.varianceDecomposition.matchedPairs.shareWhereOutcomeChanged,
      counterfactualBranchesAvailable: counterfactuals.length,
    },
    null,
    2,
  ),
);
