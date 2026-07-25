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

export const POST = withRoute(async (req) => {
  const { token, password } = schema.parse(await req.json());

  // Peek the target user BEFORE reset consumes the token. Better Auth stores
  // reset tokens as a verification row: identifier="reset-password:<token>",
  // value=userId (see better-auth reset-password route).
  const verification = await getPrisma().verification.findFirst({
    where: { identifier: `reset-password:${token}` },
    select: { value: true },
  });
  const user = verification
    ? await getPrisma().user.findUnique({
        where: { id: verification.value },
        select: { email: true },
      })
    : null;
  if (!user) throw errors.validation("انتهت صلاحية الرابط أو أنه غير صالح");

  // Reset (consumes the token, updates the password).
  await auth.api.resetPassword({ body: { token, newPassword: password } });

  // Auto sign-in so the user lands signed-in. nextCookies() sets the session
  // cookie on this response. Unverified accounts can't sign in — then we report
  // signedIn:false and the client routes to /login.
  try {
    await auth.api.signInEmail({
      body: { email: user.email, password },
      headers: await headers(),
    });
    return { signedIn: true };
  } catch {
    return { signedIn: false };
  }
});
