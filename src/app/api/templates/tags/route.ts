// GET /api/templates/tags — tags ranked by popularity for the suggested chips
// (default top 10) and the searchable "all tags" panel (`?query=`). Ranking and
// filtering are server-side (see templates.service).
//
// PUBLIC: tag facets are derived from the static catalog — no session needed
// (feeds the public `/templates` gallery filters).

import { withRoute } from "@/lib/http";
import { parseListTagsQuery } from "@/server/templates/templates.schema";
import { listTags } from "@/server/templates/templates.service";

export const GET = withRoute(async (request) => {
  return { tags: listTags(parseListTagsQuery(request.url)) };
});
