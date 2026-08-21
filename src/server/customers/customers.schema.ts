// Zod DTOs for the customer list. All customer writes are authenticated (a site
// collaborator) — there is NO public create path. Mirrors providers.schema.ts.

import { z } from "zod";

const optionalText = (max: number, msg?: string) =>
  z.string().trim().max(max, msg).optional().or(z.literal(""));

/** Promote an ACCEPTED customer Submission into a Customer row. */
export const ConvertToCustomerInput = z.object({
  submissionId: z.string().min(1),
});
export type ConvertToCustomerInput = z.infer<typeof ConvertToCustomerInput>;

/** Edit an existing customer. */
export const UpdateCustomerInput = z
  .object({
    name: z.string().trim().min(2, "الاسم قصير كتير").max(80, "الاسم طويل كتير").optional(),
    area: optionalText(80),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
    internalNote: optionalText(2000),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "لا يوجد تغيير" });
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerInput>;

export const CustomerStatusFilter = z.enum(["all", "DRAFT", "ACTIVE", "ARCHIVED"]);

/** Internal list filters (URL-driven). */
export const CustomerListQuery = z.object({
  status: CustomerStatusFilter.catch("all"),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).catch(1),
});
export type CustomerListQuery = z.infer<typeof CustomerListQuery>;
