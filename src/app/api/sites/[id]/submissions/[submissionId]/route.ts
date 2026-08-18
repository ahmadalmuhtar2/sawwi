// A single submission — ADMIN only (session + canEditSettings on the site).
//   PATCH  — change status and/or the free-text admin note.
//   DELETE — remove it (the UI confirms first).

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { UpdateSubmissionInput } from "@/server/submissions/submissions.schema";
import { updateSubmission, deleteSubmission } from "@/server/submissions/submissions.service";

type Ctx = { params: Promise<{ id: string; submissionId: string }> };

export const PATCH = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, submissionId } = await params;
  const input = UpdateSubmissionInput.parse(await request.json());
  return updateSubmission(claims, id, submissionId, input);
});

export const DELETE = withRoute(async (_request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, submissionId } = await params;
  return deleteSubmission(claims, id, submissionId);
});
