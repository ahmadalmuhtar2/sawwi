// GET /api/admin/leads?filter=&q=&sort=&dir= — the admin lead inbox (admin-only,
// enforced in the service). Returns the leads for the query plus per-status
// counts. The dashboard renders from the server component; this route mirrors the
// same query for programmatic use.

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { LeadFilter, LeadSort, LeadDir } from "@/server/leads/leads.schema";
import { listLeads } from "@/server/leads/leads.service";

export const GET = withRoute(async (request) => {
  const claims = await requireSessionClaims();
  const sp = new URL(request.url).searchParams;
  return listLeads(claims, {
    filter: LeadFilter.catch("all").parse(sp.get("filter") ?? "all"),
    sort: LeadSort.catch("created").parse(sp.get("sort") ?? "created"),
    dir: LeadDir.catch("desc").parse(sp.get("dir") ?? "desc"),
    q: sp.get("q")?.trim() || undefined,
  });
});
