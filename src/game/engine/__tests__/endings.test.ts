import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";

import { determineEndingId } from "../endings";
import { simulateFirstRound } from "../election";
import { createGame } from "../game";

function completedState(seed: string) {
  const initial = createGame(
    { seed, mode: "existing_party", partyId: "alpha", methodId: "field" },
    testContent,
  );
  return simulateFirstRound(initial, testContent.electorateBlocs).state;
}

describe("fins de trajectoire", () => {
  it("exige plusieurs marqueurs avant l’union nationale secrète", () => {
    const state = completedState("ending-union");
    state.flags.national_union_limited = true;
    expect(determineEndingId(state)).not.toBe("secret_national_union");
    state.flags.coalition_five_conditions = true;
    state.parties.alpha!.alliedWith = ["beta", "gamma"];
    expect(determineEndingId(state)).toBe("secret_national_union");
  });

  it("réserve la mise en retrait à une alerte ignorée et une fatigue déjà élevée", () => {
    const state = completedState("ending-fatigue");
    state.flags.voice_lost_on_stage = true;
    state.parties.alpha!.hidden.fatigue = 24;
    expect(determineEndingId(state)).not.toBe("secret_civil_unrest");
    state.parties.alpha!.hidden.fatigue = 25;
    expect(determineEndingId(state)).toBe("secret_civil_unrest");
  });
});
