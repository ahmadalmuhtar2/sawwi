// PUBLIC (site-session authorized): a SELLER or MANAGER uploads a listing image
// from the on-site seller flow / admin. Mirrors /api/uploads/staging but authorizes
// via the site session (authorContext = can-author) instead of platform claims, and
// namespaces the object under the caller's own site.

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { withRoute } from "@/lib/http";
import { authorContext } from "@/server/site-auth/site-auth.service";
import { putObject, isStorageConfigured } from "@/lib/storage";
import { siteAssetKey } from "@/lib/storage-keys";
import { SITE_SESSION_COOKIE } from "@/lib/site-host";
import { errors } from "@/shared/errors";
import { MAX_IMAGE_BYTES, maxSizeLabel } from "@/shared/uploads";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const POST = withRoute(async (req) => {
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value ?? null;
  const { site } = await authorContext(req.headers.get("host"), token);
  if (!isStorageConfigured()) throw errors.internal("خدمة تخزين الصور غير مُهيّأة");

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw errors.validation("لم يتم إرفاق صورة", { file: "اختر صورة" });
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) throw errors.validation("صيغة غير مدعومة", { file: "الصيغ المدعومة: JPG أو PNG أو WEBP" });
  if (file.size > MAX_IMAGE_BYTES) {
    throw errors.validation("حجم الصورة كبير", { file: `أقصى حجم للصورة ${maxSizeLabel(MAX_IMAGE_BYTES)}` });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await putObject(siteAssetKey("templates", site.id, `${randomUUID()}.${ext}`), buffer, file.type);
  return { url };
});
