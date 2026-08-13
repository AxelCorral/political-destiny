-- Migration 0007 — close the analytics data-exposure gap discovered during
-- Phase 3 remote enablement.
--
-- Root cause (confirmed on the real remote Postgres, not a guess):
--   - The Supabase project sets `ALTER DEFAULT PRIVILEGES` for role
--     `postgres` in schema `public` that automatically grant anon and
--     authenticated full CRUD on every new table/view and EXECUTE on every
--     new function (confirmed via pg_default_acl). Every migration in this
--     project runs as `postgres`, so 0001-0006 inherited this exposure
--     without any explicit GRANT of our own.
--   - `analytics_settings` (created in 0002) never received the
--     `enable row level security` line the other four analytics tables got.
--   - All 11 analytics views are owned by `postgres`, which has BYPASSRLS,
--     and default to `security_invoker = false` (Postgres default before
--     this migration). A view without security_invoker runs with the
--     *owner's* privileges, not the caller's — so every reporting view
--     silently bypassed RLS on the base tables regardless of grants.
--
-- The application never uses the anon/publishable key anywhere: the only
-- Supabase client construction point is src/analytics/server/supabaseAdmin.ts,
-- always using SUPABASE_SERVICE_ROLE_KEY server-side. All 15 analytics
-- functions are SECURITY INVOKER (confirmed) and are called exclusively
-- from src/analytics/server/{ingest,dashboardQueries}.ts with that same
-- service role key. None of the access being revoked here is required by
-- any real application path. service_role has BYPASSRLS directly and keeps
-- its own explicit grants throughout — nothing below touches service_role.
--
-- Purely a privilege/security-configuration change: no data is modified,
-- moved, or deleted.

-- 1. analytics_settings was created without RLS, unlike its four siblings.
alter table public.analytics_settings enable row level security;

-- 2 & 4. Revoke anon/authenticated CRUD on every analytics table and view.
--    RLS already default-denies anon/authenticated on the RLS-enabled
--    tables (no policies were ever created); this removes the redundant
--    grant-level access so nothing is reachable even if RLS were ever
--    misconfigured later. `ALL TABLES IN SCHEMA public` covers views too.
revoke all on all tables in schema public from anon, authenticated;

-- 3. Switch every analytics view to run with the caller's privileges
--    instead of the owner's (`postgres`, BYPASSRLS), so RLS on the base
--    tables is actually enforced through the view. service_role also has
--    BYPASSRLS directly, so server-side reporting is unaffected.
alter view public.analytics_run_status set (security_invoker = true);
alter view public.analytics_data_quality set (security_invoker = true);
alter view public.overview_daily set (security_invoker = true);
alter view public.party_performance set (security_invoker = true);
alter view public.run_funnel set (security_invoker = true);
alter view public.version_health set (security_invoker = true);
alter view public.replay_behavior set (security_invoker = true);
alter view public.runoff_matchups set (security_invoker = true);
alter view public.decision_health set (security_invoker = true);
alter view public.event_choice_distribution set (security_invoker = true);
alter view public.content_exposure set (security_invoker = true);

-- 5. Revoke EXECUTE on every analytics function from PUBLIC (Postgres'
--    implicit default for new functions) and from anon/authenticated
--    (granted explicitly by the Supabase project's default privileges).
revoke execute on all functions in schema public from public, anon, authenticated;

-- 6. Non-regression: override the project's own default privileges for
--    future objects created by `postgres` in schema `public`, so the next
--    analytics table/view/function added by a future migration does not
--    silently re-expose anon/authenticated the same way 0001-0006 did.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
