// Owner: read / update / publish-toggle / delete a single listing. All scoped to
// the owning site (no cross-site access) and gated on canEditSettings.

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { UpdateListingInput, PublishListingInput } from "@/server/listings/listings.schema";
import {
  deleteListing,
  getMyListing,
  setListingPublished,
  updateListing,
} from "@/server/listings/listings.service";

type Ctx = { params: Promise<{ id: string; listingId: string }> };

export const GET = withRoute(async (_request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, listingId } = await params;
  return getMyListing(claims, id, listingId);
});

export const PUT = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, listingId } = await params;
  const input = UpdateListingInput.parse(await request.json());
  return updateListing(claims, id, listingId, input);
});

// Lightweight publish/unpublish toggle (distinct from a full PUT edit).
export const PATCH = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, listingId } = await params;
  const { published } = PublishListingInput.parse(await request.json());
  return setListingPublished(claims, id, listingId, published);
});

export const DELETE = withRoute(async (_request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, listingId } = await params;
  return deleteListing(claims, id, listingId);
});
