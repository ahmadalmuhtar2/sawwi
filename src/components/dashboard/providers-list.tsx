"use client";

// The provider directory — «المزوّدين». URL-driven filters + server-side paging,
// mirroring the leads inbox. Providers are created by converting an ACCEPTED
// provider submission (button on the submission detail), so there's no "add" here.

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Star, BadgeCheck, Globe } from "lucide-react";
import {
  PROVIDER_STATUS_LABEL,
  PROVIDER_STATUS_ORDER,
  type ProviderStatus,
} from "@/shared/providers";
import { PageHeader, Panel, FilterChips, toArabicDigits } from "@/components/dashboard/ui";
import { MenuSelect } from "@/components/ui/dropdown";
import { Badge } from "@/components/ui/badge";

export interface ProviderRow {
  id: string;
  name: string;
  displayName: string | null;
  status: ProviderStatus;
  categories: string[];
  areas: string[];
  verified: boolean;
  profilePublic: boolean;
  jobsCompleted: number;
  ratingCount: number;
  ratingAvg: number | null;
}

const STATUS_TONE: Record<ProviderStatus, "neutral" | "accent" | "warn" | "danger"> = {
  DRAFT: "neutral",
  ACTIVE: "accent",
  PAUSED: "warn",
  REMOVED: "danger",
};

const ar = (n: number) => n.toLocaleString("ar-EG");

export function ProvidersList({
  siteId, businessName, rows, total, page, pageSize, categories, filters,
}: {
  siteId: string;
  businessName: string;
  rows: ProviderRow[];
  total: number;
  page: number;
  pageSize: number;
  categories: string[];
  filters: { status: string; category: string; q: string };
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
      <PageHeader title="المزوّدون" subtitle={businessName} />

      <FilterChips
        className="mb-3"
        options={[{ key: "all", label: "الكل" }, ...PROVIDER_STATUS_ORDER.map((s) => ({ key: s, label: PROVIDER_STATUS_LABEL[s] }))]}
        value={filters.status}
        onChange={(k) => setParams({ status: k === "all" ? "" : k })}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <MenuSelect
          value={filters.category || "all"}
          onChange={(v) => setParams({ category: v === "all" ? "" : v })}
          options={[{ value: "all", label: "كل الخدمات" }, ...categories.map((c) => ({ value: c, label: c }))]}
        />
        <form
          onSubmit={(e) => { e.preventDefault(); setParams({ q: term.trim() }); }}
          className="flex min-w-52 flex-1 items-center gap-2 rounded-md border border-line px-3 py-2"
        >
          <Search className="size-4 text-faint" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="ابحث بالاسم أو الرقم" className="w-full bg-transparent text-[13.5px] outline-none" />
        </form>
      </div>

      <Panel>
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center text-[14px] text-muted">
            لا مزوّدين بعد. حوّل طلب مزوّد مقبول من صفحة الطلبات لإضافة أول مزوّد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["الاسم", "الحالة", "الخدمات", "شغلات منجزة", "التقييم", "عام"].map((h) => (
                    <th key={h} className="border-b border-line px-3.5 py-2.75 text-start text-[11px] font-normal whitespace-nowrap text-faint">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line transition-colors last:border-0 hover:bg-black/2 dark:hover:bg-white/3">
                    <Td>
                      <Link href={`/dashboard/sites/${siteId}/providers/${r.id}`} className="inline-flex items-center gap-1.5 font-medium text-ink hover:underline">
                        {r.displayName?.trim() || r.name}
                        {r.verified && <BadgeCheck className="size-3.5 text-accent-300" aria-label="موثّق" />}
                      </Link>
                      {r.displayName?.trim() && <div className="text-[11.5px] text-faint">{r.name}</div>}
                    </Td>
                    <Td><Badge tone={STATUS_TONE[r.status]}>{PROVIDER_STATUS_LABEL[r.status]}</Badge></Td>
                    <Td className="text-muted">{r.categories.slice(0, 3).join("، ") || "—"}</Td>
                    <Td className="tabular-nums text-muted">{ar(r.jobsCompleted)}</Td>
                    <Td className="text-muted">
                      {r.ratingCount > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          {r.ratingAvg != null ? r.ratingAvg.toLocaleString("ar-EG", { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : "—"}
                          <span className="text-faint">({ar(r.ratingCount)})</span>
                        </span>
                      ) : <span className="text-faint">—</span>}
                    </Td>
                    <Td>{r.profilePublic ? <Globe className="size-4 text-accent-300" aria-label="ملف عام" /> : <span className="text-faint">—</span>}</Td>
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
