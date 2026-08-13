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

  it("met en file par défaut, sans action explicite (opt-out)", async () => {
    track("session_started", undefined, { entryPath: "/" });
    await settle();
    expect(await queueSize()).toBe(1);
  });

  it("n'enregistre rien après un refus explicite", async () => {
    await setAnalyticsConsent("denied");
    track("session_started", undefined, { entryPath: "/" });
    await settle();
    expect(await queueSize()).toBe(0);
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

  it("flush() ne fait rien après un refus explicite", async () => {
    await setAnalyticsConsent("denied");
    vi.stubGlobal("fetch", vi.fn());
    await flush();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("flush() renvoie les événements mis en file pendant qu'un flush réseau est déjà en vol", async () => {
    // Regression test for a real bug found in Phase 3 remote enablement:
    // against a near-instant/no-op backend, a concurrent flush() call
    // returning the in-flight promise (instead of re-checking the queue
    // afterwards) was never observable — the in-flight fetch always
    // resolved before anything new could be enqueued. Against a real
    // Supabase round-trip (hundreds of ms), an event tracked while the
    // first flush is still in flight used to sit unsent until the next
    // externally-triggered flush (up to the 30s AnalyticsProvider
    // interval).
    await setAnalyticsConsent("granted");
    track("session_started", undefined, { entryPath: "/" });
    await settle();

    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) =>
          setTimeout(() => resolve(new Response(null, { status: 200 })), 100),
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const firstFlush = flush();
    // Enqueue a second event while the first flush's fetch is still
    // in flight (the mock resolves after 100ms).
    track("player_dashboard_opened", undefined, { phase: "campaign", decisionIndex: 0 });
    await settle();
    // Both events are still queued: the first flush's fetch hasn't resolved
    // yet (100ms mock delay), so nothing has been removed.
    expect(await queueSize()).toBe(2);

    const secondFlush = flush(); // must chain, not just return firstFlush
    await Promise.all([firstFlush, secondFlush]);

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(await queueSize()).toBe(0);
  });
});
