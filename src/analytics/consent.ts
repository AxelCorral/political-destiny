import {
  getLocalSettings,
  saveLocalSettings,
  type AnalyticsConsentState,
} from "@/lib/storage/game-database";

import { clearQueue } from "./storage";

export type { AnalyticsConsentState } from "@/lib/storage/game-database";

export async function getAnalyticsConsent(): Promise<AnalyticsConsentState> {
  const settings = await getLocalSettings();
  return settings.analyticsConsent;
}

/**
 * Refusal clears anything already queued locally (nothing pending gets sent
 * later "by accident"). Withdrawal (granted -> denied) also clears the
 * queue, which is the correct behavior since denied and never-granted are
 * the same "do not send" state going forward.
 */
export async function setAnalyticsConsent(state: AnalyticsConsentState): Promise<void> {
  const settings = await getLocalSettings();
  await saveLocalSettings({ ...settings, analyticsConsent: state });
  if (state !== "granted") await clearQueue();
}
