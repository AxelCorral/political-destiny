import type { GameContent } from "@/game/types";

import { achievements } from "./achievements";
import { actors } from "./actors";
import { campaignMethods } from "./campaignMethods";
import { electorateBlocs } from "./electorate";
import { endings } from "./endings";
import { entities } from "./entities";
import { events } from "./events";
import { parties } from "./parties";

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
};

export * from "./achievements";
export * from "./actors";
export * from "./campaignMethods";
export * from "./customParty";
export * from "./electorate";
export * from "./endings";
export * from "./entities";
export * from "./events";
export * from "./parties";
export * from "./politicalCurrents";
export * from "./realWorldSnapshot/snapshot";
