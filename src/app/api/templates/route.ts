import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { listTemplates } from "@/server/templates/registry";

// GET /api/templates — available vertical templates for the create-site picker.
export const GET = withRoute(async () => {
  await requireSessionClaims();
  return { items: listTemplates() };
});
