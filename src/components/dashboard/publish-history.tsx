"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, RotateCcw, History } from "lucide-react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Snapshot {
  id: string;
  version: number;
  author: string;
  createdAt: string; // ISO
}

const dateFmt = new Intl.DateTimeFormat("ar-SY", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function PublishHistory({
  siteId,
  items,
}: {
  siteId: string;
  items: Snapshot[];
}) {
  const toast = useToast();
  const router = useRouter();
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  // The highest version is what the live site currently serves.
  const currentVersion = items.length ? Math.max(...items.map((s) => s.version)) : null;

  async function rollback(snapshotId: string) {
    setRollingBack(snapshotId);
    try {
      await api.post(`/api/sites/${siteId}/snapshots/${snapshotId}/rollback`, {});
      toast("تمت إعادة النشر من هذه النسخة ✓");
      router.refresh();
    } catch {
      toast("تعذّرت إعادة النشر", "error");
    }
    setRollingBack(null);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/dashboard/sites/${siteId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowRight className="size-4" /> العودة إلى المُنشئ
      </Link>

      <h1 className="text-2xl font-extrabold text-ink">سجل النشر</h1>
      <p className="mt-1 text-sm text-muted">
        كل عملية نشر تُنشئ نسخة محفوظة. يمكنك إعادة النشر من أي نسخة سابقة.
      </p>

      <Card className="mt-6 p-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <History className="size-8 text-faint" />
            <p className="text-sm text-muted">لم يُنشر هذا الموقع بعد.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((s) => {
              const isCurrent = s.version === currentVersion;
              return (
                <li key={s.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink">النسخة {s.version}</span>
                      {isCurrent && (
                        <Badge tone="accent" dot>منشورة الآن</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {dateFmt.format(new Date(s.createdAt))} · {s.author}
                    </p>
                  </div>
                  {!isCurrent && (
                    <Button
                      variant="ghost"
                      className="shrink-0 gap-1.5"
                      loading={rollingBack === s.id}
                      onClick={() => rollback(s.id)}
                    >
                      <RotateCcw className="size-4" /> إعادة النشر
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
