import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const RESERVED_SUBS = new Set(["app", "www", "api", "media", "admin"]);

/** Extract a tenant subdomain, or null for the apex/app host. */
function subdomain(hostname: string): string | null {
  if (hostname.endsWith(".localhost")) {
    const parts = hostname.split(".");
    return parts.length >= 2 ? parts[0] : null;
  }
  const parts = hostname.split(".");
  return parts.length > 2 ? parts[0] : null; // sub.sawwi.com
}

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0];
  const sub = subdomain(host);
  const { pathname } = request.nextUrl;

  // Published-site subdomain → render the public site (rewrite to /s/{slug}).
  if (sub && !RESERVED_SUBS.has(sub)) {
    const url = request.nextUrl.clone();
    url.pathname = `/s/${sub}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Auth guard for the dashboard app.
  if (pathname.startsWith("/dashboard") || pathname === "/onboarding") {
    if (!getSessionCookie(request)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  // Run on page routes; skip API, Next internals, and static files.
  matcher: ["/((?!api|_next/static|_next/image|brand|.*\\..*).*)"],
};
