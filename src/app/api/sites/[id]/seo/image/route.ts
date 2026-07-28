import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { requireSiteSettingsEdit } from "@/server/sites/sites.service";
import { putObject, isStorageConfigured } from "@/lib/storage";
import { siteAssetKey } from "@/lib/storage-keys";
import { errors } from "@/shared/errors";

// POST /api/sites/:id/seo/image — multipart { file, key } → uploads an SEO asset
// (the Open Graph share image or the site favicon) and returns its URL. The
// caller writes the URL into the SEO payload. Settings-level edit (same gate as
// the logo). Favicons may be SVG/ICO; the OG share image is a raster photo.
// The OG share image is JPG/PNG ONLY — WhatsApp (a primary share channel here)
// does not render WebP link-preview images, so we never store the share image as
// WebP. Favicons may still be WebP (they're not used for social previews).
const KEYS = {
  og: { max: 10 * 1024 * 1024, exts: { "image/jpeg": "jpg", "image/png": "png" } as Record<string, string> },
  favicon: { max: 1 * 1024 * 1024, exts: { "image/png": "png", "image/svg+xml": "svg", "image/x-icon": "ico", "image/vnd.microsoft.icon": "ico", "image/webp": "webp" } as Record<string, string> },
} as const;

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
  const key = form.get("key");
  if (typeof key !== "string" || !(key in KEYS)) {
    throw errors.validation("حقل صورة غير صالح", { key: "مفتاح غير صالح" });
  }
  const spec = KEYS[key as keyof typeof KEYS];
  if (!(file instanceof File)) {
    throw errors.validation("لم يتم إرفاق صورة", { file: "اختر صورة" });
  }

  const ext = spec.exts[file.type];
  if (!ext) {
    throw errors.validation("صيغة غير مدعومة", {
      file: key === "favicon"
        ? "الصيغ المدعومة: PNG أو SVG أو ICO"
        : "الصيغ المدعومة: JPG أو PNG فقط (واتساب لا يعرض صور WEBP في المعاينة)",
    });
  }
  if (file.size > spec.max) {
    const mb = Math.round(spec.max / (1024 * 1024));
    throw errors.validation("حجم الصورة كبير", { file: `أقصى حجم للصورة ${mb} ميغابايت` });
  }

  // Per-website folder, stable key per asset → a same-type re-upload overwrites
  // (no orphans); an extension change is cleaned up by updateSeo's diff.
  const kind = key === "favicon" ? "favicons" : "og";
  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await putObject(siteAssetKey(kind, id, `${key}.${ext}`), buffer, file.type);

  // Cache-bust so a replaced asset refreshes in the browser.
  return { url: `${stored}?v=${Date.now()}` };
});
