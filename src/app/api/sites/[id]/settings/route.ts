import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { UpdateSettingsInput } from "@/server/sites/sites.schema";
import { updateSettings } from "@/server/sites/sites.service";

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/sites/:id/settings — replace the site's business settings.
export const PUT = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const input = UpdateSettingsInput.parse(await request.json());
  return updateSettings(claims, id, input);
});
