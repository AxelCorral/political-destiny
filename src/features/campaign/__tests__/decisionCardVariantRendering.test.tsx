import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { createGame, currentEvent, resolveCurrentChoice } from "@/game/engine";
import type { GameState } from "@/game/types";

import { EventDecisionCard } from "../event-decision-card";

/**
 * FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md Phase C/D — vérifie que chaque
 * variante visuelle de carte affiche réellement son signal distinctif dans
 * le DOM, et pas seulement dans la logique pure de resolveDecisionCardVariant
 * (déjà couverte par decisionCardVariant.test.ts).
 */
describe("EventDecisionCard — rendu concret par variante", () => {
  afterEach(() => cleanup());

  const baseState = createGame(
    {
      seed: "variant-render-test",
      mode: "existing_party",
      partyId: "lr",
      methodId: "presidential",
    },
    gameContent,
  );

  it("affiche le bandeau « Édition spéciale » pour un événement rare", () => {
    const event = gameContent.events.find((e) => e.category === "rare")!;
    render(
      <EventDecisionCard
        date="2026-05-01"
        event={event}
        state={baseState}
        onChoose={() => undefined}
      />,
    );
    expect(screen.getByText("Édition spéciale")).toBeInTheDocument();
  });

  it("affiche le bandeau « Décisif » pour un événement d'importance decisive hors gouvernement", () => {
    const event = gameContent.events.find(
      (e) => e.importance === "decisive" && e.category !== "government" && e.category !== "rare",
    )!;
    render(
      <EventDecisionCard
        date="2026-05-01"
        event={event}
        state={baseState}
        onChoose={() => undefined}
      />,
    );
    expect(screen.getByText("Décisif")).toBeInTheDocument();
  });

  it("affiche « Vous gouvernez désormais » pour un événement de catégorie government", () => {
    const event = gameContent.events.find((e) => e.category === "government")!;
    render(
      <EventDecisionCard
        date="2026-05-01"
        event={event}
        state={baseState}
        onChoose={() => undefined}
      />,
    );
    expect(screen.getByText("Vous gouvernez désormais")).toBeInTheDocument();
  });

  it("affiche « Retour de dossier » avec le libellé du choix d'origine pour une suite de chaîne réellement jouée", () => {
    let state: GameState = createGame(
      {
        seed: "chain-render-test-3",
        mode: "existing_party",
        partyId: "lfi",
        methodId: "field_first",
      },
      gameContent,
    );
    let guard = 0;
    let followUp;
    while (state.phase !== "finished" && guard < 40 && !followUp) {
      const event = currentEvent(state, gameContent.events);
      if (event.chain && event.chain.step > 1 && event.chain.followsEventIds?.length) {
        followUp = event;
        break;
      }
      state = resolveCurrentChoice(state, event.choices[0]!.id, gameContent).state;
      guard += 1;
    }
    expect(followUp).toBeDefined();
    render(
      <EventDecisionCard
        date="2026-05-01"
        event={followUp!}
        state={state}
        onChoose={() => undefined}
      />,
    );
    expect(screen.getByText("Retour de dossier")).toBeInTheDocument();
  });

  it("un événement routine n'affiche aucun bandeau de variante", () => {
    const event = gameContent.events.find(
      (e) =>
        (e.importance === undefined || e.importance === "routine") &&
        e.category !== "rare" &&
        e.category !== "government" &&
        e.category !== "debate" &&
        !e.chain,
    )!;
    render(
      <EventDecisionCard
        date="2026-05-01"
        event={event}
        state={baseState}
        onChoose={() => undefined}
      />,
    );
    expect(screen.queryByText("Édition spéciale")).not.toBeInTheDocument();
    expect(screen.queryByText("Décisif")).not.toBeInTheDocument();
    expect(screen.queryByText("Retour de dossier")).not.toBeInTheDocument();
    expect(screen.queryByText("Vous gouvernez désormais")).not.toBeInTheDocument();
  });
});
