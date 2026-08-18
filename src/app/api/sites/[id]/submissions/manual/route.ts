// Manual entry — a site collaborator records someone who reached out on WhatsApp.
// ADMIN only (session + canEditSettings on the site); source is forced to "manual".

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { ManualInput } from "@/server/submissions/submissions.schema";
import { createManualSubmission } from "@/server/submissions/submissions.service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const input = ManualInput.parse(await request.json());
  return createManualSubmission(claims, id, input);
});
