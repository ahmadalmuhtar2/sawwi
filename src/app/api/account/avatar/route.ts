import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { putObject, isStorageConfigured } from "@/lib/storage";
import { errors } from "@/shared/errors";

// POST /api/account/avatar — multipart { file } → uploads to object storage and
// sets the signed-in user's `image`. Returns { url }. Small images only, so we
// upload through the server (no browser↔storage CORS needed).
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
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
  if (file.size > MAX_BYTES) {
    throw errors.validation("حجم الصورة كبير", { file: "أقصى حجم للصورة ٢ ميغابايت" });
  }

  // Stable key per user → a new upload overwrites the old (no orphan buildup).
  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await putObject(`avatars/${claims.userId}.${ext}`, buffer, file.type);

  // Cache-bust so an overwritten avatar refreshes in the browser.
  const url = `${stored}?v=${Date.now()}`;
  await getPrisma().user.update({
    where: { id: claims.userId },
    data: { image: url },
  });

  return { url };
});
