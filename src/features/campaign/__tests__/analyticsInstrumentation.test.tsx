import { StrictMode } from "react";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { gameContent } from "@/game/data";
import { createGame, currentEvent } from "@/game/engine";

import { CampaignEventScreen } from "../campaign-screens";
import { useGameStore } from "../gameStore";

const trackMock = vi.hoisted(() => vi.fn());
vi.mock("@/analytics/client", () => ({ track: trackMock }));

// jsdom has no ResizeObserver — only needed here because this file is the
// first test to actually open CampaignDashboard (via a real click) rather
// than only exercising CampaignEventScreen's own markup.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

describe("instrumentation analytics — decision_viewed / choice_selected / player_dashboard_opened", () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
    trackMock.mockClear();
  });

  afterEach(() => cleanup());

  it("émet decision_viewed une seule fois, même sous React Strict Mode (double-invoke des effets)", () => {
    const state = createGame(
      { seed: "analytics-viewed", mode: "existing_party", partyId: "lr", methodId: "presidential" },
      gameContent,
    );
    useGameStore.getState().restoreGame(state);
    const event = currentEvent(state, gameContent.events);

    render(
      <StrictMode>
        <CampaignEventScreen onSaveAndQuit={() => undefined} />
      </StrictMode>,
    );

    const viewedCalls = trackMock.mock.calls.filter((call) => call[0] === "decision_viewed");
    expect(viewedCalls).toHaveLength(1);
    expect(viewedCalls[0]?.[2]).toMatchObject({
      decisionIndex: state.decisionIndex,
      eventId: event.id,
      eventCategory: event.category,
      numberOfAvailableChoices: event.choices.length,
    });
  });

  it("émet choice_selected avant la résolution, avec le bon eventId/choiceId", () => {
    const state = createGame(
      {
        seed: "analytics-selected",
        mode: "existing_party",
        partyId: "lr",
        methodId: "presidential",
      },
      gameContent,
    );
    useGameStore.getState().restoreGame(state);
    const event = currentEvent(state, gameContent.events);
    const choice = event.choices[0]!;

    render(<CampaignEventScreen onSaveAndQuit={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(choice.label, "i") }));

    const selectedCalls = trackMock.mock.calls.filter((call) => call[0] === "choice_selected");
    expect(selectedCalls).toHaveLength(1);
    expect(selectedCalls[0]?.[2]).toMatchObject({
      decisionIndex: state.decisionIndex,
      eventId: event.id,
      choiceId: choice.id,
    });
    // decision_resolved itself is tracked from game-app.tsx (observing the
    // GameState diff), not from this component — not rendered here. What
    // this component boundary guarantees is that choice_selected fires
    // synchronously before chooseEventOption resolves the choice, which the
    // store having already moved to "outcome" by the time we assert here
    // confirms happened without error.
    expect(useGameStore.getState().screen).toBe("outcome");
    expect(useGameStore.getState().lastRecord?.choiceId).toBe(choice.id);
  });

  it("émet player_dashboard_opened au clic sur le bouton tableau de bord, jamais au premier rendu", () => {
    const state = createGame(
      {
        seed: "analytics-dashboard",
        mode: "existing_party",
        partyId: "lr",
        methodId: "presidential",
      },
      gameContent,
    );
    useGameStore.getState().restoreGame(state);

    render(<CampaignEventScreen onSaveAndQuit={() => undefined} />);
    expect(trackMock.mock.calls.some((call) => call[0] === "player_dashboard_opened")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /^tableau de bord$/i }));

    const opened = trackMock.mock.calls.filter((call) => call[0] === "player_dashboard_opened");
    expect(opened).toHaveLength(1);
    expect(opened[0]?.[2]).toMatchObject({
      phase: state.phase,
      decisionIndex: state.decisionIndex,
    });
  });
});
