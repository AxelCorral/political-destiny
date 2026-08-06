/**
 * Post-corrections audit — counterfactual branching (section 10, strict form).
 *
 * For a sample of (party, seed) campaigns, plays forward to a fixed
 * checkpoint decision, then — from that *exact same* GameState — resolves
 * EVERY available choice of the checkpoint event separately, continuing each
 * branch forward with the same agent. This isolates the causal effect of a
 * single decision, holding everything else (state, seed, subsequent agent
 * policy) constant, which a simple "different independent runs" comparison
 * cannot do.
 *
 * Measures divergence: immediately, +3 decisions ("court terme"), +8
 * decisions ("moyen terme"), and at campaign end (qualification, victory,
 * final score).
 *
 * Output: audit-results/counterfactuals.csv
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import { createGame, currentEvent, resolveCurrentChoice } from "../../src/game/engine/index";
import type { GameState } from "../../src/game/types/index";
import { type AgentName, pickChoice } from "./lib/agents";
import { toCsv } from "./lib/csv";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results");

const CHECKPOINT_DECISION = Number.parseInt(process.env.AUDIT_BRANCH_CHECKPOINT ?? "5", 10);
const SAMPLES_PER_PARTY = Math.max(
  1,
  Number.parseInt(process.env.AUDIT_BRANCH_SAMPLES_PER_PARTY ?? "6", 10),
);
const AGENTS_TO_BRANCH: AgentName[] = ["aleatoire", "ideologiquement_coherent"];

interface BranchRow {
  partyId: string;
  seedIndex: number;
  seed: string;
  followUpAgent: AgentName;
  checkpointEventId: string;
  checkpointDecisionIndex: number;
  choiceId: string;
  choiceLabel: string;
  choiceTag: string;
  scoreAtCheckpointPlus0: number;
  scoreAtCheckpointPlus3: number | null;
  scoreAtCheckpointPlus8: number | null;
  finalFirstRoundScore: number;
  finalQualified: boolean;
  finalWon: boolean;
  finalScore: number;
  finalEndingId: string;
  ideologyMovementSinceBranch: number;
}

function pollingOf(state: GameState, partyId: string): number {
  return state.parties[partyId]?.stats.polling ?? 0;
}

function ideologyDistanceSum(a: GameState, b: GameState, partyId: string): number {
  const axes = ["economy", "society", "europe", "ecology", "authority", "immigration"] as const;
  const idA = a.parties[partyId]?.ideology;
  const idB = b.parties[partyId]?.ideology;
  if (!idA || !idB) return 0;
  return axes.reduce((sum, axis) => sum + Math.abs(idA[axis] - idB[axis]), 0);
}

function advance(state: GameState, agent: AgentName, seed: string, steps: number): GameState {
  let current = state;
  for (let i = 0; i < steps && current.phase !== "finished"; i += 1) {
    const event = currentEvent(current, gameContent.events);
    const choice = pickChoice(current, event, agent, seed);
    current = resolveCurrentChoice(current, choice.id, gameContent).state;
  }
  return current;
}

function playToEnd(state: GameState, agent: AgentName, seed: string): GameState {
  let current = state;
  let guard = 0;
  while (current.phase !== "finished" && guard < 80) {
    const event = currentEvent(current, gameContent.events);
    const choice = pickChoice(current, event, agent, seed);
    current = resolveCurrentChoice(current, choice.id, gameContent).state;
    guard += 1;
  }
  return current;
}

const rows: BranchRow[] = [];
const errors: Array<{ partyId: string; seedIndex: number; message: string }> = [];

for (const party of gameContent.parties) {
  for (let sample = 0; sample < SAMPLES_PER_PARTY; sample += 1) {
    const seedIndex = sample;
    const seed = `branch-${seedIndex}`;
    try {
      const method = gameContent.methods[seedIndex % gameContent.methods.length]!;
      let checkpointState = createGame(
        { seed, mode: "existing_party", partyId: party.id, methodId: method.id },
        gameContent,
      );
      // Advance with a neutral agent up to (but not resolving) the checkpoint event.
      while (
        checkpointState.decisionIndex < CHECKPOINT_DECISION &&
        checkpointState.phase !== "finished"
      ) {
        const event = currentEvent(checkpointState, gameContent.events);
        const choice = pickChoice(checkpointState, event, "aleatoire", seed);
        checkpointState = resolveCurrentChoice(checkpointState, choice.id, gameContent).state;
      }
      if (checkpointState.phase === "finished") continue;
      const checkpointEvent = currentEvent(checkpointState, gameContent.events);
      if (checkpointEvent.choices.length < 2) continue;

      for (const followUpAgent of AGENTS_TO_BRANCH) {
        for (const choice of checkpointEvent.choices) {
          const branchSeed = `${seed}-branch-${choice.id}`;
          const afterChoice = resolveCurrentChoice(checkpointState, choice.id, gameContent).state;
          const scorePlus0 = pollingOf(afterChoice, party.id);
          const plus3 =
            afterChoice.phase === "finished"
              ? afterChoice
              : advance(afterChoice, followUpAgent, branchSeed, 3);
          const scorePlus3 = plus3.phase === "finished" ? null : pollingOf(plus3, party.id);
          const plus8 =
            plus3.phase === "finished" ? plus3 : advance(plus3, followUpAgent, branchSeed, 5);
          const scorePlus8 = plus8.phase === "finished" ? null : pollingOf(plus8, party.id);
          const final =
            plus8.phase === "finished" ? plus8 : playToEnd(plus8, followUpAgent, branchSeed);
          if (!final.finalResult || !final.firstRoundResult) {
            throw new Error(`Branche inachevée: ${party.id}/${seedIndex}/${choice.id}`);
          }

          rows.push({
            partyId: party.id,
            seedIndex,
            seed,
            followUpAgent,
            checkpointEventId: checkpointEvent.id,
            checkpointDecisionIndex: checkpointState.decisionIndex,
            choiceId: choice.id,
            choiceLabel: choice.label,
            choiceTag: choice.visibleTag ?? "",
            scoreAtCheckpointPlus0: Number(scorePlus0.toFixed(2)),
            scoreAtCheckpointPlus3: scorePlus3 === null ? null : Number(scorePlus3.toFixed(2)),
            scoreAtCheckpointPlus8: scorePlus8 === null ? null : Number(scorePlus8.toFixed(2)),
            finalFirstRoundScore: Number(
              (final.firstRoundResult.results[party.id] ?? 0).toFixed(2),
            ),
            finalQualified: final.finalResult.qualified,
            finalWon: final.finalResult.won,
            finalScore: final.finalResult.score,
            finalEndingId: final.finalResult.endingId,
            ideologyMovementSinceBranch: Number(
              ideologyDistanceSum(checkpointState, final, party.id).toFixed(2),
            ),
          });
        }
      }
    } catch (error) {
      errors.push({
        partyId: party.id,
        seedIndex,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  console.log(`branch-experiment.ts: ${party.id} terminé (${rows.length} branches cumulées).`);
}

await mkdir(OUT_DIR, { recursive: true });
await writeFile(
  resolve(OUT_DIR, "counterfactuals.csv"),
  toCsv(rows as unknown as Record<string, unknown>[]),
  "utf8",
);

console.log(
  JSON.stringify(
    {
      totalBranches: rows.length,
      distinctCheckpoints: new Set(rows.map((r) => `${r.partyId}:${r.seedIndex}`)).size,
      errors: errors.length,
    },
    null,
    2,
  ),
);
if (errors.length) {
  console.log("Erreurs:", JSON.stringify(errors.slice(0, 10), null, 2));
}
