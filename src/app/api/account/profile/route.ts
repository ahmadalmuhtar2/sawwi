import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { updateProfileSchema } from "@/server/account/account.schema";
import { getProfile, updateProfile } from "@/server/account/account.service";

// GET  /api/account/profile — the signed-in user's personal profile.
export const GET = withRoute(async () => {
  const claims = await requireSessionClaims();
  return getProfile(claims);
});

// PUT  /api/account/profile — update the user's personal name.
export const PUT = withRoute(async (req) => {
  const claims = await requireSessionClaims();
  const input = updateProfileSchema.parse(await req.json());
  return updateProfile(claims, input);
});
