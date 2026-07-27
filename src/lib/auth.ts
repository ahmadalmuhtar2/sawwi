// Better Auth (AGENT_GUIDE §2). Email + password with email verification. In
// dev, verification/reset emails go to Mailpit (http://localhost:8025).
//
// `getSessionClaims()` reads the Better Auth session, then derives the trusted
// SessionClaims from the DB (deriveClaims). A dev header fallback stays gated
// behind ALLOW_DEV_AUTH for scripts/tests.

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { headers, cookies } from "next/headers";
import { getPrisma } from "./db";
import { sendMail } from "./mailer";
import { buildEmail } from "@/constants/emails";
import { deriveClaims } from "@/server/auth/claims";
import type { SessionClaims } from "@/server/access/access.rules";
import { errors } from "@/shared/errors";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(getPrisma(), { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendMail({ to: user.email, ...buildEmail("resetPassword", { url }) });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendMail({ to: user.email, ...buildEmail("verifyEmail", { url }) });
    },
  },
  user: {
    additionalFields: {
      platformRole: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  // Session policy (explicit, not the framework default): a 30-day window that
  // slides — any activity after a day of use refreshes it, so an active owner is
  // never logged out mid-work, while an abandoned session lapses in a month. The
  // short signed cookie-cache lets most requests validate the session without a
  // DB round-trip (revocation lags by at most `maxAge`).
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh at most once per active day
    cookieCache: { enabled: true, maxAge: 5 * 60 }, // 5-minute signed cache
  },
  plugins: [nextCookies()],
});

/** Cookie holding the user's active workspace id (set by the switcher). */
export const ACTIVE_WORKSPACE_COOKIE = "sawwi_ws";

export async function getSessionClaims(): Promise<SessionClaims | null> {
  const activeWs = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.id) return deriveClaims(session.user.id, activeWs);

  if (process.env.ALLOW_DEV_AUTH === "true") {
    const uid = (await headers()).get("x-sawwi-user");
    if (uid) return deriveClaims(uid, activeWs);
  }
  return null;
}

export async function requireSessionClaims(): Promise<SessionClaims> {
  const claims = await getSessionClaims();
  if (!claims) throw errors.unauthorized();
  return claims;
}
