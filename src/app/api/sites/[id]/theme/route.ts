import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { UpdateThemeInput } from "@/server/sites/sites.schema";
import { updateTheme } from "@/server/sites/sites.service";

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/sites/:id/theme — replace the site's theme.
export const PUT = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const input = UpdateThemeInput.parse(await request.json());
  return updateTheme(claims, id, input);
});
