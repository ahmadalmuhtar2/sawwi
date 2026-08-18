// Marketplace submissions for a site.
//   POST  — PUBLIC. A visitor submits the provider/customer form. No session;
//           the service enforces honeypot + phone validation + Redis rate limit.
//   GET   — ADMIN. List (filtered, paginated) for the dashboard inbox.

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { SubmitInput, ListQuery } from "@/server/submissions/submissions.schema";
import { createSubmission, listSubmissions } from "@/server/submissions/submissions.service";
import { clientIpFromHeaders, hashIp } from "@/server/submissions/submissions.rules";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withRoute(async (request, { params }: Ctx) => {
  const { id } = await params;
  const input = SubmitInput.parse(await request.json());
  const ipHash = hashIp(clientIpFromHeaders(request.headers));
  return createSubmission(id, input, ipHash);
});

export const GET = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const q = ListQuery.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listSubmissions(claims, id, q);
});
