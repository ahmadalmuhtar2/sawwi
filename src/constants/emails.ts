// The catalogue of transactional emails. Each entry supplies ONLY its texts;
// the shared base template (src/lib/mailer.ts `renderEmail`) provides the branded
// shell. To add an email: add a definition here, then `buildEmail("key", vars)`.
//
// Arabic-first (AGENT_GUIDE §9). Copy lives here so it's reviewed in one place.

import { renderEmail, type EmailContent } from "@/lib/mailer";

interface EmailDefinition {
  subject: string;
  content: EmailContent;
}

/**
 * Each email is a function of its runtime variables (links, names…) returning a
 * subject + the content blocks that get rendered onto the base template.
 */
const EMAILS = {
  verifyEmail: (vars: { url: string }): EmailDefinition => ({
    subject: "تأكيد بريدك الإلكتروني — سوّي",
    content: {
      preheader: "أكّد بريدك الإلكتروني لتفعيل حسابك في سوّي.",
      heading: "أهلًا بك في سوّي 👋",
      paragraphs: [
        "يسعدنا انضمامك! تبقّت خطوة واحدة لتفعيل حسابك: أكّد بريدك الإلكتروني بالضغط على الزر أدناه.",
        "هذا الرابط صالح لمدة ساعة واحدة.",
      ],
      cta: { label: "تأكيد البريد الإلكتروني", url: vars.url },
      footnote: "إن لم تنشئ هذا الحساب، يمكنك تجاهل هذه الرسالة بأمان.",
    },
  }),

  collaboratorInvite: (vars: {
    inviter: string;
    businesses: string;
    url: string;
  }): EmailDefinition => ({
    subject: "دعوة للتعاون على موقع في سوّي",
    content: {
      preheader: `دعاك ${vars.inviter} لإدارة إعدادات ${vars.businesses}.`,
      heading: "لديك دعوة للتعاون 🤝",
      paragraphs: [
        `دعاك ${vars.inviter} لإدارة إعدادات: ${vars.businesses}.`,
        "سجّل الدخول بهذا البريد لتظهر لك المواقع مباشرة في لوحة التحكم.",
      ],
      cta: { label: "الدخول إلى سوّي", url: vars.url },
      footnote: "إن لم تكن تتوقّع هذه الدعوة، يمكنك تجاهل هذه الرسالة بأمان.",
    },
  }),

  expiryReminder: (vars: {
    businessName: string;
    daysLeft: number;
    stopDate: string;
    url: string;
  }): EmailDefinition => ({
    subject: `تذكير بالتجديد: ${vars.businessName} — ${vars.daysLeft} يوم متبقٍ`,
    content: {
      preheader: `اشتراك ${vars.businessName} ينتهي خلال ${vars.daysLeft} يومًا.`,
      heading: "تذكير بتجديد الاشتراك ⏰",
      paragraphs: [
        `يتبقّى ${vars.daysLeft} يومًا على انتهاء اشتراك موقع «${vars.businessName}».`,
        `سيتوقّف الموقع عن العمل بتاريخ ${vars.stopDate} إن لم يُجدَّد الاشتراك.`,
        "حصّل الدفعة من العميل وسجّلها في لوحة التحكم لتمديد التاريخ تلقائيًا.",
      ],
      cta: { label: "إدارة الفوترة", url: vars.url },
      footnote: "تصلك هذه التذكيرات قبل الانتهاء بأسبوع، وبثلاثة أيام، وبيوم واحد.",
    },
  }),

  setPassword: (vars: { url: string }): EmailDefinition => ({
    subject: "تفعيل حسابك وتعيين كلمة المرور — سوّي",
    content: {
      preheader: "أنشئ كلمة مرور لحسابك في سوّي لتبدأ.",
      heading: "أهلًا بك في سوّي 👋",
      paragraphs: [
        "تم إنشاء حساب لك في سوّي. لتفعيله والبدء، عيّن كلمة مرور بالضغط على الزر أدناه.",
        "هذا الرابط صالح لمدة ساعة واحدة.",
      ],
      cta: { label: "تعيين كلمة المرور", url: vars.url },
      footnote: "إن لم تكن تتوقّع هذه الرسالة، يمكنك تجاهلها بأمان.",
    },
  }),

  resetPassword: (vars: { url: string }): EmailDefinition => ({
    subject: "إعادة تعيين كلمة المرور — سوّي",
    content: {
      preheader: "رابط لتعيين كلمة مرور جديدة لحسابك.",
      heading: "إعادة تعيين كلمة المرور",
      paragraphs: [
        "تلقّينا طلبًا لإعادة تعيين كلمة مرور حسابك. اضغط الزر أدناه لتعيين كلمة مرور جديدة.",
        "هذا الرابط صالح لمدة ساعة واحدة.",
      ],
      cta: { label: "تعيين كلمة مرور جديدة", url: vars.url },
      footnote:
        "إن لم تطلب هذا الإجراء، يمكنك تجاهل هذه الرسالة وستبقى كلمة مرورك كما هي.",
    },
  }),
} as const;

type EmailKey = keyof typeof EMAILS;
type EmailVars<K extends EmailKey> = Parameters<(typeof EMAILS)[K]>[0];

/** Build a ready-to-send email: `{ subject, html }` from a registry key + vars. */
export function buildEmail<K extends EmailKey>(
  key: K,
  vars: EmailVars<K>,
): { subject: string; html: string } {
  const def = EMAILS[key](vars as never);
  return { subject: def.subject, html: renderEmail(def.content) };
}
