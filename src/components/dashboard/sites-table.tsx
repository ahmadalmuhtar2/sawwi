"use client";

// The websites table. Filtering is URL-driven and applied SERVER-SIDE: clicking a
// chip writes `?filter=<key>`, the server component re-renders the filtered rows,
// and this table just displays what it's handed (`rows` are already filtered).

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { SiteActionsMenu } from "@/components/dashboard/site-actions-menu";
import { FilterChips, SiteThumb } from "@/components/dashboard/ui";
import { Tooltip } from "@/components/ui/tooltip";
import {
  type SiteRow,
  type SiteFilterKey,
  SITE_FILTER_LABEL,
} from "@/components/dashboard/sites-filter";
import { siteUrl } from "@/lib/site-url";
import { cn } from "@/lib/cn";

export type { SiteRow };

// Arabic-Indic numerals with thousands separators, e.g. ١٬٤٠٢.
const arCount = (n: number) => n.toLocaleString("ar-EG-u-nu-arab");

export function SitesTable({
  rows,
  available,
  active,
}: {
  /** Already filtered server-side to the active category. */
  rows: SiteRow[];
  /** Which chips to show (categories that exist in the full set). */
  available: SiteFilterKey[];
  active: SiteFilterKey;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setFilter(key: SiteFilterKey) {
    const params = new URLSearchParams(searchParams);
    if (key === "all") params.delete("filter");
    else params.set("filter", key);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const options = available.map((k) => ({ key: k, label: SITE_FILTER_LABEL[k] }));

  return (
    <div>
      <FilterChips options={options} value={active} onChange={setFilter} className="mb-4" />

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th>الموقع</Th>
                <Th>القالب</Th>
                <Th>الحالة</Th>
                <Th>الزيارات</Th>
                <Th>ينتهي</Th>
                <Th className="w-0" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-line transition-colors last:border-0 hover:bg-black/2 dark:hover:bg-white/3"
                >
                  <Td>
                    <Link href={`/dashboard/sites/${r.id}`} className="flex items-center gap-3">
                      <SiteThumb name={r.businessName} logoUrl={r.logoUrl} />
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] text-ink">{r.businessName}</span>
                        <span className="block truncate font-mono text-[11.5px] text-faint" dir="ltr">
                          {r.host}
                        </span>
                      </span>
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{r.templateLabel}</Td>
                  <Td>
                    <StatusBadge status={r.status} />
                  </Td>
                  <Td className="tabular-nums text-muted">
                    {r.visits > 0 ? arCount(r.visits) : <span className="text-faint">—</span>}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {r.expiry ? (
                      <span
                        className={cn(
                          r.expiry.status === "expired"
                            ? "text-danger"
                            : r.expiry.status === "expiring"
                              ? "text-warn"
                              : "text-muted",
                        )}
                      >
                        {r.expiry.dateLabel}
                      </span>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </Td>
                  <Td className="text-end">
                    <div className="flex items-center justify-end gap-1">
                      {r.status === "published" && (
                        <Tooltip label="فتح الموقع المنشور">
                          <a
                            href={siteUrl(r.slug)}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="فتح الموقع المنشور"
                            className="rounded-md p-1.5 text-muted transition hover:bg-black/4 hover:text-ink cursor-pointer dark:hover:bg-white/6"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        </Tooltip>
                      )}
                      <SiteActionsMenu
                        site={{ id: r.id, slug: r.slug, businessName: r.businessName, status: r.status }}
                        canDelete={r.canDelete}
                        unread={r.unread}
                        templateKey={r.templateKey}
                      />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length === 0 && (
        <p className="px-1 py-8 text-center text-[13.5px] text-muted">لا مواقع بهذا التصنيف.</p>
      )}
    </div>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "border-b border-line px-4.5 py-2.75 text-start text-[11px] font-normal tracking-wide whitespace-nowrap text-faint",
        className,
      )}
    >
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4.5 py-3.25 text-[13.5px] align-middle", className)}>{children}</td>;
}
