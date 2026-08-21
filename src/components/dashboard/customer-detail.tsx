"use client";

// Edit a customer: name, area, status, internal note. name/phone are INTERNAL
// (shown to the collaborator, never public — customers are never shown publicly).
// The demand-side mirror of provider-detail.tsx, minus photos/public/verification.

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageCircle } from "lucide-react";
import { CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_ORDER, type CustomerStatus } from "@/shared/customers";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import { MenuSelect } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export interface Detail {
  id: string;
  name: string;
  phone: string;
  phoneRaw: string;
  area: string | null;
  status: CustomerStatus;
  internalNote: string | null;
  jobsCount: number;
  createdAt: string;
}

const waHref = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

export function CustomerDetail({
  siteId, businessName, canManage, customer,
}: {
  siteId: string;
  businessName: string;
  canManage: boolean;
  customer: Detail;
}) {
  const router = useRouter();
  const toast = useToast();
  const api = `/api/sites/${siteId}/customers/${customer.id}`; // REST endpoint (mutations)

  const [name, setName] = React.useState(customer.name);
  const [area, setArea] = React.useState(customer.area ?? "");
  const [note, setNote] = React.useState(customer.internalNote ?? "");
  const [saving, setSaving] = React.useState(false);

  const patch = async (body: Record<string, unknown>, okMsg = "تم الحفظ ✓") => {
    try {
      const res = await fetch(api, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message);
      toast(okMsg);
      router.refresh();
      return true;
    } catch (e) {
      toast(e instanceof Error && e.message ? e.message : "تعذّر الحفظ", "error");
      return false;
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    await patch({ name, area });
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/dashboard/sites/${siteId}/customers`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowRight className="size-4" /> رجوع إلى الزبائن
      </Link>
      <PageHeader
        title={customer.name}
        subtitle={`${businessName} · شغلات: ${customer.jobsCount.toLocaleString("ar-EG")}`}
      >
        {canManage && (
          <MenuSelect
            value={customer.status}
            onChange={(v) => patch({ status: v }, "تم تحديث الحالة ✓")}
            options={CUSTOMER_STATUS_ORDER.map((s) => ({ value: s, label: CUSTOMER_STATUS_LABEL[s] }))}
          />
        )}
      </PageHeader>

      {/* internal contact */}
      <Panel className="p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Item label="رقم الواتساب (داخلي)">
            <a href={waHref(customer.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-mono text-accent-300 hover:underline" dir="ltr">
              <MessageCircle className="size-4" /> {customer.phone}
            </a>
          </Item>
          <Item label="الرقم كما كُتب"><span className="font-mono text-muted" dir="ltr">{customer.phoneRaw}</span></Item>
        </dl>
      </Panel>

      {/* editable fields */}
      <Panel className="mt-4 p-5" title="بيانات الزبون">
        <div className="space-y-4">
          <Field label="الاسم">
            <input value={name} onChange={(e) => setName(e.target.value)} disabled={!canManage} className={inputCls} />
          </Field>
          <Field label="المنطقة">
            <input value={area} onChange={(e) => setArea(e.target.value)} disabled={!canManage} className={inputCls} placeholder="مثلاً دمشق" />
          </Field>
          {canManage && (
            <div>
              <Button onClick={saveProfile} loading={saving}>حفظ</Button>
            </div>
          )}
        </div>
      </Panel>

      {/* internal note */}
      {canManage && (
        <Panel className="mt-4 p-5" title="ملاحظة داخلية">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => { if (note !== (customer.internalNote ?? "")) patch({ internalNote: note }, "تم حفظ الملاحظة ✓"); }}
            rows={3}
            placeholder="ملاحظات خاصة — لا تظهر للعموم أبدًا"
            className="w-full rounded-md border border-line bg-bg px-3 py-2 text-[14px] outline-none focus:border-accent"
          />
        </Panel>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-md border border-line bg-bg px-3 py-2 text-[14px] outline-none focus:border-accent";

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-1 text-[12px] text-faint">{label}</dt>
      <dd className="text-[14px] text-ink">{children}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
