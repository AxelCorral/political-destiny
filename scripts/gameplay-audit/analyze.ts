/**
 * Gameplay audit — quantitative analysis (PROMPT_CLAUDE_CODE_AUDIT_GAMEPLAY_FUN.md
 * sections 10-23, 33-34). Consumes runs.csv/choices.csv/polls.csv produced by
 * generate-corpus.ts; does not touch the engine.
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { bool, num, parseCsv, str, toCsv } from "../audit-post/lib/csv";
import { mean, stddev } from "../audit-post/lib/stats";
import { jaccard } from "../audit-post/lib/text-similarity";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/gameplay");

async function readCsv(name: string): Promise<Record<string, string>[]> {
  return parseCsv(await readFile(resolve(OUT_DIR, name), "utf8"));
}
async function write(name: string, rows: Record<string, unknown>[]) {
  await writeFile(resolve(OUT_DIR, name), toCsv(rows), "utf8");
}

const runs = await readCsv("runs.csv");
const choices = await readCsv("choices.csv");
const polls = await readCsv("polls.csv");
const eventById = new Map(gameContent.events.map((e) => [e.id, e]));

// --- events.csv : catalog-level aggregation -------------------------------
{
  const byEvent = new Map<string, Record<string, string>[]>();
  for (const c of choices) {
    const arr = byEvent.get(c.eventId!) ?? [];
    arr.push(c);
    byEvent.set(c.eventId!, arr);
  }
  const rows = [...byEvent.entries()].map(([eventId, rows]) => {
    const def = eventById.get(eventId);
    const byChoice = new Map<string, number>();
    for (const r of rows) byChoice.set(r.choiceId!, (byChoice.get(r.choiceId!) ?? 0) + 1);
    const sorted = [...byChoice.entries()].sort((a, b) => b[1] - a[1]);
    const dominant = sorted[0];
    const parties = new Set(rows.map((r) => r.partyId));
    return {
      eventId,
      title: def?.title ?? "",
      category: def?.category ?? "",
      importance: def?.importance ?? "",
      rarity: def?.rarity ?? "",
      optionsCount: def?.choices.length ?? 0,
      timesEncountered: rows.length,
      uniquePartiesEncountered: parties.size,
      avgDecisionIndex: Number(mean(rows.map((r) => num(r.decisionIndex))).toFixed(2)),
      avgPollDelta: Number(mean(rows.map((r) => num(r.pollDelta))).toFixed(3)),
      dominantChoiceId: dominant?.[0] ?? "",
      dominantChoiceShare: dominant ? Number((dominant[1] / rows.length).toFixed(3)) : 0,
    };
  });
  rows.sort((a, b) => b.timesEncountered - a.timesEncountered);
  await write("events.csv", rows);
}

// --- pacing.csv : per-phase breakdown -------------------------------------
{
  const phases = [
    "setup",
    "pre_campaign",
    "campaign",
    "official_campaign",
    "first_round",
    "between_rounds",
    "second_round",
    "government_epilogue",
    "finished",
  ];
  const rows = phases.map((phase) => {
    const rowsInPhase = choices.filter((c) => c.phase === phase);
    const runsWithPhase = new Set(rowsInPhase.map((r) => r.runKey)).size;
    return {
      phase,
      totalDecisions: rowsInPhase.length,
      avgDecisionsPerRun:
        runsWithPhase > 0 ? Number((rowsInPhase.length / runsWithPhase).toFixed(2)) : 0,
      avgNarrativeLength:
        rowsInPhase.length > 0
          ? Number(mean(rowsInPhase.map((r) => num(r.narrativeLength))).toFixed(1))
          : 0,
      avgIntensity:
        rowsInPhase.length > 0
          ? Number(mean(rowsInPhase.map((r) => num(r.intensityEstimate))).toFixed(2))
          : 0,
      majorOrDecisiveCount: rowsInPhase.filter(
        (r) => r.eventImportance === "major" || r.eventImportance === "decisive",
      ).length,
      runsReachingPhase: runsWithPhase,
    };
  });
  await write("pacing.csv", rows);
}

// --- cognitive-repetition.csv : per category --------------------------------
{
  const byRun = new Map<string, Record<string, string>[]>();
  for (const c of choices) {
    const arr = byRun.get(c.runKey!) ?? [];
    arr.push(c);
    byRun.set(c.runKey!, arr);
  }
  const categories = [...new Set(choices.map((c) => str(c.eventCategory)))];
  const sequenceCounts = new Map<string, number>();
  for (const cat of categories) sequenceCounts.set(cat, 0);
  for (const runChoices of byRun.values()) {
    const ordered = [...runChoices].sort((a, b) => num(a.decisionIndex) - num(b.decisionIndex));
    let streakCat = "";
    let streakLen = 0;
    for (const c of ordered) {
      if (c.eventCategory === streakCat) {
        streakLen += 1;
      } else {
        if (streakLen >= 3) sequenceCounts.set(streakCat, (sequenceCounts.get(streakCat) ?? 0) + 1);
        streakCat = c.eventCategory!;
        streakLen = 1;
      }
    }
    if (streakLen >= 3) sequenceCounts.set(streakCat, (sequenceCounts.get(streakCat) ?? 0) + 1);
  }
  const totalDecisions = choices.length;
  const rows = categories.map((cat) => {
    const count = choices.filter((c) => str(c.eventCategory) === cat).length;
    return {
      category: cat,
      occurrences: count,
      shareOfAllDecisions: Number((count / totalDecisions).toFixed(4)),
      runsWithSequenceOf3Plus: sequenceCounts.get(cat) ?? 0,
    };
  });
  rows.sort((a, b) => b.occurrences - a.occurrences);
  await write("cognitive-repetition.csv", rows);
}

// --- dominant-choices.csv --------------------------------------------------
{
  const byEventChoice = new Map<string, Record<string, string>[]>();
  for (const c of choices) {
    const key = `${c.eventId}::${c.choiceId}`;
    const arr = byEventChoice.get(key) ?? [];
    arr.push(c);
    byEventChoice.set(key, arr);
  }
  const byEventTotal = new Map<string, number>();
  for (const c of choices) byEventTotal.set(c.eventId!, (byEventTotal.get(c.eventId!) ?? 0) + 1);

  const rows: Record<string, unknown>[] = [];
  for (const [key, rowsForChoice] of byEventChoice.entries()) {
    const [eventId, choiceId] = key.split("::");
    const total = byEventTotal.get(eventId!) ?? 0;
    if (total < 8) continue;
    const share = rowsForChoice.length / total;
    const def = eventById.get(eventId!);
    const choiceDef = def?.choices.find((c) => c.id === choiceId);
    rows.push({
      eventId,
      eventTitle: def?.title ?? "",
      choiceId,
      choiceLabel: choiceDef?.label ?? "",
      timesEncounteredTotal: total,
      timesChosen: rowsForChoice.length,
      selectionShare: Number(share.toFixed(3)),
      avgPollDelta: Number(mean(rowsForChoice.map((r) => num(r.pollDelta))).toFixed(3)),
      agentsChoosingIt: [...new Set(rowsForChoice.map((r) => r.agent))].join("|"),
      dominant: share > 0.8,
    });
  }
  rows.sort((a, b) => Number(b.selectionShare) - Number(a.selectionShare));
  await write("dominant-choices.csv", rows);
}

// --- poll-trajectories.csv : representative sample for charting ------------
{
  const resultCategories = [...new Set(runs.map((r) => r.resultCategory))];
  const sampled: string[] = [];
  for (const cat of resultCategories) {
    const candidates = runs.filter((r) => r.resultCategory === cat);
    for (const r of candidates.slice(0, 3)) sampled.push(r.runKey!);
  }
  const rows = polls
    .filter((p) => sampled.includes(p.runKey!))
    .map((p) => ({
      runKey: p.runKey,
      decisionIndex: num(p.decisionIndex),
      playerPolling: num(p.playerPolling),
      playerRank: num(p.playerRank),
    }));
  rows.sort((a, b) => a.runKey!.localeCompare(b.runKey!) || a.decisionIndex - b.decisionIndex);
  await write("poll-trajectories.csv", rows);
}

// --- replayability.csv : Jaccard between same-party runs --------------------
{
  // Grouped by partyProfile, not the engine partyId: every custom-party
  // profile shares the literal engine id "custom_party" (see the note in
  // generate-corpus.ts), so partyId alone would merge all 9 ideologically
  // distinct custom profiles into one bucket and understate their real
  // within-profile replayability.
  const byParty = new Map<string, Map<string, Set<string>>>();
  const catByParty = new Map<string, Map<string, string>>();
  for (const c of choices) {
    const partyMap = byParty.get(c.partyProfile!) ?? new Map<string, Set<string>>();
    const set = partyMap.get(c.runKey!) ?? new Set<string>();
    set.add(c.eventId!);
    partyMap.set(c.runKey!, set);
    byParty.set(c.partyProfile!, partyMap);

    const catMap = catByParty.get(c.partyProfile!) ?? new Map<string, string>();
    catMap.set(c.runKey!, (catMap.get(c.runKey!) ?? "") + c.eventCategory![0]);
    catByParty.set(c.partyProfile!, catMap);
  }
  const rows: Record<string, unknown>[] = [];
  for (const [partyProfile, runMap] of byParty.entries()) {
    const runKeys = [...runMap.keys()];
    const jaccards: number[] = [];
    for (let i = 0; i < runKeys.length; i += 1) {
      for (let j = i + 1; j < runKeys.length; j += 1) {
        const a = runMap.get(runKeys[i]!)!;
        const b = runMap.get(runKeys[j]!)!;
        jaccards.push(jaccard(a, b));
      }
    }
    if (jaccards.length === 0) continue;
    rows.push({
      partyProfile,
      pairsCompared: jaccards.length,
      meanEventJaccard: Number(mean(jaccards).toFixed(3)),
      medianEventJaccard: Number(
        [...jaccards].sort((a, b) => a - b)[Math.floor(jaccards.length / 2)]!.toFixed(3),
      ),
      minEventJaccard: Number(Math.min(...jaccards).toFixed(3)),
      maxEventJaccard: Number(Math.max(...jaccards).toFixed(3)),
    });
  }
  rows.sort((a, b) => Number(b.meanEventJaccard) - Number(a.meanEventJaccard));
  await write("replayability.csv", rows);
}

// --- party-identity.csv -----------------------------------------------------
// Grouped by partyProfile (see the replayability.csv note above) so the 9
// custom profiles are compared as 9 distinct identities, not merged under
// the shared engine id "custom_party".
{
  const parties = [...new Set(runs.map((r) => r.partyProfile))];
  const rows = parties.map((partyProfile) => {
    const partyRuns = runs.filter((r) => r.partyProfile === partyProfile);
    const partyChoices = choices.filter((c) => c.partyProfile === partyProfile);
    const categoryCounts = new Map<string, number>();
    for (const c of partyChoices)
      categoryCounts.set(c.eventCategory!, (categoryCounts.get(c.eventCategory!) ?? 0) + 1);
    const total = partyChoices.length || 1;
    const topCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const strategyCounts = new Map<string, number>();
    for (const c of partyChoices)
      if (c.choiceStrategy)
        strategyCounts.set(c.choiceStrategy, (strategyCounts.get(c.choiceStrategy) ?? 0) + 1);
    const topStrategy = [...strategyCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const tagCounts = new Map<string, number>();
    for (const c of partyChoices)
      if (c.choiceTag) tagCounts.set(c.choiceTag, (tagCounts.get(c.choiceTag) ?? 0) + 1);
    const topTag = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      partyProfile,
      engineId: partyRuns[0]?.partyId ?? "",
      partyKind: partyRuns[0]?.partyKind ?? "",
      runsCount: partyRuns.length,
      avgFinalScore: Number(mean(partyRuns.map((r) => num(r.finalScore))).toFixed(1)),
      avgIdeologyMovement: Number(
        mean(partyRuns.map((r) => num(r.ideologyMovementTotal))).toFixed(1),
      ),
      avgAlliancesFormed: Number(mean(partyRuns.map((r) => num(r.alliancesFormed))).toFixed(2)),
      avgContradictions: Number(mean(partyRuns.map((r) => num(r.contradictionCount))).toFixed(2)),
      qualificationRate: Number(
        (partyRuns.filter((r) => bool(r.qualified)).length / partyRuns.length).toFixed(3),
      ),
      opponentConflictShare: Number(
        (partyRuns.filter((r) => bool(r.hasOpponentConflict)).length / partyRuns.length).toFixed(3),
      ),
      topEventCategory: topCategory
        ? `${topCategory[0]} (${((topCategory[1] / total) * 100).toFixed(0)}%)`
        : "",
      topChoiceStrategy: topStrategy ? topStrategy[0] : "",
      topChoiceTag: topTag ? topTag[0] : "",
    };
  });
  await write("party-identity.csv", rows);
}

// --- final-scores.csv -------------------------------------------------------
{
  const rows: Record<string, unknown>[] = [];
  const byCategory = new Map<string, number[]>();
  for (const r of runs) {
    const arr = byCategory.get(r.resultCategory!) ?? [];
    arr.push(num(r.finalScore));
    byCategory.set(r.resultCategory!, arr);
  }
  for (const [category, scores] of byCategory.entries()) {
    rows.push({
      grouping: "resultCategory",
      key: category,
      n: scores.length,
      mean: Number(mean(scores).toFixed(1)),
      stddev: Number(stddev(scores).toFixed(1)),
      min: Math.min(...scores),
      max: Math.max(...scores),
    });
  }
  const byParty = new Map<string, number[]>();
  for (const r of runs) {
    const arr = byParty.get(r.partyProfile!) ?? [];
    arr.push(num(r.finalScore));
    byParty.set(r.partyProfile!, arr);
  }
  for (const [partyProfile, scores] of byParty.entries()) {
    rows.push({
      grouping: "partyProfile",
      key: partyProfile,
      n: scores.length,
      mean: Number(mean(scores).toFixed(1)),
      stddev: Number(stddev(scores).toFixed(1)),
      min: Math.min(...scores),
      max: Math.max(...scores),
    });
  }
  await write("final-scores.csv", rows);
}

// --- memorable-moments.csv --------------------------------------------------
{
  const byRun = new Map<string, Record<string, string>[]>();
  for (const c of choices) {
    const arr = byRun.get(c.runKey!) ?? [];
    arr.push(c);
    byRun.set(c.runKey!, arr);
  }
  const runByKey = new Map(runs.map((r) => [r.runKey!, r]));
  const rows: Record<string, unknown>[] = [];
  for (const [runKey, runChoices] of byRun.entries()) {
    const peak = [...runChoices].sort(
      (a, b) => num(b.intensityEstimate) - num(a.intensityEstimate),
    )[0];
    if (!peak) continue;
    const run = runByKey.get(runKey);
    const bestIdx = run?.bestDecisionIndex ? num(run.bestDecisionIndex) : undefined;
    rows.push({
      runKey,
      peakDecisionIndex: num(peak.decisionIndex),
      peakEventTitle: peak.eventTitle,
      peakEventCategory: peak.eventCategory,
      peakIntensity: num(peak.intensityEstimate),
      matchesEngineBestDecision: bestIdx !== undefined && bestIdx === num(peak.decisionIndex),
    });
  }
  await write("memorable-moments.csv", rows);
}

// --- dead-zones.csv ----------------------------------------------------------
{
  const byRun = new Map<string, Record<string, string>[]>();
  for (const c of choices) {
    const arr = byRun.get(c.runKey!) ?? [];
    arr.push(c);
    byRun.set(c.runKey!, arr);
  }
  const rows: Record<string, unknown>[] = [];
  for (const [runKey, runChoices] of byRun.entries()) {
    const ordered = [...runChoices].sort((a, b) => num(a.decisionIndex) - num(b.decisionIndex));
    const zones: Array<{ start: number; length: number; phase: string }> = [];
    let start = -1;
    let length = 0;
    let phase = "";
    for (let i = 0; i < ordered.length; i += 1) {
      const low = num(ordered[i]!.intensityEstimate) <= 2;
      if (low) {
        if (start === -1) {
          start = num(ordered[i]!.decisionIndex);
          phase = ordered[i]!.phase!;
        }
        length += 1;
      } else {
        if (length >= 3) zones.push({ start, length, phase });
        start = -1;
        length = 0;
      }
    }
    if (length >= 3) zones.push({ start, length, phase });
    for (const zone of zones) {
      rows.push({ runKey, startDecisionIndex: zone.start, length: zone.length, phase: zone.phase });
    }
  }
  await write("dead-zones.csv", rows);
}

// --- cross-party-overlap.csv : same-party vs cross-party event Jaccard -----
// Motivated by a qualitative observation while reading full timelines
// (section 41): the same generic events (shared fictional staff, identical
// headline setups) kept recurring verbatim across different parties'
// campaigns. Quantifies whether party event pools are genuinely distinct.
{
  const byRun = new Map<string, { partyId: string; events: Set<string> }>();
  for (const c of choices) {
    if (!byRun.has(c.runKey!)) byRun.set(c.runKey!, { partyId: c.partyId!, events: new Set() });
    byRun.get(c.runKey!)!.events.add(c.eventId!);
  }
  const existingRuns = [...byRun.values()].filter((r) => r.partyId !== "custom_party");
  let sameSum = 0;
  let sameN = 0;
  let crossSum = 0;
  let crossN = 0;
  for (let i = 0; i < existingRuns.length; i += 1) {
    for (let j = i + 1; j < existingRuns.length; j += 1) {
      const a = existingRuns[i]!;
      const b = existingRuns[j]!;
      const j2 = jaccard(a.events, b.events);
      if (a.partyId === b.partyId) {
        sameSum += j2;
        sameN += 1;
      } else {
        crossSum += j2;
        crossN += 1;
      }
    }
  }
  await write("cross-party-overlap.csv", [
    {
      grouping: "same_party",
      pairsCompared: sameN,
      meanEventJaccard: Number((sameSum / sameN).toFixed(3)),
    },
    {
      grouping: "cross_party",
      pairsCompared: crossN,
      meanEventJaccard: Number((crossSum / crossN).toFixed(3)),
    },
  ]);
}

// --- rank-volatility.csv : how much a single decision reshuffles the field -
// Motivated by a qualitative observation (section 41): rank swung from 8th
// to 1st (or the reverse) within a single decision repeatedly in the sampled
// timelines. Quantifies whether this is a systemic pattern or a sampling
// artifact.
{
  const swings = choices.map((c) => Math.abs(num(c.rankAfter) - num(c.rankBefore)));
  swings.sort((a, b) => a - b);
  const bigSwings = swings.filter((s) => s >= 3).length;
  await write("rank-volatility.csv", [
    {
      totalDecisions: swings.length,
      meanRankSwing: Number(mean(swings).toFixed(2)),
      medianRankSwing: swings[Math.floor(swings.length / 2)],
      p90RankSwing: swings[Math.floor(swings.length * 0.9)],
      decisionsWithSwingGte3: bigSwings,
      shareWithSwingGte3: Number((bigSwings / swings.length).toFixed(3)),
    },
  ]);
}

console.log(
  JSON.stringify(
    {
      totalRuns: runs.length,
      totalDecisions: choices.length,
      uniqueEventsEncountered: new Set(choices.map((c) => c.eventId)).size,
      totalEventsInCatalog: gameContent.events.length,
      filesWritten: [
        "events.csv",
        "pacing.csv",
        "cognitive-repetition.csv",
        "dominant-choices.csv",
        "poll-trajectories.csv",
        "replayability.csv",
        "party-identity.csv",
        "final-scores.csv",
        "memorable-moments.csv",
        "dead-zones.csv",
      ],
    },
    null,
    2,
  ),
);
