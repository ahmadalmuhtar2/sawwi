# Sawwi (سوّي) — Design Brief & Component Inventory (v2)

> **Companion to the PRD.** This is the UI/UX source of truth: the visual language,
> the components that exist, and how to rebuild them in **React + Tailwind**.
> It is the "design brief" flagged as pending in [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) §12 — it
> **drives the visual direction of [`src/sections/`](../src/sections/)** (the section design system).
>
> **Precedence:** the PRD wins on product behaviour; the **AGENT_GUIDE wins on architecture &
> stack**; this brief wins on **visual language, tokens, and component API**. Where this brief's
> prototype references a monorepo path (`packages/ui-components`, `apps/dashboard`,
> `apps/renderer`), read it through the single-app layout — see [§0](#0-architecture-reconciliation).
>
> **Prototype references** (design-time only, not shipped): the living reference for every
> component is `Component Gallery.dc.html`; the full application composition is
> `Sawwi Dashboard.dc.html`.

---

## 0. Architecture reconciliation (read first)

The prototype was drawn against the PRD's 6-service monorepo. Sawwi ships as **one Next.js 16
app** (AGENT_GUIDE §2–§3). Map paths as follows — no shared packages exist:

| Brief / PRD path | Actual location in this repo | Holds |
|---|---|---|
| `packages/ui-components` | [`src/components/`](../src/components/) | Dashboard UI primitives & shell (§2.1–§2.3) |
| `packages/sections` | [`src/sections/`](../src/sections/) | Published-site section library (§2.4) — the keystone |
| `apps/dashboard` | `src/app/(dashboard)/` | `app.sawwi.online` configurator |
| `apps/renderer` | `src/app/(site)/` | `{slug}.sawwi.online` public sites |

The section library is consumed by **both** the public renderer and the dashboard live preview —
one source of truth, exactly as AGENT_GUIDE §6 requires. Configurator primitives (Button, Modal,
DataTable, etc.) live in `src/components/` and are dashboard-only.

**Non-negotiable UX contract** (AGENT_GUIDE §5, PRD §4.3): assembly, not design. No drag-and-drop
canvas, no custom CSS, no blank page. The `SegmentedControl` is the **single tab primitive**. Every
component ships **RTL-first** and is verified in both directions.

---

## 1. Visual language (tokens)

Rebuild these as Tailwind theme extensions so class names like `bg-accent`, `rounded-card`,
`text-ink` work everywhere. Tailwind 4 is already installed — express these in the CSS
`@theme` layer (Tailwind 4's token mechanism) or `tailwind.config` `theme.extend`, whichever the
setup uses.

### 1.1 Color

| Token | Value | Tailwind key |
|---|---|---|
| Paper background | `oklch(0.978 0.004 95)` (warm off-white) | `colors.bg` |
| Surface / card | `#ffffff` | `colors.surface` |
| Ink (text) | `oklch(0.26 0.012 70)` | `colors.ink` |
| Muted text | `oklch(0.52 0.01 75)` | `colors.muted` |
| Faint text / labels | `oklch(0.64 0.008 80)` | `colors.faint` |
| Hairline / divider | `oklch(0.9 0.006 85)` | `colors.line` |
| **Accent (deep green)** | `oklch(0.45 0.085 155)` | `colors.accent.DEFAULT` (+ 100–900 ramp) |
| Accent soft | `oklch(0.95 0.028 155)` | `colors.accent.100` |
| Danger (magenta/red spot) | `oklch(0.53 0.15 25)` | `colors.danger` |
| Warning | `oklch(0.72 0.13 75)` | `colors.warn` |

### 1.2 Shape & elevation

| Token | Value | Tailwind key |
|---|---|---|
| Radius sm / md / lg | `6 / 10 / 14px` | `borderRadius.sm \| md \| lg` |
| Shadow sm | `0 1px 2px rgba(40,35,30,.06)` | `boxShadow.sm` |
| Shadow md | `0 6px 18px -10px rgba(40,35,30,.22)` | `boxShadow.md` |
| Shadow lg | `0 18px 46px -18px rgba(40,35,30,.30)` | `boxShadow.lg` |

Card corners use `rounded-card` (→ `lg`, 14px). Inputs/buttons use `md` (10px). Pills/tags fully round.

### 1.3 Type

Arabic-first, RTL default. Self-hosted via `next/font/local` (AGENT_GUIDE §9 — **no external font
CDNs**). Latin is secondary.

| Role | Family | Weights / treatment |
|---|---|---|
| Body / UI | **Readex Pro** (curated self-hosted set) | 400/500/600 |
| Display / headings | **Cairo** | 700/800 |
| Labels, numerals, code, URLs | **JetBrains Mono** | uppercase, letter-spaced |

Set `dir` on `<html>` from the site/UI language (root layout defaults `lang="ar" dir="rtl"`). Use
**logical properties** everywhere (`ms-*`/`me-*`, `ps-*`/`pe-*`, `start`/`end`) so LTR mirrors for
free — never hard-code `left`/`right`.

### 1.4 Broadsheet note

The project is bound to the **Broadsheet** design system for tokens. The prototype re-skins
Broadsheet's class names (`.btn`, `.card`, `.seg`, `.table`, `.tag`, `.field`, `.input`, `.dialog`)
to the Component Gallery look. In production, express these as Tailwind components (below) reading
the tokens above — do not ship Broadsheet's raw classes.

---

## 2. Component inventory

Every component below is prototyped in `Component Gallery.dc.html` and composed in
`Sawwi Dashboard.dc.html`. Build each as a **typed React component** styled with Tailwind.

- **§2.1–§2.3 → [`src/components/`](../src/components/)** (dashboard-only)
- **§2.4 → [`src/sections/`](../src/sections/)** (shared renderer + preview; the keystone)

### 2.1 Primitives

| Component | Props / states | Notes |
|---|---|---|
| `Button` | variant: `primary \| secondary \| ghost \| subtle \| danger`; size: `sm \| md \| lg`; `loading`, `disabled`, `iconOnly`, leading/trailing icon | Press-down active state, soft shadow on primary. Spinner on `loading`. Real `<button>`. |
| `IconButton` | size, `title` (a11y) | Square, hairline border. `aria-label` required. |
| `Badge` / `Tag` | tone: `accent \| neutral \| danger \| outline`; optional status dot | Pill. Site status: Published/Draft/Grace/Suspended. |
| `Avatar` | size `xs–xl`, `initials`, `tint`, `status` dot, `group` (overflow `+N`) | Initials-based, low-chroma tints. |
| `Input` / `Textarea` | `label`, `placeholder`, `error`, focus ring | Focus = accent ring. |
| `Select` | native, custom chevron | RTL-aware chevron on `end`. |
| `SearchBar` | debounced value, leading search icon, clear | Used by table + combobox. |
| `Combobox` | searchable, keyboard (↑/↓/Enter/Esc), outside-click close, empty state | Type-to-filter dropdown. |
| `SegmentedControl` (Tabs) | `options[]`, `value`, `onChange` | **The canonical tab component.** Radio-backed pill track + white active chip. Used for View-as (Agency/Admin/Client), site filters, manage tabs, analytics range, device toggle, variant A/B/C, payment method. |
| `Tabs` (underline) | in-page section switching | Optional; segmented control is primary. |
| `DataTable` | columns, sortable headers, row select + select-all (indeterminate), pagination, bulk action bar | Client sites / subscriptions / workspaces. |
| `Card` | `elev sm\|md\|lg`, padding | Surface container. |
| `Modal` / `Dialog` | backdrop blur, `sm/md/lg`, Esc + outside-click close, header/body/actions | Create-site, Add-section, Invite, Record-payment. |
| `Toast` | type `success \| info`, auto-dismiss, stack, manual close | Fired by actions (publish, save, copy link…). |
| `Tooltip` | placement, delay | On icon buttons. |
| `Skeleton` | line/box/circle | Loading states. |
| `Stepper` | steps, current | Onboarding progress. |
| `EmptyState` | icon, title, body, CTA | "Create your first site". |

### 2.2 App shell & dashboard

| Component | Notes |
|---|---|
| `Sidebar` / `NavItem` | Role-adaptive items, active bar on `start` edge, badge slot. |
| `Topbar` | Workspace switcher chip, language toggle (AR/EN), notifications bell + popover, avatar. |
| `NotificationsPopover` | In-dashboard alerts only (renewals T-14d / T-3d). No email/WhatsApp. |
| `StatTile` | Kicker + big numeral; rule-separated grid. |
| `RenewalAlert` / `AlertRow` | Colored status icon + copy. |
| `PageHeader` | Title (Cairo) + subtitle + primary action. |

### 2.3 Site builder — the **section configurator** (the v2 model)

Not a free canvas. Left = pages + section list; center = live preview; right = section inspector.

| Component | Notes |
|---|---|
| `BuilderTopbar` | Back, draft-saved indicator, device toggle (desktop/mobile), Preview, Publish (with loading). |
| `PagesRail` | Page list + "Add page" (→ preset picker; drag reorders = nav order). |
| `SectionList` | Ordered sections on the active page; drag handle (**reorder only**), select, per-section variant tag. |
| `SectionInspector` | Variant `A/B/C` (segmented), color scheme (primary/light/dark/accent swatches), content fields, move ↑/↓, remove. |
| `LivePreview` | Renders each section from `{type, variant, scheme}` against the site palette — same section components as the public renderer. |
| `AddSectionGallery` (modal) | Thumbnail grid of all allowed section types for the page type. |
| `TemplatePicker` (in create-site modal) | Vertical starter: barbershop / generic-services / restaurant-lite. |

> **Draft vs published must be visually distinct** at all times (AGENT_GUIDE §9). Autosave is
> debounced. Mobile editing is a **launch requirement** — the inspector and section list must work
> on phones.

### 2.4 Published-site section library — `src/sections/` (the keystone)

Each is a **section component** taking `variant` (A/B/C) and `scheme`
(primary/light/dark/accent), reading shared `SiteSettings`/`SiteTheme`. Per AGENT_GUIDE §6 each
section type exports **three things**: (1) render component (all variants, RTL+LTR, responsive,
AR/EN, honoring scheme), (2) editor field schema (drives the inspector form), (3) preview thumbnail
(for the gallery + variant switcher).

**Frozen at 13 types** for v1 (each with 2–3 designed variants):

`Hero · About/Story · ServicesGrid · PriceList · Gallery · Testimonials · Team · OpeningHours ·
Map+Address · WhatsAppCTA · FAQ · AnnouncementBanner · ContactBlock`

**Header & Footer are automatic** (generated from settings + pages) — variant-configurable only.

Components that show business info (WhatsApp button, Map, Footer, hours) read from `SiteSettings`
by default — **resellers never retype**. Contact is **WhatsApp deep links only** (no form backend).

> **This is the make-or-break milestone (AGENT_GUIDE §6, Milestone 3).** If section quality slips,
> stop and fix it — a mediocre section library kills the entire value proposition. Do not finalize
> section visuals until this brief is agreed.

---

## 3. Data model surfaced in the UI

The dashboard mocks these; they map to the PRD's Builder/Billing schemas (PRD §4, §7) and the
Prisma essentials in AGENT_GUIDE §4. Shapes shown here are the **UI view** — server tenancy scoping
is always re-derived from the session (never trust a client-supplied workspace/site id).

- **Workspace** `{ name, city, phone, commission_pct, status, members[] }`
- **Member** `{ name, email, role: owner|member, joinedAt }`
- **Site** `{ name, slug, vertical, language, status: draft|published|grace|suspended, expiry, visits }`
- **Page** `{ path, title, seo, sections[] }`
- **Section** `{ id, type (see §2.4), variant: A|B|C, scheme: primary|light|dark|accent, content }`
- **SiteTheme** `{ palette (curated), font_key }`
- **SiteSettings** `{ whatsapp, phone, socials, maps_url, address, hours }`
- **Service** (reused by ServicesGrid/PriceList) `{ name, duration, price }`
- **Subscription** `{ plan, price, currency, expiry, status }` + **PaymentRecord** `{ amount, method, date }` + **CommissionEntry** `{ pct, amount, status: owed|settled }`
- **Snapshot** `{ version, author, createdAt }` (publish history + rollback)

> Note: `status: grace` appears in the UI as a distinct badge, though AGENT_GUIDE §4 folds `grace`
> under the `active → grace → suspended` billing flow rather than the core `Site.status` enum
> (`draft|published|suspended`). Treat `grace` as a **billing-derived display state**, not a stored
> `Site.status` value.

---

## 4. Screens implemented in the prototype

Onboarding wizard (3 steps) · Dashboard home · My Sites (grid + filters + create-site/template
modal) · **Section configurator** (pages/preview/inspector + add-section gallery) · Content
(services manager) · Brand/Theme (palettes + font) · Business info settings · SEO · Members &
invites + commission ledger · Analytics (visits chart + top pages) · Billing (subscriptions +
record-payment) · Admin workspaces · Client read-only.

All screens are **Arabic-first RTL** with a working AR/EN + RTL/LTR toggle and a role switcher
(Agency / Admin / Client). Role-adaptive shell: `site_editor`/`site_viewer` see only their invited
site(s) — no workspace nav, member list, or commissions (PRD §3, §8).

---

## 5. Build guidance

- **Stack:** React 19 + Tailwind 4, inside the single Next.js 16 app. Dashboard primitives in
  [`src/components/`](../src/components/); the section library in [`src/sections/`](../src/sections/),
  consumed by both `(dashboard)` live preview and `(site)` renderer.
- **Componentize from §2;** keep the `SegmentedControl` as the single tab primitive.
- **RTL:** logical Tailwind utilities + `dir` from language; **test both directions** for every
  component and every section variant.
- **Accessibility:** real `<button>`; radio-backed segmented control; visible focus rings;
  Esc + outside-click on overlays; `aria-*` on icon-only controls.
- **Fonts:** self-hosted via `next/font/local` only (Readex Pro, Cairo, JetBrains Mono).
- **Performance:** published sections target **LCP < 2.5s on 3G-class connections** (PRD §5).
- **Framework caveat:** this is Next.js 16 — read `node_modules/next/dist/docs/` before writing
  framework code (AGENTS.md).

---

## 6. Open items

- **Prototype assets** (`Component Gallery.dc.html`, `Sawwi Dashboard.dc.html`) are design-time
  references — confirm they are committed somewhere accessible or attach them to this doc.
- **Broadsheet tokens** — verify the final token values against the Broadsheet source before locking
  the Tailwind theme.
- **Icon set** — not specified here; pick one self-hostable icon library and record it.
- Section **variant count per type** (2 vs 3) is per-designer discretion within the 13-type freeze.
