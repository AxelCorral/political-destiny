import type { GameContent } from "@/game/types";

import { achievements } from "./achievements";
import { actors } from "./actors";
import { campaignMethods } from "./campaignMethods";
import { candidateProfiles } from "./candidateProfiles";
import { electorateBlocs } from "./electorate";
import { endings } from "./endings";
import { entities } from "./entities";
import { events } from "./events";
import { majorEndorsements } from "./majorEndorsements";
import { nationalFigures } from "./nationalFigures";
import { parties } from "./parties";
import { worldFigures } from "./worldFigures";

export const gameContent: GameContent = {
  contentVersion: 2,
  parties,
  actors,
  electorateBlocs,
  events,
  methods: campaignMethods,
  achievements,
  endings,
  entities,
  candidateProfiles,
  worldFigures,
  nationalFigures,
  majorEndorsements,
};

export * from "./achievements";
export * from "./actors";
export * from "./campaignMethods";
export * from "./candidateProfiles";
export * from "./customParty";
export * from "./electorate";
export * from "./endings";
export * from "./entities";
export * from "./events";
export * from "./majorEndorsements";
export * from "./nationalFigures";
export * from "./parties";
export * from "./politicalCurrents";
export * from "./realWorldSnapshot/snapshot";
export * from "./worldFigures";
