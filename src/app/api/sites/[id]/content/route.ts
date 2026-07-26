// PUT /api/sites/:id/content — replace the site's editable template content
// (the object collected in onboarding / edited in the content editor).

import { z } from "zod";
import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { updateContent } from "@/server/sites/sites.service";

const Body = z.record(z.string(), z.unknown());
type Ctx = { params: Promise<{ id: string }> };

export const PUT = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const content = Body.parse(await req.json());
  await updateContent(claims, id, content);
  return { ok: true };
});
