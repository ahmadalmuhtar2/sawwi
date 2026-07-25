import { withRoute } from "@/lib/http";
import { getEnv } from "@/lib/env";
import { errors } from "@/shared/errors";
import { runRenewalAlerts } from "@/server/billing/reminders";

// POST /api/cron/renewal-alerts — run the renewal-reminder sweep. Guarded by the
// CRON_SECRET header, so an external scheduler (or manual test) can trigger it
// without the BullMQ worker. Header: x-cron-secret: <CRON_SECRET>.
export const POST = withRoute(async (request) => {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== getEnv().CRON_SECRET) throw errors.unauthorized();
  return runRenewalAlerts();
});
