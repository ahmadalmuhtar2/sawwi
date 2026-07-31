// PUBLIC (site-session authorized): a SELLER lists their own listings (GET) or
// posts a new one (POST). Authorized + scoped to the caller in the service.

import { cookies } from "next/headers";
import { withRoute } from "@/lib/http";
import { CreateListingInput } from "@/server/listings/listings.schema";
import { sellerListMine, sellerCreate } from "@/server/site-auth/site-seller.service";
import { SITE_SESSION_COOKIE } from "@/lib/site-host";

export const GET = withRoute(async (request) => {
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value ?? null;
  return sellerListMine(request.headers.get("host"), token);
});

export const POST = withRoute(async (request) => {
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value ?? null;
  const input = CreateListingInput.parse(await request.json());
  return sellerCreate(request.headers.get("host"), token, input);
});
