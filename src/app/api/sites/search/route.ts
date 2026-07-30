import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { searchSites } from "@/server/sites/sites.service";

// GET /api/sites/search?q=&limit= — server-side site search within the caller's
// active workspace (members invite combobox). Results are capped in the service.
export const GET = withRoute(async (req) => {
  const claims = await requireSessionClaims();
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? "10");
  const sites = await searchSites(claims, q, Number.isFinite(limit) ? limit : 10);
  return { sites };
});
