"use client";

// Dashboard inbox for a site's visitor messages (leads). Filter by status,
// mark read/unread, archive, delete. Read-only for viewers (canManage=false).

import * as React from "react";
import Link from "next/link";
import {
  Inbox, MailOpen, Mail, Archive, ArchiveRestore, Trash2,
  MessageSquare, ArrowRight, Check,
} from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { EmptyState, Spinner } from "@/components/ui/feedback";
import { SegmentedControl } from "@/components/ui/segmented";

type Status = "unread" | "read" | "archived";
type Filter = "all" | Status;

export interface Message {
  id: string;
  name: string;
  contact: string | null;
  body: string;
  status: Status;
  createdAt: string;
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "unread", label: "غير مقروءة" },
  { value: "read", label: "مقروءة" },
  { value: "archived", label: "الأرشيف" },
];

/** Compact Arabic "time ago". */
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

/** Digits (Arabic or Latin) in a contact string → a wa.me/tel-ready number. */
function phoneDigits(contact: string): string | null {
  const latin = contact.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const digits = latin.replace(/[^\d]/g, "");
  return digits.length >= 6 ? digits : null;
}

export function MessagesInbox({
  siteId,
  businessName,
  initial,
  canManage,
}: {
  siteId: string;
  businessName: string;
  initial: { messages: Message[]; unread: number };
  canManage: boolean;
}) {
  const toast = useToast();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [messages, setMessages] = React.useState<Message[]>(initial.messages);
  const [unread, setUnread] = React.useState(initial.unread);
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (f: Filter) => {
      setLoading(true);
      try {
        const data = await api.get<{ messages: Message[]; unread: number }>(
          `/api/sites/${siteId}/messages?filter=${f}`,
        );
        setMessages(data.messages);
        setUnread(data.unread);
      } catch {
        toast("تعذّر تحميل الرسائل", "error");
      }
      setLoading(false);
    },
    [siteId, toast],
  );

  function onFilter(f: Filter) {
    setFilter(f);
    void load(f);
  }

  async function setStatus(id: string, status: Status) {
    setBusy(id);
    try {
      await api.patch(`/api/sites/${siteId}/messages/${id}`, { status });
      await load(filter);
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر التحديث", "error");
    }
    setBusy(null);
  }

  async function remove(id: string) {
    setBusy(id);
    try {
      await api.del(`/api/sites/${siteId}/messages/${id}`);
      toast("تم حذف الرسالة");
      await load(filter);
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر الحذف", "error");
    }
    setBusy(null);
  }

  async function markAllRead() {
    const ids = messages.filter((m) => m.status === "unread").map((m) => m.id);
    if (!ids.length) return;
    setLoading(true);
    try {
      await Promise.all(
        ids.map((id) => api.patch(`/api/sites/${siteId}/messages/${id}`, { status: "read" })),
      );
      toast("تم تعليم الرسائل كمقروءة ✓");
      await load(filter);
    } catch {
      toast("تعذّر التحديث", "error");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <Link
          href={`/dashboard/sites/${siteId}`}
          className="rounded-md p-1.5 text-muted transition hover:bg-black/[0.04] hover:text-ink dark:hover:bg-white/6"
          aria-label="رجوع"
        >
          <ArrowRight className="size-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-ink">الرسائل</h1>
          <p className="mt-0.5 text-sm text-muted">
            رسائل زوّار موقع <span className="font-medium text-ink">{businessName}</span>
            {unread > 0 ? ` — ${unread} غير مقروءة` : ""}
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <SegmentedControl options={FILTERS} value={filter} onChange={onFilter} size="sm" />
        {canManage && unread > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-black/[0.04] hover:text-ink dark:hover:bg-white/6"
          >
            <Check className="size-3.5" /> تعليم الكل كمقروء
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : messages.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox className="size-6" />}
            title={filter === "all" ? "لا رسائل بعد" : "لا رسائل في هذا التصنيف"}
            body="عندما يرسل زائرٌ رسالة من نموذج «راسلنا» في موقعك المنشور، ستظهر هنا."
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((m) => {
            const digits = m.contact ? phoneDigits(m.contact) : null;
            return (
              <li key={m.id}>
                <Card
                  className={
                    "p-4 transition " +
                    (m.status === "unread" ? "border-accent/40 bg-accent-50/40" : "")
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {m.status === "unread" && (
                          <span className="size-2 shrink-0 rounded-full bg-accent" aria-label="غير مقروءة" />
                        )}
                        <span className="truncate font-bold text-ink">{m.name}</span>
                        <span className="shrink-0 text-[11px] text-faint">{timeAgo(m.createdAt)}</span>
                      </div>
                      {m.contact && (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-muted">{m.contact}</span>
                          {digits && (
                            <>
                              <a
                                href={`https://wa.me/${digits}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-emerald-600 hover:underline"
                              >
                                واتساب
                              </a>
                              <a
                                href={`tel:${digits}`}
                                className="font-medium text-accent hover:underline"
                              >
                                اتصال
                              </a>
                            </>
                          )}
                        </div>
                      )}
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink">
                        {m.body}
                      </p>
                    </div>

                    {canManage && (
                      <div className="flex shrink-0 flex-col items-center gap-1">
                        {m.status === "unread" ? (
                          <IconBtn label="تعليم كمقروء" onClick={() => setStatus(m.id, "read")} disabled={busy === m.id}>
                            <MailOpen className="size-4" />
                          </IconBtn>
                        ) : m.status === "read" ? (
                          <IconBtn label="تعليم كغير مقروء" onClick={() => setStatus(m.id, "unread")} disabled={busy === m.id}>
                            <Mail className="size-4" />
                          </IconBtn>
                        ) : null}

                        {m.status === "archived" ? (
                          <IconBtn label="استرجاع" onClick={() => setStatus(m.id, "read")} disabled={busy === m.id}>
                            <ArchiveRestore className="size-4" />
                          </IconBtn>
                        ) : (
                          <IconBtn label="أرشفة" onClick={() => setStatus(m.id, "archived")} disabled={busy === m.id}>
                            <Archive className="size-4" />
                          </IconBtn>
                        )}

                        <IconBtn label="حذف" danger onClick={() => remove(m.id)} disabled={busy === m.id}>
                          <Trash2 className="size-4" />
                        </IconBtn>
                      </div>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {!canManage && messages.length > 0 && (
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-faint">
          <MessageSquare className="size-3.5" /> عرض فقط — لا تملك صلاحية إدارة الرسائل.
        </p>
      )}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={
          "rounded-md p-1.5 transition disabled:opacity-40 " +
          (danger
            ? "text-muted hover:bg-danger-100 hover:text-danger"
            : "text-muted hover:bg-black/[0.04] hover:text-ink dark:hover:bg-white/6")
        }
      >
        {children}
      </button>
    </Tooltip>
  );
}
