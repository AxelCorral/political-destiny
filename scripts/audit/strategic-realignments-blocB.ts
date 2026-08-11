/**
 * PROMPT_CLAUDE_CODE_RECOMPOSITIONS_STRATEGIQUES_SOUTIENS_CHOCS.md — BLOC B,
 * §37 : simulation massive post-correction. Reprend la méthodologie de
 * `strategic-realignments-blocA.ts` en corrigeant l'artefact identifié en
 * Bloc A §7 (comparer un "avant" et un "après" qui ne couvrent pas le même
 * ensemble de partis électoralement actifs) : tout pas de décision où le
 * nombre de partis actifs change (bascule premier tour, désistement en
 * cascade) est exclu du calcul de choc.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";
import { isElectorallyActive, nationalLatentSupport } from "../../src/game/engine/electorate";
import type { GameState, OpponentActionRecord } from "../../src/game/types/index";
import { AGENT_NAMES, type AgentName, pickChoice } from "../audit-post/lib/agents";
import { toCsv } from "../audit-post/lib/csv";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/strategic-realignments");
const BASELINE_DIR = resolve(OUT_DIR, "post-correction");

const BLOCS = gameContent.electorateBlocs;
const PARTY_IDS = gameContent.parties.filter((p) => p.isRealOrganization).map((p) => p.id);
const SEEDS_PER_COMBO = Math.max(
  1,
  Number.parseInt(process.env.BLOCB_SEEDS_PER_COMBO ?? "140", 10) || 140,
);

function activePartySignature(state: GameState): string {
  return Object.keys(state.parties)
    .filter((id) => isElectorallyActive(state, id))
    .sort()
    .join("|");
}

interface CampaignRow {
  [key: string]: unknown;
  runKey: string;
  seedPartyId: string;
  agent: string;
  collapseWithdrawals: number;
  strategicWithdrawals: number;
  negotiationsOpened: number;
  negotiationsFailed: number;
  negotiationsMaintained: number;
  nationalEndorsements: number;
  ecologistesStrategicWithdrawal: boolean;
  ecologistesBeneficiary: string;
  ecologistesCollapseWithdrawal: boolean;
  ecologistesMaintainedToEnd: boolean;
  qualified: boolean;
  won: boolean;
}

interface ShockRow {
  [key: string]: unknown;
  runKey: string;
  decisionIndex: number;
  kind: string;
  partyId: string;
  maxShockPoints: number;
  crossesActiveSetBoundary: boolean;
}

interface RedistributionSizeRow {
  [key: string]: unknown;
  runKey: string;
  decisionIndex: number;
  kind: string;
  partyId: string;
  releasedShare: number;
}

function tally(actions: OpponentActionRecord[], kind: string): number {
  return actions.filter((a) => a.kind === kind).length;
}

function runOne(
  seedPartyId: string,
  agent: AgentName,
  seedIndex: number,
): { corpus: CampaignRow; shocks: ShockRow[]; sizes: RedistributionSizeRow[] } {
  const seed = `blocB-${seedPartyId}-${agent}-${seedIndex}`;
  const method = gameContent.methods[seedIndex % gameContent.methods.length]!;
  let state: GameState = createGame(
    { seed, mode: "existing_party", partyId: seedPartyId, methodId: method.id },
    gameContent,
  );

  const shocks: ShockRow[] = [];
  const sizes: RedistributionSizeRow[] = [];
  let ecologistesBeneficiary = "";
  let ecologistesStrategicWithdrawal = false;
  let ecologistesCollapseWithdrawal = false;

  let guard = 0;
  while (state.phase !== "finished" && guard < 90) {
    const event = currentEvent(state, gameContent.events);
    const choice = pickChoice(state, event, agent, seed);
    const preState = state;
    const preSignature = activePartySignature(preState);
    const preTruth = nationalLatentSupport(preState, BLOCS);

    const next = resolveCurrentChoice(preState, choice.id, gameContent).state;
    // `state.opponentActions` is capped to the last 80 entries
    // (`addOpponentAction`, opponentSimulation.ts) — a length-based diff
    // (`slice(actionsBefore)`) silently returns [] forever once a campaign
    // accumulates 80+ actions (very common well before the first round with
    // 9 parties acting every decision), undercounting everything downstream.
    // `decisionIndex` is stamped at call time and survives truncation, so
    // filter on it instead.
    const newActions = next.opponentActions.filter((a) => a.decisionIndex === next.decisionIndex);
    const withdrawalLike = newActions.filter(
      (a) => a.kind === "withdrawal" || a.kind === "strategic_withdrawal",
    );

    if (withdrawalLike.length > 0) {
      const postSignature = activePartySignature(next);
      const crossesBoundary = preSignature !== postSignature && next.phase !== preState.phase;
      const postTruth = nationalLatentSupport(next, BLOCS);
      const maxShock = Math.max(
        ...Object.keys(postTruth).map((id) => Math.abs((postTruth[id] ?? 0) - (preTruth[id] ?? 0))),
      );
      for (const action of withdrawalLike) {
        shocks.push({
          runKey: `${seedPartyId}:${agent}:${seedIndex}`,
          decisionIndex: preState.decisionIndex,
          kind: action.kind,
          partyId: action.partyId,
          maxShockPoints: Number(maxShock.toFixed(3)),
          crossesActiveSetBoundary: crossesBoundary,
        });
        sizes.push({
          runKey: `${seedPartyId}:${agent}:${seedIndex}`,
          decisionIndex: preState.decisionIndex,
          kind: action.kind,
          partyId: action.partyId,
          releasedShare: Number((preTruth[action.partyId] ?? 0).toFixed(3)),
        });
        if (action.partyId === "ecologistes") {
          if (action.kind === "strategic_withdrawal") {
            ecologistesStrategicWithdrawal = true;
            const beneficiary = next.flags[`rallying:ecologistes`];
            ecologistesBeneficiary = typeof beneficiary === "string" ? beneficiary : "";
          } else {
            ecologistesCollapseWithdrawal = true;
          }
        }
      }
    }

    state = next;
    guard += 1;
  }

  const actions = state.opponentActions;
  return {
    corpus: {
      runKey: `${seedPartyId}:${agent}:${seedIndex}`,
      seedPartyId,
      agent,
      collapseWithdrawals: tally(actions, "withdrawal"),
      strategicWithdrawals: tally(actions, "strategic_withdrawal"),
      negotiationsOpened: tally(actions, "negotiation_opened"),
      negotiationsFailed: tally(actions, "negotiation_failed"),
      negotiationsMaintained: actions.filter(
        (a) => a.kind === "negotiation_failed" && a.summary.includes("rouvre une voie"),
      ).length,
      nationalEndorsements: gameContent.majorEndorsements
        ? Object.keys(state.flags).filter(
            (key) =>
              key.startsWith("endorsement_") &&
              (gameContent.majorEndorsements ?? []).some(
                (e) => e.figureKind !== "world_figure" && key === e.id,
              ),
          ).length
        : 0,
      ecologistesStrategicWithdrawal,
      ecologistesBeneficiary,
      ecologistesCollapseWithdrawal,
      ecologistesMaintainedToEnd:
        !ecologistesStrategicWithdrawal &&
        !ecologistesCollapseWithdrawal &&
        state.parties.ecologistes?.active === true,
      qualified: state.qualifiedPartyIds?.includes(seedPartyId) ?? false,
      won: state.finalResult?.won ?? false,
    },
    shocks,
    sizes,
  };
}

async function main() {
  const startedAt = Date.now();
  await mkdir(BASELINE_DIR, { recursive: true });

  const corpusRows: CampaignRow[] = [];
  const shockRows: ShockRow[] = [];
  const sizeRows: RedistributionSizeRow[] = [];

  for (const partyId of PARTY_IDS) {
    for (const agent of AGENT_NAMES) {
      for (let seedIndex = 0; seedIndex < SEEDS_PER_COMBO; seedIndex += 1) {
        const { corpus, shocks, sizes } = runOne(partyId, agent, seedIndex);
        corpusRows.push(corpus);
        shockRows.push(...shocks);
        sizeRows.push(...sizes);
      }
    }
  }

  await writeFile(resolve(BASELINE_DIR, "corpus-raw.csv"), toCsv(corpusRows), "utf8");
  await writeFile(resolve(BASELINE_DIR, "shocks-raw.csv"), toCsv(shockRows), "utf8");
  await writeFile(resolve(BASELINE_DIR, "redistribution-sizes-raw.csv"), toCsv(sizeRows), "utf8");

  const cleanShocks = shockRows.filter((r) => !r.crossesActiveSetBoundary);
  const collapseShocks = cleanShocks.filter((r) => r.kind === "withdrawal");
  const strategicShocks = cleanShocks.filter((r) => r.kind === "strategic_withdrawal");

  const withAtLeastOneCollapse = corpusRows.filter((r) => r.collapseWithdrawals > 0).length;
  const withAtLeastOneStrategic = corpusRows.filter((r) => r.strategicWithdrawals > 0).length;
  const withAnyWithdrawal = corpusRows.filter(
    (r) => r.collapseWithdrawals + r.strategicWithdrawals > 0,
  ).length;
  const withNegotiationOpened = corpusRows.filter((r) => r.negotiationsOpened > 0).length;
  const totalNegotiationsOpened = corpusRows.reduce((s, r) => s + r.negotiationsOpened, 0);
  const totalStrategicSuccess = corpusRows.reduce((s, r) => s + r.strategicWithdrawals, 0);
  const totalNegotiationsFailedOrMaintained = corpusRows.reduce(
    (s, r) => s + r.negotiationsFailed,
    0,
  );

  const sizesSorted = [...sizeRows.map((r) => r.releasedShare as number)].sort((a, b) => a - b);
  const percentile = (p: number) =>
    sizesSorted.length ? sizesSorted[Math.floor((sizesSorted.length - 1) * p)] : 0;

  const ecoStrategic = corpusRows.filter((r) => r.ecologistesStrategicWithdrawal);
  const ecoBeneficiaryPs = ecoStrategic.filter((r) => r.ecologistesBeneficiary === "ps").length;
  const ecoBeneficiaryLfi = ecoStrategic.filter((r) => r.ecologistesBeneficiary === "lfi").length;
  const ecoMaintained = corpusRows.filter((r) => r.ecologistesMaintainedToEnd).length;

  const summary = {
    totalCampaigns: corpusRows.length,
    seedsPerCombo: SEEDS_PER_COMBO,
    withdrawalFrequencyPercent: Number(((withAnyWithdrawal / corpusRows.length) * 100).toFixed(2)),
    collapseWithdrawalFrequencyPercent: Number(
      ((withAtLeastOneCollapse / corpusRows.length) * 100).toFixed(2),
    ),
    strategicWithdrawalFrequencyPercent: Number(
      ((withAtLeastOneStrategic / corpusRows.length) * 100).toFixed(2),
    ),
    campaignsWithNegotiationOpenedPercent: Number(
      ((withNegotiationOpened / corpusRows.length) * 100).toFixed(2),
    ),
    negotiationsOpenedTotal: totalNegotiationsOpened,
    negotiationsSucceededTotal: totalStrategicSuccess,
    negotiationsFailedOrMaintainedTotal: totalNegotiationsFailedOrMaintained,
    negotiationSuccessRatePercent: totalNegotiationsOpened
      ? Number(((totalStrategicSuccess / totalNegotiationsOpened) * 100).toFixed(1))
      : 0,
    redistributionSizeMean: sizesSorted.length
      ? Number((sizesSorted.reduce((a, b) => a + b, 0) / sizesSorted.length).toFixed(3))
      : 0,
    redistributionSizeP90: Number((percentile(0.9) ?? 0).toFixed(3)),
    redistributionSizeP99: Number((percentile(0.99) ?? 0).toFixed(3)),
    redistributionSizeMax: sizesSorted.length ? sizesSorted[sizesSorted.length - 1] : 0,
    cleanShockCount: cleanShocks.length,
    cleanShockMean: cleanShocks.length
      ? Number(
          (cleanShocks.reduce((s, r) => s + (r.maxShockPoints as number), 0) / cleanShocks.length).toFixed(3),
        )
      : 0,
    cleanShockMax: cleanShocks.length
      ? Math.max(...cleanShocks.map((r) => r.maxShockPoints as number))
      : 0,
    cleanShocksOver5: cleanShocks.filter((r) => (r.maxShockPoints as number) > 5).length,
    cleanShocksOver10: cleanShocks.filter((r) => (r.maxShockPoints as number) > 10).length,
    cleanShocksOver20: cleanShocks.filter((r) => (r.maxShockPoints as number) > 20).length,
    cleanShocksOver30: cleanShocks.filter((r) => (r.maxShockPoints as number) > 30).length,
    boundaryCrossingShockCount: shockRows.length - cleanShocks.length,
    collapseShockMean: collapseShocks.length
      ? Number(
          (
            collapseShocks.reduce((s, r) => s + (r.maxShockPoints as number), 0) /
            collapseShocks.length
          ).toFixed(3),
        )
      : 0,
    strategicShockMean: strategicShocks.length
      ? Number(
          (
            strategicShocks.reduce((s, r) => s + (r.maxShockPoints as number), 0) /
            strategicShocks.length
          ).toFixed(3),
        )
      : 0,
    strategicShockMax: strategicShocks.length
      ? Math.max(...strategicShocks.map((r) => r.maxShockPoints as number))
      : 0,
    ecologistesStrategicWithdrawals: ecoStrategic.length,
    ecologistesStrategicWithdrawalRatePercent: Number(
      ((ecoStrategic.length / corpusRows.length) * 100).toFixed(3),
    ),
    ecologistesBeneficiaryPs: ecoBeneficiaryPs,
    ecologistesBeneficiaryLfi: ecoBeneficiaryLfi,
    ecologistesCollapseWithdrawals: corpusRows.filter((r) => r.ecologistesCollapseWithdrawal).length,
    ecologistesMaintainedToEnd: ecoMaintained,
    campaignsWithNationalEndorsement: corpusRows.filter((r) => r.nationalEndorsements > 0).length,
    campaignsWithNationalEndorsementPercent: Number(
      (
        (corpusRows.filter((r) => r.nationalEndorsements > 0).length / corpusRows.length) *
        100
      ).toFixed(2),
    ),
    qualificationRatePercent: Number(
      ((corpusRows.filter((r) => r.qualified).length / corpusRows.length) * 100).toFixed(2),
    ),
    victoryRatePercent: Number(
      ((corpusRows.filter((r) => r.won).length / corpusRows.length) * 100).toFixed(2),
    ),
    durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)),
  };
  await writeFile(resolve(BASELINE_DIR, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

await main();
