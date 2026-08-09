/**
 * Fun/replayability audit — analysis pass.
 * Reads the corpus produced by simulate.ts and ab-experiment.ts (real
 * engine, no reimplementation) and derives every metric requested by
 * PROMPT_CLAUDE_CODE_AUDIT_FUN_REJOUABILITE.md sections 5-22, 27, 29-30.
 *
 * Every formula in this file is a documented heuristic proxy, not a
 * scientific measurement of "fun" — this is stated explicitly in each
 * relevant section of AUDIT_FUN_REJOUABILITE.md, per the mission's own
 * instruction (section 27: "Ne prétends pas qu'il mesure objectivement le
 * plaisir humain. Utilise-le comme outil comparatif.").
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { num, parseCsv, str, toCsv } from "../audit-post/lib/csv";
import { frequency, mean, median, percentile, stddev } from "../audit-post/lib/stats";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/fun-audit");

const EXISTING_PARTY_IDS = gameContent.parties.filter((p) => p.isRealOrganization).map((p) => p.id);
const EVENT_BY_ID = new Map(gameContent.events.map((e) => [e.id, e]));
const EVENTS_BY_PARTY_ACCESSIBLE = new Map<string, number>();
for (const partyId of EXISTING_PARTY_IDS) {
  const accessible = gameContent.events.filter((e) => {
    if (e.eligibleParties && !e.eligibleParties.includes(partyId)) return false;
    if (e.excludedParties?.includes(partyId)) return false;
    return true;
  }).length;
  EVENTS_BY_PARTY_ACCESSIBLE.set(partyId, accessible);
}

async function loadCsv(name: string): Promise<Record<string, string>[]> {
  const text = await readFile(resolve(OUT_DIR, name), "utf8");
  return parseCsv(text);
}

function bool(v: string | undefined): boolean {
  return v === "true";
}

function clamp01to10(v: number): number {
  return Math.max(0, Math.min(10, v));
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const runs = await loadCsv("run-summaries.csv");
  const decisions = await loadCsv("decisions.csv");
  const abRows = await loadCsv("ab-experiment.csv");

  const existingRuns = runs.filter((r) => str(r.partyKind) === "existing");
  const existingDecisions = decisions.filter((d) => str(d.partyKind) === "existing");

  // ---------------------------------------------------------------------
  // 1. PACING (section 5) — phase-level rhythm.
  // ---------------------------------------------------------------------
  const phaseOrder = [
    "pre_campaign",
    "campaign",
    "official_campaign",
    "between_rounds",
    "government_epilogue",
  ];
  const phaseRows = phaseOrder
    .map((phase) => {
      const rows = existingDecisions.filter((d) => str(d.phase) === phase);
      if (rows.length === 0) return null;
      const intensities = rows.map((r) => num(r.intensityEstimate));
      const pollAbsDeltas = rows.map((r) => Math.abs(num(r.pollDelta)));
      const rankChangeRate = rows.filter((r) => bool(r.rankChanged)).length / rows.length;
      const rareRate = rows.filter((r) => bool(r.isRare)).length / rows.length;
      const weakRate = rows.filter((r) => bool(r.isWeak)).length / rows.length;
      const qualFlipRate = rows.filter((r) => bool(r.qualificationFlip)).length / rows.length;
      return {
        phase,
        decisions: rows.length,
        meanIntensity: Number(mean(intensities).toFixed(3)),
        meanAbsPollDelta: Number(mean(pollAbsDeltas).toFixed(3)),
        rankChangeRate: Number(rankChangeRate.toFixed(4)),
        qualificationFlipRate: Number(qualFlipRate.toFixed(4)),
        rareEventRate: Number(rareRate.toFixed(4)),
        weakCardRate: Number(weakRate.toFixed(4)),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  await writeFile(resolve(OUT_DIR, "pacing.csv"), toCsv(phaseRows), "utf8");

  // ---------------------------------------------------------------------
  // 2. TENSION (used by sections 5-6) — normalized progress through the
  //    campaign (decile of decisionIndex / total decisions in that run).
  // ---------------------------------------------------------------------
  const runDecisionCount = new Map(existingRuns.map((r) => [str(r.runKey), num(r.decisions)]));
  const decileBuckets = new Map<
    number,
    { intensity: number[]; absDelta: number[]; rankFlip: number[] }
  >();
  for (const d of existingDecisions) {
    const total = runDecisionCount.get(str(d.runKey)) ?? 1;
    const decile = Math.min(9, Math.floor((num(d.decisionIndex) / Math.max(1, total)) * 10));
    if (!decileBuckets.has(decile))
      decileBuckets.set(decile, { intensity: [], absDelta: [], rankFlip: [] });
    const bucket = decileBuckets.get(decile)!;
    bucket.intensity.push(num(d.intensityEstimate));
    bucket.absDelta.push(Math.abs(num(d.pollDelta)));
    bucket.rankFlip.push(bool(d.rankChanged) ? 1 : 0);
  }
  const tensionRows = [...decileBuckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decile, b]) => ({
      campaignDecile: decile,
      n: b.intensity.length,
      meanIntensity: Number(mean(b.intensity).toFixed(3)),
      meanAbsPollDelta: Number(mean(b.absDelta).toFixed(3)),
      rankChangeRate: Number(mean(b.rankFlip).toFixed(4)),
    }));
  await writeFile(resolve(OUT_DIR, "tension.csv"), toCsv(tensionRows), "utf8");

  // ---------------------------------------------------------------------
  // 3. EVENT-LEVEL GRADING (section 6) — S/A/B/C/D/F per event.
  // ---------------------------------------------------------------------
  const decisionsByEvent = new Map<string, Record<string, string>[]>();
  for (const d of existingDecisions) {
    const id = str(d.eventId);
    if (!decisionsByEvent.has(id)) decisionsByEvent.set(id, []);
    decisionsByEvent.get(id)!.push(d);
  }
  interface EventFunRow {
    eventId: string;
    title: string;
    category: string;
    rarity: string;
    occurrences: number;
    meanIntensity: number;
    meanAbsPollDelta: number;
    choiceEntropyNormalized: number;
    dominantChoiceShare: number;
    isChain: boolean;
    isRare: boolean;
    compositeScore: number;
    grade: string;
  }
  const eventRows: EventFunRow[] = [];
  for (const [eventId, rows] of decisionsByEvent) {
    const def = EVENT_BY_ID.get(eventId);
    const occurrences = rows.length;
    const intensity = mean(rows.map((r) => num(r.intensityEstimate)));
    const absDelta = mean(rows.map((r) => Math.abs(num(r.pollDelta))));
    const labelFreq = frequency(rows.map((r) => str(r.choiceLabel)));
    const totalPicks = labelFreq.reduce((s, f) => s + f.count, 0);
    const dominantShare = totalPicks ? (labelFreq[0]?.count ?? 0) / totalPicks : 0;
    // Shannon entropy of the choice-selection distribution, normalized by
    // log2(numberOfDistinctOptionsObserved) so a 2-option and a 4-option
    // event are comparable on the same 0..1 scale (1 = perfectly even split).
    const k = labelFreq.length;
    let entropy = 0;
    if (k > 1 && totalPicks > 0) {
      for (const f of labelFreq) {
        const p = f.count / totalPicks;
        if (p > 0) entropy -= p * Math.log2(p);
      }
      entropy /= Math.log2(k);
    }
    const isChain = Boolean(def?.chain);
    const isRare = def ? def.rarity !== "common" && def.rarity !== "uncommon" : false;
    // Composite score (heuristic, documented): real-dilemma signal (entropy,
    // i.e. agents of different profiles genuinely disagree on the best
    // option) is weighted most heavily, then measurable impact, then
    // structural markers of a "moment" (chain membership, rarity bonus
    // tempered by how rarely it is even seen, since ultra-rare events
    // score high on "exceptional" but need a minimum occurrence floor to
    // be graded at all reliably).
    const composite =
      entropy * 45 +
      Math.min(1, absDelta / 6) * 25 +
      (isChain ? 12 : 0) +
      (isRare ? 8 : 0) +
      Math.min(1, occurrences / 40) * 10;
    let grade = "F";
    if (composite >= 70) grade = "S";
    else if (composite >= 55) grade = "A";
    else if (composite >= 40) grade = "B";
    else if (composite >= 25) grade = "C";
    else if (composite >= 12) grade = "D";
    if (dominantShare >= 0.92 && occurrences >= 8) grade = "F"; // near-total dominance overrides: no real dilemma in practice
    eventRows.push({
      eventId,
      title: def?.title ?? eventId,
      category: def?.category ?? "",
      rarity: def?.rarity ?? "",
      occurrences,
      meanIntensity: Number(intensity.toFixed(2)),
      meanAbsPollDelta: Number(absDelta.toFixed(2)),
      choiceEntropyNormalized: Number(entropy.toFixed(3)),
      dominantChoiceShare: Number(dominantShare.toFixed(3)),
      isChain,
      isRare,
      compositeScore: Number(composite.toFixed(1)),
      grade,
    });
  }
  eventRows.sort((a, b) => b.compositeScore - a.compositeScore);
  await writeFile(
    resolve(OUT_DIR, "event-fun.csv"),
    toCsv(eventRows as unknown as Record<string, unknown>[]),
    "utf8",
  );

  // ---------------------------------------------------------------------
  // 4. RANDOM EVENT VALUE (section 7) — world/scandal ("opportunistic
  //    randomness") vs the rest, plus the A/B comparison.
  // ---------------------------------------------------------------------
  const randomCategories = new Set(["world", "scandal"]);
  // Classification is RELATIVE (percentile within this game's own
  // world/scandal events), not an absolute point threshold. An earlier
  // version of this script used a fixed absPollDelta>=1.5 cutoff for
  // "intéressant" and it produced a degenerate 0/24 result — not because
  // these events add nothing, but because this catalogue's world/scandal
  // events are deliberately modest in raw point impact while still
  // carrying real narrative/dilemma weight (see composite score, which
  // already rewards entropy, chain membership and rarity, not just poll
  // swing). A fixed absolute threshold silently smuggled in "big number =
  // interesting", which is exactly the fallacy section 2 of the mission
  // prompt warns against. Percentile ranking on the SAME composite score
  // used for event-fun.csv avoids that, at the cost of guaranteeing a
  // three-way split by construction — documented here, not hidden.
  const randomCandidates = eventRows.filter((e) => randomCategories.has(e.category));
  const sortedByComposite = [...randomCandidates].sort(
    (a, b) => b.compositeScore - a.compositeScore,
  );
  const tertile = Math.ceil(sortedByComposite.length / 3);
  const interestingIds = new Set(sortedByComposite.slice(0, tertile).map((e) => e.eventId));
  const frustratingIds = new Set(
    sortedByComposite
      .slice(-tertile)
      .filter(
        (e) => e.dominantChoiceShare >= 0.55 || e.meanAbsPollDelta >= 5.5 || e.compositeScore < 20,
      )
      .map((e) => e.eventId),
  );
  const randomRows = randomCandidates.map((e) => {
    let bucket: "interessant" | "neutre" | "frustrant" = "neutre";
    if (interestingIds.has(e.eventId)) bucket = "interessant";
    else if (frustratingIds.has(e.eventId)) bucket = "frustrant";
    return { ...e, valueBucket: bucket };
  });
  await writeFile(
    resolve(OUT_DIR, "random-event-value.csv"),
    toCsv(randomRows as unknown as Record<string, unknown>[]),
    "utf8",
  );

  // A/B: baseline vs no-opportunistic-randomness (B1), matched by
  // party+profile+seedIndex.
  function abCompare(variantA: string, variantB: string) {
    const aRows = abRows.filter((r) => str(r.variant) === variantA);
    const bByKey = new Map(
      abRows
        .filter((r) => str(r.variant) === variantB)
        .map((r) => [`${str(r.partyId)}:${str(r.profile)}:${str(r.seedIndex)}`, r]),
    );
    const paired: Array<{ a: Record<string, string>; b: Record<string, string> }> = [];
    for (const a of aRows) {
      const b = bByKey.get(`${str(a.partyId)}:${str(a.profile)}:${str(a.seedIndex)}`);
      if (b) paired.push({ a, b });
    }
    const scoreDiff = mean(paired.map((p) => Math.abs(num(p.a.finalScore) - num(p.b.finalScore))));
    const eventSetDiff = mean(
      paired.map((p) => (p.a.eventIdSetHash === p.b.eventIdSetHash ? 0 : 1)),
    );
    const rankVolDiff = mean(paired.map((p) => num(p.a.rankVolatility) - num(p.b.rankVolatility)));
    const pollStdevDiff = mean(paired.map((p) => num(p.a.pollStdev) - num(p.b.pollStdev)));
    const momentsDiff = mean(
      paired.map(
        (p) => num(p.a.rareOrChainOrConflictMoments) - num(p.b.rareOrChainOrConflictMoments),
      ),
    );
    const outcomeChangedShare =
      paired.filter(
        (p) =>
          bool2(p.a.qualified ?? "") !== bool2(p.b.qualified ?? "") ||
          bool2(p.a.won ?? "") !== bool2(p.b.won ?? ""),
      ).length / Math.max(1, paired.length);
    return {
      variantA,
      variantB,
      pairedN: paired.length,
      meanAbsScoreDiff: Number(scoreDiff.toFixed(2)),
      shareWithDifferentEventSet: Number(eventSetDiff.toFixed(3)),
      meanRankVolatilityDiff: Number(rankVolDiff.toFixed(3)),
      meanPollStdevDiff: Number(pollStdevDiff.toFixed(2)),
      meanMomentsDiff: Number(momentsDiff.toFixed(2)),
      outcomeChangedShare: Number(outcomeChangedShare.toFixed(3)),
    };
  }
  function bool2(v: string): boolean {
    return v === "true";
  }
  const abSummaries = [
    abCompare("A_baseline", "B1_no_opportunistic_randomness"),
    abCompare("A_baseline", "B2_no_rare_events"),
    abCompare("A_baseline", "C_no_narrative_memory"),
    abCompare("A_baseline", "E_no_ideology_effects"),
    abCompare("A_baseline", "F_no_delayed_consequences"),
  ];
  await writeFile(
    resolve(OUT_DIR, "ab-summary.json"),
    JSON.stringify(abSummaries, null, 2),
    "utf8",
  );

  // ---------------------------------------------------------------------
  // 5. RARE EVENT VALUE (section 8).
  // ---------------------------------------------------------------------
  const totalRunsExisting = existingRuns.length;
  const rareRows = eventRows
    .filter((e) => e.isRare)
    .map((e) => {
      const freqShare = e.occurrences / Math.max(1, totalRunsExisting);
      let classification = "interessant";
      if (freqShare > 0.35) classification = "trop_frequent";
      else if (freqShare < 0.01) classification = "trop_rare";
      else if (e.compositeScore >= 65 && e.isChain) classification = "exceptionnel";
      else if (e.compositeScore >= 55) classification = "memorable";
      else if (e.compositeScore < 25) classification = "gadget";
      const powerClass =
        e.meanAbsPollDelta >= 8
          ? "trop_puissant"
          : e.meanAbsPollDelta < 1
            ? "pas_assez_puissant"
            : "calibre";
      return { ...e, frequencyShare: Number(freqShare.toFixed(4)), classification, powerClass };
    });
  await writeFile(
    resolve(OUT_DIR, "rare-event-value.csv"),
    toCsv(rareRows as unknown as Record<string, unknown>[]),
    "utf8",
  );

  // ---------------------------------------------------------------------
  // 6. CHOICE DOMINANCE (section 13, and reused by section 6).
  // ---------------------------------------------------------------------
  const dominanceRows = eventRows
    .filter((e) => e.occurrences >= 10)
    .map((e) => ({
      eventId: e.eventId,
      title: e.title,
      occurrences: e.occurrences,
      dominantChoiceShare: e.dominantChoiceShare,
      isDominant: e.dominantChoiceShare >= 0.8,
    }))
    .sort((a, b) => b.dominantChoiceShare - a.dominantChoiceShare);
  await writeFile(
    resolve(OUT_DIR, "choice-dominance.csv"),
    toCsv(dominanceRows as unknown as Record<string, unknown>[]),
    "utf8",
  );

  // ---------------------------------------------------------------------
  // 7. LOW-INTENSITY STREAKS (section 30).
  // ---------------------------------------------------------------------
  const streaksByParty = new Map<string, number[]>();
  for (const r of existingRuns) {
    const p = str(r.partyId);
    if (!streaksByParty.has(p)) streaksByParty.set(p, []);
    streaksByParty.get(p)!.push(num(r.maxWeakCardStreak));
  }
  const streakRows = [...streaksByParty.entries()].map(([partyId, streaks]) => ({
    partyId,
    n: streaks.length,
    meanMaxStreak: Number(mean(streaks).toFixed(2)),
    medianMaxStreak: median(streaks),
    p90MaxStreak: percentile(streaks, 0.9),
    shareWithStreak3Plus: Number(
      (streaks.filter((s) => s >= 3).length / streaks.length).toFixed(3),
    ),
    shareWithStreak5Plus: Number(
      (streaks.filter((s) => s >= 5).length / streaks.length).toFixed(3),
    ),
  }));
  const allStreaks = existingRuns.map((r) => num(r.maxWeakCardStreak));
  streakRows.unshift({
    partyId: "ALL",
    n: allStreaks.length,
    meanMaxStreak: Number(mean(allStreaks).toFixed(2)),
    medianMaxStreak: median(allStreaks),
    p90MaxStreak: percentile(allStreaks, 0.9),
    shareWithStreak3Plus: Number(
      (allStreaks.filter((s) => s >= 3).length / allStreaks.length).toFixed(3),
    ),
    shareWithStreak5Plus: Number(
      (allStreaks.filter((s) => s >= 5).length / allStreaks.length).toFixed(3),
    ),
  });
  await writeFile(resolve(OUT_DIR, "low-intensity-streaks.csv"), toCsv(streakRows), "utf8");

  // ---------------------------------------------------------------------
  // 8. COMEBACKS / REVERSALS (section 17).
  // ---------------------------------------------------------------------
  const comebackByParty = new Map<string, Record<string, string>[]>();
  for (const r of existingRuns) {
    const p = str(r.partyId);
    if (!comebackByParty.has(p)) comebackByParty.set(p, []);
    comebackByParty.get(p)!.push(r);
  }
  const comebackRows = [...comebackByParty.entries()].map(([partyId, rows]) => {
    const withReversal = rows.filter((r) => num(r.qualificationZoneCrossings) >= 1).length;
    const withMultiple = rows.filter((r) => num(r.qualificationZoneCrossings) >= 2).length;
    const noneAtAll = rows.filter((r) => num(r.qualificationZoneCrossings) === 0).length;
    return {
      partyId,
      n: rows.length,
      shareWithAtLeastOneReversal: Number((withReversal / rows.length).toFixed(3)),
      shareWithMultipleReversals: Number((withMultiple / rows.length).toFixed(3)),
      shareWithNoReversal: Number((noneAtAll / rows.length).toFixed(3)),
      comebackRate: Number(
        (rows.filter((r) => bool(r.isComeback)).length / rows.length).toFixed(3),
      ),
      collapseRate: Number(
        (rows.filter((r) => bool(r.isCollapse)).length / rows.length).toFixed(3),
      ),
    };
  });
  const allReversal = existingRuns.filter((r) => num(r.qualificationZoneCrossings) >= 1).length;
  comebackRows.unshift({
    partyId: "ALL",
    n: existingRuns.length,
    shareWithAtLeastOneReversal: Number((allReversal / existingRuns.length).toFixed(3)),
    shareWithMultipleReversals: Number(
      (
        existingRuns.filter((r) => num(r.qualificationZoneCrossings) >= 2).length /
        existingRuns.length
      ).toFixed(3),
    ),
    shareWithNoReversal: Number(
      (
        existingRuns.filter((r) => num(r.qualificationZoneCrossings) === 0).length /
        existingRuns.length
      ).toFixed(3),
    ),
    comebackRate: Number(
      (existingRuns.filter((r) => bool(r.isComeback)).length / existingRuns.length).toFixed(3),
    ),
    collapseRate: Number(
      (existingRuns.filter((r) => bool(r.isCollapse)).length / existingRuns.length).toFixed(3),
    ),
  });
  await writeFile(resolve(OUT_DIR, "comeback.csv"), toCsv(comebackRows), "utf8");

  // ---------------------------------------------------------------------
  // 9. REPLAYABILITY CURVE (section 12) — sequential seeds of the
  //    "neutral_baseline" profile, per party, as a proxy for a player
  //    replaying the same party repeatedly without deliberately hunting
  //    for variety.
  // ---------------------------------------------------------------------
  const replayRows: Array<{
    partyId: string;
    gamesPlayed: number;
    cumulativeUniqueEvents: number;
    pctOfAccessibleCatalog: number;
    newContentShareThisGame: number;
  }> = [];
  for (const partyId of EXISTING_PARTY_IDS) {
    const rowsForParty = existingDecisions.filter(
      (d) => str(d.partyId) === partyId && str(d.profile) === "neutral_baseline",
    );
    const bySeed = new Map<number, Set<string>>();
    for (const d of rowsForParty) {
      const seed = num(d.seedIndex);
      if (!bySeed.has(seed)) bySeed.set(seed, new Set());
      bySeed.get(seed)!.add(str(d.eventId));
    }
    const seeds = [...bySeed.keys()].sort((a, b) => a - b);
    const seen = new Set<string>();
    const checkpoints = new Set([1, 2, 3, 5, 10, 20]);
    let gamesPlayed = 0;
    const accessible = EVENTS_BY_PARTY_ACCESSIBLE.get(partyId) ?? gameContent.events.length;
    for (const seedIndex of seeds) {
      gamesPlayed += 1;
      const thisGameEvents = bySeed.get(seedIndex)!;
      const newOnes = [...thisGameEvents].filter((id) => !seen.has(id));
      const newShare = thisGameEvents.size ? newOnes.length / thisGameEvents.size : 0;
      for (const id of thisGameEvents) seen.add(id);
      if (checkpoints.has(gamesPlayed)) {
        replayRows.push({
          partyId,
          gamesPlayed,
          cumulativeUniqueEvents: seen.size,
          pctOfAccessibleCatalog: Number(((seen.size / accessible) * 100).toFixed(1)),
          newContentShareThisGame: Number(newShare.toFixed(3)),
        });
      }
    }
  }
  await writeFile(resolve(OUT_DIR, "replayability.csv"), toCsv(replayRows), "utf8");

  // ---------------------------------------------------------------------
  // 10. PARTY SIMILARITY MATRIX (section 11).
  //
  // Per-GAME Jaccard (event set of one specific playthrough vs another),
  // matched on profile+seedIndex so the two games being compared differ
  // only in which party played them — NOT the Jaccard of the two parties'
  // aggregate lifetime catalogues (which converges upward as more seeds
  // accumulate and is not what "do two playthroughs feel similar" asks).
  // This mirrors the methodology of GAMEPLAY_AUDIT.md's
  // cross-party-overlap.csv (cross-party 0.126 vs intra-party 0.244 there)
  // so the two reports' similarity figures are comparable rather than
  // silently measuring different things under the same metric name.
  // ---------------------------------------------------------------------
  const eventSetByParty = new Map<string, Set<string>>(); // full lifetime union, kept for identity/specificity use below
  const eventSetByGame = new Map<string, Set<string>>(); // key: party::profile::seedIndex
  const strategyDistByParty = new Map<string, Map<string, number>>();
  for (const partyId of EXISTING_PARTY_IDS) {
    const rows = existingDecisions.filter((d) => str(d.partyId) === partyId);
    eventSetByParty.set(partyId, new Set(rows.map((r) => str(r.eventId))));
    const dist = new Map<string, number>();
    for (const r of rows) {
      const key = str(r.choiceStrategy) || "none";
      dist.set(key, (dist.get(key) ?? 0) + 1);
    }
    strategyDistByParty.set(partyId, dist);
  }
  for (const d of existingDecisions) {
    const key = `${str(d.partyId)}::${str(d.profile)}::${str(d.seedIndex)}`;
    if (!eventSetByGame.has(key)) eventSetByGame.set(key, new Set());
    eventSetByGame.get(key)!.add(str(d.eventId));
  }
  function jaccard(a: Set<string>, b: Set<string>): number {
    const inter = [...a].filter((x) => b.has(x)).length;
    const union = new Set([...a, ...b]).size;
    return union ? inter / union : 0;
  }
  function cosineOnDist(a: Map<string, number>, b: Map<string, number>): number {
    const keys = new Set([...a.keys(), ...b.keys()]);
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (const k of keys) {
      const av = a.get(k) ?? 0;
      const bv = b.get(k) ?? 0;
      dot += av * bv;
      na += av * av;
      nb += bv * bv;
    }
    return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
  }
  const PROFILE_SAMPLE = [
    "strategist",
    "roleplayer",
    "opportunist",
    "chaos",
    "cautious",
    "narrative",
    "beginner",
    "neutral_baseline",
    "risk_seeking_ref",
  ];
  const similarityRows: Array<{
    partyA: string;
    partyB: string;
    crossPartyGameJaccard: number;
    intraPartyGameJaccardA: number;
    intraPartyGameJaccardB: number;
    strategyCosine: number;
  }> = [];
  const intraPartyJaccardCache = new Map<string, number>();
  function intraPartyJaccard(partyId: string): number {
    if (intraPartyJaccardCache.has(partyId)) return intraPartyJaccardCache.get(partyId)!;
    const samples: number[] = [];
    for (const profile of PROFILE_SAMPLE) {
      const sets: Set<string>[] = [];
      for (let s = 0; s < 20; s += 1) {
        const set = eventSetByGame.get(`${partyId}::${profile}::${s}`);
        if (set) sets.push(set);
      }
      for (let i = 0; i < sets.length; i += 1) {
        for (let j = i + 1; j < sets.length; j += 1) {
          samples.push(jaccard(sets[i]!, sets[j]!));
        }
      }
    }
    const value = mean(samples);
    intraPartyJaccardCache.set(partyId, value);
    return value;
  }
  for (const a of EXISTING_PARTY_IDS) {
    for (const b of EXISTING_PARTY_IDS) {
      if (a >= b) continue;
      const crossSamples: number[] = [];
      for (const profile of PROFILE_SAMPLE) {
        for (let s = 0; s < 20; s += 1) {
          const setA = eventSetByGame.get(`${a}::${profile}::${s}`);
          const setB = eventSetByGame.get(`${b}::${profile}::${s}`);
          if (setA && setB) crossSamples.push(jaccard(setA, setB));
        }
      }
      similarityRows.push({
        partyA: a,
        partyB: b,
        crossPartyGameJaccard: Number(mean(crossSamples).toFixed(4)),
        intraPartyGameJaccardA: Number(intraPartyJaccard(a).toFixed(4)),
        intraPartyGameJaccardB: Number(intraPartyJaccard(b).toFixed(4)),
        strategyCosine: Number(
          cosineOnDist(strategyDistByParty.get(a)!, strategyDistByParty.get(b)!).toFixed(4),
        ),
      });
    }
  }
  await writeFile(resolve(OUT_DIR, "party-similarity.csv"), toCsv(similarityRows), "utf8");
  const overallIntraPartyJaccard = mean(EXISTING_PARTY_IDS.map((p) => intraPartyJaccard(p)));
  const overallCrossPartyJaccard = mean(similarityRows.map((r) => r.crossPartyGameJaccard));

  // ---------------------------------------------------------------------
  // 11. NARRATIVE DENSITY (used by sections 18-19).
  // ---------------------------------------------------------------------
  const narrativeByParty = new Map<string, Record<string, string>[]>(comebackByParty);
  const narrativeRows = [...narrativeByParty.entries()].map(([partyId, rows]) => ({
    partyId,
    n: rows.length,
    meanMemorableSignals: Number(mean(rows.map((r) => num(r.memorableSignalCount))).toFixed(2)),
    shareWithAtLeast1Signal: Number(
      (rows.filter((r) => num(r.memorableSignalCount) >= 1).length / rows.length).toFixed(3),
    ),
    shareWithAtLeast2Signals: Number(
      (rows.filter((r) => num(r.memorableSignalCount) >= 2).length / rows.length).toFixed(3),
    ),
    shareWithAtLeast3Signals: Number(
      (rows.filter((r) => num(r.memorableSignalCount) >= 3).length / rows.length).toFixed(3),
    ),
    meanActorMemoryEntries: Number(mean(rows.map((r) => num(r.actorMemoryEntries))).toFixed(2)),
    meanAbruptReversals: Number(mean(rows.map((r) => num(r.abruptReversalCount))).toFixed(2)),
  }));
  await writeFile(resolve(OUT_DIR, "narrative-density.csv"), toCsv(narrativeRows), "utf8");

  const allMemorable = existingRuns.map((r) => num(r.memorableSignalCount));
  const memorableSummary = {
    meanSignals: Number(mean(allMemorable).toFixed(2)),
    shareAtLeast1: Number(
      (allMemorable.filter((v) => v >= 1).length / allMemorable.length).toFixed(3),
    ),
    shareAtLeast2: Number(
      (allMemorable.filter((v) => v >= 2).length / allMemorable.length).toFixed(3),
    ),
    shareAtLeast3: Number(
      (allMemorable.filter((v) => v >= 3).length / allMemorable.length).toFixed(3),
    ),
  };

  // ---------------------------------------------------------------------
  // 12. SECOND ROUND FUN (section 21).
  // ---------------------------------------------------------------------
  const secondRoundRows = EXISTING_PARTY_IDS.map((partyId) => {
    const rows = existingRuns.filter((r) => str(r.partyId) === partyId);
    const reached = rows.filter((r) => bool(r.secondRoundReached));
    const secondRoundDecisions = existingDecisions.filter(
      (d) =>
        str(d.partyId) === partyId &&
        (str(d.phase) === "between_rounds" || str(d.phase) === "government"),
    );
    const firstRoundDecisions = existingDecisions.filter(
      (d) =>
        str(d.partyId) === partyId &&
        (str(d.phase) === "pre_campaign" ||
          str(d.phase) === "campaign" ||
          str(d.phase) === "official_campaign"),
    );
    return {
      partyId,
      n: rows.length,
      secondRoundReachedShare: Number((reached.length / rows.length).toFixed(3)),
      victoryGivenQualifiedShare: Number(
        (
          rows.filter((r) => bool(r.qualified) && bool(r.won)).length /
          Math.max(1, rows.filter((r) => bool(r.qualified)).length)
        ).toFixed(3),
      ),
      meanOwnRejectionAtSecondRound: Number(
        mean(
          reached.map((r) => num(r.ownRejectionAtSecondRound)).filter((v) => !Number.isNaN(v)),
        ).toFixed(2),
      ),
      meanOpponentRejectionAtSecondRound: Number(
        mean(
          reached.map((r) => num(r.opponentRejectionAtSecondRound)).filter((v) => !Number.isNaN(v)),
        ).toFixed(2),
      ),
      meanSecondRoundDecisions: reached.length
        ? Number((secondRoundDecisions.length / reached.length).toFixed(2))
        : 0,
      meanIntensityFirstRound: Number(
        mean(firstRoundDecisions.map((d) => num(d.intensityEstimate))).toFixed(2),
      ),
      meanIntensitySecondRound: Number(
        mean(secondRoundDecisions.map((d) => num(d.intensityEstimate))).toFixed(2),
      ),
    };
  });
  await writeFile(resolve(OUT_DIR, "second-round-fun.csv"), toCsv(secondRoundRows), "utf8");

  // ---------------------------------------------------------------------
  // 13. PARTY FUN SCORE (sections 9-10, 27, 35).
  //
  // Two passes: (1) compute a RAW proxy value per party per dimension: (2)
  // min-max normalize each dimension's 9 raw values onto a 2..10 scale.
  // The normalization is documented, not hidden: these sub-scores are
  // COMPARATIVE across this game's 9 parties, not an absolute measurement
  // of fun (exactly the caveat section 27 itself requires: "Ne prétends pas
  // qu'il mesure objectivement le plaisir humain. Utilise-le comme outil
  // comparatif."). Without this step, several raw formulas saturated at
  // the 10-point ceiling for 7-8 of the 9 parties simultaneously in an
  // earlier draft of this script — which would have silently thrown away
  // real between-party variation instead of reporting it. That earlier,
  // uncalibrated run is not published; this is the corrected version.
  // ---------------------------------------------------------------------
  const crossPartyJaccardByParty = new Map<string, number>();
  for (const partyId of EXISTING_PARTY_IDS) {
    const relevant = similarityRows.filter((r) => r.partyA === partyId || r.partyB === partyId);
    crossPartyJaccardByParty.set(partyId, mean(relevant.map((r) => r.crossPartyGameJaccard)));
  }
  const partyEventCountShare = new Map<string, number>();
  for (const partyId of EXISTING_PARTY_IDS) {
    const partySpecific = gameContent.events.filter((e) =>
      e.eligibleParties?.includes(partyId),
    ).length;
    partyEventCountShare.set(
      partyId,
      partySpecific / Math.max(1, EVENTS_BY_PARTY_ACCESSIBLE.get(partyId) ?? 1),
    );
  }

  function scaleToRange(raw: Map<string, number>, lo = 2, hi = 10): Map<string, number> {
    const values = [...raw.values()];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const scaled = new Map<string, number>();
    for (const [k, v] of raw) {
      scaled.set(k, max > min ? lo + ((v - min) / (max - min)) * (hi - lo) : (lo + hi) / 2);
    }
    return scaled;
  }

  const rawQualification = new Map<string, number>();
  const rawVictory = new Map<string, number>();
  const rawVictoryGivenQualified = new Map<string, number>();
  const rawScoreStddev = new Map<string, number>();
  const rawEntropy = new Map<string, number>();
  const rawMemorable = new Map<string, number>();
  const rawDepthCoverage = new Map<string, number>();
  const rawReplay10 = new Map<string, number>();
  const rawIdentitySim = new Map<string, number>(); // lower cross-party jaccard = more distinct = better identity
  const rawSpecificShare = new Map<string, number>();
  const rawReversalShare = new Map<string, number>();
  const rawRankChangeRate = new Map<string, number>();
  const rawRareEncounterRate = new Map<string, number>();
  const rawWeakStreakInverse = new Map<string, number>(); // lower streak = better rhythm
  const rawDefeatMemorable = new Map<string, number>();
  const rawDefeatExplained = new Map<string, number>();

  for (const partyId of EXISTING_PARTY_IDS) {
    const rows = existingRuns.filter((r) => str(r.partyId) === partyId);
    const n = rows.length;
    rawQualification.set(partyId, rows.filter((r) => bool(r.qualified)).length / n);
    rawVictory.set(partyId, rows.filter((r) => bool(r.won)).length / n);
    rawVictoryGivenQualified.set(
      partyId,
      rows.filter((r) => bool(r.qualified) && bool(r.won)).length /
        Math.max(1, rows.filter((r) => bool(r.qualified)).length),
    );

    const dominanceRowsForParty = eventRows.filter((e) => {
      const withEvent = existingDecisions.filter(
        (d) => str(d.partyId) === partyId && str(d.eventId) === e.eventId,
      );
      return withEvent.length >= 5;
    });
    rawEntropy.set(partyId, mean(dominanceRowsForParty.map((e) => e.choiceEntropyNormalized)));
    rawMemorable.set(partyId, mean(rows.map((r) => num(r.memorableSignalCount))));

    const uniqueEventsSeen = eventSetByParty.get(partyId)!.size;
    const accessible = EVENTS_BY_PARTY_ACCESSIBLE.get(partyId) ?? gameContent.events.length;
    rawDepthCoverage.set(partyId, uniqueEventsSeen / accessible);

    const profileScores = new Map<string, number[]>();
    for (const r of rows) {
      const p = str(r.profile);
      if (!profileScores.has(p)) profileScores.set(p, []);
      profileScores.get(p)!.push(num(r.finalScore));
    }
    rawScoreStddev.set(partyId, stddev([...profileScores.values()].map((v) => mean(v))));

    const replayAt10 = replayRows.find((r) => r.partyId === partyId && r.gamesPlayed === 10);
    rawReplay10.set(partyId, replayAt10 ? replayAt10.pctOfAccessibleCatalog / 100 : 0.5);

    rawIdentitySim.set(partyId, -(crossPartyJaccardByParty.get(partyId) ?? 0.2));
    rawSpecificShare.set(partyId, partyEventCountShare.get(partyId) ?? 0);

    const partyReversal = comebackRows.find((r) => r.partyId === partyId);
    rawReversalShare.set(partyId, partyReversal?.shareWithAtLeastOneReversal ?? 0);
    const partyDecisions = existingDecisions.filter((d) => str(d.partyId) === partyId);
    rawRankChangeRate.set(
      partyId,
      partyDecisions.filter((d) => bool(d.rankChanged)).length / Math.max(1, partyDecisions.length),
    );

    rawRareEncounterRate.set(partyId, rows.filter((r) => bool(r.rareEventEncountered)).length / n);

    const partyStreak = streakRows.find((s) => s.partyId === partyId);
    rawWeakStreakInverse.set(partyId, -(partyStreak?.meanMaxStreak ?? 3));

    const partyDefeatSample = rows.filter((r) => !bool(r.won));
    rawDefeatMemorable.set(
      partyId,
      mean(partyDefeatSample.map((r) => num(r.memorableSignalCount))),
    );
    rawDefeatExplained.set(
      partyId,
      partyDefeatSample.filter((r) => r.bestDecisionIndex !== "" && r.costliestDecisionIndex !== "")
        .length / Math.max(1, partyDefeatSample.length),
    );
  }

  const sEntropy = scaleToRange(rawEntropy);
  const sMemorable = scaleToRange(rawMemorable);
  const sDepth = scaleToRange(rawDepthCoverage);
  const sScoreStddev = scaleToRange(rawScoreStddev);
  const sReplay10 = scaleToRange(rawReplay10);
  const sIdentitySim = scaleToRange(rawIdentitySim);
  const sSpecificShare = scaleToRange(rawSpecificShare);
  const sReversal = scaleToRange(rawReversalShare);
  const sRankChange = scaleToRange(rawRankChangeRate);
  const sRareEncounter = scaleToRange(rawRareEncounterRate);
  const sWeakStreakInverse = scaleToRange(rawWeakStreakInverse);
  const sDefeatMemorable = scaleToRange(rawDefeatMemorable);
  const sDefeatExplained = scaleToRange(rawDefeatExplained);

  interface PartyFunRow {
    partyId: string;
    n: number;
    qualificationRate: number;
    victoryRate: number;
    victoryGivenQualifiedRate: number;
    scoreStddevAcrossProfiles: number;
    funImmediat: number;
    profondeur: number;
    rejouabilite: number;
    identite: number;
    agence: number;
    tension: number;
    varieteStrategique: number;
    satisfactionVictoire: number;
    interetDefaite: number;
    funScore100: number;
  }

  const partyFunRows: PartyFunRow[] = EXISTING_PARTY_IDS.map((partyId) => {
    const n = existingRuns.filter((r) => str(r.partyId) === partyId).length;
    const qualificationRate = rawQualification.get(partyId)!;

    // Fun immédiat: real-dilemma signal (entropy) + memorable-signal density.
    const funImmediat = clamp01to10(sEntropy.get(partyId)! * 0.6 + sMemorable.get(partyId)! * 0.4);
    // Profondeur: catalogue coverage breadth + how much the outcome varies with skill/strategy.
    const profondeur = clamp01to10(sDepth.get(partyId)! * 0.55 + sScoreStddev.get(partyId)! * 0.45);
    // Rejouabilité: % of accessible catalogue still fresh after 10 replays (higher = more headroom left).
    const rejouabilite = clamp01to10(10 - sReplay10.get(partyId)! + 2); // invert: lower coverage-at-10 = more still-fresh content = MORE replayable headroom
    // Identité: how distinct this party's playthroughs are from other parties' + specific-event share.
    const identite = clamp01to10(
      sIdentitySim.get(partyId)! * 0.6 + sSpecificShare.get(partyId)! * 0.4,
    );
    // Agence: how much the final score actually varies with the profile/strategy played.
    const agence = clamp01to10(sScoreStddev.get(partyId)!);
    // Tension: qualification-zone reversal frequency + in-campaign rank volatility.
    const tension = clamp01to10(sReversal.get(partyId)! * 0.5 + sRankChange.get(partyId)! * 0.5);
    // Variété stratégique: same score-variance proxy as agence (distinct question, same available signal — documented, not duplicated silently).
    const varieteStrategique = clamp01to10(
      sScoreStddev.get(partyId)! * 0.7 + sRareEncounter.get(partyId)! * 0.3,
    );
    // Satisfaction victoire: peaks when qualification is neither near-automatic nor near-impossible.
    const satisfactionVictoire = clamp01to10(10 - Math.abs(qualificationRate - 0.55) * 14);
    // Intérêt défaite: memorable-signal density in losing runs + how often the engine explains the loss (best/costliest decision present).
    const interetDefaite = clamp01to10(
      sDefeatMemorable.get(partyId)! * 0.6 + sDefeatExplained.get(partyId)! * 0.4,
    );

    // FUN SCORE /100 — section 27 weights, each dimension's normalized 2-10
    // score rescaled to its weight (weight/10 multiplier). "Rythme" (5 pts)
    // uses the weak-card-streak-inverse signal (not otherwise used above).
    const rythme10 = clamp01to10(sWeakStreakInverse.get(partyId)!);
    const funScore100 =
      (sEntropy.get(partyId)! / 10) * 20 + // dilemmes /20
      (tension / 10) * 15 + // tension /15
      (profondeur / 10) * 15 + // variete intra-partie /15
      (rejouabilite / 10) * 15 + // rejouabilite /15
      (sMemorable.get(partyId)! / 10) * 10 + // narrativite /10
      (identite / 10) * 10 + // identite /10
      (sRareEncounter.get(partyId)! / 10) * 5 + // surprise /5
      (satisfactionVictoire / 10) * 5 + // satisfaction resultats /5
      (rythme10 / 10) * 5; // rythme /5

    return {
      partyId,
      n,
      qualificationRate: Number(qualificationRate.toFixed(3)),
      victoryRate: Number(rawVictory.get(partyId)!.toFixed(3)),
      victoryGivenQualifiedRate: Number(rawVictoryGivenQualified.get(partyId)!.toFixed(3)),
      scoreStddevAcrossProfiles: Number(rawScoreStddev.get(partyId)!.toFixed(2)),
      funImmediat: Number(funImmediat.toFixed(1)),
      profondeur: Number(profondeur.toFixed(1)),
      rejouabilite: Number(rejouabilite.toFixed(1)),
      identite: Number(identite.toFixed(1)),
      agence: Number(agence.toFixed(1)),
      tension: Number(tension.toFixed(1)),
      varieteStrategique: Number(varieteStrategique.toFixed(1)),
      satisfactionVictoire: Number(satisfactionVictoire.toFixed(1)),
      interetDefaite: Number(interetDefaite.toFixed(1)),
      funScore100: Number(Math.max(0, Math.min(100, funScore100)).toFixed(1)),
    };
  });
  partyFunRows.sort((a, b) => b.funScore100 - a.funScore100);
  await writeFile(
    resolve(OUT_DIR, "party-fun.csv"),
    toCsv(partyFunRows as unknown as Record<string, unknown>[]),
    "utf8",
  );

  // ---------------------------------------------------------------------
  // SUMMARY.JSON
  // ---------------------------------------------------------------------
  const gradeCounts = frequency(eventRows.map((e) => e.grade));
  const summary = {
    corpus: {
      totalRuns: runs.length,
      existingPartyRuns: existingRuns.length,
      customPartyRuns: runs.length - existingRuns.length,
      totalDecisions: decisions.length,
      abExperimentRows: abRows.length,
      distinctEventsEncountered: eventRows.length,
      catalogSize: gameContent.events.length,
    },
    eventGrades: Object.fromEntries(gradeCounts.map((g) => [g.id, g.count])),
    memorableMoments: memorableSummary,
    randomEventValue: {
      interessant: randomRows.filter((r) => r.valueBucket === "interessant").length,
      neutre: randomRows.filter((r) => r.valueBucket === "neutre").length,
      frustrant: randomRows.filter((r) => r.valueBucket === "frustrant").length,
    },
    rareEvents: {
      total: rareRows.length,
      exceptionnel: rareRows.filter((r) => r.classification === "exceptionnel").length,
      memorable: rareRows.filter((r) => r.classification === "memorable").length,
      gadget: rareRows.filter((r) => r.classification === "gadget").length,
      trop_frequent: rareRows.filter((r) => r.classification === "trop_frequent").length,
      trop_rare: rareRows.filter((r) => r.classification === "trop_rare").length,
    },
    abExperiments: abSummaries,
    partySimilarity: {
      overallIntraPartyGameJaccard: Number(overallIntraPartyJaccard.toFixed(4)),
      overallCrossPartyGameJaccard: Number(overallCrossPartyJaccard.toFixed(4)),
      note: "Per-game Jaccard (matched profile+seed), comparable to GAMEPLAY_AUDIT.md's cross-party-overlap.csv (0.126 cross vs 0.244 intra there).",
    },
    partyFunRanking: partyFunRows.map((p) => ({ partyId: p.partyId, funScore100: p.funScore100 })),
    dominantChoiceShare: {
      eventsEvaluated: dominanceRows.length,
      dominantCount: dominanceRows.filter((d) => d.isDominant).length,
      dominantSharePct: Number(
        (
          (dominanceRows.filter((d) => d.isDominant).length / Math.max(1, dominanceRows.length)) *
          100
        ).toFixed(1),
      ),
    },
  };
  await writeFile(resolve(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2), "utf8");

  console.log(JSON.stringify(summary, null, 2));
}

await main();
