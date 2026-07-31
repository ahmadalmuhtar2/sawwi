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
  // Client-safe root host label for UI (e.g. "localhost:3000" / "sawwi.online").
  // Mirrors ROOT_DOMAIN but readable in client components. See src/lib/site-url.ts.
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().min(1),

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
  // Auth for real SMTP. Unset locally (Mailpit needs no auth). SMTP_SECURE
  // overrides the port-based TLS default (465=on).
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.enum(["true", "false"]).optional(),
  MAIL_FROM: z.string().default("Sawwi <no-reply@sawwi.local>"),

  // EmailJS (prod transport). When all four are set, sendMail uses the EmailJS
  // REST API instead of SMTP. PRIVATE_KEY is required for server-side sending.
  EMAILJS_SERVICE_ID: z.string().optional(),
  EMAILJS_TEMPLATE_ID: z.string().optional(),
  EMAILJS_PUBLIC_KEY: z.string().optional(),
  EMAILJS_PRIVATE_KEY: z.string().optional(),

  // Object storage — optional until the media milestone
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  // Web Push (PWA notifications) — optional; push is disabled until all three are
  // set. Generate a keypair with `npx web-push generate-vapid-keys`. The PUBLIC
  // key is also exposed to the client as NEXT_PUBLIC_VAPID_PUBLIC_KEY (same value).
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  // The VAPID "subject": a mailto: or https: URL identifying the sender.
  VAPID_SUBJECT: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
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
