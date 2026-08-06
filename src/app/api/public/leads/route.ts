// PUBLIC endpoint — an unauthenticated visitor submits the landing-page "free
// preview" form. No session; the service enforces honeypot + per-IP/global rate
// limits and normalizes the WhatsApp number. Every accepted lead notifies admins.

import { withRoute } from "@/lib/http";
import { CreateLeadInput } from "@/server/leads/leads.schema";
import { createLead } from "@/server/leads/leads.service";
import { clientIpFromHeaders, hashIp } from "@/server/leads/leads.rules";

export const POST = withRoute(async (request) => {
  const input = CreateLeadInput.parse(await request.json());
  const ipHash = hashIp(clientIpFromHeaders(request.headers));
  return createLead(input, ipHash);
});
