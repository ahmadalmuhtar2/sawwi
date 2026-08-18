// Zod DTOs for the provider directory. All provider writes are authenticated
// (a site collaborator) — there is NO public create path. These bound the inputs.

import { z } from "zod";
import { PROVIDER_BIO_MAX } from "@/shared/providers";

const optionalText = (max: number, msg?: string) =>
  z.string().trim().max(max, msg).optional().or(z.literal(""));

/** Promote an ACCEPTED provider Submission into a Provider row. */
export const ConvertToProviderInput = z.object({
  submissionId: z.string().min(1),
});
export type ConvertToProviderInput = z.infer<typeof ConvertToProviderInput>;

/** Edit an existing provider. `verified` maps to verifiedAt (set/clear). */
export const UpdateProviderInput = z
  .object({
    displayName: optionalText(80),
    bio: optionalText(PROVIDER_BIO_MAX, "النبذة طويلة كتير"),
    categories: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
    areas: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
    status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "REMOVED"]).optional(),
    verified: z.boolean().optional(),
    profilePublic: z.boolean().optional(),
    internalNote: optionalText(2000),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "لا يوجد تغيير" });
export type UpdateProviderInput = z.infer<typeof UpdateProviderInput>;

/** Add/edit metadata for an uploaded photo (the file itself goes through the
 *  upload route). */
export const UpdatePhotoInput = z
  .object({
    caption: optionalText(160),
    sortOrder: z.number().int().min(0).max(999).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "لا يوجد تغيير" });
export type UpdatePhotoInput = z.infer<typeof UpdatePhotoInput>;

export const ProviderStatusFilter = z.enum(["all", "DRAFT", "ACTIVE", "PAUSED", "REMOVED"]);

/** Internal list filters (URL-driven). */
export const ProviderListQuery = z.object({
  status: ProviderStatusFilter.catch("all"),
  category: z.string().trim().max(80).optional(),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).catch(1),
});
export type ProviderListQuery = z.infer<typeof ProviderListQuery>;
