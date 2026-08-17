import "fake-indexeddb/auto";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { gameContent } from "@/game/data";
import { createGame, currentEvent, resolveCurrentChoice } from "@/game/engine";
import type { GameState } from "@/game/types";
import {
  getLocalProfile,
  getLocalSettings,
  listCompletedRuns,
  loadActiveGame,
  saveActiveGame,
  saveLocalSettings,
} from "@/lib/storage/game-database";

import { useGameStore } from "../gameStore";
import { NewCampaignButton } from "../new-campaign-button";
import { startNewCampaign } from "../new-campaign";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function newState(seed: string): GameState {
  let state = createGame(
    { seed, mode: "existing_party", partyId: "ps", methodId: "presidential" },
    gameContent,
  );
  // Une progression réelle : c'est elle qui doit survivre à « Annuler » et
  // disparaître après « Démarrer une nouvelle campagne ».
  const event = currentEvent(state, gameContent.events);
  state = resolveCurrentChoice(state, event.choices[0]!.id, gameContent).state;
  return state;
}

describe("démarrage d’une nouvelle campagne avec une sauvegarde active", () => {
  beforeEach(async () => {
    push.mockClear();
    useGameStore.getState().resetGame();
    await saveActiveGame(newState("nouvelle-partie-fixture"));
  });

  afterEach(() => cleanup());

  it("libère la sauvegarde active et le store, sans toucher aux autres données locales", async () => {
    await saveLocalSettings({
      reducedMotion: true,
      soundEnabled: true,
      fictionNoticeSeen: true,
      analyticsConsent: "denied",
    });
    const active = (await loadActiveGame()).state!;
    useGameStore.getState().restoreGame(active);

    await startNewCampaign();

    expect((await loadActiveGame()).state).toBeUndefined();
    expect(useGameStore.getState().gameState).toBeUndefined();
    expect(useGameStore.getState().screen).toBe("mode");
    // §7 : rien d’autre que le run actif ne doit disparaître.
    const settings = await getLocalSettings();
    expect(settings.analyticsConsent).toBe("denied");
    expect(settings.reducedMotion).toBe(true);
    expect(await getLocalProfile()).toBeDefined();
    expect(await listCompletedRuns()).toEqual([]);
  });

  it("demande confirmation avant de remplacer la campagne en cours", async () => {
    const user = userEvent.setup();
    render(<NewCampaignButton>Nouvelle partie</NewCampaignButton>);

    await user.click(screen.getByRole("button", { name: /nouvelle partie/i }));

    expect(
      await screen.findByRole("heading", { name: /démarrer une nouvelle campagne/i }),
    ).toBeVisible();
    expect(push).not.toHaveBeenCalled();
    expect((await loadActiveGame()).state).toBeDefined();
  });

  it("annuler ne touche ni la sauvegarde, ni le store, ni la navigation", async () => {
    const user = userEvent.setup();
    const active = (await loadActiveGame()).state!;
    useGameStore.getState().restoreGame(active);
    render(<NewCampaignButton>Nouvelle partie</NewCampaignButton>);

    await user.click(screen.getByRole("button", { name: /nouvelle partie/i }));
    await user.click(await screen.findByRole("button", { name: /^annuler$/i }));

    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: /démarrer une nouvelle campagne/i })).toBeNull(),
    );
    const stillThere = (await loadActiveGame()).state;
    expect(stillThere?.runId).toBe(active.runId);
    expect(stillThere?.decisionIndex).toBe(active.decisionIndex);
    expect(useGameStore.getState().gameState?.runId).toBe(active.runId);
    expect(push).not.toHaveBeenCalled();
  });

  it("confirmer efface le run actif, remet le store à zéro et ouvre le flux initial", async () => {
    const user = userEvent.setup();
    const active = (await loadActiveGame()).state!;
    useGameStore.getState().restoreGame(active);
    render(<NewCampaignButton>Nouvelle partie</NewCampaignButton>);

    await user.click(screen.getByRole("button", { name: /nouvelle partie/i }));
    await user.click(
      await screen.findByRole("button", { name: /^démarrer une nouvelle campagne$/i }),
    );

    await waitFor(() => expect(push).toHaveBeenCalledWith("/jouer"));
    expect((await loadActiveGame()).state).toBeUndefined();
    expect(useGameStore.getState().gameState).toBeUndefined();
    expect(useGameStore.getState().screen).toBe("mode");
  });

  it("crée une identité de run neuve, jamais celle de la campagne précédente", async () => {
    // §16 — `run_started` / `run_resumed` sont émis par game-app.tsx à partir de
    // ces trois valeurs exactement (runId différent, decisionIndex 0, historique
    // vide) : c'est ce qui garantit qu'une nouvelle campagne ouvre un nouveau run
    // analytics au lieu de prolonger le `run_id` de la précédente.
    const previous = (await loadActiveGame()).state!;
    useGameStore.getState().restoreGame(previous);

    await startNewCampaign();
    const store = useGameStore.getState();
    store.selectMode("existing_party");
    store.confirmParty("ps");
    store.chooseMethod("presidential");
    store.updateLaunchDetails({ seed: "identite-neuve" });
    store.launchCampaign();

    const created = useGameStore.getState().gameState!;
    expect(created.runId).not.toBe(previous.runId);
    expect(created.decisionIndex).toBe(0);
    expect(created.decisionHistory).toEqual([]);
  });

  it("sans sauvegarde active, le CTA part directement en campagne sans confirmation", async () => {
    const user = userEvent.setup();
    await startNewCampaign();
    render(<NewCampaignButton>Lancer une campagne</NewCampaignButton>);

    await user.click(screen.getByRole("button", { name: /lancer une campagne/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/jouer"));
    expect(screen.queryByRole("heading", { name: /démarrer une nouvelle campagne/i })).toBeNull();
  });
});
