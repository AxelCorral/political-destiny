import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminSessionCookieValue,
} from "@/analytics/server/adminSession";

/**
 * Next.js 16 renamed middleware.ts to proxy.ts (the "middleware" export
 * convention is deprecated in this version — see node_modules/next/dist/
 * docs/01-app/03-api-reference/03-file-conventions/proxy.md). Proxy
 * defaults to the Node.js runtime here, so node:crypto (used by
 * adminSession.ts) is available directly, no Edge-compatible reimplementation
 * needed.
 *
 * Only guards /admin/analytics/**: /admin/login must stay reachable without
 * a session, or a visitor could never log in.
 */
export function proxy(request: NextRequest): NextResponse {
  const secret = process.env.ANALYTICS_ADMIN_SESSION_SECRET;
  const cookieValue = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const authenticated =
    Boolean(secret) && Boolean(cookieValue) && verifyAdminSessionCookieValue(cookieValue!, secret!);

  if (!authenticated) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/analytics/:path*", "/api/admin/analytics/:path*"],
};
