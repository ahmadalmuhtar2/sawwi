// Convert an ACCEPTED customer Submission into a Customer (authenticated collaborator).
// There is no public create path for customers.

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { ConvertToCustomerInput } from "@/server/customers/customers.schema";
import { convertSubmissionToCustomer } from "@/server/customers/customers.service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const input = ConvertToCustomerInput.parse(await request.json());
  return convertSubmissionToCustomer(claims, id, input.submissionId);
});
