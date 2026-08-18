// CSV export of a site's submissions, honouring the current filters. ADMIN only.
// Returns a real file (UTF-8 + BOM) rather than the JSON envelope, so it can't go
// through withRoute — auth + errors are handled inline.

import { requireSessionClaims } from "@/lib/auth";
import { ListQuery } from "@/server/submissions/submissions.schema";
import { exportSubmissionsCsv } from "@/server/submissions/submissions.service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  try {
    const claims = await requireSessionClaims();
    const { id } = await params;
    const q = ListQuery.parse(Object.fromEntries(new URL(request.url).searchParams));
    const csv = await exportSubmissionsCsv(claims, id, q);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="submissions-${id}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return new Response("تعذّر تصدير الطلبات", { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
