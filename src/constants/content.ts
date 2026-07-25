// Static, human-authored content — texts and message templates, no logic.
// Arabic-first (AGENT_GUIDE §9). Keep copy here so it's reviewed in one place
// and reused across the app/renderer/worker.

/** In-dashboard renewal reminders (AGENT_GUIDE §8 — no email/WhatsApp delivery). */
export const RENEWAL_ALERT_TEXT: Record<
  14 | 3,
  { ar: string; en: string }
> = {
  14: {
    ar: "يتبقى ١٤ يومًا على انتهاء اشتراك الموقع. جدّد لتفادي التوقف.",
    en: "14 days until this site's subscription expires. Renew to avoid downtime.",
  },
  3: {
    ar: "يتبقى ٣ أيام فقط على انتهاء اشتراك الموقع. جدّد الآن.",
    en: "Only 3 days until this site's subscription expires. Renew now.",
  },
};

/** WhatsApp deep-link message templates (contact = WhatsApp only, AGENT_GUIDE §7). */
export const WHATSAPP_TEMPLATES = {
  contact: {
    ar: (business: string) => `مرحبًا ${business}، أود الاستفسار عن خدماتكم.`,
    en: (business: string) => `Hello ${business}, I'd like to ask about your services.`,
  },
};

/** Suspended-site page copy (HTTP 402), shown when a subscription lapses. */
export const SUSPENDED_PAGE = {
  ar: {
    title: "الموقع متوقف مؤقتًا",
    body: "انتهى اشتراك هذا الموقع. يرجى التجديد لإعادة تفعيله.",
  },
  en: {
    title: "Site temporarily unavailable",
    body: "This site's subscription has ended. Please renew to reactivate it.",
  },
};
