/**
 * Calibration finale — BLOC A section 9. Contrefactuels stricts : même
 * seed, mêmes finalistes, même état au soir du premier tour
 * (structuredClone de l'état juste après `simulateFirstRound`, avant toute
 * décision d'entre-deux-tours) — seuls les choix entre les deux tours
 * varient, selon plusieurs politiques de décision.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";
import type { GameState } from "../../src/game/types/index";
import { AGENT_NAMES, type AgentName, pickChoice } from "../audit-post/lib/agents";
import { toCsv } from "../audit-post/lib/csv";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/runoff-final-calibration");
const TARGET_STATES = Math.max(
  1,
  Number.parseInt(process.env.AGENCY_TARGET_STATES ?? "520", 10) || 520,
);

const POLICIES: AgentName[] = [
  "aleatoire",
  "prudent",
  "risque",
  "opportuniste_electoral",
  "parti_dabord",
  "mediatique",
  "contrarien",
];

function reachSecondRoundStart(partyId: string, seedIndex: number): GameState | undefined {
  const seed = `agency-fork-${partyId}-${seedIndex}`;
  const method = gameContent.methods[seedIndex % gameContent.methods.length]!;
  let state = createGame({ seed, mode: "existing_party", partyId, methodId: method.id }, gameContent);
  let guard = 0;
  while (state.phase !== "finished" && guard < 40) {
    if (state.firstRoundResult && state.phase === "between_rounds") return state;
    const event = currentEvent(state, gameContent.events);
    // Toujours le premier choix jusqu'au verrouillage du premier tour — la
    // politique ne doit varier qu'APRÈS, jamais avant (sinon on changerait
    // aussi les finalistes, contrairement à la consigne du prompt).
    const choice = event.choices[0]!;
    state = resolveCurrentChoice(state, choice.id, gameContent).state;
    guard += 1;
  }
  return state.firstRoundResult && state.phase === "between_rounds" ? state : undefined;
}

function playFromFork(forkState: GameState, policy: AgentName, policySeed: string): GameState {
  let state: GameState = structuredClone(forkState);
  let guard = 0;
  while (state.phase !== "finished" && guard < 30) {
    const event = currentEvent(state, gameContent.events);
    const choice = pickChoice(state, event, policy, policySeed);
    state = resolveCurrentChoice(state, choice.id, gameContent).state;
    guard += 1;
  }
  return state;
}

interface Row {
  [key: string]: unknown;
  forkKey: string;
  finalistLeft: string;
  finalistRight: string;
  r1ScoreLeft: number;
  r1ScoreRight: number;
  policy: AgentName;
  r2ScoreLeft: number;
  r2ScoreRight: number;
  r2Margin: number;
  r2Winner: string;
}

async function main() {
  const startedAt = Date.now();
  await mkdir(OUT_DIR, { recursive: true });
  const rows: Row[] = [];
  const EXISTING_PARTIES = gameContent.parties.filter((p) => p.isRealOrganization).map((p) => p.id);
  let forksReached = 0;
  let seedIndex = 0;
  let partyCursor = 0;

  while (forksReached < TARGET_STATES && seedIndex < TARGET_STATES * 4) {
    const partyId = EXISTING_PARTIES[partyCursor % EXISTING_PARTIES.length]!;
    partyCursor += 1;
    const forkState = reachSecondRoundStart(partyId, seedIndex);
    seedIndex += 1;
    if (!forkState || !forkState.qualifiedPartyIds) continue;
    forksReached += 1;
    const [leftId, rightId] = forkState.qualifiedPartyIds;
    const r1Left = forkState.firstRoundResult!.results[leftId] ?? 0;
    const r1Right = forkState.firstRoundResult!.results[rightId] ?? 0;
    const forkKey = `${partyId}:${seedIndex}`;

    for (const policy of POLICIES) {
      const finalState = playFromFork(forkState, policy, `${forkKey}:${policy}`);
      if (!finalState.secondRoundResult) continue;
      const r2Left = finalState.secondRoundResult.results[leftId] ?? 0;
      const r2Right = finalState.secondRoundResult.results[rightId] ?? 0;
      rows.push({
        forkKey,
        finalistLeft: leftId,
        finalistRight: rightId,
        r1ScoreLeft: Number(r1Left.toFixed(2)),
        r1ScoreRight: Number(r1Right.toFixed(2)),
        policy,
        r2ScoreLeft: Number(r2Left.toFixed(2)),
        r2ScoreRight: Number(r2Right.toFixed(2)),
        r2Margin: Number(Math.abs(r2Left - r2Right).toFixed(2)),
        r2Winner: r2Left >= r2Right ? leftId : rightId,
      });
    }
  }

  await writeFile(resolve(OUT_DIR, "runoff-counterfactuals.csv"), toCsv(rows), "utf8");

  // Agrégat par fork : le vainqueur change-t-il selon la politique ?
  const byFork = new Map<string, Row[]>();
  for (const row of rows) {
    const list = byFork.get(row.forkKey) ?? [];
    list.push(row);
    byFork.set(row.forkKey, list);
  }
  let winnerChanges = 0;
  const deltaScores: number[] = [];
  for (const [, forkRows] of byFork) {
    const winners = new Set(forkRows.map((r) => r.r2Winner));
    if (winners.size > 1) winnerChanges += 1;
    const leftScores = forkRows.map((r) => r.r2ScoreLeft);
    deltaScores.push(Math.max(...leftScores) - Math.min(...leftScores));
  }
  deltaScores.sort((a, b) => a - b);
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);

  const summary = {
    forksReached,
    totalRows: rows.length,
    policiesPerFork: POLICIES.length,
    forksWithWinnerChange: winnerChanges,
    winnerChangePercent: Number(((winnerChanges / Math.max(1, byFork.size)) * 100).toFixed(1)),
    meanDeltaScore: Number(mean(deltaScores).toFixed(2)),
    p90DeltaScore: Number((deltaScores[Math.floor(deltaScores.length * 0.9)] ?? 0).toFixed(2)),
    maxDeltaScore: Number((deltaScores[deltaScores.length - 1] ?? 0).toFixed(2)),
    durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)),
  };
  await writeFile(
    resolve(OUT_DIR, "runoff-agency-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
  console.log(JSON.stringify(summary, null, 2));
}

await main();
