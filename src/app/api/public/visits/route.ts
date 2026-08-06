// PUBLIC: a served site's beacon reports a pageview. We assign a per-browser-
// session cookie (`sawwi_vid`, no max-age → cleared when the session ends) and
// record at most one visit per (site, session). Unknown or unserved slugs are a
// silent no-op, so the endpoint never reveals which slugs exist.

import { z } from "zod";
import { cookies } from "next/headers";
import { withRoute } from "@/lib/http";
import { getPrisma } from "@/lib/db";
import { isServable } from "@/server/billing/billing.rules";
import { recordVisit } from "@/server/visits/visits.service";
import { useSecureCookies } from "@/lib/site-host";

const VISIT_COOKIE = "sawwi_vid";
const Input = z.object({ slug: z.string().min(1).max(64) });

export const POST = withRoute(async (request) => {
  const { slug } = Input.parse(await request.json());

  const site = await getPrisma().site.findUnique({
    where: { slug },
    select: {
      id: true,
      status: true,
      maintenanceMode: true,
      subscription: { select: { expiry: true } },
    },
  });

  // Only served pages count (matches what a visitor actually sees).
  const served =
    !!site &&
    site.status === "published" &&
    !site.maintenanceMode &&
    (!site.subscription || isServable(site.subscription.expiry, new Date()));
  if (!served) return { ok: true };

  const jar = await cookies();
  let vid = jar.get(VISIT_COOKIE)?.value;
  if (!vid) {
    vid = crypto.randomUUID();
    jar.set(VISIT_COOKIE, vid, {
      httpOnly: true,
      sameSite: "lax",
      secure: useSecureCookies(),
      path: "/",
      // No maxAge → a session cookie: cleared when the browser session ends, so
      // the visitor's NEXT session is counted as a new visit.
    });
  }

  await recordVisit(site.id, vid);
  return { ok: true };
});
