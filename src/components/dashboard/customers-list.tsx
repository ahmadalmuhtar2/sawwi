"use client";

// The customer list — «الزبائن». The demand-side mirror of the provider directory:
// URL-driven filters + server-side paging. Customers are created by accepting a
// CUSTOMER submission (auto-added on accept, or «تحويل لزبون» from the submission
// detail), so there's no "add" here.

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_ORDER, type CustomerStatus } from "@/shared/customers";
import { PageHeader, Panel, FilterChips, toArabicDigits } from "@/components/dashboard/ui";
import { Badge } from "@/components/ui/badge";

export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  area: string | null;
  status: CustomerStatus;
  jobsCount: number;
}

const STATUS_TONE: Record<CustomerStatus, "neutral" | "accent" | "warn" | "danger"> = {
  DRAFT: "neutral",
  ACTIVE: "accent",
  ARCHIVED: "warn",
};

const ar = (n: number) => n.toLocaleString("ar-EG");
const waHref = (phone: string, greeting: string) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(greeting)}`;

export function CustomersList({
  siteId, businessName, rows, total, page, pageSize, filters,
}: {
  siteId: string;
  businessName: string;
  rows: CustomerRow[];
  total: number;
  page: number;
  pageSize: number;
  filters: { status: string; q: string };
  canManage: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [term, setTerm] = React.useState(filters.q);

  const setParams = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!("page" in patch)) next.delete("page");
    router.push(`?${next.toString()}`, { scroll: false });
  };

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="الزبائن" subtitle={businessName} />

      <FilterChips
        className="mb-3"
        options={[{ key: "all", label: "الكل" }, ...CUSTOMER_STATUS_ORDER.map((s) => ({ key: s, label: CUSTOMER_STATUS_LABEL[s] }))]}
        value={filters.status}
        onChange={(k) => setParams({ status: k === "all" ? "" : k })}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <form
          onSubmit={(e) => { e.preventDefault(); setParams({ q: term.trim() }); }}
          className="flex min-w-52 flex-1 items-center gap-2 rounded-md border border-line px-3 py-2"
        >
          <Search className="size-4 text-faint" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="ابحث بالاسم أو الرقم" className="w-full bg-transparent text-[13.5px] outline-none" />
        </form>
      </div>

      {total > 0 && (
        <div className="mb-2 text-[12.5px] text-faint">
          عدد الزبائن: {toArabicDigits(total)}
          {pageCount > 1 && <> · صفحة {toArabicDigits(page)} من {toArabicDigits(pageCount)}</>}
        </div>
      )}

      <Panel>
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center text-[14px] text-muted">
            لا زبائن بعد. اقبل طلب زبون من صفحة «الطلبات» ليُضاف تلقائيًا هنا.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["الاسم", "رقم الواتساب", "المنطقة", "شغلات", "الحالة"].map((h) => (
                    <th key={h} className="border-b border-line px-3.5 py-2.75 text-start text-[11px] font-normal whitespace-nowrap text-faint">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line transition-colors last:border-0 hover:bg-black/2 dark:hover:bg-white/3">
                    <Td>
                      <Link href={`/dashboard/sites/${siteId}/customers/${r.id}`} className="font-medium text-ink hover:underline">{r.name}</Link>
                    </Td>
                    <Td>
                      <a href={waHref(r.phone, `مرحبا ${r.name}، معك «${businessName}».`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono text-[12.5px] text-accent-300 hover:underline" dir="ltr">
                        <MessageCircle className="size-3.5" /> {r.phone}
                      </a>
                    </Td>
                    <Td className="text-muted">{r.area || "—"}</Td>
                    <Td className="tabular-nums text-muted">{ar(r.jobsCount)}</Td>
                    <Td><Badge tone={STATUS_TONE[r.status]}>{CUSTOMER_STATUS_LABEL[r.status]}</Badge></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-[13px] text-muted">
          <button disabled={page <= 1} onClick={() => setParams({ page: String(page - 1) })} className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 disabled:opacity-40">
            <ChevronRight className="size-4" /> السابق
          </button>
          <span>صفحة {toArabicDigits(page)} من {toArabicDigits(pageCount)}</span>
          <button disabled={page >= pageCount} onClick={() => setParams({ page: String(page + 1) })} className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 disabled:opacity-40">
            التالي <ChevronLeft className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3.5 py-3 text-[13.5px] align-middle ${className ?? ""}`}>{children}</td>;
}
