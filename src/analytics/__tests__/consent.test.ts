import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import { deleteAllLocalData } from "@/lib/storage/game-database";

import { getAnalyticsConsent, setAnalyticsConsent } from "../consent";
import { enqueueEvent, queueSize } from "../storage";

const versions = {
  appVersion: "0.1.0",
  engineVersion: "2",
  saveSchemaVersion: "2",
  contentVersion: "2",
  analyticsSchemaVersion: "1",
  buildSha: "test-sha",
};

describe("consentement analytics", () => {
  beforeEach(async () => {
    await deleteAllLocalData();
  });

  it("vaut « granted » par défaut, avant tout choix explicite (opt-out)", async () => {
    expect(await getAnalyticsConsent()).toBe("granted");
  });

  it("persiste le choix « granted »", async () => {
    await setAnalyticsConsent("granted");
    expect(await getAnalyticsConsent()).toBe("granted");
  });

  it("vide la file d'attente locale au refus", async () => {
    await enqueueEvent({
      eventUuid: crypto.randomUUID(),
      eventType: "decision_resolved",
      anonymousUserId: "user-1",
      sessionId: "session-1",
      clientSequence: 1,
      occurredAt: new Date().toISOString(),
      payload: {},
      versions,
      enqueuedAt: new Date().toISOString(),
      attempts: 0,
    });
    expect(await queueSize()).toBe(1);
    await setAnalyticsConsent("denied");
    expect(await queueSize()).toBe(0);
  });

  it("vide aussi la file au retrait d'un consentement déjà accordé", async () => {
    await setAnalyticsConsent("granted");
    await enqueueEvent({
      eventUuid: crypto.randomUUID(),
      eventType: "decision_resolved",
      anonymousUserId: "user-1",
      sessionId: "session-1",
      clientSequence: 1,
      occurredAt: new Date().toISOString(),
      payload: {},
      versions,
      enqueuedAt: new Date().toISOString(),
      attempts: 0,
    });
    await setAnalyticsConsent("denied");
    expect(await queueSize()).toBe(0);
    expect(await getAnalyticsConsent()).toBe("denied");
  });
});
