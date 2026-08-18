"use client";

// The brokered-jobs log — «الشغلات». Recorded by hand from day one so ratings
// always trace back to a real job. Filter by status; "سجّل مطابقة" opens the
// record-a-match form.

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { formatArabicDate } from "@/lib/expiry-format";
import { JOB_STATUS_LABEL, JOB_STATUS_ORDER, type JobStatus } from "@/shared/providers";
import { PageHeader, Panel, FilterChips, toArabicDigits } from "@/components/dashboard/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface JobRow {
  id: string;
  providerName: string;
  customerName: string;
  category: string;
  area: string;
  status: JobStatus;
  matchedAt: string;
  ratingScore: number | null;
}

const STATUS_TONE: Record<JobStatus, "neutral" | "accent" | "warn" | "danger"> = {
  MATCHED: "neutral",
  IN_PROGRESS: "warn",
  COMPLETED: "accent",
  CANCELLED: "danger",
  DISPUTED: "danger",
};

export function JobsList({
  siteId, businessName, rows, total, page, pageSize, filters, canManage,
}: {
  siteId: string;
  businessName: string;
  rows: JobRow[];
  total: number;
  page: number;
  pageSize: number;
  filters: { status: string };
  canManage: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();

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
      <PageHeader title="الشغلات" subtitle={businessName}>
        {canManage && (
          <Link href={`/dashboard/sites/${siteId}/jobs/new`}>
            <Button className="gap-2"><Plus className="size-4" /> سجّل مطابقة</Button>
          </Link>
        )}
      </PageHeader>

      <FilterChips
        className="mb-4"
        options={[{ key: "all", label: "الكل" }, ...JOB_STATUS_ORDER.map((s) => ({ key: s, label: JOB_STATUS_LABEL[s] }))]}
        value={filters.status}
        onChange={(k) => setParams({ status: k === "all" ? "" : k })}
      />

      <Panel>
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center text-[14px] text-muted">لا شغلات مسجّلة بعد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["التاريخ", "المزوّد", "الزبون", "الخدمة", "المنطقة", "الحالة", "التقييم"].map((h) => (
                    <th key={h} className="border-b border-line px-3.5 py-2.75 text-start text-[11px] font-normal whitespace-nowrap text-faint">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line transition-colors last:border-0 hover:bg-black/2 dark:hover:bg-white/3">
                    <Td className="whitespace-nowrap text-muted">{formatArabicDate(new Date(r.matchedAt))}</Td>
                    <Td>
                      <Link href={`/dashboard/sites/${siteId}/jobs/${r.id}`} className="font-medium text-ink hover:underline">{r.providerName}</Link>
                    </Td>
                    <Td className="text-muted">{r.customerName}</Td>
                    <Td className="text-muted">{r.category}</Td>
                    <Td className="text-muted">{r.area}</Td>
                    <Td><Badge tone={STATUS_TONE[r.status]}>{JOB_STATUS_LABEL[r.status]}</Badge></Td>
                    <Td>
                      {r.ratingScore != null ? (
                        <span className="inline-flex items-center gap-1 text-muted"><Star className="size-3.5 fill-amber-400 text-amber-400" /> {r.ratingScore.toLocaleString("ar-EG")}</span>
                      ) : <span className="text-faint">—</span>}
                    </Td>
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
