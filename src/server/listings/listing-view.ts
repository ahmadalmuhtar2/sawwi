// Maps a Prisma Listing row to the serializable shape the marketplace template
// component consumes (MarketplaceListing). Kept server-side so the JSON columns
// (images/features/specs) are narrowed once, in one place.

import type { Listing } from "@/generated/prisma/client";
import type { MarketplaceListing, Vertical, ListingStatus } from "@/templates/marketplace/schema";

export function toMarketplaceListing(row: Listing): MarketplaceListing {
  return {
    id: row.id,
    vertical: row.vertical as Vertical,
    title: row.title,
    price: row.price ?? null,
    offer: row.offer ?? null,
    place: row.place ?? null,
    description: row.description ?? null,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    features: Array.isArray(row.features) ? (row.features as string[]) : [],
    specs: (row.specs && typeof row.specs === "object" ? row.specs : {}) as Record<string, string | number>,
    featured: row.featured,
    status: row.status as ListingStatus,
    authorId: row.authorSiteUserId ?? null,
  };
}
