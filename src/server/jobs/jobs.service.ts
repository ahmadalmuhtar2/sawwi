// Jobs + ratings business logic. This is where the integrity rules live IN CODE:
//   • a Rating exists only for a COMPLETED job whose follow-up actually happened,
//   • one Rating per Job (unique constraint + a service check),
//   • after every Job/Rating write the provider aggregates are recomputed inside
//     the SAME transaction (never a drifted cached value),
//   • deleting a Job cascades to its Rating (DB) and recomputes.
// There is deliberately NO public rating endpoint anywhere.

import { errors } from "@/shared/errors";
import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getSite } from "@/server/sites/sites.service";
import { resolveSiteAccess, type SessionClaims } from "@/server/access/access.rules";
import { normalizeSubmissionPhone } from "@/server/submissions/submissions.rules";
import { providerExistsInSite } from "@/server/providers/providers.service";
import { customerExistsInSite } from "@/server/customers/customers.service";
import { jobsRepository as repo } from "./jobs.repository";
import type { CreateJobInput, UpdateJobInput, RecordRatingInput, UpdateRatingInput, JobListQuery } from "./jobs.schema";

/* ───────────────────────── access ───────────────────────── */

async function loadForRead(claims: SessionClaims, siteId: string) {
  return getSite(claims, siteId);
}
async function requireManage(claims: SessionClaims, siteId: string) {
  const site = await getSite(claims, siteId);
  if (!resolveSiteAccess(claims, site).canEditSettings) throw errors.forbidden("لا تملك صلاحية لإدارة الشغلات");
  return site;
}

/* ─────────────── aggregate recompute (always in-transaction) ─────────────── */

/** Recompute the denormalized provider aggregates from the source rows. Called
 *  inside every mutating transaction so a cached value can never drift. */
async function recompute(tx: Prisma.TransactionClient, providerId: string) {
  const [jobsCompleted, agg] = await Promise.all([
    tx.job.count({ where: { providerId, status: "COMPLETED" } }),
    tx.rating.aggregate({ where: { providerId }, _count: { _all: true }, _sum: { score: true } }),
  ]);
  const ratingCount = agg._count._all;
  const ratingSum = agg._sum.score ?? 0;
  const ratingAvg = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(2) : null;
  await tx.provider.update({
    where: { id: providerId },
    data: { jobsCompleted, ratingCount, ratingSum, ratingAvg },
  });
}

/* ───────────────────────── reads ───────────────────────── */

export async function listJobs(claims: SessionClaims, siteId: string, q: JobListQuery) {
  await loadForRead(claims, siteId);
  const { rows, total } = await repo.listBySite(siteId, q);
  return { rows, total, page: q.page };
}

export async function getJob(claims: SessionClaims, siteId: string, id: string) {
  await loadForRead(claims, siteId);
  const job = await repo.getById(siteId, id);
  if (!job) throw errors.notFound("الشغلة غير موجودة");
  return job;
}

/* ───────────────────────── writes ───────────────────────── */

export async function createJob(claims: SessionClaims, siteId: string, input: CreateJobInput) {
  await requireManage(claims, siteId);
  if (!(await providerExistsInSite(siteId, input.providerId))) throw errors.notFound("المزوّد غير موجود");
  // A picked customer must belong to this site (wrong id → 404, never leaks).
  if (input.customerId && !(await customerExistsInSite(siteId, input.customerId))) {
    throw errors.notFound("الزبون غير موجود");
  }
  // Normalize the customer phone (internal, never public); keep the given digits
  // if it isn't a parseable Syrian mobile so a legit landline isn't blocked.
  const customerPhone = normalizeSubmissionPhone(input.customerPhone) ?? input.customerPhone.trim();

  return getPrisma().$transaction(async (tx) => {
    const job = await tx.job.create({
      data: {
        siteId,
        providerId: input.providerId,
        customerId: input.customerId || null,
        customerSubmissionId: input.customerSubmissionId || null,
        customerName: input.customerName,
        customerPhone,
        category: input.category,
        area: input.area,
        description: input.description?.trim() || null,
        createdByUserId: claims.userId,
      },
    });
    await recompute(tx, input.providerId);
    return job;
  });
}

export async function updateJob(claims: SessionClaims, siteId: string, id: string, input: UpdateJobInput) {
  await requireManage(claims, siteId);
  const job = await repo.getById(siteId, id);
  if (!job) throw errors.notFound("الشغلة غير موجودة");

  const data: Prisma.JobUpdateInput = {};
  if (input.description !== undefined) data.description = input.description.trim() || null;
  if (input.status !== undefined) {
    data.status = input.status;
    // Stamp completedAt the first time it reaches COMPLETED; keep it otherwise.
    if (input.status === "COMPLETED" && !job.completedAt) data.completedAt = new Date();
  }
  if (input.markFollowedUp) data.followedUpAt = job.followedUpAt ?? new Date();

  return getPrisma().$transaction(async (tx) => {
    const updated = await tx.job.update({ where: { id }, data });
    await recompute(tx, job.providerId);
    return updated;
  });
}

export async function deleteJob(claims: SessionClaims, siteId: string, id: string) {
  await requireManage(claims, siteId);
  const job = await repo.getById(siteId, id);
  if (!job) throw errors.notFound("الشغلة غير موجودة");
  await getPrisma().$transaction(async (tx) => {
    await tx.job.delete({ where: { id } }); // Rating cascades (DB onDelete: Cascade)
    await recompute(tx, job.providerId);
  });
  return { ok: true as const };
}

/* ───────────────────────── ratings ───────────────────────── */

export async function recordRating(claims: SessionClaims, siteId: string, jobId: string, input: RecordRatingInput) {
  await requireManage(claims, siteId);
  const job = await repo.getById(siteId, jobId);
  if (!job) throw errors.notFound("الشغلة غير موجودة");
  // Integrity rule #1: only a completed + actually-followed-up job can be rated.
  if (job.status !== "COMPLETED" || job.followedUpAt === null) {
    throw errors.validation("لا يمكن تسجيل تقييم إلا لشغلة مكتملة وتمّت متابعتها");
  }
  // Integrity rule #2: one rating per job (also enforced by the unique constraint).
  if (job.rating) throw errors.conflict("هذه الشغلة مقيَّمة مسبقًا");

  return getPrisma().$transaction(async (tx) => {
    const rating = await tx.rating.create({
      data: {
        siteId,
        jobId,
        providerId: job.providerId,
        score: input.score,
        publicComment: input.publicComment?.trim() || null,
        commentApproved: false, // never rendered until a collaborator approves
        privateNote: input.privateNote?.trim() || null,
        source: input.source,
        recordedByUserId: claims.userId,
      },
    });
    await recompute(tx, job.providerId);
    return rating;
  });
}

export async function updateRating(claims: SessionClaims, siteId: string, jobId: string, input: UpdateRatingInput) {
  await requireManage(claims, siteId);
  const job = await repo.getById(siteId, jobId);
  if (!job || !job.rating) throw errors.notFound("التقييم غير موجود");
  const data: Prisma.RatingUpdateInput = {};
  if (input.commentApproved !== undefined) data.commentApproved = input.commentApproved;
  if (input.publicComment !== undefined) data.publicComment = input.publicComment.trim() || null;
  if (input.privateNote !== undefined) data.privateNote = input.privateNote.trim() || null;
  // Score is immutable here (aggregates stay correct); to change it, delete + re-add.
  return getPrisma().rating.update({ where: { id: job.rating.id }, data });
}
