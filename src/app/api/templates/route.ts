// GET /api/templates — the templates gallery feed. Server-side search + tag
// filter + cursor pagination (see templates.service). The client only forwards
// the query params and renders the returned page; it never filters locally.
//
// PUBLIC: the catalog is the static code registry (no per-user or sensitive
// data), so the marketing `/templates` gallery reads it without a session.

import { withRoute } from "@/lib/http";
import { parseListTemplatesQuery } from "@/server/templates/templates.schema";
import { listTemplates } from "@/server/templates/templates.service";

export const GET = withRoute(async (request) => {
  return listTemplates(parseListTemplatesQuery(request.url));
});
