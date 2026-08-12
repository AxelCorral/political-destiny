import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { AnalyticsEventName, AnalyticsVersions } from "./events";

const DATABASE_NAME = "vers-lelysee-analytics";
const DATABASE_VERSION = 1;
const ANONYMOUS_USER_ID_KEY = "anonymous_user_id";

/**
 * Overflow strategy: once the queue exceeds MAX_QUEUE_SIZE, the oldest
 * queued event is dropped to make room for the new one. This can only
 * happen if the ingestion endpoint has been unreachable for a very long
 * time; losing the oldest, least-actionable events is preferable to
 * growing IndexedDB usage without bound or blocking gameplay.
 */
export const MAX_QUEUE_SIZE = 2_000;
export const MAX_DELIVERY_ATTEMPTS = 5;

export interface QueuedAnalyticsEvent {
  queueKey?: number;
  eventUuid: string;
  eventType: AnalyticsEventName;
  anonymousUserId: string;
  sessionId: string;
  runId?: string;
  clientSequence: number;
  occurredAt: string;
  payload: Record<string, unknown>;
  versions: AnalyticsVersions;
  experimentId?: string;
  variantId?: string;
  enqueuedAt: string;
  attempts: number;
}

interface AnalyticsDatabaseSchema extends DBSchema {
  identity: { key: string; value: string };
  queue: {
    key: number;
    value: QueuedAnalyticsEvent;
    indexes: { "by-enqueued-at": string };
  };
}

let databasePromise: Promise<IDBPDatabase<AnalyticsDatabaseSchema>> | undefined;

function database(): Promise<IDBPDatabase<AnalyticsDatabaseSchema>> {
  databasePromise ??= openDB<AnalyticsDatabaseSchema>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("identity")) db.createObjectStore("identity");
      if (!db.objectStoreNames.contains("queue")) {
        const queue = db.createObjectStore("queue", {
          keyPath: "queueKey",
          autoIncrement: true,
        });
        queue.createIndex("by-enqueued-at", "enqueuedAt");
      }
    },
  });
  return databasePromise;
}

export async function getOrCreateAnonymousUserId(createId: () => string): Promise<string> {
  const db = await database();
  const existing = await db.get("identity", ANONYMOUS_USER_ID_KEY);
  if (existing) return existing;
  const created = createId();
  await db.put("identity", created, ANONYMOUS_USER_ID_KEY);
  return created;
}

export async function enqueueEvent(event: QueuedAnalyticsEvent): Promise<void> {
  const db = await database();
  const tx = db.transaction("queue", "readwrite");
  await tx.store.add(event);
  const count = await tx.store.count();
  if (count > MAX_QUEUE_SIZE) {
    const oldest = await tx.store.index("by-enqueued-at").openCursor();
    if (oldest) await oldest.delete();
  }
  await tx.done;
}

export async function peekBatch(limit: number): Promise<QueuedAnalyticsEvent[]> {
  const db = await database();
  const all = await db.getAllFromIndex("queue", "by-enqueued-at");
  return all.slice(0, limit);
}

export async function removeEvents(queueKeys: number[]): Promise<void> {
  if (queueKeys.length === 0) return;
  const db = await database();
  const tx = db.transaction("queue", "readwrite");
  await Promise.all(queueKeys.map((key) => tx.store.delete(key)));
  await tx.done;
}

/**
 * Marks a failed batch for retry. Events that have exhausted
 * MAX_DELIVERY_ATTEMPTS are dropped rather than retried forever.
 */
export async function bumpAttemptsOrDrop(events: QueuedAnalyticsEvent[]): Promise<void> {
  const db = await database();
  const tx = db.transaction("queue", "readwrite");
  for (const event of events) {
    if (event.queueKey === undefined) continue;
    const attempts = event.attempts + 1;
    if (attempts >= MAX_DELIVERY_ATTEMPTS) {
      await tx.store.delete(event.queueKey);
    } else {
      await tx.store.put({ ...event, attempts });
    }
  }
  await tx.done;
}

export async function clearQueue(): Promise<void> {
  const db = await database();
  await db.clear("queue");
}

export async function queueSize(): Promise<number> {
  const db = await database();
  return db.count("queue");
}
