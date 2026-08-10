/**
 * Audit électoral — BLOC A section 5-9 et 11-12
 * (PROMPT_CLAUDE_CODE_AUDIT_CREDIBILITE_ELECTORALE_COHERENCE.md).
 *
 * Corpus massif joué avec le moteur de production réel (createGame /
 * currentEvent / resolveCurrentChoice), tous les partis jouables, huit
 * agents plausibles (scripts/audit-post/lib/agents.ts, déjà utilisés dans
 * les audits précédents), seeds déterministes. Snapshotte le sondage
 * (`party.stats.polling`, recalculé à chaque décision par
 * `recalculateElectorate`) de tous les partis actifs à 0 %, 25 %, 50 %, 75 %
 * du nombre de décisions avant le premier tour, au dernier bulletin avant le
 * premier tour, et au résultat réel du premier tour
 * (`state.firstRoundResult.results`, qui inclut le bruit du scrutin —
 * distinct du sondage).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { GAME_CONFIG } from "../../src/config/game";
import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";
import type { GameState } from "../../src/game/types/index";
import { AGENT_NAMES, type AgentName, pickChoice } from "../audit-post/lib/agents";
import { toCsv } from "../audit-post/lib/csv";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/electoral-coherence");

const SEEDS_PER_COMBO = Math.max(
  1,
  Number.parseInt(process.env.ELECTORAL_SEEDS_PER_COMBO ?? "140", 10) || 140,
);
const EXISTING_PARTIES = gameContent.parties.filter((p) => p.isRealOrganization);
const PARTY_IDS = EXISTING_PARTIES.map((p) => p.id);
const PRE_R1_DECISIONS = GAME_CONFIG.targetDecisionsBeforeFirstRound;
const CHECKPOINTS = [0, 0.25, 0.5, 0.75];

interface SnapshotRow {
  runKey: string;
  partyId: string;
  agent: AgentName;
  seedIndex: number;
  checkpoint: string;
  decisionIndex: number;
  [party: string]: unknown;
}

interface RunSummaryRow {
  runKey: string;
  partyId: string;
  agent: AgentName;
  seedIndex: number;
  qualified: boolean;
  finalistA: string;
  finalistB: string;
  playerIsFinalist: boolean;
  won: boolean | "";
  r1LeaderId: string;
  r1LeaderScore: number;
  r1SecondId: string;
  r1SecondScore: number;
  r1ThirdId: string;
  r1ThirdScore: number;
  r1LastId: string;
  r1LastScore: number;
  r1SpreadTop1Top2: number;
  r1SpreadTop1Top3: number;
  r1SpreadTop1Top9: number;
  r1StdDev: number;
  countAbove20: number;
  countAbove18: number;
  countAbove15: number;
  countBelow10: number;
  countBelow7: number;
  concentrationTop2: number;
  concentrationTop3: number;
}

function polling(state: GameState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const partyId of PARTY_IDS) {
    const party = state.parties[partyId];
    out[partyId] = party?.active ? Number((party.stats.polling ?? 0).toFixed(2)) : 0;
  }
  return out;
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function runOne(
  partyId: string,
  agent: AgentName,
  seedIndex: number,
): { runKey: string; snapshots: SnapshotRow[]; summary: RunSummaryRow } | undefined {
  const seed = `electoral-coherence-${partyId}-${agent}-${seedIndex}`;
  const method = gameContent.methods[seedIndex % gameContent.methods.length]!;
  let state = createGame(
    { seed, mode: "existing_party", partyId, methodId: method.id },
    gameContent,
  );
  const runKey = `${partyId}:${agent}:${seedIndex}`;
  const snapshots: SnapshotRow[] = [];
  const preR1Series: Array<{ decisionIndex: number; polls: Record<string, number> }> = [
    { decisionIndex: 0, polls: polling(state) },
  ];
  let guard = 0;
  let firstRoundLocked = false;

  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, gameContent.events);
    const choice = pickChoice(state, event, agent, seed);
    const resolution = resolveCurrentChoice(state, choice.id, gameContent);
    state = resolution.state;
    guard += 1;
    if (!firstRoundLocked && state.decisionIndex <= PRE_R1_DECISIONS) {
      preR1Series.push({ decisionIndex: state.decisionIndex, polls: polling(state) });
    }
    if (state.firstRoundResult) firstRoundLocked = true;
  }

  if (!state.firstRoundResult) return undefined;

  for (const fraction of CHECKPOINTS) {
    const targetIndex = Math.round(fraction * PRE_R1_DECISIONS);
    let closest = preR1Series[0]!;
    for (const point of preR1Series) {
      if (Math.abs(point.decisionIndex - targetIndex) < Math.abs(closest.decisionIndex - targetIndex))
        closest = point;
    }
    snapshots.push({
      runKey,
      partyId,
      agent,
      seedIndex,
      checkpoint: `${Math.round(fraction * 100)}%`,
      decisionIndex: closest.decisionIndex,
      ...closest.polls,
    });
  }
  const lastBulletin = preR1Series[preR1Series.length - 1]!;
  snapshots.push({
    runKey,
    partyId,
    agent,
    seedIndex,
    checkpoint: "last_bulletin_pre_r1",
    decisionIndex: lastBulletin.decisionIndex,
    ...lastBulletin.polls,
  });

  const r1Results = state.firstRoundResult.results;
  const ordered = [...PARTY_IDS]
    .map((id) => ({ id, score: r1Results[id] ?? 0 }))
    .sort((a, b) => b.score - a.score);
  snapshots.push({
    runKey,
    partyId,
    agent,
    seedIndex,
    checkpoint: "r1_result",
    decisionIndex: -1,
    ...Object.fromEntries(ordered.map((o) => [o.id, o.score])),
  });

  const scores = ordered.map((o) => o.score);
  const finalists = state.qualifiedPartyIds ?? [];
  const summary: RunSummaryRow = {
    runKey,
    partyId,
    agent,
    seedIndex,
    qualified: finalists.some((id) => id === partyId),
    finalistA: finalists[0] ?? "",
    finalistB: finalists[1] ?? "",
    playerIsFinalist: finalists.some((id) => id === partyId),
    won: state.secondRoundResult ? state.finalResult?.won ?? "" : "",
    r1LeaderId: ordered[0]?.id ?? "",
    r1LeaderScore: ordered[0]?.score ?? 0,
    r1SecondId: ordered[1]?.id ?? "",
    r1SecondScore: ordered[1]?.score ?? 0,
    r1ThirdId: ordered[2]?.id ?? "",
    r1ThirdScore: ordered[2]?.score ?? 0,
    r1LastId: ordered[ordered.length - 1]?.id ?? "",
    r1LastScore: ordered[ordered.length - 1]?.score ?? 0,
    r1SpreadTop1Top2: Number(((ordered[0]?.score ?? 0) - (ordered[1]?.score ?? 0)).toFixed(2)),
    r1SpreadTop1Top3: Number(((ordered[0]?.score ?? 0) - (ordered[2]?.score ?? 0)).toFixed(2)),
    r1SpreadTop1Top9: Number(
      ((ordered[0]?.score ?? 0) - (ordered[ordered.length - 1]?.score ?? 0)).toFixed(2),
    ),
    r1StdDev: Number(stdDev(scores).toFixed(2)),
    countAbove20: scores.filter((s) => s > 20).length,
    countAbove18: scores.filter((s) => s > 18).length,
    countAbove15: scores.filter((s) => s > 15).length,
    countBelow10: scores.filter((s) => s < 10).length,
    countBelow7: scores.filter((s) => s < 7).length,
    concentrationTop2: Number(((ordered[0]?.score ?? 0) + (ordered[1]?.score ?? 0)).toFixed(2)),
    concentrationTop3: Number(
      ((ordered[0]?.score ?? 0) + (ordered[1]?.score ?? 0) + (ordered[2]?.score ?? 0)).toFixed(2),
    ),
  };

  return { runKey, snapshots, summary };
}

async function main() {
  const startedAt = Date.now();
  await mkdir(OUT_DIR, { recursive: true });
  const snapshots: SnapshotRow[] = [];
  const summaries: RunSummaryRow[] = [];
  let attempted = 0;
  let failed = 0;

  for (const partyId of PARTY_IDS) {
    for (const agent of AGENT_NAMES) {
      for (let seedIndex = 0; seedIndex < SEEDS_PER_COMBO; seedIndex += 1) {
        attempted += 1;
        const result = runOne(partyId, agent, seedIndex);
        if (!result) {
          failed += 1;
          continue;
        }
        snapshots.push(...result.snapshots);
        summaries.push(result.summary);
      }
    }
  }

  await writeFile(
    resolve(OUT_DIR, "dispersion-by-phase.csv"),
    toCsv(snapshots as unknown as Record<string, unknown>[]),
    "utf8",
  );
  await writeFile(
    resolve(OUT_DIR, "party-percentiles-raw.csv"),
    toCsv(summaries as unknown as Record<string, unknown>[]),
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        attempted,
        failed,
        completedRuns: summaries.length,
        seedsPerCombo: SEEDS_PER_COMBO,
        partiesCount: PARTY_IDS.length,
        agentsCount: AGENT_NAMES.length,
        durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)),
      },
      null,
      2,
    ),
  );
}

await main();
