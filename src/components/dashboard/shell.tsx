"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Wallet,
  CreditCard,
  Inbox,
  LogOut,
  PanelLeft,
  Menu,
  X,
  LayoutGrid,
  Users,
  Settings,
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/dashboard/user-menu";
import { WorkspaceMenu } from "@/components/dashboard/workspace-menu";
import { PwaControls } from "@/components/dashboard/pwa-controls";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { ToastProvider } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
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
interface NavGroup {
  label?: string;
  items: NavItem[];
}

const ICON = "size-[18px]";

export function DashboardShell({
  user,
  workspaces,
  activeWorkspaceId,
  isOwner,
  isAdmin,
  isReseller,
  children,
}: {
  user: ShellUser;
  workspaces: { id: string; name: string }[];
  activeWorkspaceId: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  /** Reseller workspace owner — gets billing/members/switcher/create-site. */
  isReseller?: boolean;
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

  // Billing/members are reseller-only. Direct owners (isOwner but kind=direct)
  // and business owners never see them. Fall back to isOwner if the flag wasn't
  // supplied (defensive for any caller not yet passing it).
  const showResellerNav = isReseller ?? isOwner;

  // Grouped nav — a section header only renders if its group is non-empty, so a
  // business owner just sees "المواقع" with no headers at all.
  const main: NavItem[] = [];
  if (showResellerNav || isAdmin) {
    main.push({ href: "/dashboard", label: "لوحة التحكم", icon: <LayoutDashboard className={ICON} /> });
  }
  main.push({ href: "/dashboard/sites", label: "المواقع", icon: <Globe className={ICON} /> });
  if (showResellerNav) {
    main.push({ href: "/dashboard/billing", label: "الفوترة", icon: <Wallet className={ICON} /> });
  }

  const groups: NavGroup[] = [{ items: main }];
  if (showResellerNav) {
    groups.push({
      label: "مساحة العمل",
      items: [
        { href: "/dashboard/templates", label: "القوالب", icon: <LayoutGrid className={ICON} /> },
        { href: "/dashboard/members", label: "الأعضاء", icon: <Users className={ICON} /> },
        { href: "/dashboard/workspace", label: "الإعدادات", icon: <Settings className={ICON} /> },
      ],
    });
  }
  if (isAdmin) {
    groups.push({
      label: "إدارة المنصّة",
      items: [
        { href: "/dashboard/leads", label: "طلبات المعاينة", icon: <Inbox className={ICON} /> },
        { href: "/dashboard/admin", label: "الإدارة", icon: <CreditCard className={ICON} /> },
      ],
    });
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  async function logout() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  // Nav renderer shared by the pinned sidebar and the mobile drawer. `mini`
  // collapses to icon-only; `onNavigate` closes the drawer on tap.
  function renderNav(mini: boolean, onNavigate?: () => void) {
    return (
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {groups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "pt-2" : undefined}>
            {group.label && !mini && (
              <div className="px-2.5 pb-1.5 pt-3 text-[10.5px] tracking-[0.08em] text-faint">{group.label}</div>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Tooltip key={item.href} label={mini ? item.label : ""} side="left">
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-[9px] py-2.5 text-[14px] transition-colors",
                      mini ? "justify-center px-0" : "px-2.5",
                      active
                        ? "bg-neutral-100 text-accent-300"
                        : "text-muted hover:bg-black/[0.03] hover:text-ink dark:hover:bg-white/5",
                    )}
                  >
                    <span className="grid w-5 shrink-0 place-items-center">{item.icon}</span>
                    {!mini && <span className="whitespace-nowrap">{item.label}</span>}
                  </Link>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </nav>
    );
  }

  return (
    <ToastProvider>
      {/* Fixed viewport height so the sidebar + header stay put and only <main>
          scrolls (h-dvh + overflow-hidden makes main the scroll container). */}
      <div className="flex h-dvh overflow-hidden bg-bg">
        {/* Sidebar (pinned, ≥ md). In RTL it sits on the right — the border is on
            the inline-start (its left edge). */}
        <aside
          className={cn(
            "hidden shrink-0 flex-col border-s border-line bg-surface transition-[width] duration-300 md:flex",
            collapsed ? "w-[66px]" : "w-64",
          )}
        >
          <div className={cn("flex h-16 items-center border-b border-line", collapsed ? "justify-center px-0" : "px-4")}>
            <Link href="/dashboard" aria-label="لوحة التحكم">
              <Logo variant={collapsed ? "mark" : "full"} className={collapsed ? "h-8 w-auto" : "h-11 w-auto"} />
            </Link>
          </div>

          {renderNav(collapsed)}

          <div className="space-y-1 border-t border-line p-3">
            <PwaControls collapsed={collapsed} />
            <Tooltip label={collapsed ? "تسجيل الخروج" : ""} side="left">
              <button
                onClick={logout}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[9px] py-2.5 text-[14px] text-muted transition-colors hover:bg-black/[0.03] hover:text-danger cursor-pointer dark:hover:bg-white/5",
                  collapsed ? "justify-center px-0" : "px-2.5",
                )}
              >
                <span className="grid w-5 shrink-0 place-items-center"><LogOut className={ICON} /></span>
                {!collapsed && "تسجيل الخروج"}
              </button>
            </Tooltip>
            <Tooltip label={collapsed ? "توسيع القائمة" : ""} side="left">
              <button
                onClick={toggle}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[9px] py-2.5 text-[14px] text-muted transition-colors hover:bg-black/[0.03] hover:text-ink cursor-pointer dark:hover:bg-white/5",
                  collapsed ? "justify-center px-0" : "px-2.5",
                )}
              >
                <span className="grid w-5 shrink-0 place-items-center"><PanelLeft className={cn(ICON, collapsed && "rotate-180")} /></span>
                {!collapsed && "طيّ القائمة"}
              </button>
            </Tooltip>
          </div>
        </aside>

        {/* Mobile drawer — the sidebar as a slide-in panel (below md only) */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-hidden />
            {/* start = right in RTL, so the drawer slides in from the right */}
            <aside className="absolute inset-y-0 start-0 flex w-64 max-w-[82%] flex-col border-s border-line bg-surface shadow-xl">
              <div className="flex h-16 items-center justify-between border-b border-line px-4">
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Logo variant="full" className="h-11 w-auto" />
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
              {renderNav(false, () => setMobileOpen(false))}
              <div className="space-y-1 border-t border-line p-3">
                <PwaControls />
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-[9px] px-2.5 py-2.5 text-[14px] text-muted transition-colors hover:bg-black/[0.03] hover:text-danger cursor-pointer dark:hover:bg-white/5"
                >
                  <span className="grid w-5 shrink-0 place-items-center"><LogOut className={ICON} /></span>
                  تسجيل الخروج
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-line bg-surface/80 px-4 backdrop-blur md:px-5">
            <div className="flex min-w-0 items-center gap-2 md:gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="القائمة"
                className="rounded-md p-1.5 text-muted transition hover:bg-black/[0.04] hover:text-ink cursor-pointer md:hidden dark:hover:bg-white/6"
              >
                <Menu className="size-5" />
              </button>
              {(isReseller ?? isOwner) || isAdmin ? (
                workspaces.length > 0 && activeWorkspaceId ? (
                  <WorkspaceMenu workspaces={workspaces} activeId={activeWorkspaceId} isOwner={isOwner} />
                ) : (
                  <span className="text-sm text-muted">مواقعي</span>
                )
              ) : (
                <span className="text-sm font-semibold text-ink">موقعي</span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1 md:gap-2">
              <NotificationBell />
              <UserMenu user={user} showBilling={showResellerNav} />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-5 py-7 md:px-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
