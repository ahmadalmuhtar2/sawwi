import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { unpublishSite } from "@/server/publishing/publishing.service";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/sites/:id/unpublish — take the site offline (back to draft).
export const POST = withRoute(async (_req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  return unpublishSite(claims, id);
});
