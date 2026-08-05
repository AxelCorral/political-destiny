import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { createGame, currentEvent } from "@/game/engine";
import { CustomPartyScreen, ModeSelectionScreen } from "@/features/onboarding/setup-screens";

import { CampaignEventScreen } from "../campaign-screens";
import { useGameStore } from "../gameStore";

describe("parcours d’interface de campagne", () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  afterEach(() => cleanup());

  it("ouvre le sélecteur des partis existants", async () => {
    const user = userEvent.setup();
    render(<ModeSelectionScreen />);

    await user.click(screen.getByRole("button", { name: /un parti existant/i }));

    expect(useGameStore.getState().screen).toBe("party_list");
    expect(useGameStore.getState().setup.mode).toBe("existing_party");
  });

  it("construit un parti personnalisé complet avec les réponses par défaut", async () => {
    const user = userEvent.setup();
    useGameStore.getState().selectMode("custom_party");
    render(<CustomPartyScreen />);

    for (let step = 0; step < 5; step += 1) {
      await user.click(screen.getByRole("button", { name: /continuer/i }));
    }
    await user.click(screen.getByRole("button", { name: /valider ce mouvement/i }));

    const setup = useGameStore.getState().setup;
    expect(useGameStore.getState().screen).toBe("method");
    expect(setup.customParty?.program).toHaveLength(3);
    expect(setup.customParty?.id).toBe("custom_party");
  });

  it("résout une carte événement ordinaire et affiche la conséquence", async () => {
    let state = createGame(
      { seed: "ui-ordinary", mode: "existing_party", partyId: "lr", methodId: "presidential" },
      gameContent,
    );
    for (let index = 0; currentEvent(state, gameContent.events).category === "debate"; index += 1) {
      state = createGame(
        {
          seed: `ui-ordinary-${index}`,
          mode: "existing_party",
          partyId: "lr",
          methodId: "presidential",
        },
        gameContent,
      );
    }
    useGameStore.getState().restoreGame(state);
    const event = currentEvent(state, gameContent.events);
    render(<CampaignEventScreen onSaveAndQuit={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: new RegExp(event.choices[0]!.label, "i") }));
    fireEvent.click(screen.getByRole("button", { name: /confirmer ma décision/i }));

    expect(useGameStore.getState().screen).toBe("outcome");
    expect(useGameStore.getState().lastRecord?.eventId).toBe(event.id);
  });

  it("fait contribuer les trois manches d’un débat à la réponse finale", async () => {
    const state = createGame(
      { seed: "ui-debate", mode: "existing_party", partyId: "ps", methodId: "digital" },
      gameContent,
    );
    state.currentEventId = "debate_economy_round";
    useGameStore.getState().restoreGame(state);
    render(<CampaignEventScreen onSaveAndQuit={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: /précision/i }));
    fireEvent.click(screen.getByRole("button", { name: /précision/i }));
    const debateEvent = gameContent.events.find((event) => event.id === "debate_economy_round")!;
    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(debateEvent.choices[0]!.label, "i") }),
    );
    fireEvent.click(screen.getByRole("button", { name: /prononcer la conclusion/i }));

    expect(useGameStore.getState().screen).toBe("outcome");
    expect(useGameStore.getState().lastRecord?.eventId).toBe("debate_economy_round");
  });
});
