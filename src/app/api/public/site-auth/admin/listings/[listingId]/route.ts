// PUBLIC (site-session authorized): a MANAGER edits (PATCH) or removes (DELETE) a
// listing on their site. Cross-site listing ids are rejected in the service.

import { cookies } from "next/headers";
import { withRoute } from "@/lib/http";
import { UpdateListingInput } from "@/server/listings/listings.schema";
import { adminUpdateListing, adminDeleteListing } from "@/server/site-auth/site-admin.service";
import { SITE_SESSION_COOKIE } from "@/lib/site-host";

type Ctx = { params: Promise<{ listingId: string }> };

export const PATCH = withRoute(async (request, { params }: Ctx) => {
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value ?? null;
  const { listingId } = await params;
  const input = UpdateListingInput.parse(await request.json());
  return adminUpdateListing(request.headers.get("host"), token, listingId, input);
});

export const DELETE = withRoute(async (request, { params }: Ctx) => {
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value ?? null;
  const { listingId } = await params;
  return adminDeleteListing(request.headers.get("host"), token, listingId);
});
