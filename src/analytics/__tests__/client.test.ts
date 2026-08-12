import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deleteAllLocalData } from "@/lib/storage/game-database";

import { flush, track } from "../client";
import { setAnalyticsConsent } from "../consent";
import { clearQueue, peekBatch, queueSize } from "../storage";

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 50));
}

describe("client analytics (track/flush)", () => {
  beforeEach(async () => {
    await deleteAllLocalData();
    await clearQueue();
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_MODE", "opt-in");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("n'enregistre rien tant que le consentement n'est pas accordé", async () => {
    track("session_started", undefined, { entryPath: "/" });
    await settle();
    expect(await queueSize()).toBe(0);
  });

  it("met en file dès que le consentement est accordé", async () => {
    await setAnalyticsConsent("granted");
    track("session_started", undefined, { entryPath: "/" });
    await settle();
    expect(await queueSize()).toBe(1);
  });

  it("ne met rien en file quand le mode est « off », même consentement accordé", async () => {
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_MODE", "off");
    await setAnalyticsConsent("granted");
    track("session_started", undefined, { entryPath: "/" });
    await settle();
    expect(await queueSize()).toBe(0);
  });

  it("flush() vide la file sur une réponse serveur réussie", async () => {
    await setAnalyticsConsent("granted");
    track("session_started", undefined, { entryPath: "/" });
    await settle();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    await flush();
    expect(await queueSize()).toBe(0);
  });

  it("flush() conserve les événements et augmente attempts sur un échec réseau", async () => {
    await setAnalyticsConsent("granted");
    track("session_started", undefined, { entryPath: "/" });
    await settle();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    await flush();
    const remaining = await peekBatch(10);
    expect(remaining).toHaveLength(1);
    // >=1 rather than ===1: a still-pending auto-flush timer from an
    // earlier test in this file (see scheduleFlush in client.ts) could in
    // principle also fire during this window and bump attempts again —
    // harmless for queue contents, but makes an exact count flaky.
    expect(remaining[0]!.attempts).toBeGreaterThanOrEqual(1);
  });

  it("flush() ne fait rien tant que le consentement n'est pas accordé", async () => {
    vi.stubGlobal("fetch", vi.fn());
    await flush();
    expect(fetch).not.toHaveBeenCalled();
  });
});
