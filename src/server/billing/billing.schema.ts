import { z } from "zod";
import { CURRENCY_KEYS } from "@/shared/currency";

// Record a payment collected from the client. Optionally extends the paid-through
// date (newExpiry) — the reseller usually renews when collecting.
export const RecordPaymentInput = z.object({
  amount: z.number().positive(),
  // Single currency source (shared/currency.ts) → includes ل.س and ل.س.ج.
  currency: z.enum(CURRENCY_KEYS).default("SYP"),
  method: z
    .enum(["cash", "mobile_money", "bank_transfer", "other"])
    .default("cash"),
  payerName: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
  newExpiry: z.coerce.date().optional(),
});
export type RecordPaymentInput = z.infer<typeof RecordPaymentInput>;

// Set/extend the subscription's paid-through date without a payment.
export const SetExpiryInput = z.object({
  expiry: z.coerce.date(),
});
export type SetExpiryInput = z.infer<typeof SetExpiryInput>;
