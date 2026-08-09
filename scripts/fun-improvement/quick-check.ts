/**
 * Fast, targeted sanity check used BETWEEN phases of the fun-improvement
 * mission (PROMPT_CLAUDE_CODE_AMELIORATION_FUN_POST_AUDIT.md) — not a
 * replacement for the full audit:fun corpus, which is only re-run once at
 * the end (Phase J) for the authoritative before/after comparison.
 *
 * Real engine, no reimplementation. Simulates one or more parties across
 * the 8 realistic agents (scripts/audit-post/lib/agents.ts) for a small
 * number of seeds and prints qualification/victory/score/rank-1-share/
 * memorable-signal figures — enough to tell "did this change move the
 * needle in the right direction" without waiting ~3 minutes for the full
 * 9-party corpus.
 *
 * Usage: npx tsx scripts/fun-improvement/quick-check.ts [partyId...] [--seeds=N]
 */
import { gameContent } from "../../src/game/data/index";
import {
  createGame,
  currentEvent,
  resolveCurrentChoice,
  validateGameState,
} from "../../src/game/engine/index";
import { AGENT_NAMES, pickChoice } from "../audit-post/lib/agents";

const args = process.argv.slice(2);
const seedsArg = args.find((a) => a.startsWith("--seeds="));
const seeds = seedsArg ? Number.parseInt(seedsArg.split("=")[1]!, 10) : 12;
const parties = args.filter((a) => !a.startsWith("--"));
const targetParties = parties.length
  ? parties
  : gameContent.parties.filter((p) => p.isRealOrganization).map((p) => p.id);

function playerRank(
  state: import("../../src/game/types/index").GameState,
  partyId: string,
): number {
  const own = state.parties[partyId]?.stats.polling ?? 0;
  const higher = Object.values(state.parties).filter(
    (p) => p.active && p.id !== partyId && p.stats.polling > own,
  ).length;
  return higher + 1;
}

for (const partyId of targetParties) {
  let qualified = 0;
  let won = 0;
  let scoreSum = 0;
  let rank1Always = 0;
  let memorableSum = 0;
  let n = 0;
  let errors = 0;

  for (const agent of AGENT_NAMES) {
    for (let seedIndex = 0; seedIndex < seeds; seedIndex += 1) {
      const seed = `quickcheck-${partyId}-${agent}-${seedIndex}`;
      const method = gameContent.methods[seedIndex % gameContent.methods.length]!;
      let state = createGame(
        { seed, mode: "existing_party", partyId, methodId: method.id },
        gameContent,
      );
      let guard = 0;
      let alwaysRank1 = true;
      let rareCount = 0;
      let allianceCount = 0;
      let contradictionCount = 0;
      while (state.phase !== "finished" && guard < 60) {
        const event = currentEvent(state, gameContent.events);
        const choice = pickChoice(state, event, agent, seed);
        const resolution = resolveCurrentChoice(state, choice.id, gameContent);
        state = resolution.state;
        if (playerRank(state, partyId) !== 1) alwaysRank1 = false;
        if (event.rarity !== "common" && event.rarity !== "uncommon") rareCount += 1;
        guard += 1;
      }
      if (state.phase !== "finished" || !state.finalResult) {
        errors += 1;
        continue;
      }
      const validation = validateGameState(state);
      if (!validation.valid) {
        errors += 1;
        continue;
      }
      allianceCount = Object.values(state.parties).filter((p) =>
        p.alliedWith.includes(partyId),
      ).length;
      contradictionCount = state.statementLedger.filter(
        (s) => s.evolution === "contradiction",
      ).length;
      const memorable = [
        rareCount > 0,
        allianceCount > 0,
        contradictionCount > 0,
        state.actorMemories.length > 0,
        Object.values(state.partyRelations[partyId] ?? {}).some((v) => v <= -25),
      ].filter(Boolean).length;
      n += 1;
      if (state.finalResult.qualified) qualified += 1;
      if (state.finalResult.won) won += 1;
      scoreSum += state.finalResult.score;
      if (alwaysRank1) rank1Always += 1;
      memorableSum += memorable;
    }
  }

  console.log(
    JSON.stringify(
      {
        partyId,
        n,
        errors,
        qualificationRate: n ? Number((qualified / n).toFixed(3)) : null,
        victoryRate: n ? Number((won / n).toFixed(3)) : null,
        victoryGivenQualifiedRate: qualified ? Number((won / qualified).toFixed(3)) : null,
        meanScore: n ? Number((scoreSum / n).toFixed(1)) : null,
        shareAlwaysRank1: n ? Number((rank1Always / n).toFixed(3)) : null,
        meanMemorableSignals5: n ? Number((memorableSum / n).toFixed(2)) : null,
      },
      null,
      2,
    ),
  );
}
