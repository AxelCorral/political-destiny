import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { validateGameContent } from "@/game/data/validation";
import { createGame, currentEvent, resolveCurrentChoice, validateGameState } from "@/game/engine";

describe("contenu de production", () => {
  it("respecte les minima structurels et éditoriaux", () => {
    const report = validateGameContent(gameContent);
    expect(report.errors).toEqual([]);
    expect(report.stats.events).toBeGreaterThanOrEqual(110);
    expect(report.stats.achievements).toBeGreaterThanOrEqual(40);
  });

  it.each([
    "lfi",
    "ps",
    "ecologistes",
    "renaissance",
    "horizons",
    "lr",
    "rn",
    "reconquete",
    "nouvelle_energie",
  ])("termine une campagne déterministe avec %s", (partyId) => {
    let state = createGame(
      { seed: `production-${partyId}`, mode: "existing_party", partyId, methodId: "field_first" },
      gameContent,
    );
    let guard = 0;
    while (state.phase !== "finished" && guard < 40) {
      const event = currentEvent(state, gameContent.events);
      state = resolveCurrentChoice(
        state,
        event.choices[guard % event.choices.length]!.id,
        gameContent,
      ).state;
      guard += 1;
    }
    expect(state.phase).toBe("finished");
    expect(validateGameState(state).errors).toEqual([]);
    expect(state.finalResult?.score).toBeGreaterThanOrEqual(0);
    expect(state.finalResult?.score).toBeLessThanOrEqual(100);
  });
});
