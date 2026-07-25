// Domain types used by the pure server logic. These mirror the Prisma enums
// but are declared independently so the logic (and its tests) never depend on
// the generated Prisma client. Keep in sync with prisma/schema.prisma.

export type PlatformRole = "user" | "admin";
export type MemberRole = "owner" | "member";
export type AccessLevel = "editor" | "viewer";
export type SiteStatus = "draft" | "published" | "suspended";
export type SubscriptionStatus = "active" | "grace" | "suspended";
export type ColorScheme =
  | "primary"
  | "bold"
  | "dark"
  | "light"
  | "muted"
  | "accent"
  | "soft";
export type PageType = "landing" | "about" | "contact" | "services" | "custom";
export type Currency = "SYP" | "USD" | "EUR";

export type Result<T = void> =
  | ({ ok: true } & (T extends void ? object : { value: T }))
  | { ok: false; error: string };
