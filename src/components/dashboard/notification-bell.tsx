"use client";

// Dashboard header bell. Polls the caller's notification feed and surfaces an
// unread count; the dropdown lists recent items and marks them read. New
// visitor messages land here for the site owner + every collaborator.

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Inbox } from "lucide-react";
import { api } from "@/lib/api-client";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  siteId: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

const POLL_MS = 60_000;

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "الآن";
  const m = Math.floor(s / 60);
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  if (d < 30) return `منذ ${d} يوم`;
  return new Date(iso).toLocaleDateString("ar");
}

export function NotificationBell() {
  const router = useRouter();
  const ref = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<Notification[]>([]);
  const [unread, setUnread] = React.useState(0);

  const load = React.useCallback(async () => {
    try {
      const data = await api.get<{ items: Notification[]; unread: number }>("/api/notifications");
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      /* transient — keep the last good state, try again on the next tick */
    }
  }, []);

  // Poll on an interval and whenever the tab regains focus (cheap, indexed query).
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is set after an await, not synchronously
    void load();
    const id = setInterval(load, POLL_MS);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  // Close on outside click / Escape.
  React.useEffect(() => {
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

  async function markAll() {
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    try {
      await api.post("/api/notifications/read", {});
    } catch {
      void load();
    }
  }

  async function openItem(n: Notification) {
    setOpen(false);
    if (!n.readAt) {
      setUnread((u) => Math.max(0, u - 1));
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
      void api.post("/api/notifications/read", { id: n.id }).catch(() => {});
    }
    if (n.link) router.push(n.link);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="الإشعارات"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative rounded-md p-2 text-muted transition hover:bg-black/[0.04] hover:text-ink cursor-pointer dark:hover:bg-white/6"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -end-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-danger px-1 py-0.5 text-[10px] font-bold leading-none text-white">
            {unread > 99 ? "٩٩+" : unread.toLocaleString("ar-EG")}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          // Mobile: a viewport-pinned panel (fixed, 0.5rem side margins) so it can
          // never spill past the screen edges regardless of the bell's position.
          // sm+: the normal dropdown anchored to the bell's end edge.
          className="fixed inset-x-2 top-16 z-50 overflow-hidden rounded-xl border border-line bg-surface shadow-xl sm:absolute sm:inset-x-auto sm:end-0 sm:top-auto sm:mt-2 sm:w-[22rem]"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-sm font-bold text-ink">الإشعارات</span>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted transition hover:text-ink"
              >
                <Check className="size-3.5" /> تعليم الكل كمقروء
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <Inbox className="size-7 text-faint" />
              <p className="text-sm text-muted">لا إشعارات بعد</p>
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => openItem(n)}
                    className={
                      "flex w-full items-start gap-2.5 px-4 py-3 text-start transition hover:bg-black/[0.03] dark:hover:bg-white/5 " +
                      (n.readAt ? "" : "bg-accent-50/50")
                    }
                  >
                    <span
                      className={
                        "mt-1.5 size-2 shrink-0 rounded-full " + (n.readAt ? "bg-transparent" : "bg-accent")
                      }
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{n.title}</span>
                      {n.body && <span className="mt-0.5 block truncate text-xs text-muted">{n.body}</span>}
                      <span className="mt-1 block text-[11px] text-faint">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
