# Sawwi (سوّي) — Agent Build Guide

**This is the single authoritative guide for anyone (human or AI agent) building Sawwi.**
Read it fully before writing code. It records *what* we're building, the *stack decisions*
we've locked, and the *conventions* to follow.

- **Product source of truth:** [`docs/PRD.md`](docs/PRD.md) — the full v2 PRD (features, domain rules, milestones).
- **This guide overrides the PRD on stack & architecture.** The PRD describes a 6-service
  microservice system; we have deliberately consolidated it (see §2). Where they conflict,
  **the architecture in this guide wins**; the PRD remains the truth for product behaviour.
- **Framework caveat:** this is **Next.js 16** (App Router, React 19). It has breaking changes
  vs. older Next.js. Before writing framework code, read the relevant guide in
  `node_modules/next/dist/docs/` and heed deprecation notices. See `AGENTS.md`.

---

## 1. What Sawwi is (in one paragraph)

Sawwi is an **Arabic-first (RTL), template-based website *configurator*** for the Syrian
market — **not** a free-form website builder. Users pick a vertical template (e.g. barbershop),
choose their pages, toggle and reorder **pre-designed sections**, pick a style variant and color
scheme per section, and fill **structured business content** (services, hours, address). Nobody
designs anything from scratch — **everybody assembles quality**. Published sites are served on
subdomains (`{slug}.sawwi.online`). Revenue is annual, cash, recorded manually; the system enforces
expiry and suspension. Drafts are free; **publishing requires an active subscription**.

**The prime directive:** *Assembly, not design. It must be impossible to produce an ugly site.*
The section library carries all the design quality; users only make safe choices. Ahmad's framing:
Sawwi is a **static pages builder, not a customizable canvas**. There is **no drag-and-drop
canvas, no custom CSS, no blank page** — ever.

### Out of scope for v1 (do NOT build)
Free-form design / custom CSS · online payments / e-commerce / booking · custom domains ·
real-time co-editing (use soft page locks) · storage quotas · invoices/PDFs · email/WhatsApp
delivery of renewal notices (in-dashboard alerts only).

---

## 2. Architecture — the locked decisions

The PRD proposes 6 services (Keycloak, Builder API, Renderer, Media, Billing, Dashboard).
**We consolidated deliberately** — Sawwi is built by one senior full-stack dev + AI agents, so
the whole thing is **one Next.js app**. These decisions are final for v1:

> **OVERRIDE (2026-07-22):** Ahmad reinstated **Redis + BullMQ** for background/heavy jobs,
> overriding the two "dropped for v1" rows below. The stack now runs a **Redis** container and a
> dedicated **worker** process; heavy work (image processing, expiry sweep, analytics flush) goes
> through BullMQ queues instead of inline/cron. The rows below are kept for history; the override
> wins. See `docs/BACKEND_DECISIONS.md`.

| Decision | Choice | Why |
|---|---|---|
| **App shape** | **ONE Next.js 16 app** (App Router), front **and** back | Solo dev; Next.js is a full-stack framework. From 6 services → 1 app + Postgres + Caddy. |
| **Routing** | Middleware routes by **hostname** | `app.sawwi.online` → dashboard; `{slug}.sawwi.online` → public rendered site. Same codebase. |
| **Backend** | Next.js **Route Handlers + Server Actions** | No separate backend framework. Prisma talks to Postgres inside these. |
| **Auth** | **Better Auth** (TypeScript, inside the app) | Chosen over the PRD's Keycloak — keeps everything TS, no Java server to operate. Provides email verify, password reset, organizations. |
| **Database** | **PostgreSQL + Prisma** | Single DB; logical separation by module, not separate servers. |
| **Background jobs** | **Folded into Next.js — no worker, no BullMQ in v1** | Image processing runs inline in the upload handler (self-hosted Node = no timeout). Expiry sweep + analytics flush = protected route handlers triggered by a nightly **cron**. |
| **Object storage** | **Cloudflare R2** (S3-compatible) | Zero egress, CDN edge. Served via `media.sawwi.online`. Env-swappable (Hetzner Object Storage also works). |
| **Images** | **sharp** | WebP + responsive variants, EXIF strip, blurhash. |
| **Fonts** | **Self-hosted** via `next/font/local` | No external font CDNs. |
| **Reverse proxy + TLS** | **Caddy** (recommended; soft) | Automatic **wildcard** TLS for `*.sawwi.online`. Traefik is the alternative. Confirm at M1. |
| **Error tracking** | **GlitchTip** self-hosted (recommended; soft) | Sentry-compatible, lightweight. Confirm at M1. |
| **Monorepo tooling** | **None** — plain single Next.js repo | Single app has no cross-app packages; pnpm workspaces / Turborepo dropped. |
| **Redis** | **Not used in v1** | Its only jobs were BullMQ (dropped) + caching/analytics buffering; Next.js ISR/data cache + direct Postgres writes suffice at pilot scale. Add back only if BullMQ/distributed caching returns. |

### What runs in production
```
Internet
   │
   ▼
 Caddy            ← ports 80/443, holds the *.sawwi.online wildcard TLS cert
   │
   ▼
 Next.js app      ← middleware reads Host → dashboard OR public site render
   │
   ├──► PostgreSQL (Prisma)
   └──► Cloudflare R2 (media)
```
Docker Compose on a single **Hetzner VPS**. Realistically three containers: **Next app +
Postgres + Caddy**.

### Deviations from the PRD — quick reference
- Keycloak → **Better Auth**
- 6 services → **1 Next.js app**
- BullMQ worker → **cron-triggered route handlers + inline sharp**
- Redis → **dropped for v1**
- pnpm workspaces / Turborepo → **plain single repo**
- `packages/sections` (shared package) → **`src/sections/` internal module** (still the single source of truth)

---

## 3. Repository layout (target)

Current state: fresh `create-next-app` (TypeScript, Tailwind 4, App Router, `src/` dir,
import alias `@/*`). Grow it toward this shape:

```
src/
  app/
    (dashboard)/            # app.sawwi.online — authed configurator
    (site)/                 # {slug}.sawwi.online — public rendered sites (ISR)
    api/                    # route handlers: REST endpoints, cron targets, media presign, analytics beacon
    layout.tsx              # root: lang="ar" dir="rtl" by default (Arabic-first)
  middleware.ts             # hostname → dashboard vs public site; tenant resolution
  sections/                 # THE section design system (single source of truth) — see §6
  lib/                      # infra clients: db, auth, r2, redis, jobs (BullMQ), env, logger, cron
  server/                   # feature-folders: <feature>/{schema,rules,service,repository}.ts (+ test)
  shared/                   # framework-agnostic contracts/utils: errors, api-response envelope, Result
  constants/                # static content: AR/EN texts, email/whatsapp templates, limits
  worker/                   # BullMQ worker entrypoint (runs as its own container)
  components/               # shared dashboard UI
prisma/
  schema.prisma
docs/
  PRD.md                    # product source of truth
Dockerfile                  # multi-stage: app + worker targets
compose.yaml                # full stack at repo root (app, worker, postgres, redis, caddy)
Caddyfile                   # reverse proxy config
AGENT_GUIDE.md              # this file
AGENTS.md                   # agent rules (auto-discovered) → points here
```
Nothing above is created yet except the create-next-app defaults — this is the map, build it milestone by milestone.

---

## 4. Domain model (Prisma — the essentials)

Full detail in the PRD §4. Core entities and the rules that matter:

- **Workspace** — agencies/freelancers. `id, name, phone, city, commission_pct, status`.
- **WorkspaceMember** — `workspace_id, user_id, role (owner|member)`.
- **WorkspaceInvite** — token, 72h expiry.
- **Site** — `id, workspace_id, slug (unique [a-z0-9-]{3,40}), business_name, vertical_key,
  template_key, language (ar|en), status (draft|published|suspended)`.
- **SiteAccess** — site-scoped invites: `site_id, user_id (nullable until accepted),
  invited_email, level (editor|viewer)`. **This is how a business owner edits ONLY their one site.**
- **SiteSettings** — whatsapp, phone, socials(JSON), maps URL, address, `opening_hours`(structured
  JSON), logo + loading-icon media ids.
- **SiteTheme** — palette (curated key or custom primary/secondary/bg), curated font key.
- **Structured content** (reused across sections): **Service, TeamMember, Testimonial, FaqItem** —
  each `site_id, …, order`.
- **Page** — `site_id, path, page_type (landing|about|contact|services|custom), title, seo(JSON),
  order` (order drives auto navigation).
- **SectionInstance** — `page_id, section_type, variant (A|B|C…), color_scheme
  (primary|light|dark|accent), order, content(JSON), data_source` (which structured entities to show).
- **PublishSnapshot** — immutable full-site payload; incrementing version; append-only history;
  rollback = new snapshot copying an old payload.
- **PageLock** — soft lock, 2-min heartbeat auto-release, force take-over allowed.

**Roles:** `admin` (platform) · `workspace_owner` · `workspace_member` · `site_editor` ·
`site_viewer`. See PRD §3 for the full matrix.

---

## 5. The configurator UX contract (do not violate)

The dashboard's configurator lets users do **exactly** this and nothing more:
- Add / remove sections **from the allowed list per page type**
- **Reorder** sections (drag = reorder only)
- Switch **variant** and **color scheme** per section
- Edit the section's **fields** (defined by its field schema)
- Manage structured content (Services/Team/Testimonials/FAQ) with drag ordering
- Edit Settings, Theme, SEO; Publish (subscription-gated)

**No nesting. No free layout. No custom CSS. No blank canvas.** If an implementation ever exposes
a free-form canvas, it is wrong. Puck was considered as an internal engine and **rejected** — build
a purpose-built reorderable list + props form. **Mobile editing is a launch requirement**, not a
nice-to-have.

---

## 6. `src/sections/` — the section design system (the keystone)

This is **the product's face and the single source of truth**. Each section type exports three things:
1. **Render component** — all its variants, pixel-perfect in **RTL and LTR**, responsive, AR/EN,
   honoring `color_scheme`. Used by BOTH the public renderer and the dashboard live preview.
2. **Editor field schema** — declares the editable fields (drives the configurator's props form).
3. **Preview thumbnail** — for the "add section" gallery and variant switcher.

**Adding a section = adding to this module only.** Nothing else should need to change.

**Section library v1 — frozen at 13 types** (each with 2–3 designed variants):
Hero · About/Story · ServicesGrid · PriceList · Gallery · Testimonials · Team · OpeningHours ·
Map+Address · WhatsAppCTA · FAQ · AnnouncementBanner · ContactBlock.
Header & Footer are **automatic** (from settings + pages), variant-configurable only.

> **Milestone 3 (the section design system) is the make-or-break gate.** If section quality slips,
> stop and fix it — a mediocre section library kills the entire value proposition.

---

## 7. Rendering, tenancy & SEO

- **Tenant resolution:** `middleware.ts` reads the `Host` header. `app.sawwi.online` → dashboard
  route group; `{slug}.sawwi.online` → public site route group, resolving the site by slug.
- **Public sites use ISR** and read the **latest PublishSnapshot only** (never live draft).
- **Navigation** auto-generated from pages (order + titles). **Single-page sites** are a
  first-class option → anchor-scroll nav.
- **SEO:** per-page meta/OG + **schema.org from content** — `LocalBusiness` (address, hours, phone)
  + `Service` entries. Auto `sitemap.xml` / `robots.txt`.
- **Suspended sites:** polite AR/EN "renew to reactivate" page, **HTTP 402**, `noindex`.
  Unknown slug → branded 404.
- **Contact = WhatsApp deep links only.** No form backend.
- **Branded loading states** on client nav via per-site logo/loading icon in `loading.tsx`.
- **Performance target:** LCP < 2.5s on 3G-class connections.

---

## 8. Media, billing & jobs

- **Media:** presigned uploads scoped to `sites/{site_id}/`; images only (jpg/png/webp, sanitized
  svg), ≤10MB. **sharp runs inline in the upload route handler** — strip EXIF, emit WebP +
  320/640/1280/1920w variants, dimensions + blurhash. Store to R2, serve immutable keys via
  `media.sawwi.online` with long cache. Track bytes per site (no enforcement).
- **Billing:** one site = one **annual cash** subscription, recorded manually by admin.
  **No active subscription → no publish.** Status flow `active → grace (7d) → suspended`, driven by
  a **daily cron-triggered route handler**. A `PaymentRecord` extends expiry +1 year and reactivates
  instantly. `CommissionEntry` per workspace from `commission_pct` at record time. Renewal alerts at
  T-14d and T-3d, **in-dashboard only**.
- **Analytics:** cookie-less pageview beacon `POST /api/a/hit`; aggregate daily per site
  (batch → Postgres via a cron-triggered flush handler; no Redis in v1).

---

## 9. Conventions

- **TypeScript everywhere.** Strict.
- **Arabic-first / RTL by default.** Root layout: `lang="ar" dir="rtl"`. English is secondary
  (toggle). Use **CSS logical properties** (`ms-`, `me-`, `ps-`, `pe-`, `start/end`) — never
  hard-code `left`/`right`. Every section must be verified in **both** RTL and LTR.
- **Tenancy is scoped server-side** from the authenticated session/claims (`role`, `workspace_id`,
  `site_access[]`). **Never trust a client-supplied workspace/site id** — always re-derive access
  on the server.
- **Drafts vs published** must always be visually distinct in the dashboard. Autosave is debounced.
- **Structured content over free text** — services/hours/address are data, rendered with schema.org.
- Self-hosted fonts only. Internal API/cron endpoints protected by a shared secret.
- Nightly Postgres dumps; pino structured logs + request IDs.

---

## 10. Milestones (from the PRD, adapted to one app)

1. **Infra skeleton** — Compose up: Caddy wildcard TLS, Postgres; Next app deploys via CI.
2. **Core data + API** — Prisma schema (workspaces/members/invites, sites, structured content,
   pages+sections), Better Auth, site-scoped access, publish (subscription-gated) + snapshots +
   rollback, soft locks.
3. **Section design system** (`src/sections/`) — **13 sections × 2 variants**, RTL/LTR, responsive,
   color schemes, field schemas, thumbnails. **The make-or-break milestone.**
4. **Renderer** — hostname tenancy, snapshot rendering, ISR, auto-nav, schema.org, suspension/404,
   fonts, branded loading.
5. **Dashboard + configurator** — auth flows, onboarding wizard, sites CRUD, the full configurator
   (pages/sections/variants/content/theme/settings/SEO), members + site-access invites,
   publish/history UI, **mobile QA**.
6. **Media** — presigned uploads, inline sharp pipeline, CDN serving, images in sections.
7. **Billing** — payments, expiry cron, commissions, admin billing views, alerts.
8. **Templates + analytics + polish** — barbershop (reference) + generic-services + restaurant-lite
   templates (as **data**, not code), template manager, analytics, RTL QA, Arabic copy.
9. **Pilot launch** — 5 real businesses live. **Hard gate: no new features until 5 pilots are live.**

Target: pilots ~3.5 months, stable v1 ~4–4.5 months. **Milestone 3 gates everything visual.**

---

## 11. How to work on this project (working style)

Ahmad is an experienced developer deliberately rebuilding hands-on coding muscle after
over-relying on AI. **Work as a pair programmer, not a ghostwriter:**
- Explain concepts before showing code; keep example snippets short.
- Let Ahmad type the actual implementation; walk decisions in small steps.
- Ask before making architectural calls; don't scaffold many things at once.
- If about to write a large chunk of code, stop and check first.

---

## 12. Still open / pending
- **Design brief** — a "Sawwi design brief · MD" is expected in a later phase; it drives the visual
  direction of `src/sections/`. Do not finalize section visuals before it lands.
- **Soft infra picks** — Caddy (vs Traefik) and GlitchTip: confirm at Milestone 1.
- Everything else in §2 is **locked**.
