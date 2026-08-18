import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { UpdateProviderInput } from "@/server/providers/providers.schema";
import { updateProvider } from "@/server/providers/providers.service";

type Ctx = { params: Promise<{ id: string; providerId: string }> };

export const PATCH = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, providerId } = await params;
  const input = UpdateProviderInput.parse(await request.json());
  return updateProvider(claims, id, providerId, input);
});
