import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { parseCsv, toCsv } from "../audit-post/lib/csv";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/runoff-final-calibration");

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function mean(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx]!;
}

interface Row {
  finalistLeft: string;
  finalistRight: string;
  r1ScoreLeft: number;
  r1ScoreRight: number;
  r1Margin: number;
  r2ScoreLeft: number;
  r2ScoreRight: number;
  r2Margin: number;
  r2Winner: string;
  favoriteAtR1: string;
  favoriteWonR2: boolean;
  detMarginAt62: number;
  detMarginAt100: number;
  detMarginAt0: number;
  dampingContributionToMargin: number;
  margin_d0: number;
  margin_d025: number;
  margin_d04: number;
  margin_d05: number;
  margin_d062: number;
  margin_d075: number;
  margin_d1: number;
}

async function main() {
  const text = await readFile(resolve(OUT_DIR, "runoff-raw.csv"), "utf8");
  const raw = parseCsv(text);
  const rows: Row[] = raw.map((r) => ({
    finalistLeft: r.finalistLeft!,
    finalistRight: r.finalistRight!,
    r1ScoreLeft: num(r.r1ScoreLeft!),
    r1ScoreRight: num(r.r1ScoreRight!),
    r1Margin: num(r.r1Margin!),
    r2ScoreLeft: num(r.r2ScoreLeft!),
    r2ScoreRight: num(r.r2ScoreRight!),
    r2Margin: num(r.r2Margin!),
    r2Winner: r.r2Winner!,
    favoriteAtR1: r.favoriteAtR1!,
    favoriteWonR2: r.favoriteWonR2 === "true",
    detMarginAt62: num(r.detMarginAt62!),
    detMarginAt100: num(r.detMarginAt100!),
    detMarginAt0: num(r.detMarginAt0!),
    dampingContributionToMargin: num(r.dampingContributionToMargin!),
    margin_d0: num(r["margin_d0"]!),
    margin_d025: num(r["margin_d0.25"]!),
    margin_d04: num(r["margin_d0.4"]!),
    margin_d05: num(r["margin_d0.5"]!),
    margin_d062: num(r["margin_d0.62"]!),
    margin_d075: num(r["margin_d0.75"]!),
    margin_d1: num(r["margin_d1"]!),
  }));

  await mkdir(OUT_DIR, { recursive: true });

  // --- 1. Matrice des duels ---------------------------------------------
  const matchups = new Map<string, Row[]>();
  for (const row of rows) {
    const pair = [row.finalistLeft, row.finalistRight].sort().join("|");
    const list = matchups.get(pair) ?? [];
    list.push(row);
    matchups.set(pair, list);
  }
  const matchupRows = [...matchups.entries()]
    .map(([pair, list]) => {
      const [a, b] = pair.split("|") as [string, string];
      const marginsSorted = list.map((r) => r.r2Margin).sort((x, y) => x - y);
      const aWins = list.filter((r) => r.r2Winner === a).length;
      const bWins = list.filter((r) => r.r2Winner === b).length;
      return {
        partyA: a,
        partyB: b,
        occurrences: list.length,
        aWinRate: Number(((aWins / list.length) * 100).toFixed(1)),
        bWinRate: Number(((bWins / list.length) * 100).toFixed(1)),
        meanMargin: Number(mean(marginsSorted).toFixed(2)),
        medianMargin: Number(median(marginsSorted).toFixed(2)),
        p10Margin: Number(percentile(marginsSorted, 0.1).toFixed(2)),
        p25Margin: Number(percentile(marginsSorted, 0.25).toFixed(2)),
        p75Margin: Number(percentile(marginsSorted, 0.75).toFixed(2)),
        p90Margin: Number(percentile(marginsSorted, 0.9).toFixed(2)),
        below05: Number(((list.filter((r) => r.r2Margin < 0.5).length / list.length) * 100).toFixed(1)),
        below1: Number(((list.filter((r) => r.r2Margin < 1).length / list.length) * 100).toFixed(1)),
        below2: Number(((list.filter((r) => r.r2Margin < 2).length / list.length) * 100).toFixed(1)),
        above5: Number(((list.filter((r) => r.r2Margin > 5).length / list.length) * 100).toFixed(1)),
        above10: Number(((list.filter((r) => r.r2Margin > 10).length / list.length) * 100).toFixed(1)),
        exact5050: list.filter((r) => r.r2Margin === 0).length,
        favoriteWinsRate: Number(
          ((list.filter((r) => r.favoriteWonR2).length / list.length) * 100).toFixed(1),
        ),
      };
    })
    .sort((a, b) => b.occurrences - a.occurrences);
  await writeFile(resolve(OUT_DIR, "runoff-matchups.csv"), toCsv(matchupRows), "utf8");

  // --- 2. Distribution des marges (globale) ------------------------------
  const allMargins = rows.map((r) => r.r2Margin).sort((a, b) => a - b);
  const marginDistribution = {
    n: allMargins.length,
    mean: Number(mean(allMargins).toFixed(2)),
    median: Number(median(allMargins).toFixed(2)),
    stdDev: Number(
      Math.sqrt(mean(allMargins.map((m) => (m - mean(allMargins)) ** 2))).toFixed(2),
    ),
    p10: Number(percentile(allMargins, 0.1).toFixed(2)),
    p25: Number(percentile(allMargins, 0.25).toFixed(2)),
    p75: Number(percentile(allMargins, 0.75).toFixed(2)),
    p90: Number(percentile(allMargins, 0.9).toFixed(2)),
    below05pct: Number(((allMargins.filter((m) => m < 0.5).length / allMargins.length) * 100).toFixed(2)),
    below1pct: Number(((allMargins.filter((m) => m < 1).length / allMargins.length) * 100).toFixed(2)),
    below2pct: Number(((allMargins.filter((m) => m < 2).length / allMargins.length) * 100).toFixed(2)),
    below5pct: Number(((allMargins.filter((m) => m < 5).length / allMargins.length) * 100).toFixed(2)),
    above5pct: Number(((allMargins.filter((m) => m > 5).length / allMargins.length) * 100).toFixed(2)),
    above10pct: Number(((allMargins.filter((m) => m > 10).length / allMargins.length) * 100).toFixed(2)),
    exactTieCount: allMargins.filter((m) => m === 0).length,
  };
  await writeFile(
    resolve(OUT_DIR, "runoff-margin-distribution.csv"),
    toCsv([marginDistribution]),
    "utf8",
  );

  // --- 3. Courses serrées -------------------------------------------------
  const closeRaces = rows
    .filter((r) => r.r2Margin < 2)
    .map((r) => ({
      finalistLeft: r.finalistLeft,
      finalistRight: r.finalistRight,
      r1Margin: r.r1Margin,
      r2Margin: r.r2Margin,
      r2ScoreLeft: r.r2ScoreLeft,
      r2ScoreRight: r.r2ScoreRight,
      favoriteAtR1: r.favoriteAtR1,
      favoriteWonR2: r.favoriteWonR2,
    }));
  await writeFile(resolve(OUT_DIR, "runoff-close-races.csv"), toCsv(closeRaces), "utf8");

  // --- 4. Damping — sensibilité globale (agrégat) ------------------------
  const dampingCols: Array<[string, keyof Row]> = [
    ["0", "margin_d0"],
    ["0.25", "margin_d025"],
    ["0.4", "margin_d04"],
    ["0.5", "margin_d05"],
    ["0.62 (production)", "margin_d062"],
    ["0.75", "margin_d075"],
    ["1.0 (aucun damping)", "margin_d1"],
  ];
  const dampingSensitivity = dampingCols.map(([label, key]) => {
    const margins = rows.map((r) => r[key] as number).sort((a, b) => a - b);
    return {
      damping: label,
      meanMargin: Number(mean(margins).toFixed(2)),
      medianMargin: Number(median(margins).toFixed(2)),
      stdDevMargin: Number(
        Math.sqrt(mean(margins.map((m) => (m - mean(margins)) ** 2))).toFixed(2),
      ),
      below1pct: Number(((margins.filter((m) => m < 1).length / margins.length) * 100).toFixed(1)),
      below2pct: Number(((margins.filter((m) => m < 2).length / margins.length) * 100).toFixed(1)),
      above5pct: Number(((margins.filter((m) => m > 5).length / margins.length) * 100).toFixed(1)),
      above10pct: Number(((margins.filter((m) => m > 10).length / margins.length) * 100).toFixed(1)),
    };
  });
  await writeFile(resolve(OUT_DIR, "damping-sensitivity.csv"), toCsv(dampingSensitivity), "utf8");

  // --- 5. Ties / 50-50 -----------------------------------------------------
  const ties = rows.filter((r) => r.r2Margin === 0 || r.r2Margin < 0.1);
  await writeFile(
    resolve(OUT_DIR, "ties.csv"),
    toCsv(
      ties.map((r) => ({
        finalistLeft: r.finalistLeft,
        finalistRight: r.finalistRight,
        r2ScoreLeft: r.r2ScoreLeft,
        r2ScoreRight: r.r2ScoreRight,
        r2Margin: r.r2Margin,
        r2Winner: r.r2Winner,
        detMarginAt62: r.detMarginAt62,
      })),
    ),
    "utf8",
  );

  // --- 6. Archétypes de second tour ---------------------------------------
  let closeDuel = 0;
  let clearVictory = 0;
  let largeVictory = 0;
  let comeback = 0;
  let collapse = 0;
  for (const r of rows) {
    if (r.r2Margin < 2) closeDuel += 1;
    else if (r.r2Margin <= 7) clearVictory += 1;
    else largeVictory += 1;
    const favoriteAtR1IsWinner = r.favoriteWonR2;
    if (!favoriteAtR1IsWinner && r.r1Margin >= 3) comeback += 1;
    if (favoriteAtR1IsWinner === false && r.r1Margin >= 5) collapse += 1;
  }
  const archetypes = {
    totalRuns: rows.length,
    closeDuelPercent: Number(((closeDuel / rows.length) * 100).toFixed(1)),
    clearVictoryPercent: Number(((clearVictory / rows.length) * 100).toFixed(1)),
    largeVictoryPercent: Number(((largeVictory / rows.length) * 100).toFixed(1)),
    comebackPercent: Number(((comeback / rows.length) * 100).toFixed(1)),
    collapsePercent: Number(((collapse / rows.length) * 100).toFixed(1)),
    favoriteAtR1WinsR2Percent: Number(
      ((rows.filter((r) => r.favoriteWonR2).length / rows.length) * 100).toFixed(1),
    ),
  };
  await writeFile(resolve(OUT_DIR, "runoff-archetypes.csv"), toCsv([archetypes]), "utf8");

  // --- 7. Décomposition (retenu vs transféré vs damping) -------------------
  const dampingContribution = rows.map((r) => r.dampingContributionToMargin).sort((a, b) => a - b);
  const decomposition = {
    meanMarginWithDamping62: Number(mean(rows.map((r) => r.detMarginAt62)).toFixed(2)),
    meanMarginNoDamping100: Number(mean(rows.map((r) => r.detMarginAt100)).toFixed(2)),
    meanMarginNoDamping0: Number(mean(rows.map((r) => r.detMarginAt0)).toFixed(2)),
    meanDampingContributionToMargin: Number(mean(dampingContribution).toFixed(2)),
    medianDampingContributionToMargin: Number(median(dampingContribution).toFixed(2)),
    p90DampingContributionToMargin: Number(percentile(dampingContribution, 0.9).toFixed(2)),
    dampingErasesMoreThanHalfMarginPercent: Number(
      (
        (rows.filter((r) => r.detMarginAt100 > 0 && r.detMarginAt62 < r.detMarginAt100 / 2).length /
          rows.length) *
        100
      ).toFixed(1),
    ),
  };
  await writeFile(resolve(OUT_DIR, "runoff-components.csv"), toCsv([decomposition]), "utf8");

  console.log(
    JSON.stringify(
      {
        totalRunoffRuns: rows.length,
        uniqueMatchups: matchupRows.length,
        marginDistribution,
        archetypes,
        decomposition,
        dampingSensitivity,
      },
      null,
      2,
    ),
  );
}

await main();
