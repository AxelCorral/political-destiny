/**
 * TARGETED_GAMEPLAY_PASS_REPORT.md §13 — late-game counterfactual: same
 * real states (sampled from actual playthroughs, not synthetic), comparing
 * the weighted event pool WITH vs WITHOUT lateGameRelevanceMultiplier
 * applied, to show concretely how much probability mass shifts toward
 * chains/debates/decisive-internal-crises/qualification-critical events in
 * the campaign's final stretch. Real engine and real content throughout.
 *
 * Usage: npx tsx scripts/targeted-pass/lategame-counterfactual.ts
 */
import { gameContent } from "../../src/game/data/index";
import {
  createGame,
  currentEvent,
  eventWeight,
  isEventEligible,
  lateGameRelevanceMultiplier,
  resolveCurrentChoice,
} from "../../src/game/engine/index";
import type { GameState } from "../../src/game/types/index";

function eventWeightWithoutLateGameFactor(
  state: GameState,
  event: (typeof gameContent.events)[number],
): number {
  // eventWeight() = (...) * lateGameRelevanceMultiplier(state, event); both
  // factors are exported and pure, so dividing the real weight by the real
  // multiplier recovers exactly "what the pool looked like before this
  // mission's Phase D change" for the SAME real state, with no duplicated
  // formula and no risk of drifting out of sync with eventSelector.ts.
  return eventWeight(state, event) / lateGameRelevanceMultiplier(state, event);
}

const parties = gameContent.parties.filter((p) => p.isRealOrganization).map((p) => p.id);
let samples = 0;
let chainShareBefore = 0;
let chainShareAfter = 0;
let debateShareBefore = 0;
let debateShareAfter = 0;
let decisiveInternalShareBefore = 0;
let decisiveInternalShareAfter = 0;

for (const partyId of parties) {
  for (let i = 0; i < 8; i += 1) {
    const seed = `lategame-cf-${partyId}-${i}`;
    let state: GameState = createGame(
      { seed, mode: "existing_party", partyId, methodId: gameContent.methods[i % gameContent.methods.length]!.id },
      gameContent,
    );
    let guard = 0;
    while (state.phase !== "finished" && guard < 60) {
      const event = currentEvent(state, gameContent.events);
      const progress = state.decisionIndex / 24;
      if ((state.phase === "campaign" || state.phase === "official_campaign") && progress >= 0.72) {
        const eligible = gameContent.events.filter((e) => isEventEligible(state, e));
        if (eligible.length > 1) {
          const before = eligible.map((e) => eventWeightWithoutLateGameFactor(state, e));
          const after = eligible.map((e) => eventWeight(state, e));
          const totalBefore = before.reduce((a, b) => a + b, 0);
          const totalAfter = after.reduce((a, b) => a + b, 0);
          eligible.forEach((e, idx) => {
            const isChain = Boolean(e.chain);
            const isDebate = e.category === "debate";
            const isDecisiveInternal =
              e.category === "internal" && (e.importance === "decisive" || e.importance === "major");
            if (isChain) {
              chainShareBefore += (before[idx]! / totalBefore) || 0;
              chainShareAfter += (after[idx]! / totalAfter) || 0;
            }
            if (isDebate) {
              debateShareBefore += (before[idx]! / totalBefore) || 0;
              debateShareAfter += (after[idx]! / totalAfter) || 0;
            }
            if (isDecisiveInternal) {
              decisiveInternalShareBefore += (before[idx]! / totalBefore) || 0;
              decisiveInternalShareAfter += (after[idx]! / totalAfter) || 0;
            }
          });
          samples += 1;
        }
      }
      const choice = event.choices[guard % event.choices.length]!;
      state = resolveCurrentChoice(state, choice.id, gameContent).state;
      guard += 1;
    }
  }
}

console.log(
  JSON.stringify(
    {
      samples,
      meanChainShareOfPool: {
        before: Number((chainShareBefore / samples).toFixed(4)),
        after: Number((chainShareAfter / samples).toFixed(4)),
      },
      meanDebateShareOfPool: {
        before: Number((debateShareBefore / samples).toFixed(4)),
        after: Number((debateShareAfter / samples).toFixed(4)),
      },
      meanDecisiveInternalShareOfPool: {
        before: Number((decisiveInternalShareBefore / samples).toFixed(4)),
        after: Number((decisiveInternalShareAfter / samples).toFixed(4)),
      },
    },
    null,
    2,
  ),
);
