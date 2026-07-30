"use client";

// Marketplace template — cars & homes classifieds (browse + detail + enquiry).
// A self-contained, Arabic-first RTL storefront the visitor uses to search,
// filter, sort and open a listing, then message the seller. LISTINGS are the
// site owner's live inventory (passed in via `listings`); the owner authors them
// from the dashboard (not here). In the gallery/preview there is no `listings`
// prop → we fall back to DEMO_LISTINGS so the design reads as finished.
//
// Every filter maps to a field the owner filled in (build spec's core idea).
// Colors come from the mk-* tokens (globals.css @theme + [data-tpl=marketplace]),
// so palettes/accent tweaks cascade.

import * as React from "react";
import { useEdit, EditableText } from "@/components/templates/inline-edit";
import { formatArabicAmount } from "@/shared/currency";
import {
  FILTERS, SORTS, DETAIL_SPECS, VERTICAL_LABEL, VERTICAL_WORD, STATUS_LABEL,
  cardSpecLine, SEARCH_KEYS, OFFER_RENT,
  type MarketplaceListing, type Vertical, type SortKey, type FilterDef,
} from "./schema";
import { DEMO_LISTINGS } from "./demo";

const DISPLAY = "'El Messiri Variable', serif";
const MONO = "'JetBrains Mono Variable', monospace";

export interface MarketplaceProps {
  shop: {
    name: string;
    tagline?: string;
    verticals?: Vertical[];
    phone?: string;
    whatsapp?: string;
    sellerName?: string;
    sellerKind?: string;
  };
  currency?: string;
  /** Injected by the host on a real site (may be empty). Undefined → gallery/demo. */
  listings?: MarketplaceListing[];
  /** Injected by the host — the public slug the enquiry endpoint needs. */
  slug?: string;
}

/* ─────────────────────────────── helpers ────────────────────────────── */

const AR = "٠١٢٣٤٥٦٧٨٩";
function toAr(v: string | number | null | undefined): string {
  if (v == null) return "";
  return String(v).replace(/[0-9]/g, (d) => AR[+d]);
}
function num(v: unknown): number | null {
  if (v == null) return null;
  const latin = String(v).replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
  const n = parseFloat(latin.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function fieldValue(l: MarketplaceListing, key: string): unknown {
  if (key === "price") return l.price;
  if (key === "offer") return l.offer;
  if (key === "place") return l.place;
  if (key === "features") return l.features;
  return l.specs[key];
}
function priceText(l: MarketplaceListing, currency: string): string {
  if (l.price == null) return "حسب الطلب";
  const base = `${formatArabicAmount(l.price)} ${currency}`;
  return l.offer === OFFER_RENT ? `${base} / شهريًا` : base;
}
function initials(name?: string): string {
  const t = (name ?? "").trim();
  if (!t) return "؟";
  const parts = t.split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? "")).slice(0, 2);
}
/** A "nice" round upper bound + step for a money slider derived from the data. */
function moneyBounds(prices: number[]): { max: number; step: number } {
  const peak = Math.max(1000, ...prices);
  const pow = Math.pow(10, Math.floor(Math.log10(peak)) - 1);
  const max = Math.ceil(peak / pow) * pow;
  return { max, step: Math.max(pow, Math.round(max / 50)) };
}

type FMap = Record<string, string | string[] | number>;

/* ─────────────────────────────── component ──────────────────────────── */

export default function Marketplace({ shop, currency = "$", listings, slug }: MarketplaceProps) {
  const edit = useEdit();
  const editing = !!edit;
  const items = listings ?? DEMO_LISTINGS;

  // Available verticals derive from the actual inventory: a car-only dealer shows
  // just the cars tab (no config). Empty real site → fall back to shop.verticals.
  const present = new Set(items.map((l) => l.vertical));
  const derived = (["car", "home"] as Vertical[]).filter((v) => present.has(v));
  const verticals: Vertical[] = derived.length
    ? derived
    : shop.verticals && shop.verticals.length
      ? shop.verticals
      : ["car", "home"];

  const [vertical, setVertical] = React.useState<Vertical>(verticals[0] ?? "car");
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("new");
  const [filters, setFilters] = React.useState<Record<Vertical, FMap>>({ car: {}, home: {} });
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const f = filters[vertical];
  const setF = (k: string, v: string | number | null) =>
    setFilters((s) => {
      const cur = { ...s[vertical] };
      if (v === null || cur[k] === v) delete cur[k];
      else cur[k] = v;
      return { ...s, [vertical]: cur };
    });
  const toggleMulti = (k: string, v: string) =>
    setFilters((s) => {
      const cur = { ...s[vertical] };
      const list = Array.isArray(cur[k]) ? (cur[k] as string[]) : [];
      const nl = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
      if (nl.length) cur[k] = nl;
      else delete cur[k];
      return { ...s, [vertical]: cur };
    });
  const clearAll = () => {
    setFilters((s) => ({ ...s, [vertical]: {} }));
    setQ("");
  };

  const inVertical = React.useMemo(() => items.filter((l) => l.vertical === vertical), [items, vertical]);
  const prices = inVertical.map((l) => l.price ?? 0).filter((p) => p > 0);
  const money = moneyBounds(prices.length ? prices : [100000]);

  const filterDefs = FILTERS[vertical];

  const matches = (l: MarketplaceListing): boolean => {
    const qq = q.trim();
    if (qq) {
      const hay = [l.title, ...SEARCH_KEYS[vertical].map((k) => l.specs[k])].filter(Boolean).join(" ");
      if (!hay.includes(qq)) return false;
    }
    for (const [k, v] of Object.entries(f)) {
      if (k === "price") { if (l.price == null || l.price > (v as number)) return false; continue; }
      if (k === "km") { const n = num(l.specs.km); if (n == null || n > (v as number)) return false; continue; }
      if (k === "sizeMin") { const n = num(l.specs.size); if (n == null || n < (v as number)) return false; continue; }
      if (k === "seatsMin") { const n = num(l.specs.seats); if (n == null || n < (num(v as string) ?? 0)) return false; continue; }
      if (k === "roomsMin") { const n = num(l.specs.rooms); if (n == null || n < (num(v as string) ?? 0)) return false; continue; }
      if (k === "features") { if (!(v as string[]).every((x) => l.features.includes(x))) return false; continue; }
      // plain chips: equality on the mapped field
      if (String(fieldValue(l, k) ?? "") !== String(v)) return false;
    }
    return true;
  };

  const results = React.useMemo(() => {
    const list = inVertical.filter(matches);
    const dir = sort === "asc" ? 1 : sort === "desc" ? -1 : 0;
    return list.sort((a, b) => {
      if (!!b.featured !== !!a.featured) return b.featured ? 1 : -1; // featured first
      if (dir) return ((a.price ?? 0) - (b.price ?? 0)) * dir;
      const ay = num(a.specs.year ?? a.specs.built) ?? 0;
      const by = num(b.specs.year ?? b.specs.built) ?? 0;
      return by - ay; // newest
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inVertical, f, q, sort]);

  const detail = detailId ? items.find((l) => l.id === detailId) ?? null : null;

  // active-filter chips
  const activeChips: { label: string; onClear: () => void }[] = [];
  for (const [k, v] of Object.entries(f)) {
    const def = filterDefs.find((d) => d.k === k);
    if (!def) continue;
    if (def.kind === "range") {
      const label = def.money ? `${def.label} ${formatArabicAmount(v as number)} ${currency}` : `${def.label} ${toAr(v as number)}${def.unit ?? ""}`;
      activeChips.push({ label, onClear: () => setF(k, null) });
    } else if (Array.isArray(v)) {
      for (const item of v) activeChips.push({ label: item, onClear: () => toggleMulti(k, item) });
    } else {
      activeChips.push({ label: String(v), onClear: () => setF(k, null) });
    }
  }
  const activeCount = activeChips.length + (q.trim() ? 1 : 0);

  return (
    <div dir="rtl" className="min-h-dvh overflow-x-clip bg-mk-bg text-mk-ink" style={{ fontFamily: "var(--font-ui)" }}>
      {editing && (
        <div className="bg-mk-soft px-5 py-2 text-center text-[13px] text-mk-strong">
          هذه إعلانات تجريبية للعرض — أضِف إعلاناتك الحقيقية من «الإعلانات» في لوحة التحكم.
        </div>
      )}

      {/* header */}
      <header className="sticky top-0 z-30 flex items-center gap-5 border-b border-mk-line-soft bg-mk-bg/90 px-5 py-3.5 backdrop-blur md:px-8">
        <button onClick={() => setDetailId(null)} className="flex items-baseline gap-2.5 text-mk-ink">
          <EditableText path="shop.name" value={shop.name} as="span" className="font-['El_Messiri_Variable'] text-[21px] font-medium" />
          <span className="text-[10.5px] text-mk-accent" style={{ fontFamily: MONO }}>{VERTICAL_WORD[vertical]}</span>
        </button>
        {verticals.length > 1 && !detail && (
          <span className="ms-auto inline-flex gap-1 rounded-[10px] border border-mk-line-soft bg-mk-track p-[3px]">
            {verticals.map((v) => (
              <button
                key={v}
                onClick={() => { setVertical(v); setDetailId(null); }}
                className={"rounded-[7px] px-3.5 py-[7px] text-[13.5px] font-medium transition " + (v === vertical ? "bg-mk-surface text-mk-ink shadow-sm" : "text-mk-muted hover:text-mk-ink")}
              >
                {VERTICAL_LABEL[v]}
              </button>
            ))}
          </span>
        )}
        {shop.whatsapp && (
          <a
            href={`https://wa.me/${shop.whatsapp.replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className={"inline-flex h-10 items-center gap-2 rounded-[10px] bg-mk-accent px-4 text-[14px] font-medium text-white transition hover:bg-mk-strong " + (verticals.length > 1 && !detail ? "" : "ms-auto")}
          >
            تواصل معنا
          </a>
        )}
      </header>

      {detail ? (
        <DetailView listing={detail} currency={currency} shop={shop} slug={slug} onBack={() => setDetailId(null)} />
      ) : (
        <BrowseView
          vertical={vertical}
          results={results}
          totalLabel={`${toAr(results.length)} نتيجة`}
          currency={currency}
          q={q}
          setQ={setQ}
          sort={sort}
          setSort={setSort}
          filterDefs={filterDefs}
          f={f}
          setF={setF}
          toggleMulti={toggleMulti}
          money={money}
          activeChips={activeChips}
          activeCount={activeCount}
          clearAll={clearAll}
          onOpen={setDetailId}
          sheetOpen={sheetOpen}
          setSheetOpen={setSheetOpen}
          tagline={shop.tagline}
        />
      )}
    </div>
  );
}

/* ───────────────────────────── browse view ──────────────────────────── */

function BrowseView(p: {
  vertical: Vertical;
  results: MarketplaceListing[];
  totalLabel: string;
  currency: string;
  q: string; setQ: (v: string) => void;
  sort: SortKey; setSort: (s: SortKey) => void;
  filterDefs: FilterDef[];
  f: FMap;
  setF: (k: string, v: string | number | null) => void;
  toggleMulti: (k: string, v: string) => void;
  money: { max: number; step: number };
  activeChips: { label: string; onClear: () => void }[];
  activeCount: number;
  clearAll: () => void;
  onOpen: (id: string) => void;
  sheetOpen: boolean; setSheetOpen: (v: boolean) => void;
  tagline?: string;
}) {
  const kicker = p.vertical === "car" ? "سيارات مستعملة وجديدة" : "شقق ومنازل للبيع والإيجار";
  const rail = (
    <FilterRail filterDefs={p.filterDefs} f={p.f} setF={p.setF} toggleMulti={p.toggleMulti} money={p.money} currency={p.currency} />
  );

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2 px-5 pb-4 pt-6 md:px-8">
        <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>{kicker}</span>
        <div className="flex flex-wrap items-baseline gap-3.5">
          <h2 className="text-[26px] leading-tight md:text-[30px]" style={{ fontFamily: DISPLAY }}>
            {p.tagline || (p.vertical === "car" ? "اعثر على سيارتك القادمة" : "اعثر على منزلك القادم")}
          </h2>
          <span className="whitespace-nowrap rounded-full border border-mk-line px-3 py-[5px] text-[12px] text-mk-muted" style={{ fontFamily: MONO }}>{p.totalLabel}</span>
        </div>
      </div>

      {/* search + sort */}
      <div className="flex flex-wrap items-center gap-2.5 px-5 pb-4 md:px-8">
        <span className="relative min-w-[200px] flex-1">
          <input
            value={p.q}
            onChange={(e) => p.setQ(e.target.value)}
            placeholder={p.vertical === "car" ? "ابحث عن شركة أو طراز…" : "ابحث عن نوع العقار أو المنطقة…"}
            className="h-11 w-full rounded-[10px] border border-mk-line bg-mk-surface px-3.5 text-[14.5px] text-mk-ink outline-none transition focus:border-mk-accent"
          />
        </span>
        <button
          onClick={() => p.setSheetOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-mk-line bg-mk-surface px-4 text-[14px] font-medium text-mk-ink lg:hidden"
        >
          الفلاتر {p.activeCount > 0 ? `(${toAr(p.activeCount)})` : ""}
        </button>
        <span className="hidden items-center gap-2.5 lg:inline-flex">
          <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>الترتيب</span>
          <SortToggle sort={p.sort} setSort={p.setSort} />
        </span>
      </div>

      {/* active chips */}
      {p.activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-5 pb-3.5 md:px-8">
          {p.activeChips.map((a, i) => (
            <button key={i} onClick={a.onClear} className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-mk-accent/30 bg-mk-soft px-3 text-[12.5px] font-medium text-mk-strong">
              {a.label}
              <span aria-hidden>✕</span>
            </button>
          ))}
          <button onClick={p.clearAll} className="h-[30px] rounded-full px-3 text-[12.5px] font-medium text-mk-muted hover:bg-mk-track">مسح الكل</button>
        </div>
      )}

      {/* rail + results */}
      <div className="grid gap-8 px-5 pb-12 md:px-8 lg:grid-cols-[248px_1fr]">
        <aside className="sticky top-20 hidden flex-col gap-6 self-start lg:flex">
          {rail}
          <p className="rounded-xl border border-mk-line-soft bg-mk-surface p-3.5 text-[12.5px] leading-relaxed text-mk-faint">
            كل فلتر هنا حقلٌ عبّأه البائع. الحقول الاختيارية تضيف فلتر «الإضافات» في الأسفل.
          </p>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          {p.results.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {p.results.map((l) => (
                <ResultCard key={l.id} listing={l} currency={p.currency} onOpen={() => p.onOpen(l.id)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3.5 rounded-2xl border border-mk-line-soft bg-mk-surface px-6 py-12">
              <span className="text-[24px]" style={{ fontFamily: DISPLAY }}>لا نتائج مطابقة لهذه الفلاتر</span>
              <span className="max-w-[44ch] text-[14.5px] leading-relaxed text-mk-muted">وسّع نطاق السعر، أو امسح فلترًا أو اثنين.</span>
              <button onClick={p.clearAll} className="h-11 rounded-[10px] border border-mk-line bg-mk-surface px-5 text-[14px] font-medium text-mk-ink hover:bg-mk-track">مسح كل الفلاتر</button>
            </div>
          )}
        </div>
      </div>

      {/* mobile filter sheet */}
      {p.sheetOpen && (
        <div onClick={() => p.setSheetOpen(false)} className="fixed inset-0 z-40 flex items-end bg-black/40 lg:hidden">
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[88%] w-full flex-col rounded-t-3xl bg-mk-bg">
            <div className="flex items-center gap-3 p-4 pb-3">
              <h3 className="text-[22px]" style={{ fontFamily: DISPLAY }}>الفلاتر</h3>
              <button onClick={p.clearAll} className="ms-auto rounded-[10px] px-3 py-1.5 text-[13px] font-medium text-mk-muted">مسح الكل</button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
              {rail}
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>الترتيب</span>
                <SortToggle sort={p.sort} setSort={p.setSort} />
              </div>
            </div>
            <div className="border-t border-mk-line-soft p-4">
              <button onClick={() => p.setSheetOpen(false)} className="h-12 w-full rounded-[10px] bg-mk-accent text-[15px] font-medium text-white">
                عرض {toAr(p.results.length)} نتيجة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SortToggle({ sort, setSort }: { sort: SortKey; setSort: (s: SortKey) => void }) {
  return (
    <span className="inline-flex gap-[3px] self-start rounded-[10px] border border-mk-line-soft bg-mk-track p-[3px]">
      {SORTS.map((s) => (
        <button
          key={s.k}
          onClick={() => setSort(s.k)}
          className={"rounded-[7px] px-3 py-[7px] text-[13px] font-medium transition " + (s.k === sort ? "bg-mk-surface text-mk-ink shadow-sm" : "text-mk-muted hover:text-mk-ink")}
        >
          {s.label}
        </button>
      ))}
    </span>
  );
}

function FilterRail(p: {
  filterDefs: FilterDef[];
  f: FMap;
  setF: (k: string, v: string | number | null) => void;
  toggleMulti: (k: string, v: string) => void;
  money: { max: number; step: number };
  currency: string;
}) {
  return (
    <>
      {p.filterDefs.map((def) => {
        const active = p.f[def.k];
        return (
          <div key={def.k} className="flex flex-col gap-2.5">
            <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>{def.label}</span>

            {def.kind === "range" ? (
              <RangeControl def={def} value={active as number | undefined} setF={p.setF} money={p.money} currency={p.currency} />
            ) : (
              <span className="flex flex-wrap gap-1.5">
                {def.opts?.map((o) => {
                  const on = def.kind === "multi" ? Array.isArray(active) && active.includes(o) : active === o;
                  const onClick = () => (def.kind === "multi" ? p.toggleMulti(def.k, o) : p.setF(def.k, o));
                  return (
                    <button
                      key={o}
                      onClick={onClick}
                      className={"h-8 rounded-full px-3 text-[13px] font-medium transition " + (on ? "border border-mk-accent/30 bg-mk-soft text-mk-strong" : "border border-mk-line bg-mk-surface text-mk-muted hover:text-mk-ink")}
                    >
                      {o}
                    </button>
                  );
                })}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}

function RangeControl(p: {
  def: FilterDef;
  value: number | undefined;
  setF: (k: string, v: string | number | null) => void;
  money: { max: number; step: number };
  currency: string;
}) {
  const { def } = p;
  const isSize = def.k === "sizeMin"; // ">= from" range
  const min = def.money ? 0 : def.min ?? 0;
  const max = def.money ? p.money.max : def.max ?? 100;
  const step = def.money ? p.money.step : def.step ?? 1;
  const rest = isSize ? min : max; // untouched value
  const value = p.value ?? rest;
  const label =
    p.value == null
      ? "الكل"
      : def.money
        ? `${formatArabicAmount(value)} ${p.currency}`
        : `${toAr(value)}${def.unit ?? ""}`;
  return (
    <span className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between gap-2.5">
        <span className="text-[12px] text-mk-faint" style={{ fontFamily: MONO }}>{isSize ? "من" : "حتى"}</span>
        <span className="text-[13px] text-mk-ink" style={{ fontFamily: MONO }}>{label}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          p.setF(def.k, v === rest ? null : v);
        }}
        className="w-full accent-mk-accent"
      />
    </span>
  );
}

function ResultCard({ listing, currency, onOpen }: { listing: MarketplaceListing; currency: string; onOpen: () => void }) {
  const sold = listing.status === "sold";
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-2xl border border-mk-line-soft bg-mk-surface text-start shadow-mk transition hover:-translate-y-[3px] hover:border-mk-line"
    >
      <span className="relative block h-[172px] bg-mk-track">
        <Cover listing={listing} />
        <span className="absolute end-3 top-3 flex flex-wrap gap-1.5">
          {listing.featured && (
            <span className="inline-flex h-[26px] items-center rounded-full bg-mk-accent px-2.5 text-[12px] font-medium text-white">مميّز</span>
          )}
          {listing.status && listing.status !== "available" && (
            <span className={"inline-flex h-[26px] items-center rounded-full px-2.5 text-[12px] font-medium " + (sold ? "bg-mk-ink text-white" : "bg-mk-surface/90 text-mk-strong backdrop-blur")}>{STATUS_LABEL[listing.status]}</span>
          )}
        </span>
      </span>
      <span className="flex flex-col gap-2 p-[18px]">
        <span className="flex items-baseline gap-3">
          <span className="min-w-0 truncate text-[16.5px] font-semibold leading-snug">{listing.title}</span>
          <span className="ms-auto whitespace-nowrap text-[19px]" style={{ fontFamily: DISPLAY }}>{priceText(listing, currency)}</span>
        </span>
        <span className="text-[11.5px] leading-relaxed text-mk-muted" style={{ fontFamily: MONO }}>{cardSpecLine(listing)}</span>
        <span className="flex items-center gap-2.5 pt-0.5">
          <span className="text-[13px] text-mk-faint">{listing.place}</span>
          <span className="ms-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-mk-accent">عرض ←</span>
        </span>
      </span>
    </button>
  );
}

function Cover({ listing }: { listing: MarketplaceListing }) {
  const src = listing.images?.[0];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL
    return <img src={src} alt={listing.title} className="absolute inset-0 h-full w-full object-cover" />;
  }
  return (
    <span className="absolute inset-0 flex items-center justify-center text-mk-faint">
      <span className="text-[13px]">{listing.vertical === "car" ? "🚗" : "🏠"} صورة الإعلان</span>
    </span>
  );
}

/* ───────────────────────────── detail view ──────────────────────────── */

function DetailView({ listing, currency, shop, slug, onBack }: {
  listing: MarketplaceListing;
  currency: string;
  shop: MarketplaceProps["shop"];
  slug?: string;
  onBack: () => void;
}) {
  const [phoneShown, setPhoneShown] = React.useState(false);
  const [enquiry, setEnquiry] = React.useState(false);
  const phone = (listing.specs.phone as string) || shop.phone || "";
  const seller = (listing.specs.seller as string) || shop.sellerName || shop.name;
  const sellerKind = (listing.specs.sellerKind as string) || shop.sellerKind || "";
  const specs = DETAIL_SPECS[listing.vertical].filter((s) => listing.specs[s.k] != null && listing.specs[s.k] !== "");
  const keyFacts =
    listing.vertical === "car"
      ? [{ label: "سنة الصنع", v: listing.specs.year }, { label: "المسافة", v: listing.specs.km != null ? `${toAr(listing.specs.km)} كم` : null }, { label: "الوقود", v: listing.specs.fuel }, { label: "ناقل الحركة", v: listing.specs.trans }]
      : [{ label: "المساحة", v: listing.specs.size != null ? `${toAr(listing.specs.size)} م²` : null }, { label: "الغرف", v: listing.specs.rooms }, { label: "الطابق", v: listing.specs.floor }, { label: "التدفئة", v: listing.specs.heat }];

  return (
    <div className="flex flex-col gap-4 px-5 pb-14 pt-6 md:px-8">
      <button onClick={onBack} className="inline-flex h-9 items-center gap-2 self-start rounded-[10px] px-3 text-[13.5px] font-medium text-mk-muted hover:bg-mk-track hover:text-mk-ink">→ عودة إلى النتائج</button>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex min-w-0 flex-col gap-3">
          <span className="relative block h-[300px] overflow-hidden rounded-2xl border border-mk-line-soft bg-mk-track md:h-[400px]">
            <Cover listing={listing} />
          </span>
          {listing.images.length > 1 && (
            <span className="grid grid-cols-4 gap-2.5">
              {listing.images.slice(1, 5).map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL
                <img key={i} src={src} alt="" className="h-20 w-full rounded-[8px] border border-mk-line-soft object-cover" />
              ))}
            </span>
          )}

          <div className="mt-2 flex flex-col gap-5 rounded-2xl border border-mk-line-soft bg-mk-surface p-[22px] shadow-mk">
            {listing.description && (
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>الوصف</span>
                <p className="text-[15px] leading-relaxed text-mk-muted">{listing.description}</p>
              </div>
            )}
            {specs.length > 0 && (
              <>
                <div className="h-px bg-mk-line-soft" />
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>كل التفاصيل</span>
                  <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    {specs.map((s) => (
                      <span key={s.k} className="flex items-baseline gap-3 border-b border-mk-line-soft py-2.5">
                        <span className="text-[13.5px] text-mk-faint">{s.label}</span>
                        <span className="ms-auto text-end text-[12.5px] text-mk-ink" style={{ fontFamily: MONO }}>{toAr(listing.specs[s.k])}{s.unit ? ` ${s.unit}` : ""}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
            {listing.features.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>الإضافات</span>
                <span className="flex flex-wrap gap-1.5">
                  {listing.features.map((ft) => (
                    <span key={ft} className="inline-flex h-7 items-center rounded-full border border-mk-line bg-mk-surface px-3 text-[12.5px] text-mk-muted">{ft}</span>
                  ))}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* aside */}
        <div className="flex flex-col gap-4 self-start lg:sticky lg:top-20">
          <div className="flex flex-col gap-2">
            <h1 className="text-[27px] leading-tight" style={{ fontFamily: DISPLAY }}>{listing.title}</h1>
            <span className="text-[14px] text-mk-muted">{listing.place}</span>
            <span className="pt-1.5 text-[36px] leading-none" style={{ fontFamily: DISPLAY }}>{priceText(listing, currency)}</span>
            {listing.status && listing.status !== "available" && (
              <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>{STATUS_LABEL[listing.status]}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {keyFacts.filter((k) => k.v != null && k.v !== "").map((k, i) => (
              <span key={i} className="flex flex-col gap-1 rounded-xl border border-mk-line-soft bg-mk-surface px-3.5 py-3">
                <span className="text-[10.5px] text-mk-faint" style={{ fontFamily: MONO }}>{k.label}</span>
                <span className="text-[16px] font-semibold">{toAr(k.v as string)}</span>
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-mk-line-soft bg-mk-surface p-5 shadow-mk">
            <span className="flex items-center gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-mk-soft text-[14px] font-semibold text-mk-strong">{initials(seller)}</span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[15.5px] font-semibold">{seller}</span>
                {sellerKind && <span className="text-[12.5px] text-mk-faint">{sellerKind}</span>}
              </span>
            </span>
            <button onClick={() => setEnquiry(true)} className="h-11 rounded-[10px] bg-mk-accent text-[14.5px] font-medium text-white transition hover:bg-mk-strong">أرسل رسالة</button>
            {phone && (
              phoneShown ? (
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="h-11 rounded-[10px] border border-mk-line bg-mk-surface text-center text-[14px] font-medium leading-[44px] text-mk-ink hover:bg-mk-track" style={{ fontFamily: MONO }} dir="ltr">{phone}</a>
              ) : (
                <button onClick={() => setPhoneShown(true)} className="h-11 rounded-[10px] border border-mk-line bg-mk-surface text-[14px] font-medium text-mk-ink hover:bg-mk-track">إظهار رقم الهاتف</button>
              )
            )}
            <span className="text-[12.5px] leading-relaxed text-mk-faint">تصل استفساراتك مباشرة إلى البائع. لا حاجة لحساب للسؤال.</span>
          </div>
        </div>
      </div>

      {enquiry && <EnquiryModal listing={listing} slug={slug} onClose={() => setEnquiry(false)} />}
    </div>
  );
}

function EnquiryModal({ listing, slug, onClose }: { listing: MarketplaceListing; slug?: string; onClose: () => void }) {
  const [form, setForm] = React.useState({ name: "", contact: "", message: "", company: "" });
  const [state, setState] = React.useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    if (!form.name.trim() || !form.message.trim()) { setError("الرجاء إدخال الاسم والرسالة"); return; }
    setError(null);
    setState("sending");
    const body = `استفسار عن: ${listing.title}\n\n${form.message}`;
    // No slug (gallery/builder) → simulate success without hitting the API.
    if (!slug) { setTimeout(() => setState("sent"), 300); return; }
    try {
      const res = await fetch("/api/public/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, name: form.name, contact: form.contact, body, company: form.company }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) { setState("sent"); return; }
      setError(json && !json.ok ? json.error?.message ?? "تعذّر الإرسال" : "تعذّر الإرسال");
      setState("idle");
    } catch {
      setError("تعذّر الاتصال، حاول مجددًا");
      setState("idle");
    }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-mk-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-mk-line-soft px-5 py-3.5">
          <span className="text-[16px] font-semibold text-mk-ink">{state === "sent" ? "تم الإرسال" : "أرسل رسالة للبائع"}</span>
          <button onClick={onClose} aria-label="إغلاق" className="rounded-md p-1 text-mk-muted hover:text-mk-ink">✕</button>
        </div>
        {state === "sent" ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <span className="text-[40px]">✅</span>
            <p className="text-[14.5px] text-mk-muted">وصلت رسالتك، سيعاود البائع التواصل معك قريبًا.</p>
            <button onClick={onClose} className="h-10 rounded-[10px] bg-mk-accent px-5 text-[14px] font-medium text-white">تم</button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-2.5 px-5 py-4">
            <p className="text-[13px] leading-relaxed text-mk-muted">استفسار حول <span className="font-semibold text-mk-ink">{listing.title}</span></p>
            <input value={form.name} onChange={set("name")} placeholder="الاسم" maxLength={80} className="h-11 rounded-[10px] border border-mk-line bg-mk-surface px-3.5 text-[14.5px] text-mk-ink outline-none focus:border-mk-accent" />
            <input value={form.contact} onChange={set("contact")} placeholder="رقم الهاتف أو واتساب (اختياري)" inputMode="tel" maxLength={60} className="h-11 rounded-[10px] border border-mk-line bg-mk-surface px-3.5 text-[14.5px] text-mk-ink outline-none focus:border-mk-accent" />
            <textarea value={form.message} onChange={set("message")} placeholder="رسالتك…" rows={3} maxLength={1000} className="resize-none rounded-[10px] border border-mk-line bg-mk-surface px-3.5 py-2.5 text-[14.5px] text-mk-ink outline-none focus:border-mk-accent" />
            <input value={form.company} onChange={set("company")} name="company" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />
            {error && <span className="text-[12.5px] font-medium text-mk-danger">{error}</span>}
            <button type="submit" disabled={state === "sending"} className="mt-1 h-11 rounded-[10px] bg-mk-accent text-[14.5px] font-medium text-white transition hover:bg-mk-strong disabled:opacity-60">{state === "sending" ? "جارٍ الإرسال…" : "إرسال"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
