"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, CreditCard, LogOut, ChevronDown } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { Avatar } from "@/components/ui/feedback";
import { ThemeMenuItem } from "@/components/dashboard/theme-toggle";

interface MenuUser {
  name: string;
  email: string;
  image?: string | null;
}

export function UserMenu({ user, showBilling = true }: { user: MenuUser; showBilling?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  const displayName = user.name || "مستخدم";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-md p-1 transition hover:bg-black/[0.03] dark:hover:bg-white/5 cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="hidden text-end sm:block">
          <p className="text-sm font-medium text-ink">{displayName}</p>
          <p className="text-xs text-faint" dir="ltr">{user.email}</p>
        </div>
        <Avatar name={user.name || user.email} src={user.image} />
        <ChevronDown className={`size-4 text-faint transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 z-50 mt-2 w-60 overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
        >
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate text-sm font-medium text-ink">{displayName}</p>
            <p className="truncate text-xs text-faint" dir="ltr">{user.email}</p>
          </div>
          <div className="p-1">
            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink transition hover:bg-black/[0.04] dark:hover:bg-white/6"
            >
              <User className="size-4 text-muted" /> الملف الشخصي
            </Link>
            {/* Billing is reseller/owner-only. Collaborators (site-access users)
                don't manage payments — they see each site's expiry on the sites
                list instead. */}
            {showBilling && (
              <Link
                href="/dashboard/billing"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink transition hover:bg-black/[0.04] dark:hover:bg-white/6"
              >
                <CreditCard className="size-4 text-muted" /> الفوترة والاشتراك
              </Link>
            )}
            <ThemeMenuItem />
          </div>
          <div className="border-t border-line p-1">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-danger transition hover:bg-danger-100/50 cursor-pointer"
            >
              <LogOut className="size-4" /> تسجيل الخروج
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
