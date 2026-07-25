import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Better Auth mounts all its endpoints here: /api/auth/sign-up, /sign-in,
// /verify-email, /reset-password, /get-session, etc.
export const { POST, GET } = toNextJsHandler(auth);
