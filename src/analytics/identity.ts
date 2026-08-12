import { getOrCreateAnonymousUserId as getOrCreatePersistedAnonymousUserId } from "./storage";

const SESSION_STORAGE_KEY = "vers-lelysee-analytics-session-id";

let cachedSessionId: string | undefined;

/**
 * Independent from the game's RNG (src/game/engine/rng.ts) by design: these
 * ids must never consume or influence gameplay randomness. crypto.randomUUID
 * is the standard Web Crypto API, available in all supported browsers and in
 * Node >=20 (this repo's minimum, see package.json engines).
 */
export function randomUuid(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  const values = new Uint32Array(4);
  globalThis.crypto?.getRandomValues?.(values);
  return Array.from(values, (value) => value.toString(36)).join("-");
}

/** Persistent per-browser identifier. Never derived from a fingerprint. */
export async function getOrCreateAnonymousUserId(): Promise<string> {
  return getOrCreatePersistedAnonymousUserId(randomUuid);
}

/** Per-tab identifier, reset every browser session. */
export function getOrCreateSessionId(): string {
  if (cachedSessionId) return cachedSessionId;
  if (typeof sessionStorage !== "undefined") {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      cachedSessionId = stored;
      return stored;
    }
  }
  const created = randomUuid();
  cachedSessionId = created;
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(SESSION_STORAGE_KEY, created);
  }
  return created;
}

export function newEventUuid(): string {
  return randomUuid();
}
