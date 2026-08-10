import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useGameStore } from "@/features/campaign/gameStore";
import { gameContent } from "@/game/data";
import { createGame, currentEvent, resolveCurrentChoice } from "@/game/engine";
import type { GameState } from "@/game/types";

import { FinalScreen } from "../final-screen";

/**
 * FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md Phase H (§17) — victoire et défaite
 * doivent rester structurellement identiques (même gabarit, même qualité de
 * bilan) mais visuellement différenciées : ton chaud/or pour la victoire,
 * ton sobre navy/bleu pour la défaite, jamais désaturé au point d'être
 * punitif.
 */
function playToFinish(seed: string, partyId: string): GameState {
  const method = gameContent.methods[0]!;
  let state: GameState = createGame(
    { seed, mode: "existing_party", partyId, methodId: method.id },
    gameContent,
  );
  let guard = 0;
  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, gameContent.events);
    state = resolveCurrentChoice(state, event.choices[0]!.id, gameContent).state;
    guard += 1;
  }
  return state;
}

describe("FinalScreen — ton visuel différencié victoire/défaite", () => {
  beforeEach(() => useGameStore.getState().resetGame());
  afterEach(() => cleanup());

  it("la victoire affiche l'eyebrow doré et le score en or", () => {
    const state = playToFinish("always-first-gov-lfi-1", "lfi");
    expect(state.finalResult?.won).toBe(true);
    useGameStore.getState().restoreGame(state);

    render(<FinalScreen onReplay={() => undefined} />);

    expect(screen.getByText("Fin de campagne · Victoire fictive")).toBeInTheDocument();
    expect(screen.queryByText("Fin de campagne · Résultat fictif")).not.toBeInTheDocument();
  });

  it("la défaite affiche l'eyebrow sobre existant, jamais le libellé de victoire", () => {
    const state = playToFinish("always-first-defeat-lfi-2", "lfi");
    expect(state.finalResult?.won).toBe(false);
    useGameStore.getState().restoreGame(state);

    render(<FinalScreen onReplay={() => undefined} />);

    expect(screen.getByText("Fin de campagne · Résultat fictif")).toBeInTheDocument();
    expect(screen.queryByText("Fin de campagne · Victoire fictive")).not.toBeInTheDocument();
  });

  it("la défaite conserve le bilan complet (score, métriques, positionnement)", () => {
    const state = playToFinish("always-first-defeat-lfi-2", "lfi");
    useGameStore.getState().restoreGame(state);

    render(<FinalScreen onReplay={() => undefined} />);

    expect(
      screen.getByLabelText(`Score global ${state.finalResult!.score} sur 100`),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pourquoi ce score ?" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Positionnement final" })).toBeInTheDocument();
  });
});
