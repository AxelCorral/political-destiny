/**
 * PROMPT_CLAUDE_CODE_RECOMPOSITIONS_STRATEGIQUES_SOUTIENS_CHOCS.md — BLOC A.
 *
 * Read-only diagnostic script: imports and calls the *existing* production
 * engine (`redistributeElectorate`, `nationalLatentSupport`, full campaign
 * loop via `resolveCurrentChoice`) exactly as shipped — never modifies any
 * production file. Produces every CSV listed in §28 plus the raw corpus that
 * backs `AUDIT_STRATEGIC_REALIGNMENTS.md`.
 *
 * The `computeViabilityDiagnostic`/`computeFragmentationDiagnostic` functions
 * below are audit-only prototypes of the §5/§6 concepts (`electoralViability`,
 * bloc fragmentation pressure) — they read state but write nothing back, so
 * they can be evaluated against the *current* engine's behaviour before any
 * production code exists for them. Bloc B ports a refined version of the
 * same formulas into `src/game/engine/viability.ts`.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";
import { isElectorallyActive, nationalLatentSupport } from "../../src/game/engine/electorate";
import { redistributeElectorate } from "../../src/game/engine/redistribution";
import { clamp, ideologyDistance, normalizePercentages } from "../../src/game/engine/math";
import type {
  ElectorateBlocDefinition,
  GameState,
  OpponentActionRecord,
  PartyDefinition,
} from "../../src/game/types/index";
import { AGENT_NAMES, type AgentName, pickChoice } from "../audit-post/lib/agents";
import { toCsv } from "../audit-post/lib/csv";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/strategic-realignments");
const BASELINE_DIR = resolve(OUT_DIR, "baseline");

const BLOCS = gameContent.electorateBlocs;
const PARTY_DEFS = new Map<string, PartyDefinition>(gameContent.parties.map((p) => [p.id, p]));
const PARTY_IDS = gameContent.parties.filter((p) => p.isRealOrganization).map((p) => p.id);

const CORPUS_SEEDS_PER_COMBO = Math.max(
  1,
  Number.parseInt(process.env.BLOCA_SEEDS_PER_COMBO ?? "90", 10) || 90,
);

// ---------------------------------------------------------------------------
// §5 / §6 audit-only diagnostics (never written back to state).
// ---------------------------------------------------------------------------

interface ViabilitySnapshot {
  partyId: string;
  score: number;
  rank: number;
  gapToTop2: number;
  momentum: number;
  credibility: number;
  rejection: number;
  cohesion: number;
  hasAlliance: boolean;
  bestNaturalAllyId?: string;
  bestNaturalAllyScore: number;
  viability: number;
}

function computeViabilityDiagnostic(
  state: GameState,
  partyId: string,
  truth: Record<string, number>,
): ViabilitySnapshot | undefined {
  const party = state.parties[partyId];
  const def = PARTY_DEFS.get(partyId);
  if (!party || !def) return undefined;
  const ranked = Object.entries(truth)
    .filter(([id]) => state.parties[id]?.active)
    .sort((a, b) => b[1] - a[1]);
  const rank = ranked.findIndex(([id]) => id === partyId) + 1;
  const top2Floor = ranked[1]?.[1] ?? 0;
  const score = truth[partyId] ?? 0;
  const gapToTop2 = score - top2Floor;

  const naturalAllies = def.campaignProfile?.naturalAllies ?? [];
  const allyScores = naturalAllies
    .filter((id) => state.parties[id]?.active)
    .map((id) => ({ id, score: truth[id] ?? 0 }))
    .sort((a, b) => b.score - a.score);
  const bestAlly = allyScores[0];

  // Illustrative composite: not tuned, only meant to demonstrate the concept
  // has explanatory power before it is ported into production in Bloc B.
  const viability =
    score * 1.4 +
    Math.max(-15, Math.min(15, gapToTop2 * 0.6)) +
    Math.max(0, 12 - rank) * 1.2 +
    party.stats.momentum * 0.1 +
    party.stats.credibility * 0.08 -
    party.stats.rejection * 0.06 +
    (party.alliedWith.length > 0 ? 6 : 0) +
    (bestAlly ? Math.max(0, bestAlly.score - score) * 0.15 : 0);

  return {
    partyId,
    score: Number(score.toFixed(2)),
    rank,
    gapToTop2: Number(gapToTop2.toFixed(2)),
    momentum: Number(party.stats.momentum.toFixed(1)),
    credibility: Number(party.stats.credibility.toFixed(1)),
    rejection: Number(party.stats.rejection.toFixed(1)),
    cohesion: Number(party.stats.cohesion.toFixed(1)),
    hasAlliance: party.alliedWith.length > 0,
    bestNaturalAllyId: bestAlly?.id,
    bestNaturalAllyScore: Number((bestAlly?.score ?? 0).toFixed(2)),
    viability: Number(viability.toFixed(2)),
  };
}

interface FragmentationSnapshot {
  partyId: string;
  directCompetitorsInRace: number;
  combinedWithBestCompetitorReachesTop2: boolean;
  spoilerPressure: number;
}

function computeFragmentationDiagnostic(
  state: GameState,
  partyId: string,
  truth: Record<string, number>,
): FragmentationSnapshot | undefined {
  const def = PARTY_DEFS.get(partyId);
  if (!def) return undefined;
  const ranked = Object.entries(truth)
    .filter(([id]) => state.parties[id]?.active)
    .sort((a, b) => b[1] - a[1]);
  const top2Floor = ranked[1]?.[1] ?? 0;
  const score = truth[partyId] ?? 0;

  const competitors = (def.campaignProfile?.directCompetitors ?? []).filter(
    (id) => state.parties[id]?.active,
  );
  let spoilerPressure = 0;
  let combinedReachesTop2 = false;
  for (const competitorId of competitors) {
    const competitorScore = truth[competitorId] ?? 0;
    const closeness = Math.max(0, 1 - Math.abs(competitorScore - score) / 15);
    spoilerPressure += closeness;
    if (score < top2Floor && score + competitorScore >= top2Floor && competitorScore < top2Floor) {
      combinedReachesTop2 = true;
    }
  }

  return {
    partyId,
    directCompetitorsInRace: competitors.length,
    combinedWithBestCompetitorReachesTop2: combinedReachesTop2,
    spoilerPressure: Number(spoilerPressure.toFixed(2)),
  };
}

// ---------------------------------------------------------------------------
// Part 1 — massive corpus: withdrawal trigger classification + viability +
// fragmentation snapshots at the moment of every withdrawal that actually
// occurs, plus Écologistes-specific tracking across the whole corpus.
// ---------------------------------------------------------------------------

interface WithdrawalRow {
  [key: string]: unknown;
  runKey: string;
  seedPartyId: string;
  agent: string;
  withdrawnPartyId: string;
  decisionIndex: number;
  pollingAtWithdrawal: number;
  legitimacyAtWithdrawal: number;
  cohesionAtWithdrawal: number;
  rankAtWithdrawal: number;
  triggerLowPolling: boolean;
  triggerLowLegitimacy: boolean;
  viabilityAtWithdrawal: number;
  gapToTop2AtWithdrawal: number;
  spoilerPressureAtWithdrawal: number;
  hasNaturalAllyBetterPlaced: boolean;
  bestNaturalAllyId: string;
  nationalShockPoints: number;
  rankFlipped: boolean;
}

interface CorpusRow {
  [key: string]: unknown;
  runKey: string;
  seedPartyId: string;
  agent: string;
  withdrawals: number;
  ecologistesWithdrew: boolean;
  ecologistesMinViability: number;
  ecologistesMinViabilityDecisionIndex: number;
  ecologistesMaxPolling: number;
  ecologistesFinalPolling: number;
}

function tallyKind(actions: OpponentActionRecord[], kind: string): number {
  return actions.filter((a) => a.kind === kind).length;
}

function runCorpusCampaign(
  seedPartyId: string,
  agent: AgentName,
  seedIndex: number,
): { withdrawals: WithdrawalRow[]; corpus: CorpusRow } {
  const seed = `blocA-${seedPartyId}-${agent}-${seedIndex}`;
  const method = gameContent.methods[seedIndex % gameContent.methods.length]!;
  let state: GameState = createGame(
    { seed, mode: "existing_party", partyId: seedPartyId, methodId: method.id },
    gameContent,
  );

  const withdrawalRows: WithdrawalRow[] = [];
  let ecologistesMinViability = Number.POSITIVE_INFINITY;
  let ecologistesMinViabilityDecisionIndex = -1;
  let ecologistesMaxPolling = 0;

  let guard = 0;
  while (state.phase !== "finished" && guard < 90) {
    const truthBefore = nationalLatentSupport(state, BLOCS);
    const eco = computeViabilityDiagnostic(state, "ecologistes", truthBefore);
    if (eco && state.parties.ecologistes?.active) {
      if (eco.viability < ecologistesMinViability) {
        ecologistesMinViability = eco.viability;
        ecologistesMinViabilityDecisionIndex = state.decisionIndex;
      }
      ecologistesMaxPolling = Math.max(ecologistesMaxPolling, eco.score);
    }

    const event = currentEvent(state, gameContent.events);
    const choice = pickChoice(state, event, agent, seed);

    // Snapshot everything we might need to explain a withdrawal *before* it happens.
    const preState = state;

    const next = resolveCurrentChoice(preState, choice.id, gameContent).state;
    // CORRECTION post-Bloc A (voir STRATEGIC_REALIGNMENTS_REPORT.md) :
    // `state.opponentActions` est plafonné aux 80 dernières entrées
    // (`addOpponentAction`, opponentSimulation.ts) — un diff par longueur
    // (`slice(actionsBefore)`) renvoie silencieusement `[]` en permanence dès
    // qu'une campagne accumule 80+ actions, sous-comptant les retraits
    // tardifs. `decisionIndex` est apposé à l'appel et survit à la
    // troncature ; filtrer dessus est robuste.
    const newActions = next.opponentActions.filter((a) => a.decisionIndex === next.decisionIndex);
    const withdrawalActions = newActions.filter((a) => a.kind === "withdrawal");

    for (const action of withdrawalActions) {
      const party = preState.parties[action.partyId];
      const actor = preState.actors[party?.candidateId ?? ""];
      if (!party || !actor) continue;
      const viability = computeViabilityDiagnostic(preState, action.partyId, truthBefore);
      const fragmentation = computeFragmentationDiagnostic(preState, action.partyId, truthBefore);
      const truthAfter = nationalLatentSupport(next, BLOCS);
      const rankBefore = Object.entries(truthBefore)
        .filter(([id]) => preState.parties[id]?.active)
        .sort((a, b) => b[1] - a[1])
        .findIndex(([id]) => id === action.partyId) + 1;
      const leaderBefore = Object.entries(truthBefore).sort((a, b) => b[1] - a[1])[0]?.[0];
      const leaderAfter = Object.entries(truthAfter).sort((a, b) => b[1] - a[1])[0]?.[0];

      const def = PARTY_DEFS.get(action.partyId);
      const allies = def?.campaignProfile?.naturalAllies ?? [];
      const betterPlacedAlly = allies.find(
        (id) => (truthBefore[id] ?? 0) > (truthBefore[action.partyId] ?? 0),
      );

      withdrawalRows.push({
        runKey: `${seedPartyId}:${agent}:${seedIndex}`,
        seedPartyId,
        agent,
        withdrawnPartyId: action.partyId,
        decisionIndex: preState.decisionIndex,
        pollingAtWithdrawal: Number(party.stats.polling.toFixed(2)),
        legitimacyAtWithdrawal: Number(actor.legitimacy.toFixed(2)),
        cohesionAtWithdrawal: Number(party.stats.cohesion.toFixed(2)),
        rankAtWithdrawal: rankBefore,
        triggerLowPolling: party.stats.polling < 6,
        triggerLowLegitimacy: actor.legitimacy < 45,
        viabilityAtWithdrawal: viability?.viability ?? Number.NaN,
        gapToTop2AtWithdrawal: viability?.gapToTop2 ?? Number.NaN,
        spoilerPressureAtWithdrawal: fragmentation?.spoilerPressure ?? Number.NaN,
        hasNaturalAllyBetterPlaced: Boolean(betterPlacedAlly),
        bestNaturalAllyId: betterPlacedAlly ?? "",
        nationalShockPoints: Number(
          Math.max(
            ...Object.keys(truthAfter).map((id) =>
              Math.abs((truthAfter[id] ?? 0) - (truthBefore[id] ?? 0)),
            ),
          ).toFixed(2),
        ),
        rankFlipped: leaderBefore !== leaderAfter,
      });
    }

    state = next;
    guard += 1;
  }

  const withdrawals = tallyKind(state.opponentActions, "withdrawal");
  return {
    withdrawals: withdrawalRows,
    corpus: {
      runKey: `${seedPartyId}:${agent}:${seedIndex}`,
      seedPartyId,
      agent,
      withdrawals,
      ecologistesWithdrew: withdrawalRows.some((r) => r.withdrawnPartyId === "ecologistes"),
      ecologistesMinViability: Number.isFinite(ecologistesMinViability)
        ? Number(ecologistesMinViability.toFixed(2))
        : Number.NaN,
      ecologistesMinViabilityDecisionIndex,
      ecologistesMaxPolling: Number(ecologistesMaxPolling.toFixed(2)),
      ecologistesFinalPolling: Number((state.parties.ecologistes?.stats.polling ?? 0).toFixed(2)),
    },
  };
}

// ---------------------------------------------------------------------------
// Part 2 — shock traces: find the largest withdrawal shocks in the corpus and
// fully decompose them stage by stage (§12).
// ---------------------------------------------------------------------------

interface ShockTraceRow {
  [key: string]: unknown;
  runKey: string;
  withdrawnPartyId: string;
  decisionIndex: number;
  stage: string;
  partyId: string;
  value: number;
}

function traceShock(
  preState: GameState,
  withdrawingPartyId: string,
  runKey: string,
  decisionIndex: number,
): ShockTraceRow[] {
  const rows: ShockTraceRow[] = [];
  const push = (stage: string, partyId: string, value: number) =>
    rows.push({ runKey, withdrawnPartyId: withdrawingPartyId, decisionIndex, stage, partyId, value: Number(value.toFixed(4)) });

  // Stage 0: latentSupport per bloc, before (only for the withdrawing party + top 3 recipients).
  const activeIds = Object.values(preState.parties)
    .filter((p) => p.active)
    .map((p) => p.id);

  // Stage 1: national truth before (post current DISPERSION_POWER=2, as displayed).
  const truthBefore = nationalLatentSupport(preState, BLOCS);
  for (const id of activeIds) push("1_national_truth_before_power2", id, truthBefore[id] ?? 0);

  // Stage 2: run the real redistribution.
  const { state: afterState, transfers } = redistributeElectorate(preState, BLOCS, withdrawingPartyId);
  for (const id of activeIds) push("2_transfer_points_power2", id, transfers[id] ?? 0);

  // Stage 3: national truth after (post current DISPERSION_POWER=2, as displayed/used for polling).
  const truthAfter = nationalLatentSupport(afterState, BLOCS);
  for (const id of activeIds) push("3_national_truth_after_power2", id, truthAfter[id] ?? 0);

  // Stage 4: same before/after computed at DISPERSION_POWER=1 (linear, no amplification) to
  // isolate how much of the shock is raw redistribution vs. amplification (§14).
  const linearBefore = nationalLatentSupportAtPower(preState, BLOCS, 1);
  const linearAfter = nationalLatentSupportAtPower(afterState, BLOCS, 1);
  for (const id of activeIds) {
    push("4_national_truth_before_power1_linear", id, linearBefore[id] ?? 0);
    push("5_national_truth_after_power1_linear", id, linearAfter[id] ?? 0);
  }

  // Stage 6: undecided-by-bloc delta (abstention accounting, §16-17).
  for (const bloc of BLOCS) {
    const before = preState.electorate.undecidedByBloc[bloc.id] ?? 0;
    const after = afterState.electorate.undecidedByBloc[bloc.id] ?? 0;
    push("6_undecided_delta", bloc.id, after - before);
  }

  return rows;
}

/** Same aggregation as `nationalLatentSupport` but with a parameterised power — audit-only, mirrors electorate.ts exactly. */
function nationalLatentSupportAtPower(
  state: GameState,
  blocs: ElectorateBlocDefinition[],
  power: number,
): Record<string, number> {
  const totals: Record<string, number> = Object.fromEntries(
    Object.keys(state.parties).map((id) => [id, 0]),
  );
  for (const bloc of blocs) {
    const turnout = (state.electorate.turnoutByBloc[bloc.id] ?? bloc.turnout) / 100;
    const undecided = (state.electorate.undecidedByBloc[bloc.id] ?? 0) / 100;
    const expressedWeight = bloc.weight * turnout * (1 - undecided);
    const supports = state.electorate.latentSupport[bloc.id];
    for (const partyId of Object.keys(totals)) {
      if (!isElectorallyActive(state, partyId)) continue;
      totals[partyId] = (totals[partyId] ?? 0) + ((supports?.[partyId] ?? 0) / 100) * expressedWeight;
    }
  }
  const amplified = Object.fromEntries(
    Object.entries(totals).map(([id, v]) => [id, v > 0 ? v ** power : 0]),
  );
  return normalizePercentages(amplified, 3);
}

// ---------------------------------------------------------------------------
// Part 3 — DISPERSION_POWER sensitivity (§14): same structural states, power
// swept across 1.6/1.8/2.0/2.2.
// ---------------------------------------------------------------------------

interface PowerSensitivityRow {
  [key: string]: unknown;
  runKey: string;
  withdrawnPartyId: string;
  power: number;
  maxShockPoints: number;
  leaderBefore: string;
  leaderAfter: string;
  leaderFlipped: boolean;
  top2Before: string;
  top2After: string;
  top2Changed: boolean;
}

function powerSensitivity(
  preState: GameState,
  withdrawingPartyId: string,
  runKey: string,
): PowerSensitivityRow[] {
  const { state: afterState } = redistributeElectorate(preState, BLOCS, withdrawingPartyId);
  const rows: PowerSensitivityRow[] = [];
  for (const power of [1.6, 1.8, 2.0, 2.2]) {
    const before = nationalLatentSupportAtPower(preState, BLOCS, power);
    const after = nationalLatentSupportAtPower(afterState, BLOCS, power);
    const ids = Object.keys(before);
    const maxShock = Math.max(...ids.map((id) => Math.abs((after[id] ?? 0) - (before[id] ?? 0))));
    const rankedBefore = ids
      .filter((id) => preState.parties[id]?.active)
      .sort((a, b) => (before[b] ?? 0) - (before[a] ?? 0));
    const rankedAfter = ids
      .filter((id) => afterState.parties[id]?.active)
      .sort((a, b) => (after[b] ?? 0) - (after[a] ?? 0));
    rows.push({
      runKey,
      withdrawnPartyId: withdrawingPartyId,
      power,
      maxShockPoints: Number(maxShock.toFixed(3)),
      leaderBefore: rankedBefore[0] ?? "",
      leaderAfter: rankedAfter[0] ?? "",
      leaderFlipped: rankedBefore[0] !== rankedAfter[0],
      top2Before: rankedBefore.slice(0, 2).sort().join("+"),
      top2After: rankedAfter.slice(0, 2).sort().join("+"),
      top2Changed: rankedBefore.slice(0, 2).sort().join("+") !== rankedAfter.slice(0, 2).sort().join("+"),
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Part 4 — mass conservation (§13): direct, controlled calls to
// `redistributeElectorate` across a matrix of relation/alliance/endorsement
// configurations, checked at both the per-bloc and national level.
// ---------------------------------------------------------------------------

interface MassConservationRow {
  [key: string]: unknown;
  scenario: string;
  blocId: string;
  withdrawingPartyId: string;
  releasedShareBefore: number;
  undecidedBefore: number;
  undecidedAfter: number;
  undecidedDelta: number;
  predictedAbstentionProbability: number;
  predictedToUndecided: number;
  undecidedClampHit: boolean;
  sumLatentSupportAfter: number;
  anyNegative: boolean;
  anyNaN: boolean;
}

function buildProbeState(
  seed: string,
  withdrawingPartyId: string,
  overrides: {
    relationWithFirstRecipient?: number;
    ally?: boolean;
    endorseFirstRecipient?: boolean;
  },
): GameState {
  const method = gameContent.methods[0]!;
  const state: GameState = createGame(
    { seed, mode: "existing_party", partyId: PARTY_IDS[0]!, methodId: method.id },
    gameContent,
  );
  const otherIds = Object.keys(state.parties).filter((id) => id !== withdrawingPartyId);
  const firstRecipient = otherIds[0];
  if (overrides.relationWithFirstRecipient !== undefined && firstRecipient) {
    state.partyRelations[withdrawingPartyId] ??= {};
    state.partyRelations[withdrawingPartyId][firstRecipient] = overrides.relationWithFirstRecipient;
  }
  if (overrides.ally && firstRecipient) {
    state.parties[withdrawingPartyId]!.alliedWith.push(firstRecipient);
  }
  if (overrides.endorseFirstRecipient && firstRecipient) {
    state.flags[`endorsement:${withdrawingPartyId}`] = firstRecipient;
  }
  return state;
}

function checkMassConservation(): MassConservationRow[] {
  const rows: MassConservationRow[] = [];
  const scenarios: Array<{
    name: string;
    withdrawingPartyId: string;
    overrides: Parameters<typeof buildProbeState>[2];
  }> = [
    { name: "no_relation_no_alliance", withdrawingPartyId: "ecologistes", overrides: {} },
    { name: "strong_positive_relation", withdrawingPartyId: "ecologistes", overrides: { relationWithFirstRecipient: 90 } },
    { name: "strong_negative_relation", withdrawingPartyId: "ecologistes", overrides: { relationWithFirstRecipient: -90 } },
    { name: "already_allied", withdrawingPartyId: "ecologistes", overrides: { ally: true } },
    { name: "explicit_endorsement", withdrawingPartyId: "ecologistes", overrides: { endorseFirstRecipient: true } },
    { name: "allied_and_endorsed_and_positive_relation", withdrawingPartyId: "ecologistes", overrides: { ally: true, endorseFirstRecipient: true, relationWithFirstRecipient: 90 } },
    { name: "large_party_withdraws_reconquete", withdrawingPartyId: "reconquete", overrides: {} },
    { name: "large_party_withdraws_lr", withdrawingPartyId: "lr", overrides: {} },
  ];

  for (const scenario of scenarios) {
    const state = buildProbeState(`mass-conservation-${scenario.name}`, scenario.withdrawingPartyId, scenario.overrides);
    const undecidedBefore: Record<string, number> = {};
    const releasedShareBefore: Record<string, number> = {};
    for (const bloc of BLOCS) {
      undecidedBefore[bloc.id] = state.electorate.undecidedByBloc[bloc.id] ?? 0;
      releasedShareBefore[bloc.id] = state.electorate.latentSupport[bloc.id]?.[scenario.withdrawingPartyId] ?? 0;
    }
    const { state: after } = redistributeElectorate(state, BLOCS, scenario.withdrawingPartyId);

    const withdrawing = state.parties[scenario.withdrawingPartyId]!;
    const eligibleRecipients = Object.values(state.parties).filter(
      (p) => p.active && p.id !== scenario.withdrawingPartyId,
    );
    const averageDistance =
      eligibleRecipients.reduce(
        (sum, r) => sum + ideologyDistance(withdrawing.perceivedIdeology, r.perceivedIdeology),
        0,
      ) / eligibleRecipients.length;
    const predictedAbstentionProbability = clamp(0.14 + averageDistance / 500, 0.08, 0.42);

    for (const bloc of BLOCS) {
      const undecidedAfter = after.electorate.undecidedByBloc[bloc.id] ?? 0;
      const delta = undecidedAfter - undecidedBefore[bloc.id]!;
      const predictedToUndecided = releasedShareBefore[bloc.id]! * predictedAbstentionProbability;
      const clampHit =
        undecidedBefore[bloc.id]! + predictedToUndecided > 60 ||
        undecidedBefore[bloc.id]! + predictedToUndecided < 2;
      const afterSupports = after.electorate.latentSupport[bloc.id] ?? {};
      const values = Object.values(afterSupports);
      rows.push({
        scenario: scenario.name,
        blocId: bloc.id,
        withdrawingPartyId: scenario.withdrawingPartyId,
        releasedShareBefore: Number(releasedShareBefore[bloc.id]!.toFixed(3)),
        undecidedBefore: Number(undecidedBefore[bloc.id]!.toFixed(3)),
        undecidedAfter: Number(undecidedAfter.toFixed(3)),
        undecidedDelta: Number(delta.toFixed(3)),
        predictedAbstentionProbability: Number(predictedAbstentionProbability.toFixed(4)),
        predictedToUndecided: Number(predictedToUndecided.toFixed(3)),
        undecidedClampHit: clampHit,
        sumLatentSupportAfter: Number(values.reduce((s, v) => s + v, 0).toFixed(3)),
        anyNegative: values.some((v) => v < 0),
        anyNaN: values.some((v) => Number.isNaN(v)),
      });
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Part 5 — national endorsement gaps (§18-19, confirms known problem #4).
// ---------------------------------------------------------------------------

interface EndorsementGapRow {
  [key: string]: unknown;
  figureKind: string;
  count: number;
  ids: string;
}

function endorsementGaps(): EndorsementGapRow[] {
  const byKind = new Map<string, string[]>();
  for (const endorsement of gameContent.majorEndorsements ?? []) {
    const list = byKind.get(endorsement.figureKind) ?? [];
    list.push(endorsement.id);
    byKind.set(endorsement.figureKind, list);
  }
  const kinds = ["world_figure", "domestic_entity", "fictional_prestige_figure"];
  return kinds.map((kind) => ({
    figureKind: kind,
    count: byKind.get(kind)?.length ?? 0,
    ids: (byKind.get(kind) ?? []).join(";"),
  }));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const startedAt = Date.now();
  await mkdir(BASELINE_DIR, { recursive: true });

  console.log("[1/5] Running massive corpus for withdrawal classification…");
  const withdrawalRows: WithdrawalRow[] = [];
  const corpusRows: CorpusRow[] = [];
  for (const partyId of PARTY_IDS) {
    for (const agent of AGENT_NAMES) {
      for (let seedIndex = 0; seedIndex < CORPUS_SEEDS_PER_COMBO; seedIndex += 1) {
        const { withdrawals, corpus } = runCorpusCampaign(partyId, agent, seedIndex);
        withdrawalRows.push(...withdrawals);
        corpusRows.push(corpus);
      }
    }
  }
  await writeFile(resolve(BASELINE_DIR, "corpus-raw.csv"), toCsv(corpusRows), "utf8");
  await writeFile(resolve(OUT_DIR, "withdrawal-types.csv"), toCsv(withdrawalRows), "utf8");

  // strategic-withdrawals.csv — under the CURRENT engine there is no distinct
  // strategic-withdrawal code path, so this is the (expected-empty) baseline
  // artefact Bloc B's implementation will populate. We still derive a
  // best-effort proxy: withdrawals whose diagnostic viability was still
  // clearly positive (>0) at the moment they withdrew, i.e. cases that *look*
  // strategic from the outside despite firing through the collapse-only
  // trigger.
  const proxyStrategic = withdrawalRows.filter((r) => (r.viabilityAtWithdrawal as number) > 0);
  await writeFile(
    resolve(OUT_DIR, "strategic-withdrawals.csv"),
    toCsv(
      proxyStrategic,
      Object.keys(withdrawalRows[0] ?? { note: 1 }),
    ),
    "utf8",
  );

  console.log(`  → ${corpusRows.length} campaigns, ${withdrawalRows.length} withdrawals observed.`);

  console.log("[2/5] Tracing the largest shocks…");
  const sortedByShock = [...withdrawalRows].sort(
    (a, b) => (b.nationalShockPoints as number) - (a.nationalShockPoints as number),
  );
  const top = sortedByShock.slice(0, 8);
  const shockTraceRows: ShockTraceRow[] = [];
  const powerSensitivityRows: PowerSensitivityRow[] = [];
  for (const row of top) {
    // Re-simulate the exact same run up to (not including) the withdrawal decision to get the real preState.
    const seedPartyId = row.seedPartyId as string;
    const agent = row.agent as AgentName;
    const seedIndex = Number((row.runKey as string).split(":").pop());
    const seed = `blocA-${seedPartyId}-${agent}-${seedIndex}`;
    const method = gameContent.methods[seedIndex % gameContent.methods.length]!;
    let state: GameState = createGame(
      { seed, mode: "existing_party", partyId: seedPartyId, methodId: method.id },
      gameContent,
    );
    let guard = 0;
    while (state.decisionIndex < (row.decisionIndex as number) && guard < 90) {
      const event = currentEvent(state, gameContent.events);
      const choice = pickChoice(state, event, agent, seed);
      state = resolveCurrentChoice(state, choice.id, gameContent).state;
      guard += 1;
    }
    if (state.decisionIndex !== row.decisionIndex) continue; // drifted, skip rather than mislabel
    shockTraceRows.push(...traceShock(state, row.withdrawnPartyId as string, row.runKey as string, row.decisionIndex as number));
    powerSensitivityRows.push(...powerSensitivity(state, row.withdrawnPartyId as string, row.runKey as string));
  }
  await writeFile(resolve(OUT_DIR, "shock-traces.csv"), toCsv(shockTraceRows), "utf8");
  await writeFile(resolve(OUT_DIR, "shock-power-sensitivity.csv"), toCsv(powerSensitivityRows), "utf8");

  console.log("[3/5] Checking mass conservation…");
  const massRows = checkMassConservation();
  await writeFile(resolve(OUT_DIR, "mass-conservation.csv"), toCsv(massRows), "utf8");

  console.log("[4/5] Bloc fragmentation diagnostic snapshot…");
  const fragmentationRows: Array<Record<string, unknown>> = [];
  for (const partyId of PARTY_IDS) {
    const state = createGame(
      { seed: `fragmentation-${partyId}`, mode: "existing_party", partyId, methodId: gameContent.methods[0]!.id },
      gameContent,
    );
    const truth = nationalLatentSupport(state, BLOCS);
    for (const targetId of PARTY_IDS) {
      const viability = computeViabilityDiagnostic(state, targetId, truth);
      const fragmentation = computeFragmentationDiagnostic(state, targetId, truth);
      if (viability && fragmentation) {
        fragmentationRows.push({
          seedPartyId: partyId,
          targetPartyId: targetId,
          ...viability,
          ...fragmentation,
        });
      }
    }
  }
  await writeFile(resolve(OUT_DIR, "bloc-fragmentation.csv"), toCsv(fragmentationRows), "utf8");

  console.log("[5/5] National endorsement gaps…");
  await writeFile(resolve(OUT_DIR, "national-endorsement-gaps.csv"), toCsv(endorsementGaps()), "utf8");

  const ecologistesWithdrawals = withdrawalRows.filter((r) => r.withdrawnPartyId === "ecologistes").length;
  const withAtLeastOneWithdrawal = corpusRows.filter((r) => r.withdrawals > 0).length;
  const summary = {
    totalCampaigns: corpusRows.length,
    totalWithdrawals: withdrawalRows.length,
    campaignsWithAtLeastOneWithdrawal: withAtLeastOneWithdrawal,
    withdrawalFrequencyPercent: Number(((withAtLeastOneWithdrawal / corpusRows.length) * 100).toFixed(2)),
    ecologistesWithdrawals,
    ecologistesWithdrawalRatePercent: Number(((ecologistesWithdrawals / corpusRows.length) * 100).toFixed(3)),
    triggerLowPollingOnly: withdrawalRows.filter((r) => r.triggerLowPolling && !r.triggerLowLegitimacy).length,
    triggerLowLegitimacyOnly: withdrawalRows.filter((r) => !r.triggerLowPolling && r.triggerLowLegitimacy).length,
    triggerBoth: withdrawalRows.filter((r) => r.triggerLowPolling && r.triggerLowLegitimacy).length,
    triggerNeither: withdrawalRows.filter((r) => !r.triggerLowPolling && !r.triggerLowLegitimacy).length,
    withdrawalsWithPositiveViability: proxyStrategic.length,
    maxNationalShockPoints: sortedByShock[0]?.nationalShockPoints ?? 0,
    meanNationalShockPoints: Number(
      (withdrawalRows.reduce((s, r) => s + (r.nationalShockPoints as number), 0) / (withdrawalRows.length || 1)).toFixed(3),
    ),
    shocksOver5: withdrawalRows.filter((r) => (r.nationalShockPoints as number) > 5).length,
    shocksOver10: withdrawalRows.filter((r) => (r.nationalShockPoints as number) > 10).length,
    shocksOver20: withdrawalRows.filter((r) => (r.nationalShockPoints as number) > 20).length,
    shocksOver30: withdrawalRows.filter((r) => (r.nationalShockPoints as number) > 30).length,
    rankFlipsAmongWithdrawals: withdrawalRows.filter((r) => r.rankFlipped).length,
    durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)),
  };
  await writeFile(resolve(BASELINE_DIR, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

await main();
