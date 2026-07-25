import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { requireSiteBuilderEdit } from "@/server/sites/sites.service";
import { getPrisma } from "@/lib/db";
import { putObject, isStorageConfigured } from "@/lib/storage";
import { errors } from "@/shared/errors";

// POST /api/sites/:id/pages/:pageId/sections/:sectionId/image
// multipart { file, key } → uploads a section image (hero background, portrait,
// …) and returns its URL. The caller writes the URL into content[key]. Editing
// section content requires builder access (same gate as the rest of the builder).
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — photos can be larger than logos
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
// Content keys allowed to hold an image (defensive: bounds the storage path).
const KEY_RE = /^[a-zA-Z][a-zA-Z0-9]{0,39}$/;

type Ctx = { params: Promise<{ id: string; pageId: string; sectionId: string }> };

export const POST = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, pageId, sectionId } = await params;
  await requireSiteBuilderEdit(claims, id); // authorization

  if (!isStorageConfigured()) {
    throw errors.internal("خدمة تخزين الصور غير مُهيّأة");
  }

  // The section must belong to this page, which must belong to this site.
  const section = await getPrisma().sectionInstance.findFirst({
    where: { id: sectionId, pageId, page: { siteId: id } },
    select: { id: true },
  });
  if (!section) throw errors.notFound("القسم غير موجود");

  const form = await req.formData();
  const file = form.get("file");
  const key = form.get("key");
  if (!(file instanceof File)) {
    throw errors.validation("لم يتم إرفاق صورة", { file: "اختر صورة" });
  }
  if (typeof key !== "string" || !KEY_RE.test(key)) {
    throw errors.validation("حقل صورة غير صالح", { key: "مفتاح غير صالح" });
  }

  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    throw errors.validation("صيغة غير مدعومة", {
      file: "الصيغ المدعومة: JPG أو PNG أو WEBP",
    });
  }
  if (file.size > MAX_BYTES) {
    throw errors.validation("حجم الصورة كبير", { file: "أقصى حجم للصورة ٥ ميغابايت" });
  }

  // Stable key per (section, field) → re-upload overwrites (no orphan buildup).
  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await putObject(`sections/${sectionId}/${key}.${ext}`, buffer, file.type);

  // Cache-bust so a replaced image refreshes in the browser.
  return { url: `${stored}?v=${Date.now()}` };
});
