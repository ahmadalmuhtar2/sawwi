// Data access for billing. The recordPayment write is one transaction:
// extend/create the subscription, insert the payment, and log the commission.

import { getPrisma } from "@/lib/db";
import type { Currency, PaymentMethod } from "@/generated/prisma/enums";

export interface RecordPaymentArgs {
  siteId: string;
  subscriptionId: string | null;
  newExpiry: Date; // paid-through date after this payment
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  payerName: string | null;
  note: string | null;
  collectedBy: string;
  workspaceId: string;
  pct: number;
  commissionAmount: number;
}

export const billingRepository = {
  getSubscription(siteId: string) {
    return getPrisma().subscription.findUnique({ where: { siteId } });
  },

  listSubscriptionsForSites(siteIds: string[]) {
    return getPrisma().subscription.findMany({ where: { siteId: { in: siteIds } } });
  },

  getWorkspace(workspaceId: string) {
    return getPrisma().workspace.findUnique({ where: { id: workspaceId } });
  },

  /** Subscriptions inside the reminder window (expiring, not yet expired). */
  listDueForReminder(now: Date, until: Date) {
    return getPrisma().subscription.findMany({
      where: { expiry: { gt: now, lte: until } },
      select: {
        id: true,
        expiry: true,
        lastReminderDay: true,
        site: {
          select: {
            businessName: true,
            workspace: {
              select: {
                members: {
                  where: { role: "owner" },
                  take: 1,
                  select: { user: { select: { email: true, name: true } } },
                },
              },
            },
          },
        },
      },
    });
  },

  markReminder(id: string, day: number) {
    return getPrisma().subscription.update({
      where: { id },
      data: { lastReminderDay: day },
    });
  },

  listPayments(siteId: string) {
    return getPrisma().paymentRecord.findMany({
      where: { subscription: { siteId } },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Per-subscription totals for the workspace overview (sum, count, last date). */
  paymentAggregates(subscriptionIds: string[]) {
    if (!subscriptionIds.length)
      return Promise.resolve(
        [] as {
          subscriptionId: string;
          _sum: { amount: number | null };
          _count: { _all: number };
          _max: { createdAt: Date | null };
        }[],
      );
    return getPrisma().paymentRecord.groupBy({
      by: ["subscriptionId"],
      where: { subscriptionId: { in: subscriptionIds } },
      _sum: { amount: true },
      _count: { _all: true },
      _max: { createdAt: true },
    });
  },

  /** Set/extend the paid-through date without a payment (upsert). */
  setExpiry(siteId: string, expiry: Date) {
    return getPrisma().subscription.upsert({
      where: { siteId },
      create: { siteId, expiry, status: "active" },
      // New paid-through date → reset reminders so the next cycle fires fresh.
      update: { expiry, status: "active", lastReminderDay: null },
    });
  },

  recordPayment(args: RecordPaymentArgs) {
    return getPrisma().$transaction(async (tx) => {
      const subscription = args.subscriptionId
        ? await tx.subscription.update({
            where: { id: args.subscriptionId },
            data: { expiry: args.newExpiry, status: "active", lastReminderDay: null },
          })
        : await tx.subscription.create({
            data: {
              siteId: args.siteId,
              expiry: args.newExpiry,
              status: "active",
              currency: args.currency,
            },
          });

      const payment = await tx.paymentRecord.create({
        data: {
          subscriptionId: subscription.id,
          amount: args.amount,
          currency: args.currency,
          method: args.method,
          payerName: args.payerName,
          note: args.note,
          collectedBy: args.collectedBy,
        },
      });

      await tx.commissionEntry.create({
        data: {
          workspaceId: args.workspaceId,
          paymentId: payment.id,
          pct: args.pct,
          amount: args.commissionAmount,
          status: "owed",
        },
      });

      return { subscription, payment };
    });
  },
};
