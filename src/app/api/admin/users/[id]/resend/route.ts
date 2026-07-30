import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { resendSetPassword } from "@/server/admin/admin.service";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/admin/users/:id/resend — re-send the set-password link.
export const POST = withRoute(async (_req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  return resendSetPassword(claims, id);
});
