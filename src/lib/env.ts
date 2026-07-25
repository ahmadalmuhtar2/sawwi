// Validate process.env ONCE, at first use, with a clear crash if something is
// missing — instead of `undefined` surfacing deep inside a handler later.
// Lazy (not top-level) so builds/edge don't evaluate it prematurely.

import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Core services
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  // Public / routing
  ROOT_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().min(1),

  // Auth (values exist even though Better Auth isn't wired yet)
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().min(1),

  // Internal cron/worker secret
  CRON_SECRET: z.string().min(1),

  // DEV ONLY: when "true", the `x-sawwi-user` header identifies the user
  // (src/lib/auth.ts). Never set in production.
  ALLOW_DEV_AUTH: z.enum(["true", "false"]).optional(),

  // Email (SMTP) — local Mailpit in dev; a real provider in prod.
  SMTP_HOST: z.string().default("mailpit"),
  SMTP_PORT: z.coerce.number().default(1025),
  MAIL_FROM: z.string().default("Sawwi <no-reply@sawwi.local>"),

  // Object storage — optional until the media milestone
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${details}`);
  }
  cached = parsed.data;
  return cached;
}
