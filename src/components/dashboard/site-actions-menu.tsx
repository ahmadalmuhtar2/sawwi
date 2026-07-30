"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreVertical, Pencil, Settings, Eye, History, ExternalLink, Link2, Trash2, MessageSquare, Tag,
} from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { siteUrl } from "@/lib/site-url";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function SiteActionsMenu({
  site,
  canDelete = false,
  unread = 0,
  templateKey = null,
}: {
  site: { id: string; slug: string; businessName: string; status: string };
  canDelete?: boolean;
  /** Unread visitor messages — shows a count badge on the الرسائل item. */
  unread?: number;
  /** Marketplace sites get an "الإعلانات" (listings) entry. */
  templateKey?: string | null;
}) {
  const toast = useToast();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const liveUrl = siteUrl(site.slug);
  const isPublished = site.status === "published";

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

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
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-md p-1.5 text-muted transition hover:bg-black/[0.04] dark:hover:bg-white/6 hover:text-ink cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="خيارات الموقع"
      >
        <MoreVertical className="size-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 z-50 mt-1 w-56 overflow-hidden rounded-lg border border-line bg-surface p-1 shadow-lg"
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
        </div>
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
    </div>
  );
}
