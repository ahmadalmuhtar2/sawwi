import { randomUUID } from "node:crypto";
import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { putObject, isStorageConfigured } from "@/lib/storage";
import { stagingAssetKey } from "@/lib/storage-keys";
import { errors } from "@/shared/errors";
import { MAX_IMAGE_BYTES, maxSizeLabel } from "@/shared/uploads";

// POST /api/uploads/staging
// multipart { file } → uploads an image to the caller's per-user STAGING folder
// and returns its URL. Used during onboarding, before the site exists: the URL
// is kept in the wizard's localStorage draft and persisted into the new site's
// content on finish. Auth-gated (any signed-in user); bounded to image types.
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const POST = withRoute(async (req) => {
  const claims = await requireSessionClaims();
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
      file: "الصيغ المدعومة: JPG أو PNG أو WEBP",
    });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw errors.validation("حجم الصورة كبير", { file: `أقصى حجم للصورة ${maxSizeLabel(MAX_IMAGE_BYTES)}` });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await putObject(
    stagingAssetKey(claims.userId, `${randomUUID()}.${ext}`),
    buffer,
    file.type,
  );
  return { url: stored };
});
