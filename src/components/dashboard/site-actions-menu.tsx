"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreVertical, Pencil, Settings, Eye, History, ExternalLink, Link2, Trash2, MessageSquare, Tag, Users, UserCog, Inbox, HardHat, Briefcase,
} from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { authOnByDefault } from "@/templates/auth-defaults";
import { templateCollectsSubmissions } from "@/templates/registry";
import { siteUrl } from "@/lib/site-url";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function SiteActionsMenu({
  site,
  canDelete = false,
  unread = 0,
  newSubmissions = 0,
  templateKey = null,
}: {
  site: { id: string; slug: string; businessName: string; status: string };
  canDelete?: boolean;
  /** Unread visitor messages — shows a count badge on the الرسائل item. */
  unread?: number;
  /** NEW leads — shows a count badge on the الطلبات item (submission templates). */
  newSubmissions?: number;
  /** Marketplace sites get an "الإعلانات" (listings) entry. */
  templateKey?: string | null;
}) {
  const toast = useToast();
  const router = useRouter();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // The menu is PORTALED (fixed positioning) so a table's overflow container
  // can't clip it — z-index alone can't escape `overflow: hidden/auto`.
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; maxHeight: number } | null>(null);

  const liveUrl = siteUrl(site.slug);
  const isPublished = site.status === "published";

  // Position the fixed menu against the button: aligned to its inline-end (right
  // edge in RTL), opening downward — or flipping up when there's more room above.
  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = 224; // w-56
    const margin = 8;
    const left = Math.max(margin, Math.min(r.right - width, window.innerWidth - width - margin));
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const openUp = spaceBelow < 280 && spaceAbove > spaceBelow;
    setPos({
      left,
      maxHeight: Math.max(160, (openUp ? spaceAbove : spaceBelow) - margin - 4),
      ...(openUp ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    const reposition = () => place();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    // capture:true so scrolls of ancestor overflow containers reposition too.
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, place]);

  async function copyLink() {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(liveUrl);
      toast("تم نسخ الرابط ✓");
    } catch {
      toast("تعذّر نسخ الرابط", "error");
    }
  }

  async function doDelete() {
    setDeleting(true);
    try {
      await api.del(`/api/sites/${site.id}`);
      toast("تم حذف الموقع");
      setConfirmOpen(false);
      router.refresh();
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر الحذف", "error");
    }
    setDeleting(false);
  }

  const itemCls =
    "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink transition hover:bg-black/[0.04] dark:hover:bg-white/6 cursor-pointer";

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="rounded-md p-1.5 text-muted transition hover:bg-black/[0.04] dark:hover:bg-white/6 hover:text-ink cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="خيارات الموقع"
      >
        <MoreVertical className="size-5" />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: "fixed", left: pos.left, top: pos.top, bottom: pos.bottom, width: 224, maxHeight: pos.maxHeight }}
            className="z-100 overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-lg"
          >
          <Link href={`/dashboard/sites/${site.id}`} onClick={() => setOpen(false)} className={itemCls}>
            <Pencil className="size-4 text-muted" /> تحرير
          </Link>
          <Link href={`/dashboard/sites/${site.id}/settings`} onClick={() => setOpen(false)} className={itemCls}>
            <Settings className="size-4 text-muted" /> الإعدادات
          </Link>
          {templateKey === "marketplace" && (
            <Link href={`/dashboard/sites/${site.id}/listings`} onClick={() => setOpen(false)} className={itemCls}>
              <Tag className="size-4 text-muted" /> الإعلانات
            </Link>
          )}
          {/* Site end-users (SiteUser) only exist for templates that use visitor
              accounts (auth on by default). Hide the link elsewhere. */}
          {authOnByDefault(templateKey) && (
            <Link href={`/dashboard/sites/${site.id}/users`} onClick={() => setOpen(false)} className={itemCls}>
              <Users className="size-4 text-muted" /> المستخدمون
            </Link>
          )}
          <Link href={`/dashboard/sites/${site.id}/collaborators`} onClick={() => setOpen(false)} className={itemCls}>
            <UserCog className="size-4 text-muted" /> المتعاونون
          </Link>
          {templateCollectsSubmissions(templateKey) && (
            <>
              <Link href={`/dashboard/sites/${site.id}/submissions`} onClick={() => setOpen(false)} className={itemCls}>
                <Inbox className="size-4 text-muted" />
                <span className="flex-1">الطلبات</span>
                {newSubmissions > 0 && (
                  <span className="min-w-5 rounded-full bg-accent px-1.5 py-0.5 text-center text-[11px] font-bold leading-none text-white">
                    {newSubmissions > 99 ? "٩٩+" : newSubmissions.toLocaleString("ar-EG")}
                  </span>
                )}
              </Link>
              <Link href={`/dashboard/sites/${site.id}/providers`} onClick={() => setOpen(false)} className={itemCls}>
                <HardHat className="size-4 text-muted" /> المزوّدون
              </Link>
              <Link href={`/dashboard/sites/${site.id}/jobs`} onClick={() => setOpen(false)} className={itemCls}>
                <Briefcase className="size-4 text-muted" /> الشغلات
              </Link>
            </>
          )}
          <Link href={`/dashboard/sites/${site.id}/messages`} onClick={() => setOpen(false)} className={itemCls}>
            <MessageSquare className="size-4 text-muted" />
            <span className="flex-1">الرسائل</span>
            {unread > 0 && (
              <span className="min-w-5 rounded-full bg-accent px-1.5 py-0.5 text-center text-[11px] font-bold leading-none text-white">
                {unread > 99 ? "٩٩+" : unread.toLocaleString("ar-EG")}
              </span>
            )}
          </Link>
          <a href={`/preview/${site.id}`} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className={itemCls}>
            <Eye className="size-4 text-muted" /> معاينة
          </a>
          <Link href={`/dashboard/sites/${site.id}/history`} onClick={() => setOpen(false)} className={itemCls}>
            <History className="size-4 text-muted" /> سجل النشر
          </Link>

          {isPublished && (
            <>
              <div className="my-1 border-t border-line" />
              <a href={liveUrl} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className={itemCls}>
                <ExternalLink className="size-4 text-muted" /> فتح الموقع المنشور
              </a>
              <button onClick={copyLink} className={itemCls}>
                <Link2 className="size-4 text-muted" /> نسخ الرابط
              </button>
            </>
          )}

          {canDelete && (
            <>
              <div className="my-1 border-t border-line" />
              <button
                onClick={() => { setOpen(false); setConfirmOpen(true); }}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-danger transition hover:bg-danger-100 cursor-pointer"
              >
                <Trash2 className="size-4" /> حذف الموقع
              </button>
            </>
          )}
          </div>,
          // Portal into the themed shell wrapper so the menu inherits dark/light.
          (typeof document !== "undefined" && document.getElementById("sw-app")) || document.body,
        )}

      <Modal
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        title="حذف الموقع"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              إلغاء
            </Button>
            <Button variant="danger" onClick={doDelete} loading={deleting}>
              حذف نهائي
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink">
          سيتم حذف <span className="font-bold">{site.businessName}</span> وكل محتواه وصفحاته
          وسجل نشره نهائيًا. لا يمكن التراجع عن هذا الإجراء.
        </p>
      </Modal>
    </>
  );
}
