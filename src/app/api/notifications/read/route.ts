// Mark the caller's notifications read — one by id, or all when id is omitted.

import { z } from "zod";
import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { markNotificationsRead } from "@/server/notifications/notifications.service";

const Body = z.object({ id: z.string().optional() });

export const POST = withRoute(async (request) => {
  const claims = await requireSessionClaims();
  // Tolerate an empty body ("mark all").
  const raw = await request.json().catch(() => ({}));
  const { id } = Body.parse(raw ?? {});
  return markNotificationsRead(claims, id);
});
