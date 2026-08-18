import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { CreateJobInput } from "@/server/jobs/jobs.schema";
import { createJob } from "@/server/jobs/jobs.service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const input = CreateJobInput.parse(await request.json());
  return createJob(claims, id, input);
});
