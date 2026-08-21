// Zod DTOs for jobs + ratings. All authenticated (a site collaborator). There is
// NO public rating path — ratings are only recorded here, from a follow-up result.

import { z } from "zod";
import { RATING_COMMENT_MAX } from "@/shared/providers";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

/** Record a brokered match. `customerId` links a picked Customer (from the approved
 *  list); name/phone are still stored denormalized so job history stays stable. */
export const CreateJobInput = z.object({
  providerId: z.string().min(1),
  customerId: z.string().optional(),
  customerName: z.string().trim().min(2, "الاسم قصير كتير").max(80, "الاسم طويل كتير"),
  customerPhone: z.string().trim().min(1, "الرقم مطلوب").max(40),
  category: z.string().trim().min(1, "اختر خدمة").max(80),
  area: z.string().trim().min(1, "اختر منطقة").max(80),
  description: optionalText(600),
  customerSubmissionId: z.string().optional(),
});
export type CreateJobInput = z.infer<typeof CreateJobInput>;

/** Change status / mark the follow-up call happened / edit the note. */
export const UpdateJobInput = z
  .object({
    status: z.enum(["MATCHED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "DISPUTED"]).optional(),
    markFollowedUp: z.boolean().optional(),
    description: optionalText(600),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "لا يوجد تغيير" });
export type UpdateJobInput = z.infer<typeof UpdateJobInput>;

/** Record the rating for a COMPLETED, followed-up job. Public comment defaults to
 *  unapproved (never rendered until a collaborator approves it). */
export const RecordRatingInput = z.object({
  score: z.number().int().min(1, "التقييم من ١ لـ ٥").max(5, "التقييم من ١ لـ ٥"),
  publicComment: optionalText(RATING_COMMENT_MAX),
  privateNote: optionalText(1000),
  source: z.enum(["FOLLOW_UP_CALL", "WHATSAPP", "IN_PERSON"]),
});
export type RecordRatingInput = z.infer<typeof RecordRatingInput>;

/** Approve/unapprove the public comment, or edit the notes. */
export const UpdateRatingInput = z
  .object({
    commentApproved: z.boolean().optional(),
    publicComment: optionalText(RATING_COMMENT_MAX),
    privateNote: optionalText(1000),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "لا يوجد تغيير" });
export type UpdateRatingInput = z.infer<typeof UpdateRatingInput>;

export const JobListQuery = z.object({
  status: z.enum(["all", "MATCHED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "DISPUTED"]).catch("all"),
  page: z.coerce.number().int().min(1).catch(1),
});
export type JobListQuery = z.infer<typeof JobListQuery>;
