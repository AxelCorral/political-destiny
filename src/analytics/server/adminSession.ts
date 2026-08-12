import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal signed-cookie session for the /admin/analytics dashboard. No
 * existing admin auth was found in this repo (see docs/analytics/
 * ARCHITECTURE_PLAN.md §1), so this is a small, purpose-built mechanism —
 * not a general auth system. Session = base64url(payload) + "." +
 * base64url(HMAC-SHA256(payload, ANALYTICS_ADMIN_SESSION_SECRET)).
 */
export const ADMIN_SESSION_COOKIE_NAME = "vers_lelysee_admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

export function createAdminSessionCookieValue(secret: string, now: number = Date.now()): string {
  const expiresAt = now + ADMIN_SESSION_TTL_SECONDS * 1000;
  const payload = base64url(Buffer.from(JSON.stringify({ exp: expiresAt })));
  const signature = base64url(createHmac("sha256", secret).update(payload).digest());
  return `${payload}.${signature}`;
}

export function verifyAdminSessionCookieValue(
  cookieValue: string,
  secret: string,
  now: number = Date.now(),
): boolean {
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts as [string, string];
  const expectedSignature = base64url(createHmac("sha256", secret).update(payload).digest());
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length) return false;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: number;
    };
    return typeof decoded.exp === "number" && decoded.exp > now;
  } catch {
    return false;
  }
}

/** Constant-time-ish password check, tolerant of different-length inputs. */
export function safeStringEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
