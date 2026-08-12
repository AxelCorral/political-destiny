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
 * Every version field is read from a single existing source of truth
 * (see docs/analytics/ARCHITECTURE_PLAN.md §1) rather than duplicated as a
 * hardcoded literal here:
 * - appVersion        ← config/branding.ts BRANDING.version (= package.json)
 * - engineVersion      ← config/game.ts GAME_CONFIG.schemaVersion
 * - contentVersion     ← game/data/index.ts gameContent.contentVersion
 * - buildSha           ← NEXT_PUBLIC_BUILD_SHA (set by the deploy platform)
 */
export function getAnalyticsVersions(): AnalyticsVersions {
  return {
    appVersion: BRANDING.version,
    engineVersion: String(GAME_CONFIG.schemaVersion),
    contentVersion: String(gameContent.contentVersion),
    analyticsSchemaVersion: ANALYTICS_SCHEMA_VERSION,
    buildSha: process.env.NEXT_PUBLIC_BUILD_SHA?.trim() || "dev",
  };
}
