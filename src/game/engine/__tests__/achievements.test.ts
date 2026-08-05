import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";
import type { AchievementDefinition } from "@/game/types";

import { achievementMatches, achievementProgress, evaluateAchievements } from "../achievements";
import { simulateFirstRound } from "../election";
import { createGame } from "../game";
import { scoreGame } from "../scoring";

function achievement(
  id: string,
  conditions: NonNullable<AchievementDefinition["criteria"]>["conditions"],
): AchievementDefinition {
  return {
    id,
    title: id,
    description: `Condition testée pour ${id}.`,
    category: "records",
    icon: "✓",
    criteria: { mode: "all", conditions },
  };
}

describe("succès pilotés par les données", () => {
  it("évalue la croissance des adhérents par rapport au départ", () => {
    const initial = createGame(
      { seed: "badge-members", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const state = simulateFirstRound(initial, testContent.electorateBlocs).state;
    const definition = achievement("member_growth", [
      { metric: "member_growth", operator: "gte", value: 50_000 },
    ]);
    const finalResult = scoreGame(state, [], testContent.endings);

    state.parties.alpha!.stats.members = Number(state.flags.initialMembers) + 49_900;
    expect(achievementMatches(definition, state, finalResult)).toBe(false);
    expect(achievementProgress(definition, state, finalResult)).toEqual({
      current: 49_900,
      target: 50_000,
      ratio: 0.998,
    });
    state.parties.alpha!.stats.members += 100;
    expect(achievementMatches(definition, state, finalResult)).toBe(true);
  });

  it("débloque les critères de fin et de score avec le résultat calculé", () => {
    const initial = createGame(
      { seed: "badge-ending", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const state = simulateFirstRound(initial, testContent.electorateBlocs).state;
    state.flags.kingmaker = true;
    const endingBadge = achievement("ending", [
      { metric: "ending_id", operator: "eq", value: "kingmaker" },
    ]);
    const scoreBadge = achievement("score", [{ metric: "score", operator: "gte", value: 1 }]);
    const result = scoreGame(state, [endingBadge, scoreBadge], testContent.endings);

    expect(result.endingId).toBe("kingmaker");
    expect(evaluateAchievements(state, [endingBadge, scoreBadge], result)).toEqual([
      "ending",
      "score",
    ]);
    expect(result.unlockedAchievementIds).toContain("ending");
    expect(result.unlockedAchievementIds).toContain("score");
  });
});
