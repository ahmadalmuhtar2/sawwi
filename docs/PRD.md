# Sawwi (سوّي) — Product Requirements Document v2

> **Note:** This is the product source of truth (features, domain rules, milestones).
> For **stack & architecture**, see [`../AGENT_GUIDE.md`](../AGENT_GUIDE.md), which
> deliberately consolidates the 6-service design below into a single Next.js app.
> Where the two conflict, the guide wins on architecture; this PRD wins on product behaviour.

**Product:** Sawwi — Arabic-first, template-based website platform for the Syrian market
**Model change vs v1:** Sawwi is no longer a free-form website builder. It is a **section-based site configurator**: users pick a vertical template, choose their pages, toggle and reorder pre-designed sections, pick a style variant and color scheme per section, and fill structured business content (services, address, hours). Nobody designs anything; everybody assembles quality.
**Scope:** v2 spec, still "v1 launch" scope. E-commerce, online payments, custom domains: out of scope.
**Audience:** engineering agents implementing the system. Each service section is self-contained.

---

## 1. Product Overview

Sawwi serves two creation paths with one product:

- **Workspaces** (agencies/freelancers, one or several users) create and manage many sites for local businesses.
- **Business owners** can be invited by a workspace to edit **their one site only** — sign in with their invited email, edit content and sections of that site, and never see anything else in the workspace.

**Admin** (platform owner) oversees workspaces, records cash payments, manages the template/section library.

Published sites are served on subdomains (`{slug}.sawwi.online`). Revenue is annual, cash, recorded manually; the system enforces expiry and suspension. Drafts are free; **publishing requires an active subscription**.

### Core principles
- Arabic-first everywhere (RTL default), English secondary.
- **Assembly, not design.** The section library carries the design quality; users only make safe choices. It must be impossible to produce an ugly site.
- **Structured content over free text.** Services, hours, address, socials are data — reused across sections, rendered with schema.org SEO, and upgrade-ready for future booking/commerce.
- Cash economy: the system tracks money, never moves it.
- Microservice-shaped but minimal: 6 services, Docker, one VPS.

### Out of scope for v1 launch (do not build)
- Free-form drag-and-drop design, custom CSS, blank canvas
- Online payments, e-commerce, booking
- Custom domains (Phase 1.5)
- Real-time co-editing (soft page locks instead)
- Storage quotas (track usage only), invoices/PDFs
- Email/WhatsApp delivery of renewal notices (in-dashboard alerts only)

---

## 2. Architecture Summary

Unchanged services, one VPS (Hetzner), Docker Compose:

1. **Identity Service** — Keycloak
2. **Builder API** — Node/Express + Prisma (workspaces, sites, structured content, sections, publishing)
3. **Renderer** — Next.js multi-tenant (published sites)
4. **Media Service** — uploads → S3-compatible (R2/Hetzner), sharp pipeline
5. **Billing Service** — payments, subscriptions, expiry, commissions
6. **Dashboard** — Next.js (admin / workspace / site-editor experiences)

Shared: PostgreSQL (schema per service, no cross-schema joins), Redis + BullMQ, Caddy/Traefik with wildcard TLS. TypeScript everywhere. All services validate the same Keycloak JWT. Inter-service calls via env-configured URLs + internal service token.

---

## 3. Section: Identity Service (Keycloak)

- Self-hosted Keycloak, Docker. One realm `sawwi`. Email + password, email verification, password reset. Arabic-first login/register theme.
- **Self-registration enabled.** Client-owner editors arrive via email invites.

### Roles & access
| Role | How created | Scope |
|---|---|---|
| `admin` | seeded | Platform-wide |
| `workspace_owner` | created workspace at onboarding | Whole workspace: members, invites, all sites, commission ledger |
| `workspace_member` | joined via workspace invite link | All workspace sites (create/edit/publish), create site invites |
| `site_editor` | **invited by email to a specific site** | Edit + publish ONLY the assigned site(s). No workspace visibility: no member list, no other sites, no commissions |
| `site_viewer` | invited by email to a specific site | Read-only: site status, expiry, analytics |

### Site-scoped access (key requirement)
- A workspace member invites a person by email to one site with role `editor` or `viewer`.
- If the email has no account: invite email contains a signup link; after verification they land **directly in that site's editor** — no onboarding wizard, no workspace creation.
- If the email has an account: site appears in their "My sites" list.
- A user can be editor/viewer on multiple sites (from any workspaces) — their dashboard lists exactly those.
- Access is revocable by the workspace at any time.
- JWT claims: `role`, `workspace_id` (workspace users), `site_access` (array of `{site_id, level}` for site-scoped users). All tenancy scoping happens server-side from claims.

### Onboarding journey
1. Plain signup (no invite): verify email → wizard: create workspace (name, phone, city) → dashboard empty state. Users in a workspace never see it again. One workspace per user (as owner/member) in v1.
2. Workspace invite link: signup/login → join as `workspace_member`, skip wizard.
3. Site invite link: signup/login → land in that site, `site_editor`/`site_viewer`, skip wizard. If they later want their own workspace, an explicit "create workspace" action exists in their account menu.

---

## 4. Section: Builder API

Owns workspaces, sites, structured content, pages, sections, publishing, versioning.

### 4.1 Workspace & access model (Postgres, schema `builder`)
- **Workspace** — id, name, phone, city, commission_pct, status, created_at
- **WorkspaceMember** — workspace_id, keycloak_user_id, role (`owner`|`member`), joined_at
- **WorkspaceInvite** — workspace_id, token, created_by, expires_at (72h), used_by/used_at
- **SiteAccess** — site_id, keycloak_user_id (nullable until accepted), invited_email, level (`editor`|`viewer`), invited_by, accepted_at, revoked_at
- **PageLock** — page_id, locked_by, heartbeat_at; 2-min auto-release, force take-over allowed

### 4.2 Site & structured content
- **Site** — id, workspace_id, slug (unique, `[a-z0-9-]{3,40}`), business_name, vertical_key (e.g. `barbershop`), template_key, language (`ar`|`en`), status (`draft`|`published`|`suspended`)
- **SiteSettings** — whatsapp_number, phone, socials (JSON), google_maps_url, address, opening_hours (structured JSON: per-day open/close, closed days), logo_media_id, loading_icon_media_id
- **SiteTheme** — palette_key or custom colors (primary/secondary/bg), font_key (curated), style tokens
- **Service** — id, site_id, name, description, price (optional, free text like "من 5000 ل.س"), duration (optional), image_media_id, order, visible — the business's services list, reused by any Services/Pricing section
- **TeamMember** — id, site_id, name, role_title, photo_media_id, order (for Team sections)
- **Testimonial** — id, site_id, author, text, order
- **FaqItem** — id, site_id, question, answer, order

### 4.3 Pages & sections (the configurator core)
- **Page** — id, site_id, path, page_type (`landing`|`about`|`contact`|`services`|`custom`), title, seo (JSON), order (drives the auto navigation menu)
- **SectionInstance** — id, page_id, section_type (from library), variant (style key, e.g. `A`|`B`|`C`), color_scheme (`primary`|`light`|`dark`|`accent` — resolved from SiteTheme), order, content (JSON: section-specific fields like headline/subtext/image refs), data_source (for data sections: which structured entities to show, e.g. selected service ids or "all")
- Users can: add/remove sections from the allowed list per page type, reorder them, switch variant and color scheme per section, edit section fields. Nothing else. **No nesting, no free layout.**
- **Section library v1** (each with 2–3 designed variants, AR/EN, all responsive):
  Hero, About/Story, ServicesGrid, PriceList, Gallery, Testimonials, Team, OpeningHours, Map+Address, WhatsAppCTA, FAQ, AnnouncementBanner, ContactBlock. Header and Footer are automatic (from settings + pages), configurable variant only.
- **Templates** = seed recipes per vertical: page set + section arrangement + default variants + placeholder content in Arabic. v1 verticals: **barbershop** (reference implementation), generic-services, restaurant-lite (menu via PriceList). Template system is data, not code — admin can add templates without deploys.
- **Page presets:** creating a page offers typed presets (Landing / About / Contact / Services / Custom) that pre-fill sensible sections. Users choose how many pages they want; single-page landing is a first-class option (sections stack, nav scrolls).

### 4.4 Publishing & versioning
- All edits write to draft state. **Publish requires `active` subscription** (checked via Billing; friendly explanation otherwise).
- Publish = immutable **PublishSnapshot** (full site: pages, sections, structured content, theme, settings), incrementing version, then Renderer revalidation. Rollback = new snapshot copying an old payload. History append-only.
- `site_editor` can edit and publish their site; cannot delete the site, manage access, or see billing beyond expiry status.

### 4.5 Key endpoints (JWT-protected, claim-scoped)
- Workspaces: `POST /workspaces`, invites accept/revoke, members CRUD (owner)
- Site access: `POST /sites/:id/access` (invite email + level), `DELETE /sites/:id/access/:id`
- Sites: CRUD; `PUT settings|theme`; structured content CRUD (`/services`, `/team`, `/testimonials`, `/faq`)
- Pages & sections: page CRUD with presets; `POST/PATCH/DELETE /pages/:id/sections`, reorder endpoints
- Publish: `POST /sites/:id/publish`, snapshots list, rollback
- Internal: `GET /internal/render/:slug` (Renderer only) — latest snapshot + status, Redis-cached 60s

### 4.6 Implementation note (Puck)
Puck may be used internally as the section-list engine (sections = top-level components only, drag = reorder, props = variant/scheme/fields), or replaced by a simpler custom list UI — implementer's choice. The UX contract is what's specified above; the free-form canvas must never be exposed.

> **Sawwi decision:** Puck **rejected** — build a purpose-built custom list UI. See `AGENT_GUIDE.md` §5.

---

## 5. Section: Renderer

- Next.js App Router, ISR, tenant by Host header (`{slug}.sawwi.online`), reads latest snapshot only.
- **Section components** are the design system: every section_type × variant × color_scheme, pixel-perfect in RTL and LTR, responsive, AR/EN. This is the product's face — hold the highest quality bar here.
- Branded loading states on client-side navigation: per-site logo/loading icon (from settings) in `loading.tsx`.
- Fonts: curated self-hosted set (Cairo, Tajawal, Almarai, IBM Plex Sans Arabic, Noto Kufi Arabic, Rubik, Readex Pro) via `next/font/local`. No external font CDNs.
- Navigation auto-generated from pages (order + titles); single-page sites render anchor-scroll nav.
- Contact = WhatsApp deep links only; no form backend.
- SEO: per-page meta/OG; **schema.org structured data generated from content** — LocalBusiness (address, hours, phone) + Service entries. Auto sitemap.xml/robots.txt.
- Suspended sites: polite AR/EN "renew to reactivate" page, HTTP 402, noindex. Unknown slug: branded 404.
- Analytics beacon: cookie-less pageview `POST /a/hit`, aggregated daily per site (Redis buffer → BullMQ flush → Postgres).
- Performance: LCP < 2.5s on 3G-class connections.

---

## 6. Section: Media Service

Unchanged from v1 spec:
- Presigned uploads scoped to `sites/{site_id}/`; images only (jpg/png/webp, sanitized svg), ≤10MB.
- Sharp pipeline: strip EXIF, WebP + responsive variants (320/640/1280/1920w), dimensions + blurhash.
- Storage: S3-compatible (R2 / Hetzner Object Storage, env-configured). Serving: `media.sawwi.online`, immutable keys, long cache.
- Track bytes per site (no enforcement). Soft-delete with site; hard cleanup after 90 days.

---

## 7. Section: Billing Service

Unchanged model, workspace-based:
- One site = one annual subscription, cash, recorded manually by admin. **No active subscription → no publish.**
- Statuses `active` → `grace` (7 days) → `suspended`; daily BullMQ job; instant reactivation on recorded payment.
- **PaymentRecord** (amount, currency SYP/USD/EUR, method cash/mobile_money/bank_transfer/other, collected_by, note) extends expiry +1 year.
- **CommissionEntry** per workspace from `commission_pct` at record time; admin settles in bulk; owner sees ledger read-only.
- Renewal alerts at T-14d and T-3d, in-dashboard only, to admin + owning workspace.

---

## 8. Section: Dashboard

One Next.js app (`app.sawwi.online`), role-adaptive. **Arabic-first (RTL) with English toggle.** Mobile-friendly throughout — the configurator (unlike a canvas editor) must work well on phones; section editing on mobile is a launch requirement, not a nice-to-have.

### The configurator (heart of the product — workspace users and site editors)
- Left: pages list (add page → preset picker; drag to reorder = nav order)
- Center: live preview of the page, section by section
- Per section: reorder handles, variant switcher (visual thumbnails), color-scheme picker, content form (fields defined by section type), remove
- "Add section" → gallery of allowed sections with preview thumbnails
- Content tab: structured data managers (Services, Team, Testimonials, FAQ) with drag ordering
- Settings tab: business info (WhatsApp, phone, socials, maps URL, address, opening-hours editor), logo + loading icon upload
- Theme tab: palette picker (curated palettes + custom colors), font picker (curated)
- SEO panel per page; publish button (subscription-gated with clear messaging) + version history + rollback
- Edit locks: "X is editing" indicator, read-only fallback, take-over
- Autosave (debounced) with clear draft ≠ published indicator

### Admin views
- Workspaces (list, disable, commission_pct, members), all sites with overrides
- Billing: record payments, expiring/grace/suspended filters, commission settle
- **Template manager:** create/edit vertical templates (page sets, default sections/variants, placeholder content) as data
- Platform stats: workspaces, sites, revenue/month, signups/week

### Workspace views
- Sites list (status/expiry badges), create site (vertical → template → slug/name/language)
- Members & invites page (owner); site-access management per site (invite email as editor/viewer, revoke)
- Commission ledger (owner, read-only); analytics per site; renewal alerts

### Site editor / viewer views
- "My sites" = exactly the sites they were invited to
- Editor: full configurator for that site (no delete, no access management, no billing beyond expiry status)
- Viewer: status, link, expiry, visit counts

---

## 9. Cross-cutting Requirements

Unchanged from v1: JWT-claim tenancy scoping server-side; internal service tokens on the Docker network; rate-limiting auth/uploads; nightly Postgres dumps + S3 versioning (30d); pino structured logs + request IDs; self-hosted error tracking; monorepo (pnpm + Turborepo) — `apps/dashboard`, `apps/renderer`, `services/builder-api`, `services/media`, `services/billing`, `packages/sections` (the section design system: components + variant definitions + editor field schemas, shared by Renderer and Dashboard preview), `packages/shared`, `infra/`. CI: lint/typecheck/test/build → compose deploy.

**`packages/sections` is the single source of truth** for section types: each section exports its render component (all variants), its editor field schema, and its preview thumbnail. Adding a section = adding to this package only.

> **Sawwi decision:** consolidated to a **single Next.js app**; `packages/sections` → `src/sections/`;
> Keycloak → Better Auth; no Redis/BullMQ in v1. See `AGENT_GUIDE.md` §2.

---

## 10. Milestones & Timeline

Assumption: one senior full-stack at ~35h/week with AI agents. The design bar for the section library is the schedule risk — protect it.

| # | Milestone | "Done" means | Est. | Cum. |
|---|---|---|---|---|
| 1 | Infra skeleton | Compose up: Caddy wildcard TLS, Postgres, Redis, Keycloak (`sawwi` realm, self-reg + verification, AR theme), CI deploy | 1 wk | 1 |
| 2 | Builder API core | Workspaces/members/invites, sites, structured content, pages+sections model, site-scoped access, publish (subscription-gated) + snapshots + rollback, locks, render endpoint | 2.5 wk | 3.5 |
| 3 | Section design system | `packages/sections`: 13 section types × 2 variants, RTL/LTR, responsive, color schemes, field schemas, thumbnails — the make-or-break milestone | 2.5 wk | 6 |
| 4 | Renderer | Tenant resolution, snapshot rendering with sections, ISR, nav, schema.org, suspension/404, fonts, branded loading states | 1.5 wk | 7.5 |
| 5 | Dashboard + configurator | Auth (PKCE), onboarding wizard, sites CRUD, the full configurator (pages/sections/variants/content/theme/settings/SEO), members + site-access invites, publish/history UI, mobile QA | 3 wk | 10.5 |
| 6 | Media Service | Presigned uploads, sharp pipeline, CDN serving, image handling in sections | 1 wk | 11.5 |
| 7 | Billing Service | Payments, expiry jobs, commissions, admin billing views, alerts | 1.5 wk | 13 |
| 8 | Templates + analytics + polish | Barbershop + generic + restaurant-lite templates (data), template manager, analytics views, RTL QA, Arabic copy | 1.5 wk | 14.5 |
| 9 | Pilot launch | 5 real businesses live; feedback loop running | 1 wk | 15.5 |
| — | **Buffer** | Keycloak fights, RTL edges, design iteration | 2 wk | **~17.5** |

**Target: pilots live ~3.5 months, stable v1 ~4–4.5 months.**

Rules:
- Milestone 3 gates everything visual — if section quality slips, stop and fix; a mediocre section library kills the whole value proposition.
- Section library is frozen at 13 types until pilots ask for more. Variants can grow post-launch.
- Milestone 9 is a hard gate: no new features until 5 pilot sites are live.
