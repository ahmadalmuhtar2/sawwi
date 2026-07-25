// The signed-in user's own personal profile (distinct from workspace/site data).

import { getPrisma } from "@/lib/db";
import type { SessionClaims } from "@/server/access/access.rules";
import type { UpdateProfileInput } from "./account.schema";

const PROFILE_SELECT = { name: true, email: true, image: true } as const;

export async function getProfile(claims: SessionClaims) {
  return getPrisma().user.findUnique({
    where: { id: claims.userId },
    select: PROFILE_SELECT,
  });
}

export async function updateProfile(claims: SessionClaims, input: UpdateProfileInput) {
  return getPrisma().user.update({
    where: { id: claims.userId },
    data: { name: input.name },
    select: PROFILE_SELECT,
  });
}
