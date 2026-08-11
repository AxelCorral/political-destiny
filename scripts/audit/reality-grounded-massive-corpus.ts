/**
 * PROMPT_CLAUDE_CODE_ANCRAGE_REEL_PSEUDO_REALITE_RECOMPOSITIONS.md §33-34 —
 * validation massive post-implémentation (≥10 000 campagnes). Même
 * méthodologie que `reality-grounding-baseline.ts` (Phase A, « avant »), pour
 * un avant/après directement comparable, étendue avec : distribution des
 * CandidateProfile résolus, et une mesure de la taille des chocs de retrait
 * (écart de score national avant/après un retrait effectivement survenu).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";
import type { GameState } from "../../src/game/types/index";
import { AGENT_NAMES, type AgentName, pickChoice } from "../audit-post/lib/agents";
import { toCsv } from "../audit-post/lib/csv";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/reality-grounding");
const SEEDS_PER_COMBO = Math.max(
  1,
  Number.parseInt(process.env.MASSIVE_SEEDS_PER_COMBO ?? "140", 10) || 140,
);
const PARTY_IDS = gameContent.parties.filter((p) => p.isRealOrganization).map((p) => p.id);

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
  maxWithdrawalShock: number;
  candidateProfileRn: string;
  candidateProfilePs: string;
  qualified: boolean;
  won: boolean;
}

function tallyActions(actions: GameState["opponentActions"]): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const action of actions) tally[action.kind] = (tally[action.kind] ?? 0) + 1;
  return tally;
}

function runOne(partyId: string, agent: AgentName, seedIndex: number): CampaignRow | undefined {
  const seed = `massive-after-${partyId}-${agent}-${seedIndex}`;
  const method = gameContent.methods[seedIndex % gameContent.methods.length]!;
  let state: GameState = createGame(
    { seed, mode: "existing_party", partyId, methodId: method.id },
    gameContent,
  );
  const candidateProfileRn = (state.flags["candidateProfile:rn"] as string) ?? "";
  const candidateProfilePs = (state.flags["candidateProfile:ps"] as string) ?? "";

  let guard = 0;
  let maxWithdrawalShock = 0;
  const lastPollingByParty: Record<string, number> = {};
  for (const p of Object.values(state.parties)) lastPollingByParty[p.id] = p.stats.polling;

  while (state.phase !== "finished" && guard < 80) {
    const event = currentEvent(state, gameContent.events);
    const choice = pickChoice(state, event, agent, seed);
    const before = state.opponentActions.length;
    state = resolveCurrentChoice(state, choice.id, gameContent).state;
    if (state.opponentActions.length > before) {
      const newActions = state.opponentActions.slice(before - state.opponentActions.length + 1);
      for (const action of newActions) {
        if (action.kind === "withdrawal") {
          const shock = lastPollingByParty[action.partyId] ?? 0;
          if (shock > maxWithdrawalShock) maxWithdrawalShock = shock;
        }
      }
    }
    for (const p of Object.values(state.parties)) lastPollingByParty[p.id] = p.stats.polling;
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
    maxWithdrawalShock: Number(maxWithdrawalShock.toFixed(2)),
    candidateProfileRn,
    candidateProfilePs,
    qualified: state.qualifiedPartyIds?.includes(partyId) ?? false,
    won: state.finalResult?.won ?? false,
  };
}

async function main() {
  const startedAt = Date.now();
  await mkdir(OUT_DIR, { recursive: true });

  const rows: CampaignRow[] = [];
  for (const partyId of PARTY_IDS) {
    for (const agent of AGENT_NAMES) {
      for (let seedIndex = 0; seedIndex < SEEDS_PER_COMBO; seedIndex += 1) {
        const row = runOne(partyId, agent, seedIndex);
        if (row) rows.push(row);
      }
    }
  }
  await writeFile(resolve(OUT_DIR, "massive-after-raw.csv"), toCsv(rows), "utf8");

  const withAtLeastOneWithdrawal = rows.filter((r) => r.withdrawals > 0).length;
  const withAtLeastOneReplacement = rows.filter((r) => r.replacements > 0).length;
  const withAtLeastOneAlliance = rows.filter((r) => r.alliances > 0).length;
  const withAtLeastOneDissidence = rows.filter((r) => r.dissidences > 0).length;
  const withAnyRecomposition = rows.filter(
    (r) => r.withdrawals + r.replacements + r.dissidences + r.alliances > 0,
  ).length;
  const withdrawalShocks = rows.filter((r) => r.maxWithdrawalShock > 0).map((r) => r.maxWithdrawalShock);

  const meanGap = rows.reduce((sum, r) => sum + r.r1Gap, 0) / rows.length;
  const meanStdDev = rows.reduce((sum, r) => sum + r.r1StdDev, 0) / rows.length;
  const meanLeaderScore = rows.reduce((sum, r) => sum + r.r1LeaderScore, 0) / rows.length;
  const dominantFavoriteCount = rows.filter((r) => r.r1LeaderScore > 22 && r.r1Gap > 5).length;
  const qualifiedCount = rows.filter((r) => r.qualified).length;
  const wonCount = rows.filter((r) => r.won).length;

  const rnFerran = rows.filter((r) => r.candidateProfileRn === "rn_ferran_profile").length;
  const rnMontclar = rows.filter((r) => r.candidateProfileRn === "rn_montclar_profile").length;
  const psVilledieu = rows.filter((r) => r.candidateProfilePs === "ps_villedieu_profile").length;
  const psRassemblement = rows.filter(
    (r) => r.candidateProfilePs === "ps_rassemblement_profile",
  ).length;

  const summary = {
    totalCampaigns: rows.length,
    seedsPerCombo: SEEDS_PER_COMBO,
    meanR1LeaderScore: Number(meanLeaderScore.toFixed(2)),
    meanR1Gap: Number(meanGap.toFixed(2)),
    meanR1StdDev: Number(meanStdDev.toFixed(3)),
    dominantFavoritePercent: Number(((dominantFavoriteCount / rows.length) * 100).toFixed(1)),
    qualificationRatePercent: Number(((qualifiedCount / rows.length) * 100).toFixed(1)),
    victoryRatePercent: Number(((wonCount / rows.length) * 100).toFixed(2)),
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
    meanWithdrawalShock: withdrawalShocks.length
      ? Number((withdrawalShocks.reduce((a, b) => a + b, 0) / withdrawalShocks.length).toFixed(2))
      : 0,
    maxWithdrawalShockObserved: withdrawalShocks.length ? Math.max(...withdrawalShocks) : 0,
    rnFerranSharePercent: Number(((rnFerran / rows.length) * 100).toFixed(1)),
    rnMontclarSharePercent: Number(((rnMontclar / rows.length) * 100).toFixed(1)),
    psVilledieuSharePercent: Number(((psVilledieu / rows.length) * 100).toFixed(1)),
    psRassemblementSharePercent: Number(((psRassemblement / rows.length) * 100).toFixed(1)),
    durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)),
  };
  await writeFile(
    resolve(OUT_DIR, "massive-after-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
  console.log(JSON.stringify(summary, null, 2));
}

await main();
