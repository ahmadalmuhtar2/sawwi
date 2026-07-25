# Sawwi — Handoff response (to the UI/UX brief)

No Figma file exists. This folder + the two prototype HTML files are the canonical design source. Nothing blocks.

## Priority 1 — Brand assets ✅ (in `assets/`)
- `logo.svg` — full color: mark (س on deep-green rounded square) + Arabic wordmark + Latin mono tag
- `logo-mono-ink.svg` — monochrome for light backgrounds
- `logo-mono-white.svg` — monochrome for dark backgrounds
- `favicon.svg` — mark only, 64×64 (generate 32/180/512 PNG + ICO at build)
- `loading-icon.svg` — animated (SMIL) spinner around the mark; use in per-tenant `loading.tsx`
- `og-image.png` — 1200×630 social image

## Priority 2 — Tokens: CONFIRMED as in DESIGN_BRIEF.md §1
- Accent green `oklch(0.45 0.085 155)` (sRGB fallback `#3e7d5e`) with the 100–900 ramp; danger `oklch(0.53 0.15 25)`; warn `oklch(0.72 0.13 75)`
- Neutrals/paper as specified; radii 6/10/14; shadows sm/md/lg as specified
- Fonts confirmed: **Readex Pro** (UI/body), **Cairo** 700/800 (headings/display), **JetBrains Mono** (labels, numerals, URLs). All are Google Fonts — self-host woff2 per the PRD (no licensed brand fonts exist)
- Icons: **Lucide is approved** (1.5px stroke at 16/18px to match the prototypes)

## Priority 3 — Landing page: NOT DELIVERED
Design from the brief. Direction: paper ground, Cairo display hero (Arabic-first), one accent, generous whitespace; order = hero → how-it-works (3 steps) → template verticals → section-library showcase → pricing (annual, cash) → WhatsApp CTA footer.

## Priority 4 — Barbershop section visuals: NOT DELIVERED
Use the configurator's live-preview skeletons in `Sawwi Dashboard.dc.html` for spacing/hierarchy per `{variant, scheme}`. Photos: source from Unsplash search "barbershop damascus / classic barber" — moody, warm, real interiors; never stocky smiling models.

## Priority 5 — Prototype files ✅ (this folder)
- `Component Gallery.dc.html` — every primitive, all states, interactive
- `Sawwi Dashboard.dc.html` — all screens, AR/EN + RTL toggle, role switcher
They are self-serving HTML (open in a browser); component inventory + props in DESIGN_BRIEF.md §2.
