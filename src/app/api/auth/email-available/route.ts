import { z } from "zod";
import { withRoute } from "@/lib/http";
import { isEmailAvailable } from "@/server/auth/auth.service";

// POST /api/auth/email-available — { email } → { available: boolean }.
// Static segment, so it takes precedence over Better Auth's /api/auth/[...all]
// catch-all. POST (not GET) keeps the email out of URLs/access logs.
const schema = z.object({ email: z.email() });

export const POST = withRoute(async (req) => {
  const { email } = schema.parse(await req.json());
  return { available: await isEmailAvailable(email) };
});
