/**
 * A/B experiments on the real engine, in a temporary harness only
 * (PROMPT_CLAUDE_CODE_AUDIT_FUN_REJOUABILITE.md, sections 7 and 26).
 *
 * For a stratified sample of (party, profile, seed) triples, this script
 * runs the identical seed/party/profile combination through six content
 * configurations: the unmodified catalogue (A, baseline) and five pruned
 * clones built by scripts/fun-audit/lib/content-variants.ts (B1: no
 * world/scandal categories, B2: no rare/legendary/secret events, C: no
 * actor-memory effects, E: no statements/ideology movement, F: no delayed
 * effects). See content-variants.ts for why a sixth requested variant
 * ("sans actions adverses autonomes") is not implemented.
 *
 * Same engine, same seed, same party, same profile in every column — only
 * the content array differs. Output: audit-results/fun-audit/ab-experiment.csv,
 * one row per (party, profile, seed, variant).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import {
  createGame,
  currentEvent,
  resolveCurrentChoice,
  validateGameState,
} from "../../src/game/engine/index";
import type { GameContent, GameState } from "../../src/game/types/index";
import { toCsv } from "../audit-post/lib/csv";
import {
  buildVariantNoDelayedConsequences,
  buildVariantNoIdeologyEffects,
  buildVariantNoNarrativeMemory,
  buildVariantNoOpportunisticRandomness,
  buildVariantNoRareEvents,
} from "./lib/content-variants";
import { pickForProfile, type ProfileName } from "./lib/profiles";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/fun-audit");
const SEEDS = Math.max(3, Math.min(30, Number.parseInt(process.env.FUN_AB_SEEDS ?? "8", 10) || 8));
const PROFILES: ProfileName[] = ["strategist", "cautious", "beginner"];
const EXISTING_PARTIES = gameContent.parties.filter((p) => p.isRealOrganization);

const VARIANTS: Record<string, (c: GameContent) => GameContent> = {
  A_baseline: (c) => c,
  B1_no_opportunistic_randomness: buildVariantNoOpportunisticRandomness,
  B2_no_rare_events: buildVariantNoRareEvents,
  C_no_narrative_memory: buildVariantNoNarrativeMemory,
  E_no_ideology_effects: buildVariantNoIdeologyEffects,
  F_no_delayed_consequences: buildVariantNoDelayedConsequences,
};

interface Row {
  variant: string;
  partyId: string;
  profile: ProfileName;
  seedIndex: number;
  decisions: number;
  finalScore: number;
  qualified: boolean;
  won: boolean;
  firstRoundScore: number;
  eventIdSetSize: number;
  eventIdSetHash: string;
  rankVolatility: number;
  pollStdev: number;
  rareOrChainOrConflictMoments: number;
  ideologyMoveTotal: number;
  actorMemoryEntries: number;
}

function playerRank(state: GameState, partyId: string): number {
  const own = state.parties[partyId]?.stats.polling ?? 0;
  const higher = Object.values(state.parties).filter(
    (p) => p.active && p.id !== partyId && p.stats.polling > own,
  ).length;
  return higher + 1;
}

function hashEventSet(ids: string[]): string {
  const sorted = [...ids].sort();
  let h = 0;
  for (const id of sorted)
    for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

function runVariant(
  content: GameContent,
  partyId: string,
  profile: ProfileName,
  seedIndex: number,
  variant: string,
): Row | undefined {
  const seed = `fun-audit-ab-${variant}-${seedIndex}`;
  const method = content.methods[seedIndex % content.methods.length]!;
  let state = createGame({ seed, mode: "existing_party", partyId, methodId: method.id }, content);
  const startIdeology = { ...state.parties[partyId]!.ideology };
  const eventIds: string[] = [];
  const pollSeries: number[] = [state.parties[partyId]?.stats.polling ?? 0];
  let rankChanges = 0;
  let momentCount = 0;
  let guard = 0;
  let lastRank = playerRank(state, partyId);

  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, content.events);
    const choice = pickForProfile(state, event, profile, seed);
    const resolution = resolveCurrentChoice(state, choice.id, content);
    state = resolution.state;
    eventIds.push(event.id);
    pollSeries.push(state.parties[partyId]?.stats.polling ?? 0);
    const rank = playerRank(state, partyId);
    if (rank !== lastRank) rankChanges += 1;
    lastRank = rank;
    if (event.rarity === "rare" || event.rarity === "legendary" || event.rarity === "secret")
      momentCount += 1;
    if (event.chain) momentCount += 1;
    guard += 1;
  }

  if (state.phase !== "finished" || !state.finalResult) return undefined;
  const validation = validateGameState(state);
  if (!validation.valid) return undefined;

  const endIdeology = state.parties[partyId]?.ideology ?? startIdeology;
  const ideologyMoveTotal = (
    Object.keys(startIdeology) as Array<keyof typeof startIdeology>
  ).reduce(
    (sum, axis) => sum + Math.abs((endIdeology[axis] ?? startIdeology[axis]) - startIdeology[axis]),
    0,
  );

  const mean = pollSeries.reduce((a, b) => a + b, 0) / pollSeries.length;
  const variance = pollSeries.reduce((a, b) => a + (b - mean) ** 2, 0) / pollSeries.length;

  return {
    variant,
    partyId,
    profile,
    seedIndex,
    decisions: state.decisionIndex,
    finalScore: state.finalResult.score,
    qualified: state.finalResult.qualified,
    won: state.finalResult.won,
    firstRoundScore: state.firstRoundResult?.results[partyId] ?? 0,
    eventIdSetSize: new Set(eventIds).size,
    eventIdSetHash: hashEventSet(eventIds),
    rankVolatility: Number((rankChanges / Math.max(1, state.decisionIndex)).toFixed(3)),
    pollStdev: Number(Math.sqrt(variance).toFixed(2)),
    rareOrChainOrConflictMoments: momentCount,
    ideologyMoveTotal: Number(ideologyMoveTotal.toFixed(2)),
    actorMemoryEntries: state.actorMemories.length,
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const rows: Row[] = [];
  let attempted = 0;
  let failed = 0;

  for (const party of EXISTING_PARTIES) {
    for (const profile of PROFILES) {
      for (let seedIndex = 0; seedIndex < SEEDS; seedIndex += 1) {
        for (const [variantName, build] of Object.entries(VARIANTS)) {
          attempted += 1;
          const content = build(gameContent);
          const row = runVariant(content, party.id, profile, seedIndex, variantName);
          if (!row) {
            failed += 1;
            continue;
          }
          rows.push(row);
        }
      }
    }
  }

  await writeFile(
    resolve(OUT_DIR, "ab-experiment.csv"),
    toCsv(rows as unknown as Record<string, unknown>[]),
    "utf8",
  );
  console.log(JSON.stringify({ totalRows: rows.length, attempted, failed }, null, 2));
}

await main();
