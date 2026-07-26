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

  // Persist the collapsed state across navigations/sessions.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate persisted UI pref on mount
    setCollapsed(localStorage.getItem("sawwi_sidebar") === "collapsed");
  }, []);
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
                <Logo className="h-8 w-auto" />
              </Link>
            )}
            <button
              onClick={toggle}
              title={collapsed ? "توسيع القائمة" : "طيّ القائمة"}
              aria-label={collapsed ? "توسيع القائمة" : "طيّ القائمة"}
              className="rounded-md p-1.5 text-muted transition hover:bg-black/[0.04] hover:text-ink cursor-pointer"
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
                      : "text-muted hover:bg-black/[0.03] hover:text-ink",
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
                "flex w-full items-center gap-3 rounded-md py-2.5 text-sm text-muted transition hover:bg-black/[0.03] hover:text-danger cursor-pointer",
                collapsed ? "justify-center px-0" : "px-3",
              )}
            >
              <LogOut className="size-[18px]" />
              {!collapsed && "تسجيل الخروج"}
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-5">
            <div className="flex items-center gap-3">
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
