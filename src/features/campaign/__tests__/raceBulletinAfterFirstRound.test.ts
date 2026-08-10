import { beforeEach, describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { currentEvent } from "@/game/engine";

import { useGameStore } from "../gameStore";

/**
 * Bug de logique d'interface — l'écran multi-candidats "État de la course"
 * (RaceBulletinScreen, screen "race") ne doit plus jamais apparaître une
 * fois le premier tour joué : `state.decisionIndex` continue d'incrémenter
 * pendant l'entre-deux-tours et le gouvernement, donc un nouveau sondage
 * peut encore être généré tous les 4 décisions (`state.decisionIndex % 4 ===
 * 0`) bien après que le premier tour soit déjà tranché. `chooseEventOption`
 * ne doit déclencher `pendingScreen: "race"` que pendant les phases d'avant
 * premier tour (pre_campaign / campaign / official_campaign).
 */
describe("chooseEventOption — le bulletin multi-candidats n'apparaît plus après le premier tour", () => {
  beforeEach(() => useGameStore.getState().resetGame());

  it("ne déclenche jamais l'écran « race » pendant l'entre-deux-tours ou le gouvernement, même quand un sondage est généré", () => {
    const store = useGameStore.getState();
    store.selectMode("existing_party");
    store.confirmParty("lfi");
    store.chooseMethod(gameContent.methods[0]!.id);
    store.updateLaunchDetails({ seed: "always-first-gov-lfi-1" });
    store.launchCampaign();
    store.beginCampaign();

    let sawRaceAfterFirstRound = false;
    let sawFirstRound = false;
    let pollCountAtFirstRound = 0;
    let guard = 0;

    while (useGameStore.getState().gameState?.phase !== "finished" && guard < 250) {
      const snapshot = useGameStore.getState();
      const gs = snapshot.gameState;
      if (!gs) break;

      if (snapshot.screen === "campaign") {
        const event = currentEvent(gs, gameContent.events);
        snapshot.chooseEventOption(event.choices[0]!.id);
        const after = useGameStore.getState();
        const isBeforeFirstRound = ["pre_campaign", "campaign", "official_campaign"].includes(
          after.gameState!.phase,
        );
        if (after.pendingScreen === "race" && !isBeforeFirstRound) {
          sawRaceAfterFirstRound = true;
        }
      } else if (snapshot.screen === "outcome") {
        if (snapshot.pendingScreen === "race") {
          const isBeforeFirstRound = ["pre_campaign", "campaign", "official_campaign"].includes(
            gs.phase,
          );
          if (!isBeforeFirstRound) sawRaceAfterFirstRound = true;
        }
        snapshot.continueAfterOutcome();
      } else if (snapshot.screen === "race") {
        // Legitimate before the first round (a poll bulletin mid-campaign);
        // a bug if it shows up once the race is already decided.
        const isBeforeFirstRound = ["pre_campaign", "campaign", "official_campaign"].includes(
          gs.phase,
        );
        if (!isBeforeFirstRound) sawRaceAfterFirstRound = true;
        snapshot.closeRace();
      } else if (snapshot.screen === "first_round") {
        if (!sawFirstRound) {
          sawFirstRound = true;
          pollCountAtFirstRound = gs.pollHistory.length;
        }
        snapshot.continueAfterMilestone();
      } else if (snapshot.screen === "runoff_intro") {
        snapshot.continueFromRunoffIntro();
      } else if (snapshot.screen === "second_round") {
        snapshot.continueAfterMilestone();
      } else {
        break;
      }
      guard += 1;
    }

    expect(sawFirstRound).toBe(true);
    // Sanity check that the scenario actually exercises the bug condition:
    // more polls really are generated after the first round is decided.
    expect(useGameStore.getState().gameState!.pollHistory.length).toBeGreaterThan(
      pollCountAtFirstRound,
    );
    expect(sawRaceAfterFirstRound).toBe(false);
  });
});
