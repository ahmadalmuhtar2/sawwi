// PATCH /api/admin/leads/:id — update a lead's pipeline status and/or note.
// DELETE /api/admin/leads/:id — remove a lead. Both admin-only (service-enforced).

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { UpdateLeadInput } from "@/server/leads/leads.schema";
import { updateLead, deleteLead } from "@/server/leads/leads.service";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const input = UpdateLeadInput.parse(await req.json());
  return updateLead(claims, id, input);
});

export const DELETE = withRoute(async (_req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  return deleteLead(claims, id);
});
