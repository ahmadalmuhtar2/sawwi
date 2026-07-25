import { z } from "zod";

// A workspace is the agency/account — it owns websites but is NOT a business
// itself. Business contact info (phone, address, hours…) lives on each website's
// settings (SiteSettings), never here.

export const CreateWorkspaceInput = z.object({
  name: z.string().trim().min(2).max(120),
});
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInput>;

export const UpdateWorkspaceInput = z.object({
  name: z.string().trim().min(2, "الاسم قصير جدًا").max(120, "الاسم طويل جدًا"),
});
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceInput>;
