import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client, created with the service role key so it
 * bypasses RLS (see supabase/migrations/0001_analytics_core.sql). Never
 * imported from a "use client" module — importing @supabase/supabase-js
 * with a service role key into client code would leak it into the bundle.
 *
 * Returns undefined when the required env vars are absent, which is the
 * expected state for local dev/CI without a configured Supabase project.
 * Callers must treat undefined as "analytics storage not configured" and
 * degrade gracefully — never throw, never surface an error to the player.
 */
let cachedClient: SupabaseClient | undefined | null = null;

export function getSupabaseAdminClient(): SupabaseClient | undefined {
  if (cachedClient !== null) return cachedClient ?? undefined;
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    cachedClient = undefined;
    return undefined;
  }
  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

/** Test-only: forces the next getSupabaseAdminClient() call to re-evaluate env vars. */
export function resetSupabaseAdminClientForTests(): void {
  cachedClient = null;
}

export function isAnalyticsStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}
