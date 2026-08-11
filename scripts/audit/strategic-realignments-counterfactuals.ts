/**
 * PROMPT_CLAUDE_CODE_RECOMPOSITIONS_STRATEGIQUES_SOUTIENS_CHOCS.md — BLOC B,
 * §39 : au moins 500 paires de contrefactuels pour chacun des trois axes
 * (A. désistement stratégique vs maintien ; B. accord PS vs LFI quand les
 * deux sont plausibles ; C. endorsement national présent vs absent).
 *
 * Méthodologie : capturer un état juste avant la décision, produire deux
 * variantes de cet état (mutation minimale, jamais un rejouage aléatoire
 * différent), puis continuer les DEUX branches avec exactement la même
 * politique d'agent à partir de ce point — les divergences observées en fin
 * de partie sont donc entièrement attribuables à la mutation initiale, pas
 * au hasard d'un nouveau tirage de graine.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";
import { nationalLatentSupport } from "../../src/game/engine/electorate";
import { redistributeElectorate } from "../../src/game/engine/redistribution";
import { normalizePercentages } from "../../src/game/engine/math";
import type { GameState } from "../../src/game/types/index";
import { AGENT_NAMES, type AgentName, pickChoice } from "../audit-post/lib/agents";
import { toCsv } from "../audit-post/lib/csv";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/strategic-realignments/counterfactuals");
const BLOCS = gameContent.electorateBlocs;
const TARGET_PAIRS = Math.max(1, Number.parseInt(process.env.CF_TARGET_PAIRS ?? "500", 10) || 500);

interface FinalMetrics {
  playerFinalScore: number;
  qualified: boolean;
  won: boolean;
  finalistIds: string;
  targetPartyFirstRoundShare: number;
}

function finishFrom(
  state: GameState,
  agent: AgentName,
  seed: string,
  targetPartyId: string,
): FinalMetrics {
  let s = state;
  let guard = 0;
  while (s.phase !== "finished" && guard < 90) {
    const event = currentEvent(s, gameContent.events);
    const choice = pickChoice(s, event, agent, seed);
    s = resolveCurrentChoice(s, choice.id, gameContent).state;
    guard += 1;
  }
  const finalists: string[] = s.qualifiedPartyIds ? [...s.qualifiedPartyIds] : [];
  return {
    playerFinalScore: s.finalResult?.score ?? 0,
    qualified: finalists.includes(s.playerPartyId),
    won: s.finalResult?.won ?? false,
    finalistIds: [...finalists].sort().join("+"),
    targetPartyFirstRoundShare: s.firstRoundResult?.results[targetPartyId] ?? 0,
  };
}

/**
 * Même règle de choix de palier que `resolveStrategicNegotiation`
 * (opponentSimulation.ts, non exportée) : coalition_agreement si déjà
 * allié ou relation ≥60, sinon explicit_support. Reproduite ici pour que
 * les contrefactuels reflètent fidèlement la logique réelle plutôt qu'un
 * palier fixé arbitrairement (un palier fixe masquerait la sensibilité à
 * la relation que le moteur porte réellement).
 */
function applyStrategicWithdrawal(
  sourceState: GameState,
  withdrawingPartyId: string,
  partnerId: string,
): GameState {
  const state = structuredClone(sourceState);
  const party = state.parties[withdrawingPartyId];
  const partner = state.parties[partnerId];
  if (!party || !partner) return state;
  const relation = state.partyRelations[withdrawingPartyId]?.[partnerId] ?? 0;
  const strength =
    party.alliedWith.includes(partnerId) || relation >= 60 ? "coalition_agreement" : "explicit_support";
  const actor = state.actors[party.candidateId];
  if (actor) {
    actor.candidateStatus = "withdrawn";
    actor.active = false;
    actor.partyId = partnerId;
    actor.role = "ally";
  }
  party.active = false;
  state.flags[`rallying:${withdrawingPartyId}`] = partnerId;
  const { state: redistributed } = redistributeElectorate(state, BLOCS, withdrawingPartyId, {
    partnerId,
    strength,
  });
  return redistributed;
}

function forceUniformSupport(state: GameState, partyId: string, value: number): void {
  for (const bloc of BLOCS) {
    const support = state.electorate.latentSupport[bloc.id];
    if (!support) continue;
    support[partyId] = value;
    state.electorate.latentSupport[bloc.id] = normalizePercentages(support, 3);
  }
  const truth = nationalLatentSupport(state, BLOCS);
  state.parties[partyId]!.stats.polling = truth[partyId] ?? 0;
}

// ---------------------------------------------------------------------------
// A — désistement stratégique vs maintien
// ---------------------------------------------------------------------------

interface WithdrawVsMaintainRow {
  [key: string]: unknown;
  pairId: string;
  withdrawnPartyId: string;
  partnerId: string;
  withdrawScore: number;
  maintainScore: number;
  scoreDelta: number;
  withdrawQualified: boolean;
  maintainQualified: boolean;
  qualificationChanged: boolean;
  withdrawWon: boolean;
  maintainWon: boolean;
  victoryChanged: boolean;
  finalistsChanged: boolean;
}

function runWithdrawVsMaintainPairs(): WithdrawVsMaintainRow[] {
  const rows: WithdrawVsMaintainRow[] = [];
  const playerPartyIds = gameContent.parties.filter((p) => p.isRealOrganization).map((p) => p.id);
  let attempt = 0;
  while (rows.length < TARGET_PAIRS && attempt < TARGET_PAIRS * 40) {
    const playerPartyId = playerPartyIds[attempt % playerPartyIds.length]!;
    const agent = AGENT_NAMES[Math.floor(attempt / playerPartyIds.length) % AGENT_NAMES.length]!;
    const seed = `cfA-${playerPartyId}-${agent}-${attempt}`;
    attempt += 1;
    const method = gameContent.methods[attempt % gameContent.methods.length]!;
    let state: GameState = createGame(
      { seed, mode: "existing_party", partyId: playerPartyId, methodId: method.id },
      gameContent,
    );
    let guard = 0;
    let found: { preState: GameState; partyId: string; partnerId: string } | undefined;
    while (state.phase !== "finished" && guard < 90 && !found) {
      const event = currentEvent(state, gameContent.events);
      const choice = pickChoice(state, event, agent, seed);
      const preState = state;
      const next = resolveCurrentChoice(preState, choice.id, gameContent).state;
      // Voir strategic-realignments-blocB.ts : `opponentActions` est
      // plafonné à 80 entrées, un diff par longueur sous-compte les actions
      // tardives. Filtrer sur `decisionIndex` (apposé à l'appel) est robuste
      // à la troncature.
      const opened = next.opponentActions
        .filter((a) => a.decisionIndex === next.decisionIndex)
        .find((a) => a.kind === "negotiation_opened");
      if (opened) {
        const partnerId = next.flags[`negotiation:${opened.partyId}`];
        if (typeof partnerId === "string") {
          found = { preState, partyId: opened.partyId, partnerId };
        }
      }
      state = next;
      guard += 1;
    }
    if (!found) continue;

    const withdrawBranch = applyStrategicWithdrawal(found.preState, found.partyId, found.partnerId);
    const maintainBranch = structuredClone(found.preState);

    const withdrawResult = finishFrom(withdrawBranch, agent, `${seed}-withdraw`, found.partnerId);
    const maintainResult = finishFrom(maintainBranch, agent, `${seed}-maintain`, found.partnerId);

    rows.push({
      pairId: seed,
      withdrawnPartyId: found.partyId,
      partnerId: found.partnerId,
      withdrawScore: Number(withdrawResult.playerFinalScore.toFixed(2)),
      maintainScore: Number(maintainResult.playerFinalScore.toFixed(2)),
      scoreDelta: Number((withdrawResult.playerFinalScore - maintainResult.playerFinalScore).toFixed(2)),
      withdrawQualified: withdrawResult.qualified,
      maintainQualified: maintainResult.qualified,
      qualificationChanged: withdrawResult.qualified !== maintainResult.qualified,
      withdrawWon: withdrawResult.won,
      maintainWon: maintainResult.won,
      victoryChanged: withdrawResult.won !== maintainResult.won,
      finalistsChanged: withdrawResult.finalistIds !== maintainResult.finalistIds,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// B — accord PS vs LFI (Écologistes, construit pour que les deux soient
// plausibles : score forcé comparable, faible)
// ---------------------------------------------------------------------------

interface PsVsLfiRow {
  [key: string]: unknown;
  pairId: string;
  relationLfi: number;
  psFinalistScore: number;
  lfiFinalistScore: number;
  psFinalistsSet: string;
  lfiFinalistsSet: string;
  reportDeltaVsNeutralRelation: number;
}

/**
 * Mesure la vérité nationale immédiatement après le retrait (pas un
 * déroulé complet de campagne) : un déroulé complet dilue la consigne
 * jusqu'à l'insignifiance avant le premier tour, puisque
 * `recalculateElectorate` mélange 62 % de l'ancienne part / 38 % d'un
 * nouvel appel calculé sur les statistiques à *chaque* décision restante —
 * (0,62)^24 ≈ 6×10⁻⁶ après une campagne entière, ce qui efface l'effet d'un
 * ajustement ponctuel bien avant le premier tour. La question posée par le
 * prompt de mission (§39.B) porte sur le report lui-même, pas sur son
 * empreinte après vingt tours de dynamiques sans rapport.
 */
function runPsVsLfiPairs(): PsVsLfiRow[] {
  const rows: PsVsLfiRow[] = [];
  const relations = [-70, 0, 70];
  let index = 0;
  while (rows.length < TARGET_PAIRS) {
    for (const relation of relations) {
      if (rows.length >= TARGET_PAIRS) break;
      const seed = `cfB-ecologistes-${index}`;
      const method = gameContent.methods[index % gameContent.methods.length]!;
      const state: GameState = createGame(
        { seed, mode: "existing_party", partyId: "rn", methodId: method.id },
        gameContent,
      );
      forceUniformSupport(state, "ecologistes", 5);
      forceUniformSupport(state, "ps", 13);
      forceUniformSupport(state, "lfi", 13);
      state.partyRelations.ecologistes ??= {};
      state.partyRelations.ecologistes!.lfi = relation;

      const psBranch = applyStrategicWithdrawal(state, "ecologistes", "ps");
      const lfiBranch = applyStrategicWithdrawal(state, "ecologistes", "lfi");
      const psTruth = nationalLatentSupport(psBranch, BLOCS);
      const lfiTruth = nationalLatentSupport(lfiBranch, BLOCS);

      rows.push({
        pairId: seed,
        relationLfi: relation,
        psFinalistScore: Number((psTruth.ps ?? 0).toFixed(3)),
        lfiFinalistScore: Number((lfiTruth.lfi ?? 0).toFixed(3)),
        psFinalistsSet: "",
        lfiFinalistsSet: "",
        reportDeltaVsNeutralRelation: 0,
      });
      index += 1;
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// C — endorsement national présent vs absent
// ---------------------------------------------------------------------------

interface EndorsementPairRow {
  [key: string]: unknown;
  pairId: string;
  endorsementId: string;
  acceptScore: number;
  declineScore: number;
  scoreDelta: number;
  acceptQualified: boolean;
  declineQualified: boolean;
  qualificationChanged: boolean;
}

function runEndorsementPairs(): EndorsementPairRow[] {
  const rows: EndorsementPairRow[] = [];
  const nationalEndorsements = (gameContent.majorEndorsements ?? []).filter(
    (e) => e.figureKind !== "world_figure",
  );
  let attempt = 0;
  while (rows.length < TARGET_PAIRS && attempt < TARGET_PAIRS * 30) {
    const endorsement = nationalEndorsements[attempt % nationalEndorsements.length]!;
    const partyId = endorsement.eligiblePartyIds[attempt % endorsement.eligiblePartyIds.length]!;
    const agent = AGENT_NAMES[attempt % AGENT_NAMES.length]!;
    const seed = `cfC-${endorsement.id}-${attempt}`;
    attempt += 1;
    const method = gameContent.methods[attempt % gameContent.methods.length]!;
    let state: GameState = createGame(
      { seed, mode: "existing_party", partyId, methodId: method.id },
      gameContent,
    );
    let guard = 0;
    let found: { preState: GameState; acceptId: string; declineId: string } | undefined;
    while (state.phase !== "finished" && guard < 90 && !found) {
      const event = currentEvent(state, gameContent.events);
      if (event.id === endorsement.id && event.choices.length === 2) {
        const acceptChoice = event.choices.find((c) => c.id.endsWith("_accept"));
        const declineChoice = event.choices.find((c) => c.id.endsWith("_decline"));
        if (acceptChoice && declineChoice) {
          found = { preState: state, acceptId: acceptChoice.id, declineId: declineChoice.id };
          break;
        }
      }
      const choice = pickChoice(state, event, agent, seed);
      state = resolveCurrentChoice(state, choice.id, gameContent).state;
      guard += 1;
    }
    if (!found) continue;

    const acceptBranch = resolveCurrentChoice(found.preState, found.acceptId, gameContent).state;
    const declineBranch = resolveCurrentChoice(found.preState, found.declineId, gameContent).state;
    const acceptResult = finishFrom(acceptBranch, agent, `${seed}-accept`, partyId);
    const declineResult = finishFrom(declineBranch, agent, `${seed}-decline`, partyId);

    rows.push({
      pairId: seed,
      endorsementId: endorsement.id,
      acceptScore: Number(acceptResult.playerFinalScore.toFixed(2)),
      declineScore: Number(declineResult.playerFinalScore.toFixed(2)),
      scoreDelta: Number((acceptResult.playerFinalScore - declineResult.playerFinalScore).toFixed(2)),
      acceptQualified: acceptResult.qualified,
      declineQualified: declineResult.qualified,
      qualificationChanged: acceptResult.qualified !== declineResult.qualified,
    });
  }
  return rows;
}

async function main() {
  const startedAt = Date.now();
  await mkdir(OUT_DIR, { recursive: true });
  const only = process.env.CF_ONLY; // "A" | "B" | "C" | undefined (all)

  console.log("[A] désistement stratégique vs maintien…");
  const aRows = only && only !== "A" ? [] : runWithdrawVsMaintainPairs();
  if (!only || only === "A")
    await writeFile(resolve(OUT_DIR, "A-withdraw-vs-maintain.csv"), toCsv(aRows), "utf8");

  console.log("[B] accord PS vs LFI…");
  const bRows = only && only !== "B" ? [] : runPsVsLfiPairs();
  if (!only || only === "B")
    await writeFile(resolve(OUT_DIR, "B-ps-vs-lfi.csv"), toCsv(bRows), "utf8");

  console.log("[C] endorsement national présent vs absent…");
  const cRows = only && only !== "C" ? [] : runEndorsementPairs();
  if (!only || only === "C")
    await writeFile(resolve(OUT_DIR, "C-endorsement-present-vs-absent.csv"), toCsv(cRows), "utf8");

  const summary = {
    A_pairs: aRows.length,
    A_meanAbsScoreDelta: aRows.length
      ? Number(
          (aRows.reduce((s, r) => s + Math.abs(r.scoreDelta as number), 0) / aRows.length).toFixed(3),
        )
      : 0,
    A_qualificationChangedPercent: aRows.length
      ? Number(
          ((aRows.filter((r) => r.qualificationChanged).length / aRows.length) * 100).toFixed(1),
        )
      : 0,
    A_victoryChangedPercent: aRows.length
      ? Number(((aRows.filter((r) => r.victoryChanged).length / aRows.length) * 100).toFixed(1))
      : 0,
    B_pairs: bRows.length,
    B_psWinsShareOfPairs: bRows.length
      ? Number(
          (
            (bRows.filter((r) => (r.psFinalistScore as number) > (r.lfiFinalistScore as number))
              .length /
              bRows.length) *
            100
          ).toFixed(1),
        )
      : 0,
    B_meanPsScoreAtRelationPositive: (() => {
      const positive = bRows.filter((r) => r.relationLfi === 70);
      return positive.length
        ? Number(
            (positive.reduce((s, r) => s + (r.lfiFinalistScore as number), 0) / positive.length).toFixed(2),
          )
        : 0;
    })(),
    B_meanLfiScoreAtRelationNegative: (() => {
      const negative = bRows.filter((r) => r.relationLfi === -70);
      return negative.length
        ? Number(
            (negative.reduce((s, r) => s + (r.lfiFinalistScore as number), 0) / negative.length).toFixed(2),
          )
        : 0;
    })(),
    C_pairs: cRows.length,
    C_meanAbsScoreDelta: cRows.length
      ? Number(
          (cRows.reduce((s, r) => s + Math.abs(r.scoreDelta as number), 0) / cRows.length).toFixed(3),
        )
      : 0,
    C_qualificationChangedPercent: cRows.length
      ? Number(
          ((cRows.filter((r) => r.qualificationChanged).length / cRows.length) * 100).toFixed(1),
        )
      : 0,
    durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)),
  };
  if (!only)
    await writeFile(resolve(OUT_DIR, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

await main();
