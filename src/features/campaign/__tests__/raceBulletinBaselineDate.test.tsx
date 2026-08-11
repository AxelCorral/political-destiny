import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { createGame, currentEvent, resolveCurrentChoice } from "@/game/engine";
import type { GameState } from "@/game/types";

import { RaceBulletinScreen } from "../campaign-screens";
import { useGameStore } from "../gameStore";

/**
 * PROMPT_CLAUDE_CODE_RECOMPOSITIONS_STRATEGIQUES_SOUTIENS_CHOCS.md §24-25 —
 * le premier bulletin (le tout premier `PollSnapshot`, `decisionIndex === 0`,
 * généré à la création de la partie) doit rappeler explicitement que les
 * rapports de force de départ sont calibrés au 18 avril 2026 — une
 * photographie réelle datée, pas une prédiction — sans que ce rappel
 * n'encombre les bulletins suivants, qui restent de simples estimations
 * fictives bruitées.
 */
describe("RaceBulletinScreen — mention de la baseline du 18 avril 2026", () => {
  beforeEach(() => useGameStore.getState().resetGame());
  afterEach(() => cleanup());

  it("affiche la mention du 18 avril 2026 sur le tout premier bulletin", () => {
    const state: GameState = createGame(
      { seed: "baseline-date-test", mode: "existing_party", partyId: "ps", methodId: "field_first" },
      gameContent,
    );
    expect(state.pollHistory).toHaveLength(1);
    expect(state.pollHistory[0]!.decisionIndex).toBe(0);

    useGameStore.getState().restoreGame(state);
    useGameStore.getState().showRace();
    render(<RaceBulletinScreen />);

    expect(screen.getByText(/Rapports de force de départ/)).toBeInTheDocument();
  });

  it("n'affiche plus la mention sur un bulletin ultérieur", () => {
    let state: GameState = createGame(
      { seed: "baseline-date-test-2", mode: "existing_party", partyId: "ps", methodId: "field_first" },
      gameContent,
    );
    let guard = 0;
    while (state.pollHistory.length < 2 && state.phase !== "finished" && guard < 20) {
      const event = currentEvent(state, gameContent.events);
      state = resolveCurrentChoice(state, event.choices[0]!.id, gameContent).state;
      guard += 1;
    }
    expect(state.pollHistory.length).toBeGreaterThan(1);

    useGameStore.getState().restoreGame(state);
    useGameStore.getState().showRace();
    render(<RaceBulletinScreen />);

    expect(screen.queryByText(/Rapports de force de départ/)).not.toBeInTheDocument();
  });
});
