// POST /api/sites — create a site. Thin controller: authenticate, validate,
// delegate to the service, return data. All error shaping is done by withRoute.
//
// NOTE: getSessionClaims() is a placeholder until Better Auth is wired
// (src/lib/auth.ts). Until then this route returns INTERNAL — the pattern is
// complete; only the session source is pending.

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { CreateSiteInput } from "@/server/sites/sites.schema";
import { createSite, listSites } from "@/server/sites/sites.service";

// GET /api/sites — sites the caller can see.
export const GET = withRoute(async () => {
  const claims = await requireSessionClaims();
  return { items: await listSites(claims) };
});

// POST /api/sites — create a site in the caller's workspace.
export const POST = withRoute(async (request) => {
  const claims = await requireSessionClaims();
  const input = CreateSiteInput.parse(await request.json());
  const site = await createSite(claims, input);
  return { id: site.id, slug: site.slug, status: site.status };
});
