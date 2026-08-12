import { NextResponse } from "next/server";

import { parseDashboardFilters } from "@/analytics/server/dashboardFilters";
import { toCsv } from "@/analytics/server/csv";
import { getOverview, getPartyPerformance } from "@/analytics/server/dashboardQueries";
import {
  getSupabaseAdminClient,
  isAnalyticsStorageConfigured,
} from "@/analytics/server/supabaseAdmin";

export const runtime = "nodejs";

const EXPORTABLE_VIEWS = ["overview", "party_performance"] as const;
type ExportableView = (typeof EXPORTABLE_VIEWS)[number];

function isExportableView(value: string | null): value is ExportableView {
  return (EXPORTABLE_VIEWS as readonly string[]).includes(value ?? "");
}

/**
 * Reachable only by an authenticated admin session — protected by
 * src/proxy.ts's matcher (/api/admin/analytics/:path*), not by a check in
 * this handler. Never exposed to the game client; not linked from any
 * player-facing page.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const view = url.searchParams.get("view");
  if (!isExportableView(view)) {
    return NextResponse.json({ error: "unknown_view", allowed: EXPORTABLE_VIEWS }, { status: 400 });
  }

  if (!isAnalyticsStorageConfigured()) {
    return NextResponse.json({ error: "analytics_not_configured" }, { status: 503 });
  }

  const filters = parseDashboardFilters(Object.fromEntries(url.searchParams.entries()));
  const supabase = getSupabaseAdminClient()!;

  const rows =
    view === "overview"
      ? await getOverview(supabase, filters)
      : await getPartyPerformance(supabase, filters);

  const csv = toCsv(rows as unknown as Record<string, unknown>[]);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${view}.csv"`,
    },
  });
}
