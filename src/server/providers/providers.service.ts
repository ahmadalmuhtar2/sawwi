// Provider directory business logic. Every write is authenticated + site-scoped
// (canEditSettings to manage, exactly like the leads inbox); reads need canView.
// Wrong siteId → NOT_FOUND (404), never 403 — existence never leaks. There is NO
// public create path here; the only public function is getPublicProfile (read).

import { randomUUID } from "node:crypto";
import { errors } from "@/shared/errors";
import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getSite } from "@/server/sites/sites.service";
import { resolveSiteAccess, type SessionClaims } from "@/server/access/access.rules";
import { submissionsRepository } from "@/server/submissions/submissions.repository";
import { putObject, deleteObject, isStorageConfigured } from "@/lib/storage";
import { siteAssetKey } from "@/lib/storage-keys";
import { MAX_IMAGE_BYTES, maxSizeLabel } from "@/shared/uploads";
import { providersRepository as repo } from "./providers.repository";
import { serializePublicProfile } from "./providers.serialize";
import { isProfilePublic } from "./visibility";
import type { UpdateProviderInput, UpdatePhotoInput, ProviderListQuery } from "./providers.schema";

export const MAX_PROVIDER_PHOTOS = 12;

const EXT_BY_TYPE: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/* ───────────────────────── access ───────────────────────── */

async function loadForRead(claims: SessionClaims, siteId: string) {
  return getSite(claims, siteId); // exists + canView, or throws NOT_FOUND
}
async function requireManage(claims: SessionClaims, siteId: string) {
  const site = await getSite(claims, siteId);
  if (!resolveSiteAccess(claims, site).canEditSettings) throw errors.forbidden("لا تملك صلاحية لإدارة المزوّدين");
  return site;
}

/* ───────────────────────── slug ───────────────────────── */

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
async function uniqueSlug(siteId: string, name: string): Promise<string> {
  const base = slugify(name) || "provider"; // Arabic names → "provider", deduped below
  let slug = base;
  let i = 1;
  while (await repo.slugTaken(siteId, slug)) {
    i += 1;
    slug = `${base}-${i}`;
  }
  return slug;
}

/* ───────────────────── convert (from a Submission) ───────────────────── */

/** Promote an ACCEPTED provider Submission into a Provider (status DRAFT), linking
 *  submissionId and prefilling name/phone/category/area. Idempotent: a submission
 *  already converted returns its existing provider. */
export async function convertSubmissionToProvider(claims: SessionClaims, siteId: string, submissionId: string) {
  await requireManage(claims, siteId);
  const sub = await submissionsRepository.getById(siteId, submissionId);
  if (!sub) throw errors.notFound("الطلب غير موجود");
  if (sub.kind !== "PROVIDER") throw errors.validation("هذا الطلب ليس لمزوّد خدمة");
  if (sub.status !== "ACCEPTED") throw errors.validation("لازم يكون الطلب مقبولاً قبل التحويل لمزوّد");

  const existing = await repo.findBySubmissionId(submissionId);
  if (existing) return existing;

  return repo.create({
    siteId,
    submissionId,
    slug: await uniqueSlug(siteId, sub.name),
    name: sub.name,
    displayName: null,
    phone: sub.phone,
    phoneRaw: sub.phoneRaw,
    categories: sub.category ? [sub.category] : [],
    areas: sub.area ? [sub.area] : [],
  });
}

/* ───────────────────────── reads ───────────────────────── */

export async function listProviders(claims: SessionClaims, siteId: string, q: ProviderListQuery) {
  await loadForRead(claims, siteId);
  const [{ rows, total }, categories] = await Promise.all([repo.listBySite(siteId, q), repo.distinctCategories(siteId)]);
  return { rows, total, page: q.page, categories };
}

export async function getProvider(claims: SessionClaims, siteId: string, id: string) {
  await loadForRead(claims, siteId);
  const provider = await repo.getById(siteId, id);
  if (!provider) throw errors.notFound("المزوّد غير موجود");
  return provider;
}

/** The provider promoted from a given submission, if one exists (drives the
 *  submission detail page's "open provider" link). Site-scoped: a provider from
 *  another site is treated as absent, so nothing leaks across sites. */
export async function getProviderForSubmission(claims: SessionClaims, siteId: string, submissionId: string) {
  await loadForRead(claims, siteId);
  const p = await repo.findBySubmissionId(submissionId);
  return p && p.siteId === siteId ? p : null;
}

/** Belongs-to check reused by the jobs service. */
export function providerExistsInSite(siteId: string, id: string) {
  return repo.existsInSite(siteId, id);
}

/** Providers offered in the "record a match" picker. */
export async function listProviderOptions(claims: SessionClaims, siteId: string) {
  await loadForRead(claims, siteId);
  return repo.pickerList(siteId);
}

/* ───────────────────────── writes ───────────────────────── */

export async function updateProvider(claims: SessionClaims, siteId: string, id: string, input: UpdateProviderInput) {
  await requireManage(claims, siteId);
  const p = await repo.getById(siteId, id);
  if (!p) throw errors.notFound("المزوّد غير موجود");

  const data: Prisma.ProviderUpdateInput = {};
  if (input.displayName !== undefined) data.displayName = input.displayName.trim() || null;
  if (input.bio !== undefined) data.bio = input.bio.trim() || null;
  if (input.categories !== undefined) data.categories = input.categories;
  if (input.areas !== undefined) data.areas = input.areas;
  if (input.status !== undefined) data.status = input.status;
  if (input.profilePublic !== undefined) data.profilePublic = input.profilePublic;
  if (input.internalNote !== undefined) data.internalNote = input.internalNote.trim() || null;
  // `verified` toggles verifiedAt; keep the original date when re-confirming.
  if (input.verified !== undefined) data.verifiedAt = input.verified ? (p.verifiedAt ?? new Date()) : null;

  return repo.update(id, data);
}

/* ───────────────────────── photos ───────────────────────── */

export async function uploadProviderPhoto(claims: SessionClaims, siteId: string, providerId: string, file: File) {
  await requireManage(claims, siteId);
  const p = await repo.getById(siteId, providerId);
  if (!p) throw errors.notFound("المزوّد غير موجود");
  if (!isStorageConfigured()) throw errors.internal("خدمة تخزين الصور غير مُهيّأة");
  if ((await repo.photoCount(providerId)) >= MAX_PROVIDER_PHOTOS) {
    throw errors.validation("وصلت الحد الأقصى لعدد الصور");
  }
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) throw errors.validation("صيغة غير مدعومة", { file: "الصيغ المدعومة: JPG أو PNG أو WEBP" });
  if (file.size > MAX_IMAGE_BYTES) {
    throw errors.validation("حجم الصورة كبير", { file: `أقصى حجم للصورة ${maxSizeLabel(MAX_IMAGE_BYTES)}` });
  }
  // Store the KEY (not a full URL); the public serializer resolves it via publicUrl.
  const key = siteAssetKey("providers", siteId, `${randomUUID()}.${ext}`);
  await putObject(key, Buffer.from(await file.arrayBuffer()), file.type);
  const count = await repo.photoCount(providerId);
  return repo.addPhoto(providerId, key, count);
}

export async function updateProviderPhoto(claims: SessionClaims, siteId: string, providerId: string, photoId: string, input: UpdatePhotoInput) {
  await requireManage(claims, siteId);
  const p = await repo.getById(siteId, providerId);
  if (!p) throw errors.notFound("المزوّد غير موجود");
  const photo = await repo.getPhoto(providerId, photoId);
  if (!photo) throw errors.notFound("الصورة غير موجودة");
  return repo.updatePhoto(photoId, {
    ...(input.caption !== undefined ? { caption: input.caption.trim() || null } : {}),
    ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
  });
}

export async function deleteProviderPhoto(claims: SessionClaims, siteId: string, providerId: string, photoId: string) {
  await requireManage(claims, siteId);
  const p = await repo.getById(siteId, providerId);
  if (!p) throw errors.notFound("المزوّد غير موجود");
  const photo = await repo.getPhoto(providerId, photoId);
  if (!photo) throw errors.notFound("الصورة غير موجودة");
  await deleteObject(photo.key).catch(() => {}); // best-effort; the row is the source of truth
  await repo.removePhoto(photoId);
  return { ok: true as const };
}

/* ───────────────────── public read (the only public path) ───────────────────── */

/** Resolve a public profile by (site slug, provider slug). Returns null (→ the
 *  route 404s) whenever the site/provider isn't publicly visible per visibility.ts.
 *  The returned payload is the serialized shape — phones/customers never in it. */
export async function getPublicProfile(siteSlug: string, providerSlug: string) {
  const site = await getPrisma().site.findUnique({
    where: { slug: siteSlug },
    select: { id: true, status: true, maintenanceMode: true, settings: { select: { publicProfilesEnabled: true } } },
  });
  if (!site || site.status !== "published" || site.maintenanceMode) return null;

  const provider = await repo.getPublicBySlug(site.id, providerSlug);
  if (!provider) return null;

  const visible = isProfilePublic(
    { publicProfilesEnabled: site.settings?.publicProfilesEnabled ?? false },
    {
      profilePublic: provider.profilePublic,
      status: provider.status,
      verifiedAt: provider.verifiedAt,
      ratingCount: provider.ratingCount,
    },
  );
  if (!visible) return null;

  const comments = await repo.approvedComments(provider.id);
  return serializePublicProfile(providerSlug, provider, comments);
}
