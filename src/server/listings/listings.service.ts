// Marketplace listings business logic. Two audiences:
//   · OWNER (dashboard) — create/edit/publish/delete their inventory. Authorized
//     via resolveSiteAccess over trusted claims; editing needs canEditSettings.
//   · PUBLIC (render) — listPublishedListings() feeds the served marketplace
//     directly (server-side), so there is no public write path here.
//
// Listings are served LIVE (not frozen in a PublishSnapshot): a dealer/agency
// changes stock daily, so there is no per-site "publish" gate on them beyond the
// per-listing `published` flag.

import type { SessionClaims } from "@/server/access/access.rules";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { sitesRepository } from "@/server/sites/sites.repository";
import { deleteRemovedObjects } from "@/lib/storage-cleanup";
import { errors } from "@/shared/errors";
import type { Prisma } from "@/generated/prisma/client";
import type { CreateListingInput, UpdateListingInput } from "./listings.schema";
import { listingsRepository } from "./listings.repository";

const MAX_LISTINGS = 500; // sane per-site cap

/** Load a site the caller may VIEW (reading their inventory), or throw. */
async function loadForRead(claims: SessionClaims, siteId: string) {
  const site = await sitesRepository.findById(siteId);
  if (!site) throw errors.notFound("الموقع غير موجود");
  const perms = resolveSiteAccess(claims, site);
  if (!perms.canView) throw errors.notFound("الموقع غير موجود"); // don't leak existence
  return { site, perms };
}

/** Load + assert the caller may EDIT listings (settings-edit rights). */
async function loadForEdit(claims: SessionClaims, siteId: string) {
  const { site, perms } = await loadForRead(claims, siteId);
  if (!perms.canEditSettings) throw errors.forbidden("لا تملك صلاحية إدارة الإعلانات");
  return site;
}

/** Load a listing that belongs to this site (no cross-site access), or throw. */
async function ownedListing(siteId: string, listingId: string) {
  const listing = await listingsRepository.findById(listingId);
  if (!listing || listing.siteId !== siteId) throw errors.notFound("الإعلان غير موجود");
  return listing;
}

export async function listMyListings(claims: SessionClaims, siteId: string) {
  await loadForRead(claims, siteId);
  return listingsRepository.listBySite(siteId);
}

export async function getMyListing(claims: SessionClaims, siteId: string, listingId: string) {
  await loadForRead(claims, siteId);
  return ownedListing(siteId, listingId);
}

export async function createListing(
  claims: SessionClaims,
  siteId: string,
  input: CreateListingInput,
) {
  await loadForEdit(claims, siteId);
  if ((await listingsRepository.countBySite(siteId)) >= MAX_LISTINGS) {
    throw errors.forbidden(`بلغت الحد الأقصى لعدد الإعلانات (${MAX_LISTINGS})`);
  }
  return listingsRepository.create({
    siteId,
    vertical: input.vertical,
    title: input.title,
    price: input.price ?? null,
    offer: input.offer ?? null,
    place: input.place ?? null,
    description: input.description ?? null,
    images: (input.images ?? []) as Prisma.InputJsonValue,
    features: (input.features ?? []) as Prisma.InputJsonValue,
    specs: (input.specs ?? {}) as Prisma.InputJsonValue,
    published: input.published ?? false,
  });
}

export async function updateListing(
  claims: SessionClaims,
  siteId: string,
  listingId: string,
  input: UpdateListingInput,
) {
  await loadForEdit(claims, siteId);
  const existing = await ownedListing(siteId, listingId);

  const data: Prisma.ListingUncheckedUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.price !== undefined) data.price = input.price;
  if (input.offer !== undefined) data.offer = input.offer;
  if (input.place !== undefined) data.place = input.place;
  if (input.description !== undefined) data.description = input.description;
  if (input.images !== undefined) data.images = input.images as Prisma.InputJsonValue;
  if (input.features !== undefined) data.features = input.features as Prisma.InputJsonValue;
  if (input.specs !== undefined) data.specs = input.specs as Prisma.InputJsonValue;
  if (input.published !== undefined) data.published = input.published;

  const updated = await listingsRepository.update(listingId, data);
  // Free any images this edit removed or replaced (best-effort, non-blocking).
  if (input.images !== undefined) {
    void deleteRemovedObjects({ images: existing.images }, { images: input.images }).catch(() => {});
  }
  return updated;
}

export async function setListingPublished(
  claims: SessionClaims,
  siteId: string,
  listingId: string,
  published: boolean,
) {
  await loadForEdit(claims, siteId);
  await ownedListing(siteId, listingId);
  return listingsRepository.update(listingId, { published });
}

export async function deleteListing(claims: SessionClaims, siteId: string, listingId: string) {
  await loadForEdit(claims, siteId);
  const existing = await ownedListing(siteId, listingId);
  await listingsRepository.delete(listingId);
  // Free the listing's stored images (best-effort, non-blocking).
  void deleteRemovedObjects({ images: existing.images }, {}).catch(() => {});
  return { id: listingId, deleted: true };
}

/* ─────────────────────────────── public ─────────────────────────────── */

/** Published listings for a site — feeds the served marketplace (server-side). */
export async function listPublishedListings(siteId: string) {
  return listingsRepository.listPublished(siteId);
}
