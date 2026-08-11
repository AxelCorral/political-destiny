/**
 * PROMPT_CLAUDE_CODE_ANCRAGE_REEL_PSEUDO_REALITE_RECOMPOSITIONS.md §35 —
 * contrefactuels à état et graine identiques : scénario retrait vs scénario
 * maintien, ≥500 paires. Plutôt que d'attendre le déclenchement probabiliste
 * rare de `maybeWithdrawAndRally` en jeu réel (ce qui rendrait l'échantillon
 * biaisé vers les seules parties déjà en train de s'effondrer), force le
 * retrait du parti PNJ le plus faible à un point de fourche identique dans
 * les deux branches, en réutilisant `redistributeElectorate` (le moteur réel,
 * jamais réimplémenté) pour la branche « retrait ». La branche « maintien »
 * rejoue simplement la suite de la même campagne sans intervention.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";
import { redistributeElectorate } from "../../src/game/engine/redistribution";
import type { GameState } from "../../src/game/types/index";
import { AGENT_NAMES, type AgentName, pickChoice } from "../audit-post/lib/agents";
import { toCsv } from "../audit-post/lib/csv";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/reality-grounding");
const TARGET_PAIRS = Math.max(
  1,
  Number.parseInt(process.env.COUNTERFACTUAL_PAIRS ?? "520", 10) || 520,
);
const FORK_DECISION_INDEX = 16;

interface PairRow {
  [key: string]: unknown;
  pairKey: string;
  playerPartyId: string;
  agent: string;
  withdrawnPartyId: string;
  withdrawnPartyPollingAtFork: number;
  maintainR1Leader: string;
  withdrawR1Leader: string;
  leaderChanged: boolean;
  maintainQualified: [string, string] | undefined;
  withdrawQualified: [string, string] | undefined;
  qualifiedSetChanged: boolean;
  maintainPlayerR1Score: number;
  withdrawPlayerR1Score: number;
  playerScoreDelta: number;
  maintainPlayerWon: boolean;
  withdrawPlayerWon: boolean;
  playerOutcomeChanged: boolean;
}

function playToFork(partyId: string, agent: AgentName, seed: string): GameState | undefined {
  let state = createGame(
    { seed, mode: "existing_party", partyId, methodId: gameContent.methods[0]!.id },
    gameContent,
  );
  for (let guard = 0; guard < FORK_DECISION_INDEX; guard += 1) {
    if (state.phase === "finished") return undefined;
    const event = currentEvent(state, gameContent.events);
    const choice = pickChoice(state, event, agent, seed);
    state = resolveCurrentChoice(state, choice.id, gameContent).state;
  }
  return state.phase === "finished" ? undefined : state;
}

function playToEnd(state: GameState, agent: AgentName, seed: string): GameState {
  let current = structuredClone(state);
  let guard = 0;
  while (current.phase !== "finished" && guard < 90) {
    const event = currentEvent(current, gameContent.events);
    const choice = pickChoice(current, event, agent, seed);
    current = resolveCurrentChoice(current, choice.id, gameContent).state;
    guard += 1;
  }
  return current;
}

function forceWithdraw(state: GameState, partyId: string): GameState {
  const next = structuredClone(state);
  const party = next.parties[partyId];
  const actor = party ? next.actors[party.candidateId] : undefined;
  if (!party || !actor) return next;
  actor.candidateStatus = "withdrawn";
  actor.active = false;
  party.active = false;
  const redistribution = redistributeElectorate(next, gameContent.electorateBlocs, partyId);
  return redistribution.state;
}

function weakestOtherActiveParty(state: GameState, playerPartyId: string): string | undefined {
  const candidates = Object.values(state.parties).filter(
    (party) => party.active && party.id !== playerPartyId,
  );
  if (candidates.length === 0) return undefined;
  return candidates.sort((a, b) => a.stats.polling - b.stats.polling)[0]?.id;
}

async function main() {
  const startedAt = Date.now();
  await mkdir(OUT_DIR, { recursive: true });
  const parties = gameContent.parties.filter((p) => p.isRealOrganization).map((p) => p.id);
  const rows: PairRow[] = [];

  let attempt = 0;
  while (rows.length < TARGET_PAIRS && attempt < TARGET_PAIRS * 4) {
    const partyId = parties[attempt % parties.length]!;
    const agent = AGENT_NAMES[Math.floor(attempt / parties.length) % AGENT_NAMES.length]!;
    const seed = `counterfactual-${partyId}-${agent}-${attempt}`;
    attempt += 1;

    const fork = playToFork(partyId, agent, seed);
    if (!fork) continue;
    const withdrawnPartyId = weakestOtherActiveParty(fork, partyId);
    if (!withdrawnPartyId) continue;
    const withdrawnPartyPollingAtFork = fork.parties[withdrawnPartyId]!.stats.polling;

    const maintainEnd = playToEnd(fork, agent, `${seed}:maintain`);
    const withdrawFork = forceWithdraw(fork, withdrawnPartyId);
    const withdrawEnd = playToEnd(withdrawFork, agent, `${seed}:withdraw`);

    if (!maintainEnd.firstRoundResult || !withdrawEnd.firstRoundResult) continue;

    const maintainRanking = maintainEnd.firstRoundResult.ranking;
    const withdrawRanking = withdrawEnd.firstRoundResult.ranking;
    const maintainQualified = maintainEnd.qualifiedPartyIds;
    const withdrawQualified = withdrawEnd.qualifiedPartyIds;

    rows.push({
      pairKey: `${partyId}:${agent}:${attempt}`,
      playerPartyId: partyId,
      agent,
      withdrawnPartyId,
      withdrawnPartyPollingAtFork: Number(withdrawnPartyPollingAtFork.toFixed(2)),
      maintainR1Leader: maintainRanking[0] ?? "",
      withdrawR1Leader: withdrawRanking[0] ?? "",
      leaderChanged: maintainRanking[0] !== withdrawRanking[0],
      maintainQualified,
      withdrawQualified,
      qualifiedSetChanged:
        JSON.stringify([...(maintainQualified ?? [])].sort()) !==
        JSON.stringify([...(withdrawQualified ?? [])].sort()),
      maintainPlayerR1Score: Number((maintainEnd.firstRoundResult.results[partyId] ?? 0).toFixed(2)),
      withdrawPlayerR1Score: Number((withdrawEnd.firstRoundResult.results[partyId] ?? 0).toFixed(2)),
      playerScoreDelta: Number(
        (
          (withdrawEnd.firstRoundResult.results[partyId] ?? 0) -
          (maintainEnd.firstRoundResult.results[partyId] ?? 0)
        ).toFixed(2),
      ),
      maintainPlayerWon: maintainEnd.finalResult?.won ?? false,
      withdrawPlayerWon: withdrawEnd.finalResult?.won ?? false,
      playerOutcomeChanged: (maintainEnd.finalResult?.won ?? false) !== (withdrawEnd.finalResult?.won ?? false),
    });
  }

  await writeFile(resolve(OUT_DIR, "counterfactuals-raw.csv"), toCsv(rows), "utf8");

  const leaderChanged = rows.filter((r) => r.leaderChanged).length;
  const qualifiedSetChanged = rows.filter((r) => r.qualifiedSetChanged).length;
  const outcomeChanged = rows.filter((r) => r.playerOutcomeChanged).length;
  const meanAbsScoreDelta =
    rows.reduce((sum, r) => sum + Math.abs(r.playerScoreDelta), 0) / rows.length;
  const meanScoreDelta = rows.reduce((sum, r) => sum + r.playerScoreDelta, 0) / rows.length;

  const summary = {
    totalPairs: rows.length,
    forkDecisionIndex: FORK_DECISION_INDEX,
    leaderChangedPercent: Number(((leaderChanged / rows.length) * 100).toFixed(1)),
    qualifiedSetChangedPercent: Number(((qualifiedSetChanged / rows.length) * 100).toFixed(1)),
    playerOutcomeChangedPercent: Number(((outcomeChanged / rows.length) * 100).toFixed(1)),
    meanAbsolutePlayerScoreDelta: Number(meanAbsScoreDelta.toFixed(3)),
    meanSignedPlayerScoreDelta: Number(meanScoreDelta.toFixed(3)),
    durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)),
  };
  await writeFile(
    resolve(OUT_DIR, "counterfactuals-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
  console.log(JSON.stringify(summary, null, 2));
}

await main();
