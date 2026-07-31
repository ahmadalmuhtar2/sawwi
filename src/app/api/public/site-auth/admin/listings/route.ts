// PUBLIC (site-session authorized): a MANAGER lists (GET) or creates (POST) the
// site's listings. Same validation the dashboard uses (CreateListingInput).

import { cookies } from "next/headers";
import { withRoute } from "@/lib/http";
import { CreateListingInput } from "@/server/listings/listings.schema";
import { adminListListings, adminCreateListing } from "@/server/site-auth/site-admin.service";
import { SITE_SESSION_COOKIE } from "@/lib/site-host";

export const GET = withRoute(async (request) => {
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value ?? null;
  return adminListListings(request.headers.get("host"), token);
});

export const POST = withRoute(async (request) => {
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value ?? null;
  const input = CreateListingInput.parse(await request.json());
  return adminCreateListing(request.headers.get("host"), token, input);
});
