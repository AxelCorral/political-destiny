/**
 * Calibration finale — BLOC B. Recherche empirique de RETAINED_GAP_DAMPING
 * avant de figer sa valeur en production. Réutilise runoffAppeal (moteur
 * réel, jamais réimplémenté) ; ne paramètre que le damping du terme
 * conservé et du terme transféré, pour comparer plusieurs combinaisons sur
 * le MÊME corpus d'états de second tour.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";
import { runoffAppeal } from "../../src/game/engine/election";
import { clamp, ideologyDistance, normalizePercentages } from "../../src/game/engine/math";
import type { GameState } from "../../src/game/types/index";
import { AGENT_NAMES, type AgentName, pickChoice } from "../audit-post/lib/agents";
import { toCsv } from "../audit-post/lib/csv";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/runoff-final-calibration");
const SEEDS_PER_COMBO = Math.max(
  1,
  Number.parseInt(process.env.RETAINED_SEEDS_PER_COMBO ?? "70", 10) || 70,
);
const EXISTING_PARTIES = gameContent.parties.filter((p) => p.isRealOrganization).map((p) => p.id);

const RETAINED_CANDIDATES = [1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7];
const TRANSFER_DAMPING = 0.62; // production, non remis en cause par cette recherche

function splitWithDamping(leftAppeal: number, rightAppeal: number, damping: number) {
  const total = leftAppeal + rightAppeal;
  if (total <= 0) return { left: 0.5, right: 0.5 };
  const rawLeftShare = leftAppeal / total;
  const dampedLeftShare = clamp(0.5 + (rawLeftShare - 0.5) * damping, 0.05, 0.95);
  return { left: dampedLeftShare, right: 1 - dampedLeftShare };
}

function dampGap(left: number, right: number, damping: number) {
  const total = left + right;
  const gap = (left - right) * damping;
  return { left: (total + gap) / 2, right: (total - gap) / 2 };
}

function marginForRetainedDamping(state: GameState, leftId: string, rightId: string, retainedDamping: number): number {
  const left = state.parties[leftId]!;
  const right = state.parties[rightId]!;
  const firstRoundResults = state.firstRoundResult?.results ?? {};
  const leftRetention = clamp(0.86 + left.stats.mobilization / 1000 - left.stats.rejection / 2200, 0.78, 0.95);
  const rightRetention = clamp(0.86 + right.stats.mobilization / 1000 - right.stats.rejection / 2200, 0.78, 0.95);
  const gapDamped = dampGap(
    (firstRoundResults[leftId] ?? 0) * leftRetention,
    (firstRoundResults[rightId] ?? 0) * rightRetention,
    retainedDamping,
  );
  let leftTotal = gapDamped.left;
  let rightTotal = gapDamped.right;

  for (const [sourcePartyId, share] of Object.entries(firstRoundResults)) {
    if (sourcePartyId === leftId || sourcePartyId === rightId || share <= 0) continue;
    const source = state.parties[sourcePartyId];
    if (!source) continue;
    const leftDistance = ideologyDistance(source.perceivedIdeology, left.perceivedIdeology);
    const rightDistance = ideologyDistance(source.perceivedIdeology, right.perceivedIdeology);
    const closestDistance = Math.min(leftDistance, rightDistance);
    const explicitEndorsement = state.flags[`endorsement:${sourcePartyId}`];
    const alliedWithFinalist = source.alliedWith.includes(leftId) || source.alliedWith.includes(rightId);
    const abstentionRate = clamp(
      0.08 +
        closestDistance / 280 +
        (left.stats.rejection + right.stats.rejection) / 1000 -
        (explicitEndorsement && explicitEndorsement !== "neutral" ? 0.05 : 0) -
        (alliedWithFinalist ? 0.04 : 0),
      0.06,
      0.46,
    );
    const expressedShare = share * (1 - abstentionRate);
    const leftAppeal = runoffAppeal(state, sourcePartyId, leftId);
    const rightAppeal = runoffAppeal(state, sourcePartyId, rightId);
    const split = splitWithDamping(leftAppeal, rightAppeal, TRANSFER_DAMPING);
    leftTotal += expressedShare * split.left;
    rightTotal += expressedShare * split.right;
  }

  const results = normalizePercentages({ [leftId]: leftTotal, [rightId]: rightTotal }, 2);
  return Math.abs((results[leftId] ?? 50) - (results[rightId] ?? 50));
}

interface Row {
  [key: string]: unknown;
  runKey: string;
  finalistLeft: string;
  finalistRight: string;
  r1Margin: number;
  favoriteAtR1: string;
}

function runOne(partyId: string, agent: AgentName, seedIndex: number): Row | undefined {
  const seed = `retained-gap-${partyId}-${agent}-${seedIndex}`;
  const method = gameContent.methods[seedIndex % gameContent.methods.length]!;
  let state = createGame({ seed, mode: "existing_party", partyId, methodId: method.id }, gameContent);
  let guard = 0;
  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, gameContent.events);
    const choice = pickChoice(state, event, agent, seed);
    state = resolveCurrentChoice(state, choice.id, gameContent).state;
    guard += 1;
  }
  if (!state.firstRoundResult || !state.qualifiedPartyIds) return undefined;
  const [leftId, rightId] = state.qualifiedPartyIds;
  const r1Left = state.firstRoundResult.results[leftId] ?? 0;
  const r1Right = state.firstRoundResult.results[rightId] ?? 0;

  const row: Row = {
    runKey: `${partyId}:${agent}:${seedIndex}`,
    finalistLeft: leftId,
    finalistRight: rightId,
    r1Margin: Number(Math.abs(r1Left - r1Right).toFixed(2)),
    favoriteAtR1: r1Left >= r1Right ? leftId : rightId,
  };
  for (const candidate of RETAINED_CANDIDATES) {
    row[`margin_r${candidate}`] = Number(
      marginForRetainedDamping(state, leftId, rightId, candidate).toFixed(2),
    );
  }
  return row;
}

async function main() {
  const startedAt = Date.now();
  await mkdir(OUT_DIR, { recursive: true });
  const rows: Row[] = [];
  for (const partyId of EXISTING_PARTIES) {
    for (const agent of AGENT_NAMES) {
      for (let seedIndex = 0; seedIndex < SEEDS_PER_COMBO; seedIndex += 1) {
        const row = runOne(partyId, agent, seedIndex);
        if (row) rows.push(row);
      }
    }
  }
  await writeFile(resolve(OUT_DIR, "retained-gap-damping-search-raw.csv"), toCsv(rows), "utf8");

  const summary = RETAINED_CANDIDATES.map((candidate) => {
    const margins = rows.map((r) => r[`margin_r${candidate}`] as number).sort((a, b) => a - b);
    const mean = margins.reduce((a, b) => a + b, 0) / margins.length;
    const bucket = (lo: number, hi: number) =>
      Number(((margins.filter((m) => m >= lo && m < hi).length / margins.length) * 100).toFixed(1));
    return {
      retainedGapDamping: candidate,
      meanMargin: Number(mean.toFixed(2)),
      medianMargin: margins[Math.floor(margins.length / 2)],
      bucket_0_4: bucket(0, 4),
      bucket_4_10: bucket(4, 10),
      bucket_10_20: bucket(10, 20),
      bucket_20_plus: bucket(20, 1000),
      above10pct: Number(((margins.filter((m) => m > 10).length / margins.length) * 100).toFixed(1)),
    };
  });
  await writeFile(resolve(OUT_DIR, "retained-gap-damping-search.csv"), toCsv(summary), "utf8");
  console.log(JSON.stringify({ totalRuns: rows.length, summary, durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)) }, null, 2));
}

await main();
