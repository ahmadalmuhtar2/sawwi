"use client";

// Marketplace template — cars & homes classifieds, reshaped around ACCOUNTS:
//   · The served site opens with a MANDATORY auth gate (buyer/seller).
//   · A buyer (member) browses + filters; filters are SERVER-SIDE and live in the
//     URL (the page pre-filters `data.results`; toggling a filter just navigates).
//   · A seller (contributor) gets a post-only area + the progress-bar stepper.
//   · A manager reaches /admin. There is no free-text search (enum filters only).
//   · Browse is a LIST (not a grid) for density; a prominent vertical switch flips
//     between cars/properties; a seller's name opens their public listings page.
// In the gallery/preview (no `data`) it degrades to a client-side demo browse with
// no gate, so the design still reads as finished.

import * as React from "react";
import { useRouter } from "next/navigation";
import { useEdit, EditableText } from "@/components/templates/inline-edit";
import { useSiteAuth } from "@/components/public/site-auth";
import { formatArabicAmount, formatArabicNumber } from "@/shared/currency";
import {
  FILTERS, SORTS, DETAIL_SPECS, VERTICAL_LABEL, VERTICAL_WORD, STATUS_LABEL,
  cardSpecLine, OFFER_RENT,
  type MarketplaceListing, type Vertical, type SortKey, type FilterDef,
} from "./schema";
import { VERTICAL_PATH, viewToPath, type MView } from "./routing";
import {
  filterHref, matchesFilters, sortResults, computeRanges, activeChipList, computeFacets,
  type MarketplaceData, type FilterValues, type RangeBound,
} from "./filters";
import { AuthGate } from "./auth-gate";
import { SellerArea } from "./seller";
import { AdminView } from "./admin";
import { AccountModal } from "./account";
import { ThemeToggle, type MkTheme } from "./fields";
import { MkSelect } from "./mk-select";
import { usePaged, LoadMore } from "./paging";
import { DEMO_LISTINGS } from "./demo";

const DISPLAY = "var(--font-mk-display, 'Cairo Variable', system-ui, sans-serif)";
const MONO = "var(--font-mk-label, 'Readex Pro Variable', system-ui, sans-serif)";
const AR = "٠١٢٣٤٥٦٧٨٩";
function toAr(v: string | number | null | undefined): string {
  if (v == null) return "";
  return String(v).replace(/[0-9]/g, (d) => AR[+d]);
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

export interface MarketplaceProps {
  shop: {
    name: string;
    tagline?: string;
    carsKicker?: string;
    homesKicker?: string;
    verticals?: Vertical[];
    phone?: string;
    whatsapp?: string;
    sellerName?: string;
    sellerKind?: string;
    /** Brand logo (content.shop.logo) — the value the owner uploads in settings.
     *  Present in every render path (preview/builder/served), so it's the primary
     *  source; the `logoUrl` prop is a fallback (legacy Site.logoUrl). */
    logo?: string;
  };
  currency?: string;
  listings?: MarketplaceListing[];
  /** Server payload (results + facets + parsed URL filters). Present only on the
   *  served site; undefined in gallery/preview → client demo. */
  data?: MarketplaceData;
  slug?: string;
  route?: string[];
  /** The site's uploaded logo — shown in the header + auth gate when present. */
  logoUrl?: string | null;
}

/* ─────────────────────────────── shell ──────────────────────────────── */

export default function Marketplace({ shop, currency = "$", data, slug, logoUrl }: MarketplaceProps) {
  const edit = useEdit();
  const auth = useSiteAuth();
  // The `logoUrl` prop is the LIVE, permanent Site.logoUrl (passed by the served
  // page). In preview/builder no prop is passed, so fall back to the logo that
  // travels with the draft content (shop.logo) — kept in sync on every upload.
  const brandLogo = logoUrl || (typeof shop.logo === "string" && shop.logo.trim()) || null;
  const [theme, setTheme] = React.useState<MkTheme>("light");

  React.useEffect(() => {
    // One-time read of the visitor's stored / system theme preference.
    let next: MkTheme = "light";
    try {
      const s = localStorage.getItem("mk-theme");
      if (s === "dark" || s === "light") next = s;
      else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) next = "dark";
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- applying the stored/system preference on mount
    setTheme(next);
  }, []);

  const onToggleTheme = React.useCallback(() => {
    setTheme((t) => { const n: MkTheme = t === "light" ? "dark" : "light"; try { localStorage.setItem("mk-theme", n); } catch { /* ignore */ } return n; });
  }, []);

  let body: React.ReactNode;
  if (!data) {
    body = <DemoBrowse shop={shop} currency={currency} editing={!!edit} theme={theme} onToggleTheme={onToggleTheme} logoUrl={brandLogo} />;
  } else if (auth.loading) {
    body = <div className="grid min-h-dvh place-items-center text-[14px] text-mk-muted">جارٍ التحميل…</div>;
  } else if (!auth.user) {
    body = <AuthGate shopName={shop.name} tagline={shop.tagline} theme={theme} onToggleTheme={onToggleTheme} logoUrl={brandLogo} />;
  } else if (auth.user.role === "contributor") {
    body = <SellerArea currency={currency} theme={theme} onToggleTheme={onToggleTheme} />;
  } else {
    body = <BuyerShell shop={shop} currency={currency} data={data} slug={slug} theme={theme} onToggleTheme={onToggleTheme} logoUrl={brandLogo} />;
  }

  return (
    <div dir="rtl" data-mk-theme={theme} className="min-h-dvh overflow-x-clip bg-mk-bg text-mk-ink" style={{ fontFamily: "var(--font-ui)" }}>
      {body}
    </div>
  );
}

/* ───────────────────── buyer / manager shell (served) ────────────────── */

function BuyerShell({ shop, currency, data, slug, theme, onToggleTheme, logoUrl }: { shop: MarketplaceProps["shop"]; currency: string; data: MarketplaceData; slug?: string; theme: MkTheme; onToggleTheme: () => void; logoUrl?: string | null }) {
  const router = useRouter();
  const view = data.view;
  const vertical = view.vertical;
  const [account, setAccount] = React.useState(false);
  const go = React.useCallback((v: MView) => router.push(viewToPath(v), { scroll: false }), [router]);

  // filter/sort mutations → navigate to the new URL (server re-filters)
  const f = data.filters;
  const nav = (next: FilterValues, sort: SortKey) => router.push(filterHref(vertical, next, sort), { scroll: false });
  const setFilter = (k: string, v: string | number | null) => {
    const next = { ...f };
    if (v === null || next[k] === v) delete next[k]; else next[k] = v;
    if (k === "make") delete next.model; // model options depend on make → reset it
    nav(next, data.sort);
  };
  const toggleMulti = (k: string, item: string) => {
    const cur = Array.isArray(f[k]) ? (f[k] as string[]) : [];
    const nl = cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item];
    const next = { ...f }; if (nl.length) next[k] = nl; else delete next[k];
    nav(next, data.sort);
  };

  const accountModal = (account || view.kind === "account") && (
    <AccountModal onClose={() => { setAccount(false); if (view.kind === "account") go({ kind: "browse", vertical }); }} />
  );

  return (
    <>
      <Header shop={shop} vertical={vertical} verticals={data.verticals} onNav={go} onAccount={() => setAccount(true)} theme={theme} onToggleTheme={onToggleTheme} logoUrl={logoUrl} />
      {view.kind === "admin" ? (
        <AdminView currency={currency} onExit={() => go({ kind: "browse", vertical })} />
      ) : view.kind === "sellerPage" ? (
        <SellerListingsView
          results={data.results}
          currency={currency}
          fallbackName={shop.name}
          onOpen={(id, v) => go({ kind: "detail", vertical: v, id })}
          onBack={() => go({ kind: "browse", vertical })}
        />
      ) : view.kind === "detail" && data.detail ? (
        <DetailView
          listing={data.detail}
          currency={currency}
          shop={shop}
          slug={slug}
          onBack={() => go({ kind: "browse", vertical })}
          onSellerOpen={(id) => go({ kind: "sellerPage", vertical, id })}
        />
      ) : (
        <BrowseView
          vertical={vertical}
          results={data.results}
          filters={f}
          facets={data.facets}
          sort={data.sort}
          ranges={data.ranges}
          currency={currency}
          onSetFilter={setFilter}
          onToggleMulti={toggleMulti}
          onSort={(s) => nav(f, s)}
          onClear={() => router.push(`/${VERTICAL_PATH[vertical]}`, { scroll: false })}
          onOpen={(id) => go({ kind: "detail", vertical, id })}
          shop={shop}
        />
      )}
      {accountModal}
    </>
  );
}

function Header({ shop, vertical, verticals, onNav, onAccount, theme, onToggleTheme, logoUrl }: {
  shop: MarketplaceProps["shop"];
  vertical: Vertical;
  verticals: Vertical[];
  onNav: (v: MView) => void;
  onAccount: () => void;
  theme: MkTheme;
  onToggleTheme: () => void;
  logoUrl?: string | null;
}) {
  const auth = useSiteAuth();
  const [menu, setMenu] = React.useState(false);
  const [drawer, setDrawer] = React.useState(false);

  return (
    <>
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-mk-line-soft bg-mk-bg/90 px-5 py-3 backdrop-blur md:px-8">
      <button onClick={() => onNav({ kind: "browse", vertical: verticals[0] ?? "car" })} className="flex items-center gap-3 text-mk-ink">
        {logoUrl ? (
          <>
            {/* Rendered transparent (no plate) so a bg-removed logo blends with the
                header. object-contain keeps its aspect ratio. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded logo URL */}
            <img src={logoUrl} alt={shop.name} className="h-10 w-auto max-w-44 object-contain" />
            <span className="hidden text-[10.5px] text-mk-accent sm:inline" style={{ fontFamily: MONO }}>{VERTICAL_WORD[vertical]}</span>
          </>
        ) : (
          <>
            <EditableText path="shop.name" value={shop.name} as="span" className="font-(family-name:--font-mk-display) text-[20px] font-bold tracking-tight" />
            <span className="hidden text-[10.5px] text-mk-accent sm:inline" style={{ fontFamily: MONO }}>{VERTICAL_WORD[vertical]}</span>
          </>
        )}
      </button>

      {verticals.length > 1 && (
        <nav className="hidden items-center gap-1 md:flex">
          {verticals.map((v) => (
            <button key={v} onClick={() => onNav({ kind: "browse", vertical: v })} className={"rounded-lg px-3.5 py-1.5 text-[14px] font-semibold transition " + (v === vertical ? "bg-mk-soft text-mk-strong" : "text-mk-muted hover:bg-mk-track hover:text-mk-ink")}>
              {VERTICAL_LABEL[v]}
            </button>
          ))}
        </nav>
      )}

      <span className="ms-auto flex items-center gap-2.5">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        {auth.user?.role === "manager" && (
          <button onClick={() => onNav({ kind: "admin", vertical })} className="hidden h-10 items-center rounded-[10px] border border-mk-line bg-mk-surface px-3.5 text-[13.5px] font-medium text-mk-ink transition hover:bg-mk-track md:inline-flex">الإدارة</button>
        )}
        {shop.whatsapp && (
          <a href={`https://wa.me/${shop.whatsapp.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" className="hidden h-10 items-center gap-2 rounded-[10px] bg-mk-accent px-4 text-[14px] font-semibold text-white transition hover:bg-mk-strong md:inline-flex">تواصل معنا</a>
        )}
        {auth.user && (
          <div className="relative hidden md:block">
            <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full border border-mk-line bg-mk-surface py-1 pe-3 ps-1 text-mk-ink transition hover:bg-mk-track">
              <span className="flex size-8 items-center justify-center rounded-full bg-mk-soft text-[12px] font-bold text-mk-strong">{initials(auth.user.name || auth.user.email)}</span>
              <span className="hidden text-[12.5px] font-medium sm:block">{auth.labels[auth.user.role]}</span>
            </button>
            {menu && (
              <>
                <span className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
                <div className="absolute end-0 top-full z-40 mt-2 w-52 overflow-hidden rounded-xl border border-mk-line-soft bg-mk-surface p-1 shadow-xl">
                  <div className="truncate px-3 py-2 text-[11px] text-mk-faint">{auth.user.name || auth.user.email}</div>
                  <button onClick={() => { setMenu(false); onAccount(); }} className="w-full rounded-lg px-3 py-2 text-start text-[13.5px] text-mk-ink transition hover:bg-mk-track">إعدادات الحساب</button>
                  <button onClick={() => { setMenu(false); void auth.signOut(); }} className="w-full rounded-lg px-3 py-2 text-start text-[13.5px] text-mk-danger transition hover:bg-mk-danger-soft">تسجيل الخروج</button>
                </div>
              </>
            )}
          </div>
        )}
        {/* mobile hamburger */}
        <button onClick={() => setDrawer(true)} aria-label="القائمة" className="inline-flex size-10 items-center justify-center rounded-[10px] border border-mk-line bg-mk-surface text-mk-ink transition hover:bg-mk-track md:hidden">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </span>
    </header>

    {/* Rendered OUTSIDE <header> — the header's backdrop-blur would otherwise
        become the containing block for this fixed overlay and clip it. */}
    {drawer && <MobileMenu shop={shop} verticals={verticals} onNav={onNav} onAccount={onAccount} onClose={() => setDrawer(false)} />}
    </>
  );
}

/* ───────────────────────── mobile drawer ────────────────────────────── */

function MobileMenu({ shop, verticals, onNav, onAccount, onClose }: {
  shop: MarketplaceProps["shop"];
  verticals: Vertical[];
  onNav: (v: MView) => void;
  onAccount: () => void;
  onClose: () => void;
}) {
  const auth = useSiteAuth();
  const wa = shop.whatsapp ? `https://wa.me/${shop.whatsapp.replace(/[^\d]/g, "")}` : null;
  const item = "w-full rounded-lg px-3 py-3 text-start text-[15px] font-medium text-mk-ink transition hover:bg-mk-track";

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/45" />
      <div onClick={(e) => e.stopPropagation()} className="absolute inset-y-0 start-0 flex w-[84%] max-w-[320px] flex-col bg-mk-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-mk-line-soft px-4 py-3.5">
          <span className="text-[16px] font-bold" style={{ fontFamily: DISPLAY }}>القائمة</span>
          <button onClick={onClose} aria-label="إغلاق" className="rounded-md p-1.5 text-mk-muted transition hover:text-mk-ink">✕</button>
        </div>

        {auth.user && (
          <button onClick={() => { onClose(); onAccount(); }} className="flex items-center gap-3 border-b border-mk-line-soft px-4 py-4 text-start transition hover:bg-mk-track">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mk-soft text-[15px] font-bold text-mk-strong">{initials(auth.user.name || auth.user.email)}</span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[15px] font-semibold text-mk-ink">{auth.user.name || auth.user.email}</span>
              <span className="text-[12.5px] text-mk-accent">{auth.labels[auth.user.role]} · إعدادات الحساب</span>
            </span>
          </button>
        )}

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {verticals.includes("car") && <button onClick={() => { onClose(); onNav({ kind: "browse", vertical: "car" }); }} className={item}>السيارات</button>}
          {verticals.includes("home") && <button onClick={() => { onClose(); onNav({ kind: "browse", vertical: "home" }); }} className={item}>العقارات</button>}
          {auth.user?.role === "manager" && <button onClick={() => { onClose(); onNav({ kind: "admin", vertical: verticals[0] ?? "car" }); }} className={item}>الإدارة</button>}
          {wa && <a href={wa} target="_blank" rel="noreferrer" onClick={onClose} className={item}>تواصل معنا</a>}
        </nav>

        {auth.user && (
          <div className="border-t border-mk-line-soft p-2">
            <button onClick={() => { onClose(); void auth.signOut(); }} className="w-full rounded-lg px-3 py-3 text-start text-[15px] font-medium text-mk-danger transition hover:bg-mk-danger-soft">تسجيل الخروج</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────── browse ─────────────────────────────── */

interface BrowseProps {
  vertical: Vertical;
  results: MarketplaceListing[];
  filters: FilterValues;
  facets: Record<string, string[]>;
  sort: SortKey;
  ranges: Record<string, RangeBound>;
  currency: string;
  onSetFilter: (k: string, v: string | number | null) => void;
  onToggleMulti: (k: string, item: string) => void;
  onSort: (s: SortKey) => void;
  onClear: () => void;
  onOpen: (id: string) => void;
  shop: MarketplaceProps["shop"];
}

function BrowseView(p: BrowseProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const paged = usePaged(p.results, 12);
  const filterDefs = FILTERS[p.vertical];
  const isCar = p.vertical === "car";
  const kickerPath = isCar ? "shop.carsKicker" : "shop.homesKicker";
  const kickerVal = (isCar ? p.shop.carsKicker : p.shop.homesKicker) || (isCar ? "سيارات مستعملة وجديدة" : "شقق ومنازل للبيع والإيجار");
  const headingVal = p.shop.tagline || (isCar ? "اعثر على سيارتك القادمة" : "اعثر على منزلك القادم");

  const chips = activeChipList(p.vertical, p.filters, formatArabicAmount, p.currency);
  const activeCount = chips.length;

  const rail = <FilterRail filterDefs={filterDefs} filters={p.filters} facets={p.facets} onSetFilter={p.onSetFilter} onToggleMulti={p.onToggleMulti} ranges={p.ranges} currency={p.currency} />;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2 px-5 pb-4 pt-6 md:px-8">
        <EditableText path={kickerPath} value={kickerVal} as="span" className="font-(family-name:--font-mk-label) text-[11px] text-mk-faint" />
        <EditableText path="shop.tagline" value={headingVal} as="h2" className="font-(family-name:--font-mk-display) text-[26px] font-bold leading-tight tracking-tight md:text-[30px]" />
      </div>

      {/* sort + mobile filters button (NO search bar) */}
      <div className="flex flex-wrap items-center gap-2.5 px-5 pb-4 md:px-8">
        <button onClick={() => setSheetOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-mk-line bg-mk-surface px-4 text-[14px] font-medium text-mk-ink lg:hidden">
          الفلاتر {activeCount > 0 ? `(${toAr(activeCount)})` : ""}
        </button>
        <span className="ms-auto inline-flex items-center gap-2.5">
          <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>الترتيب</span>
          <SortToggle sort={p.sort} setSort={p.onSort} />
        </span>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-5 pb-3.5 md:px-8">
          {chips.map((c, i) => (
            <button key={i} onClick={() => (c.value ? p.onToggleMulti(c.key, c.value) : p.onSetFilter(c.key, null))} className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-mk-accent/30 bg-mk-soft px-3 text-[12.5px] font-medium text-mk-strong">
              {c.label} <span aria-hidden>✕</span>
            </button>
          ))}
          <button onClick={p.onClear} className="h-[30px] rounded-full px-3 text-[12.5px] font-medium text-mk-muted hover:bg-mk-track">مسح الكل</button>
        </div>
      )}

      <div className="grid gap-8 px-5 pb-12 md:px-8 lg:grid-cols-[248px_1fr]">
        <aside className="sticky top-20 hidden flex-col gap-6 self-start lg:flex">
          {rail}
          <p className="rounded-xl border border-mk-line-soft bg-mk-surface p-3.5 text-[12.5px] leading-relaxed text-mk-faint">كل فلتر هنا حقلٌ عبّأه البائع. اختَر ما يناسبك لتضيّق النتائج.</p>
        </aside>

        <div className="flex min-w-0 flex-col gap-3">
          {p.results.length > 0 ? (
            <>
              {paged.visible.map((l) => <ListRow key={l.id} listing={l} currency={p.currency} onOpen={() => p.onOpen(l.id)} />)}
              {paged.hasMore && <LoadMore remaining={paged.remaining} onClick={paged.showMore} className="mt-2" />}
            </>
          ) : (
            <div className="flex flex-col items-start gap-3.5 rounded-2xl border border-mk-line-soft bg-mk-surface px-6 py-12">
              <span className="text-[24px] font-bold" style={{ fontFamily: DISPLAY }}>لا نتائج مطابقة لهذه الفلاتر</span>
              <span className="max-w-[44ch] text-[14.5px] leading-relaxed text-mk-muted">وسّع نطاق السعر، أو امسح فلترًا أو اثنين.</span>
              <button onClick={p.onClear} className="h-11 rounded-[10px] border border-mk-line bg-mk-surface px-5 text-[14px] font-medium text-mk-ink hover:bg-mk-track">مسح كل الفلاتر</button>
            </div>
          )}
        </div>
      </div>

      {sheetOpen && (
        <div onClick={() => setSheetOpen(false)} className="fixed inset-0 z-40 flex items-end bg-black/40 lg:hidden">
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[88%] w-full flex-col rounded-t-3xl bg-mk-bg">
            <div className="flex items-center gap-3 p-4 pb-3">
              <h3 className="text-[22px]" style={{ fontFamily: DISPLAY }}>الفلاتر</h3>
              <button onClick={p.onClear} className="ms-auto rounded-[10px] px-3 py-1.5 text-[13px] font-medium text-mk-muted">مسح الكل</button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">{rail}</div>
            <div className="border-t border-mk-line-soft p-4">
              <button onClick={() => setSheetOpen(false)} className="h-12 w-full rounded-[10px] bg-mk-accent text-[15px] font-medium text-white">عرض {formatArabicNumber(p.results.length)} نتيجة</button>
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
        <button key={s.k} onClick={() => setSort(s.k)} className={"rounded-[7px] px-3 py-[7px] text-[13px] font-medium transition " + (s.k === sort ? "bg-mk-surface text-mk-ink shadow-sm" : "text-mk-muted hover:text-mk-ink")}>{s.label}</button>
      ))}
    </span>
  );
}

function FilterRail(p: {
  filterDefs: FilterDef[];
  filters: FilterValues;
  facets: Record<string, string[]>;
  onSetFilter: (k: string, v: string | number | null) => void;
  onToggleMulti: (k: string, item: string) => void;
  ranges: Record<string, RangeBound>;
  currency: string;
}) {
  // Options actually present in the inventory (facets), ordered by the schema's
  // list where there is one. No facet computed (ranges / "min" chips) → static.
  const optsFor = (def: FilterDef): string[] => {
    const present = p.facets[def.k];
    if (!present) return def.opts ?? [];
    return def.opts ? def.opts.filter((o) => present.includes(o)) : present;
  };

  return (
    <>
      {p.filterDefs.map((def) => {
        const active = p.filters[def.k];

        // A dependent select (model ← make): shown only once the parent is chosen,
        // options are the models present for that make.
        if (def.kind === "select") {
          if (def.depends && !p.filters[def.depends]) return null;
          const opts = optsFor(def);
          if (!opts.length) return null;
          const val = typeof active === "string" ? active : "";
          return (
            <div key={def.k} className="flex flex-col gap-2.5">
              <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>{def.label}</span>
              <MkSelect
                value={val || null}
                onChange={(v) => p.onSetFilter(def.k, v)}
                options={opts.map((o) => ({ value: o, label: o }))}
                placeholder="الكل"
                triggerClass="h-10 rounded-[10px] border border-mk-line bg-mk-surface px-2.5 text-[13.5px] text-mk-ink outline-none transition"
              />
            </div>
          );
        }

        if (def.kind === "range") {
          const bounds = p.ranges[def.k];
          if (!bounds) return null;
          return (
            <div key={def.k} className="flex flex-col gap-2.5">
              <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>{def.label}</span>
              <RangeControl def={def} value={active as number | undefined} setF={p.onSetFilter} bounds={bounds} currency={p.currency} />
            </div>
          );
        }

        // chips / multi — hide the filter entirely if no such values exist
        const opts = optsFor(def);
        if (!opts.length) return null;
        return (
          <div key={def.k} className="flex flex-col gap-2.5">
            <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>{def.label}</span>
            <span className="flex flex-wrap gap-1.5">
              {opts.map((o) => {
                const on = def.kind === "multi" ? Array.isArray(active) && active.includes(o) : active === o;
                const onClick = () => (def.kind === "multi" ? p.onToggleMulti(def.k, o) : p.onSetFilter(def.k, active === o ? null : o));
                return (
                  <button key={o} onClick={onClick} className={"h-8 rounded-full px-3 text-[13px] font-medium transition " + (on ? "border border-mk-accent/30 bg-mk-soft text-mk-strong" : "border border-mk-line bg-mk-surface text-mk-muted hover:text-mk-ink")}>{o}</button>
                );
              })}
            </span>
          </div>
        );
      })}
    </>
  );
}

// Range slider with SMOOTH dragging: the thumb tracks local state on every tick,
// and the URL (server re-filter) is only updated after a short debounce — plus an
// immediate commit on release — so navigation never interrupts the drag.
function RangeControl(p: {
  def: FilterDef;
  value: number | undefined;
  setF: (k: string, v: string | number | null) => void;
  bounds: RangeBound;
  currency: string;
}) {
  const { def } = p;
  const isSize = def.k === "sizeMin";
  const { min, max } = p.bounds;
  const step = p.bounds.step || 1;
  const rest = isSize ? min : max; // the "الكل" (no-filter) end of the track
  const committed = p.value ?? rest;
  const [local, setLocal] = React.useState(committed);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mirror the committed (URL) value when it changes externally — navigation,
  // clear-all, or switching vertical.
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to the external committed value
    setLocal(committed);
  }, [committed]);
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const commit = (v: number) => p.setF(def.k, v === rest ? null : v);
  const onDrag = (v: number) => {
    setLocal(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(v), 300); // debounce while dragging
  };
  const flush = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } commit(local); };

  const label = local === rest ? "الكل" : def.money ? `${formatArabicAmount(local)} ${p.currency}` : `${formatArabicNumber(local)}${def.unit ?? ""}`;
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
        value={local}
        onChange={(e) => onDrag(Number(e.target.value))}
        onPointerUp={flush}
        onTouchEnd={flush}
        onKeyUp={flush}
        className="w-full accent-mk-accent"
      />
    </span>
  );
}

/** One listing as a horizontal LIST row (image + details), for density. */
function ListRow({ listing, currency, onOpen }: { listing: MarketplaceListing; currency: string; onOpen: () => void }) {
  const sold = listing.status === "sold";
  return (
    <button onClick={onOpen} className="group flex gap-4 overflow-hidden rounded-2xl border border-mk-line-soft bg-mk-surface p-3 text-start shadow-mk transition hover:border-mk-line hover:-translate-y-[1px]">
      <span className="relative block h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-mk-track sm:h-28 sm:w-44">
        <Cover listing={listing} />
        {listing.featured && <span className="absolute start-2 top-2 inline-flex h-[22px] items-center rounded-full bg-mk-gold px-2 text-[11px] font-bold text-mk-gold-ink shadow-sm">مميّز</span>}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5">
        <span className="flex items-baseline gap-3">
          <span className="min-w-0 truncate text-[16px] font-semibold leading-snug">{listing.title}</span>
          <span className="ms-auto whitespace-nowrap text-[18px] font-bold text-mk-ink" style={{ fontFamily: DISPLAY }}>{priceText(listing, currency)}</span>
        </span>
        <span className="text-[11.5px] leading-relaxed text-mk-muted" style={{ fontFamily: MONO }}>{cardSpecLine(listing)}</span>
        <span className="mt-auto flex items-center gap-2.5 pt-1">
          <span className="text-[13px] text-mk-faint">{listing.place}</span>
          {listing.status && listing.status !== "available" && <span className={"inline-flex h-[22px] items-center rounded-full px-2 text-[11px] font-medium " + (sold ? "bg-mk-ink text-mk-bg" : "bg-mk-soft text-mk-strong")}>{STATUS_LABEL[listing.status]}</span>}
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
  return <span className="absolute inset-0 flex items-center justify-center text-[12px] text-mk-faint">لا توجد صورة</span>;
}

/* ────────────────────── a seller's public listings ──────────────────── */

function SellerListingsView({ results, currency, fallbackName, onOpen, onBack }: {
  results: MarketplaceListing[];
  currency: string;
  fallbackName: string;
  onOpen: (id: string, vertical: Vertical) => void;
  onBack: () => void;
}) {
  const name = (results[0]?.specs.seller as string) || fallbackName;
  const kind = (results[0]?.specs.sellerKind as string) || "";
  const paged = usePaged(results, 12);
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 px-5 pb-14 pt-6 md:px-8">
      <button onClick={onBack} className="inline-flex h-9 items-center gap-2 self-start rounded-[10px] px-3 text-[13.5px] font-medium text-mk-muted hover:bg-mk-track hover:text-mk-ink">→ عودة إلى النتائج</button>

      <div className="flex items-center gap-3.5 rounded-2xl border border-mk-line-soft bg-mk-surface p-5 shadow-mk">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-mk-soft text-[16px] font-semibold text-mk-strong">{initials(name)}</span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[19px] font-bold" style={{ fontFamily: DISPLAY }}>{name}</span>
          <span className="text-[12.5px] text-mk-faint">{kind ? `${kind} · ` : ""}{formatArabicNumber(results.length)} إعلان</span>
        </span>
      </div>

      {results.length > 0 ? (
        <div className="flex flex-col gap-3">
          {paged.visible.map((l) => <ListRow key={l.id} listing={l} currency={currency} onOpen={() => onOpen(l.id, l.vertical)} />)}
          {paged.hasMore && <LoadMore remaining={paged.remaining} onClick={paged.showMore} className="mt-2" />}
        </div>
      ) : (
        <div className="rounded-2xl border border-mk-line-soft bg-mk-surface px-6 py-12 text-center text-[15px] text-mk-muted">لا إعلانات منشورة لهذا البائع حاليًا.</div>
      )}
    </div>
  );
}

/* ─────────────────────────── image gallery ──────────────────────────── */

function Gallery({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const count = images.length;
  const go = React.useCallback((d: number) => setIdx((i) => (i + d + count) % count), [count]);
  // Pointer swipe (touch + mouse). A short, still press is treated as a tap.
  const drag = React.useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY }; };
  const onUp = (e: React.PointerEvent, allowTap: boolean) => {
    const d = drag.current; drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (count > 1 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1); // drag left → next
    else if (allowTap && Math.abs(dx) < 10 && Math.abs(dy) < 10) setOpen(true);
  };

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      else if (e.key === "ArrowRight") go(1);   // → chevron = next
      else if (e.key === "ArrowLeft") go(-1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, go]);

  if (count === 0) {
    return (
      <span className="relative block h-[300px] overflow-hidden rounded-2xl border border-mk-line-soft bg-mk-track md:h-[400px]">
        <span className="absolute inset-0 flex items-center justify-center text-[13px] text-mk-faint">لا توجد صورة</span>
      </span>
    );
  }

  const cur = images[idx];
  // Chevron points in the direction of travel: › (right) = next, ‹ (left) = previous.
  const arrowCls = "absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-mk-surface/90 text-[20px] leading-none text-mk-ink shadow-md backdrop-blur transition hover:bg-mk-surface";
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div
          role="button"
          tabIndex={0}
          onPointerDown={onDown}
          onPointerUp={(e) => onUp(e, true)}
          onKeyDown={(e) => { if (e.key === "Enter") setOpen(true); }}
          style={{ touchAction: "pan-y" }}
          className="relative block h-[300px] w-full overflow-hidden rounded-2xl border border-mk-line-soft bg-mk-track md:h-[400px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL */}
          <img src={cur} alt={title} draggable={false} className="h-full w-full select-none object-cover" />
          <span className="pointer-events-none absolute bottom-3 end-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white" style={{ fontFamily: MONO }}>{toAr(idx + 1)}/{toAr(count)}</span>
        </div>
        {count > 1 && (
          <>
            <button type="button" aria-label="التالي" onClick={() => go(1)} className={arrowCls + " start-3"}>›</button>
            <button type="button" aria-label="السابق" onClick={() => go(-1)} className={arrowCls + " end-3"}>‹</button>
          </>
        )}
      </div>

      {count > 1 && (
        <div dir="ltr" className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button key={i} type="button" onClick={() => setIdx(i)} className={"relative h-16 w-20 shrink-0 overflow-hidden rounded-[8px] border-2 transition " + (i === idx ? "border-mk-accent" : "border-transparent opacity-70 hover:opacity-100")}>
              {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL */}
              <img src={src} alt="" draggable={false} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4">
          <button onClick={() => setOpen(false)} aria-label="إغلاق" className="absolute end-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-[20px] text-white transition hover:bg-white/20">✕</button>
          {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL */}
          <img
            src={cur}
            alt={title}
            draggable={false}
            onPointerDown={onDown}
            onPointerUp={(e) => onUp(e, false)}
            onClick={(e) => e.stopPropagation()}
            style={{ touchAction: "pan-y" }}
            className="max-h-[86vh] max-w-[92vw] select-none rounded-lg object-contain"
          />
          {count > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="التالي" className="absolute start-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-[24px] text-white transition hover:bg-white/20">›</button>
              <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="السابق" className="absolute end-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-[24px] text-white transition hover:bg-white/20">‹</button>
              <span className="absolute bottom-4 start-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-[12px] text-white" style={{ fontFamily: MONO }}>{toAr(idx + 1)} / {toAr(count)}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────── detail ─────────────────────────────── */

function DetailView({ listing, currency, shop, slug, onBack, onSellerOpen }: {
  listing: MarketplaceListing;
  currency: string;
  shop: MarketplaceProps["shop"];
  slug?: string;
  onBack: () => void;
  onSellerOpen?: (id: string) => void;
}) {
  const [phoneShown, setPhoneShown] = React.useState(false);
  const [enquiry, setEnquiry] = React.useState(false);
  const phone = (listing.specs.phone as string) || shop.phone || "";
  const seller = (listing.specs.seller as string) || shop.sellerName || shop.name;
  const sellerKind = (listing.specs.sellerKind as string) || shop.sellerKind || "";
  const sellerLink = !!(listing.authorId && onSellerOpen);
  const specs = DETAIL_SPECS[listing.vertical].filter((s) => listing.specs[s.k] != null && listing.specs[s.k] !== "");
  const keyFacts = listing.vertical === "car"
    ? [{ label: "سنة الصنع", v: listing.specs.year }, { label: "المسافة", v: listing.specs.km != null ? `${formatArabicNumber(listing.specs.km as number)} كم` : null }, { label: "الوقود", v: listing.specs.fuel }, { label: "ناقل الحركة", v: listing.specs.trans }]
    : [{ label: "المساحة", v: listing.specs.size != null ? `${formatArabicNumber(listing.specs.size as number)} م²` : null }, { label: "الغرف", v: listing.specs.rooms }, { label: "الطابق", v: listing.specs.floor }, { label: "التدفئة", v: listing.specs.heat }];

  return (
    <div className="flex flex-col gap-4 px-5 pb-14 pt-6 md:px-8">
      <button onClick={onBack} className="inline-flex h-9 items-center gap-2 self-start rounded-[10px] px-3 text-[13.5px] font-medium text-mk-muted hover:bg-mk-track hover:text-mk-ink">→ عودة إلى النتائج</button>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex min-w-0 flex-col gap-3">
          <Gallery images={listing.images} title={listing.title} />

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
                        <span className="ms-auto text-end text-[12.5px] text-mk-ink" style={{ fontFamily: MONO }}>{s.k === "year" || s.k === "built" ? toAr(listing.specs[s.k]) : formatArabicNumber(listing.specs[s.k] as string | number)}{s.unit ? ` ${s.unit}` : ""}</span>
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
                  {listing.features.map((ft) => <span key={ft} className="inline-flex h-7 items-center rounded-full border border-mk-line bg-mk-surface px-3 text-[12.5px] text-mk-muted">{ft}</span>)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 self-start lg:sticky lg:top-20">
          <div className="flex flex-col gap-2">
            <h1 className="text-[27px] font-bold leading-tight tracking-tight" style={{ fontFamily: DISPLAY }}>{listing.title}</h1>
            <span className="text-[14px] text-mk-muted">{listing.place}</span>
            <span className="pt-1.5 text-[36px] font-bold leading-none tracking-tight" style={{ fontFamily: DISPLAY }}>{priceText(listing, currency)}</span>
            {listing.status && listing.status !== "available" && <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>{STATUS_LABEL[listing.status]}</span>}
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
            {sellerLink ? (
              <button onClick={() => onSellerOpen!(listing.authorId!)} className="group flex items-center gap-3 text-start">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-mk-soft text-[14px] font-semibold text-mk-strong">{initials(seller)}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[15.5px] font-semibold text-mk-ink group-hover:text-mk-accent">{seller} <span className="text-[12px] font-normal text-mk-accent">عرض إعلاناته ←</span></span>
                  {sellerKind && <span className="text-[12.5px] text-mk-faint">{sellerKind}</span>}
                </span>
              </button>
            ) : (
              <span className="flex items-center gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-mk-soft text-[14px] font-semibold text-mk-strong">{initials(seller)}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[15.5px] font-semibold">{seller}</span>
                  {sellerKind && <span className="text-[12.5px] text-mk-faint">{sellerKind}</span>}
                </span>
              </span>
            )}
            <button onClick={() => setEnquiry(true)} className="h-11 rounded-[10px] bg-mk-accent text-[14.5px] font-medium text-white transition hover:bg-mk-strong">أرسل رسالة</button>
            {phone && (phoneShown
              ? <a href={`tel:${phone.replace(/\s/g, "")}`} className="h-11 rounded-[10px] border border-mk-line bg-mk-surface text-center text-[14px] font-medium leading-[44px] text-mk-ink hover:bg-mk-track" style={{ fontFamily: MONO }} dir="ltr">{phone}</a>
              : <button onClick={() => setPhoneShown(true)} className="h-11 rounded-[10px] border border-mk-line bg-mk-surface text-[14px] font-medium text-mk-ink hover:bg-mk-track">إظهار رقم الهاتف</button>)}
          </div>
        </div>
      </div>

      {enquiry && <EnquiryModal listing={listing} slug={slug} onClose={() => setEnquiry(false)} />}
    </div>
  );
}

function EnquiryModal({ listing, slug, onClose }: { listing: MarketplaceListing; slug?: string; onClose: () => void }) {
  const auth = useSiteAuth();
  // Name + a starter message are prefilled from the signed-in user; the WhatsApp
  // number is the one thing they usually need to add (prefilled if on file).
  const [form, setForm] = React.useState(() => ({
    name: auth.user?.name ?? "",
    contact: auth.user?.phone ?? "",
    message: `مرحبًا، أنا مهتم بـ «${listing.title}». هل ما زال متاحًا؟`,
    company: "",
  }));
  const [state, setState] = React.useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    if (!form.name.trim() || !form.message.trim()) { setError("الرجاء إدخال الاسم والرسالة"); return; }
    if (!form.contact.trim()) { setError("الرجاء إدخال رقم واتساب للتواصل"); return; }
    setError(null); setState("sending");
    const body = `استفسار عن: ${listing.title}\n\n${form.message}`;
    if (!slug) { setTimeout(() => setState("sent"), 300); return; }
    try {
      const res = await fetch("/api/public/messages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, name: form.name, contact: form.contact, body, company: form.company }) });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) { setState("sent"); return; }
      setError(json && !json.ok ? json.error?.message ?? "تعذّر الإرسال" : "تعذّر الإرسال"); setState("idle");
    } catch { setError("تعذّر الاتصال، حاول مجددًا"); setState("idle"); }
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
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>الاسم</span>
              <input value={form.name} onChange={set("name")} placeholder="الاسم" maxLength={80} className="h-11 rounded-[10px] border border-mk-line bg-mk-surface px-3.5 text-[14.5px] text-mk-ink outline-none focus:border-mk-accent" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>رقم واتساب *</span>
              <input value={form.contact} onChange={set("contact")} placeholder="09xxxxxxxx" inputMode="tel" dir="ltr" maxLength={60} className="h-11 rounded-[10px] border border-mk-line bg-mk-surface px-3.5 text-[14.5px] text-mk-ink outline-none focus:border-mk-accent" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>الرسالة</span>
              <textarea value={form.message} onChange={set("message")} placeholder="رسالتك…" rows={3} maxLength={1000} className="resize-none rounded-[10px] border border-mk-line bg-mk-surface px-3.5 py-2.5 text-[14.5px] text-mk-ink outline-none focus:border-mk-accent" />
            </label>
            <input value={form.company} onChange={set("company")} name="company" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />
            {error && <span className="text-[12.5px] font-medium text-mk-danger">{error}</span>}
            <button type="submit" disabled={state === "sending"} className="mt-1 h-11 rounded-[10px] bg-mk-accent text-[14.5px] font-medium text-white transition hover:bg-mk-strong disabled:opacity-60">{state === "sending" ? "جارٍ الإرسال…" : "إرسال"}</button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ───────────────────── gallery / preview demo (no gate) ──────────────── */

function DemoBrowse({ shop, currency, editing, theme, onToggleTheme, logoUrl }: { shop: MarketplaceProps["shop"]; currency: string; editing: boolean; theme: MkTheme; onToggleTheme: () => void; logoUrl?: string | null }) {
  const items = DEMO_LISTINGS;
  const present = new Set(items.map((l) => l.vertical));
  const verticals = (["car", "home"] as Vertical[]).filter((v) => present.has(v));
  const [view, setView] = React.useState<MView>({ kind: "browse", vertical: verticals[0] ?? "car" });
  const [filters, setFilters] = React.useState<Record<Vertical, FilterValues>>({ car: {}, home: {} });
  const [sort, setSort] = React.useState<SortKey>("new");
  const vertical = view.vertical;
  const f = filters[vertical];
  const ranges = computeRanges(items, vertical);

  const setFilter = (k: string, v: string | number | null) => setFilters((s) => { const cur = { ...s[vertical] }; if (v === null || cur[k] === v) delete cur[k]; else cur[k] = v; if (k === "make") delete cur.model; return { ...s, [vertical]: cur }; });
  const toggleMulti = (k: string, item: string) => setFilters((s) => { const cur = { ...s[vertical] }; const list = Array.isArray(cur[k]) ? (cur[k] as string[]) : []; const nl = list.includes(item) ? list.filter((x) => x !== item) : [...list, item]; if (nl.length) cur[k] = nl; else delete cur[k]; return { ...s, [vertical]: cur }; });
  const results = sortResults(items.filter((l) => l.vertical === vertical && matchesFilters(l, vertical, f)), sort);
  const facets = computeFacets(items, vertical, f);
  const detail = view.kind === "detail" ? items.find((l) => l.id === view.id) ?? null : null;
  const sellerResults = view.kind === "sellerPage" ? items.filter((l) => l.authorId === view.id) : [];

  return (
    <>
      {editing && <div className="bg-mk-soft px-5 py-2 text-center text-[13px] text-mk-strong">هذه إعلانات تجريبية للعرض — الإعلانات الحقيقية يديرها البائعون بعد تسجيل الدخول.</div>}
      <Header shop={shop} vertical={vertical} verticals={verticals.length ? verticals : ["car", "home"]} onNav={setView} onAccount={() => {}} theme={theme} onToggleTheme={onToggleTheme} logoUrl={logoUrl} />
      {view.kind === "sellerPage" ? (
        <SellerListingsView results={sellerResults} currency={currency} fallbackName={shop.name} onOpen={(id, v) => setView({ kind: "detail", vertical: v, id })} onBack={() => setView({ kind: "browse", vertical })} />
      ) : detail ? (
        <DetailView listing={detail} currency={currency} shop={shop} onBack={() => setView({ kind: "browse", vertical })} onSellerOpen={(id) => setView({ kind: "sellerPage", vertical, id })} />
      ) : (
        <BrowseView
          vertical={vertical}
          results={results}
          filters={f}
          facets={facets}
          sort={sort}
          ranges={ranges}
          currency={currency}
          onSetFilter={setFilter}
          onToggleMulti={toggleMulti}
          onSort={setSort}
          onClear={() => setFilters((s) => ({ ...s, [vertical]: {} }))}
          onOpen={(id) => setView({ kind: "detail", vertical, id })}
          shop={shop}
        />
      )}
    </>
  );
}
