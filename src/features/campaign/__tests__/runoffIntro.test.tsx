import { cleanup, render, screen as testingLibScreen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { createGame, currentEvent, resolveCurrentChoice } from "@/game/engine";
import type { GameState } from "@/game/types";

import { RunoffIntroScreen } from "../campaign-screens";
import { useGameStore } from "../gameStore";

/**
 * FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md Phase G (§16) — un écran court
 * « ENTRE-DEUX-TOURS » doit s'intercaler entre le résultat du premier tour
 * et les décisions d'entre-deux-tours, uniquement pour un joueur qualifié
 * (jamais pour un joueur éliminé, qui n'est pas dans le duel).
 */
function playToFirstRound(): GameState {
  const method = gameContent.methods[0]!;
  let state: GameState = createGame(
    { seed: "always-first-gov-lfi-1", mode: "existing_party", partyId: "lfi", methodId: method.id },
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

describe("continueAfterMilestone — routage vers l'entre-deux-tours", () => {
  beforeEach(() => useGameStore.getState().resetGame());
  afterEach(() => cleanup());

  it("un joueur qualifié au premier tour est routé vers runoff_intro, pas directement vers campaign", () => {
    const state = playToFirstRound();
    expect(state.firstRoundResult).toBeDefined();
    expect(state.flags.playerQualified).toBe(true);

    useGameStore.setState({ gameState: state, screen: "first_round" });
    useGameStore.getState().continueAfterMilestone();

    expect(useGameStore.getState().screen).toBe("runoff_intro");
  });

  it("continueFromRunoffIntro passe ensuite à l'écran de campagne (décisions d'entre-deux-tours)", () => {
    const state = playToFirstRound();
    useGameStore.setState({ gameState: state, screen: "runoff_intro" });
    useGameStore.getState().continueFromRunoffIntro();

    expect(useGameStore.getState().screen).toBe("campaign");
  });

  it("un joueur éliminé au premier tour n'est jamais routé vers runoff_intro", () => {
    const state = playToFirstRound();
    const eliminatedState: GameState = {
      ...state,
      flags: { ...state.flags, playerQualified: false, eliminated: true },
    };
    useGameStore.setState({ gameState: eliminatedState, screen: "first_round" });
    useGameStore.getState().continueAfterMilestone();

    expect(useGameStore.getState().screen).not.toBe("runoff_intro");
  });
});

describe("RunoffIntroScreen — rendu du duel", () => {
  beforeEach(() => useGameStore.getState().resetGame());
  afterEach(() => cleanup());

  it("affiche les deux finalistes, leurs scores du premier tour, et le signal J-14", () => {
    const state = playToFirstRound();
    useGameStore.getState().restoreGame(state);
    useGameStore.setState({ screen: "runoff_intro" });

    render(<RunoffIntroScreen />);

    const opponentId = state.qualifiedPartyIds?.find((id) => id !== state.playerPartyId);
    expect(opponentId).toBeDefined();
    const player = state.parties[state.playerPartyId]!;
    const opponent = state.parties[opponentId!]!;

    expect(testingLibScreen.getByText(player.displayName)).toBeInTheDocument();
    expect(testingLibScreen.getByText(opponent.displayName)).toBeInTheDocument();
    expect(testingLibScreen.getByText("VS")).toBeInTheDocument();
    expect(testingLibScreen.getByText(/J . 14/)).toBeInTheDocument();

    const playerScore = state.firstRoundResult!.results[state.playerPartyId] ?? 0;
    expect(testingLibScreen.getByText(`${playerScore.toFixed(1)} %`)).toBeInTheDocument();
  });
});
