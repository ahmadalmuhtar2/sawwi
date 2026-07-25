# Sawwi — overnight build: what's working & how to run

A clickable, front-to-back working version: register → verify email → onboard →
create a site from a template → configure it → publish → view the live site on
its subdomain. All wired to real Postgres via the layered backend.

## Run it (fastest, full interactive path)

```bash
docker compose up -d            # postgres, redis, mailpit, worker, caddy (+ app image)
pnpm dev                        # the app on http://localhost:3000  (dev auth + live reload)
```

- **App / dashboard:** http://localhost:3000
- **A published demo site:** http://diwan.localhost:3000
- **Local email inbox (Mailpit):** http://localhost:8025  ← verification/reset emails land here
- The whole stack also runs containerized behind Caddy on **http://localhost** (`docker compose up` builds the `app` image); `pnpm dev` is recommended for the login demo.

## Demo accounts (seeded — `pnpm db:seed` to recreate)

| Role | Email | Password |
|---|---|---|
| Agency owner | `owner@sawwi.local` | `Sawwi12345!` |
| Platform admin | `admin@sawwi.local` | `Sawwi12345!` |

The owner already has a workspace (**وكالة النور**) and a published demo site
(**صالون الديوان**, `diwan.localhost`).

## Click-through to try

1. **Register** a fresh account at `/register` → a verification email appears in
   **Mailpit** (`localhost:8025`) → click the link → you're verified.
2. **Log in** → onboarding asks you to **create a workspace**.
3. **Create a site** → pick the **barbershop** template → it instantiates a full
   site (7 sections + 4 services + business settings).
4. In the **configurator**: select sections, edit their text, switch
   **variant** (A/B/C) and **color scheme**, reorder, add/remove — live preview
   updates. **الإعدادات** edits business info + services.
5. **Publish** — blocked until there's an active subscription
   (`SUBSCRIPTION_REQUIRED`). As **admin**, record a payment
   (`POST /api/sites/:id/payments`) → then publish succeeds.
6. Visit **`{slug}.localhost:3000`** → the live Arabic RTL site renders.

## What's built

- **Auth:** Better Auth (email+password) with **email verification + password
  reset** via local Mailpit. Session → DB-derived `SessionClaims`.
- **Landing page:** professional Arabic RTL marketing page.
- **Dashboard:** role-adaptive shell, onboarding, My Sites, the **configurator**
  (pages rail · live preview · inspector · add-section gallery), business
  settings + services editor.
- **Templates:** barbershop / generic-services / restaurant-lite as data;
  create-site instantiates real rows.
- **Sections:** core render library (Hero, About, ServicesGrid, PriceList,
  Gallery, Testimonials, OpeningHours, MapAddress, WhatsAppCTA, Header, Footer),
  RTL, color-scheme aware — shared by preview + public renderer.
- **Public renderer:** hostname/subdomain routing (`src/proxy.ts`), published-only,
  WhatsApp deep links.
- **Backend:** the full feature set from before (workspaces, sites, content,
  pages/sections, publishing+snapshots, billing) behind the unified `{ok,...}`
  API envelope, feature-folder architecture.

**Checks:** `pnpm typecheck` ✓ · `pnpm test` (59) ✓ · `pnpm lint` ✓ ·
`pnpm build` ✓ · Docker images build ✓.

## Closed since the overnight build

- **True snapshot rendering** ✓ — the public site now serves the frozen
  `PublishSnapshot` payload (`getPublishedRenderData`), not the live draft. Edits
  after publishing don't leak until you publish again. Seed publishes a real
  snapshot (idempotent backfill for pre-existing sites).
- **All 13 section types styled** ✓ — added `Team`, `Faq` (accordion),
  `AnnouncementBanner`, `ContactBlock`; `RenderSection` no longer returns null
  for any library type.
- **Variants B/C** ✓ — `Hero`, `About`, `ServicesGrid`, `Gallery`,
  `Testimonials`, `Team` now render distinct layouts per variant (alignment /
  columns / emphasis of the same content). Live in the configurator preview too.
- **Publish-history UI** ✓ — `/dashboard/sites/[id]/history` lists every
  snapshot (version · date · author), flags the currently-served version, and
  offers one-click **rollback** (append-only republish). Linked from the
  configurator topbar (“السجل”).

## Known gaps / next (not blocking the demo)

- **Media uploads (R2)** deferred — needs R2 creds; sections use placeholders.
- Dashboard screens still thin: members, billing ledger, analytics, SEO
  (their APIs exist).
- Containerized login uses `BETTER_AUTH_URL=app.localhost`; use `pnpm dev`
  (localhost:3000) for the smoothest auth demo.
