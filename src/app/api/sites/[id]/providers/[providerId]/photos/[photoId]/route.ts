import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { UpdatePhotoInput } from "@/server/providers/providers.schema";
import { updateProviderPhoto, deleteProviderPhoto } from "@/server/providers/providers.service";

type Ctx = { params: Promise<{ id: string; providerId: string; photoId: string }> };

export const PATCH = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, providerId, photoId } = await params;
  const input = UpdatePhotoInput.parse(await request.json());
  return updateProviderPhoto(claims, id, providerId, photoId, input);
});

export const DELETE = withRoute(async (_request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, providerId, photoId } = await params;
  return deleteProviderPhoto(claims, id, providerId, photoId);
});
