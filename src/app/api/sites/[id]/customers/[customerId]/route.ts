import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { UpdateCustomerInput } from "@/server/customers/customers.schema";
import { updateCustomer } from "@/server/customers/customers.service";

type Ctx = { params: Promise<{ id: string; customerId: string }> };

export const PATCH = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, customerId } = await params;
  const input = UpdateCustomerInput.parse(await request.json());
  return updateCustomer(claims, id, customerId, input);
});
