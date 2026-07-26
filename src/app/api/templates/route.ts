// GET /api/templates — the templates gallery feed. Server-side search + tag
// filter + cursor pagination (see templates.service). The client only forwards
// the query params and renders the returned page; it never filters locally.

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { parseListTemplatesQuery } from "@/server/templates/templates.schema";
import { listTemplates } from "@/server/templates/templates.service";

export const GET = withRoute(async (request) => {
  await requireSessionClaims();
  return listTemplates(parseListTemplatesQuery(request.url));
});
