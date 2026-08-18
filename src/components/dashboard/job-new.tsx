"use client";

// Record a brokered match: pick a provider, enter the customer + what/where. On
// save it becomes a MATCHED job; the follow-up + rating are recorded later from
// the job's detail page.

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SERVICE_OPTIONS } from "@/shared/submissions";
import { SYRIAN_REGIONS, REGION_OTHER } from "@/shared/syria";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import { MenuSelect } from "@/components/ui/dropdown";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export interface ProviderOption {
  id: string;
  name: string;
  displayName: string | null;
  categories: string[];
  areas: string[];
}

export function JobNew({
  siteId, businessName, providers, prefill,
}: {
  siteId: string;
  businessName: string;
  providers: ProviderOption[];
  prefill: { customerName: string; customerPhone: string; category: string; area: string; customerSubmissionId: string } | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = React.useState({
    providerId: "",
    customerName: prefill?.customerName ?? "",
    customerPhone: prefill?.customerPhone ?? "",
    category: prefill?.category ?? "",
    area: prefill?.area ?? "",
    description: "",
  });
  const [busy, setBusy] = React.useState(false);
  const [fields, setFields] = React.useState<Record<string, string>>({});
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const pickProvider = (id: string) => {
    const p = providers.find((x) => x.id === id);
    // Convenience: prefill category/area from the provider when still empty.
    setF((prev) => ({
      ...prev,
      providerId: id,
      category: prev.category || p?.categories[0] || "",
      area: prev.area || p?.areas[0] || "",
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setFields({});
    try {
      const res = await fetch(`/api/sites/${siteId}/jobs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...f, customerSubmissionId: prefill?.customerSubmissionId }),
      });
      const json = (await res.json()) as { ok: boolean; data?: { id: string }; error?: { message?: string; fields?: Record<string, string> } };
      if (json.ok && json.data) {
        toast("تم تسجيل المطابقة ✓");
        router.push(`/dashboard/sites/${siteId}/jobs/${json.data.id}`);
      } else {
        setFields(json.error?.fields ?? {});
        toast(json.error?.message ?? "تعذّر التسجيل", "error");
      }
    } catch {
      toast("تعذّر الاتصال", "error");
    } finally {
      setBusy(false);
    }
  };

  const providerOpts = providers.map((p) => ({ value: p.id, label: p.displayName?.trim() || p.name }));

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/dashboard/sites/${siteId}/jobs`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowRight className="size-4" /> رجوع إلى الشغلات
      </Link>
      <PageHeader title="تسجيل مطابقة" subtitle={businessName} />

      <Panel className="p-5">
        {providers.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-muted">
            لا مزوّدين بعد. روح لصفحة «الطلبات»، اقبل طلب مزوّد، واضغط «تحويل لمزوّد».
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <MField label="المزوّد" error={fields.providerId}>
              <MenuSelect value={f.providerId} onChange={pickProvider} placeholder="اختر مزوّدًا" options={providerOpts} />
            </MField>
            <MField label="اسم الزبون" error={fields.customerName}>
              <input value={f.customerName} onChange={(e) => set("customerName", e.target.value)} className={mInput} />
            </MField>
            <MField label="رقم الزبون (داخلي)" error={fields.customerPhone}>
              <PhoneInput value={f.customerPhone} onChange={(v) => set("customerPhone", v)} />
            </MField>
            <MField label="الخدمة" error={fields.category}>
              <input list="jcats" value={f.category} onChange={(e) => set("category", e.target.value)} className={mInput} />
              <datalist id="jcats">{SERVICE_OPTIONS.map((c) => <option key={c} value={c} />)}</datalist>
            </MField>
            <MField label="المنطقة" error={fields.area}>
              <MenuSelect
                value={f.area}
                onChange={(v) => set("area", v)}
                placeholder="اختر المنطقة"
                options={[...SYRIAN_REGIONS.map((r) => ({ value: r, label: r })), { value: REGION_OTHER, label: REGION_OTHER }]}
              />
            </MField>
            <MField label="تفاصيل (اختياري)" error={fields.description}>
              <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={2} className={mInput} />
            </MField>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="submit" loading={busy}>تسجيل</Button>
            </div>
          </form>
        )}
      </Panel>
    </div>
  );
}

const mInput = "w-full rounded-md border border-line bg-bg px-3 py-2 text-[14px] outline-none focus:border-accent";
function MField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12.5px] text-muted">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[12px] text-danger">{error}</span>}
    </label>
  );
}
