import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { publishSite } from "@/server/publishing/publishing.service";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/sites/:id/publish — snapshot + go live (subscription-gated).
export const POST = withRoute(async (_req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  return publishSite(claims, id);
});
