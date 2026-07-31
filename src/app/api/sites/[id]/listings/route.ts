// Owner: list a site's marketplace listings (any status) and create a new one.
// Both authorized via session claims in the service (canEditSettings to create).

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { CreateListingInput } from "@/server/listings/listings.schema";
import { createListing, listMyListings } from "@/server/listings/listings.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withRoute(async (_request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  return listMyListings(claims, id);
});

export const POST = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const input = CreateListingInput.parse(await request.json());
  return createListing(claims, id, input);
});
