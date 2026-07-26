"use client";

// Templates gallery — adapted from the Sawwi design (TemplatesGallery.tsx): its
// logic (abortable requery keyed on query+tags, append-on-more, Intersection
// Observer infinite scroll, server-backed all-tags panel, skeleton/empty/error
// states, deterministic cover fallback) rebuilt with OUR Tailwind tokens +
// components and wired to the real endpoints through our API envelope.
//
// THE CONTRACT: every search / filter / page is a REQUEST. Nothing filters,
// sorts or slices on the client — this component owns query params and renders
// what the server returns (see src/server/templates). The design's sort control
// and "uses" badge are dropped: we have no usage data to back them yet.

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, Plus, RotateCw, Search, SquareArrowOutUpRight, X } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";

/* ── contract (mirrors src/server/templates/templates.service.ts) ── */
export interface TemplateCard {
  key: string;
  name: string;
  description: string;
  vertical: string;
  tags: string[];
  previewUrl: string;
  coverUrl?: string | null;
}
interface TagFacet { label: string; count: number }
interface TemplatesPage { items: TemplateCard[]; nextCursor: string | null; total: number }

/* ── endpoints (abortable; unwrap our {ok,data} envelope via apiFetch) ── */
function listTemplatesReq(
  params: { query: string; tags: string[]; cursor: string | null; limit: number; signal?: AbortSignal },
): Promise<TemplatesPage> {
  const p = new URLSearchParams();
  if (params.query) p.set("query", params.query);
  if (params.tags.length) p.set("tags", params.tags.join(","));
  if (params.cursor) p.set("cursor", params.cursor);
  p.set("limit", String(params.limit));
  return apiFetch<TemplatesPage>(`/api/templates?${p}`, { signal: params.signal });
}
function listTagsReq(params: { query?: string; limit?: number; signal?: AbortSignal }): Promise<TagFacet[]> {
  const p = new URLSearchParams();
  if (params.query) p.set("query", params.query);
  if (params.limit) p.set("limit", String(params.limit));
  return apiFetch<{ tags: TagFacet[] }>(`/api/templates/tags?${p}`, { signal: params.signal }).then((r) => r.tags);
}

const isAbort = (e: unknown) => e instanceof Error && e.name === "AbortError";

/* ── numerals ── */
const AR = "٠١٢٣٤٥٦٧٨٩";
const arNum = (n: number | string) => String(n).replace(/\d/g, (d) => AR[Number(d)]);

/* ── debounce ── */
function useDebounced<T>(value: T, ms: number) {
  const [out, setOut] = React.useState(value);
  React.useEffect(() => {
    const id = window.setTimeout(() => setOut(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return out;
}

/* ── results machine: owns paging; `key` change resets cursor + reloads ── */
interface ResultsState {
  items: TemplateCard[]; nextCursor: string | null; total: number;
  loading: boolean; loadingMore: boolean; error: boolean;
}
const initialResults: ResultsState = {
  items: [], nextCursor: null, total: 0, loading: true, loadingMore: false, error: false,
};

function useTemplateResults(
  key: string, params: { query: string; tags: string[] }, limit: number,
) {
  const [state, setState] = React.useState<ResultsState>(initialResults);
  const [nonce, setNonce] = React.useState(0);
  const inFlight = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    inFlight.current?.abort();
    const ac = new AbortController();
    inFlight.current = ac;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- enter loading before the fetch resolves
    setState((s) => ({ ...s, loading: true, error: false }));
    listTemplatesReq({ ...params, cursor: null, limit, signal: ac.signal })
      .then((page) => setState({
        items: page.items, nextCursor: page.nextCursor, total: page.total,
        loading: false, loadingMore: false, error: false,
      }))
      .catch((err) => {
        if (isAbort(err)) return;
        setState((s) => ({ ...s, loading: false, loadingMore: false, error: true }));
      });
    return () => ac.abort();
    // params derives from key; listing it would refire every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, limit, nonce]);

  const loadMore = React.useCallback(() => {
    setState((s) => {
      if (!s.nextCursor || s.loadingMore || s.loading) return s;
      listTemplatesReq({ ...params, cursor: s.nextCursor, limit })
        .then((page) => setState((prev) => ({
          ...prev,
          items: prev.items.concat(page.items), // append, never replace
          nextCursor: page.nextCursor, total: page.total, loadingMore: false, error: false,
        })))
        .catch((err) => {
          if (isAbort(err)) return;
          setState((prev) => ({ ...prev, loadingMore: false, error: true }));
        });
      return { ...s, loadingMore: true, error: false };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, limit]);

  return { ...state, loadMore, retry: () => setNonce((n) => n + 1) };
}

/* ── the one filter control ── */
function Chip({
  label, count, active, small, onClick, title, variant,
}: {
  label: React.ReactNode; count?: number; active?: boolean; small?: boolean;
  onClick?: () => void; title?: string; variant?: "ghost" | "danger";
}) {
  const tone =
    variant === "danger"
      ? "border-transparent text-danger hover:bg-danger/10"
      : variant === "ghost"
        ? "border-line text-muted hover:border-accent hover:text-ink"
        : active
          ? "border-transparent bg-accent font-medium text-white"
          : "border-line bg-surface text-muted hover:border-accent hover:text-ink";
  return (
    <button
      type="button"
      aria-pressed={active}
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border transition cursor-pointer",
        small ? "px-2.5 py-0.5 text-xs" : "px-3.5 py-1.5 text-[13px]",
        tone,
      )}
    >
      {label}
      {typeof count === "number" && <span className="font-mono text-[11px] opacity-60">{arNum(count)}</span>}
    </button>
  );
}

/* ── "+N" overflow pill: same height as the chips (so the row stays aligned),
 *    reveals the hidden tags in a small popover on hover. ── */
function MoreTags({
  tags, activeTags, onToggle,
}: {
  tags: string[]; activeTags: string[]; onToggle: (label: string) => void;
}) {
  return (
    <span className="group/more relative inline-flex items-center">
      <span className="inline-flex cursor-default items-center rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-medium text-muted">
        +{arNum(tags.length)}
      </span>
      {/* pb-1.5 bridges the visual gap so moving onto the popover keeps it open */}
      <span className="absolute bottom-full start-0 z-30 hidden pb-1.5 group-hover/more:block">
        <span className="flex max-w-60 flex-wrap gap-1 rounded-lg border border-line bg-surface p-2 shadow-lg">
          {tags.map((label) => (
            <Chip key={label} small active={activeTags.includes(label)} label={label}
              title="أضف هذا الوسم إلى الفلتر" onClick={() => onToggle(label)} />
          ))}
        </span>
      </span>
    </span>
  );
}

/* ── deterministic cover fallback (hue from key → stable across sessions) ── */
function Poster({ template }: { template: TemplateCard }) {
  const hue = React.useMemo(() => {
    let h = 0;
    for (let i = 0; i < template.key.length; i++) h = (h * 31 + template.key.charCodeAt(i)) % 360;
    return h;
  }, [template.key]);
  // If a declared cover 404s (e.g. the file isn't dropped in yet), fall back to
  // the generated poster instead of a broken-image icon.
  const [coverFailed, setCoverFailed] = React.useState(false);

  if (template.coverUrl && !coverFailed) {
    return (
      <span className="block overflow-hidden" style={{ aspectRatio: "16 / 10" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- storage/static URL */}
        <img
          src={template.coverUrl}
          alt={template.name}
          loading="lazy"
          onError={() => setCoverFailed(true)}
          className="size-full object-cover"
        />
      </span>
    );
  }
  const h2 = (hue + 40) % 360;
  return (
    <span
      className="relative flex flex-col justify-end gap-1.5 overflow-hidden p-4"
      style={{
        aspectRatio: "16 / 10",
        backgroundColor: `oklch(0.2 0.05 ${hue})`,
        backgroundImage: [
          // soft top-corner highlight → depth
          `radial-gradient(130% 90% at 12% -10%, oklch(0.42 0.1 ${hue} / 0.55), transparent 58%)`,
          // fine diagonal weave → texture
          `repeating-linear-gradient(-45deg, oklch(1 0 0 / 0.035) 0 1px, transparent 1px 8px)`,
          // base diagonal gradient
          `linear-gradient(150deg, oklch(0.31 0.085 ${hue}), oklch(0.15 0.045 ${h2}))`,
        ].join(", "),
      }}
    >
      {/* inner hairline frame */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/8" />
      <span className="relative font-mono text-[10.5px] uppercase tracking-wider" style={{ color: `oklch(0.87 0.07 ${hue})` }}>
        قالب سوّي
      </span>
      <span className="relative max-w-[18ch] font-display text-lg font-extrabold text-white text-balance">{template.name}</span>
    </span>
  );
}

function SkeletonCard({ short }: { short?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <span className="block animate-pulse bg-neutral-200" style={{ aspectRatio: "16 / 10" }} />
      <div className="flex flex-col gap-2.5 p-4">
        <span className="block h-3.75 w-[58%] animate-pulse rounded bg-neutral-200" />
        <span className="block h-2.75 w-[90%] animate-pulse rounded bg-neutral-200" />
        {!short && <span className="block h-2.75 w-[74%] animate-pulse rounded bg-neutral-200" />}
        <span className="mt-1.5 block h-9.5 animate-pulse rounded bg-neutral-200" />
      </div>
    </div>
  );
}

/* ── all-tags panel (server-backed search inside) ── */
function AllTagsPanel({
  selected, onToggle, onClear, onClose,
}: {
  selected: string[]; onToggle: (label: string) => void; onClear: () => void; onClose: () => void;
}) {
  const [raw, setRaw] = React.useState("");
  const query = useDebounced(raw, 300);
  const [tags, setTags] = React.useState<TagFacet[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const ac = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- enter loading before the fetch resolves
    setLoading(true);
    listTagsReq({ query, limit: 100, signal: ac.signal })
      .then((t) => { setTags(t); setLoading(false); })
      .catch((err) => { if (!isAbort(err)) setLoading(false); });
    return () => ac.abort();
  }, [query]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label="كل الوسوم"
    >
      <div
        className="flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-line bg-surface sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-line px-5 py-4">
          <span className="font-display text-[17px] font-extrabold text-ink">كل الوسوم</span>
          <span className="font-mono text-[11px] text-faint">{arNum(tags.length)} وسمًا</span>
          <button type="button" onClick={onClose} title="إغلاق"
            className="ms-auto rounded-md p-1.5 text-faint hover:text-ink cursor-pointer">
            <X className="size-4" />
          </button>
        </div>
        <div className="shrink-0 border-b border-line p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-faint" />
            <Input value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="ابحث في الوسوم…"
              aria-label="بحث في الوسوم" className="ps-9 pe-9" />
            {loading && <Loader2 className="absolute inset-y-0 end-3 my-auto size-4 animate-spin text-faint" />}
          </div>
        </div>
        <div className="flex flex-wrap content-start gap-2 overflow-y-auto p-5">
          {tags.map((t) => (
            <Chip key={t.label} label={t.label} count={t.count}
              active={selected.includes(t.label)} onClick={() => onToggle(t.label)} />
          ))}
          {!loading && tags.length === 0 && (
            <span className="px-1 py-7 text-[13.5px] text-faint">لا وسوم بهذا الاسم.</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2.5 border-t border-line px-5 py-3">
          {selected.length > 0 && (
            <button type="button" onClick={onClear} className="text-sm text-danger hover:underline cursor-pointer">
              مسح الفلاتر
            </button>
          )}
          <Button onClick={onClose} className="ms-auto min-w-32">
            {selected.length ? `تطبيق (${arNum(selected.length)})` : "تم"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── the gallery ─────────────────────────── */
export function TemplatesGallery({
  onUse, limit = 12, topTagCount = 10,
}: {
  onUse: (template: TemplateCard) => void; limit?: number; topTagCount?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize from the URL so a shared/refreshed link restores the same view.
  const [rawQuery, setRawQuery] = React.useState(() => searchParams.get("q") ?? "");
  const query = useDebounced(rawQuery, 320);
  const [tags, setTags] = React.useState<string[]>(() => {
    const t = searchParams.get("tags");
    return t ? t.split(",").map((s) => s.trim()).filter(Boolean) : [];
  });
  const [sheet, setSheet] = React.useState(false);
  const [topTags, setTopTags] = React.useState<TagFacet[]>([]);

  // Reflect the (debounced) search + tags in the URL — shareable, survives
  // refresh. `replace` (not push) so typing doesn't spam browser history.
  // The cursor is deliberately NOT in the URL: infinite-scroll pages accumulate
  // in memory and shouldn't be pinned to a link.
  React.useEffect(() => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (tags.length) p.set("tags", tags.join(","));
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [query, tags, pathname, router]);

  const params = React.useMemo(() => ({ query, tags }), [query, tags]);
  const key = React.useMemo(() => JSON.stringify([query, tags.slice().sort()]), [query, tags]);

  const { items, nextCursor, total, loading, loadingMore, error, loadMore, retry } =
    useTemplateResults(key, params, limit);

  React.useEffect(() => {
    const ac = new AbortController();
    listTagsReq({ limit: topTagCount, signal: ac.signal })
      .then(setTopTags)
      .catch(() => {/* row stays empty; filtering still works */});
    return () => ac.abort();
  }, [topTagCount]);

  const toggleTag = React.useCallback(
    (label: string) => setTags((t) => (t.includes(label) ? t.filter((x) => x !== label) : t.concat(label))),
    [],
  );
  const clearAll = React.useCallback(() => { setRawQuery(""); setTags([]); }, []);

  const observer = React.useRef<IntersectionObserver | null>(null);
  const sentinelRef = React.useCallback((el: HTMLDivElement | null) => {
    observer.current?.disconnect();
    if (!el || typeof IntersectionObserver === "undefined") return;
    observer.current = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore(); },
      { rootMargin: "200px" },
    );
    observer.current.observe(el);
  }, [loadMore]);
  React.useEffect(() => () => observer.current?.disconnect(), []);

  const searching = rawQuery !== query;
  const hasFilters = rawQuery.length > 0 || tags.length > 0;
  const atEnd = !nextCursor;
  const empty = !loading && !error && items.length === 0;

  return (
    <div>
      {/* header */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-accent">القوالب</span>
        <h1 className="font-display text-[27px] font-extrabold leading-tight text-ink">اختر قالبًا وابدأ</h1>
        <p className="max-w-[62ch] text-[13.5px] leading-relaxed text-muted">
          قوالب جاهزة بتصميم كامل — تختار واحدًا، تملأ معلومات عملك، وينشر الموقع. كل قالب قابل للمعاينة كموقع حقيقي قبل الاختيار.
        </p>
      </div>

      {/* filter zone (sticky) */}
      <div className="sticky top-0 z-20 -mx-4 mt-5 border-y border-line bg-bg/90 px-4 py-3 backdrop-blur sm:top-2 sm:mx-0 sm:rounded-xl sm:border sm:px-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-4 text-faint" />
            <Input
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              placeholder="ابحث عن قالب — مطعم، حلاقة، حجز مواعيد…"
              aria-label="بحث في القوالب"
              className="ps-10 pe-16"
            />
            <span className="absolute inset-y-0 end-2.5 my-auto flex h-fit items-center gap-1.5">
              {searching && <Loader2 className="size-4 animate-spin text-faint" />}
              {rawQuery && (
                <button type="button" onClick={() => setRawQuery("")} title="مسح البحث"
                  className="grid size-6 place-items-center rounded-full bg-neutral-200 text-muted hover:text-ink cursor-pointer">
                  <X className="size-3.5" />
                </button>
              )}
            </span>
          </div>

          {/* ranked tags — horizontal scroll on small screens */}
          <div className="sw-no-scrollbar flex items-center gap-2 overflow-x-auto">
            {topTags.map((t) => (
              <Chip key={t.label} label={t.label} count={t.count}
                active={tags.includes(t.label)} onClick={() => toggleTag(t.label)} />
            ))}
            <Chip variant="ghost" onClick={() => setSheet(true)}
              label={<><Plus className="size-3.5" /> عرض كل الوسوم</>} />
            {hasFilters && (
              <Chip variant="danger" onClick={clearAll}
                label={<><X className="size-3.5" /> مسح الفلاتر</>} />
            )}
          </div>
        </div>
      </div>

      {/* results bar */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-[13.5px] text-muted" aria-live="polite">
          {loading ? "جارٍ التحميل…" : error ? "تعذّر التحميل"
            : hasFilters ? `${arNum(total)} قالبًا يطابق بحثك` : `${arNum(total)} قالبًا متاحًا`}
        </span>
        {tags.length > 0 && (
          <span className="flex flex-wrap items-center gap-2">
            <span className="h-4 w-px bg-line" />
            {tags.map((label) => (
              <Chip key={label} small active title="إزالة الوسم" onClick={() => toggleTag(label)}
                label={<>{label} <X className="size-3 opacity-80" /></>} />
            ))}
          </span>
        )}
      </div>

      {/* grid / states */}
      <div className="mt-4 pb-16">
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((t) => {
              const shown = t.tags.slice(0, 3);
              const rest = t.tags.length - shown.length;
              return (
                <article key={t.key} className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition hover:shadow-md">
                  <Poster template={t} />
                  <div className="flex flex-1 flex-col gap-2.5 p-4">
                    <span className="font-display text-[16.5px] font-bold text-ink">{t.name}</span>
                    <span className="line-clamp-2 text-[13px] leading-relaxed text-muted">{t.description}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {shown.map((label) => (
                        <Chip key={label} small active={tags.includes(label)} label={label}
                          title="أضف هذا الوسم إلى الفلتر" onClick={() => toggleTag(label)} />
                      ))}
                      {rest > 0 && <MoreTags tags={t.tags.slice(3)} activeTags={tags} onToggle={toggleTag} />}
                    </span>
                    <div className="mt-auto flex gap-2 pt-1">
                      <Button className="flex-1" onClick={() => onUse(t)}>استخدام القالب</Button>
                      <a href={t.previewUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-sm font-medium text-ink transition hover:bg-bg">
                        <SquareArrowOutUpRight className="size-4" /> معاينة
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {loadingMore && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} short />)}
          </div>
        )}

        {empty && (
          <div className="flex flex-col items-center gap-3.5 px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-neutral-100 text-faint">
              <Search className="size-6" />
            </span>
            <span className="font-display text-lg font-bold text-ink">لا قوالب تطابق بحثك</span>
            <span className="max-w-[42ch] text-[13.5px] leading-relaxed text-muted">
              جرّب كلمة أعمّ، أو امسح الفلاتر لعرض كل القوالب.
            </span>
            <Button variant="secondary" onClick={clearAll}>مسح الفلاتر</Button>
          </div>
        )}

        {error && (
          <div role="alert" className="flex flex-col items-center gap-3.5 px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-danger/10 text-danger">
              <AlertCircle className="size-6" />
            </span>
            <span className="font-display text-lg font-bold text-ink">تعذّر تحميل القوالب</span>
            <span className="max-w-[42ch] text-[13.5px] leading-relaxed text-muted">
              انقطع الاتصال بالخادم. لن تفقد بحثك — أعد المحاولة.
            </span>
            <Button onClick={retry}><RotateCw className="size-4" /> إعادة المحاولة</Button>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="flex flex-col items-center gap-3.5 pt-7">
            {!atEnd && (
              <Button variant="secondary" className="min-w-42" loading={loadingMore} onClick={loadMore}>
                {loadingMore ? "جارٍ التحميل…" : "تحميل المزيد"}
              </Button>
            )}
            {!atEnd && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}
            {atEnd && (
              <span className="flex w-full max-w-md items-center gap-3 text-faint">
                <span className="h-px flex-1 bg-line" />
                <span className="font-mono text-[11px] uppercase tracking-wider">
                  وصلت إلى نهاية القائمة · {arNum(items.length)} قالبًا
                </span>
                <span className="h-px flex-1 bg-line" />
              </span>
            )}
          </div>
        )}
      </div>

      {sheet && (
        <AllTagsPanel selected={tags} onToggle={toggleTag} onClear={clearAll} onClose={() => setSheet(false)} />
      )}
    </div>
  );
}
