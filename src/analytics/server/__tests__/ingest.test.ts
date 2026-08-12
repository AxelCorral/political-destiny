import { describe, expect, it } from "vitest";

import type { AnalyticsEventEnvelope } from "../../events";
import { ingestEvents, recordIngestionBatch } from "../ingest";
import { createFakeSupabaseClient, FakeSupabaseStore } from "./fakeSupabase";

const versions = {
  appVersion: "0.1.0",
  engineVersion: "1",
  saveSchemaVersion: "2",
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

function decisionResolvedPayload(overrides: Record<string, unknown> = {}) {
  return {
    decisionIndex: 0,
    phase: "campaign",
    eventId: "ev-1",
    eventCategory: "campaign",
    choiceId: "ch-1",
    outcomeId: "out-1",
    internalRoll: 0.42,
    playerPollBefore: 20,
    playerPollAfter: 21,
    popularityBefore: 30,
    popularityAfter: 31,
    momentumBefore: 0,
    momentumAfter: 1,
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
        payload: decisionResolvedPayload(),
      }),
    ];

    const result = await ingestEvents(client as never, events);

    expect(result.accepted).toBe(2);
    expect(result.duplicates).toBe(0);
    expect(result.runsTouched).toBe(1);
    const run = store.runs.get("run-1");
    expect(run?.mode).toBe("existing_party");
    expect(run?.party_id).toBe("lfi");
    expect(run?.decisions_count).toBe(1);
    const decision = store.decisions.get("run-1:0");
    expect(decision?.event_id).toBe("ev-1");
    expect(decision?.player_poll_before).toBe(20);
    expect(decision?.player_poll_after).toBe(21);
  });

  it("est idempotent sur un event_uuid déjà vu et rapporte le nombre de doublons", async () => {
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
        payload: decisionResolvedPayload(),
      }),
    ];

    await ingestEvents(client as never, events);
    const second = await ingestEvents(client as never, events);

    expect(store.events.size).toBe(2);
    expect(second.duplicates).toBe(2);
    expect(store.decisions.size).toBe(1);
    expect(store.runs.get("run-1")?.decisions_count).toBe(1);
  });

  it("enregistre la complétion d'un run avec score final", async () => {
    const store = new FakeSupabaseStore();
    const client = createFakeSupabaseClient(store);

    await ingestEvents(client as never, [
      envelope({
        eventUuid: "00000000-0000-4000-8000-000000000003",
        eventType: "run_started",
        clientSequence: 1,
        payload: { mode: "existing_party", partyId: "lfi", seed: "abc" },
      }),
      envelope({
        eventUuid: "00000000-0000-4000-8000-000000000004",
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
        eventUuid: "00000000-0000-4000-8000-000000000005",
        eventType: "decision_resolved",
        clientSequence: 1,
        payload: decisionResolvedPayload(),
      }),
    ]);

    const run = store.runs.get("run-1");
    expect(run?.mode).toBeNull();
    expect(run?.party_id).toBeNull();
    expect(run?.decisions_count).toBe(1);
  });

  it("stocke le score T1/T2 et l'adversaire du second tour", async () => {
    const store = new FakeSupabaseStore();
    const client = createFakeSupabaseClient(store);

    await ingestEvents(client as never, [
      envelope({
        eventUuid: "00000000-0000-4000-8000-000000000006",
        eventType: "first_round_result",
        clientSequence: 1,
        payload: { score: 22.5, playerRank: 1, qualified: true, turnout: 0.72 },
      }),
      envelope({
        eventUuid: "00000000-0000-4000-8000-000000000007",
        eventType: "second_round_result",
        clientSequence: 2,
        payload: { score: 51.2, playerRank: 1, won: true, opponentPartyId: "rn", turnout: 0.75 },
      }),
    ]);

    const run = store.runs.get("run-1");
    expect(run?.first_round_player_score).toBe(22.5);
    expect(run?.second_round_player_score).toBe(51.2);
    expect(run?.runoff_opponent_party_id).toBe("rn");
    expect(run?.first_round_turnout).toBe(0.72);
    expect(run?.second_round_turnout).toBe(0.75);
  });

  it("enrichit une décision de façon cohérente et idempotente quel que soit l'ordre d'arrivée (resolved -> viewed -> selected)", async () => {
    const store = new FakeSupabaseStore();
    const client = createFakeSupabaseClient(store);

    // Simulates three separate ingestion requests, deliberately out of the
    // natural viewed->selected->resolved order.
    await ingestEvents(client as never, [
      envelope({
        eventUuid: "00000000-0000-4000-8000-0000000000a1",
        eventType: "decision_resolved",
        clientSequence: 3,
        payload: decisionResolvedPayload(),
      }),
    ]);
    await ingestEvents(client as never, [
      envelope({
        eventUuid: "00000000-0000-4000-8000-0000000000a2",
        eventType: "decision_viewed",
        clientSequence: 1,
        occurredAt: "2026-08-12T09:59:58.000Z",
        payload: {
          decisionIndex: 0,
          phase: "campaign",
          eventId: "ev-1",
          eventCategory: "campaign",
          numberOfAvailableChoices: 3,
          flags: { rare: false, chain: false, decisive: true, risky: false },
        },
      }),
    ]);
    await ingestEvents(client as never, [
      envelope({
        eventUuid: "00000000-0000-4000-8000-0000000000a3",
        eventType: "choice_selected",
        clientSequence: 2,
        occurredAt: "2026-08-12T09:59:59.000Z",
        payload: { decisionIndex: 0, eventId: "ev-1", choiceId: "ch-1" },
      }),
    ]);

    const decision = store.decisions.get("run-1:0");
    expect(decision?.viewed_at).toBe("2026-08-12T09:59:58.000Z");
    expect(decision?.selected_at).toBe("2026-08-12T09:59:59.000Z");
    expect(decision?.resolved_at).toBe("2026-08-12T10:00:00.000Z");
    expect(decision?.number_of_available_choices).toBe(3);
    expect(decision?.flag_decisive).toBe(true);
    expect(decision?.outcome_id).toBe("out-1");
    // occurred_at tracks the most-resolved timestamp known regardless of
    // arrival order.
    expect(decision?.occurred_at).toBe("2026-08-12T10:00:00.000Z");
  });

  it("le compteur de reprises reste correct sous deux requêtes séparées (delta additif)", async () => {
    const store = new FakeSupabaseStore();
    const client = createFakeSupabaseClient(store);
    await ingestEvents(client as never, [
      envelope({
        eventUuid: "00000000-0000-4000-8000-0000000000b1",
        eventType: "run_started",
        clientSequence: 1,
        payload: { mode: "existing_party", partyId: "lfi", seed: "abc" },
      }),
    ]);
    await ingestEvents(client as never, [
      envelope({
        eventUuid: "00000000-0000-4000-8000-0000000000b2",
        eventType: "run_resumed",
        clientSequence: 2,
        payload: { decisionIndex: 3, phase: "campaign" },
      }),
    ]);
    await ingestEvents(client as never, [
      envelope({
        eventUuid: "00000000-0000-4000-8000-0000000000b3",
        eventType: "run_resumed",
        clientSequence: 3,
        payload: { decisionIndex: 5, phase: "campaign" },
      }),
    ]);

    expect(store.runs.get("run-1")?.resumed_count).toBe(2);
  });
});

describe("recordIngestionBatch", () => {
  it("écrit un résumé de lot sans jamais stocker de payload", async () => {
    const store = new FakeSupabaseStore();
    const client = createFakeSupabaseClient(store);

    await recordIngestionBatch(client as never, {
      batchUuid: "00000000-0000-4000-8000-0000000000c1",
      acceptedCount: 3,
      rejectedCount: 1,
      duplicateCount: 0,
      rejectionReasonCodes: ["invalid_payload"],
      processingDurationMs: 12,
    });

    expect(store.ingestionBatches).toHaveLength(1);
    expect(store.ingestionBatches[0]?.accepted_count).toBe(3);
    expect(store.ingestionBatches[0]?.rejection_reason_codes).toEqual(["invalid_payload"]);
    expect(Object.keys(store.ingestionBatches[0] ?? {})).not.toContain("payload");
  });
});
