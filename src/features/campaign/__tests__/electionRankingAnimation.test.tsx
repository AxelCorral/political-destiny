import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { createGame, currentEvent, resolveCurrentChoice } from "@/game/engine";
import type { GameState } from "@/game/types";

import { ElectionNightScreen } from "../campaign-screens";
import { useGameStore } from "../gameStore";

/**
 * FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md Phase F (§13, correctif prioritaire)
 * — les barres de ElectionRanking doivent révéler leur largeur (via
 * transform: scaleX animé, --bar-scale par ligne) avec un léger décalage
 * (stagger) par candidat, sur les deux tours.
 */
function playToFirstRound(): GameState {
  const method = gameContent.methods[0]!;
  let state: GameState = createGame(
    {
      seed: "election-ranking-anim-test",
      mode: "existing_party",
      partyId: "lfi",
      methodId: method.id,
    },
    gameContent,
  );
  let guard = 0;
  while (!state.firstRoundResult && guard < 40) {
    const event = currentEvent(state, gameContent.events);
    state = resolveCurrentChoice(state, event.choices[0]!.id, gameContent).state;
    guard += 1;
  }
  return state;
}

describe("ElectionNightScreen — animation des barres de classement", () => {
  afterEach(() => cleanup());

  it("chaque barre de rang porte animate-bar-grow, un --bar-scale correct et un délai croissant", () => {
    const state = playToFirstRound();
    expect(state.firstRoundResult).toBeDefined();
    useGameStore.getState().restoreGame(state);

    const { container } = render(<ElectionNightScreen round={1} />);
    const bars = container.querySelectorAll(".animate-bar-grow");
    expect(bars.length).toBeGreaterThan(0);

    const result = state.firstRoundResult!;
    const maximum = result.results[result.ranking[0] ?? ""] ?? 1;

    bars.forEach((bar, index) => {
      const style = (bar as HTMLElement).style;
      const scale = Number(style.getPropertyValue("--bar-scale"));
      const partyId = result.ranking[index]!;
      const expectedScale = (result.results[partyId] ?? 0) / maximum;
      expect(scale).toBeCloseTo(expectedScale, 5);
      expect(style.animationDelay).toBe(`${index * 80}ms`);
    });
  });
});
