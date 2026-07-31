// The signed-in user's notification feed (dashboard bell). Scoped to the caller.

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { listMyNotifications } from "@/server/notifications/notifications.service";

export const GET = withRoute(async () => {
  const claims = await requireSessionClaims();
  return listMyNotifications(claims);
});
