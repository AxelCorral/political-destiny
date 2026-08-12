import { describe, expect, it } from "vitest";

import { createGame, resolveCurrentChoice } from "@/game/engine";
import { testContent } from "@/game/fixtures/testContent";

/**
 * Regression guard for a real bug caught by e2e/analytics-telemetry.spec.ts:
 * DecisionRecord.decisionIndex (src/game/types/index.ts, assigned in
 * src/game/engine/game.ts AFTER state.decisionIndex is incremented) is one
 * higher than the pre-resolution GameState.decisionIndex that
 * decision_viewed/choice_selected are tracked with
 * (src/features/campaign/campaign-screens.tsx). game-app.tsx's
 * decision_resolved tracking must subtract 1 from record.decisionIndex to
 * stay keyed to the same logical decision — this test locks that
 * relationship at the engine boundary, independent of any React rendering.
 */
describe("convention decisionIndex — GameState (vue) vs DecisionRecord (résolu)", () => {
  it("record.decisionIndex - 1 correspond au GameState.decisionIndex vu avant résolution", () => {
    let state = createGame(
      {
        seed: "decision-index-convention",
        mode: "existing_party",
        partyId: "alpha",
        methodId: "field",
      },
      testContent,
    );

    for (let guard = 0; guard < 5 && state.phase !== "finished"; guard += 1) {
      const viewedDecisionIndex = state.decisionIndex;
      const event = testContent.events.find((candidate) => candidate.id === state.currentEventId)!;
      const resolution = resolveCurrentChoice(state, event.choices[0]!.id, testContent);
      const record = resolution.record;

      expect(record.decisionIndex - 1).toBe(viewedDecisionIndex);

      state = resolution.state;
    }
  });
});
