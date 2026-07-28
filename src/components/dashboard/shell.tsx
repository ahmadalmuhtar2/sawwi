"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Users,
  Wallet,
  CreditCard,
  LogOut,
  PanelLeft,
  Menu,
  X,
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/dashboard/user-menu";
import { WorkspaceMenu } from "@/components/dashboard/workspace-menu";
import { ToastProvider } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

export interface ShellUser {
  name: string;
  email: string;
  image?: string | null;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function DashboardShell({
  user,
  workspaces,
  activeWorkspaceId,
  isOwner,
  isAdmin,
  children,
}: {
  user: ShellUser;
  workspaces: { id: string; name: string }[];
  activeWorkspaceId: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  // Mobile: the sidebar becomes a slide-in drawer (there's no room to pin it).
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist the collapsed state across navigations/sessions.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate persisted UI pref on mount
    setCollapsed(localStorage.getItem("sawwi_sidebar") === "collapsed");
  }, []);
  // Close the mobile drawer whenever the route changes (a nav link was tapped).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close drawer on navigation
    setMobileOpen(false);
  }, [pathname]);
  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sawwi_sidebar", next ? "collapsed" : "open");
      return next;
    });
  }

  const nav: NavItem[] = [
    { href: "/dashboard", label: "الرئيسية", icon: <LayoutDashboard className="size-[18px]" /> },
    { href: "/dashboard/sites", label: "المواقع", icon: <Globe className="size-[18px]" /> },
  ];
  if (isOwner) {
    nav.push({ href: "/dashboard/billing", label: "الفوترة", icon: <Wallet className="size-[18px]" /> });
    nav.push({ href: "/dashboard/members", label: "الأعضاء", icon: <Users className="size-[18px]" /> });
  }
  if (isAdmin)
    nav.push({ href: "/dashboard/admin", label: "الإدارة", icon: <CreditCard className="size-[18px]" /> });

  async function logout() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <ToastProvider>
      <div className="flex min-h-dvh bg-bg">
        {/* Sidebar */}
        <aside
          className={cn(
            "hidden shrink-0 flex-col border-e border-line bg-surface transition-[width] duration-200 md:flex",
            collapsed ? "w-16" : "w-64",
          )}
        >
          <div
            className={cn(
              "flex h-16 items-center border-b border-line",
              collapsed ? "justify-center px-0" : "justify-between px-4",
            )}
          >
            {!collapsed && (
              <Link href="/dashboard">
                {/* Color logo on light, white logo on dark — CSS-toggled so it
                    follows the theme with no flash. */}
                <Logo variant="full" className="h-11 w-auto dark:hidden" />
                <Logo variant="mono-white" className="hidden h-11 w-auto dark:block" />
              </Link>
            )}
            <button
              onClick={toggle}
              title={collapsed ? "توسيع القائمة" : "طيّ القائمة"}
              aria-label={collapsed ? "توسيع القائمة" : "طيّ القائمة"}
              className="rounded-md p-1.5 text-muted transition hover:bg-black/[0.04] hover:text-ink cursor-pointer dark:hover:bg-white/6"
            >
              <PanelLeft className="size-[18px]" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {nav.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md py-2.5 text-sm font-medium transition",
                    collapsed ? "justify-center px-0" : "px-3",
                    active
                      ? "bg-accent-100 text-accent-900"
                      : "text-muted hover:bg-black/[0.03] hover:text-ink dark:hover:bg-white/5",
                  )}
                >
                  {active && (
                    <span className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-accent" />
                  )}
                  {item.icon}
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-line p-3">
            <button
              onClick={logout}
              title={collapsed ? "تسجيل الخروج" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-md py-2.5 text-sm text-muted transition hover:bg-black/[0.03] hover:text-danger cursor-pointer dark:hover:bg-white/5",
                collapsed ? "justify-center px-0" : "px-3",
              )}
            >
              <LogOut className="size-[18px]" />
              {!collapsed && "تسجيل الخروج"}
            </button>
          </div>
        </aside>

        {/* Mobile drawer — the sidebar as a slide-in panel (below md only) */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <aside className="absolute inset-y-0 start-0 flex w-64 max-w-[82%] flex-col border-e border-line bg-surface shadow-xl">
              <div className="flex h-16 items-center justify-between border-b border-line px-4">
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Logo variant="full" className="h-11 w-auto dark:hidden" />
                  <Logo variant="mono-white" className="hidden h-11 w-auto dark:block" />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="إغلاق"
                  className="rounded-md p-1.5 text-muted transition hover:bg-black/[0.04] hover:text-ink cursor-pointer dark:hover:bg-white/6"
                >
                  <X className="size-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 p-3">
                {nav.map((item) => {
                  const active =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                        active
                          ? "bg-accent-100 text-accent-900"
                          : "text-muted hover:bg-black/[0.03] hover:text-ink dark:hover:bg-white/5",
                      )}
                    >
                      {active && <span className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-accent" />}
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-line p-3">
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted transition hover:bg-black/[0.03] hover:text-danger cursor-pointer dark:hover:bg-white/5"
                >
                  <LogOut className="size-[18px]" />
                  تسجيل الخروج
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-4 md:px-5">
            <div className="flex items-center gap-2 md:gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="القائمة"
                className="rounded-md p-1.5 text-muted transition hover:bg-black/[0.04] hover:text-ink cursor-pointer md:hidden dark:hover:bg-white/6"
              >
                <Menu className="size-5" />
              </button>
              {workspaces.length > 0 && activeWorkspaceId ? (
                <WorkspaceMenu
                  workspaces={workspaces}
                  activeId={activeWorkspaceId}
                  isOwner={isOwner}
                />
              ) : (
                <span className="text-sm text-muted">مواقعي</span>
              )}
            </div>
            <UserMenu user={user} />
          </header>

          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
