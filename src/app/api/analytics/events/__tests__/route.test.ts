import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createFakeSupabaseClient,
  FakeSupabaseStore,
} from "@/analytics/server/__tests__/fakeSupabase";

const versions = {
  appVersion: "0.1.0",
  engineVersion: "2",
  contentVersion: "2",
  analyticsSchemaVersion: "1",
  buildSha: "test-sha",
};

function validEvent(overrides: Record<string, unknown> = {}) {
  return {
    eventUuid: "00000000-0000-4000-8000-000000000001",
    eventType: "run_started",
    anonymousUserId: "00000000-0000-4000-8000-0000000000aa",
    sessionId: "00000000-0000-4000-8000-0000000000bb",
    runId: "run-1",
    clientSequence: 1,
    occurredAt: "2026-08-12T10:00:00.000Z",
    payload: { mode: "existing_party", partyId: "lfi", seed: "abc" },
    versions,
    ...overrides,
  };
}

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/analytics/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/analytics/events", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/analytics/server/supabaseAdmin");
  });

  it("répond 400 sur un JSON invalide", async () => {
    vi.doMock("@/analytics/server/supabaseAdmin", () => ({
      isAnalyticsStorageConfigured: () => false,
      getSupabaseAdminClient: () => undefined,
    }));
    const { POST } = await import("../route");
    const response = await POST(postRequest("{not json"));
    expect(response.status).toBe(400);
  });

  it("répond 400 si le lot est vide ou dépasse 50 événements", async () => {
    vi.doMock("@/analytics/server/supabaseAdmin", () => ({
      isAnalyticsStorageConfigured: () => false,
      getSupabaseAdminClient: () => undefined,
    }));
    const { POST } = await import("../route");
    expect((await POST(postRequest({ events: [] }))).status).toBe(400);
    const tooMany = Array.from({ length: 51 }, (_, index) =>
      validEvent({
        eventUuid: `00000000-0000-4000-8000-0000000000${String(index).padStart(2, "0")}`,
      }),
    );
    expect((await POST(postRequest({ events: tooMany }))).status).toBe(400);
  });

  it("accepte les événements valides sans stockage configuré (fail-open)", async () => {
    vi.doMock("@/analytics/server/supabaseAdmin", () => ({
      isAnalyticsStorageConfigured: () => false,
      getSupabaseAdminClient: () => undefined,
    }));
    const { POST } = await import("../route");
    const response = await POST(postRequest({ events: [validEvent()] }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.stored).toBe(false);
    expect(body.accepted).toBe(1);
  });

  it("rejette un événement individuellement invalide sans faire échouer le lot", async () => {
    vi.doMock("@/analytics/server/supabaseAdmin", () => ({
      isAnalyticsStorageConfigured: () => false,
      getSupabaseAdminClient: () => undefined,
    }));
    const { POST } = await import("../route");
    const response = await POST(
      postRequest({
        events: [
          validEvent(),
          validEvent({ eventUuid: "not-a-uuid" }),
          validEvent({
            eventUuid: "00000000-0000-4000-8000-000000000002",
            payload: { mode: "not_a_real_mode", partyId: "lfi", seed: "abc" },
          }),
        ],
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.accepted).toBe(1);
    expect(body.rejected).toHaveLength(2);
  });

  it("stocke via Supabase quand la configuration est présente", async () => {
    const store = new FakeSupabaseStore();
    const client = createFakeSupabaseClient(store);
    vi.doMock("@/analytics/server/supabaseAdmin", () => ({
      isAnalyticsStorageConfigured: () => true,
      getSupabaseAdminClient: () => client,
    }));
    const { POST } = await import("../route");
    const response = await POST(postRequest({ events: [validEvent()] }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.stored).toBe(true);
    expect(store.runs.get("run-1")?.party_id).toBe("lfi");
  });

  it("est idempotent au niveau HTTP (même event_uuid soumis deux fois)", async () => {
    const store = new FakeSupabaseStore();
    const client = createFakeSupabaseClient(store);
    vi.doMock("@/analytics/server/supabaseAdmin", () => ({
      isAnalyticsStorageConfigured: () => true,
      getSupabaseAdminClient: () => client,
    }));
    const { POST } = await import("../route");
    await POST(postRequest({ events: [validEvent()] }));
    await POST(postRequest({ events: [validEvent()] }));
    expect(store.events.size).toBe(1);
  });
});
