/**
 * PROMPT_CLAUDE_CODE_ANCRAGE_REEL_PSEUDO_REALITE_RECOMPOSITIONS.md §26 — audit
 * du modèle ACTUEL (avant toute modification de cette mission) : distribution
 * initiale, dispersion due aux seeds, fréquence des recompositions (retrait,
 * remplacement, alliance, dissidence). Sert de référence « avant » pour
 * REALITY_GROUNDING_BASELINE.md et pour le tableau avant/après du rapport
 * final. Aucune modification du moteur : lecture seule via le moteur réel.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";
import type { GameState, OpponentActionRecord } from "../../src/game/types/index";
import { AGENT_NAMES, type AgentName, pickChoice } from "../audit-post/lib/agents";
import { toCsv } from "../audit-post/lib/csv";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/reality-grounding");
const SEEDS_PER_COMBO = Math.max(
  1,
  Number.parseInt(process.env.BASELINE_SEEDS_PER_COMBO ?? "76", 10) || 76,
);
const PARTY_IDS = gameContent.parties.filter((p) => p.isRealOrganization).map((p) => p.id);

interface InitialRow {
  [key: string]: unknown;
  partyId: string;
  initialPolling: number;
}

function captureInitialSnapshot(): InitialRow[] {
  // Distribution initiale (decision 0) : indépendante du parti joué et de la
  // graine par construction actuelle (aucun bruit appliqué à la création) —
  // vérifié ici sur 3 graines/partis distincts pour confirmer empiriquement,
  // pas seulement par lecture du code.
  const rows: InitialRow[] = [];
  for (const seedSuffix of ["a", "b", "c"]) {
    for (const partyId of PARTY_IDS) {
      const state = createGame(
        { seed: `baseline-initial-${partyId}-${seedSuffix}`, mode: "existing_party", partyId, methodId: gameContent.methods[0]!.id },
        gameContent,
      );
      for (const otherId of PARTY_IDS) {
        rows.push({
          partyId: otherId,
          initialPolling: Number((state.parties[otherId]?.stats.polling ?? 0).toFixed(3)),
          observerParty: partyId,
          seedSuffix,
        });
      }
    }
  }
  return rows;
}

interface CampaignRow {
  [key: string]: unknown;
  runKey: string;
  partyId: string;
  agent: string;
  r1Leader: string;
  r1LeaderScore: number;
  r1RunnerUpScore: number;
  r1Gap: number;
  r1StdDev: number;
  withdrawals: number;
  replacements: number;
  primaries: number;
  dissidences: number;
  alliances: number;
  endorsements: number;
  rallyings: number;
  playerQualified: boolean;
  playerWon: boolean;
}

function tallyActions(actions: OpponentActionRecord[]): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const action of actions) tally[action.kind] = (tally[action.kind] ?? 0) + 1;
  return tally;
}

function runOne(partyId: string, agent: AgentName, seedIndex: number): CampaignRow | undefined {
  const seed = `baseline-current-${partyId}-${agent}-${seedIndex}`;
  const method = gameContent.methods[seedIndex % gameContent.methods.length]!;
  let state: GameState = createGame(
    { seed, mode: "existing_party", partyId, methodId: method.id },
    gameContent,
  );
  let guard = 0;
  while (state.phase !== "finished" && guard < 80) {
    const event = currentEvent(state, gameContent.events);
    const choice = pickChoice(state, event, agent, seed);
    state = resolveCurrentChoice(state, choice.id, gameContent).state;
    guard += 1;
  }
  if (!state.firstRoundResult) return undefined;
  const results = state.firstRoundResult.results;
  const ranked = Object.entries(results).sort((a, b) => b[1] - a[1]);
  const values = Object.values(results);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const tally = tallyActions(state.opponentActions);

  return {
    runKey: `${partyId}:${agent}:${seedIndex}`,
    partyId,
    agent,
    r1Leader: ranked[0]?.[0] ?? "",
    r1LeaderScore: Number((ranked[0]?.[1] ?? 0).toFixed(2)),
    r1RunnerUpScore: Number((ranked[1]?.[1] ?? 0).toFixed(2)),
    r1Gap: Number(((ranked[0]?.[1] ?? 0) - (ranked[1]?.[1] ?? 0)).toFixed(2)),
    r1StdDev: Number(Math.sqrt(variance).toFixed(3)),
    withdrawals: tally.withdrawal ?? 0,
    replacements: tally.replacement ?? 0,
    primaries: tally.primary ?? 0,
    dissidences: tally.dissidence ?? 0,
    alliances: tally.alliance ?? 0,
    endorsements: tally.endorsement ?? 0,
    rallyings: tally.rallying ?? 0,
    playerQualified: state.qualifiedPartyIds?.includes(partyId) ?? false,
    playerWon: state.finalResult?.won ?? false,
  };
}

async function main() {
  const startedAt = Date.now();
  await mkdir(OUT_DIR, { recursive: true });

  const initialRows = captureInitialSnapshot();
  await writeFile(resolve(OUT_DIR, "baseline-initial-snapshot.csv"), toCsv(initialRows), "utf8");

  const rows: CampaignRow[] = [];
  for (const partyId of PARTY_IDS) {
    for (const agent of AGENT_NAMES) {
      for (let seedIndex = 0; seedIndex < SEEDS_PER_COMBO; seedIndex += 1) {
        const row = runOne(partyId, agent, seedIndex);
        if (row) rows.push(row);
      }
    }
  }
  await writeFile(resolve(OUT_DIR, "baseline-current-model-raw.csv"), toCsv(rows), "utf8");

  const withAtLeastOneWithdrawal = rows.filter((r) => r.withdrawals > 0).length;
  const withAtLeastOneReplacement = rows.filter((r) => r.replacements > 0).length;
  const withAtLeastOneAlliance = rows.filter((r) => r.alliances > 0).length;
  const withAtLeastOneDissidence = rows.filter((r) => r.dissidences > 0).length;
  const withAnyRecomposition = rows.filter(
    (r) => r.withdrawals + r.replacements + r.dissidences + r.alliances > 0,
  ).length;

  const meanGap = rows.reduce((sum, r) => sum + r.r1Gap, 0) / rows.length;
  const meanStdDev = rows.reduce((sum, r) => sum + r.r1StdDev, 0) / rows.length;
  const meanLeaderScore = rows.reduce((sum, r) => sum + r.r1LeaderScore, 0) / rows.length;
  const dominantFavoriteCount = rows.filter((r) => r.r1LeaderScore > 22 && r.r1Gap > 5).length;

  const summary = {
    totalCampaigns: rows.length,
    seedsPerCombo: SEEDS_PER_COMBO,
    meanR1LeaderScore: Number(meanLeaderScore.toFixed(2)),
    meanR1Gap: Number(meanGap.toFixed(2)),
    meanR1StdDev: Number(meanStdDev.toFixed(3)),
    dominantFavoritePercent: Number(((dominantFavoriteCount / rows.length) * 100).toFixed(1)),
    withdrawalFrequencyPercent: Number(((withAtLeastOneWithdrawal / rows.length) * 100).toFixed(2)),
    replacementFrequencyPercent: Number(
      ((withAtLeastOneReplacement / rows.length) * 100).toFixed(2),
    ),
    allianceFrequencyPercent: Number(((withAtLeastOneAlliance / rows.length) * 100).toFixed(2)),
    dissidenceFrequencyPercent: Number(
      ((withAtLeastOneDissidence / rows.length) * 100).toFixed(2),
    ),
    anyRecompositionFrequencyPercent: Number(
      ((withAnyRecomposition / rows.length) * 100).toFixed(2),
    ),
    durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)),
  };
  await writeFile(
    resolve(OUT_DIR, "baseline-current-model-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
  console.log(JSON.stringify(summary, null, 2));
}

await main();
