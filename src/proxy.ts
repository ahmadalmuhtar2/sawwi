import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const RESERVED_SUBS = new Set(["app", "www", "api", "media", "admin"]);

// The root host (no port), from env. Read the server var at runtime; fall back
// to the build-inlined public var (edge runtime) and finally localhost.
const ROOT_HOST = (
  process.env.ROOT_DOMAIN ??
  process.env.NEXT_PUBLIC_ROOT_DOMAIN ??
  "localhost"
)
  .split(":")[0]
  .toLowerCase();

/** Extract a tenant subdomain, or null for the apex / app / ANY host that isn't
 *  under our root domain (the Railway *.up.railway.app URL, a bare IP, or a
 *  health-check host) — those all serve the app, never a tenant lookup. */
function subdomain(hostname: string): string | null {
  const host = hostname.toLowerCase();
  if (host === ROOT_HOST) return null; // apex → app
  if (host.endsWith(`.${ROOT_HOST}`)) {
    return host.slice(0, host.length - ROOT_HOST.length - 1).split(".")[0] || null;
  }
  return null; // not our domain → app (Railway URL, IP, health check)
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
      // Preserve where they were headed so login returns them there, not a
      // generic landing page.
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(login);
    }
  }
  return NextResponse.next();
}

export const config = {
  // Run on page routes; skip API, Next internals, and static files.
  matcher: ["/((?!api|_next/static|_next/image|brand|.*\\..*).*)"],
};
