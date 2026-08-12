import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import {
  bumpAttemptsOrDrop,
  clearQueue,
  enqueueEvent,
  MAX_DELIVERY_ATTEMPTS,
  peekBatch,
  queueSize,
  removeEvents,
  type QueuedAnalyticsEvent,
} from "../storage";

const versions = {
  appVersion: "0.1.0",
  engineVersion: "2",
  contentVersion: "2",
  analyticsSchemaVersion: "1",
  buildSha: "test-sha",
};

function makeEvent(overrides: Partial<QueuedAnalyticsEvent> = {}): QueuedAnalyticsEvent {
  return {
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
    ...overrides,
  };
}

describe("file d'attente analytics (IndexedDB)", () => {
  beforeEach(async () => {
    await clearQueue();
  });

  it("conserve l'ordre FIFO d'enqueue", async () => {
    await enqueueEvent(makeEvent({ clientSequence: 1 }));
    await enqueueEvent(makeEvent({ clientSequence: 2 }));
    await enqueueEvent(makeEvent({ clientSequence: 3 }));
    const batch = await peekBatch(10);
    expect(batch.map((event) => event.clientSequence)).toEqual([1, 2, 3]);
  });

  it("retire uniquement les événements dont la clé est fournie", async () => {
    await enqueueEvent(makeEvent({ clientSequence: 1 }));
    await enqueueEvent(makeEvent({ clientSequence: 2 }));
    const [first, second] = await peekBatch(10);
    await removeEvents([first!.queueKey!]);
    const remaining = await peekBatch(10);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.clientSequence).toBe(second!.clientSequence);
  });

  it("incrémente le compteur de tentatives et abandonne après MAX_DELIVERY_ATTEMPTS", async () => {
    await enqueueEvent(makeEvent({ clientSequence: 1, attempts: 0 }));
    let batch = await peekBatch(10);
    for (let attempt = 1; attempt < MAX_DELIVERY_ATTEMPTS; attempt += 1) {
      await bumpAttemptsOrDrop(batch);
      batch = await peekBatch(10);
      expect(batch).toHaveLength(1);
      expect(batch[0]!.attempts).toBe(attempt);
    }
    await bumpAttemptsOrDrop(batch);
    expect(await queueSize()).toBe(0);
  });

  it("vide entièrement la file sur clearQueue", async () => {
    await enqueueEvent(makeEvent());
    await enqueueEvent(makeEvent());
    await clearQueue();
    expect(await queueSize()).toBe(0);
  });
});
