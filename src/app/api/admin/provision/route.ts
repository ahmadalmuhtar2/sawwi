import { z } from "zod";
import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { provisionAccount } from "@/server/admin/admin.service";

const schema = z.object({
  email: z.string().email("بريد غير صالح"),
  name: z.string().min(1, "الاسم مطلوب"),
  kind: z.enum(["reseller", "direct"]),
  workspaceName: z.string().optional(),
  commissionPct: z.number().min(0).max(100).optional(),
  contactName: z.string().optional(),
  contactWhatsapp: z.string().optional(),
  endDate: z.string().nullable().optional(),
});

// POST /api/admin/provision — create a reseller or direct account + workspace,
// and email the set-password link.
export const POST = withRoute(async (req) => {
  const claims = await requireSessionClaims();
  const input = schema.parse(await req.json());
  return provisionAccount(claims, input);
});
