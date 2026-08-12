import { describe, expect, it } from "vitest";

import type { AnalyticsEventEnvelope } from "../../events";
import { ingestEvents } from "../ingest";
import { createFakeSupabaseClient, FakeSupabaseStore } from "./fakeSupabase";

const versions = {
  appVersion: "0.1.0",
  engineVersion: "2",
  contentVersion: "2",
  analyticsSchemaVersion: "1",
  buildSha: "test-sha",
};

function envelope(overrides: Partial<AnalyticsEventEnvelope>): AnalyticsEventEnvelope {
  return {
    eventUuid: "00000000-0000-4000-8000-000000000001",
    eventType: "run_started",
    anonymousUserId: "00000000-0000-4000-8000-0000000000aa",
    sessionId: "00000000-0000-4000-8000-0000000000bb",
    runId: "run-1",
    clientSequence: 1,
    occurredAt: "2026-08-12T10:00:00.000Z",
    payload: {},
    versions,
    ...overrides,
  };
}

describe("ingestEvents", () => {
  it("crée un run et une décision à partir d'un lot valide", async () => {
    const store = new FakeSupabaseStore();
    const client = createFakeSupabaseClient(store);

    const events: AnalyticsEventEnvelope[] = [
      envelope({
        eventUuid: "00000000-0000-4000-8000-000000000001",
        eventType: "run_started",
        clientSequence: 1,
        payload: { mode: "existing_party", partyId: "lfi", methodId: "field", seed: "abc" },
      }),
      envelope({
        eventUuid: "00000000-0000-4000-8000-000000000002",
        eventType: "decision_resolved",
        clientSequence: 2,
        payload: {
          decisionIndex: 0,
          phase: "campaign",
          eventId: "ev-1",
          eventCategory: "campaign",
          choiceId: "ch-1",
          outcomeId: "out-1",
          internalRoll: 0.42,
        },
      }),
    ];

    const result = await ingestEvents(client as never, events);

    expect(result.accepted).toBe(2);
    expect(result.runsTouched).toBe(1);
    const run = store.runs.get("run-1");
    expect(run?.mode).toBe("existing_party");
    expect(run?.party_id).toBe("lfi");
    expect(run?.decisions_count).toBe(1);
    expect(store.decisions.get("run-1:0")?.event_id).toBe("ev-1");
  });

  it("est idempotent sur un event_uuid et un (run_id, decision_index) déjà vus", async () => {
    const store = new FakeSupabaseStore();
    const client = createFakeSupabaseClient(store);
    const events: AnalyticsEventEnvelope[] = [
      envelope({
        eventUuid: "00000000-0000-4000-8000-000000000001",
        eventType: "run_started",
        clientSequence: 1,
        payload: { mode: "existing_party", partyId: "lfi", seed: "abc" },
      }),
      envelope({
        eventUuid: "00000000-0000-4000-8000-000000000002",
        eventType: "decision_resolved",
        clientSequence: 2,
        payload: {
          decisionIndex: 0,
          phase: "campaign",
          eventId: "ev-1",
          eventCategory: "campaign",
          choiceId: "ch-1",
          outcomeId: "out-1",
          internalRoll: 0.42,
        },
      }),
    ];

    await ingestEvents(client as never, events);
    await ingestEvents(client as never, events);

    expect(store.events.size).toBe(2);
    expect(store.decisions.size).toBe(1);
    expect(store.runs.get("run-1")?.decisions_count).toBe(1);
  });

  it("enregistre la complétion d'un run", async () => {
    const store = new FakeSupabaseStore();
    const client = createFakeSupabaseClient(store);
    store.runs.set("run-1", {
      run_id: "run-1",
      mode: "existing_party",
      party_id: "lfi",
      decisions_count: 30,
    });

    await ingestEvents(client as never, [
      envelope({
        eventUuid: "00000000-0000-4000-8000-000000000003",
        eventType: "run_completed",
        clientSequence: 31,
        payload: {
          score: 72.5,
          won: true,
          qualified: true,
          endingId: "ending-victory",
          progressionNormalized: 0.3,
          decisionsCount: 31,
        },
      }),
    ]);

    const run = store.runs.get("run-1");
    expect(run?.completed_at).toBe("2026-08-12T10:00:00.000Z");
    expect(run?.won).toBe(true);
    expect(run?.final_score).toBe(72.5);
    expect(run?.ending_id).toBe("ending-victory");
  });

  it("crée un run minimal (champs inconnus à null) si un événement de décision arrive sans run_started préalable", async () => {
    const store = new FakeSupabaseStore();
    const client = createFakeSupabaseClient(store);

    await ingestEvents(client as never, [
      envelope({
        eventUuid: "00000000-0000-4000-8000-000000000004",
        eventType: "decision_resolved",
        clientSequence: 1,
        payload: {
          decisionIndex: 0,
          phase: "campaign",
          eventId: "ev-1",
          eventCategory: "campaign",
          choiceId: "ch-1",
          outcomeId: "out-1",
          internalRoll: 0.1,
        },
      }),
    ]);

    const run = store.runs.get("run-1");
    expect(run?.mode).toBeNull();
    expect(run?.party_id).toBeNull();
    expect(run?.decisions_count).toBe(1);
  });
});
