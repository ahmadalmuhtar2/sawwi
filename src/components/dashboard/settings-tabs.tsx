"use client";

import { useState } from "react";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ImageUp, Loader2, Search, Building2, QrCode, Trash2, Users, ExternalLink } from "lucide-react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { siteHost } from "@/lib/site-url";
import { Field, Input, Select } from "@/components/ui/field";
import { CURRENCIES } from "@/shared/currency";
import { SiteSeoEditor } from "@/components/dashboard/site-seo-editor";
import { BasicsEditor } from "@/components/dashboard/basics-editor";
import { SharePrint } from "@/components/dashboard/share-print";
import type { SiteSeo } from "@/shared/seo";

// The template model keeps ALL business content (contact, services, hours, …) in
// Site.content, edited inline in the builder. Site settings now surfaces only what
// the live site still reads from the settings/site tables: basics, currency, SEO,
// plus the share/print helpers. The other SiteSettings columns are still carried
// through the (full-replace) save so switching to the template model doesn't wipe
// them.
interface FullSettings {
  currency: string;
  phone?: string | null;
  whatsappNumber?: string | null;
  address?: string | null;
  googleMapsUrl?: string | null;
  socials?: Record<string, string>;
  openingHours?: Record<string, unknown>;
  logoMediaId?: string | null;
  loadingIconId?: string | null;
  authEnabled?: boolean;
  roleLabels?: Record<string, string>;
}

const TABS = [
  { id: "basics", label: "الأساسيات", icon: Building2 },
  { id: "accounts", label: "حسابات الزوّار", icon: Users },
  { id: "share", label: "المشاركة والطباعة", icon: QrCode },
  { id: "seo", label: "محركات البحث", icon: Search },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsTabs({
  siteId,
  businessName,
  slug,
  siteUrl,
  initialLogoUrl,
  initialLogo,
  initialBasics,
  initialSettings,
  initialSeo,
  authByDefault = false,
}: {
  siteId: string;
  businessName: string;
  slug: string;
  siteUrl: string;
  initialLogoUrl: string | null;
  /** the site-header logo (content.shop.logo) */
  initialLogo: string;
  initialBasics: { businessName: string; slug: string; language: "ar" | "en" };
  initialSettings: FullSettings;
  initialSeo: SiteSeo;
  /** Template requires end-user auth (marketplace) → the toggle is locked ON. */
  authByDefault?: boolean;
}) {
  const toast = useToast();
  const [tab, setTab] = useState<TabId>("basics");
  const [settings, setSettings] = useState<FullSettings>(initialSettings);

  // The settings PUT is a full replace, so every save sends the complete merged
  // object — carrying the legacy (template-model-unused) columns through unchanged.
  async function saveSettings(patch: Partial<FullSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    await api.put(`/api/sites/${siteId}/settings`, {
      whatsappNumber: next.whatsappNumber || null,
      phone: next.phone || null,
      address: next.address || null,
      googleMapsUrl: next.googleMapsUrl || null,
      socials: next.socials ?? {},
      openingHours: next.openingHours ?? {},
      currency: next.currency ?? "SYP",
      logoMediaId: next.logoMediaId ?? null,
      loadingIconId: next.loadingIconId ?? null,
      authEnabled: next.authEnabled ?? false,
      roleLabels: next.roleLabels ?? {},
    });
    toast("تم الحفظ ✓");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/dashboard/sites/${siteId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowRight className="size-4" /> العودة إلى المُنشئ
      </Link>

      <h1 className="text-2xl font-extrabold text-ink">إعدادات {businessName}</h1>
      <p className="mt-1 text-sm text-muted">
        كل ما يظهر في موقعك — نظّمه حسب القسم. التغييرات تظهر بعد النشر.
      </p>

      {/* Tab bar */}
      <div className="mt-6 flex flex-wrap gap-1.5 border-b border-line pb-3">
        {/* The "accounts" tab only makes sense for templates that use visitor
            accounts — currently those turn auth ON by default (authByDefault), so
            there's nothing to toggle. Hide it everywhere else. */}
        {TABS.filter((t) => t.id !== "accounts" || authByDefault).map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition cursor-pointer",
                active
                  ? "bg-accent-100 text-accent-900"
                  : "text-muted hover:bg-black/[0.04] dark:hover:bg-white/6 hover:text-ink",
              )}
            >
              <Icon className="size-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "basics" && (
          <Panel title="أساسيات الموقع" desc="اسم النشاط ولغته وشعاره وعملة الأسعار. باقي المحتوى يُحرَّر مباشرةً على الموقع.">
            <BasicsEditor siteId={siteId} initial={initialBasics} />
            <div className="mt-6 border-t border-line pt-6">
              <p className="mb-2 text-sm font-medium text-ink">شعار الموقع</p>
              <SiteLogoField siteId={siteId} initialLogo={initialLogo} />
            </div>
            <div className="mt-6 border-t border-line pt-6">
              <Field label="عملة الأسعار" className="max-w-xs">
                <Select
                  value={settings.currency ?? "SYP"}
                  onChange={(e) => saveSettings({ currency: e.target.value })}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </Select>
                <p className="mt-1.5 text-xs text-muted">
                  تُطبَّق على كل الأسعار في الموقع. أدخل الأرقام فقط — تتحوّل تلقائيًا إلى أرقام عربية وتُضاف العملة.
                </p>
              </Field>
            </div>
          </Panel>
        )}

        {tab === "accounts" && (
          <Panel title="حسابات الزوّار" desc="هذا القالب يعتمد على حسابات الزوّار (مفعّلة دائمًا). خصّص مسميات الأدوار الثلاثة هنا، وأدر الحسابات من صفحة «المستخدمون».">
            <AccountsPanel
              siteId={siteId}
              labels={settings.roleLabels ?? {}}
              onLabels={(labels) => saveSettings({ roleLabels: labels })}
            />
          </Panel>
        )}

        {tab === "share" && (
          <Panel title="المشاركة والطباعة" desc="رمز QR وبطاقة عمل جاهزة للطباعة ببيانات المحل.">
            <SharePrint
              slug={slug}
              siteUrl={siteUrl}
              businessName={businessName}
              logoUrl={initialLogo || initialLogoUrl}
              phone={settings.phone ?? ""}
              whatsapp={settings.whatsappNumber ?? ""}
              address={settings.address ?? ""}
            />
          </Panel>
        )}

        {tab === "seo" && <SiteSeoEditor siteId={siteId} initial={initialSeo} />}
      </div>

      {/* Public URL hint */}
      <p className="mt-8 text-center font-label text-xs text-faint">
        {siteHost(slug)}
      </p>
    </div>
  );
}

/** Customize the 3 role labels for a site's visitor accounts. Only rendered for
 *  templates that use accounts (auth is on by default for them), so there's no
 *  enable/disable toggle — just the labels + a link to manage the accounts. */
function AccountsPanel({
  siteId,
  labels,
  onLabels,
}: {
  siteId: string;
  labels: Record<string, string>;
  onLabels: (labels: Record<string, string>) => void;
}) {
  const DEFAULTS: Record<string, string> = { manager: "مدير", contributor: "مساهم", member: "عضو" };
  const [local, setLocal] = useState({
    manager: labels.manager ?? "",
    contributor: labels.contributor ?? "",
    member: labels.member ?? "",
  });
  const ROLES = [
    { k: "manager" as const, hint: "صلاحية كاملة: يدير كل المحتوى والمستخدمين." },
    { k: "contributor" as const, hint: "ينشئ ويدير محتواه فقط (مثل نشر الإعلانات)." },
    { k: "member" as const, hint: "زائر مسجّل: يتفاعل فقط، بلا نشر محتوى." },
  ];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-ink">مسميات الأدوار</p>
        {ROLES.map((r) => (
          <Field key={r.k} label={DEFAULTS[r.k]} hint={r.hint} className="max-w-sm">
            <Input
              value={local[r.k]}
              placeholder={DEFAULTS[r.k]}
              onChange={(e) => setLocal((s) => ({ ...s, [r.k]: e.target.value }))}
              onBlur={() => onLabels({ ...labels, [r.k]: local[r.k].trim() })}
            />
          </Field>
        ))}
      </div>
      <Link
        href={`/dashboard/sites/${siteId}/users`}
        className="inline-flex items-center gap-2 self-start rounded-md border border-line px-3.5 py-2 text-sm font-medium text-ink transition hover:bg-black/[0.04] dark:hover:bg-white/6"
      >
        <Users className="size-4 text-muted" /> إدارة المستخدمين <ExternalLink className="size-3.5 text-faint" />
      </Link>
    </div>
  );
}

/**
 * Site-header logo. Uploads through the dedicated /logo endpoint → PERMANENT
 * per-site storage + Site.logoUrl (shown on the dashboard sites list). The same
 * permanent URL is then mirrored into content.shop.logo so it travels with the
 * content into the preview/builder/served renders. (The old path uploaded to a
 * per-user STAGING folder — ephemeral, not tied to the site — which showed broken
 * on the site and never populated the sites-list card.)
 */
function SiteLogoField({ siteId, initialLogo }: { siteId: string; initialLogo: string }) {
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [logo, setLogo] = useState(initialLogo);
  const [busy, setBusy] = useState(false);

  // Mirror the (permanent) logo URL into content.shop.logo — fetch the LATEST
  // content first so we never clobber inline edits (content PUT is a full replace).
  async function mirrorToContent(url: string) {
    const site = await api.get<{ content?: Record<string, unknown> }>(`/api/sites/${siteId}`);
    const content = site.content ?? {};
    const shop = (content.shop as Record<string, unknown>) ?? {};
    await api.put(`/api/sites/${siteId}/content`, { ...content, shop: { ...shop, logo: url } });
  }

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await api.post<{ url: string }>(`/api/sites/${siteId}/logo`, fd);
      await mirrorToContent(url);
      setLogo(url);
      toast("تم حفظ الشعار ✓");
    } catch {
      toast("تعذّر رفع الشعار", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api.del(`/api/sites/${siteId}/logo`);
      await mirrorToContent("");
      setLogo("");
      toast("تمت إزالة الشعار");
    } catch {
      toast("تعذّر حذف الشعار", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-neutral-100 text-faint transition hover:border-accent disabled:opacity-60 cursor-pointer"
      >
        {busy ? (
          <Loader2 className="size-5 animate-spin" />
        ) : logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="الشعار" className="size-full object-contain" />
        ) : (
          <ImageUp className="size-5" />
        )}
      </button>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="rounded-md border border-line px-3 py-1.5 text-sm text-ink transition hover:border-accent disabled:opacity-60 cursor-pointer"
        >
          {logo ? "تغيير الشعار" : "رفع شعار"}
        </button>
        {logo && !busy && (
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted transition hover:text-danger cursor-pointer"
          >
            <Trash2 className="size-4" /> إزالة
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={pick} />
    </div>
  );
}

function Panel({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <h2 className="font-bold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-muted">{desc}</p>
      <div className="mt-5">{children}</div>
    </Card>
  );
}
