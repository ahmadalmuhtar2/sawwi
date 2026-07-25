// Pre-signup helpers. Kept out of the Better Auth flow because Better Auth
// intentionally hides duplicate emails (enumeration protection); the product
// decision here is to tell the user explicitly when an email is already taken.

import { getPrisma } from "@/lib/db";

/** True when no account exists for this email (case-insensitive). */
export async function isEmailAvailable(email: string): Promise<boolean> {
  const existing = await getPrisma().user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  return existing === null;
}
