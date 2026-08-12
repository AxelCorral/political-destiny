import { BRANDING } from "@/config/branding";
import { GAME_CONFIG } from "@/config/game";
import { gameContent } from "@/game/data";

import type { AnalyticsVersions } from "./events";

/**
 * Analytics payload/table schema version — bump only when the event
 * envelope or table columns change shape, independent of app/engine/content
 * versions below.
 */
export const ANALYTICS_SCHEMA_VERSION = "1";

/**
 * Engine LOGIC version — describes gameplay-affecting engine behavior
 * (probabilities, event/outcome selection weights, scoring formulas,
 * redistribution/runoff logic, etc.). Deliberately a standalone constant,
 * NOT GAME_CONFIG.schemaVersion (that one only versions the *save file*
 * shape and is exposed as saveSchemaVersion below). Bump policy and the
 * distinction from saveSchemaVersion/contentVersion are documented in
 * docs/analytics/VERSIONING_POLICY.md — read that before bumping this.
 */
export const ENGINE_LOGIC_VERSION = "1";

/**
 * Every version field is read from a single existing source of truth
 * (see docs/analytics/VERSIONING_POLICY.md) rather than duplicated as a
 * hardcoded literal here:
 * - appVersion         ← config/branding.ts BRANDING.version (= package.json)
 * - engineVersion      ← ENGINE_LOGIC_VERSION above (gameplay logic, not save shape)
 * - saveSchemaVersion  ← config/game.ts GAME_CONFIG.schemaVersion (save-file compatibility)
 * - contentVersion     ← game/data/index.ts gameContent.contentVersion
 * - buildSha           ← NEXT_PUBLIC_BUILD_SHA (set by the deploy platform)
 */
export function getAnalyticsVersions(): AnalyticsVersions {
  return {
    appVersion: BRANDING.version,
    engineVersion: ENGINE_LOGIC_VERSION,
    saveSchemaVersion: String(GAME_CONFIG.schemaVersion),
    contentVersion: String(gameContent.contentVersion),
    analyticsSchemaVersion: ANALYTICS_SCHEMA_VERSION,
    buildSha: process.env.NEXT_PUBLIC_BUILD_SHA?.trim() || "dev",
  };
}
