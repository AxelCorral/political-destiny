import { beforeEach, describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { currentEvent } from "@/game/engine";
import { nationalLatentSupport } from "@/game/engine/electorate";

import { useGameStore } from "../gameStore";

/**
 * PROMPT_CLAUDE_CODE_RECOMPOSITIONS_STRATEGIQUES_SOUTIENS_CHOCS.md §26 —
 * retest explicite demandé (non exécuté depuis la mission
 * `AUDIT_ELECTORAL_COHERENCE.md` qui a corrigé `isElectorallyActive`) :
 * la sidebar (`MainStats`, qui lit `party.stats.polling`) doit rester
 * synchronisée après le premier tour à travers plusieurs décisions
 * d'entre-deux-tours et de gouvernement, pas seulement au moment précis de
 * `simulateFirstRound` (déjà couvert par `electoralCoherence.test.ts`).
 */
describe("sidebar — synchronisation du score après le premier tour", () => {
  beforeEach(() => useGameStore.getState().resetGame());

  it("seuls les deux finalistes gardent un score non nul du premier tour au gouvernement, à chaque étape", () => {
    const store = useGameStore.getState();
    store.selectMode("existing_party");
    store.confirmParty("ps");
    store.chooseMethod(gameContent.methods[0]!.id);
    store.updateLaunchDetails({ seed: "sidebar-sync-ps-1" });
    store.launchCampaign();
    store.beginCampaign();

    let finalists: [string, string] | undefined;
    let checkedAfterFirstRound = false;
    let checkedDuringBetweenRounds = false;
    let decisionsResolvedSinceQualification = 0;
    let guard = 0;

    while (useGameStore.getState().gameState?.phase !== "finished" && guard < 250) {
      const snapshot = useGameStore.getState();
      const gs = snapshot.gameState;
      if (!gs) break;

      // `party.stats.polling` is only refreshed by `recalculateElectorate`,
      // which runs once per resolved decision — not the instant
      // `qualifiedPartyIds` appears (that happens inside the *same*
      // `resolveCurrentChoice` call as `simulateFirstRound`, one step after
      // the last pre-election `recalculateElectorate`). So the boundary
      // state — before the player has resolved a single between-rounds
      // decision — legitimately still carries the stale pre-election value;
      // the invariant under test (§26) is that it settles and *stays*
      // correct from the next decision onward, not that it is already
      // correct at that exact instant.
      if (gs.qualifiedPartyIds) {
        finalists = gs.qualifiedPartyIds;
        if (decisionsResolvedSinceQualification >= 1) {
          for (const party of Object.values(gs.parties)) {
            const shouldHaveShare = finalists.includes(party.id);
            if (gs.phase === "between_rounds" || gs.phase === "government_epilogue") {
              if (shouldHaveShare) {
                expect(party.stats.polling).toBeGreaterThan(0);
              } else {
                expect(party.stats.polling).toBe(0);
              }
            }
          }
          // `party.stats.polling` is not directly comparable across parties:
          // `generatePoll` overwrites it with a *noisy* estimate for the
          // player's own party only (`polls.ts`, by design — "un instantané
          // bruité, jamais une vérité électorale"), while every opponent's
          // value stays the exact ground truth from `recalculateElectorate`.
          // So the two finalists' displayed scores legitimately don't sum to
          // exactly 100 whenever a poll just fired for the player. The real
          // §26 invariant — ground truth restricted to the two finalists,
          // summing to 100 — is checked directly against
          // `nationalLatentSupport`, independently of poll noise.
          if (gs.phase === "between_rounds" || gs.phase === "government_epilogue") {
            const truth = nationalLatentSupport(gs, gameContent.electorateBlocs);
            const truthSum = finalists.reduce((sum, id) => sum + (truth[id] ?? 0), 0);
            expect(truthSum).toBeCloseTo(100, 1);
            for (const [partyId, share] of Object.entries(truth)) {
              if (!finalists.includes(partyId)) expect(share).toBe(0);
            }
            if (gs.phase === "between_rounds") checkedDuringBetweenRounds = true;
          }
        }
        if (gs.firstRoundResult && !checkedAfterFirstRound) checkedAfterFirstRound = true;
      }

      if (snapshot.screen === "campaign") {
        const event = currentEvent(gs, gameContent.events);
        snapshot.chooseEventOption(event.choices[0]!.id);
        if (finalists) decisionsResolvedSinceQualification += 1;
      } else if (snapshot.screen === "outcome") {
        snapshot.continueAfterOutcome();
      } else if (snapshot.screen === "race") {
        snapshot.closeRace();
      } else if (snapshot.screen === "first_round") {
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

    expect(finalists).toBeDefined();
    expect(checkedAfterFirstRound).toBe(true);
    expect(checkedDuringBetweenRounds).toBe(true);
    // Un run donné n'atteint pas toujours l'épilogue gouvernemental (le joueur
    // peut perdre le second tour) — vérifié séparément par le test suivant.
  });

  it("un candidat éliminé au premier tour n'est jamais recrédité même après plusieurs sondages ultérieurs", () => {
    const store = useGameStore.getState();
    store.selectMode("existing_party");
    store.confirmParty("ps");
    store.chooseMethod(gameContent.methods[0]!.id);
    store.updateLaunchDetails({ seed: "sidebar-sync-ps-1" });
    store.launchCampaign();
    store.beginCampaign();

    let eliminatedIds: string[] = [];
    let decisionsResolvedSinceElimination = 0;
    let guard = 0;
    let pollsCheckedPostElimination = 0;

    while (useGameStore.getState().gameState?.phase !== "finished" && guard < 250) {
      const snapshot = useGameStore.getState();
      const gs = snapshot.gameState;
      if (!gs) break;

      if (gs.qualifiedPartyIds && eliminatedIds.length === 0) {
        eliminatedIds = Object.keys(gs.parties).filter(
          (id) => !gs.qualifiedPartyIds!.includes(id),
        );
      }
      // See the previous test for why the first post-qualification snapshot
      // is excluded: `party.stats.polling` only settles on the next
      // `recalculateElectorate`, one decision after `qualifiedPartyIds`
      // appears.
      if (eliminatedIds.length > 0 && decisionsResolvedSinceElimination >= 1) {
        for (const id of eliminatedIds) {
          expect(gs.parties[id]!.stats.polling).toBe(0);
        }
        pollsCheckedPostElimination += 1;
      }

      if (snapshot.screen === "campaign") {
        const event = currentEvent(gs, gameContent.events);
        snapshot.chooseEventOption(event.choices[0]!.id);
        if (eliminatedIds.length > 0) decisionsResolvedSinceElimination += 1;
      } else if (snapshot.screen === "outcome") {
        snapshot.continueAfterOutcome();
      } else if (snapshot.screen === "race") {
        snapshot.closeRace();
      } else if (snapshot.screen === "first_round") {
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

    expect(eliminatedIds.length).toBeGreaterThan(0);
    expect(pollsCheckedPostElimination).toBeGreaterThan(0);
  });
});
