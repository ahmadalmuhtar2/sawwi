# Marketplace template (cars & homes) — build spec

Source of truth: `Template - Marketplace (Cars & Homes).dc.html` in this project.
Read that file for exact values; this document explains intent, structure and rules.

---

## 1. What this is

A two-vertical classifieds template: **used cars** and **flats & houses**, in the
mould of AutoScout / ImmoScout. Three screens, one data model:

| Screen | Purpose |
| --- | --- |
| **Browse** | Search, filter, sort, results grid |
| **Detail** | One listing in full, with the seller contact block |
| **Create** | A stepper that publishes a listing, then enriches it |

The governing idea: **every field the seller fills in becomes a filter for the
visitor.** Required fields are the minimum that makes a listing findable;
optional fields add filters and raise it in search. The UI says this out loud —
each form field carries a "Filterable" marker, and the review step lists the
exact filter chips the new listing will appear under.

There is no cart, no payment, no account. Enquiries go to the seller.

---

## 2. Design system

The project's own re-skin of Broadsheet, matching `Component Gallery.dc.html`.
Load the Broadsheet bundle, then override with the Gallery token block.

**Type**
- Body / UI: `Hanken Grotesk` 400/500/600
- Headings and prices: `Newsreader` 400/500 (serif, `-0.01…-0.02em`)
- Labels, specs, counters, numerics: `JetBrains Mono`, 10–12px, `letter-spacing .1em`, uppercase

**Tokens** (on the root wrapper as CSS variables)

```
--accent        #2f6a51        (tweakable; 4 curated swatches)
--accent-soft   color-mix(in srgb, var(--accent) 12%, white)
--accent-strong color-mix(in srgb, var(--accent) 82%, black)
--bg            oklch(0.978 0.004 95)     warm paper
--surface       #ffffff
--ink           oklch(0.26 0.012 70)
--muted         oklch(0.52 0.01 75)
--faint         oklch(0.64 0.008 80)
--line          oklch(0.9 0.006 85)
--line-soft     oklch(0.948 0.005 85)
--radius        10px
--card-shadow   0 1px 2px rgba(40,35,30,.03), 0 24px 48px -34px rgba(40,35,30,.20)
```

Danger (validation only): `oklch(0.53 0.15 25)` text on `oklch(0.96 0.03 25)` fill.

**Components** — reproduce the Gallery's, do not invent new ones
- Primary button: 42–46px, `--accent` fill, white text, `1px` shadow, hover `--accent-strong`, press `translateY(1px)`
- Secondary: `--surface` + `1px solid --line`, hover `oklch(0.966 0.004 90)`
- Ghost: transparent, hover a faint grey wash
- Input: 46px, `1px solid --line`, radius `--radius`; focus → accent border + `0 0 0 3px` accent tint
- Chip / pill: 32–38px, `999px`; **off** = surface + `--line` hairline + muted text, **on** = `--accent-soft` fill + `--accent-strong` text + 28% accent border
- Segmented control: `oklch(0.955)` track, 3px padding, selected pill = `--surface` + `0 1px 2px` shadow
- Card: `--surface`, `1px solid --line-soft`, radius `calc(var(--radius) + 6px)`, `--card-shadow`; hover lifts 3px and deepens the shadow
- Rows/dividers: `1px solid --line-soft`. No bordered tables.

**Do not use** Broadsheet's print devices: no halftone screens, no CMYK plate
separations, no dotted leader lines, no thick-thin masthead rules.

---

## 3. Responsive behaviour

One `device` switch drives the whole layout (`pc` | `mobile`); a production build
should read the same branches off media queries instead.

| | PC (1240px) | Mobile (392px) |
| --- | --- | --- |
| Nav | Tabs in the header (Search / Add a listing) | Header collapses to brand + "Sell" |
| Filters | Sticky 248px rail beside results | Bottom sheet, opened from a sticky results bar |
| Results | 2 columns | 1 column |
| Detail | 1.5fr content + sticky 1fr contact aside | Single column, aside below |
| Stepper rail | Vertical, sticky, labels visible | Horizontal scroller, numbers only + underline |
| Form fields | 2 columns | 1 column |
| Specs | 2 columns | 1 column |

The frame is `overflow: hidden` with an inner scrollport, so the mobile filter
sheet and the results bar anchor to the frame rather than the scrolled content.

---

## 4. Data model

Two arrays, 8 demo records each. Replace the records, keep the shapes.

**Car** — `t` (title), `make`, `body`, `price`, `year`, `km`, `fuel`, `trans`,
`hp`, `place`, `seats`, `doors`, `colour`, `drive`, `cond`, `owners`, `badge`,
`feats[]`, `desc`

**Home** — `t`, `type`, `offer` (Rent | Buy), `price`, `size`, `rooms`, `beds`,
`baths`, `floor`, `built`, `heat`, `place`, `cond`, `badge`, `feats[]`, `desc`

Prices are integers; `€` and the thin-space thousands separator are applied at
render. Rent shows `/ mo`. Currency symbol is a tweak.

---

## 5. Filters

Declared per vertical as `{ k, kind, label, opts | min/max/step }`, where `kind`
is `range` | `chips` (single choice) | `multi` (AND across selections).

**Cars** — price ≤ (range), mileage ≤ (range), fuel, transmission, body, seats
(4+/5+/7+), extras (multi)
**Homes** — offer, price ≤ (range), property type, rooms (1+…4+), size ≥ (range),
heating, extras (multi)

Rules
- Ranges default to "Any" (no cap) until touched.
- `multi` requires **all** selected extras to be present on the listing.
- Free-text search matches title + the vertical's identifying fields.
- Filter state is kept **per vertical**, so switching does not leak selections.
- Active filters render as removable chips above the results, plus "Clear all".
- Sort: Newest (year / year built), Price ↑, Price ↓.
- **No counts in the category tabs** — the result count lives in the header pill.

---

## 6. The create stepper

7 steps: 5 required → Review → Boost.

**Cars**: Vehicle · Price & mileage · Engine · Photos & text · Contact
**Homes**: Property · Key facts · Building · Photos & text · Contact

Each step is `{ id, label, title, hint, req, fields[] }`; each field is
`{ k, label, type, req, filter, opts?, unit?, placeholder?, hint?, span? }` with
`type` ∈ `text | chips | multi | area | photos`.

Behaviour
1. **Continue is blocked** while a required field on the current step is empty.
   First blocked attempt sets `touched`: the offending inputs get a danger border
   and "This one is needed to publish", and an alert block names the fields.
2. The rail shows per-step state — number, ✓ when complete, "Complete" /
   "Required" / "n missing" — and every step is clickable at any time.
3. **Review** shows a live result-card preview built from the answers, the exact
   filter chips the listing will appear under, and a clickable "Still missing"
   list that jumps to the offending step. The primary action reads "Publish the
   listing", or "Finish the required fields" in the secondary treatment when
   blocked.
4. **Publish** flips `published`, then **Boost** opens the optional fields with a
   listing-strength meter: 55% for the required set, scaling to 100% as optional
   fields fill, with a note counting the filters the listing now appears in.
   Boost is skippable ("Do this later").

Optional/boost fields — cars: colour, seats, doors, service history, warranty,
next inspection, consumption, emission class, extras. Homes: bedrooms, energy
class, deposit, orientation, internet, pets, plot size, commission, extras.

---

## 7. Implementation notes

- Filters and the form read the **same schema**: add a field to the schema and it
  appears in the stepper, in the review chips, and (if declared in `FILTERS`) in
  the rail. Keep them in step.
- Photos are drag-and-drop `<image-slot>` placeholders with stable ids; a real
  build swaps them for an upload field. First photo is the card cover.
- Scroll resets to the top of the frame on every view and step change.
- Do not transition a colour that is driven by a variant swap rather than hover —
  transition only `transform` on those elements. (A `transition: background` on
  the stepper's Next button left the computed colour pinned to the previous
  branch while the panel was hidden.)
- Prefers-reduced-motion collapses all animation.
- Every interactive element needs a visible `:focus-visible` accent outline.

## 8. Tweaks exposed

`defaultVertical` (cars | homes) · `defaultDevice` (pc | mobile) ·
`accent` (4 swatches) · `currency` (text)
