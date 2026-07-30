// Dashboard: list a site's visitor messages (with the unread count for badges).
// Read access = canView; the service authorizes via session claims.

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { MessageFilter } from "@/server/messages/messages.schema";
import { listSiteMessages } from "@/server/messages/messages.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const raw = new URL(request.url).searchParams.get("filter") ?? "all";
  const filter = MessageFilter.catch("all").parse(raw);
  return listSiteMessages(claims, id, filter);
});
