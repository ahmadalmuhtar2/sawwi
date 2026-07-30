// Data access for marketplace listings — the ONLY layer that touches Prisma.

import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const listingsRepository = {
  create(data: Prisma.ListingUncheckedCreateInput) {
    return getPrisma().listing.create({ data });
  },

  findById(id: string) {
    return getPrisma().listing.findUnique({ where: { id } });
  },

  update(id: string, data: Prisma.ListingUncheckedUpdateInput) {
    return getPrisma().listing.update({ where: { id }, data });
  },

  delete(id: string) {
    return getPrisma().listing.delete({ where: { id } });
  },

  countBySite(siteId: string): Promise<number> {
    return getPrisma().listing.count({ where: { siteId } });
  },

  /** Owner view: every listing (any status), featured first then newest. */
  listBySite(siteId: string) {
    return getPrisma().listing.findMany({
      where: { siteId },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
  },

  /** Public view: only published listings — served LIVE to the marketplace.
   *  Featured (merchandised/boosted) listings surface first. */
  listPublished(siteId: string) {
    return getPrisma().listing.findMany({
      where: { siteId, published: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
  },
};
