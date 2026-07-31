// PUBLIC (site-session authorized): a SELLER edits (PATCH) or deletes (DELETE) one
// of their OWN listings. Cross-author/cross-site ids 404 in the service.

import { cookies } from "next/headers";
import { withRoute } from "@/lib/http";
import { UpdateListingInput } from "@/server/listings/listings.schema";
import { sellerUpdate, sellerDelete } from "@/server/site-auth/site-seller.service";
import { SITE_SESSION_COOKIE } from "@/lib/site-host";

type Ctx = { params: Promise<{ listingId: string }> };

export const PATCH = withRoute(async (request, { params }: Ctx) => {
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value ?? null;
  const { listingId } = await params;
  const input = UpdateListingInput.parse(await request.json());
  return sellerUpdate(request.headers.get("host"), token, listingId, input);
});

export const DELETE = withRoute(async (request, { params }: Ctx) => {
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value ?? null;
  const { listingId } = await params;
  return sellerDelete(request.headers.get("host"), token, listingId);
});
