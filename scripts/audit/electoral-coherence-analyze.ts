/**
 * Audit électoral — BLOC A sections 6-12 et 19
 * (PROMPT_CLAUDE_CODE_AUDIT_CREDIBILITE_ELECTORALE_COHERENCE.md).
 *
 * Lit le corpus produit par electoral-coherence-corpus.ts et calcule :
 * - dispersion par phase de contrôle (déjà en grande partie dans
 *   dispersion-by-phase.csv, ici agrégé) ;
 * - indicateur compressedRace (plusieurs définitions testées) ;
 * - archétypes de course (huit formes, un par run) ;
 * - dynamique de leadership (changements de leader/top2, plus grand gain,
 *   plus grande chute) ;
 * - percentiles par parti (10/50/90, probabilité >20 %, probabilité <8 %,
 *   qualification, victoire).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { parseCsv, toCsv } from "../audit-post/lib/csv";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/electoral-coherence");
const PARTY_IDS = gameContent.parties.filter((p) => p.isRealOrganization).map((p) => p.id);

interface DispersionRow {
  runKey: string;
  partyId: string;
  agent: string;
  seedIndex: string;
  checkpoint: string;
  decisionIndex: string;
  [party: string]: string;
}

interface SummaryRow {
  runKey: string;
  partyId: string;
  agent: string;
  seedIndex: string;
  qualified: string;
  finalistA: string;
  finalistB: string;
  playerIsFinalist: string;
  won: string;
  r1LeaderId: string;
  r1LeaderScore: string;
  r1SecondId: string;
  r1SecondScore: string;
  r1ThirdId: string;
  r1ThirdScore: string;
  r1LastId: string;
  r1LastScore: string;
  r1SpreadTop1Top2: string;
  r1SpreadTop1Top3: string;
  r1SpreadTop1Top9: string;
  r1StdDev: string;
  countAbove20: string;
  countAbove18: string;
  countAbove15: string;
  countBelow10: string;
  countBelow7: string;
  concentrationTop2: string;
  concentrationTop3: string;
}

function num(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function main() {
  const dispersionText = await readFile(resolve(OUT_DIR, "dispersion-by-phase.csv"), "utf8");
  const summaryText = await readFile(resolve(OUT_DIR, "party-percentiles-raw.csv"), "utf8");
  const dispersionRows = parseCsv(dispersionText) as unknown as DispersionRow[];
  const summaryRows = parseCsv(summaryText) as unknown as SummaryRow[];

  // --- 1. dispersion agrégée par checkpoint ---------------------------
  const byCheckpoint = new Map<string, DispersionRow[]>();
  for (const row of dispersionRows) {
    const list = byCheckpoint.get(row.checkpoint) ?? [];
    list.push(row);
    byCheckpoint.set(row.checkpoint, list);
  }
  const checkpointOrder = ["0%", "25%", "50%", "75%", "last_bulletin_pre_r1", "r1_result"];
  const dispersionSummary = checkpointOrder.map((checkpoint) => {
    const rows = byCheckpoint.get(checkpoint) ?? [];
    const scoresPerRun = rows.map((row) =>
      PARTY_IDS.map((id) => num(row[id] ?? "0")).sort((a, b) => b - a),
    );
    const leaderScores = scoresPerRun.map((s) => s[0] ?? 0);
    const secondScores = scoresPerRun.map((s) => s[1] ?? 0);
    const thirdScores = scoresPerRun.map((s) => s[2] ?? 0);
    const lastScores = scoresPerRun.map((s) => s[s.length - 1] ?? 0);
    const spreadTop1Top2 = scoresPerRun.map((s) => (s[0] ?? 0) - (s[1] ?? 0));
    const spreadTop1Top3 = scoresPerRun.map((s) => (s[0] ?? 0) - (s[2] ?? 0));
    const spreadTop1Top9 = scoresPerRun.map((s) => (s[0] ?? 0) - (s[s.length - 1] ?? 0));
    const stdDevs = scoresPerRun.map((s) => {
      const mean = s.reduce((a, b) => a + b, 0) / s.length;
      return Math.sqrt(s.reduce((sum, v) => sum + (v - mean) ** 2, 0) / s.length);
    });
    const mean = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const countAbove = (threshold: number) =>
      mean(scoresPerRun.map((s) => s.filter((v) => v > threshold).length));
    const countBelow = (threshold: number) =>
      mean(scoresPerRun.map((s) => s.filter((v) => v < threshold).length));
    const concentrationTop2 = mean(scoresPerRun.map((s) => (s[0] ?? 0) + (s[1] ?? 0)));
    const concentrationTop3 = mean(
      scoresPerRun.map((s) => (s[0] ?? 0) + (s[1] ?? 0) + (s[2] ?? 0)),
    );
    return {
      checkpoint,
      runs: rows.length,
      meanLeaderScore: Number(mean(leaderScores).toFixed(2)),
      meanSecondScore: Number(mean(secondScores).toFixed(2)),
      meanThirdScore: Number(mean(thirdScores).toFixed(2)),
      meanLastScore: Number(mean(lastScores).toFixed(2)),
      meanSpreadTop1Top2: Number(mean(spreadTop1Top2).toFixed(2)),
      meanSpreadTop1Top3: Number(mean(spreadTop1Top3).toFixed(2)),
      meanSpreadTop1Top9: Number(mean(spreadTop1Top9).toFixed(2)),
      meanStdDev: Number(mean(stdDevs).toFixed(2)),
      meanCountAbove20: Number(countAbove(20).toFixed(2)),
      meanCountAbove18: Number(countAbove(18).toFixed(2)),
      meanCountAbove15: Number(countAbove(15).toFixed(2)),
      meanCountBelow10: Number(countBelow(10).toFixed(2)),
      meanCountBelow7: Number(countBelow(7).toFixed(2)),
      meanConcentrationTop2: Number(concentrationTop2.toFixed(2)),
      meanConcentrationTop3: Number(concentrationTop3.toFixed(2)),
    };
  });
  await writeFile(
    resolve(OUT_DIR, "dispersion-summary.csv"),
    toCsv(dispersionSummary as unknown as Record<string, unknown>[]),
    "utf8",
  );

  // --- 2. compressedRace, plusieurs définitions ------------------------
  const compressedDefs: Record<string, (scores: number[]) => boolean> = {
    "8of9_in_7_16": (scores) => scores.filter((s) => s >= 7 && s <= 16).length >= 8,
    "7of9_in_7_16": (scores) => scores.filter((s) => s >= 7 && s <= 16).length >= 7,
    "spread_lt_10": (scores) => (scores[0] ?? 0) - (scores[scores.length - 1] ?? 0) < 10,
    "leader_lt_17": (scores) => (scores[0] ?? 0) < 17,
  };
  const compressedByCheckpoint = checkpointOrder.map((checkpoint) => {
    const rows = byCheckpoint.get(checkpoint) ?? [];
    const scoresPerRun = rows.map((row) =>
      PARTY_IDS.map((id) => num(row[id] ?? "0")).sort((a, b) => b - a),
    );
    const out: Record<string, unknown> = { checkpoint, runs: rows.length };
    for (const [name, fn] of Object.entries(compressedDefs)) {
      const count = scoresPerRun.filter(fn).length;
      out[name] = rows.length ? Number(((count / rows.length) * 100).toFixed(1)) : 0;
    }
    return out;
  });
  await writeFile(
    resolve(OUT_DIR, "compressed-races.csv"),
    toCsv(compressedByCheckpoint),
    "utf8",
  );

  // --- 3. archétypes de course (un par run, perspective du parti joué) --
  const runsByKey = new Map<string, DispersionRow[]>();
  for (const row of dispersionRows) {
    const list = runsByKey.get(row.runKey) ?? [];
    list.push(row);
    runsByKey.set(row.runKey, list);
  }

  interface ArchetypeRow {
    runKey: string;
    partyId: string;
    archetype: string;
    initialScore: number;
    initialRank: number;
    rank75: number;
    r1Score: number;
    r1Rank: number;
    qualified: boolean;
  }
  const archetypeRows: ArchetypeRow[] = [];
  const archetypeCounts = new Map<string, number>();

  for (const summary of summaryRows) {
    const rows = runsByKey.get(summary.runKey) ?? [];
    const byCp = new Map(rows.map((r) => [r.checkpoint, r]));
    const rankOf = (row: DispersionRow | undefined, partyId: string) => {
      if (!row) return 9;
      const scores = PARTY_IDS.map((id) => ({ id, score: num(row[id] ?? "0") })).sort(
        (a, b) => b.score - a.score,
      );
      return scores.findIndex((s) => s.id === partyId) + 1;
    };
    const scoreOf = (row: DispersionRow | undefined, partyId: string) =>
      row ? num(row[partyId] ?? "0") : 0;

    const partyId = summary.partyId;
    const initial = byCp.get("0%");
    const cp75 = byCp.get("75%");
    const r1 = byCp.get("r1_result");
    const initialScore = scoreOf(initial, partyId);
    const initialRank = rankOf(initial, partyId);
    const rank75 = rankOf(cp75, partyId);
    const r1Score = scoreOf(r1, partyId);
    const r1Rank = rankOf(r1, partyId);
    const qualified = summary.playerIsFinalist === "true";

    const leaderScore = num(summary.r1LeaderScore);
    const secondScore = num(summary.r1SecondScore);
    const thirdScore = num(summary.r1ThirdScore);
    const spreadTop1Top2 = num(summary.r1SpreadTop1Top2);
    const spreadTop2Top3 = secondScore - thirdScore;
    const scoresAll = PARTY_IDS.map((id) => scoreOf(r1, id)).sort((a, b) => b - a);
    const compressed = scoresAll.filter((s) => s >= 7 && s <= 16).length >= 7;

    let archetype: string;
    if (initialScore < 7 && r1Score - initialScore >= 8) {
      archetype = "percee_outsider";
    } else if (initialRank === 1 && r1Rank >= 4) {
      archetype = "effondrement_favori";
    } else if (rank75 > 2 && qualified) {
      archetype = "remontee_tardive";
    } else if (leaderScore > 22 && spreadTop1Top2 > 5) {
      archetype = "favori_dominant";
    } else if (spreadTop2Top3 >= 8) {
      archetype = "duel_clair";
    } else if (
      Math.abs(leaderScore - secondScore) <= 3 &&
      Math.abs(secondScore - thirdScore) <= 3 &&
      thirdScore >= 15
    ) {
      archetype = "tripartite";
    } else if (compressed) {
      archetype = "course_fragmentee";
    } else {
      archetype = "qualification_confortable";
    }

    archetypeCounts.set(archetype, (archetypeCounts.get(archetype) ?? 0) + 1);
    archetypeRows.push({
      runKey: summary.runKey,
      partyId,
      archetype,
      initialScore: Number(initialScore.toFixed(2)),
      initialRank,
      rank75,
      r1Score: Number(r1Score.toFixed(2)),
      r1Rank,
      qualified,
    });
  }
  await writeFile(
    resolve(OUT_DIR, "race-archetypes.csv"),
    toCsv(archetypeRows as unknown as Record<string, unknown>[]),
    "utf8",
  );

  // --- 4. dynamique de leadership --------------------------------------
  let totalLeaderChanges = 0;
  let totalTop2Changes = 0;
  const maxGains: number[] = [];
  const maxDrops: number[] = [];
  const leadersEver = new Set<string>();
  const above20Ever = new Set<string>();
  let scoreMax = -Infinity;
  let scoreMin = Infinity;

  for (const [, rows] of runsByKey) {
    const ordered = checkpointOrder
      .map((cp) => rows.find((r) => r.checkpoint === cp))
      .filter((r): r is DispersionRow => Boolean(r));
    let previousLeader: string | undefined;
    let previousTop2: string | undefined;
    const perPartySeries = new Map<string, number[]>();
    for (const row of ordered) {
      const scores = PARTY_IDS.map((id) => ({ id, score: num(row[id] ?? "0") })).sort(
        (a, b) => b.score - a.score,
      );
      const leader = scores[0]?.id;
      const top2Key = [scores[0]?.id, scores[1]?.id].sort().join("|");
      if (previousLeader && leader && leader !== previousLeader) totalLeaderChanges += 1;
      if (previousTop2 && top2Key !== previousTop2) totalTop2Changes += 1;
      previousLeader = leader;
      previousTop2 = top2Key;
      if (leader) leadersEver.add(leader);
      for (const { id, score } of scores) {
        if (score > 20) above20Ever.add(id);
        scoreMax = Math.max(scoreMax, score);
        scoreMin = Math.min(scoreMin, score);
        const series = perPartySeries.get(id) ?? [];
        series.push(score);
        perPartySeries.set(id, series);
      }
    }
    for (const series of perPartySeries.values()) {
      if (series.length < 2) continue;
      const gain = Math.max(...series) - series[0]!;
      const drop = series[0]! - Math.min(...series);
      maxGains.push(gain);
      maxDrops.push(drop);
    }
  }
  const leadershipDynamics = {
    totalRuns: runsByKey.size,
    totalLeaderChanges,
    meanLeaderChangesPerRun: Number((totalLeaderChanges / runsByKey.size).toFixed(3)),
    totalTop2Changes,
    meanTop2ChangesPerRun: Number((totalTop2Changes / runsByKey.size).toFixed(3)),
    meanMaxGain: Number((maxGains.reduce((a, b) => a + b, 0) / maxGains.length).toFixed(2)),
    p90MaxGain: Number(
      maxGains.sort((a, b) => a - b)[Math.floor(maxGains.length * 0.9)]?.toFixed(2) ?? 0,
    ),
    meanMaxDrop: Number((maxDrops.reduce((a, b) => a + b, 0) / maxDrops.length).toFixed(2)),
    p90MaxDrop: Number(
      maxDrops.sort((a, b) => a - b)[Math.floor(maxDrops.length * 0.9)]?.toFixed(2) ?? 0,
    ),
    partiesEverLeader: [...leadersEver].sort(),
    partiesEverAbove20: [...above20Ever].sort(),
    scoreMaxObserved: Number(scoreMax.toFixed(2)),
    scoreMinObserved: Number(scoreMin.toFixed(2)),
  };
  await writeFile(
    resolve(OUT_DIR, "leadership-dynamics.csv"),
    toCsv([leadershipDynamics] as unknown as Record<string, unknown>[]),
    "utf8",
  );

  // --- 5. percentiles par parti -----------------------------------------
  function percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
    return sorted[index]!;
  }
  const partyPercentiles = PARTY_IDS.map((partyId) => {
    const runs = summaryRows.filter((r) => r.partyId === partyId);
    const initialScores = runs
      .map((r) => {
        const rows = runsByKey.get(r.runKey) ?? [];
        const initial = rows.find((row) => row.checkpoint === "0%");
        return initial ? num(initial[partyId] ?? "0") : 0;
      })
      .sort((a, b) => a - b);
    const r1Scores = runs
      .map((r) => {
        const rows = runsByKey.get(r.runKey) ?? [];
        const r1 = rows.find((row) => row.checkpoint === "r1_result");
        return r1 ? num(r1[partyId] ?? "0") : 0;
      })
      .sort((a, b) => a - b);
    const qualifiedCount = runs.filter((r) => r.qualified === "true").length;
    const wonCount = runs.filter((r) => r.won === "true").length;
    return {
      partyId,
      runs: runs.length,
      initialScoreMean: Number(
        (initialScores.reduce((a, b) => a + b, 0) / Math.max(1, initialScores.length)).toFixed(2),
      ),
      r1ScoreMean: Number(
        (r1Scores.reduce((a, b) => a + b, 0) / Math.max(1, r1Scores.length)).toFixed(2),
      ),
      r1ScoreMin: Number((r1Scores[0] ?? 0).toFixed(2)),
      r1ScoreMax: Number((r1Scores[r1Scores.length - 1] ?? 0).toFixed(2)),
      r1P10: Number(percentile(r1Scores, 0.1).toFixed(2)),
      r1P50: Number(percentile(r1Scores, 0.5).toFixed(2)),
      r1P90: Number(percentile(r1Scores, 0.9).toFixed(2)),
      qualificationRate: Number(((qualifiedCount / runs.length) * 100).toFixed(1)),
      winRateAmongQualified: qualifiedCount
        ? Number(((wonCount / qualifiedCount) * 100).toFixed(1))
        : 0,
      probabilityAbove20: Number(
        ((r1Scores.filter((s) => s > 20).length / r1Scores.length) * 100).toFixed(1),
      ),
      probabilityBelow8: Number(
        ((r1Scores.filter((s) => s < 8).length / r1Scores.length) * 100).toFixed(1),
      ),
    };
  });
  await writeFile(
    resolve(OUT_DIR, "party-percentiles.csv"),
    toCsv(partyPercentiles as unknown as Record<string, unknown>[]),
    "utf8",
  );

  // --- 6. résumé --------------------------------------------------------
  const archetypeSummary = Object.fromEntries(
    [...archetypeCounts.entries()].map(([k, v]) => [
      k,
      Number(((v / summaryRows.length) * 100).toFixed(1)),
    ]),
  );
  const summary = {
    generatedAt: new Date().toISOString(),
    totalRuns: summaryRows.length,
    dispersionByCheckpoint: dispersionSummary,
    compressedRaceByCheckpoint: compressedByCheckpoint,
    archetypeDistributionPercent: archetypeSummary,
    leadershipDynamics,
    partyPercentiles,
  };
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(resolve(OUT_DIR, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

await main();
