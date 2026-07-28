# Building a Sawwi Template — The Complete Guide

**Audience:** anyone (human or AI agent) adding a new ready-made template to Sawwi.
Read this fully before writing template code. It documents the template *contract*,
the *inline-editing* system, the *side-panel* field system, *theming/palettes*, and
every convention and pitfall discovered while building the barbershop template.

> **Prime directive (from [`AGENT_GUIDE.md`](../AGENT_GUIDE.md)):** *Assembly, not design —
> it must be impossible to produce an ugly site.* A template ships a **complete, believable,
> beautiful** design. The owner only fills in **their** content and picks a **named palette**.
> No blank canvas, no free-form layout, no custom CSS.

The **barbershop-five-star** template ([`src/templates/barbershop-five-star/`](../src/templates/barbershop-five-star/))
is the reference implementation. When in doubt, copy what it does.

---

## 1. Mental model (read this first)

A Sawwi template is **code**, not database rows. It is made of exactly two files plus a few
touch-points elsewhere:

```
src/templates/<key>/
  component.tsx   # the ready-made React design (a self-contained website)
  index.ts        # the TemplateModule: defaults + wizard/editor schema + tokens + palettes
```

The design is split into **two kinds of content** — this split is the whole point:

| Kind | Lives in | Editable? | Example |
|------|----------|-----------|---------|
| **House content** (frozen) | inside `component.tsx` (`HOUSE_CONTENT` const) | No | "we sterilise between clients", the session ritual, aftercare rules |
| **Editable data** | `defaults` in `index.ts`, overridden per-site in `Site.content` (JSON) | Yes | shop name, services + prices, barbers, hours, photos |

**Rule of thumb:** if you'd ask *every* shop owner to type the same sentence, it's house content —
bake it into the component. If it's *their* specific business fact, it's editable data.

### How a site renders

```
Site.content (per-site overrides, JSON)
        │  deepMerge over…
        ▼
tpl.defaults  ───►  merged data  ───►  <Component {...merged} currency=… />
```

- `deepMerge` ([`src/templates/content.ts`](../src/templates/content.ts)): **objects merge key-by-key;
  arrays and primitives replace wholesale.** (This has big consequences for list editing — see §5.4.)
- Because content is plain JSON it serialises straight to `localStorage` (wizard autosave) and to
  `Site.content` (persisted). Never put class names, JSX, or functions in it.

### The same component renders in three places

One component, three contexts — it must look right in all of them:

1. **Published site** — inert, read-only (no edit provider).
2. **Draft preview** (`/preview/[id]`) — inert, read-only.
3. **Builder** (dashboard content editor) — wrapped in an `EditProvider`, so the same markup
   becomes **inline-editable** (double-click text, hover images, add/remove list items).

The inline-editing primitives are **no-ops when there is no provider**, so the published site
renders exactly what the builder shows — minus the editing affordances.

---

## 2. The 10-step checklist (what to create / edit)

To add a template with key `my-template`:

1. **`src/templates/my-template/component.tsx`** — the design (a React component).
2. **`src/templates/my-template/index.ts`** — the `TemplateModule` (see §3).
3. **Register it:** add to `TEMPLATES` in [`src/templates/registry.ts`](../src/templates/registry.ts) (one line).
4. **Onboarding wizard:** create `src/components/templates/my-template-onboarding-wizard.tsx`
   and map it in [`src/components/templates/new-site-flow.tsx`](../src/components/templates/new-site-flow.tsx) `WIZARDS`.
5. **Base color tokens:** add your template's `--color-*` base + numbered shades to the `@theme`
   block in [`src/app/globals.css`](../src/app/globals.css) (so Tailwind emits `bg-…`/`text-…` utilities).
6. **Shade cascade:** add a `[data-tpl="my-template"] { … }` block in `globals.css` that re-derives
   your numbered shades from the base tokens, so **palettes cascade** (see §7.4). Critical.
7. **Palettes:** define named colorways in `index.ts` `palettes` (see §7.2).
8. **Cover image:** drop `public/template-covers/my-template.webp` and set `cover` in `index.ts`
   (a deterministic fallback shows until the file exists).
9. **Verify:** `npx tsc --noEmit && npx eslint <files> --quiet && npx vitest run && npm run build`.
10. **Test all three contexts:** builder (desktop **and** mobile toggle), draft preview, published.

Nothing else needs wiring — the gallery, wizard host, content editor tabs, renderer, autosave,
and publish pipeline are all **driven off the module**.

---

## 3. Anatomy of the TemplateModule

The contract lives in [`src/templates/types.ts`](../src/templates/types.ts). Full shape:

```ts
export const myTemplate: TemplateModule = {
  key: "my-template",              // unique slug; also the templateKey stored on the Site
  label: "اسم القالب",             // Arabic display name (gallery, editor header)
  vertical: "barbershop",          // vertical id (used as verticalKey on create)
  description: "وصف قصير للبطاقة",  // gallery card description
  tags: ["حلاقة", "عربي", …],       // searchable chips in the picker (Arabic)
  cover: "/template-covers/my-template.webp",  // static asset; fallback poster until present

  Component: Component as unknown as TemplateModule["Component"], // see §4 (the `unknown` cast)
  defaults,                        // the canonical shape of Site.content (see §3.1)
  nameKey: "shop.name",            // dot-path to the business name (seeds Site.businessName + slug)

  steps: [ … ],                    // side-panel groups = wizard steps (see §6)
  tokens: [ … ],                   // the 3 themeable color tokens → cssVars (see §7.1)
  palettes: [ … ],                 // named colorways shown in the appearance tab (see §7.2)

  defaultCurrency: "SYP",          // default price unit KEY (see shared/currency CURRENCIES); "SYP_NEW" → ل.س.ج
  themeFont: false,                // true → offer a font override; false → template's own font only
  fontKeys: ["cairo", "rubik"],    // (optional) whitelist of offered fonts when themeFont is true
};
```

### 3.1 `defaults` — design a *complete* fake business

`defaults` is the canonical shape of `Site.content` **and** the demo data. Make it a believable,
fully-populated business so the design reads as finished *before any edit* and the
wizard/editor show real values, not blanks. Every field the component reads must have a default.

```ts
const defaults = {
  shop: {
    name: "صالون قاسيون",
    tagline: "حلاقة كلاسيكية بمعايير خمس نجوم",
    heroPhoto: "",                 // images default to "" (empty → placeholder / hidden)
    whatsapp: "+963991112233",     // REQUIRED contact
    socials: { instagram: "", facebook: "", tiktok: "" },
    stats: [ { value: "٤٫٩", label: "تقييم الزبائن" }, … ],
  },
  groups: [ { id: "hair", label: "الشعر" }, … ],  // categories: {id, label}
  services: [ { group: "hair", name: "قصّة كلاسيكية", price: "٢٥٬٠٠٠", … }, … ],
  hours: [ { day: "السبت", open: "١٠:٠٠ ص", close: "١٠:٠٠ م" }, … ],
};
```

Conventions for defaults:
- **Numbers are Arabic-Indic strings** (`"٢٥٬٠٠٠"`, `"١٢"`), not JS numbers — the whole UI reads ٠-٩.
- **Images default to `""`** — the component shows a styled placeholder (builder) or hides (published).
- **List items are records** with stable field names; category lists are `{ id, label }` with a
  stable auto-generated `id` so dependent rows stay linked across renames.

---

## 4. The component contract

The component is a **normal React component** that receives the **merged content spread as props**.
Its prop type is the shape of `defaults`. The host widens through `unknown` at the single boundary
(`Component as unknown as TemplateModule["Component"]`) because the template has a strict prop shape
that the generic host can't know.

```tsx
"use client";
export interface MyTemplateProps { shop: ShopContent; services: Service[]; /* … */ currency?: string; }

export default function MyTemplate({ shop, services, currency = "ل.س" }: MyTemplateProps) {
  const H = { ...HOUSE_CONTENT, ...house };   // frozen house content ⊕ optional overrides
  // …render a full, self-contained website…
}
```

### Hard rules for the component

1. **`"use client"`** at the top — templates use hooks (state, the edit context, `useOpenNow`, …).
2. **Full-bleed real website.** No dashboard chrome. The host wraps you in a themed, `isolate`d,
   `data-theme="light"` scope div; you own everything inside.
3. **Render identically with and without the edit provider.** Wrap editable bits in the inline
   primitives (§5); they degrade to plain read-only output when no provider is present.
4. **Empty → hidden on the published site, placeholder/＋ in the builder.** See §5.5. This is a
   product rule: *"each section when empty should be removed from the live website, but leave a ＋
   to re-add it in the builder."*
5. **RTL + logical properties.** Use `ps-/pe-/ms-/me-/start-/end-/text-start/text-end` — never
   `pl-/pr-/left-/right-`. The app is Arabic-first RTL.
6. **Arabic-Indic digits for display.** Provide helpers (`arNum`, `arInt`) and convert on display;
   inline text auto-converts typed digits (§5.6).
7. **Stable React keys.** Never key a list by content (`key={s.name}`) — duplicating an item (two
   "خدمة جديدة") throws *"two children with the same key."* Use `key={\`svc-${i}\`}` (index-based)
   or a guaranteed-unique id (`key={g.id}` for generated category ids).
8. **Fonts:** the display/serif faces are fixed in the component (`font-display`, `font-serif`).
   The body sans is themeable only if `themeFont: true`.

### Fixed literal colors

You may hard-code semantic colors that should **not** follow the palette (e.g. a green "open now"
dot, green ✓ hygiene checks) as arbitrary values: `text-[oklch(0.7_0.12_145)]`. Everything that
*should* follow the brand must use the token utilities (`text-oxblood-200`, `bg-ink-900`, `text-bone`)
so palettes cascade (§7.4).

---

## 5. Inline editing — the deep dive

All primitives live in [`src/components/templates/inline-edit.tsx`](../src/components/templates/inline-edit.tsx).
They are **inert without a provider** (published site) and **editable inside `EditProvider`** (builder).

### 5.1 The provider & context

`TemplateHost` wraps the rendered component in `<EditProvider content onChange>` **only** when an
`edit` prop is passed (builder). The provider exposes an API via `useEdit()`:

```ts
interface EditApi {
  editing: true;
  set(path, value);                       // write one dot-path (object paths only!)
  setMany(updates: Record<path, value>);  // write several paths in ONE commit (atomic)
  removeAt(listPath, list, index);
  addItem(listPath, list, blank);
}
```

`useEdit()` returns `null` on the published site. Everything below checks for that and no-ops.

### 5.2 `EditableText` — double-click to edit

```tsx
<EditableText path="shop.heroLine" value={shop.heroLine ?? "…"} as="h1" className="…" />
<EditableText value={s.name} onCommit={(t) => svcEdit.setField(i, "name", t)} className="…" />
```

- **Published / no provider:** renders `value ? <Tag>{value}</Tag> : null` — i.e. **nothing when empty**.
- **Builder:** hover shows a dashed outline; double-click turns it into a `contentEditable`;
  Enter (or blur) commits, Escape cancels. Empty + editing shows a faded italic `placeholder`.
- **`path` vs `onCommit`:** use `path` for a plain object field (`api.set(path, text)`); use
  `onCommit` for **list-item** fields that must write the whole array (see §5.4).
- **`multiline`** allows line breaks (Enter inserts newline instead of committing).
- **Digits:** by default typed `0-9` are converted to `٠-٩` on commit. Pass **`keepLatinDigits`**
  for Latin fields (URLs, English names) to skip conversion.

### 5.3 `EditableImage` — hover to change/remove

```tsx
{/* single field */}
<EditableImage path="shop.heroPhoto"><Photo src={shop.heroPhoto} …/></EditableImage>

{/* list-item image */}
<EditableImage onChange={(url) => svcEdit.setField(i, "photo", url)} className="size-20 …">
  <Photo src={s.photo} …/>
</EditableImage>
```

- Wrap a rendered image (your `<Photo>` placeholder component). On hover in the builder it shows
  two circular buttons: **change** (uploads to staging via `uploadStaging`) and **remove** (writes `""`).
- **Published / no provider:** renders the children unchanged.
- `path` writes `api.set(path, url)`; `onChange` is used instead for list-item images.
- Place it inside a **sized** element (the overlay is absolutely positioned).

### 5.4 Editing lists — write the WHOLE array

Because `deepMerge` replaces arrays wholesale and `setPath` only walks **object** paths (not array
indices), **every list edit must write the entire array back**. Two helpers do this:

```ts
// records: services, barbers, stats, ritual steps, aftercare — items are objects
const svcEdit = useEditList("services", services);
svcEdit.editing               // boolean (are we in the builder?)
svcEdit.setField(i, "name", v) // replace one field of item i, writing the whole array
svcEdit.remove(i)
svcEdit.add({ group: activeGroup, name: "خدمة جديدة", price: "٠", … })

// plain string lists: hygiene rules, etiquette lines — items are strings
const hygieneEdit = useEditStrings("house.hygiene", H.hygiene);
hygieneEdit.setAt(i, v); hygieneEdit.remove(i); hygieneEdit.add("معيار جديد");
```

**Multi-path atomic writes.** If one action must touch two paths (e.g. deleting a category also
drops its services), you **cannot** call `api.set` twice — the second call closes over stale
content and clobbers the first. Use `setMany`:

```ts
const removeGroup = (index) => {
  const gid = groups[index]?.id;
  editApi?.setMany({
    groups: groups.filter((_, i) => i !== index),
    services: services.filter((s) => s.group !== gid),
  });
};
```

### 5.5 The empty → hidden rule (with a ＋ to re-add)

For any optional field or whole section:

```tsx
{/* a whole section: hidden on published when empty, ＋ stays in the builder */}
{(H.hygiene.length > 0 || hygieneEdit.editing) && (
  <section>
    <Head kicker={…} kickerPath="house.hygieneKicker" />
    {H.hygiene.map((t, i) => ( /* EditableText + ✕ remove on hover */ ))}
    {hygieneEdit.editing && (
      <button onClick={() => hygieneEdit.add("…")}>＋ إضافة معيار</button>
    )}
  </section>
)}
```

- **Published:** if the list is empty, the section renders `null` (gone).
- **Builder:** `*.editing` is true, so the section shows even when empty, with a dashed **＋ add**
  button to bring it back.
- Individual removes are a `✕` button revealed on hover (`group/…` + `opacity-0 group-hover/…:opacity-100`),
  and must carry **`cursor-pointer`** (all edit affordances do). These only render when `*.editing`,
  so the pointer never shows on the published site.

### 5.6 View/edit forks (interactive elements)

If the published element is itself interactive (e.g. a service card that is a `<button>` opening a
sheet), you can't nest a remove `<button>` inside it. Fork the markup:

```tsx
svcEdit.editing
  ? <div className={`relative ${cardClass}`}>{inner}<button className="… ✕ remove …"/></div>
  : <button onClick={() => setSheet(i)} className={cardClass}>{inner}</button>
```

### 5.7 Section-heading editability

Give reusable `Head`-style components optional `kickerPath` / `titlePath` props. When set, the
kicker/title render as `EditableText`; otherwise as static spans. Store the overrides as extra
optional fields on the relevant content object (`house.hygieneKicker`, `shop.teamTitle`, …) and
seed them with `?? "default text"`.

### 5.8 The order cart (menu templates)

Templates whose items have prices can offer a **visitor order cart** — add items, see
a running total, and send the order to the shop on WhatsApp — via the shared module
[`src/components/templates/order-cart.tsx`](../src/components/templates/order-cart.tsx).
Like site-chrome, the **logic is shared and the look is yours**: you pass a small
`CartTheme` of palette class strings. All three shipped templates use it.

```tsx
import { priceNumber } from "@/shared/currency";
import { useOrderCart, OrderCart, CartStepper, type CartTheme } from "@/components/templates/order-cart";

const CART_THEME: CartTheme = {           // complete class strings (colors + rounding + borders)
  scrim: "bg-[rgba(10,8,6,.7)]",
  panel: "rounded-t-[14px] border border-gold/25 bg-warm-700 text-cream lg:rounded-[14px]",
  bar:   "rounded-[3px] bg-gold text-[oklch(0.16_0.03_70)]",   // floating bar
  cta:   "rounded-[3px] bg-gold text-[oklch(0.16_0.03_70)]",   // send / add button
  step:  "rounded-full border border-cream/25 text-cream",     // +/- buttons (own the rounding!)
  divider: "border-cream/[0.12]",
  muted:   "text-cream/70",
};

const cart = useOrderCart();  // { lines, count, total, add, inc, dec, remove, clear, qtyOf }
```

- **Add control** — put a `<CartStepper cart item={{id,name,price}} theme={CART_THEME} />` in each
  item's **detail sheet** (next to the price). `price` is a **number** — parse the Arabic price
  string with `priceNumber(raw)` and skip the stepper when it returns `null` (a "حسب الطلب" price
  can't be summed). Use a **stable id** (the item's index in the FULL list, e.g. `` `dish-${i}` ``).
- **Cart + drawer** — render `<OrderCart cart currency whatsapp shopName theme />` **once**, and
  **only on the published/preview site**: gate it behind `{!editApi?.editing && …}` so it never
  covers the builder. It shows a floating bar (hidden when empty), a preview drawer with per-line
  steppers and the summed total, and — when `whatsapp` is set — an "أرسل الطلب عبر واتساب" button
  with the itemized order pre-filled. No `whatsapp` → preview + total only.
- **Totals** render with `formatArabicAmount(n)` + the `currency` prop, so the cart reads in the
  same Arabic-Indic digits and unit as every price on the page.
- **`step` owns its rounding** — the shared parts don't hardcode `rounded-*`, so a sharp template
  (foul-fatteh: `rounded-[2px]`) and a pill template (barbershop: `rounded-full`) both look right.

---

## 6. The side panel (schema-driven fields)

The content editor's left panel and the wizard both render **`FieldForm`** from
[`src/components/templates/fields.tsx`](../src/components/templates/fields.tsx), driven by the
module's `steps`. **Each `StepDef` is one wizard step *and* one editor tab.**

```ts
steps: [
  {
    key: "shop",
    title: "معلومات المحل",       // tab / step title
    hint: "طرق التواصل والعنوان.",
    fields: [
      { key: "shop.whatsapp", label: "رقم واتساب", type: "phone", help: "إلزامي." },
      { key: "shop.address",  label: "العنوان",    type: "text" },
      { key: "shop.mapsUrl",  label: "رابط الخريطة", type: "text", ltr: true },
      { key: "hours",         label: "أوقات الدوام", type: "weekhours" },
    ],
  },
],
```

### 6.1 Field types

| `type` | Renders | Notes |
|--------|---------|-------|
| `text` | single-line input | add `ltr: true` for URLs/Latin (forces LTR + mono) |
| `textarea` | multi-line input | |
| `phone` | phone input | |
| `image` | upload → storage URL | |
| `list` | repeatable records | `itemLabel`, `blank` (new-row template), `item: FieldDef[]` (per-row fields); reorder + delete built in |
| `select` | dropdown from a sibling list | `optionsFrom` (a content list key), `optionValue`/`optionLabel` (default `id`/`label`) |
| `categories` | category manager | auto-generated ids; `dependents:{list,key}` reassigns orphaned rows on delete |
| `weekhours` | 7-day hours editor | per-day segmented **مفتوح / ٢٤ ساعة / مغلق** + our custom from/to dropdowns (hidden when مغلق or ٢٤ ساعة); writes the whole `[{day,closed,h24,open,close}]` array. Set every day to ٢٤ ساعة for an always-open business. |

### 6.2 Panel vs. inline — how to decide

- **Inline (on the preview):** anything the owner reads *in place* as they design — headlines,
  blurbs, section headings, list items (services, team, rules), images, stat numbers, category tabs.
  Prefer this; it's the Sawwi feel.
- **Side panel:** structured data that has no obvious inline surface or benefits from a control —
  contact numbers, address, URLs, **weekly hours** (a real day/time editor), category management
  when it's not a visible tab strip.
- A field can be **both** removed from `steps` *and* edited inline — e.g. barbershop's hero
  headline/blurb/photo live only on the preview; the panel keeps just contact + hours.

### 6.3 Custom controls (not native `<select>`)

When you need a dropdown in the panel, use **`MenuSelect`** from
[`src/components/ui/dropdown.tsx`](../src/components/ui/dropdown.tsx) (our styled popup with
click-outside/Escape), **not** a native `<select>`. Use **`SegmentedControl`** for two/three-way
toggles. The `weekhours` editor is the worked example.

---

## 7. Theming, palettes & the shade cascade

### 7.1 Tokens — the 3 themeable colors

A template exposes **exactly three** themeable colors so it stays "ready". They map token keys to
CSS variables the design reads:

```ts
tokens: [
  { key: "accent", label: "لون التمييز", cssVar: "--color-oxblood", default: "oklch(0.48 0.16 25)" },
  { key: "ground", label: "الخلفية",     cssVar: "--color-ink",     default: "oklch(0.115 0.006 45)" },
  { key: "ink",    label: "لون النص",     cssVar: "--color-bone",    default: "oklch(0.93 0.018 70)" },
],
```

These map onto `SiteTheme` columns: `accent → primaryColor`, `ground → bgColor`, `ink → secondaryColor`
(+ `fontKey`). `TemplateHost` sets each `cssVar` inline on the scope wrapper (`chosen || default`),
and stamps `data-tpl={key}` + `data-theme="light"` on it.

### 7.2 Palettes — named colorways (the appearance tab)

Instead of raw color pickers, the appearance tab shows **named palettes** grouped into three
sections: **الافتراضي** (the defaults, pinned on top), **ألوان داكنة** (dark), **ألوان فاتحة** (light).
Each palette maps every token key to a value and declares its `tone` (`"dark"` | `"light"`).

**Two defaults per template — required.** Every template marks **exactly two** palettes with
`isDefault: true` — **one `dark` and one `light`** — as the recommended starting points shown at the
top. The **dark default must equal the token defaults** (§7.1) so an untouched site reads as it; the
light default is the recommended light starting point. Aim for a rich total (barbershop ships ~23):
plenty of dark, several light, a few vivid.

```ts
palettes: [
  // Dark
  { key: "classic",  label: "كلاسيكي", tone: "dark", isDefault: true, mood: "داكن دافئ", colors: { accent: "oklch(0.48 0.16 25)", ground: "oklch(0.115 0.006 45)", ink: "oklch(0.93 0.018 70)" } },
  { key: "midnight", label: "منتصف الليل", tone: "dark", mood: "داكن أزرق", colors: { accent: "oklch(0.6 0.13 235)", ground: "oklch(0.15 0.025 250)", ink: "oklch(0.93 0.02 245)" } },
  // …more dark (forest, ocean, plum, onyx, emerald, neon, sunset, …)…
  // Light
  { key: "sand",  label: "رملي", tone: "light", isDefault: true, mood: "فاتح دافئ", colors: { accent: "oklch(0.52 0.14 40)", ground: "oklch(0.95 0.022 75)", ink: "oklch(0.26 0.03 50)" } },
  { key: "ivory", label: "عاجي", tone: "light", mood: "فاتح نظيف", colors: { accent: "oklch(0.5 0.16 25)", ground: "oklch(0.97 0.006 80)", ink: "oklch(0.24 0.01 60)" } },
  // …more light (linen, blush, sky, mint, sunny, …)…
],
```

Selecting a palette writes `theme.accent/ground/ink` together; the active card is highlighted by
comparing the stored theme (or token defaults) to each palette's colors. Because every palette flows
through the `[data-tpl]` shade cascade (§7.4), **both light and dark palettes render correctly** —
accent tints and lifted section backgrounds follow automatically.

### 7.3 Fonts

- `themeFont: false` → the template always uses its own built-in font (no picker shown). This is the
  barbershop's choice and the simplest.
- `themeFont: true` → a font picker appears; `fontKeys` (optional) whitelists which of
  [`src/lib/palette.ts`](../src/lib/palette.ts) `FONTS` are offered, and "خط القالب (افتراضي)"
  (empty `fontKey`) means *no override* — the template's own font.

### 7.4 ⚠️ The shade-cascade problem (do NOT skip)

A palette only overrides the **three base** token vars. But your component uses **numbered shades**
(`oxblood-100/200/300`, `ink-800/900`, …) that are declared **statically** in `globals.css`. If you
do nothing, changing a palette leaves accent text/icons and lifted section backgrounds **stuck on the
old color** — the exact "some texts/icons don't take the new color" bug.

**Fix:** re-derive the numbered shades from the base tokens, scoped to your template, using
`color-mix` toward the text token so it adapts to **both light and dark** palettes. Add to `globals.css`
**after** the `[data-theme="light"]` block (so it wins by source order):

```css
[data-tpl="barbershop-five-star"] {
  /* accent tints (text/icons): blend accent toward the text color for contrast */
  --color-oxblood-100: color-mix(in oklch, var(--color-oxblood) 40%, var(--color-bone));
  --color-oxblood-200: color-mix(in oklch, var(--color-oxblood) 55%, var(--color-bone));
  --color-oxblood-300: color-mix(in oklch, var(--color-oxblood) 72%, var(--color-bone));
  /* lifted section grounds: nudge the ground toward the text color (works dark AND light) */
  --color-ink-800: color-mix(in oklch, var(--color-ink) 96%, var(--color-bone));
  --color-ink-900: color-mix(in oklch, var(--color-ink) 92%, var(--color-bone));
  --color-ink-950: color-mix(in oklch, var(--color-ink) 88%, var(--color-bone));
  --color-plate:   color-mix(in oklch, var(--color-ink) 90%, var(--color-bone));
}
```

Why `color-mix` toward the **text** token (`--color-bone`): on a dark ground the text is light, so the
mix lifts *lighter*; on a light ground the text is dark, so it lifts *darker* — automatically correct
in both directions.

### 7.5 Registering base tokens in `globals.css`

Tailwind v4 only emits `bg-<name>`/`text-<name>-NNN` utilities for `--color-*` vars declared in the
`@theme` block. Add your template's base + numbered shades there (the `[data-tpl]` block above only
*overrides* them per-site):

```css
@theme {
  /* … existing … */
  --color-oxblood: oklch(0.48 0.16 25);
  --color-oxblood-100: oklch(0.82 0.08 25);
  --color-oxblood-200: oklch(0.72 0.11 25);
  --color-oxblood-300: oklch(0.62 0.14 25);
  --color-bone: oklch(0.93 0.018 70);
  --color-plate: oklch(0.2 0.008 45);
  /* ground uses the shared --color-ink / --color-ink-900 / --color-ink-950 neutrals */
}
```

> **Naming collision caveat:** the dashboard design system also defines `--color-ink`,
> `--color-ink-900`, etc., and `[data-theme="light"]` re-pins them. That's why the barbershop maps
> `ground → --color-ink` and relies on the `[data-tpl]` block (higher/later specificity on the scope
> wrapper) to win. If you add a **new** template, prefer **template-unique var names** (e.g.
> `--color-<brand>`, `--color-<brand>-900`) to avoid fighting the shared neutrals.

---

## 8. The onboarding wizard

Each template gets a **bespoke create screen** (component), mapped in
[`new-site-flow.tsx`](../src/components/templates/new-site-flow.tsx) `WIZARDS`. Keep it **minimal** —
the barbershop wizard collects only **name + slug**; everything else is edited inline after creation.

Responsibilities of a wizard:
- Collect the minimum to spin up the site (at least the slug; optionally a name).
- Debounced autosave of the draft to `localStorage` (survives refresh).
- On submit, `POST /api/sites` and route to the editor:

```ts
const content = name.trim() ? { shop: { name: name.trim() } } : {};
const res = await api.post<{ id: string }>("/api/sites", {
  templateKey, slug, verticalKey: tpl.vertical, businessName: name.trim() || slug, content,
});
router.push(`/dashboard/sites/${res.id}`);
```

Slug rules: `^[a-z0-9-]{3,40}$`. The `.${ROOT_DOMAIN}` suffix comes from `@/lib/site-url` — never
hard-code the domain.

---

## 9. Data flow & persistence

| Concern | Where | Notes |
|---------|-------|-------|
| Editable content | `Site.content` (JSON) | `PUT /api/sites/:id/content` (whole object). Editor autosaves debounced (~700ms). |
| Theme | `SiteTheme` (primaryColor/secondaryColor/bgColor/fontKey) | `PUT /api/sites/:id/theme`. `fontKey` defaults to `readex`. |
| Draft render | `getDraftTemplateData` | live DB row → builder + `/preview`. |
| Published render | `getPublishedTemplateData` | frozen `PublishSnapshot` payload (content+theme+currency). |
| Currency | site settings → `symbolOf`, falling back to the template's `defaultCurrency` | passed to the component as `currency` (a symbol like `ل.س`). A site with no chosen currency shows its template's default; the owner can change it in settings. Resolved in `template-data.ts` (draft) + `publishing.repository.ts` (published) via `defaultCurrencyOf`. |

The **content editor** ([`content-editor.tsx`](../src/components/templates/content-editor.tsx)) provides:
- Tabs from `steps` + an **appearance** tab (palettes; font picker only if `themeFont`).
- In-session **undo/redo** (content snapshots; ⌘/Ctrl+Z / ⇧+Z).
- **Desktop preview:** the live `TemplateHost` with `edit` (inline editing, instant).
- **Mobile preview:** a **real iframe viewport** (so `lg:` breakpoints go phone) with the editable
  `TemplateHost` **portaled into it** — same live/editable tree, not the static `/preview` page. This
  is why inline-edit selection uses the node's **own** `ownerDocument`/`defaultView` (works inside the
  iframe). If you add primitives that touch `window`/`document`, use `el.ownerDocument` too.

---

## 10. Conventions & pitfalls (checklist)

- **RTL logical classes only** — `ps-/pe-/ms-/me-/start-/end-/text-start/text-end`. No `pl-/pr-/left-/right-`.
- **Arabic-Indic digits** on display; inline text auto-converts typed digits (opt out with
  `keepLatinDigits` for Latin/URL fields).
- **List keys** are index-based (`\`svc-${i}\``) or guaranteed-unique ids — **never** content strings.
- **List edits write the whole array** (`useEditList`/`useEditStrings`); multi-path edits use `setMany`.
- **Empty → hidden** on published, **＋ to re-add** in the builder; per-item **✕** on hover; all edit
  buttons carry `cursor-pointer` and only render when `*.editing`.
- **Client-time features** (open/closed "now", anything using `new Date()`): compute in a
  `useEffect` and return `null` until mounted to avoid SSR hydration mismatch (see `useOpenNow`).
- **`overflow-x-clip`, not `overflow-x-hidden`**, on scroll ancestors — `hidden` silently becomes a
  scroll container and **breaks `position: sticky`** headers (mobile + desktop).
- **Palette cascade:** wire the `[data-tpl]` shade block (§7.4) or accent text/section grounds won't
  follow palettes.
- **`isolate`** on the scope wrapper is already applied by the host — keep internal z-indexes contained.
- **Canonical-class ESLint warnings** (`px-[22px]` → `px-5.5`) are **non-fatal**; templates use
  arbitrary values by design. Do not let them block you; only real errors matter.
- **No item counts** — do **not** show the number of services (or any list count) inside category
  tabs or beside a section title. Tabs show only the category label; titles show only the title.
- **Self-hosted fonts** only (globals `@fontsource-variable`). Adding a font requires importing it there.
- **External embeds (iframes/maps):** Google Maps embeds carry attribution chrome and error on
  `q=<raw url>`; the maps feature was ultimately removed. If you re-add one, prefer a proper "Embed a
  map" URL and never feed a raw share URL to `q=`.

---

## 11. Verification (run before you call it done)

```bash
npx tsc --noEmit                                   # types
npx eslint src/templates/<key>/ <edited files> --quiet   # lint (ignore canonical-class warnings)
npx vitest run                                     # unit tests (keep them green)
npm run build                                      # full production build
```

Then manually check **all three contexts**: builder **desktop**, builder **mobile toggle** (inline
editing must work in the phone frame), `/preview/[id]`, and a published site — across **light and
dark palettes**.

---

## 12. Minimal worked example (skeleton)

`src/templates/cafe/component.tsx`:

```tsx
"use client";
import { EditableText, EditableImage, useEditList } from "@/components/templates/inline-edit";

export interface CafeProps { shop: { name: string; tagline?: string; heroPhoto?: string }; menu: Array<{ name: string; price: string }>; currency?: string; }

export default function Cafe({ shop, menu, currency = "ل.س" }: CafeProps) {
  const menuEdit = useEditList("menu", menu);
  return (
    <div className="min-h-dvh overflow-x-clip bg-espresso font-sans text-cream">
      <section className="px-5.5 py-16">
        <EditableText path="shop.name" value={shop.name} as="h1" className="font-display text-4xl font-extrabold" />
        <EditableText path="shop.tagline" value={shop.tagline ?? ""} placeholder="شعار المقهى…" className="mt-2 block text-cream/70" />
        <EditableImage path="shop.heroPhoto" className="mt-6 block h-60 w-full rounded-lg">
          <Photo src={shop.heroPhoto} alt={shop.name} className="h-60 w-full" />
        </EditableImage>
      </section>

      {(menu.length > 0 || menuEdit.editing) && (
        <section className="px-5.5 pb-16">
          {menu.map((m, i) => (
            <div key={`menu-${i}`} className="group/mi relative flex justify-between border-b border-cream/10 py-3">
              <EditableText value={m.name} onCommit={(t) => menuEdit.setField(i, "name", t)} className="font-semibold" />
              <EditableText value={m.price} onCommit={(t) => menuEdit.setField(i, "price", t)} className="font-serif text-latte-200" />
              {menuEdit.editing && (
                <button onClick={() => menuEdit.remove(i)} className="absolute -end-2 -top-2 inline-flex size-6 cursor-pointer items-center justify-center rounded-full bg-latte text-white">✕</button>
              )}
            </div>
          ))}
          {menuEdit.editing && (
            <button onClick={() => menuEdit.add({ name: "طبق جديد", price: "٠" })} className="mt-3 flex cursor-pointer items-center gap-2 rounded border border-dashed border-cream/30 px-4 py-2.5 font-semibold text-cream/70">＋ إضافة</button>
          )}
        </section>
      )}
    </div>
  );
}
```

`src/templates/cafe/index.ts`:

```ts
import type { TemplateModule } from "../types";
import Component from "./component";

const defaults = {
  shop: { name: "مقهى الياسمين", tagline: "قهوة مختصّة", heroPhoto: "" },
  menu: [ { name: "إسبريسو", price: "١٥٬٠٠٠" }, { name: "لاتيه", price: "٢٠٬٠٠٠" } ],
};

export const cafe: TemplateModule = {
  key: "cafe", label: "مقهى", vertical: "cafe",
  description: "قالب مقهى بسيط", tags: ["قهوة", "مقهى", "عربي"],
  cover: "/template-covers/cafe.webp",
  Component: Component as unknown as TemplateModule["Component"],
  defaults, nameKey: "shop.name",
  themeFont: false,
  tokens: [
    { key: "accent", label: "لون التمييز", cssVar: "--color-latte", default: "oklch(0.62 0.09 60)" },
    { key: "ground", label: "الخلفية",     cssVar: "--color-espresso", default: "oklch(0.16 0.02 50)" },
    { key: "ink",    label: "لون النص",     cssVar: "--color-cream", default: "oklch(0.93 0.02 80)" },
  ],
  palettes: [
    { key: "roast", label: "تحميص", mood: "داكن", colors: { accent: "oklch(0.62 0.09 60)", ground: "oklch(0.16 0.02 50)", ink: "oklch(0.93 0.02 80)" } },
    { key: "cream", label: "كريمي", mood: "فاتح", colors: { accent: "oklch(0.5 0.11 45)",  ground: "oklch(0.96 0.015 80)", ink: "oklch(0.25 0.02 55)" } },
  ],
  steps: [
    { key: "shop", title: "معلومات المقهى", fields: [
      { key: "shop.name", label: "الاسم", type: "text" },
    ] },
  ],
};
```

Then: register in `registry.ts`, add a wizard + `WIZARDS` entry, add the `--color-latte/-espresso/-cream`
(+ numbered shades) to `@theme`, add a `[data-tpl="cafe"]` cascade block, drop a cover, and verify.

---

## 13. Quick reference — files you touch

| File | What |
|------|------|
| `src/templates/<key>/component.tsx` | the design (React) |
| `src/templates/<key>/index.ts` | the `TemplateModule` |
| `src/templates/registry.ts` | register in `TEMPLATES` |
| `src/components/templates/<key>-onboarding-wizard.tsx` | create screen |
| `src/components/templates/new-site-flow.tsx` | map the wizard in `WIZARDS` |
| `src/app/globals.css` | `@theme` base tokens **+** `[data-tpl]` cascade block |
| `public/template-covers/<key>.webp` | gallery cover |

**Read-only references (understand, don't usually edit):**
`src/templates/types.ts` · `src/templates/content.ts` · `src/components/public/template-host.tsx` ·
`src/components/templates/inline-edit.tsx` · `src/components/templates/fields.tsx` ·
`src/components/templates/content-editor.tsx` · `src/components/ui/dropdown.tsx` · `src/lib/palette.ts`.
