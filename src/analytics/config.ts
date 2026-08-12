export type AnalyticsMode = "off" | "opt-in";

/**
 * "off" disables the analytics client entirely (no queueing, no consent UI
 * relevance). "opt-in" means the client is active but sends nothing until
 * the player explicitly grants consent. Defaults to opt-in in production and
 * off elsewhere, overridable via NEXT_PUBLIC_ANALYTICS_MODE for staging.
 */
export function getAnalyticsMode(): AnalyticsMode {
  const raw = process.env.NEXT_PUBLIC_ANALYTICS_MODE?.trim().toLowerCase();
  if (raw === "opt-in") return "opt-in";
  if (raw === "off") return "off";
  return process.env.NODE_ENV === "production" ? "opt-in" : "off";
}
