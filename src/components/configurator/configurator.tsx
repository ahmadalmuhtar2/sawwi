"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  ArrowRight, Plus, ChevronUp, ChevronDown, Trash2,
  Monitor, Smartphone, Rocket, GripVertical, Settings, History, Search, Eye,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Image as ImageIcon, Upload, Type, MousePointerClick, PanelTop, PanelBottom, ListOrdered,
  Check, Pipette, Palette,
} from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { RenderSection, fieldEffectiveValues, SECTION_ANCHORS } from "@/sections/library";
import { isSectionLink, type SectionLink, type LinkKind } from "@/sections/types";
import { themeStyle, PALETTES, FONTS, CUSTOM_PALETTE, DEFAULT_PALETTE, DEFAULT_FONT } from "@/sections/palette";
import { SECTION_LABELS } from "@/sections/meta";
import { toArabicDigits } from "@/sections/hours";
import { designsFor, designsForSection, defaultDesignKey, fieldsFor, type DesignField, type GroupSubField } from "@/sections/designs";
import { HEADER_VARIANTS, HEADER_SCHEMES } from "@/sections/headers/header-universal";
import { FOOTER_VARIANTS, FOOTER_SCHEMES } from "@/sections/footers/footer-universal";
import { PAGE_TYPE_SECTIONS } from "@/server/sections/sections.rules";
import type { SiteRenderData } from "@/sections/types";
import type { ColorScheme, PageType } from "@/shared/domain";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/field";
import { PageSeoModal } from "@/components/configurator/page-seo-modal";
import { PageCreateModal, type NewPage } from "@/components/configurator/page-create-modal";
import { PreviewFrame } from "@/components/configurator/preview-frame";
import type { PageSeo } from "@/shared/seo";
import { cn } from "@/lib/cn";

interface PageLite { id: string; title: string; path: string; pageType: PageType; seo: PageSeo }
interface SectionLite {
  id: string; sectionType: string; variant: string;
  colorScheme: string; content: Record<string, unknown>; order: number;
}

// Editable fields are shown in collapsible groups so a long list stays scannable.
const FIELD_GROUPS = [
  { key: "content", label: "المحتوى", icon: Type },
  { key: "list", label: "القائمة", icon: ListOrdered },
  { key: "buttons", label: "الأزرار", icon: MousePointerClick },
  { key: "media", label: "الوسائط", icon: ImageIcon },
] as const;

function fieldGroup(f: DesignField): (typeof FIELD_GROUPS)[number]["key"] {
  // An explicit override wins (e.g. the reviews list gets its own section).
  if (f.inspectorGroup) return f.inspectorGroup;
  if (f.type === "image") return "media";
  // A repeatable list that carries images (e.g. the gallery photos) belongs in
  // the media group, so images have their own section instead of hiding in text.
  if (f.type === "group" && f.fields?.some((sf) => sf.type === "image")) return "media";
  if (f.type === "link" || f.key.endsWith("Cta")) return "buttons";
  return "content";
}

export function Configurator({
  site,
  pages,
  siteData,
  theme,
}: {
  site: { id: string; businessName: string; slug: string; status: string; verticalKey: string };
  pages: PageLite[];
  siteData: SiteRenderData;
  theme: {
    paletteKey: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    fontKey: string | null;
    headerVariant: string | null;
    headerScheme: string | null;
    footerVariant: string | null;
    footerScheme: string | null;
  };
}) {
  const toast = useToast();
  const [pageList, setPageList] = useState(pages);
  const [activePage, setActivePage] = useState(pages[0]?.id ?? "");
  const [sections, setSections] = useState<SectionLite[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  // Header & footer are pinned, site-wide elements (not page sections): selectable
  // & editable in the builder, but never deletable and not in the sections list.
  const [pinned, setPinned] = useState<"header" | "footer" | "appearance" | null>(null);
  // Header design/scheme live in the site theme; keep it in state so edits show
  // in the preview immediately.
  const [themeState, setThemeState] = useState(theme);
  const [dragId, setDragId] = useState<string | null>(null);
  // Always-current sections, so drag-drop persistence reads the latest order.
  const sectionsRef = useRef(sections);
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);
  // Guards mutations against double-clicks (ignore a 2nd call while one is in flight).
  const busyRef = useRef<Set<string>>(new Set());

  // Collapsible side panels (persisted).
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate persisted UI prefs on mount */
    setLeftOpen(localStorage.getItem("sawwi_builder_left") !== "closed");
    setRightOpen(localStorage.getItem("sawwi_builder_right") !== "closed");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  const toggleLeft = () =>
    setLeftOpen((o) => {
      const n = !o;
      localStorage.setItem("sawwi_builder_left", n ? "open" : "closed");
      return n;
    });
  const toggleRight = () =>
    setRightOpen((o) => {
      const n = !o;
      localStorage.setItem("sawwi_builder_right", n ? "open" : "closed");
      return n;
    });
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [addOpen, setAddOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [seoPageId, setSeoPageId] = useState<string | null>(null);
  const [addPageOpen, setAddPageOpen] = useState(false);

  const page = pageList.find((p) => p.id === activePage);
  const seoPage = pageList.find((p) => p.id === seoPageId);
  const selectedSection = sections.find((s) => s.id === selected) ?? null;

  const loadSections = useCallback(async (pageId: string) => {
    const d = await api.get<{ items: SectionLite[] }>(
      `/api/sites/${site.id}/pages/${pageId}/sections`,
    );
    setSections(d.items);
  }, [site.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch sets state after await
    if (activePage) loadSections(activePage);
  }, [activePage, loadSections]);

  async function patchSection(id: string, patch: Partial<SectionLite>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    try {
      await api.put(`/api/sites/${site.id}/pages/${activePage}/sections/${id}`, patch);
    } catch {
      toast("تعذّر حفظ التعديل", "error");
    }
  }

  async function addSection(type: string) {
    setAddOpen(false);
    try {
      // Default to the first design OFFERED for this section on this vertical
      // (e.g. a barbershop Hero starts as "barber-cinematic", not the old "A").
      const variant = designsFor(type, site.verticalKey)[0]?.key ?? "A";
      await api.post(`/api/sites/${site.id}/pages/${activePage}/sections`, {
        sectionType: type,
        variant,
      });
      await loadSections(activePage);
      toast("تمت إضافة القسم");
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّرت الإضافة", "error");
    }
  }

  // Select a pinned element (header/footer/appearance) or a section — mutually exclusive.
  function selectPinned(which: "header" | "footer" | "appearance") {
    setPinned(which);
    setSelected(null);
  }
  function selectSection(id: string) {
    setSelected(id);
    setPinned(null);
  }

  // Persist a header/footer change (design/scheme) to the site theme + update the
  // live preview. Sends the full theme so nothing else is reset.
  async function saveTheme(patch: Partial<typeof themeState>) {
    const next = { ...themeState, ...patch };
    setThemeState(next);
    try {
      await api.put(`/api/sites/${site.id}/theme`, {
        paletteKey: next.paletteKey,
        primaryColor: next.primaryColor,
        secondaryColor: next.secondaryColor,
        fontKey: next.fontKey,
        headerVariant: next.headerVariant,
        headerScheme: next.headerScheme,
        footerVariant: next.footerVariant,
        footerScheme: next.footerScheme,
      });
    } catch {
      toast("تعذّر حفظ التعديل", "error");
    }
  }

  async function removeSection(id: string) {
    // Ignore a repeat click while the first delete is still running.
    if (busyRef.current.has(id)) return;
    busyRef.current.add(id);
    // Optimistic: drop the row now so there's no button left to click again.
    const prev = sectionsRef.current;
    setSections((list) => list.filter((s) => s.id !== id));
    if (selected === id) setSelected(null);
    try {
      await api.del(`/api/sites/${site.id}/pages/${activePage}/sections/${id}`);
      toast("تم حذف القسم");
    } catch (e) {
      // Already gone (e.g. a duplicate request won the race) — the goal state is
      // reached, so treat it as success rather than surfacing an error.
      if (e instanceof ApiClientError && e.code === "NOT_FOUND") return;
      setSections(prev); // real failure: restore the row
      toast(e instanceof ApiClientError ? e.message : "تعذّر حذف القسم", "error");
    } finally {
      busyRef.current.delete(id);
    }
  }

  // Upload an image for a section field → returns the stored URL. The caller
  // writes it into content[key] (auto-saved like any other content edit).
  async function uploadSectionImage(sectionId: string, key: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("key", key);
    const { url } = await api.post<{ url: string }>(
      `/api/sites/${site.id}/pages/${activePage}/sections/${sectionId}/image`,
      fd,
    );
    return url;
  }

  async function persistOrder(orderedIds: string[]) {
    try {
      await api.put(`/api/sites/${site.id}/pages/${activePage}/sections/reorder`, {
        orderedIds,
      });
    } catch {
      toast("تعذّر حفظ الترتيب", "error");
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = sections.findIndex((s) => s.id === id);
    const to = idx + dir;
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    [next[idx], next[to]] = [next[to], next[idx]];
    setSections(next);
    await persistOrder(next.map((s) => s.id));
  }

  // Drag-and-drop reordering: live-reorder while dragging, persist on drop.
  function onDragEnter(targetId: string) {
    if (!dragId || dragId === targetId) return;
    setSections((prev) => {
      const from = prev.findIndex((s) => s.id === dragId);
      const to = prev.findIndex((s) => s.id === targetId);
      if (from === -1 || to === -1 || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function onDragEnd() {
    const dropped = dragId;
    setDragId(null);
    if (dropped) void persistOrder(sectionsRef.current.map((s) => s.id));
  }

  function onPageCreated(p: NewPage) {
    setPageList((prev) => [...prev, { id: p.id, title: p.title, path: p.path, pageType: p.pageType, seo: p.seo }]);
    setActivePage(p.id);
    setSelected(null);
    toast("تمت إضافة الصفحة");
  }

  async function removePage(id: string) {
    const target = pageList.find((p) => p.id === id);
    if (!target) return;
    if (!confirm(`حذف صفحة «${target.title}» وكل أقسامها؟`)) return;
    try {
      await api.del(`/api/sites/${site.id}/pages/${id}`);
      const remaining = pageList.filter((p) => p.id !== id);
      setPageList(remaining);
      if (activePage === id) setActivePage(remaining[0]?.id ?? "");
      toast("تم حذف الصفحة");
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر الحذف", "error");
    }
  }

  async function movePage(id: string, dir: -1 | 1) {
    const idx = pageList.findIndex((p) => p.id === id);
    const to = idx + dir;
    if (to < 0 || to >= pageList.length) return;
    const next = [...pageList];
    [next[idx], next[to]] = [next[to], next[idx]];
    setPageList(next);
    try {
      await api.put(`/api/sites/${site.id}/pages/reorder`, { orderedIds: next.map((p) => p.id) });
    } catch {
      setPageList(pageList);
      toast("تعذّر إعادة الترتيب", "error");
    }
  }

  async function publish() {
    setPublishing(true);
    try {
      const r = await api.post<{ version: number }>(`/api/sites/${site.id}/publish`);
      toast(`تم النشر (الإصدار ${r.version}) ✓`);
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر النشر", "error");
    }
    setPublishing(false);
  }

  const allowed = page ? PAGE_TYPE_SECTIONS[page.pageType] : [];

  // In-page scroll targets for CTA links: sections on the current page that have
  // an anchor (deduped by anchor slug). Used by the inspector's link picker.
  const sectionTargets: { slug: string; label: string }[] = [];
  const seenSlugs = new Set<string>();
  for (const s of sections) {
    const slug = SECTION_ANCHORS[s.sectionType];
    if (slug && !seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      sectionTargets.push({ slug, label: SECTION_LABELS[s.sectionType] ?? s.sectionType });
    }
  }

  // The header's nav mirrors the site's pages (the public renderer does the same);
  // without this the header would fall back to placeholder nav in the preview.
  const previewSite: SiteRenderData = {
    ...siteData,
    nav: pageList.filter((p) => p.title).map((p) => ({ path: p.path, title: p.title })),
    activePath: page?.path,
  };

  // Shared preview content (header + sections + footer), rendered directly for
  // desktop and inside an iframe for the phone view. Inside the builder every
  // link/button is made inert (pointer-events-none) so a click SELECTS the
  // section for editing instead of navigating or firing the button's action.
  const previewBody = (
    <div className="[&_a]:pointer-events-none [&_button]:pointer-events-none [&_summary]:pointer-events-none">
      <div
        onClick={() => selectPinned("header")}
        className={cn("relative cursor-pointer", pinned === "header" && "ring-2 ring-inset ring-accent")}
      >
        <RenderSection
          type="Header"
          variant={themeState.headerVariant ?? "A"}
          scheme="primary"
          content={{ headerScheme: themeState.headerScheme ?? "light" }}
          site={previewSite}
        />
      </div>
      {sections.map((s) => (
        <div
          key={s.id}
          onClick={() => selectSection(s.id)}
          className={cn("relative cursor-pointer", selected === s.id && "ring-2 ring-inset ring-accent")}
        >
          <RenderSection
            type={s.sectionType}
            variant={s.variant}
            scheme={s.colorScheme as ColorScheme}
            content={s.content}
            site={siteData}
          />
        </div>
      ))}
      <div
        onClick={() => selectPinned("footer")}
        className={cn("relative cursor-pointer", pinned === "footer" && "ring-2 ring-inset ring-accent")}
      >
        <RenderSection
          type="Footer"
          variant={themeState.footerVariant ?? "A"}
          scheme="primary"
          content={{ footerScheme: themeState.footerScheme ?? "dark" }}
          site={previewSite}
        />
      </div>
    </div>
  );

  return (
    <div className="-m-6 flex h-[calc(100dvh-4rem)] flex-col">
      {/* Builder topbar */}
      <div className="flex h-14 items-center justify-between border-b border-line bg-surface px-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/sites" className="text-muted hover:text-ink">
            <ArrowRight className="size-5" />
          </Link>
          <div>
            <p className="text-sm font-bold text-ink">{site.businessName}</p>
            <p className="font-label text-[10px] text-faint">{site.slug}.SAWWI.COM</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/preview/${site.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-muted transition hover:text-ink"
          >
            <Eye className="size-4" /> معاينة
          </Link>
          <Link
            href={`/dashboard/sites/${site.id}/history`}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-muted transition hover:text-ink"
          >
            <History className="size-4" /> السجل
          </Link>
          <Link
            href={`/dashboard/sites/${site.id}/settings`}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-muted transition hover:text-ink"
          >
            <Settings className="size-4" /> الإعدادات
          </Link>
          <SegmentedControl
            size="sm"
            value={device}
            onChange={(v) => setDevice(v)}
            options={[
              { value: "desktop", label: <Monitor className="size-4" /> },
              { value: "mobile", label: <Smartphone className="size-4" /> },
            ]}
          />
          <Button onClick={publish} loading={publishing} className="gap-2">
            <Rocket className="size-4" /> نشر
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Left: pages + sections */}
        {!leftOpen && (
          <div className="flex w-10 shrink-0 flex-col items-center border-e border-line bg-surface py-2">
            <button onClick={toggleLeft} title="توسيع اللوحة" className="rounded-md p-1.5 text-faint transition hover:bg-black/[0.04] hover:text-ink cursor-pointer">
              <PanelLeftOpen className="size-[18px]" />
            </button>
          </div>
        )}
        <aside className={cn("flex w-64 shrink-0 flex-col border-e border-line bg-surface", !leftOpen && "hidden")}>
          <div className="flex h-9 items-center justify-end border-b border-line px-2">
            <button onClick={toggleLeft} title="طيّ اللوحة" className="rounded p-1 text-faint transition hover:text-ink cursor-pointer">
              <PanelLeftClose className="size-4" />
            </button>
          </div>
          {/* Pinned header & footer (site-wide, always present, not deletable). */}
          <div className="space-y-1 border-b border-line p-3">
            <button
              onClick={() => selectPinned("header")}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition cursor-pointer",
                pinned === "header" ? "bg-accent-100 font-medium text-accent-900" : "text-muted hover:bg-black/[0.03]",
              )}
            >
              <PanelTop className="size-4" /> الترويسة (الهيدر)
            </button>
            <button
              onClick={() => selectPinned("footer")}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition cursor-pointer",
                pinned === "footer" ? "bg-accent-100 font-medium text-accent-900" : "text-muted hover:bg-black/[0.03]",
              )}
            >
              <PanelBottom className="size-4" /> التذييل (الفوتر)
            </button>
            <button
              onClick={() => selectPinned("appearance")}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition cursor-pointer",
                pinned === "appearance" ? "bg-accent-100 font-medium text-accent-900" : "text-muted hover:bg-black/[0.03]",
              )}
            >
              <Palette className="size-4" /> المظهر (الألوان والخط)
            </button>
          </div>
          <div className="border-b border-line p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs font-medium text-faint">الصفحات</p>
              <button
                onClick={() => setAddPageOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline cursor-pointer"
              >
                <Plus className="size-3.5" /> صفحة
              </button>
            </div>
            {pageList.map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  "group flex items-center rounded-md text-sm transition",
                  p.id === activePage ? "bg-accent-100 font-medium text-accent-900" : "text-muted hover:bg-black/[0.03]",
                )}
              >
                <button
                  onClick={() => { setActivePage(p.id); setSelected(null); }}
                  className="flex-1 truncate px-3 py-2 text-start cursor-pointer"
                >
                  {p.title}
                  {p.path === "/" && <span className="ms-1.5 font-label text-[10px] text-faint">رئيسية</span>}
                </button>
                <div className="flex items-center opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => movePage(p.id, -1)}
                    disabled={i === 0}
                    title="أعلى"
                    className="px-1 py-2 text-faint hover:text-ink disabled:opacity-25 cursor-pointer"
                  >
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button
                    onClick={() => movePage(p.id, 1)}
                    disabled={i === pageList.length - 1}
                    title="أسفل"
                    className="px-1 py-2 text-faint hover:text-ink disabled:opacity-25 cursor-pointer"
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setSeoPageId(p.id)}
                    title="إعدادات الصفحة وSEO"
                    className="px-1 py-2 text-faint hover:text-ink cursor-pointer"
                  >
                    <Search className="size-3.5" />
                  </button>
                  {p.path !== "/" && (
                    <button
                      onClick={() => removePage(p.id)}
                      title="حذف الصفحة"
                      className="px-1 py-2 text-faint hover:text-danger cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-3 pt-3">
            <p className="text-xs font-medium text-faint">الأقسام</p>
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline cursor-pointer"
            >
              <Plus className="size-3.5" /> إضافة
            </button>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-3">
            {sections.map((s, i) => (
              <div
                key={s.id}
                draggable
                onDragStart={(e) => { setDragId(s.id); e.dataTransfer.effectAllowed = "move"; }}
                onDragEnter={() => onDragEnter(s.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); onDragEnd(); }}
                onDragEnd={onDragEnd}
                onClick={() => selectSection(s.id)}
                className={cn(
                  "group flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm cursor-pointer transition",
                  selected === s.id ? "border-accent bg-accent-50" : "border-line hover:border-accent-200",
                  dragId === s.id && "opacity-50 ring-2 ring-accent",
                )}
              >
                <GripVertical className="size-4 shrink-0 text-faint cursor-grab active:cursor-grabbing" />
                <span className="flex-1 truncate">{SECTION_LABELS[s.sectionType] ?? s.sectionType}</span>
                <div className="flex items-center opacity-0 transition group-hover:opacity-100">
                  <button onClick={(e) => { e.stopPropagation(); move(s.id, -1); }} disabled={i === 0} className="p-0.5 text-faint hover:text-ink disabled:opacity-30"><ChevronUp className="size-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); move(s.id, 1); }} disabled={i === sections.length - 1} className="p-0.5 text-faint hover:text-ink disabled:opacity-30"><ChevronDown className="size-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); removeSection(s.id); }} title="حذف القسم" className="p-0.5 text-faint hover:text-danger cursor-pointer"><Trash2 className="size-3.5" /></button>
                </div>
              </div>
            ))}
            {sections.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-faint">لا أقسام — أضف قسمًا للبدء.</p>
            )}
          </div>
        </aside>

        {/* Center: live preview */}
        <div className="min-w-0 flex-1 overflow-y-auto bg-[oklch(0.94_0.004_95)] p-6">
          {device === "mobile" ? (
            // Phone view: render inside an iframe so responsive breakpoints key
            // off the 390px device width, not the desktop window.
            <div className="mx-auto w-[390px] overflow-hidden rounded-lg border border-line bg-surface shadow-md">
              <PreviewFrame width={390} style={themeStyle(themeState.paletteKey, themeState.fontKey, { primaryColor: themeState.primaryColor, secondaryColor: themeState.secondaryColor })}>
                {previewBody}
              </PreviewFrame>
            </div>
          ) : (
            <div
              style={themeStyle(themeState.paletteKey, themeState.fontKey, { primaryColor: themeState.primaryColor, secondaryColor: themeState.secondaryColor })}
              className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-line bg-surface shadow-md"
            >
              {previewBody}
            </div>
          )}
        </div>

        {/* Right: inspector */}
        {!rightOpen && (
          <div className="flex w-10 shrink-0 flex-col items-center border-s border-line bg-surface py-2">
            <button onClick={toggleRight} title="توسيع اللوحة" className="rounded-md p-1.5 text-faint transition hover:bg-black/[0.04] hover:text-ink cursor-pointer">
              <PanelRightOpen className="size-[18px]" />
            </button>
          </div>
        )}
        <aside className={cn("flex w-72 shrink-0 flex-col border-s border-line bg-surface", !rightOpen && "hidden")}>
          <div className="flex h-9 items-center border-b border-line px-2">
            <button onClick={toggleRight} title="طيّ اللوحة" className="rounded p-1 text-faint transition hover:text-ink cursor-pointer">
              <PanelRightClose className="size-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {pinned === "header" ? (
              <HeaderInspector theme={themeState} onChange={saveTheme} />
            ) : pinned === "footer" ? (
              <FooterInspector theme={themeState} onChange={saveTheme} />
            ) : pinned === "appearance" ? (
              <AppearanceInspector theme={themeState} onChange={saveTheme} />
            ) : selectedSection ? (
              <SectionInspector
                key={selectedSection.id}
                section={selectedSection}
                verticalKey={site.verticalKey}
                siteData={siteData}
                pages={pageList}
                sectionTargets={sectionTargets}
                onPatch={(patch) => patchSection(selectedSection.id, patch)}
                onUploadImage={(key, file) => uploadSectionImage(selectedSection.id, key, file)}
                onRemove={() => removeSection(selectedSection.id)}
              />
            ) : (
              <p className="mt-8 text-center text-sm text-faint">اختر قسمًا لتحريره.</p>
            )}
          </div>
        </aside>
      </div>

      {/* Add-section gallery */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="إضافة قسم" size="md">
        <div className="grid grid-cols-2 gap-3">
          {allowed.map((type) => (
            <button
              key={type}
              onClick={() => addSection(type)}
              className="rounded-md border border-line p-4 text-start transition hover:border-accent hover:bg-accent-50 cursor-pointer"
            >
              <p className="font-medium text-ink">{SECTION_LABELS[type] ?? type}</p>
            </button>
          ))}
        </div>
      </Modal>

      {addPageOpen && (
        <PageCreateModal
          siteId={site.id}
          onClose={() => setAddPageOpen(false)}
          onCreated={onPageCreated}
        />
      )}

      {seoPage && (
        <PageSeoModal
          key={seoPage.id}
          siteId={site.id}
          page={{ id: seoPage.id, title: seoPage.title, seo: seoPage.seo }}
          onClose={() => setSeoPageId(null)}
          onSaved={({ title, seo }) =>
            setPageList((prev) =>
              prev.map((p) => (p.id === seoPage.id ? { ...p, title, seo } : p)),
            )
          }
        />
      )}
    </div>
  );
}

/** Header editor: design + color scheme. Site-wide, always present, no delete. */
function HeaderInspector({
  theme,
  onChange,
}: {
  theme: { headerVariant: string | null; headerScheme: string | null };
  onChange: (patch: { headerVariant?: string; headerScheme?: string }) => void;
}) {
  const variant = theme.headerVariant ?? "A";
  const scheme = theme.headerScheme ?? "light";
  const pickCls = (active: boolean) =>
    cn(
      "rounded-md border px-2 py-2 text-xs font-medium transition cursor-pointer",
      active
        ? "border-accent bg-accent-50 text-accent-900"
        : "border-line text-muted hover:border-accent hover:text-ink",
    );
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-faint">العنصر</p>
        <p className="font-bold text-ink">الترويسة (الهيدر)</p>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-faint">التصميم</p>
        <div className="grid grid-cols-3 gap-2">
          {HEADER_VARIANTS.map((v) => (
            <button key={v.key} onClick={() => onChange({ headerVariant: v.key })} className={pickCls(variant === v.key)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-faint">الألوان</p>
        <div className="grid grid-cols-3 gap-2">
          {HEADER_SCHEMES.map((s) => (
            <button key={s.key} onClick={() => onChange({ headerScheme: s.key })} className={pickCls(scheme === s.key)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <p className="rounded-md bg-bg p-3 text-xs leading-relaxed text-muted">
        يظهر الشعار والاسم والقائمة تلقائيًا من إعداداتك وصفحاتك. الترويسة ثابتة في
        كل الصفحات ولا يمكن حذفها.
      </p>
    </div>
  );
}

/** Footer editor: design + color scheme. Site-wide, always present, no delete. */
function FooterInspector({
  theme,
  onChange,
}: {
  theme: { footerVariant: string | null; footerScheme: string | null };
  onChange: (patch: { footerVariant?: string; footerScheme?: string }) => void;
}) {
  const variant = theme.footerVariant ?? "A";
  const scheme = theme.footerScheme ?? "dark";
  const pickCls = (active: boolean) =>
    cn(
      "rounded-md border px-2 py-2 text-xs font-medium transition cursor-pointer",
      active
        ? "border-accent bg-accent-50 text-accent-900"
        : "border-line text-muted hover:border-accent hover:text-ink",
    );
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-faint">العنصر</p>
        <p className="font-bold text-ink">التذييل (الفوتر)</p>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-faint">التصميم</p>
        <div className="grid grid-cols-3 gap-2">
          {FOOTER_VARIANTS.map((v) => (
            <button key={v.key} onClick={() => onChange({ footerVariant: v.key })} className={pickCls(variant === v.key)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-faint">الألوان</p>
        <div className="grid grid-cols-3 gap-2">
          {FOOTER_SCHEMES.map((s) => (
            <button key={s.key} onClick={() => onChange({ footerScheme: s.key })} className={pickCls(scheme === s.key)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <p className="rounded-md bg-bg p-3 text-xs leading-relaxed text-muted">
        تظهر بيانات التذييل (الاسم، العنوان، الهاتف، أوقات العمل، الروابط) تلقائيًا
        من إعداداتك. التذييل ثابت في كل الصفحات ولا يمكن حذفه.
      </p>
    </div>
  );
}

/** Appearance editor: site color (palette or custom primary+secondary) + font.
 *  Lives in the builder so changes reflect in the live preview immediately. */
function AppearanceInspector({
  theme,
  onChange,
}: {
  theme: {
    paletteKey: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    fontKey: string | null;
  };
  onChange: (patch: {
    paletteKey?: string;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    fontKey?: string;
  }) => void;
}) {
  const paletteKey = theme.paletteKey ?? DEFAULT_PALETTE;
  const fontKey = theme.fontKey ?? DEFAULT_FONT;
  const isCustom = paletteKey === CUSTOM_PALETTE;
  const primaryColor = theme.primaryColor || "#3f7350";
  const secondaryColor = theme.secondaryColor || "#b07b3c";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-faint">العنصر</p>
        <p className="font-bold text-ink">المظهر (الألوان والخط)</p>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-faint">لون الموقع</p>
        <div className="flex flex-wrap gap-2.5">
          {PALETTES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => onChange({ paletteKey: p.key, primaryColor: null, secondaryColor: null })}
              title={p.label}
              aria-label={p.label}
              className={cn(
                "flex size-9 items-center justify-center rounded-full transition cursor-pointer",
                paletteKey === p.key ? "ring-2 ring-ink ring-offset-2" : "hover:scale-110",
              )}
              style={{ backgroundColor: p.swatch }}
            >
              {paletteKey === p.key && <Check className="size-4 text-white" />}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange({ paletteKey: CUSTOM_PALETTE, primaryColor, secondaryColor })}
            title="ألوان مخصّصة"
            aria-label="ألوان مخصّصة"
            className={cn(
              "flex size-9 items-center justify-center rounded-full text-white transition cursor-pointer",
              isCustom ? "ring-2 ring-ink ring-offset-2" : "hover:scale-110",
            )}
            style={{ background: "conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444)" }}
          >
            {isCustom ? <Check className="size-4" /> : <Pipette className="size-3.5" />}
          </button>
        </div>
      </div>

      {isCustom && (
        <div className="space-y-3 rounded-md border border-line bg-bg p-3">
          <ThemeColorField label="اللون الأساسي" value={primaryColor} onChange={(v) => onChange({ primaryColor: v })} />
          <ThemeColorField label="اللون الثانوي" value={secondaryColor} onChange={(v) => onChange({ secondaryColor: v })} />
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs font-medium text-faint">الخط</p>
        <select
          value={fontKey}
          onChange={(e) => onChange({ fontKey: e.target.value })}
          className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent cursor-pointer"
        >
          {FONTS.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
      </div>

      <p className="rounded-md bg-bg p-3 text-xs leading-relaxed text-muted">
        اللون والخط يُطبَّقان على كامل الموقع، وتظهر النتيجة مباشرةً في المعاينة.
      </p>
    </div>
  );
}

function ThemeColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-9 shrink-0 cursor-pointer rounded-md border border-line bg-surface p-0.5"
        aria-label={label}
      />
      <span className="flex flex-col">
        <span className="text-xs font-medium text-ink">{label}</span>
        <span className="font-mono text-[11px] uppercase text-faint" dir="ltr">{value}</span>
      </span>
    </label>
  );
}

function SectionInspector({
  section,
  verticalKey,
  siteData,
  pages,
  sectionTargets,
  onPatch,
  onUploadImage,
  onRemove,
}: {
  section: SectionLite;
  verticalKey: string;
  siteData: SiteRenderData;
  pages: { title: string; path: string }[];
  sectionTargets: { slug: string; label: string }[];
  onPatch: (patch: Partial<SectionLite>) => void;
  onUploadImage: (key: string, file: File) => Promise<string>;
  onRemove: () => void;
}) {
  // Designs offered for THIS section on THIS site's vertical (shared + scoped).
  const designs = designsFor(section.sectionType, verticalKey);
  // Legacy rows may store a short key (e.g. "A") for a section whose designs have
  // moved to bespoke keys. Resolve to the default design so the editor + resolved
  // values match what actually renders, instead of the old title-only fields.
  const known = designsForSection(section.sectionType).some((d) => d.key === section.variant);
  const activeVariant = known ? section.variant : defaultDesignKey(section.sectionType);
  // Fields depend on the chosen design; colors are NOT per-section (they come
  // from the site's theme in settings).
  const fields = fieldsFor(section.sectionType, activeVariant);
  // Effective values the section actually renders (stored content OR resolved
  // defaults/settings) → fields show real values, not blanks.
  const effective = fieldEffectiveValues(activeVariant, section.content, siteData);
  const effStr = (key: string) =>
    typeof effective[key] === "string" ? (effective[key] as string) : "";
  const effList = (key: string) =>
    Array.isArray(effective[key]) ? (effective[key] as string[]) : [];
  const setContent = (key: string, value: unknown) =>
    onPatch({ content: { ...section.content, [key]: value } });

  // Collapsed field groups (per selected section — inspector remounts on select).
  // Start with EVERY group collapsed so a freshly selected section shows a compact
  // list of sections; the user expands the one they want to edit.
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(FIELD_GROUPS.map((g) => g.key)),
  );
  const toggleGroup = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  function renderField(f: DesignField) {
    if (f.type === "image") {
      return (
        <ImageField
          key={f.key}
          label={f.label}
          value={effStr(f.key)}
          onChange={(url) => setContent(f.key, url)}
          onUpload={(file) => onUploadImage(f.key, file)}
        />
      );
    }
    if (f.type === "list") {
      const stored = section.content[f.key];
      const list = Array.isArray(stored) ? (stored as string[]) : effList(f.key);
      return (
        <ListField key={f.key} label={f.label} value={list} onChange={(next) => setContent(f.key, next)} />
      );
    }
    if (f.type === "group") {
      const stored = section.content[f.key];
      const eff = effective[f.key];
      const rows = Array.isArray(stored)
        ? (stored as Record<string, string>[])
        : Array.isArray(eff)
          ? (eff as Record<string, string>[])
          : [];
      return (
        <GroupListField
          key={f.key}
          fieldKey={f.key}
          label={f.label}
          addLabel={f.addLabel}
          fields={f.fields ?? []}
          max={f.max}
          value={rows}
          onChange={(next) => setContent(f.key, next)}
          onUpload={onUploadImage}
        />
      );
    }
    if (f.type === "link") {
      const stored = section.content[f.key];
      const link: SectionLink = isSectionLink(stored) ? stored : f.defaultLink ?? { kind: "whatsapp" };
      return (
        <LinkField
          key={f.key}
          label={f.label}
          value={link}
          pages={pages}
          sections={sectionTargets}
          onChange={(next) => setContent(f.key, next)}
        />
      );
    }
    // Show stored value if set, else the effective (resolved) value so the field
    // is never blank when the section clearly renders text.
    const stored = section.content[f.key];
    const value = typeof stored === "string" && stored.length > 0 ? stored : effStr(f.key);
    return (
      <Field key={f.key} label={f.label}>
        {f.type === "textarea" ? (
          <Textarea value={value} onChange={(e) => setContent(f.key, e.target.value)} />
        ) : (
          <Input value={value} onChange={(e) => setContent(f.key, e.target.value)} />
        )}
      </Field>
    );
  }

  const grouped = FIELD_GROUPS.map((g) => ({
    ...g,
    items: fields.filter((f) => fieldGroup(f) === g.key),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-faint">القسم</p>
        <p className="font-bold text-ink">{SECTION_LABELS[section.sectionType] ?? section.sectionType}</p>
      </div>

      {designs.length > 1 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-faint">التصميم</p>
          <div className="grid grid-cols-2 gap-2">
            {designs.map((d) => (
              <button
                key={d.key}
                onClick={() => onPatch({ variant: d.key })}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-medium transition cursor-pointer",
                  activeVariant === d.key
                    ? "border-accent bg-accent-50 text-accent-900"
                    : "border-line text-muted hover:border-accent hover:text-ink",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {grouped.map((g) => {
        const open = !collapsed.has(g.key);
        const Icon = g.icon;
        return (
          <div key={g.key} className="overflow-hidden rounded-lg border border-line">
            <button
              onClick={() => toggleGroup(g.key)}
              className="flex w-full items-center justify-between bg-black/[0.02] px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-black/[0.04] cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Icon className="size-4 text-accent" />
                {g.label}
                <span className="rounded-full bg-line/70 px-1.5 text-[10px] font-medium text-muted">
                  {g.items.length}
                </span>
              </span>
              <ChevronDown className={cn("size-4 text-faint transition-transform", open && "rotate-180")} />
            </button>
            {open && <div className="space-y-3 border-t border-line p-3">{g.items.map(renderField)}</div>}
          </div>
        );
      })}

      <button
        onClick={onRemove}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-danger/30 py-2 text-sm text-danger transition hover:bg-danger-100 cursor-pointer"
      >
        <Trash2 className="size-4" /> حذف القسم
      </button>
    </div>
  );
}

/** Image content field: preview + upload/replace/remove. Stores a storage URL. */
function ImageField({
  label,
  value,
  onChange,
  onUpload,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await onUpload(file));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "تعذّر رفع الصورة");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-faint">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-bg">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- uploaded storage URL preview
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-5 text-faint" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:border-accent disabled:opacity-50 cursor-pointer"
          >
            <Upload className="size-3.5" /> {busy ? "جارٍ الرفع…" : value ? "استبدال" : "رفع صورة"}
          </button>
          {value && (
            <button
              onClick={() => onChange("")}
              className="text-start text-xs text-faint hover:text-danger cursor-pointer"
            >
              إزالة
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={pick}
          className="hidden"
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

/** List-of-strings content field: add/edit/remove rows (e.g. a services marquee). */
function ListField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (list: string[]) => void;
}) {
  const update = (i: number, v: string) =>
    onChange(value.map((item, idx) => (idx === i ? v : item)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, ""]);

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-faint">{label}</p>
      <div className="space-y-1.5">
        {value.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input value={item} onChange={(e) => update(i, e.target.value)} />
            <button
              onClick={() => remove(i)}
              title="حذف"
              className="shrink-0 rounded-md p-1.5 text-faint transition hover:text-danger cursor-pointer"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-line px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent hover:text-ink cursor-pointer"
        >
          <Plus className="size-3.5" /> إضافة عنصر
        </button>
      </div>
    </div>
  );
}

/**
 * Repeatable record editor (e.g. About values / stats / milestones). Each item is
 * a card of the design's sub-fields; stored in content as an array of objects.
 */
function GroupListField({
  fieldKey,
  label,
  addLabel,
  fields,
  max,
  value,
  onChange,
  onUpload,
}: {
  fieldKey: string;
  label: string;
  addLabel?: string;
  fields: readonly GroupSubField[];
  max?: number;
  value: Record<string, string>[];
  onChange: (rows: Record<string, string>[]) => void;
  onUpload?: (key: string, file: File) => Promise<string>;
}) {
  const atMax = max !== undefined && value.length >= max;
  const update = (i: number, key: string, v: string) =>
    onChange(value.map((row, idx) => (idx === i ? { ...row, [key]: v } : row)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => {
    if (atMax) return;
    onChange([...value, Object.fromEntries(fields.map((f) => [f.key, ""]))]);
  };

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-faint">{label}</p>
      <div className="space-y-2">
        {value.map((row, i) => (
          <div key={i} className="space-y-1.5 rounded-lg border border-line bg-bg p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-faint">عنصر {i + 1}</span>
              <button
                onClick={() => remove(i)}
                title="حذف"
                className="shrink-0 rounded-md p-1 text-faint transition hover:text-danger cursor-pointer"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            {fields.map((sf) => {
              const type = sf.type ?? (sf.textarea ? "textarea" : "text");
              if (type === "rating") {
                const parsed = parseInt(
                  (row[sf.key] ?? "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))),
                  10,
                );
                const val = Number.isNaN(parsed) ? 5 : Math.min(5, Math.max(1, parsed));
                return (
                  <div key={sf.key}>
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-[11px] text-faint">{sf.label}</p>
                      <span className="text-[11px] font-semibold text-accent">
                        {toArabicDigits(String(val))} / ٥
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={val}
                      onChange={(e) => update(i, sf.key, e.target.value)}
                      className="w-full cursor-pointer accent-accent"
                    />
                  </div>
                );
              }
              if (type === "image") {
                return (
                  <div key={sf.key}>
                    <p className="mb-1 text-[11px] text-faint">{sf.label}</p>
                    <GroupImageInput
                      value={row[sf.key] ?? ""}
                      onChange={(url) => update(i, sf.key, url)}
                      // Unique key per upload → re-ordering rows never overwrites
                      // another row's stored image.
                      onUpload={
                        onUpload
                          ? (file) => onUpload(`${fieldKey}${sf.key}${Date.now().toString(36)}`, file)
                          : undefined
                      }
                    />
                  </div>
                );
              }
              return (
                <div key={sf.key}>
                  <p className="mb-1 text-[11px] text-faint">{sf.label}</p>
                  {type === "textarea" ? (
                    <Textarea rows={2} value={row[sf.key] ?? ""} onChange={(e) => update(i, sf.key, e.target.value)} />
                  ) : (
                    <Input value={row[sf.key] ?? ""} onChange={(e) => update(i, sf.key, e.target.value)} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {atMax ? (
          <p className="text-[11px] text-muted">
            بلغت الحد الأقصى ({toArabicDigits(String(max))} عناصر).
          </p>
        ) : (
          <button
            onClick={add}
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-line px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent hover:text-ink cursor-pointer"
          >
            <Plus className="size-3.5" /> {addLabel ?? "إضافة عنصر"}
          </button>
        )}
      </div>
    </div>
  );
}

/** Compact image picker for a row inside GroupListField (thumbnail + upload). */
function GroupImageInput({
  value,
  onChange,
  onUpload,
}: {
  value: string;
  onChange: (url: string) => void;
  onUpload?: (file: File) => Promise<string>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onUpload) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await onUpload(file));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "تعذّر رفع الصورة");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-surface">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- uploaded storage URL preview
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-4 text-faint" />
          )}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-[11px] font-medium text-ink transition hover:border-accent disabled:opacity-50 cursor-pointer"
        >
          <Upload className="size-3" /> {busy ? "جارٍ الرفع…" : value ? "استبدال" : "رفع صورة"}
        </button>
        {value && (
          <button
            onClick={() => onChange("")}
            className="text-[11px] text-faint hover:text-danger cursor-pointer"
          >
            إزالة
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={pick}
          className="hidden"
        />
      </div>
      {error && <p className="mt-1 text-[11px] text-danger">{error}</p>}
    </div>
  );
}

/** Button-destination field: WhatsApp / a section (smooth scroll) / a page / URL. */
function LinkField({
  label,
  value,
  pages,
  sections,
  onChange,
}: {
  label: string;
  value: SectionLink;
  pages: { title: string; path: string }[];
  sections: { slug: string; label: string }[];
  onChange: (link: SectionLink) => void;
}) {
  const selectCls =
    "w-full rounded-md border border-line bg-surface px-2.5 py-2 text-sm text-ink focus-ring";
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-faint">{label}</p>
      <div className="space-y-1.5">
        <select
          value={value.kind}
          onChange={(e) => onChange({ kind: e.target.value as LinkKind, value: "" })}
          className={selectCls}
        >
          <option value="whatsapp">واتساب</option>
          <option value="section">قسم في الصفحة</option>
          <option value="page">صفحة</option>
          <option value="url">رابط خارجي</option>
          <option value="none">بلا</option>
        </select>

        {value.kind === "section" && (
          <select
            value={value.value ?? ""}
            onChange={(e) => onChange({ kind: "section", value: e.target.value })}
            className={selectCls}
          >
            <option value="">اختر قسمًا…</option>
            {sections.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.label}
              </option>
            ))}
          </select>
        )}

        {value.kind === "page" && (
          <select
            value={value.value ?? ""}
            onChange={(e) => onChange({ kind: "page", value: e.target.value })}
            className={selectCls}
          >
            <option value="">اختر صفحة…</option>
            {pages.map((p) => (
              <option key={p.path} value={p.path}>
                {p.title}
              </option>
            ))}
          </select>
        )}

        {value.kind === "url" && (
          <Input
            value={value.value ?? ""}
            onChange={(e) => onChange({ kind: "url", value: e.target.value })}
            placeholder="https://…"
          />
        )}
      </div>
    </div>
  );
}
