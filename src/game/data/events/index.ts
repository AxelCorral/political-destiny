import type { GameEventDefinition } from "@/game/types";

import {
  v2CampaignEvents,
  v2EndgameEvents,
  v2Events,
  v2InternalEvents,
  v2PartyEvents,
  v2WorldEvents,
} from "./v2";

export const events: GameEventDefinition[] = v2Events;

// Compatibility aliases for tooling that groups the former V1 modules by broad responsibility.
export const generalEvents = v2CampaignEvents;
export const internalEvents = v2InternalEvents;
export const worldEvents = v2WorldEvents;
export const partySpecificEvents = v2PartyEvents;
export const endgameEvents = v2EndgameEvents;

export * from "./v2";
