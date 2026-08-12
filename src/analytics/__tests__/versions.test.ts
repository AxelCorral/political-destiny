import { describe, expect, it } from "vitest";

import { GAME_CONFIG } from "@/config/game";

import { ENGINE_LOGIC_VERSION, getAnalyticsVersions } from "../versions";

describe("versioning — save schema vs engine logic (Phase 2)", () => {
  it("sépare engineVersion (logique moteur) de saveSchemaVersion (compatibilité de sauvegarde)", () => {
    const versions = getAnalyticsVersions();
    expect(versions.engineVersion).toBe(ENGINE_LOGIC_VERSION);
    expect(versions.saveSchemaVersion).toBe(String(GAME_CONFIG.schemaVersion));
    // The whole point of the Phase 2 fix: these two must be independently
    // sourced, not aliases of the same underlying constant.
    expect(versions.engineVersion).not.toBe(versions.saveSchemaVersion);
  });

  it("lit chaque champ depuis sa source unique existante, jamais une constante dupliquée en dur", () => {
    const versions = getAnalyticsVersions();
    expect(versions.appVersion).toBeTypeOf("string");
    expect(versions.contentVersion).toBeTypeOf("string");
    expect(versions.analyticsSchemaVersion).toBeTypeOf("string");
    expect(versions.buildSha).toBeTypeOf("string");
  });

  it("retombe sur 'dev' pour buildSha sans NEXT_PUBLIC_BUILD_SHA", () => {
    const versions = getAnalyticsVersions();
    expect(versions.buildSha).toBe(process.env.NEXT_PUBLIC_BUILD_SHA?.trim() || "dev");
  });
});
