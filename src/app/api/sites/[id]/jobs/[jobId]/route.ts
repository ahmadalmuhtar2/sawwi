import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { UpdateJobInput } from "@/server/jobs/jobs.schema";
import { updateJob, deleteJob } from "@/server/jobs/jobs.service";

type Ctx = { params: Promise<{ id: string; jobId: string }> };

export const PATCH = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, jobId } = await params;
  const input = UpdateJobInput.parse(await request.json());
  return updateJob(claims, id, jobId, input);
});

export const DELETE = withRoute(async (_request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, jobId } = await params;
  return deleteJob(claims, id, jobId);
});
