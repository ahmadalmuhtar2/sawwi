"use client";

// The PUBLIC templates gallery — the same backend-driven browser the dashboard
// new-site flow uses (search / tag filter / infinite scroll, all server-side),
// but wrapped in its own marketing chrome so anyone can browse without an
// account. "معاينة" opens the real full-page template; "استخدام القالب" sends
// the visitor into site creation (/dashboard/sites/new?template=…), which routes
// them through sign-in and lands them on the wizard with the template preselected.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Moon, Sun } from "lucide-react";
import { Logo } from "@/components/logo";
import { useTheme } from "@/components/dashboard/theme-toggle";
import { Tooltip } from "@/components/ui/tooltip";
import { TemplatesGallery } from "./templates-gallery";

export function PublicTemplatesBrowser() {
  const router = useRouter();
  const { isDark, toggle } = useTheme();

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/" aria-label="سوّي — الصفحة الرئيسية" className="flex h-7 items-center">
            <Logo variant="full" className="h-7" />
          </Link>
          <div className="ms-auto flex items-center gap-1.5">
            <Tooltip label={isDark ? "الوضع الفاتح" : "الوضع الداكن"}>
              <button
                type="button"
                onClick={toggle}
                aria-label={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
                className="grid size-9 place-items-center rounded-md border border-line text-muted transition hover:text-ink cursor-pointer"
              >
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
            </Tooltip>
            <Link
              href="/login"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3 text-sm font-medium text-ink transition hover:bg-surface"
            >
              <LogIn className="size-4" /> دخول
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6">
        <TemplatesGallery onUse={(t) => router.push(`/dashboard/sites/new?template=${t.key}`)} />
      </main>
    </div>
  );
}
