# Sawwi — Design Brief & Component Inventory (v2)

Companion to the PRD. This document tells an implementing engineer **which UI components exist**, where they were prototyped, and how to rebuild them in **React + Tailwind**. The living reference for every component is `Component Gallery.dc.html`; the full application composition is `Sawwi Dashboard.dc.html`.

---

## 1. Visual language (tokens)

Rebuild these as Tailwind theme extensions (`tailwind.config.js → theme.extend`) so class names like `bg-accent`, `rounded-card`, `text-ink` work everywhere.

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
| Radius sm / md / lg | `6 / 10 / 14px` | `borderRadius.sm|md|lg` |
| Shadow sm | `0 1px 2px rgba(40,35,30,.06)` | `boxShadow.sm` |
| Shadow md | `0 6px 18px -10px rgba(40,35,30,.22)` | `boxShadow.md` |
| Shadow lg | `0 18px 46px -18px rgba(40,35,30,.30)` | `boxShadow.lg` |

**Type.** Arabic-first, RTL default. Body/UI: **Readex Pro** (curated self-hosted set). Display/headings: **Cairo** (700/800). Labels, numerals, code, URLs: **JetBrains Mono** (uppercase, letter-spaced). Latin secondary. Set `dir` on `<html>` from site/UI language; use logical properties (`ms-*`/`me-*`, `ps-*`/`pe-*`, `start/end`) so LTR mirrors for free.

> Note: the project is bound to the **Broadsheet** design system for tokens. The prototype re-skins Broadsheet's class names (`.btn`, `.card`, `.seg`, `.table`, `.tag`, `.field`, `.input`, `.dialog`) to the Component Gallery look. In production, express these as Tailwind components (below) reading the tokens above.

---

## 2. Component inventory

Every component below is prototyped in `Component Gallery.dc.html` and used in `Sawwi Dashboard.dc.html`. Build each as a typed React component styled with Tailwind. Suggested location: `packages/ui-components/`.

### 2.1 Primitives (from the Component Gallery)
| Component | Props / states | Notes |
|---|---|---|
| `Button` | variant: `primary \| secondary \| ghost \| subtle \| danger`; size: `sm \| md \| lg`; `loading`, `disabled`, `iconOnly`, leading/trailing icon | Press-down active state, soft shadow on primary. Spinner on `loading`. |
| `IconButton` | size, `title` (a11y) | Square, hairline border. |
| `Badge` / `Tag` | tone: `accent \| neutral \| danger \| outline`; optional status dot | Pill. Used for site status (Published/Draft/Grace/Suspended). |
| `Avatar` | size `xs–xl`, `initials`, `tint`, `status` dot, `group` (overflow `+N`) | Initials-based, low-chroma tints. |
| `Input` / `Textarea` | `label`, `placeholder`, `error`, focus ring | Focus = accent ring. |
| `Select` | native, custom chevron | RTL-aware chevron on `end`. |
| `SearchBar` | debounced value, leading search icon, clear | Table + combobox use it. |
| `Combobox` | searchable, keyboard (↑/↓/Enter/Esc), outside-click close, empty state | Type-to-filter dropdown. |
| `SegmentedControl` (Tabs) | options[], value, onChange | Radio-backed pill track + white active chip. **This is the canonical tab component** — used for View-as (Agency/Admin/Client), site filters, manage tabs, analytics range, device toggle, variant A/B/C, payment method. |
| `Tabs` (underline) | for in-page section switching | Optional; segmented control is primary. |
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
| `NotificationsPopover` | In-dashboard alerts only (renewals T-14d/T-3d). |
| `StatTile` | Kicker + big numeral; rule-separated grid. |
| `RenewalAlert` / `AlertRow` | Colored status icon + copy. |
| `PageHeader` | Title (Cairo) + subtitle + primary action. |

### 2.3 Site builder — **section configurator** (the v2 model)
Not a free canvas. Left = pages + section list; center = live preview; right = section inspector.
| Component | Notes |
|---|---|
| `BuilderTopbar` | Back, draft-saved indicator, device toggle (desktop/mobile), Preview, Publish (with loading). |
| `PagesRail` | Page list + "Add page". |
| `SectionList` | Ordered sections on the active page; drag handle, select, per-section variant tag. |
| `SectionInspector` | Variant `A/B/C` (segmented), color scheme (primary/light/dark/accent swatches), content fields, move ↑/↓, remove. |
| `LivePreview` | Renders each section from `{type, variant, scheme}` against the site palette. |
| `AddSectionGallery` (modal) | Thumbnail grid of all section types. |
| `TemplatePicker` (in create-site modal) | Vertical starter: barbershop / restaurant / services. |

### 2.4 Published-site section library (rendered by Renderer + preview)
Each is a **section component** taking `variant` (A/B/C) and `scheme` (primary/light/dark/accent), reading shared SiteSettings/Theme. Types:
`Hero, About, Services, PriceList, Gallery, Testimonials, Team, OpeningHours, Map+Address, WhatsAppCTA, FAQ, Banner, Contact, Header, Footer, Spacer`.
Components that show business info (WhatsApp button, Map, Footer, hours) read from `SiteSettings` by default — resellers never retype.

---

## 3. Data model surfaced in the UI (mock → real)

The dashboard mocks these; they map to the PRD's Builder/Billing schemas.

- **Workspace** { name, city, phone, commission_pct, status, members[] }
- **Member** { name, email, role: owner|member, joinedAt }
- **Site** { name, slug, vertical, language, status: draft|published|grace|suspended, expiry, visits }
- **Page** { path, title, seo, sections[] }
- **Section** { id, type (see 2.4), variant: A|B|C, scheme: primary|light|dark|accent, content }
- **SiteTheme** { palette (curated), font_key }
- **SiteSettings** { whatsapp, phone, socials, maps_url, address, hours }
- **Service** (content, reused by Services/PriceList) { name, duration, price }
- **Subscription** { plan, price, currency, expiry, status } + **PaymentRecord** { amount, method, date } + **CommissionEntry** { pct, amount, status: owed|settled }
- **Snapshot** { version, author, createdAt } (publish history + rollback)

---

## 4. Screens implemented in the prototype
Onboarding wizard (3 steps) · Dashboard home · My Sites (grid + filters + create-site/template modal) · **Section configurator** (pages/preview/inspector + add-section gallery) · Content (services manager) · Brand/Theme (palettes + font) · Business info settings · SEO · Members & invites + commission ledger · Analytics (visits chart + top pages) · Billing (subscriptions + record-payment) · Admin workspaces · Client read-only.

All screens are Arabic-first RTL with a working AR/EN + RTL/LTR toggle and a role switcher (Agency/Admin/Client).

---

## 5. Assets & references

| Asset | Path / link | Notes |
|---|---|---|
| **Prototype — component reference** | `Component Gallery.dc.html` | The living Figma-equivalent: every primitive with all states/variants, interactive. Open in the browser. |
| **Prototype — full application** | `Sawwi Dashboard.dc.html` | All screens composed (onboarding → configurator → admin/client), AR/EN + RTL toggle, role switcher. |
| **Design brief (this doc)** | `Sawwi design brief.md` | Tokens + component inventory for the Tailwind rebuild. |
| **Logo** | `assets/logo.svg` | Mark (س on deep-green rounded square) + Arabic wordmark + Latin mono tag. Scalable SVG. |
| **Favicon** | `assets/favicon.svg` | Mark only, 64×64 SVG — serve as `/favicon.svg` (`<link rel="icon" type="image/svg+xml">`); generate PNG/ICO fallbacks at build. |
| Figma | — | No Figma file exists; the two prototype HTML files above are the canonical design source. |

There is no raster asset pipeline yet — export PNG favicons (32/180/512) from `assets/favicon.svg` during build (`apps/dashboard/public/`).

## 6. Build guidance
- Stack per PRD: **React + Tailwind** in `packages/ui-components`, consumed by `apps/dashboard` and `apps/renderer`.
- Componentize from §2; keep the segmented control as the single tab primitive.
- RTL: logical Tailwind utilities + `dir` from language; test both directions.
- Accessibility: real `<button>`, radio-backed segmented control, focus rings, Esc/outside-click on overlays, `aria-*` on icon-only controls.
