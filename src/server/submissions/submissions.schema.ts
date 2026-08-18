// Zod DTOs for marketplace submissions. The submit input is PUBLIC (an
// unauthenticated visitor posts it), so every field is tightly bounded here —
// this is the trust boundary. The SAME rules run on the client for inline errors
// and here on the server (never trust the client).

import { z } from "zod";
import { MAX_SUBMISSION_IMAGES } from "@/shared/submissions";

export { MAX_SUBMISSION_IMAGES };

const name = z.string().trim().min(2, "الاسم قصير كتير").max(80, "الاسم طويل كتير");
const phone = z.string().trim().min(1, "رقم الواتساب مطلوب").max(40, "الرقم طويل كتير");
// Category is site-config-driven, not a hardcoded enum — the server only bounds
// it. The public form offers the SITE's own configured options.
const category = z.string().trim().min(1, "اختر خدمة").max(80, "الخدمة طويلة كتير");
const area = z.string().trim().min(2, "اكتب المنطقة").max(80, "المنطقة طويلة كتير");
const details = z.string().trim().max(600, "التفاصيل طويلة كتير").optional().or(z.literal(""));
// Uploaded image URLs — bounded in count and length. They come from OUR own
// site-scoped upload endpoint; we still cap them here (this is the trust boundary).
const images = z.array(z.string().url().max(1000)).max(MAX_SUBMISSION_IMAGES).optional();

/** The fields shared by the public form and manual entry. */
const core = { kind: z.enum(["PROVIDER", "CUSTOMER"]), name, phone, category, area, details, images };

/** PUBLIC submit input. `company` is the honeypot; `utmSource` is the only
 *  attribution we keep (from the landing URL). */
export const SubmitInput = z.object({
  ...core,
  utmSource: z.string().trim().max(120).optional(),
  company: z.string().max(200).optional(),
});
export type SubmitInput = z.infer<typeof SubmitInput>;

/** Manual entry by a collaborator (someone who replied on WhatsApp). No honeypot;
 *  authorized by site access. `source` is forced to "manual" server-side. */
export const ManualInput = z.object(core);
export type ManualInput = z.infer<typeof ManualInput>;

/** Admin PATCH — change status and/or the free-text note (at least one). */
export const UpdateSubmissionInput = z
  .object({
    status: z.enum(["NEW", "REVIEWING", "ACCEPTED", "REJECTED", "CONTACTED"]).optional(),
    adminNote: z.string().trim().max(2000, "الملاحظة طويلة كتير").or(z.literal("")).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "لا يوجد تغيير" });
export type UpdateSubmissionInput = z.infer<typeof UpdateSubmissionInput>;

/** Admin inbox filters (URL-driven). */
export const KindFilter = z.enum(["all", "PROVIDER", "CUSTOMER"]);
export type KindFilter = z.infer<typeof KindFilter>;
export const StatusFilter = z.enum(["all", "NEW", "REVIEWING", "ACCEPTED", "REJECTED", "CONTACTED"]);
export type StatusFilter = z.infer<typeof StatusFilter>;

/** Parsed admin list query: filters + search + pagination. */
export const ListQuery = z.object({
  kind: KindFilter.catch("all"),
  status: StatusFilter.catch("all"),
  category: z.string().trim().max(80).optional(),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).catch(1),
});
export type ListQuery = z.infer<typeof ListQuery>;
