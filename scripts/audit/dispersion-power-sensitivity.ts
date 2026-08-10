/**
 * Calibration finale — BLOC A section 14. Teste la robustesse de
 * DISPERSION_POWER (1.6/1.8/2.0/2.2/2.4) sans modifier la production.
 *
 * DISPERSION_POWER n'agit que sur l'agrégation finale de
 * `nationalLatentSupport` (un exposant appliqué aux totaux pondérés par
 * bloc, avant renormalisation à 100) — il n'est jamais réinjecté dans la
 * mémoire EMA par bloc (`recalculateElectorate`), qui reste calculée à
 * partir de `partyAppeal` brut. Donc pour une même trajectoire de campagne
 * réelle (mêmes décisions, même bruit), les totaux pré-puissance à chaque
 * décision sont indépendants de la puissance choisie : on peut reconstruire
 * a posteriori le résultat du premier tour à plusieurs puissances à partir
 * d'un seul run réel, en réutilisant le même tirage de bruit électoral pour
 * une comparaison appariée honnête.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";
import { normalizePercentages } from "../../src/game/engine/math";
import { randomBetween } from "../../src/game/engine/rng";
import type { ElectorateBlocDefinition, GameState } from "../../src/game/types/index";
import { AGENT_NAMES, type AgentName, pickChoice } from "../audit-post/lib/agents";
import { toCsv } from "../audit-post/lib/csv";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/runoff-final-calibration");
const SEEDS_PER_COMBO = Math.max(
  1,
  Number.parseInt(process.env.DISPERSION_SEEDS_PER_COMBO ?? "80", 10) || 80,
);
const EXISTING_PARTIES = gameContent.parties.filter((p) => p.isRealOrganization);
const PARTY_IDS = EXISTING_PARTIES.map((p) => p.id);
const POWERS = [1.6, 1.8, 2.0, 2.2, 2.4];

function preAggregationTotals(
  state: GameState,
  blocs: ElectorateBlocDefinition[],
): Record<string, number> {
  const totals: Record<string, number> = Object.fromEntries(
    Object.keys(state.parties).map((partyId) => [partyId, 0]),
  );
  for (const bloc of blocs) {
    const turnout = (state.electorate.turnoutByBloc[bloc.id] ?? bloc.turnout) / 100;
    const undecided = (state.electorate.undecidedByBloc[bloc.id] ?? 0) / 100;
    const expressedWeight = bloc.weight * turnout * (1 - undecided);
    const supports = state.electorate.latentSupport[bloc.id];
    for (const partyId of Object.keys(totals)) {
      // Utilise party.active (jamais désactivé par simulateFirstRound) plutôt
      // que isElectorallyActive : on veut reconstituer l'état PRE-élection —
      // au moment réel où le premier tour se joue, aucun parti n'est encore
      // éliminé. Voir le correctif isElectorallyActive lui-même
      // (ELECTORAL_COHERENCE_FIXES_REPORT.md §10) pour l'historique de ce
      // flag.
      if (!state.parties[partyId]?.active) continue;
      totals[partyId] = (totals[partyId] ?? 0) + ((supports?.[partyId] ?? 0) / 100) * expressedWeight;
    }
  }
  return totals;
}

function latentAtPower(totals: Record<string, number>, power: number): Record<string, number> {
  const amplified = Object.fromEntries(
    Object.entries(totals).map(([id, v]) => [id, v > 0 ? v ** power : 0]),
  );
  return normalizePercentages(amplified, 3);
}

interface Row {
  [key: string]: unknown;
  runKey: string;
  partyId: string;
  agent: AgentName;
  checkpoint: "initial" | "r1_result";
}

function runOne(partyId: string, agent: AgentName, seedIndex: number): Row[] | undefined {
  const seed = `dispersion-power-${partyId}-${agent}-${seedIndex}`;
  const method = gameContent.methods[seedIndex % gameContent.methods.length]!;
  let state = createGame({ seed, mode: "existing_party", partyId, methodId: method.id }, gameContent);
  const runKey = `${partyId}:${agent}:${seedIndex}`;
  const rows: Row[] = [];

  // Checkpoint initial (décision 0).
  const initialTotals = preAggregationTotals(state, gameContent.electorateBlocs);
  const initialRow: Row = { runKey, partyId, agent, checkpoint: "initial" };
  for (const power of POWERS) {
    const latent = latentAtPower(initialTotals, power);
    for (const id of PARTY_IDS) initialRow[`p${power}_${id}`] = Number((latent[id] ?? 0).toFixed(2));
  }
  rows.push(initialRow);

  let guard = 0;
  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, gameContent.events);
    const choice = pickChoice(state, event, agent, seed);
    const resolution = resolveCurrentChoice(state, choice.id, gameContent);
    state = resolution.state;
    guard += 1;
    if (state.firstRoundResult) break;
  }
  if (!state.firstRoundResult) return undefined;

  // Reconstruction du résultat de premier tour à chaque puissance, avec le
  // MÊME tirage de bruit par parti pour une comparaison appariée.
  const totals = preAggregationTotals(state, gameContent.electorateBlocs);
  let rng = state.rng;
  const noiseByParty: Record<string, number> = {};
  for (const id of Object.keys(state.parties)) {
    let noise: number;
    [noise, rng] = randomBetween(rng, -3.2, 3.2);
    noiseByParty[id] = noise;
  }

  const r1Row: Row = { runKey, partyId, agent, checkpoint: "r1_result" };
  for (const power of POWERS) {
    const latent = latentAtPower(totals, power);
    const raw: Record<string, number> = {};
    for (const party of Object.values(state.parties)) {
      if (!party.active) continue;
      // Ne pas exclure "eliminated" ici : au moment réel où le premier tour
      // a été tranché, ce statut n'existait pas encore pour les perdants —
      // il vient d'être posé PAR ce même tirage qu'on reconstruit. Seuls
      // withdrawn/disqualified (retraits explicites avant l'élection) sont
      // légitimement à exclure.
      const actor = state.actors[party.candidateId];
      if (actor && ["withdrawn", "disqualified"].includes(actor.candidateStatus)) continue;
      const mobilizationFactor = 0.9 + party.stats.mobilization / 500;
      raw[party.id] = Math.max(0.01, (latent[party.id] ?? 0) * mobilizationFactor + noiseByParty[party.id]!);
    }
    const results = normalizePercentages(raw, 1);
    for (const id of PARTY_IDS) r1Row[`p${power}_${id}`] = Number((results[id] ?? 0).toFixed(2));
  }
  rows.push(r1Row);

  return rows;
}

async function main() {
  const startedAt = Date.now();
  await mkdir(OUT_DIR, { recursive: true });
  const rows: Row[] = [];
  let attempted = 0;

  for (const partyId of PARTY_IDS) {
    for (const agent of AGENT_NAMES) {
      for (let seedIndex = 0; seedIndex < SEEDS_PER_COMBO; seedIndex += 1) {
        attempted += 1;
        const result = runOne(partyId, agent, seedIndex);
        if (result) rows.push(...result);
      }
    }
  }

  await writeFile(
    resolve(OUT_DIR, "dispersion-power-sensitivity-raw.csv"),
    toCsv(rows as unknown as Record<string, unknown>[]),
    "utf8",
  );

  // Agrégat : écart-type, leader moyen, % favori dominant par puissance et checkpoint.
  const summary: Record<string, unknown>[] = [];
  for (const checkpoint of ["initial", "r1_result"] as const) {
    const checkpointRows = rows.filter((r) => r.checkpoint === checkpoint);
    for (const power of POWERS) {
      const leaderScores: number[] = [];
      const secondScores: number[] = [];
      const allScores: number[] = [];
      let dominantCount = 0;
      for (const row of checkpointRows) {
        const scores = PARTY_IDS.map((id) => Number(row[`p${power}_${id}`] ?? 0)).sort((a, b) => b - a);
        leaderScores.push(scores[0]!);
        secondScores.push(scores[1]!);
        allScores.push(...scores);
        if (scores[0]! > 22 && scores[0]! - scores[1]! > 5) dominantCount += 1;
      }
      const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
      const m = mean(allScores);
      const sd = Math.sqrt(allScores.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, allScores.length));
      summary.push({
        checkpoint,
        power,
        runs: checkpointRows.length,
        meanLeaderScore: Number(mean(leaderScores).toFixed(2)),
        stdDev: Number(sd.toFixed(2)),
        dominantFavoritePercent: Number(((dominantCount / Math.max(1, checkpointRows.length)) * 100).toFixed(1)),
        compressed7to16Percent: Number(
          (
            (checkpointRows.filter((row) => {
              const scores = PARTY_IDS.map((id) => Number(row[`p${power}_${id}`] ?? 0));
              return scores.filter((s) => s >= 7 && s <= 16).length >= 8;
            }).length /
              Math.max(1, checkpointRows.length)) *
            100
          ).toFixed(1),
        ),
      });
    }
  }
  await writeFile(
    resolve(OUT_DIR, "dispersion-power-sensitivity.csv"),
    toCsv(summary),
    "utf8",
  );

  console.log(JSON.stringify({ attempted, rows: rows.length, summary, durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)) }, null, 2));
}

await main();
