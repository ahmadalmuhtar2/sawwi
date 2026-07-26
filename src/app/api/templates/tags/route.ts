// GET /api/templates/tags — tags ranked by popularity for the suggested chips
// (default top 10) and the searchable "all tags" panel (`?query=`). Ranking and
// filtering are server-side (see templates.service).

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { parseListTagsQuery } from "@/server/templates/templates.schema";
import { listTags } from "@/server/templates/templates.service";

export const GET = withRoute(async (request) => {
  await requireSessionClaims();
  return { tags: listTags(parseListTagsQuery(request.url)) };
});
