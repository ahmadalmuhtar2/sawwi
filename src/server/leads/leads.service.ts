// Landing-page lead business logic. Two audiences:
//   · PUBLIC — an unauthenticated visitor submits the "free preview" form
//     (createLead). No claims; abuse is contained by honeypot + per-IP/global
//     rate limits. Every new lead notifies all platform admins (best-effort).
//   · ADMIN — a platform admin reads and triages the pipeline (list/update/
//     delete). EVERY admin function asserts platformRole === admin.

import type { SessionClaims } from "@/server/access/access.rules";
import { errors } from "@/shared/errors";
import type { LeadStatus } from "@/generated/prisma/enums";
import { notifyNewLead } from "@/server/notifications/notifications.service";
import type { CreateLeadInput, UpdateLeadInput } from "./leads.schema";
import { leadsRepository, type LeadListQuery } from "./leads.repository";
import {
  LEAD_RATE_WINDOW_MS,
  MAX_LEADS_GLOBAL,
  MAX_LEADS_PER_IP,
  isHoneypotTripped,
  normalizeSyrianWhatsapp,
} from "./leads.rules";

function assertAdmin(claims: SessionClaims) {
  if (claims.platformRole !== "admin") throw errors.forbidden("هذه الصفحة للمشرف فقط");
}

/* ─────────────────────────────── public ─────────────────────────────── */

/**
 * Accept a lead from the public landing form. Returns `{ ok }` even for honeypot
 * hits (so bots learn nothing). Throws VALIDATION_ERROR for a bad WhatsApp number
 * and RATE_LIMITED when the window caps are exceeded.
 */
export async function createLead(input: CreateLeadInput, ipHash: string | null) {
  // Silently swallow obvious bots — same success shape, nothing stored.
  if (isHoneypotTripped(input.company)) return { ok: true as const };

  const whatsapp = normalizeSyrianWhatsapp(input.whatsapp);
  if (!whatsapp) {
    throw errors.validation("رقم واتساب غير صحيح", {
      whatsapp: "رقم واتساب لازم يكون ٩ أرقام بعد ٩٦٣",
    });
  }

  const now = new Date();
  const since = new Date(now.getTime() - LEAD_RATE_WINDOW_MS);
  if (ipHash && (await leadsRepository.countRecentByIp(ipHash, since)) >= MAX_LEADS_PER_IP) {
    throw errors.rateLimited("لقد أرسلت عدة طلبات، انتظر قليلًا قبل إرسال المزيد");
  }
  if ((await leadsRepository.countRecentGlobal(since)) >= MAX_LEADS_GLOBAL) {
    throw errors.rateLimited("تم استقبال عدد كبير من الطلبات الآن، حاول لاحقًا");
  }

  const lead = await leadsRepository.create({
    businessName: input.businessName,
    whatsapp,
    email: input.email?.trim() || null,
    ipHash,
  });
  // Notify every admin (best-effort — never fail the visitor's submit because a
  // notification couldn't be written).
  void notifyNewLead({ id: lead.id, businessName: lead.businessName, whatsapp: lead.whatsapp }).catch(
    () => {},
  );
  return { ok: true as const };
}

/* ───────────────────────────────  admin  ────────────────────────────── */

const DEFAULT_QUERY: LeadListQuery = { filter: "all", sort: "created", dir: "desc" };

export async function listLeads(claims: SessionClaims, query: LeadListQuery = DEFAULT_QUERY) {
  assertAdmin(claims);
  const [items, counts] = await Promise.all([
    leadsRepository.list(query),
    leadsRepository.countsByStatus(query.q),
  ]);
  return { items, counts };
}

export async function updateLead(claims: SessionClaims, id: string, input: UpdateLeadInput) {
  assertAdmin(claims);
  const lead = await leadsRepository.findById(id);
  if (!lead) throw errors.notFound("الطلب غير موجود");

  const data: {
    businessName?: string;
    whatsapp?: string;
    email?: string | null;
    status?: LeadStatus;
    note?: string;
  } = {};
  if (input.businessName !== undefined) data.businessName = input.businessName;
  if (input.status !== undefined) data.status = input.status;
  if (input.note !== undefined) data.note = input.note;
  if (input.email !== undefined) data.email = input.email.trim() || null; // "" clears it
  if (input.whatsapp !== undefined) {
    const w = normalizeSyrianWhatsapp(input.whatsapp);
    if (!w) {
      throw errors.validation("رقم واتساب غير صحيح", {
        whatsapp: "رقم واتساب لازم يكون ٩ أرقام بعد ٩٦٣",
      });
    }
    data.whatsapp = w;
  }
  return leadsRepository.update(id, data);
}

export async function deleteLead(claims: SessionClaims, id: string) {
  assertAdmin(claims);
  const lead = await leadsRepository.findById(id);
  if (!lead) throw errors.notFound("الطلب غير موجود");
  await leadsRepository.delete(id);
  return { id, deleted: true as const };
}
