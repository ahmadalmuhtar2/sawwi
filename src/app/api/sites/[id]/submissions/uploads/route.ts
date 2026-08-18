// PUBLIC (unauthenticated): a visitor filling the شغلة provider/customer form
// uploads an image (e.g. a work sample). The service defends this endpoint — the
// site must exist and collect submissions, the caller is rate-limited per IP, and
// only real images ≤2MB are accepted. Returns { url } to echo back in the submit.

import { withRoute } from "@/lib/http";
import { uploadSubmissionImage } from "@/server/submissions/submissions.service";
import { clientIpFromHeaders, hashIp } from "@/server/submissions/submissions.rules";
import { errors } from "@/shared/errors";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withRoute(async (request, { params }: Ctx) => {
  const { id } = await params;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw errors.validation("لم يتم إرفاق صورة", { file: "اختر صورة" });
  const ipHash = hashIp(clientIpFromHeaders(request.headers));
  return uploadSubmissionImage(id, file, ipHash);
});
