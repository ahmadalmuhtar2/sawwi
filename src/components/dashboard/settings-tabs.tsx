"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Info, Scissors,
  Clock, Search, Building2, QrCode,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { siteHost } from "@/lib/site-url";
import { WebsiteInfoEditor, type WebsiteInfo } from "@/components/dashboard/website-info-editor";
import { Field, Select } from "@/components/ui/field";
import { CURRENCIES } from "@/shared/currency";
import { LogoUploader } from "@/components/dashboard/logo-uploader";
import { HoursEditor } from "@/components/dashboard/hours-editor";
import { ContentListEditor } from "@/components/dashboard/content-list-editor";
import { SiteSeoEditor } from "@/components/dashboard/site-seo-editor";
import { BasicsEditor } from "@/components/dashboard/basics-editor";
import { SharePrint } from "@/components/dashboard/share-print";
import type { SiteSeo } from "@/shared/seo";

interface FullSettings extends WebsiteInfo {
  openingHours: Record<string, unknown>;
  currency: string;
  logoMediaId: string | null;
  loadingIconId: string | null;
}

type Item = { id: string } & Record<string, unknown>;

interface Lists {
  services: Item[];
  team: Item[];
  testimonials: Item[];
  faq: Item[];
}

const TABS = [
  { id: "basics", label: "الأساسيات", icon: Building2 },
  { id: "info", label: "معلومات الموقع", icon: Info },
  { id: "services", label: "الخدمات والأسعار", icon: Scissors },
  { id: "hours", label: "ساعات العمل", icon: Clock },
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
  initialBasics,
  initialTheme,
  initialSettings,
  initialSeo,
  lists,
}: {
  siteId: string;
  businessName: string;
  slug: string;
  siteUrl: string;
  initialLogoUrl: string | null;
  initialBasics: { businessName: string; slug: string; language: "ar" | "en" };
  initialTheme: {
    paletteKey: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    fontKey: string | null;
    headerVariant?: string | null;
    headerScheme?: string | null;
    footerVariant?: string | null;
    footerScheme?: string | null;
  };
  initialSettings: FullSettings;
  initialSeo: SiteSeo;
  lists: Lists;
}) {
  const toast = useToast();
  const [tab, setTab] = useState<TabId>("info");
  const [settings, setSettings] = useState<FullSettings>(initialSettings);

  // The settings PUT is a full replace, so every partial edit must send the
  // complete merged object — otherwise one tab would wipe another's fields.
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
      logoMediaId: next.logoMediaId,
      loadingIconId: next.loadingIconId,
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
        {TABS.map((t) => {
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
          <Panel title="أساسيات الموقع" desc="اسم النشاط ورابط الموقع ولغته.">
            <BasicsEditor siteId={siteId} initial={initialBasics} />
          </Panel>
        )}

        {tab === "info" && (
          <Panel title="معلومات الموقع" desc="بيانات التواصل التي تظهر في الترويسة والتذييل وأقسام التواصل.">
            <div className="mb-6 border-b border-line pb-6">
              <LogoUploader siteId={siteId} initialUrl={initialLogoUrl} />
            </div>
            <WebsiteInfoEditor
              initial={settings}
              onSave={(info) => saveSettings(info)}
            />
          </Panel>
        )}

        {tab === "services" && (
          <Panel title="الخدمات والأسعار" desc="القائمة التي تظهر في قسم الخدمات وقائمة الأسعار.">
            <Field label="عملة الأسعار" className="mb-5 max-w-xs">
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
            <ContentListEditor
              siteId={siteId}
              type="services"
              itemNoun="خدمات"
              addLabel="إضافة خدمة"
              initial={lists.services}
              fields={[
                { key: "name", label: "اسم الخدمة", required: true, placeholder: "مثال: قص شعر" },
                { key: "price", label: "السعر", placeholder: "مثال: ٥٠٠٠٠" },
                { key: "duration", label: "المدة", placeholder: "مثال: ٣٠ دقيقة" },
                { key: "description", label: "الوصف", textarea: true, placeholder: "وصف مختصر (اختياري)" },
              ]}
            />
          </Panel>
        )}



        {tab === "hours" && (
          <Panel title="ساعات العمل" desc="تظهر في قسم المواعيد وتُستخدم لبيانات محركات البحث.">
            <HoursEditor
              initial={settings.openingHours}
              onSave={(openingHours) => saveSettings({ openingHours })}
            />
          </Panel>
        )}

        {tab === "share" && (
          <Panel title="المشاركة والطباعة" desc="رمز QR وبطاقة عمل جاهزة للطباعة ببيانات المحل.">
            <SharePrint
              slug={slug}
              siteUrl={siteUrl}
              businessName={businessName}
              logoUrl={initialLogoUrl}
              paletteKey={initialTheme.paletteKey}
              phone={settings.phone}
              whatsapp={settings.whatsappNumber}
              address={settings.address}
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
