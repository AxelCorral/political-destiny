import type { GameEventDefinition, PoliticalTopic } from "@/game/types";

import { event, type AuthoredEventInput } from "../authoring";

type PartyEventInput = Omit<
  AuthoredEventInput,
  "category" | "eligibleParties" | "phaseWeights" | "themes"
> & {
  phaseWeights?: GameEventDefinition["phaseWeights"];
  themes: PoliticalTopic[];
};

/** Adds only structural party eligibility; every player-facing string remains authored per event. */
export function partyEvent(partyId: string, input: PartyEventInput): GameEventDefinition {
  return event({
    ...input,
    category: "party",
    eligibleParties: [partyId],
    phaseWeights: input.phaseWeights ?? {
      pre_campaign: 0.45,
      campaign: 1,
      official_campaign: 0.75,
    },
  });
}
