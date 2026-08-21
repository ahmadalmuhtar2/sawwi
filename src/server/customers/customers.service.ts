// Customer list business logic — the demand-side mirror of providers.service.ts.
// Every write is authenticated + site-scoped (canEditSettings to manage, exactly
// like the leads inbox); reads need canView. Wrong siteId → NOT_FOUND (404), never
// 403 — existence never leaks. There is NO public path here at all (customers are
// never shown publicly).

import { errors } from "@/shared/errors";
import type { Prisma } from "@/generated/prisma/client";
import { getSite } from "@/server/sites/sites.service";
import { resolveSiteAccess, type SessionClaims } from "@/server/access/access.rules";
import { submissionsRepository } from "@/server/submissions/submissions.repository";
import { customersRepository as repo } from "./customers.repository";
import type { UpdateCustomerInput, CustomerListQuery } from "./customers.schema";

/* ───────────────────────── access ───────────────────────── */

async function loadForRead(claims: SessionClaims, siteId: string) {
  return getSite(claims, siteId); // exists + canView, or throws NOT_FOUND
}
async function requireManage(claims: SessionClaims, siteId: string) {
  const site = await getSite(claims, siteId);
  if (!resolveSiteAccess(claims, site).canEditSettings) throw errors.forbidden("لا تملك صلاحية لإدارة الزبائن");
  return site;
}

/* ───────────────────── convert (from a Submission) ───────────────────── */

/** Promote an ACCEPTED customer Submission into a Customer (status DRAFT), linking
 *  submissionId and prefilling name/phone/area. Idempotent: a submission already
 *  converted returns its existing customer. */
export async function convertSubmissionToCustomer(claims: SessionClaims, siteId: string, submissionId: string) {
  await requireManage(claims, siteId);
  const sub = await submissionsRepository.getById(siteId, submissionId);
  if (!sub) throw errors.notFound("الطلب غير موجود");
  if (sub.kind !== "CUSTOMER") throw errors.validation("هذا الطلب ليس لزبون");
  if (sub.status !== "ACCEPTED") throw errors.validation("لازم يكون الطلب مقبولاً قبل التحويل لزبون");

  const existing = await repo.findBySubmissionId(submissionId);
  if (existing) return existing;

  return repo.create({
    siteId,
    submissionId,
    name: sub.name,
    phone: sub.phone,
    phoneRaw: sub.phoneRaw,
    area: sub.area || null,
  });
}

/* ───────────────────────── reads ───────────────────────── */

export async function listCustomers(claims: SessionClaims, siteId: string, q: CustomerListQuery) {
  await loadForRead(claims, siteId);
  const { rows, total } = await repo.listBySite(siteId, q);
  return { rows, total, page: q.page };
}

export async function getCustomer(claims: SessionClaims, siteId: string, id: string) {
  await loadForRead(claims, siteId);
  const customer = await repo.getById(siteId, id);
  if (!customer) throw errors.notFound("الزبون غير موجود");
  return customer;
}

/** The customer promoted from a given submission, if one exists (drives the
 *  submission detail page's "open customer" link). Site-scoped. */
export async function getCustomerForSubmission(claims: SessionClaims, siteId: string, submissionId: string) {
  await loadForRead(claims, siteId);
  const c = await repo.findBySubmissionId(submissionId);
  return c && c.siteId === siteId ? c : null;
}

/** Belongs-to check reused by the jobs service. */
export function customerExistsInSite(siteId: string, id: string) {
  return repo.existsInSite(siteId, id);
}

/** Customers offered in the "record a match" picker. */
export async function listCustomerOptions(claims: SessionClaims, siteId: string) {
  await loadForRead(claims, siteId);
  return repo.pickerList(siteId);
}

/* ───────────────────────── writes ───────────────────────── */

export async function updateCustomer(claims: SessionClaims, siteId: string, id: string, input: UpdateCustomerInput) {
  await requireManage(claims, siteId);
  const c = await repo.getById(siteId, id);
  if (!c) throw errors.notFound("الزبون غير موجود");

  const data: Prisma.CustomerUpdateInput = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.area !== undefined) data.area = input.area.trim() || null;
  if (input.status !== undefined) data.status = input.status;
  if (input.internalNote !== undefined) data.internalNote = input.internalNote.trim() || null;

  return repo.update(id, data);
}
