// Record or amend the rating for a job. NO public path — only an authenticated
// collaborator recording a follow-up result. Integrity enforced in the service.

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { RecordRatingInput, UpdateRatingInput } from "@/server/jobs/jobs.schema";
import { recordRating, updateRating } from "@/server/jobs/jobs.service";

type Ctx = { params: Promise<{ id: string; jobId: string }> };

export const POST = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, jobId } = await params;
  const input = RecordRatingInput.parse(await request.json());
  return recordRating(claims, id, jobId, input);
});

export const PATCH = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, jobId } = await params;
  const input = UpdateRatingInput.parse(await request.json());
  return updateRating(claims, id, jobId, input);
});
