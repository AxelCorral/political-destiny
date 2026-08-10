import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { createGame } from "@/game/engine";

import { EventDecisionCard } from "../event-decision-card";

const state = createGame(
  { seed: "title-test", mode: "existing_party", partyId: "lr", methodId: "presidential" },
  gameContent,
);

/**
 * FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md Phase B, bug P1 §7.1 — le titre de
 * `party_nouvelle_energie_signature` ("Le permis d'entreprendre doit être
 * défini") était rogné en plein mot à 390px car la carte porte
 * `overflow-hidden` pendant que le <h1> n'avait aucune règle de
 * césure/retour à la ligne pour les mots proches de la largeur du
 * conteneur. Corrigé en ajoutant `break-words` au <h1>. Vérifié ici sur
 * plusieurs titres longs du catalogue (pas seulement celui signalé) que le
 * texte intégral reste dans le DOM sans troncature côté JS/CSS
 * (`text-overflow`/`line-clamp`), et vérifié visuellement en navigateur réel
 * à 360/390/1366px que le mot déborde désormais en s'enroulant plutôt qu'en
 * étant masqué par `overflow-hidden`.
 */
describe("EventDecisionCard — pas de troncature de titre sur mot long", () => {
  afterEach(() => cleanup());

  const longTitleEventIds = [
    "party_nouvelle_energie_signature",
    "party_horizons_signature",
    "party_lfi_electorate",
    "party_ecologistes_alliance",
    "world_heatwave",
  ];

  it.each(longTitleEventIds)("rend le titre intégral de %s sans troncature", (eventId) => {
    const event = gameContent.events.find((e) => e.id === eventId);
    expect(event, `événement ${eventId} introuvable`).toBeDefined();
    render(
      <EventDecisionCard
        date="2026-05-01"
        event={event!}
        state={state}
        onChoose={() => undefined}
      />,
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe(event!.title);
    expect(heading.className).toMatch(/break-words/);
    expect(heading.className).not.toMatch(/truncate|line-clamp/);
  });

  it("la carte standard conserve overflow-hidden pour la barre de dégradé sans tronquer le titre", () => {
    const event = gameContent.events.find((e) => e.id === "party_nouvelle_energie_signature")!;
    const { container } = render(
      <EventDecisionCard
        date="2026-05-01"
        event={event}
        state={state}
        onChoose={() => undefined}
      />,
    );
    const card = container.querySelector(".overflow-hidden");
    expect(card).not.toBeNull();
    expect(card?.textContent).toContain(event.title);
  });
});
