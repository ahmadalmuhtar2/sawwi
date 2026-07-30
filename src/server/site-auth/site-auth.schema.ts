// Zod DTOs for per-site end-user auth. The public register/login inputs are the
// trust boundary for unauthenticated endpoints — the site itself comes from the
// Host header (siteSlugFromHost), never from the body.

import { z } from "zod";

export const RegisterInput = z.object({
  email: z.string().trim().toLowerCase().email("بريد إلكتروني غير صالح").max(120),
  password: z.string().min(8, "كلمة المرور ٨ أحرف على الأقل").max(200),
  name: z.string().trim().max(80).optional(),
  // Honeypot — a hidden field real users never fill. Bots do; we drop those.
  company: z.string().max(200).optional(),
});
export type RegisterInput = z.infer<typeof RegisterInput>;

export const LoginInput = z.object({
  email: z.string().trim().toLowerCase().email("بيانات الدخول غير صحيحة").max(120),
  password: z.string().min(1).max(200),
});
export type LoginInput = z.infer<typeof LoginInput>;

export const SetRoleInput = z.object({
  role: z.enum(["manager", "contributor", "member"]),
});
export type SetRoleInput = z.infer<typeof SetRoleInput>;
