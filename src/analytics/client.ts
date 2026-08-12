import { getAnalyticsMode } from "./config";
import { getAnalyticsConsent } from "./consent";
import type { AnalyticsEventName, AnalyticsEventPayload } from "./events";
import { getOrCreateAnonymousUserId, getOrCreateSessionId, newEventUuid } from "./identity";
import {
  bumpAttemptsOrDrop,
  enqueueEvent,
  peekBatch,
  removeEvents,
  type QueuedAnalyticsEvent,
} from "./storage";
import { getAnalyticsVersions } from "./versions";

const INGESTION_ENDPOINT = "/api/analytics/events";
const BATCH_SIZE = 50;

let clientSequence = 0;
let flushInFlight: Promise<void> | undefined;

function nextClientSequence(): number {
  clientSequence += 1;
  return clientSequence;
}

function warnInDev(message: string): void {
  if (process.env.NODE_ENV !== "production") console.warn(`[analytics] ${message}`);
}

/**
 * The one function the rest of the app calls. Never throws, never returns a
 * value the caller needs to await, and never blocks rendering: enqueueing
 * happens in a fire-and-forget microtask, so a slow or unavailable
 * IndexedDB cannot stall a gameplay interaction. This is what makes
 * "the game keeps working if the whole analytics layer is down" true by
 * construction, not just by convention.
 */
export function track<Name extends AnalyticsEventName>(
  eventType: Name,
  runId: string | undefined,
  payload: AnalyticsEventPayload<Name>,
): void {
  if (getAnalyticsMode() === "off") return;
  void trackAsync(eventType, runId, payload).catch(() => {
    warnInDev(`failed to enqueue "${eventType}"`);
  });
}

async function trackAsync<Name extends AnalyticsEventName>(
  eventType: Name,
  runId: string | undefined,
  payload: AnalyticsEventPayload<Name>,
): Promise<void> {
  const consent = await getAnalyticsConsent();
  if (consent !== "granted") return;
  const [anonymousUserId, versions] = await Promise.all([
    getOrCreateAnonymousUserId(),
    Promise.resolve(getAnalyticsVersions()),
  ]);
  const now = new Date().toISOString();
  const event: QueuedAnalyticsEvent = {
    eventUuid: newEventUuid(),
    eventType,
    anonymousUserId,
    sessionId: getOrCreateSessionId(),
    runId,
    clientSequence: nextClientSequence(),
    occurredAt: now,
    payload,
    versions,
    enqueuedAt: now,
    attempts: 0,
  };
  await enqueueEvent(event);
  scheduleFlush();
}

function scheduleFlush(): void {
  if (typeof window === "undefined") return;
  window.setTimeout(() => void flush(), 250);
}

function toWireEvent(event: QueuedAnalyticsEvent) {
  return {
    eventUuid: event.eventUuid,
    eventType: event.eventType,
    anonymousUserId: event.anonymousUserId,
    sessionId: event.sessionId,
    runId: event.runId,
    clientSequence: event.clientSequence,
    occurredAt: event.occurredAt,
    payload: event.payload,
    versions: event.versions,
    experimentId: event.experimentId,
    variantId: event.variantId,
  };
}

/**
 * Sends up to BATCH_SIZE queued events. Called on a short delay after each
 * track(), on an interval, on "online", and once at startup — see
 * AnalyticsProvider. Failures increment a per-event attempt counter and are
 * retried later; events are only ever dropped after MAX_DELIVERY_ATTEMPTS
 * (storage.ts), never on a single failure.
 */
export async function flush(): Promise<void> {
  if (typeof window === "undefined") return;
  if (getAnalyticsMode() === "off") return;
  if ((await getAnalyticsConsent()) !== "granted") return;
  if (flushInFlight) return flushInFlight;
  flushInFlight = doFlush().finally(() => {
    flushInFlight = undefined;
  });
  return flushInFlight;
}

async function doFlush(): Promise<void> {
  const batch = await peekBatch(BATCH_SIZE);
  if (batch.length === 0) return;
  let response: Response | undefined;
  try {
    response = await fetch(INGESTION_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ events: batch.map(toWireEvent) }),
      keepalive: true,
    });
  } catch {
    response = undefined;
  }
  if (response?.ok) {
    const keys = batch
      .map((event) => event.queueKey)
      .filter((key): key is number => key !== undefined);
    await removeEvents(keys);
  } else {
    await bumpAttemptsOrDrop(batch);
    warnInDev(`ingestion request failed (status ${response?.status ?? "network error"})`);
  }
}

/**
 * Best-effort delivery on tab close/hide, via sendBeacon so the browser can
 * complete the send after the page has started unloading. Silently does
 * nothing if consent isn't granted or the queue is empty — read
 * synchronously isn't possible here, so this only fires the request; any
 * failure is invisible to the player by construction (no UI is left to show
 * it to).
 */
export function flushOnPageHide(): void {
  if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") return;
  if (getAnalyticsMode() === "off") return;
  void getAnalyticsConsent().then((consent) => {
    if (consent !== "granted") return;
    void peekBatch(BATCH_SIZE).then((batch) => {
      if (batch.length === 0) return;
      const blob = new Blob([JSON.stringify({ events: batch.map(toWireEvent) })], {
        type: "application/json",
      });
      const sent = navigator.sendBeacon(INGESTION_ENDPOINT, blob);
      if (sent) {
        const keys = batch
          .map((event) => event.queueKey)
          .filter((key): key is number => key !== undefined);
        void removeEvents(keys);
      }
    });
  });
}
