import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { siteSeoSchema } from "@/shared/seo";
import { updateSeo } from "@/server/sites/sites.service";

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/sites/:id/seo — update the site-wide SEO defaults.
export const PUT = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const input = siteSeoSchema.parse(await req.json());
  return updateSeo(claims, id, input);
});
