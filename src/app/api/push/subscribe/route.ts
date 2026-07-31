import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { errors } from "@/shared/errors";
import { PushSubscriptionInput } from "@/server/push/push.schema";
import { savePushSubscription, removePushSubscription } from "@/server/push/push.service";

// POST /api/push/subscribe — store the caller's browser push subscription.
export const POST = withRoute(async (request) => {
  const claims = await requireSessionClaims();
  const input = PushSubscriptionInput.parse(await request.json());
  return savePushSubscription(claims, input);
});

// DELETE /api/push/subscribe?endpoint=... — remove the caller's subscription.
export const DELETE = withRoute(async (request) => {
  const claims = await requireSessionClaims();
  const endpoint = new URL(request.url).searchParams.get("endpoint");
  if (!endpoint) throw errors.validation("endpoint مطلوب", { endpoint: "مطلوب" });
  return removePushSubscription(claims, endpoint);
});
