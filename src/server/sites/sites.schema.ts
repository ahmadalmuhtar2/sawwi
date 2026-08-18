// Zod DTOs for the sites API. Slug FORMAT is enforced here (field-level error);
// slug AVAILABILITY and authorization are the service's job.

import { z } from "zod";
import { isValidSlug } from "./sites.rules";

export const CreateSiteInput = z.object({
  businessName: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .refine(isValidSlug, {
      message: "الرابط يقبل أحرفًا إنجليزية صغيرة وأرقامًا وشرطات فقط (٣–٤٠)",
    }),
  verticalKey: z.string().min(1),
  templateKey: z.string().optional(),
  language: z.enum(["ar", "en"]).default("ar"),
  // The editable template data collected in onboarding (see src/templates).
  content: z.record(z.string(), z.unknown()).default({}),
});
export type CreateSiteInput = z.infer<typeof CreateSiteInput>;

// Editable site identity (post-creation). All optional — only sent fields change.
export const UpdateSiteBasicsInput = z.object({
  businessName: z.string().trim().min(2).max(120).optional(),
  slug: z
    .string()
    .trim()
    .refine(isValidSlug, {
      message: "الرابط يقبل أحرفًا إنجليزية صغيرة وأرقامًا وشرطات فقط (٣–٤٠)",
    })
    .optional(),
  language: z.enum(["ar", "en"]).optional(),
});
export type UpdateSiteBasicsInput = z.infer<typeof UpdateSiteBasicsInput>;

// PUT replaces the settings row; omitted fields become null.
export const UpdateSettingsInput = z.object({
  whatsappNumber: z.string().trim().max(40).nullish(),
  phone: z.string().trim().max(40).nullish(),
  socials: z.record(z.string(), z.string()).default({}),
  googleMapsUrl: z.string().trim().max(500).nullish(),
  address: z.string().trim().max(300).nullish(),
  openingHours: z.record(z.string(), z.unknown()).default({}),
  currency: z.string().trim().max(16).nullish(),
  logoMediaId: z.string().nullish(),
  loadingIconId: z.string().nullish(),
  // End-user auth config. Optional → preserved on a PUT that omits them (like
  // currency), so saving another settings tab never flips these off.
  authEnabled: z.boolean().optional(),
  roleLabels: z.record(z.string(), z.string().trim().max(40)).optional(),
  // Master switch for public provider profiles (/p/[slug]). Preserve-on-omit.
  publicProfilesEnabled: z.boolean().optional(),
});
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsInput>;

export const UpdateThemeInput = z.object({
  paletteKey: z.string().nullish(),
  primaryColor: z.string().nullish(),
  secondaryColor: z.string().nullish(),
  bgColor: z.string().nullish(),
  fontKey: z.string().default("readex"),
  headerVariant: z.string().nullish(),
  headerScheme: z.string().nullish(),
  footerVariant: z.string().nullish(),
  footerScheme: z.string().nullish(),
});
export type UpdateThemeInput = z.infer<typeof UpdateThemeInput>;
