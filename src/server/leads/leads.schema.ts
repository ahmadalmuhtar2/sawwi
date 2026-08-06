// Zod DTOs for landing-page leads. The submit input is PUBLIC (an unauthenticated
// visitor posts it), so every field is tightly bounded here — this is the trust
// boundary for the public endpoint.

import { z } from "zod";

export const CreateLeadInput = z.object({
  businessName: z.string().trim().min(1, "اسم النشاط مطلوب").max(120, "الاسم طويل جدًا"),
  // Free-ish text; normalized + validated to a Syrian number in the service.
  whatsapp: z.string().trim().min(1, "رقم واتساب مطلوب").max(40, "الرقم طويل جدًا"),
  // Optional email — empty string allowed so the form can send it unconditionally.
  email: z
    .string()
    .trim()
    .max(160, "البريد طويل جدًا")
    .email("صيغة البريد غير صحيحة")
    .optional()
    .or(z.literal("")),
  // Honeypot: a hidden field real users never see. Bots fill it; the service
  // silently drops those. Lenient so we can 200 without tipping the bot off.
  company: z.string().max(200).optional(),
});
export type CreateLeadInput = z.infer<typeof CreateLeadInput>;

/** Admin PATCH — edit any of the lead's fields (all optional; at least one). The
 *  WhatsApp value is re-normalized in the service; email "" clears it. */
export const UpdateLeadInput = z
  .object({
    businessName: z.string().trim().min(1, "اسم النشاط مطلوب").max(120, "الاسم طويل جدًا").optional(),
    whatsapp: z.string().trim().min(1).max(40).optional(),
    email: z
      .string()
      .trim()
      .max(160, "البريد طويل جدًا")
      .email("صيغة البريد غير صحيحة")
      .or(z.literal(""))
      .optional(),
    status: z.enum(["new", "contacted", "converted", "archived"]).optional(),
    note: z.string().trim().max(2000, "الملاحظة طويلة جدًا").optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "لا يوجد تغيير" });
export type UpdateLeadInput = z.infer<typeof UpdateLeadInput>;

/** Admin inbox filter — the four real statuses plus an "all" pseudo-filter. */
export const LeadFilter = z.enum(["all", "new", "contacted", "converted", "archived"]);
export type LeadFilter = z.infer<typeof LeadFilter>;

/** Sort column + direction for the admin table (URL-driven). */
export const LeadSort = z.enum(["created", "business", "status"]);
export type LeadSort = z.infer<typeof LeadSort>;
export const LeadDir = z.enum(["asc", "desc"]);
export type LeadDir = z.infer<typeof LeadDir>;
