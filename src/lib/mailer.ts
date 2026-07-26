// SMTP mailer + the ONE base email template every message is built on. In dev
// this targets the local Mailpit container — open http://localhost:8025 to read
// the emails as if they were really delivered.
//
// Design: `renderEmail` is the shared, RTL, email-client-safe shell (branding,
// preheader, card, bulletproof CTA button, copy-link fallback, footer). Each
// concrete email supplies only its texts — see src/constants/emails.ts.

import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter {
  if (!transporter) {
    const host = process.env.SMTP_HOST ?? "mailpit";
    const port = Number(process.env.SMTP_PORT ?? 1025);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    // Implicit TLS on 465; STARTTLS/none otherwise. Override with SMTP_SECURE.
    const secure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === "true"
      : port === 465;
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      // Authenticate when creds are provided. Local Mailpit has no auth/TLS —
      // only then do we skip TLS.
      auth: user && pass ? { user, pass } : undefined,
      ignoreTLS: !user && !secure,
    });
  }
  return transporter;
}

/** True when EmailJS is fully configured — then it's the transport of record
 *  (prod). Otherwise we fall back to SMTP/nodemailer (local Mailpit). */
function emailjsConfigured(): boolean {
  return Boolean(
    process.env.EMAILJS_SERVICE_ID &&
      process.env.EMAILJS_TEMPLATE_ID &&
      process.env.EMAILJS_PUBLIC_KEY &&
      process.env.EMAILJS_PRIVATE_KEY,
  );
}

/** Send through EmailJS's REST API (server-side, "non-browser" strict mode —
 *  requires the private key as accessToken). The EmailJS template must expose
 *  these params: `to_email`, `subject`, `html` (see .env.example for setup). */
async function sendViaEmailJS(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: {
        to_email: opts.to,
        subject: opts.subject,
        html: opts.html,
        from_name: process.env.MAIL_FROM ?? "Sawwi",
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`EmailJS send failed (${res.status}): ${body}`);
  }
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (emailjsConfigured()) {
    await sendViaEmailJS(opts);
    return;
  }
  await getTransport().sendMail({
    from: process.env.MAIL_FROM ?? "Sawwi <no-reply@sawwi.local>",
    ...opts,
  });
}

// --- Base template ----------------------------------------------------------

// Brand palette (mirrors docs/DESIGN_BRIEF.md). Emails require INLINE styles, so
// these are the single source of truth referenced throughout the shell below.
const C = {
  accent: "#1f5138",
  bg: "#f6f5f1",
  card: "#ffffff",
  line: "#e7e3dc",
  ink: "#2b2622",
  muted: "#5a544c",
  faint: "#9a938a",
};
const FONT = "'Segoe UI',Tahoma,Arial,sans-serif";

export interface EmailContent {
  /** Hidden inbox preview text (shown next to the subject in most clients). */
  preheader?: string;
  heading: string;
  /** Body paragraphs, rendered in order. */
  paragraphs: string[];
  /** Primary call-to-action button. */
  cta?: { label: string; url: string };
  /** Small muted note under the CTA (e.g. "ignore if you didn't request this"). */
  footnote?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Render an email's content onto the shared Sawwi base template. */
export function renderEmail(c: EmailContent): string {
  const year = new Date().getFullYear();

  const preheader = c.preheader
    ? `<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${escapeHtml(
        c.preheader,
      )}</span>`
    : "";

  const paragraphs = c.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.9;color:${C.muted}">${escapeHtml(
          p,
        )}</p>`,
    )
    .join("");

  // Bulletproof button (table-based) so Outlook renders the padding/background.
  // Action is the button only — no visible raw link.
  const cta = c.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px">
         <tr><td style="border-radius:10px;background:${C.accent}">
           <a href="${c.cta.url}" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px">${escapeHtml(
             c.cta.label,
           )}</a>
         </td></tr>
       </table>`
    : "";

  const footnote = c.footnote
    ? `<p style="margin:20px 0 0;font-size:12px;line-height:1.7;color:${C.faint}">${escapeHtml(
        c.footnote,
      )}</p>`
    : "";

  return `<!doctype html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:${FONT};color:${C.ink}">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:${C.card};border:1px solid ${C.line};border-radius:16px;overflow:hidden">
        <!-- Header / brand -->
        <tr><td style="background:${C.accent};padding:22px 28px">
          <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-.5px">سوّي</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:30px 28px">
          <h1 style="margin:0 0 14px;font-size:21px;font-weight:800;color:${C.ink}">${escapeHtml(
            c.heading,
          )}</h1>
          ${paragraphs}
          ${cta}
          ${footnote}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:18px 28px;border-top:1px solid ${C.line};background:#fbfaf8">
          <p style="margin:0;font-size:12px;line-height:1.7;color:${C.faint}">
            سوّي — أنشئ موقع عملك في دقائق.<br>
            © ${year} سوّي. جميع الحقوق محفوظة.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
