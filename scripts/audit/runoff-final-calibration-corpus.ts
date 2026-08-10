/**
 * Calibration finale électorale — BLOC A (PROMPT_CLAUDE_CODE_CALIBRATION_FINALE_ELECTORALE_SECOND_TOUR.md).
 *
 * Corpus massif joué avec le moteur de production réel. Pour chaque campagne
 * atteignant le second tour, capture le résultat officiel ET une
 * reconstruction déterministe (sans bruit électoral, pour isoler l'effet
 * structurel) du calcul de second tour à plusieurs valeurs de
 * RUNOFF_SHARE_DAMPING (0, 0.25, 0.4, 0.5, 0.62 — valeur de production —,
 * 0.75, 1.0), en réutilisant les fonctions exportées réelles du moteur
 * (`runoffAppeal`), donc sans jamais réimplémenter la logique d'appel.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { GAME_CONFIG } from "../../src/config/game";
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
  Number.parseInt(process.env.RUNOFF_SEEDS_PER_COMBO ?? "278", 10) || 278,
);
const EXISTING_PARTIES = gameContent.parties.filter((p) => p.isRealOrganization);
const PARTY_IDS = EXISTING_PARTIES.map((p) => p.id);
const PRE_R1_DECISIONS = GAME_CONFIG.targetDecisionsBeforeFirstRound;

const DAMPING_VALUES = [0, 0.25, 0.4, 0.5, 0.62, 0.75, 1.0];

/** Réplique exacte de runoffShareSplit (election.ts) avec damping paramétrable. */
function splitWithDamping(leftAppeal: number, rightAppeal: number, damping: number) {
  const total = leftAppeal + rightAppeal;
  if (total <= 0) return { left: 0.5, right: 0.5 };
  const rawLeftShare = leftAppeal / total;
  const dampedLeftShare = clamp(0.5 + (rawLeftShare - 0.5) * damping, 0.05, 0.95);
  return { left: dampedLeftShare, right: 1 - dampedLeftShare };
}

/**
 * Réplique déterministe (sans bruit électoral) du calcul de second tour de
 * `simulateSecondRound`, paramétrée par damping — pour isoler l'effet
 * structurel du damping des autres sources d'incertitude. Utilise
 * `runoffAppeal` exporté (jamais réimplémenté) pour rester fidèle au moteur
 * réel.
 */
function deterministicSecondRound(
  state: GameState,
  leftId: string,
  rightId: string,
  damping: number,
): { leftScore: number; rightScore: number; retainedLeft: number; retainedRight: number; transferredLeft: number; transferredRight: number } {
  const left = state.parties[leftId]!;
  const right = state.parties[rightId]!;
  const firstRoundResults = state.firstRoundResult?.results ?? {};

  const leftRetention = clamp(
    0.86 + left.stats.mobilization / 1000 - left.stats.rejection / 2200,
    0.78,
    0.95,
  );
  const rightRetention = clamp(
    0.86 + right.stats.mobilization / 1000 - right.stats.rejection / 2200,
    0.78,
    0.95,
  );
  let leftTotal = (firstRoundResults[leftId] ?? 0) * leftRetention;
  let rightTotal = (firstRoundResults[rightId] ?? 0) * rightRetention;
  const retainedLeft = leftTotal;
  const retainedRight = rightTotal;
  let transferredLeft = 0;
  let transferredRight = 0;

  for (const [sourcePartyId, share] of Object.entries(firstRoundResults)) {
    if (sourcePartyId === leftId || sourcePartyId === rightId || share <= 0) continue;
    const source = state.parties[sourcePartyId];
    if (!source) continue;
    const leftDistance = ideologyDistance(source.perceivedIdeology, left.perceivedIdeology);
    const rightDistance = ideologyDistance(source.perceivedIdeology, right.perceivedIdeology);
    const closestDistance = Math.min(leftDistance, rightDistance);
    const explicitEndorsement = state.flags[`endorsement:${sourcePartyId}`];
    const alliedWithFinalist =
      source.alliedWith.includes(leftId) || source.alliedWith.includes(rightId);
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
    const split = splitWithDamping(leftAppeal, rightAppeal, damping);
    leftTotal += expressedShare * split.left;
    rightTotal += expressedShare * split.right;
    transferredLeft += expressedShare * split.left;
    transferredRight += expressedShare * split.right;
  }

  const results = normalizePercentages({ [leftId]: leftTotal, [rightId]: rightTotal }, 2);
  return {
    leftScore: results[leftId] ?? 50,
    rightScore: results[rightId] ?? 50,
    retainedLeft,
    retainedRight,
    transferredLeft,
    transferredRight,
  };
}

interface RunoffRow {
  [key: string]: unknown;
  runKey: string;
  agent: AgentName;
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
  playerIsFinalist: boolean;
  playerWon: boolean;
  turnout: number;
  // Reconstruction déterministe (sans bruit), damping de production 0.62
  detLeftAt62: number;
  detRightAt62: number;
  detMarginAt62: number;
  // Sans damping (1.0)
  detMarginAt100: number;
  // Damping nul (0)
  detMarginAt0: number;
  retainedShareLeft: number;
  retainedShareRight: number;
  transferredShareLeft: number;
  transferredShareRight: number;
  dampingContributionToMargin: number;
}

function runOne(
  partyId: string,
  agent: AgentName,
  seedIndex: number,
): RunoffRow | undefined {
  const seed = `runoff-final-${partyId}-${agent}-${seedIndex}`;
  const method = gameContent.methods[seedIndex % gameContent.methods.length]!;
  let state = createGame(
    { seed, mode: "existing_party", partyId, methodId: method.id },
    gameContent,
  );
  let guard = 0;

  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, gameContent.events);
    const choice = pickChoice(state, event, agent, seed);
    const resolution = resolveCurrentChoice(state, choice.id, gameContent);
    state = resolution.state;
    guard += 1;
  }

  if (!state.firstRoundResult || !state.secondRoundResult || !state.qualifiedPartyIds) return undefined;
  const [leftId, rightId] = state.qualifiedPartyIds;
  const r1Results = state.firstRoundResult.results;
  const r2Results = state.secondRoundResult.results;
  const r1Left = r1Results[leftId] ?? 0;
  const r1Right = r1Results[rightId] ?? 0;
  const r2Left = r2Results[leftId] ?? 0;
  const r2Right = r2Results[rightId] ?? 0;
  const favoriteAtR1 = r1Left >= r1Right ? leftId : rightId;
  const winner = r2Left >= r2Right ? leftId : rightId;

  // Reconstruction déterministe : besoin de l'état juste avant le second tour,
  // soit l'état final de state (déjà mutable au fil des décisions), qui
  // contient encore firstRoundResult et les stats à jour des partis. C'est
  // exactement l'état que `simulateSecondRound` a reçu en production (avant
  // son propre structuredClone interne).
  const det62 = deterministicSecondRound(state, leftId, rightId, 0.62);
  const det100 = deterministicSecondRound(state, leftId, rightId, 1.0);
  const det0 = deterministicSecondRound(state, leftId, rightId, 0);
  const dampingSweep = Object.fromEntries(
    DAMPING_VALUES.map((d) => {
      const result = deterministicSecondRound(state, leftId, rightId, d);
      return [`margin_d${d}`, Number(Math.abs(result.leftScore - result.rightScore).toFixed(2))];
    }),
  );

  const retainedTotal = det62.retainedLeft + det62.retainedRight;
  const transferredTotal = det62.transferredLeft + det62.transferredRight;

  return {
    ...dampingSweep,
    runKey: `${partyId}:${agent}:${seedIndex}`,
    agent,
    finalistLeft: leftId,
    finalistRight: rightId,
    r1ScoreLeft: Number(r1Left.toFixed(2)),
    r1ScoreRight: Number(r1Right.toFixed(2)),
    r1Margin: Number(Math.abs(r1Left - r1Right).toFixed(2)),
    r2ScoreLeft: Number(r2Left.toFixed(2)),
    r2ScoreRight: Number(r2Right.toFixed(2)),
    r2Margin: Number(Math.abs(r2Left - r2Right).toFixed(2)),
    r2Winner: winner,
    favoriteAtR1,
    favoriteWonR2: favoriteAtR1 === winner,
    playerIsFinalist: partyId === leftId || partyId === rightId,
    playerWon: state.finalResult?.won === true,
    turnout: state.secondRoundResult.turnout,
    detLeftAt62: Number(det62.leftScore.toFixed(2)),
    detRightAt62: Number(det62.rightScore.toFixed(2)),
    detMarginAt62: Number(Math.abs(det62.leftScore - det62.rightScore).toFixed(2)),
    detMarginAt100: Number(Math.abs(det100.leftScore - det100.rightScore).toFixed(2)),
    detMarginAt0: Number(Math.abs(det0.leftScore - det0.rightScore).toFixed(2)),
    retainedShareLeft: retainedTotal > 0 ? Number(((det62.retainedLeft / retainedTotal) * 100).toFixed(1)) : 0,
    retainedShareRight: retainedTotal > 0 ? Number(((det62.retainedRight / retainedTotal) * 100).toFixed(1)) : 0,
    transferredShareLeft: Number(det62.transferredLeft.toFixed(2)),
    transferredShareRight: Number(det62.transferredRight.toFixed(2)),
    dampingContributionToMargin: Number(
      (Math.abs(det100.leftScore - det100.rightScore) - Math.abs(det62.leftScore - det62.rightScore)).toFixed(2),
    ),
  };
}

async function main() {
  const startedAt = Date.now();
  await mkdir(OUT_DIR, { recursive: true });
  const rows: RunoffRow[] = [];
  let attempted = 0;
  let noSecondRound = 0;

  for (const partyId of PARTY_IDS) {
    for (const agent of AGENT_NAMES) {
      for (let seedIndex = 0; seedIndex < SEEDS_PER_COMBO; seedIndex += 1) {
        attempted += 1;
        const row = runOne(partyId, agent, seedIndex);
        if (!row) {
          noSecondRound += 1;
          continue;
        }
        rows.push(row);
      }
    }
  }

  await writeFile(
    resolve(OUT_DIR, "runoff-raw.csv"),
    toCsv(rows as unknown as Record<string, unknown>[]),
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        attempted,
        noSecondRound,
        runoffRuns: rows.length,
        seedsPerCombo: SEEDS_PER_COMBO,
        durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)),
      },
      null,
      2,
    ),
  );
}

await main();
