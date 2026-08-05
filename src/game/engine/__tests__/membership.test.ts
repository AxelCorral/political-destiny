import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";

import { createGame } from "../game";
import { evolveMembership } from "../membership";

describe("évolution des adhésions", () => {
  it("réagit au bilan politique de la décision sans consommer le PRNG", () => {
    const state = createGame(
      { seed: "adhesions", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const initialMembers = state.parties.alpha!.stats.members;
    const positive = evolveMembership(state, [
      { kind: "party_stat", stat: "popularity", delta: 6 },
      { kind: "party_stat", stat: "mobilization", delta: 5 },
      { kind: "alliance", partyId: "player", withPartyId: "beta", action: "add" },
    ]);
    const negative = evolveMembership(state, [
      { kind: "party_stat", stat: "popularity", delta: -6 },
      { kind: "party_stat", stat: "cohesion", delta: -5 },
      { kind: "party_split", partyId: "player" },
    ]);

    expect(positive.parties.alpha!.stats.members).toBeGreaterThan(initialMembers);
    expect(positive.parties.alpha!.stats.members).toBeGreaterThan(
      negative.parties.alpha!.stats.members,
    );
    expect(positive.rng).toEqual(state.rng);
    expect(state.parties.alpha!.stats.members).toBe(initialMembers);
  });
});
