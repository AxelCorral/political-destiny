/**
 * TARGETED_GAMEPLAY_PASS_REPORT.md, Phase C (§8.1) — diagnostic obligatoire
 * AVANT tout ajout de contenu Renaissance : mesure la part des campagnes où
 * l'arc "héritage" (party_renaissance_legacy_*) apparaît, sa part dans les
 * décisions spécifiques au parti, et la diversité des autres événements
 * party_renaissance_* rencontrés — sur le contenu de production réel, avec
 * le moteur réel (jamais une réimplémentation).
 *
 * Usage: npx tsx scripts/targeted-pass/renaissance-diagnostic.ts [--seeds=N]
 */
import { gameContent } from "../../src/game/data/index";
import {
  createGame,
  currentEvent,
  resolveCurrentChoice,
  validateGameState,
} from "../../src/game/engine/index";
import { AGENT_NAMES, pickChoice } from "../audit-post/lib/agents";
import type { GameState } from "../../src/game/types/index";

const args = process.argv.slice(2);
const seedsArg = args.find((a) => a.startsWith("--seeds="));
const SEEDS_PER_AGENT = seedsArg ? Number.parseInt(seedsArg.split("=")[1]!, 10) : 20;

const LEGACY_ARC_IDS = [
  "party_renaissance_legacy_test",
  "party_renaissance_legacy_confronted",
  "party_renaissance_legacy_credited",
];
const RENAISSANCE_SPECIFIC_IDS = gameContent.events
  .filter((e) => e.category === "party" && e.eligibleParties?.includes("renaissance"))
  .map((e) => e.id);

let runs = 0;
let runsWithLegacyArc = 0;
let totalRenaissanceDecisions = 0;
let totalLegacyDecisions = 0;
const otherEventCounts = new Map<string, number>();
const scoreWithLegacy: number[] = [];
const scoreWithoutLegacy: number[] = [];

for (const agent of AGENT_NAMES) {
  for (let i = 0; i < SEEDS_PER_AGENT; i += 1) {
    const seed = `renaissance-diag-${agent}-${i}`;
    const method = gameContent.methods[i % gameContent.methods.length]!;
    let state: GameState = createGame(
      { seed, mode: "existing_party", partyId: "renaissance", methodId: method.id },
      gameContent,
    );
    let guard = 0;
    while (state.phase !== "finished" && guard < 60) {
      const event = currentEvent(state, gameContent.events);
      const choice = pickChoice(state, event, agent, seed);
      state = resolveCurrentChoice(state, choice.id, gameContent).state;
      guard += 1;
    }
    if (state.phase !== "finished" || !state.finalResult) continue;
    if (!validateGameState(state).valid) continue;

    runs += 1;
    const seenIds = state.decisionHistory.map((d) => d.eventId);
    const renaissanceIdsSeen = seenIds.filter((id) => RENAISSANCE_SPECIFIC_IDS.includes(id));
    const legacyIdsSeen = seenIds.filter((id) => LEGACY_ARC_IDS.includes(id));
    totalRenaissanceDecisions += renaissanceIdsSeen.length;
    totalLegacyDecisions += legacyIdsSeen.length;
    if (legacyIdsSeen.length > 0) {
      runsWithLegacyArc += 1;
      scoreWithLegacy.push(state.finalResult.score);
    } else {
      scoreWithoutLegacy.push(state.finalResult.score);
    }
    for (const id of renaissanceIdsSeen) {
      if (LEGACY_ARC_IDS.includes(id)) continue;
      otherEventCounts.set(id, (otherEventCounts.get(id) ?? 0) + 1);
    }
  }
}

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

const report = {
  runs,
  runsWithLegacyArcShare: Number((runsWithLegacyArc / runs).toFixed(3)),
  legacyShareOfRenaissanceSpecificDecisions: Number(
    (totalLegacyDecisions / Math.max(1, totalRenaissanceDecisions)).toFixed(3),
  ),
  meanFinalScoreWithLegacyArc: Number(mean(scoreWithLegacy).toFixed(1)),
  meanFinalScoreWithoutLegacyArc: Number(mean(scoreWithoutLegacy).toFixed(1)),
  otherRenaissanceSpecificEventsReached: RENAISSANCE_SPECIFIC_IDS.filter(
    (id) => !LEGACY_ARC_IDS.includes(id),
  ).length,
  otherRenaissanceSpecificEventsSeenAtLeastOnce: [...otherEventCounts.keys()].length,
  otherEventOccurrenceCounts: Object.fromEntries(
    [...otherEventCounts.entries()].sort((a, b) => b[1] - a[1]),
  ),
};

console.log(JSON.stringify(report, null, 2));
