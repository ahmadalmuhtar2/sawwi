// PUBLIC endpoint — an unauthenticated visitor submits a lead from a published
// site's contact form. No session; the service enforces the site-served gate +
// honeypot + per-IP/per-site rate limits. Same-origin fetch from the tenant host
// (Caddy routes every subdomain to this one app).

import { withRoute } from "@/lib/http";
import { SubmitMessageInput } from "@/server/messages/messages.schema";
import { submitMessage } from "@/server/messages/messages.service";
import { clientIpFromHeaders } from "@/server/messages/messages.rules";

export const POST = withRoute(async (request) => {
  const input = SubmitMessageInput.parse(await request.json());
  const ip = clientIpFromHeaders(request.headers);
  return submitMessage(input, ip);
});
