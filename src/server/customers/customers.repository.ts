// Data access for customers — the only layer touching Prisma for this domain.
// Every query is siteId-scoped (the service authorizes the site). Mirrors
// providers.repository.ts.

import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { CustomerStatus } from "@/generated/prisma/enums";
import type { CustomerListQuery } from "./customers.schema";

export const PAGE_SIZE = 50;

export interface CustomerWrite {
  siteId: string;
  submissionId: string | null;
  name: string;
  phone: string;
  phoneRaw: string;
  area: string | null;
}

function whereFor(siteId: string, q: CustomerListQuery): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = { siteId };
  if (q.status !== "all") where.status = q.status as CustomerStatus;
  const term = q.q?.trim();
  if (term) {
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { phone: { contains: term } },
      { phoneRaw: { contains: term } },
    ];
  }
  return where;
}

export const customersRepository = {
  create(data: CustomerWrite) {
    return getPrisma().customer.create({ data });
  },

  /** Guard against double-converting the same submission. */
  findBySubmissionId(submissionId: string) {
    return getPrisma().customer.findUnique({ where: { submissionId } });
  },

  async listBySite(siteId: string, q: CustomerListQuery) {
    const where = whereFor(siteId, q);
    const [rows, total] = await Promise.all([
      getPrisma().customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { _count: { select: { jobs: true } } },
      }),
      getPrisma().customer.count({ where }),
    ]);
    return { rows, total };
  },

  getById(siteId: string, id: string) {
    return getPrisma().customer.findFirst({
      where: { id, siteId },
      include: { _count: { select: { jobs: true } } },
    });
  },

  /** Non-archived customers for the "record a match" picker. */
  pickerList(siteId: string) {
    return getPrisma().customer.findMany({
      where: { siteId, status: { not: "ARCHIVED" } },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, phone: true, phoneRaw: true, area: true, submissionId: true },
    });
  },

  /** Belongs-to check used when creating a Job for a customer. */
  existsInSite(siteId: string, id: string) {
    return getPrisma()
      .customer.findFirst({ where: { id, siteId }, select: { id: true } })
      .then((r) => !!r);
  },

  update(id: string, data: Prisma.CustomerUpdateInput) {
    return getPrisma().customer.update({ where: { id }, data });
  },
};
