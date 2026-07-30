import { headers } from "next/headers";
import { z } from "zod";
import { withRoute } from "@/lib/http";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { errors } from "@/shared/errors";

// POST /api/auth/reset-and-login — reset the password AND sign the user in, so
// they land in the dashboard instead of the login page. Better Auth's own
// reset endpoint returns no session, so we do it atomically here.
// Static segment → takes precedence over the /api/auth/[...all] catch-all.
const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "٨ أحرف على الأقل"),
});

/** Resolve a reset/invite token to its bound email so the set-password screen
 *  can show it pre-filled and disabled. The email is token-derived server-side;
 *  the disabled field is display-only (the account binding is always the token). */
async function emailForToken(token: string): Promise<string | null> {
  const verification = await getPrisma().verification.findFirst({
    where: { identifier: `reset-password:${token}` },
    select: { value: true },
  });
  if (!verification) return null;
  const user = await getPrisma().user.findUnique({
    where: { id: verification.value },
    select: { email: true },
  });
  return user?.email ?? null;
}

// GET /api/auth/reset-and-login?token=… → { email } for the disabled field.
export const GET = withRoute(async (req) => {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!token) throw errors.validation("رابط غير صالح");
  const email = await emailForToken(token);
  if (!email) throw errors.validation("انتهت صلاحية الرابط أو أنه غير صالح");
  return { email };
});

export const POST = withRoute(async (req) => {
  const { token, password } = schema.parse(await req.json());

  // Peek the target user BEFORE reset consumes the token (identifier
  // "reset-password:<token>", value=userId — see better-auth reset-password route).
  const email = await emailForToken(token);
  if (!email) throw errors.validation("انتهت صلاحية الرابط أو أنه غير صالح");

  // Reset (consumes the token, updates the password).
  await auth.api.resetPassword({ body: { token, newPassword: password } });

  // Auto sign-in so the user lands signed-in. nextCookies() sets the session
  // cookie on this response. Unverified accounts can't sign in — then we report
  // signedIn:false and the client routes to /login.
  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
    return { signedIn: true };
  } catch {
    return { signedIn: false };
  }
});
