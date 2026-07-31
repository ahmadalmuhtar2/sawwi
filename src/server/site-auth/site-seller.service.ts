// ON-SITE seller flow — a signed-in SELLER (site-user with role `contributor`)
// posts and manages their OWN listings from the served marketplace. Authorized by
// the site session (authorContext); every write is scoped to the caller as the
// listing's author, so one seller can never touch another's (or the owner's) rows.
// Managers can author too (authorContext allows them) but manage everything via
// /admin — this module is strictly own-row.

import { errors } from "@/shared/errors";
import type { CreateListingInput, UpdateListingInput } from "@/server/listings/listings.schema";
import {
  createListingForSite,
  updateListingForSite,
  deleteListingForSite,
} from "@/server/listings/listings.service";
import { listingsRepository } from "@/server/listings/listings.repository";
import { authorContext } from "./site-auth.service";

/** A listing the caller authored on this site, or 404 (never reveals others'). */
async function ownListing(siteId: string, authorId: string, listingId: string) {
  const l = await listingsRepository.findById(listingId);
  if (!l || l.siteId !== siteId || l.authorSiteUserId !== authorId) {
    throw errors.notFound("الإعلان غير موجود");
  }
  return l;
}

export async function sellerListMine(host: string | null, token: string | null) {
  const { site, caller } = await authorContext(host, token);
  return listingsRepository.listBySiteAndAuthor(site.id, caller.id);
}

export async function sellerCreate(
  host: string | null,
  token: string | null,
  input: CreateListingInput,
) {
  const { site, caller } = await authorContext(host, token);
  return createListingForSite(site.id, input, caller.id);
}

export async function sellerUpdate(
  host: string | null,
  token: string | null,
  listingId: string,
  input: UpdateListingInput,
) {
  const { site, caller } = await authorContext(host, token);
  await ownListing(site.id, caller.id, listingId); // 404 unless the caller authored it
  return updateListingForSite(site.id, listingId, input);
}

export async function sellerDelete(host: string | null, token: string | null, listingId: string) {
  const { site, caller } = await authorContext(host, token);
  await ownListing(site.id, caller.id, listingId);
  return deleteListingForSite(site.id, listingId);
}
