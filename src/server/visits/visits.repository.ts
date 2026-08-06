// Data access for site visit counting. Recording is idempotent per (site,
// session) via the table's unique constraint, so a repeat pageview in the same
// browser session doesn't create a second row.

import { getPrisma } from "@/lib/db";

export const visitsRepository = {
  /**
   * Record one visit for a (site, session). Returns true only if a NEW row was
   * inserted — skipDuplicates makes a repeat in the same session a no-op.
   */
  async recordSession(siteId: string, sessionKey: string): Promise<boolean> {
    const r = await getPrisma().siteVisit.createMany({
      data: [{ siteId, sessionKey }],
      skipDuplicates: true,
    });
    return r.count > 0;
  },

  /** Total counted visits per site, for the given ids. Missing ids → absent (0). */
  async countBySites(siteIds: string[]): Promise<Record<string, number>> {
    if (siteIds.length === 0) return {};
    const rows = await getPrisma().siteVisit.groupBy({
      by: ["siteId"],
      where: { siteId: { in: siteIds } },
      _count: { _all: true },
    });
    return Object.fromEntries(rows.map((r) => [r.siteId, r._count._all]));
  },
};
