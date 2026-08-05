import type { GameEventDefinition } from "@/game/types";

import { endgameEvents } from "./endgame";
import { generalEvents } from "./general";
import { internalEvents } from "./internal";
import { partySpecificEvents } from "./partySpecific";
import { worldEvents } from "./world";

export const events: GameEventDefinition[] = [
  ...generalEvents,
  ...internalEvents,
  ...worldEvents,
  ...partySpecificEvents,
  ...endgameEvents,
];

export { endgameEvents, generalEvents, internalEvents, partySpecificEvents, worldEvents };
