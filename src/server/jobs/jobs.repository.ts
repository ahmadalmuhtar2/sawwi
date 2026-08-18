// Non-transactional reads for jobs. The mutating operations (create/update/delete/
// rating) run inside a $transaction in the service so aggregate recomputation is
// atomic — those use the tx client directly, not this repository.

import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { JobStatus } from "@/generated/prisma/enums";
import type { JobListQuery } from "./jobs.schema";

export const PAGE_SIZE = 50;

const providerName = { select: { id: true, name: true, displayName: true } } as const;

function whereFor(siteId: string, q: JobListQuery): Prisma.JobWhereInput {
  const where: Prisma.JobWhereInput = { siteId };
  if (q.status !== "all") where.status = q.status as JobStatus;
  return where;
}

export const jobsRepository = {
  async listBySite(siteId: string, q: JobListQuery) {
    const where = whereFor(siteId, q);
    const [rows, total] = await Promise.all([
      getPrisma().job.findMany({
        where,
        orderBy: { matchedAt: "desc" },
        skip: (q.page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { provider: providerName, rating: { select: { score: true } } },
      }),
      getPrisma().job.count({ where }),
    ]);
    return { rows, total };
  },

  getById(siteId: string, id: string) {
    return getPrisma().job.findFirst({
      where: { id, siteId },
      include: { provider: providerName, rating: true },
    });
  },
};
