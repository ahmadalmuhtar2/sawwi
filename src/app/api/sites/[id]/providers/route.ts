// Convert an ACCEPTED provider Submission into a Provider (authenticated collaborator).
// There is no public create path for providers.

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { ConvertToProviderInput } from "@/server/providers/providers.schema";
import { convertSubmissionToProvider } from "@/server/providers/providers.service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const input = ConvertToProviderInput.parse(await request.json());
  return convertSubmissionToProvider(claims, id, input.submissionId);
});
