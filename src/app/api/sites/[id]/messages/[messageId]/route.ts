// Dashboard: triage a single visitor message — PATCH its status (read/archived/
// unread) or DELETE it. Both require settings-edit rights; the service checks.

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { MessageStatusInput } from "@/server/messages/messages.schema";
import { deleteMessage, setMessageStatus } from "@/server/messages/messages.service";

type Ctx = { params: Promise<{ id: string; messageId: string }> };

export const PATCH = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, messageId } = await params;
  const { status } = MessageStatusInput.parse(await request.json());
  return setMessageStatus(claims, id, messageId, status);
});

export const DELETE = withRoute(async (_request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, messageId } = await params;
  return deleteMessage(claims, id, messageId);
});
