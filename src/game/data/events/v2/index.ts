import type { GameEventDefinition } from "@/game/types";

import { v2AllianceEvents } from "./alliances";
import { v2CampaignEvents } from "./campaign";
import { v2CustomPartyEvents } from "./customParty";
import { v2DebateEvents } from "./debates";
import { v2EndgameEvents } from "./endgame";
import { v2EndorsementEvents } from "./endorsements";
import { v2InternalEvents } from "./internal";
import { applyIdeologicalEligibility } from "./ideologyEligibility";
import { v2MediaEvents } from "./media";
import { v2OpponentInteractionEvents } from "./opponentInteractions";
import { v2EcologistesPartyEvents } from "./partiesEcologistes";
import { v2HorizonsPartyEvents } from "./partiesHorizons";
import { v2LeftPartyEvents } from "./partiesLeft";
import { v2LrPartyEvents } from "./partiesLr";
import { v2NouvelleEnergiePartyEvents } from "./partiesNouvelleEnergie";
import { v2PsPartyEvents } from "./partiesPs";
import { v2ReconquetePartyEvents } from "./partiesReconquete";
import { v2RenaissancePartyEvents } from "./partiesRenaissance";
import { v2RnPartyEvents } from "./partiesRn";
import { v2ProgramEvents } from "./program";
import { v2RareEvents } from "./rare";
import { v2ScandalEvents } from "./scandals";
import { v2SocietyImmigrationEvents } from "./societyImmigration";
import { v2WorldEvents } from "./world";

export const v2PartyEvents: GameEventDefinition[] = [
  ...v2LeftPartyEvents,
  ...v2PsPartyEvents,
  ...v2EcologistesPartyEvents,
  ...v2RenaissancePartyEvents,
  ...v2HorizonsPartyEvents,
  ...v2LrPartyEvents,
  ...v2RnPartyEvents,
  ...v2ReconquetePartyEvents,
  ...v2NouvelleEnergiePartyEvents,
];

const authoredV2Events: GameEventDefinition[] = [
  ...v2CampaignEvents,
  ...v2MediaEvents,
  ...v2ProgramEvents,
  ...v2SocietyImmigrationEvents,
  ...v2DebateEvents,
  ...v2InternalEvents,
  ...v2AllianceEvents,
  ...v2EndorsementEvents,
  ...v2OpponentInteractionEvents,
  ...v2ScandalEvents,
  ...v2WorldEvents,
  ...v2RareEvents,
  ...v2CustomPartyEvents,
  ...v2PartyEvents,
  ...v2EndgameEvents,
];

export const v2Events: GameEventDefinition[] = applyIdeologicalEligibility(authoredV2Events);

export {
  v2AllianceEvents,
  v2CampaignEvents,
  v2CustomPartyEvents,
  v2DebateEvents,
  v2EndgameEvents,
  v2EndorsementEvents,
  v2InternalEvents,
  v2MediaEvents,
  v2OpponentInteractionEvents,
  v2ProgramEvents,
  v2RareEvents,
  v2ScandalEvents,
  v2SocietyImmigrationEvents,
  v2WorldEvents,
};
