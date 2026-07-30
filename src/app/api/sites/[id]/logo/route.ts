import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { requireSiteSettingsEdit } from "@/server/sites/sites.service";
import { getPrisma } from "@/lib/db";
import { putObject, isStorageConfigured, keyFromUrl, deleteByUrl } from "@/lib/storage";
import { siteAssetKey } from "@/lib/storage-keys";
import { errors } from "@/shared/errors";
import { MAX_IMAGE_BYTES, maxSizeLabel } from "@/shared/uploads";

// POST /api/sites/:id/logo — multipart { file } → uploads the site logo and sets
// Site.logoUrl. Small images, uploaded through the server (no browser↔storage CORS).
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

type Ctx = { params: Promise<{ id: string }> };

export const POST = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  await requireSiteSettingsEdit(claims, id); // authorization

  if (!isStorageConfigured()) {
    throw errors.internal("خدمة تخزين الصور غير مُهيّأة");
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    throw errors.validation("لم يتم إرفاق صورة", { file: "اختر صورة" });
  }

  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    throw errors.validation("صيغة غير مدعومة", {
      file: "الصيغ المدعومة: JPG أو PNG أو WEBP أو SVG",
    });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw errors.validation("حجم الصورة كبير", { file: `أقصى حجم للصورة ${maxSizeLabel(MAX_IMAGE_BYTES)}` });
  }

  // Per-website folder, stable key → same-type re-upload overwrites.
  const prev = await getPrisma().site.findUnique({ where: { id }, select: { logoUrl: true } });
  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await putObject(siteAssetKey("logos", id, `logo.${ext}`), buffer, file.type);

  // Cache-bust so an overwritten logo refreshes in the browser.
  const url = `${stored}?v=${Date.now()}`;
  await getPrisma().site.update({ where: { id }, data: { logoUrl: url } });

  // If the previous logo had a different extension, its object is now orphaned.
  if (keyFromUrl(prev?.logoUrl) !== keyFromUrl(url)) await deleteByUrl(prev?.logoUrl);

  return { url };
});

// DELETE /api/sites/:id/logo — remove the logo (and its stored object).
export const DELETE = withRoute(async (_req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  await requireSiteSettingsEdit(claims, id);
  const prev = await getPrisma().site.findUnique({ where: { id }, select: { logoUrl: true } });
  await getPrisma().site.update({ where: { id }, data: { logoUrl: null } });
  await deleteByUrl(prev?.logoUrl);
  return { ok: true };
});
