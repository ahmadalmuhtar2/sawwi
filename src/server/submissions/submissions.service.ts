// Marketplace submissions — business logic. The public path (createSubmission)
// is unauthenticated and defends itself (honeypot, phone validation, Redis rate
// limit, dedup). The admin paths authorize via trusted session claims + site
// access (canView to read, canEditSettings to change), never client input.

import { randomUUID } from "node:crypto";
import { errors } from "@/shared/errors";
import { getSite } from "@/server/sites/sites.service";
import { resolveSiteAccess, type SessionClaims } from "@/server/access/access.rules";
import { formatArabicDate } from "@/lib/expiry-format";
import { putObject, isStorageConfigured } from "@/lib/storage";
import { siteAssetKey } from "@/lib/storage-keys";
import { MAX_IMAGE_BYTES, maxSizeLabel } from "@/shared/uploads";
import { templateCollectsSubmissions } from "@/templates/registry";
import { KIND_LABEL, STATUS_LABEL, SOURCE_LABEL, type SubmissionKind as Kind, type SubmissionStatus as Status } from "@/shared/submissions";
import { submissionsRepository as repo } from "./submissions.repository";
import { normalizeSubmissionPhone, isHoneypotTripped, withinRateLimit, withinUploadRateLimit } from "./submissions.rules";
import { MAX_SUBMISSION_IMAGES, type SubmitInput, type ManualInput, type UpdateSubmissionInput, type ListQuery } from "./submissions.schema";

/** Image content types we accept for a submission upload → file extension. */
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/* ─────────────────────────── shared core ─────────────────────────── */

interface CoreFields {
  kind: "PROVIDER" | "CUSTOMER";
  name: string;
  phone: string; // raw, as typed
  category: string;
  area: string;
  details?: string;
  images?: string[];
}

/** Normalize the phone, then dedup: same site + kind + normalized phone refreshes
 *  the existing row (keeping createdAt + source + admin status), else inserts.
 *  Throws VALIDATION_ERROR for a bad phone. */
async function persist(siteId: string, f: CoreFields, source: string, utmSource: string | null) {
  const phone = normalizeSubmissionPhone(f.phone);
  if (!phone) throw errors.validation("رقم الواتساب مو صحيح", { phone: "رقم الواتساب مو صحيح" });
  const data = {
    kind: f.kind as Kind,
    name: f.name,
    phone,
    phoneRaw: f.phone,
    category: f.category,
    area: f.area,
    details: f.details?.trim() || null,
    images: (f.images ?? []).slice(0, MAX_SUBMISSION_IMAGES),
    source,
    utmSource,
  };
  const existing = await repo.findDuplicate(siteId, data.kind, phone);
  if (existing) return repo.refresh(existing.id, data);
  return repo.create(siteId, data);
}

/* ─────────────────────────── PUBLIC ─────────────────────────── */

/**
 * Public submit. Returns the same success shape even for honeypot hits (bots
 * learn nothing). Throws VALIDATION_ERROR for a bad phone, RATE_LIMITED (429) on
 * abuse, NOT_FOUND for an unknown site. Never silently drops a real submission.
 */
export async function createSubmission(siteId: string, input: SubmitInput, ipHash: string | null) {
  if (isHoneypotTripped(input.company)) return { ok: true as const, kind: input.kind };
  if (!(await repo.siteExists(siteId))) throw errors.notFound("الموقع غير موجود");
  if (!(await withinRateLimit(siteId, ipHash))) {
    throw errors.rateLimited("بعتّ طلبات كتير. استنى شوي وجرّب كمان مرة.");
  }
  await persist(siteId, input, "web", input.utmSource?.trim() || null);
  return { ok: true as const, kind: input.kind };
}

/**
 * Public image upload for a submission (a visitor attaching e.g. work samples).
 * Unauthenticated, so it defends itself: the site must exist AND collect forms,
 * the caller is rate-limited per IP, and only real images ≤2MB are accepted. The
 * returned URL is echoed back inside the submission's `images` on submit.
 */
export async function uploadSubmissionImage(siteId: string, file: File, ipHash: string | null) {
  if (!isStorageConfigured()) throw errors.internal("خدمة تخزين الصور غير مُهيّأة");
  // Gate to submission-collecting sites so this can't be used to dump files onto
  // arbitrary sites. Unknown/non-form site → 404 (no existence leak either way).
  const templateKey = await repo.siteTemplateKey(siteId);
  if (!templateKey || !templateCollectsSubmissions(templateKey)) throw errors.notFound("الموقع غير موجود");
  if (!(await withinUploadRateLimit(siteId, ipHash))) {
    throw errors.rateLimited("رفعت صور كتير. استنى شوي وجرّب كمان مرة.");
  }
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) throw errors.validation("صيغة غير مدعومة", { file: "الصيغ المدعومة: JPG أو PNG أو WEBP" });
  if (file.size > MAX_IMAGE_BYTES) {
    throw errors.validation("حجم الصورة كبير", { file: `أقصى حجم للصورة ${maxSizeLabel(MAX_IMAGE_BYTES)}` });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await putObject(siteAssetKey("submissions", siteId, `${randomUUID()}.${ext}`), buffer, file.type);
  return { url };
}

/* ─────────────────────── ADMIN: manual entry ─────────────────────── */

/** A collaborator records someone who reached out on WhatsApp. Authorized by site
 *  access; source = "manual". */
export async function createManualSubmission(claims: SessionClaims, siteId: string, input: ManualInput) {
  await requireManage(claims, siteId);
  return persist(siteId, input, "manual", null);
}

/* ─────────────────────────── ADMIN ──────────────────────────── */

async function loadForRead(claims: SessionClaims, siteId: string) {
  const site = await getSite(claims, siteId); // exists + canView, or throws NOT_FOUND
  return site;
}
async function requireManage(claims: SessionClaims, siteId: string) {
  const site = await getSite(claims, siteId);
  if (!resolveSiteAccess(claims, site).canEditSettings) {
    throw errors.forbidden("لا تملك صلاحية لإدارة الطلبات");
  }
  return site;
}

export async function listSubmissions(claims: SessionClaims, siteId: string, q: ListQuery) {
  await loadForRead(claims, siteId);
  const [{ rows, total }, newCount, categories] = await Promise.all([
    repo.listBySite(siteId, q),
    repo.countNew(siteId),
    repo.distinctCategories(siteId),
  ]);
  return { rows, total, page: q.page, pageSize: 50, newCount, categories };
}

export async function getSubmission(claims: SessionClaims, siteId: string, id: string) {
  await loadForRead(claims, siteId);
  const row = await repo.getById(siteId, id);
  if (!row) throw errors.notFound("الطلب غير موجود");
  return row;
}

export async function updateSubmission(
  claims: SessionClaims,
  siteId: string,
  id: string,
  input: UpdateSubmissionInput,
) {
  await requireManage(claims, siteId);
  const row = await repo.getById(siteId, id);
  if (!row) throw errors.notFound("الطلب غير موجود");
  // Audit: record who/when only when the status actually changes.
  const statusChanged = input.status !== undefined && input.status !== row.status;
  return repo.updateAdmin(id, {
    status: input.status as Status | undefined,
    adminNote: input.adminNote === undefined ? undefined : input.adminNote.trim() || null,
    ...(statusChanged ? { statusById: claims.userId, statusAt: new Date() } : {}),
  });
}

export async function deleteSubmission(claims: SessionClaims, siteId: string, id: string) {
  await requireManage(claims, siteId);
  const row = await repo.getById(siteId, id);
  if (!row) throw errors.notFound("الطلب غير موجود");
  await repo.remove(id);
  return { ok: true as const };
}

export async function newSubmissionCount(claims: SessionClaims, siteId: string) {
  await loadForRead(claims, siteId);
  return repo.countNew(siteId);
}

/** NEW counts for a set of sites the caller already owns (dashboard nav badges).
 *  Mirrors unreadCountsForSites — the caller has already resolved the site list. */
export function newSubmissionCountsForSites(siteIds: string[]) {
  return repo.countNewBySites(siteIds);
}

/** CSV honouring the current filters. UTF-8 BOM so Arabic opens right in Excel;
 *  columns in the same order as the inbox table. */
export async function exportSubmissionsCsv(claims: SessionClaims, siteId: string, q: ListQuery) {
  await loadForRead(claims, siteId);
  const rows = await repo.listForExport(siteId, q);
  const header = ["التاريخ", "النوع", "الاسم", "رقم الواتساب", "الخدمة", "المنطقة", "المصدر", "الحالة"];
  const cell = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [header.map(cell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        formatArabicDate(r.createdAt),
        KIND_LABEL[r.kind as Kind],
        r.name,
        r.phone,
        r.category,
        r.area,
        SOURCE_LABEL[r.source] ?? r.source,
        STATUS_LABEL[r.status as Status],
      ]
        .map(cell)
        .join(","),
    );
  }
  return "﻿" + lines.join("\r\n");
}
