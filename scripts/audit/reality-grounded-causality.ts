/**
 * PROMPT_CLAUDE_CODE_ANCRAGE_REEL_PSEUDO_REALITE_RECOMPOSITIONS.md §34 —
 * mesure T-1/événement/T+1 pour des retraits réellement survenus en jeu
 * (pas forcés), en lisant le sondage national juste avant et juste après.
 * Les valeurs viennent du moteur réel (`nationalLatentSupport`), jamais
 * d'un calcul a posteriori indépendant.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";
import { nationalLatentSupport } from "../../src/game/engine/electorate";
import type { GameState } from "../../src/game/types/index";
import { AGENT_NAMES, type AgentName, pickChoice } from "../audit-post/lib/agents";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/reality-grounding");
const TARGET_CASES = Math.max(1, Number.parseInt(process.env.CAUSALITY_CASES ?? "12", 10) || 12);

interface CausalityCase {
  withdrawnPartyId: string;
  decisionIndex: number;
  before: Record<string, number>;
  after: Record<string, number>;
  deltas: Record<string, number>;
}

function play(partyId: string, agent: AgentName, seed: string): CausalityCase[] {
  let state: GameState = createGame(
    { seed, mode: "existing_party", partyId, methodId: gameContent.methods[0]!.id },
    gameContent,
  );
  const cases: CausalityCase[] = [];
  let guard = 0;
  while (state.phase !== "finished" && guard < 90) {
    const event = currentEvent(state, gameContent.events);
    const choice = pickChoice(state, event, agent, seed);
    const before = nationalLatentSupport(state, gameContent.electorateBlocs);
    const actionsBefore = state.opponentActions.length;
    const next = resolveCurrentChoice(state, choice.id, gameContent).state;
    const newWithdrawals = next.opponentActions
      .slice(actionsBefore)
      .filter((action) => action.kind === "withdrawal");
    if (newWithdrawals.length > 0) {
      const after = nationalLatentSupport(next, gameContent.electorateBlocs);
      const deltas: Record<string, number> = {};
      for (const id of Object.keys(after)) {
        deltas[id] = Number(((after[id] ?? 0) - (before[id] ?? 0)).toFixed(2));
      }
      cases.push({
        withdrawnPartyId: newWithdrawals[0]!.partyId,
        decisionIndex: state.decisionIndex,
        before,
        after,
        deltas,
      });
    }
    state = next;
    guard += 1;
  }
  return cases;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const parties = gameContent.parties.filter((p) => p.isRealOrganization).map((p) => p.id);
  const found: CausalityCase[] = [];
  let attempt = 0;
  while (found.length < TARGET_CASES && attempt < 4000) {
    const partyId = parties[attempt % parties.length]!;
    const agent = AGENT_NAMES[Math.floor(attempt / parties.length) % AGENT_NAMES.length]!;
    const seed = `causality-${partyId}-${agent}-${attempt}`;
    attempt += 1;
    const cases = play(partyId, agent, seed);
    found.push(...cases);
  }

  const lines: string[] = [];
  for (const item of found.slice(0, TARGET_CASES)) {
    lines.push(`Retrait ${item.withdrawnPartyId} (décision ${item.decisionIndex}) :`);
    const sorted = Object.entries(item.deltas).sort((a, b) => b[1] - a[1]);
    for (const [id, delta] of sorted) {
      lines.push(`  ${id} ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`);
    }
    lines.push("");
  }
  const report = lines.join("\n");
  await writeFile(resolve(OUT_DIR, "causality-cases.txt"), report, "utf8");
  console.log(JSON.stringify({ attempts: attempt, casesFound: found.length }, null, 2));
  console.log(report);
}

await main();
