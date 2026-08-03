// Admin CRM service. Platform admins run the whole business here: provision
// resellers & direct owners, browse users/workspaces/sites/payments, and drive
// payment + commission statuses. EVERY function asserts platformRole === admin;
// this is the only place cross-tenant reads/writes are allowed.

import { getPrisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { errors } from "@/shared/errors";
import type { SessionClaims } from "@/server/access/access.rules";
import type { WorkspaceKind, PaymentStatus } from "@/shared/domain";
import { CURRENCY_KEYS } from "@/shared/currency";
import type { CommissionStatus, PaymentMethod } from "@/generated/prisma/enums";

function assertAdmin(claims: SessionClaims) {
  if (claims.platformRole !== "admin") {
    throw errors.forbidden("هذه الصفحة للمشرف فقط");
  }
}

const CAP = 500; // simple guard; the CRM filters/sorts client-side over this window

export async function adminOverview(claims: SessionClaims) {
  assertAdmin(claims);
  const prisma = getPrisma();
  const now = new Date();
  const [users, workspaces, sites, activeSubs, expiredSubs, owed] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.site.count(),
    prisma.subscription.count({ where: { expiry: { gt: now } } }),
    prisma.subscription.count({ where: { expiry: { lte: now } } }),
    prisma.commissionEntry.aggregate({ where: { status: "owed" }, _sum: { amount: true } }),
  ]);
  return {
    users,
    workspaces,
    sites,
    activeSubs,
    expiredSubs,
    commissionsOwed: owed._sum.amount ?? 0,
  };
}

// Server-side query: free-text search + per-tab filters + sort. Filtering the
// WHOLE dataset in the DB (not a client window) — see the admin CRM.
export interface AdminQuery {
  q?: string;
  sort?: string;
  dir?: "asc" | "desc";
  role?: string; // users
  kind?: string; // users, workspaces
  status?: string; // sites, payments
  served?: string; // sites: "yes" | "no"
  currency?: string; // payments
  method?: string; // payments
  commission?: string; // payments: "settled" | "owed"
}

const dirOf = (q: AdminQuery): "asc" | "desc" => (q.dir === "asc" ? "asc" : "desc");
const like = (q: string) => ({ contains: q, mode: "insensitive" as const });

export async function listUsers(claims: SessionClaims, query: AdminQuery = {}) {
  assertAdmin(claims);
  const q = query.q?.trim();
  const dir = dirOf(query);
  return getPrisma().user.findMany({
    take: CAP,
    where: {
      AND: [
        q ? { OR: [{ name: like(q) }, { email: like(q) }] } : {},
        query.role === "admin" || query.role === "user" ? { platformRole: query.role } : {},
        query.kind === "reseller" || query.kind === "direct"
          ? { memberships: { some: { workspace: { kind: query.kind } } } }
          : {},
      ],
    },
    orderBy:
      query.sort === "name" ? { name: dir }
      : query.sort === "email" ? { email: dir }
      : query.sort === "endDate" ? { endDate: dir }
      : { createdAt: dir },
    select: {
      id: true, email: true, name: true, platformRole: true, endDate: true, createdAt: true,
      memberships: { select: { role: true, workspace: { select: { id: true, name: true, kind: true } } } },
    },
  });
}

export async function listWorkspaces(claims: SessionClaims, query: AdminQuery = {}) {
  assertAdmin(claims);
  const q = query.q?.trim();
  const dir = dirOf(query);
  return getPrisma().workspace.findMany({
    take: CAP,
    where: {
      AND: [
        q ? { OR: [{ name: like(q) }, { contactName: like(q) }, { contactWhatsapp: like(q) }] } : {},
        query.kind === "reseller" || query.kind === "direct" ? { kind: query.kind } : {},
      ],
    },
    orderBy:
      query.sort === "name" ? { name: dir }
      : query.sort === "pct" ? { commissionPct: dir }
      : query.sort === "sites" ? { sites: { _count: dir } }
      : { createdAt: dir },
    select: {
      id: true, name: true, kind: true, commissionPct: true, contactName: true, contactWhatsapp: true, createdAt: true,
      _count: { select: { sites: true, members: true } },
    },
  });
}

export async function listSitesAdmin(claims: SessionClaims, query: AdminQuery = {}) {
  assertAdmin(claims);
  const now = new Date();
  const q = query.q?.trim();
  const dir = dirOf(query);
  // "served" = published AND not paused AND (no sub OR paid-through).
  const servedWhere = {
    status: "published" as const,
    maintenanceMode: false,
    OR: [{ subscription: { is: null } }, { subscription: { expiry: { gt: now } } }],
  };
  const sites = await getPrisma().site.findMany({
    take: CAP,
    where: {
      AND: [
        q ? { OR: [{ businessName: like(q) }, { slug: like(q) }] } : {},
        query.status === "draft" || query.status === "published" || query.status === "suspended"
          ? { status: query.status }
          : {},
        query.served === "yes" ? servedWhere : query.served === "no" ? { NOT: servedWhere } : {},
      ],
    },
    orderBy:
      query.sort === "biz" ? { businessName: dir }
      : query.sort === "slug" ? { slug: dir }
      : query.sort === "status" ? { status: dir }
      : query.sort === "expiry" ? { subscription: { expiry: dir } }
      : { createdAt: dir },
    select: {
      id: true, businessName: true, slug: true, status: true, maintenanceMode: true, createdAt: true,
      workspace: { select: { name: true, kind: true } },
      subscription: { select: { expiry: true } },
    },
  });
  return sites.map((s) => ({
    ...s,
    served: s.status === "published" && !s.maintenanceMode && (!s.subscription || s.subscription.expiry > now),
  }));
}

export async function listPaymentsAdmin(claims: SessionClaims, query: AdminQuery = {}) {
  assertAdmin(claims);
  const q = query.q?.trim();
  const dir = dirOf(query);
  const PS: PaymentStatus[] = ["pending", "paid", "checked", "stopped", "refunded"];
  const statusFilter = PS.find((s) => s === query.status);
  const currencyFilter = CURRENCY_KEYS.find((c) => c === query.currency);
  const METHODS: PaymentMethod[] = ["cash", "mobile_money", "bank_transfer", "other"];
  const methodFilter = METHODS.find((m) => m === query.method);
  const rows = await getPrisma().paymentRecord.findMany({
    take: CAP,
    where: {
      AND: [
        q
          ? {
              OR: [
                { payerName: like(q) },
                { subscription: { site: { businessName: like(q) } } },
                { subscription: { site: { workspace: { name: like(q) } } } },
              ],
            }
          : {},
        statusFilter ? { status: statusFilter } : {},
        currencyFilter ? { currency: currencyFilter } : {},
        methodFilter ? { method: methodFilter } : {},
        query.commission === "settled" ? { commission: { status: "settled" } }
          : query.commission === "owed" ? { commission: { status: "owed" } }
          : {},
      ],
    },
    orderBy:
      query.sort === "amount" ? { amount: dir }
      : query.sort === "method" ? { method: dir }
      : { createdAt: dir },
    select: {
      id: true, amount: true, currency: true, method: true, status: true, payerName: true, createdAt: true,
      subscription: { select: { site: { select: { businessName: true, workspace: { select: { name: true } } } } } },
      commission: { select: { id: true, amount: true, status: true } },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    amount: p.amount,
    currency: p.currency,
    method: p.method,
    status: p.status,
    payerName: p.payerName,
    createdAt: p.createdAt,
    businessName: p.subscription?.site.businessName ?? "—",
    workspaceName: p.subscription?.site.workspace.name ?? "—",
    commission: p.commission,
  }));
}

/* ─────────────────────────── mutations ─────────────────────────── */

export interface ProvisionInput {
  email: string;
  name: string;
  kind: WorkspaceKind;
  workspaceName?: string;
  commissionPct?: number;
  contactName?: string;
  contactWhatsapp?: string;
  endDate?: string | null; // direct-tier hard expiry (ISO)
}

export async function provisionAccount(claims: SessionClaims, input: ProvisionInput) {
  assertAdmin(claims);
  const prisma = getPrisma();
  const email = input.email.trim().toLowerCase();

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    throw errors.conflict("هذا البريد مستخدم بالفعل");
  }

  // emailVerified: true — the admin vouches for the account, so the owner can
  // sign in immediately after setting their password via the emailed link.
  const user = await prisma.user.create({
    data: {
      email,
      name: input.name,
      emailVerified: true,
      platformRole: "user",
      endDate: input.kind === "direct" && input.endDate ? new Date(input.endDate) : null,
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: input.workspaceName?.trim() || input.name,
      kind: input.kind,
      commissionPct: input.kind === "reseller" ? (input.commissionPct ?? 0) : 0,
      contactName: input.contactName?.trim() || null,
      contactWhatsapp: input.contactWhatsapp?.trim() || null,
      members: { create: { userId: user.id, role: "owner" } },
    },
  });

  // Email the "set your password" link (Better Auth reset flow → reset-password
  // page → reset-and-login). Failures here don't roll back the account; the
  // admin can resend.
  try {
    await auth.api.requestPasswordReset({ body: { email, redirectTo: "/reset-password" } });
  } catch {
    /* email transport issue — account still created; admin can resend */
  }

  return { userId: user.id, workspaceId: workspace.id };
}

/** Re-send the set-password / reset link to a provisioned account. */
export async function resendSetPassword(claims: SessionClaims, userId: string) {
  assertAdmin(claims);
  const user = await getPrisma().user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) throw errors.notFound("المستخدم غير موجود");
  await auth.api.requestPasswordReset({ body: { email: user.email, redirectTo: "/reset-password" } });
  return { ok: true };
}

export async function setUserEndDate(
  claims: SessionClaims,
  userId: string,
  endDate: string | null,
) {
  assertAdmin(claims);
  const user = await getPrisma().user.update({
    where: { id: userId },
    data: { endDate: endDate ? new Date(endDate) : null },
    select: { id: true, endDate: true },
  });
  return user;
}

/**
 * Delete a user account. Cascades sessions/accounts/memberships/notifications/
 * push subs and nullifies their SiteAccess grants (see schema onDelete rules).
 * Guarded: an admin can't delete themselves, and can't delete a user who still
 * OWNS a workspace with live sites (that would orphan them — remove the sites
 * first). Empty workspaces the user solely owns are cleaned up in the same tx.
 */
export async function deleteUser(claims: SessionClaims, userId: string) {
  assertAdmin(claims);
  if (claims.userId === userId) throw errors.conflict("لا يمكنك حذف حسابك الخاص");
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      memberships: {
        where: { role: "owner" },
        select: { workspace: { select: { id: true, _count: { select: { sites: true } } } } },
      },
    },
  });
  if (!user) throw errors.notFound("المستخدم غير موجود");
  if (user.memberships.some((m) => m.workspace._count.sites > 0)) {
    throw errors.conflict("لا يمكن حذف مالك لديه مواقع. احذف مواقعه أولًا ثم أعد المحاولة.");
  }
  const emptyOwned = user.memberships.map((m) => m.workspace.id);
  await prisma.$transaction(async (tx) => {
    if (emptyOwned.length) await tx.workspace.deleteMany({ where: { id: { in: emptyOwned } } });
    await tx.user.delete({ where: { id: userId } });
  });
  return { ok: true };
}

export async function setPaymentStatus(
  claims: SessionClaims,
  paymentId: string,
  status: PaymentStatus,
) {
  assertAdmin(claims);
  const p = await getPrisma().paymentRecord.update({
    where: { id: paymentId },
    data: { status },
    select: { id: true, status: true },
  });
  return p;
}

export async function setCommissionStatus(
  claims: SessionClaims,
  commissionId: string,
  status: CommissionStatus,
) {
  assertAdmin(claims);
  const c = await getPrisma().commissionEntry.update({
    where: { id: commissionId },
    data: { status, settledAt: status === "settled" ? new Date() : null },
    select: { id: true, status: true },
  });
  return c;
}
