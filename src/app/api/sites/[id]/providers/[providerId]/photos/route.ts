import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { errors } from "@/shared/errors";
import { uploadProviderPhoto } from "@/server/providers/providers.service";

type Ctx = { params: Promise<{ id: string; providerId: string }> };

export const POST = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, providerId } = await params;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw errors.validation("لم يتم إرفاق صورة", { file: "اختر صورة" });
  return uploadProviderPhoto(claims, id, providerId, file);
});
