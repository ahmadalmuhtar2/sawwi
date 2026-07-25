"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Printer, QrCode, IdCard, Info } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { getPalette, PALETTES } from "@/sections/palette";
import { cn } from "@/lib/cn";

interface Props {
  slug: string;
  siteUrl: string;
  businessName: string;
  logoUrl: string | null;
  paletteKey: string | null;
  phone: string;
  whatsapp: string;
  address: string;
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

// Inline SVG icons (work in the print window, which has no React/lucide).
const ICON = {
  phone: (c: string) =>
    `<svg viewBox="0 0 24 24" width="3.6mm" height="3.6mm" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  wa: (c: string) =>
    `<svg viewBox="0 0 24 24" width="3.6mm" height="3.6mm" fill="${c}"><path d="M17.6 6.3A7.85 7.85 0 0 0 12 4a7.94 7.94 0 0 0-6.9 11.9L4 20l4.2-1.1a7.9 7.9 0 0 0 3.8 1A7.94 7.94 0 0 0 20 12a7.87 7.87 0 0 0-2.4-5.7ZM12 18.5a6.6 6.6 0 0 1-3.36-.92l-.24-.14-2.5.65.67-2.43-.16-.25A6.59 6.59 0 1 1 12 18.5Zm3.62-4.94c-.2-.1-1.17-.58-1.35-.64-.18-.07-.31-.1-.44.1-.13.2-.5.64-.62.77-.11.13-.23.14-.43.05a5.4 5.4 0 0 1-1.6-.99 6 6 0 0 1-1.1-1.37c-.12-.2 0-.3.09-.4l.3-.35c.1-.12.13-.2.2-.34.06-.13.03-.25-.02-.35-.05-.1-.44-1.07-.6-1.46-.16-.38-.32-.33-.44-.33h-.37a.72.72 0 0 0-.52.24 2.18 2.18 0 0 0-.68 1.62c0 .96.7 1.88.8 2.01.1.13 1.37 2.1 3.33 2.94.47.2.83.32 1.11.42.47.15.9.13 1.23.08.38-.06 1.17-.48 1.33-.94.16-.46.16-.86.11-.94-.05-.08-.18-.13-.38-.23Z"/></svg>`,
  pin: (c: string) =>
    `<svg viewBox="0 0 24 24" width="3.6mm" height="3.6mm" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
};

export const CARD_TEMPLATES = [
  { key: "band", label: "بأعلى ملوّن" },
  { key: "sidebar", label: "شريط جانبي" },
  { key: "solid", label: "ملوّن بالكامل" },
  { key: "dark", label: "داكن" },
  { key: "minimal", label: "بسيط" },
] as const;
type TemplateKey = (typeof CARD_TEMPLATES)[number]["key"];

interface CardOpts {
  template: TemplateKey;
  businessName: string;
  logoUrl: string | null;
  accent: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  address: string;
  qr: string | null;
  showQr: boolean;
}

function logoBox(url: string | null, mm: number, bg: string) {
  if (!url) return "";
  return `<div style="width:${mm}mm;height:${mm}mm;border-radius:1.6mm;background:${bg};padding:0.6mm;flex:none;box-shadow:0 0.2mm 0.6mm rgba(0,0,0,.12)"><img src="${esc(url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:1mm"/></div>`;
}

function qrBox(qr: string | null, show: boolean, mm: number, onDark: boolean) {
  if (!qr || !show) return "";
  const wrap = onDark
    ? `background:#fff;padding:1mm;border-radius:1.4mm`
    : `background:#fff;padding:0;border-radius:1mm`;
  return `<div style="${wrap};flex:none"><img src="${qr}" alt="QR" style="width:${mm}mm;height:${mm}mm;display:block"/></div>`;
}

function contacts(o: CardOpts, color: string, iconColor: string, gap = 1.7) {
  const rows: string[] = [];
  const add = (icon: string, value: string) => {
    if (!value) return;
    rows.push(
      `<div style="display:flex;align-items:center;gap:1.8mm;font-size:7.5pt;color:${color};line-height:1.3"><span style="flex:none;display:flex">${icon}</span><span dir="ltr" style="unicode-bidi:plaintext">${esc(value)}</span></div>`,
    );
  };
  add(ICON.phone(iconColor), o.phone);
  add(ICON.wa(iconColor), o.whatsapp);
  add(ICON.pin(iconColor), o.address);
  if (!rows.length) return "";
  return `<div style="display:flex;flex-direction:column;gap:${gap}mm">${rows.join("")}</div>`;
}

function nameBlock(o: CardOpts, nameColor: string, tagColor: string, nameSize = 13) {
  return `<div style="min-width:0">
    <div style="font-size:${nameSize}pt;font-weight:800;color:${nameColor};letter-spacing:-0.2pt;line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(o.businessName)}</div>
    ${o.tagline ? `<div style="font-size:7.5pt;font-weight:600;color:${tagColor};margin-top:0.6mm">${esc(o.tagline)}</div>` : ""}
  </div>`;
}

const CARD_BASE =
  "width:85mm;height:55mm;border-radius:3mm;overflow:hidden;box-sizing:border-box;font-family:'Readex Pro Variable','Segoe UI',Tahoma,sans-serif;direction:rtl;position:relative;-webkit-print-color-adjust:exact;print-color-adjust:exact";

/** Self-contained card markup (inline styles) → identical in preview and print. */
function cardHtml(o: CardOpts): string {
  const { accent } = o;
  switch (o.template) {
    case "band":
      return `<div style="${CARD_BASE};background:#fff;border:0.2mm solid #ececec;display:flex;flex-direction:column">
        <div style="height:15mm;background:${accent};display:flex;align-items:center;gap:2.6mm;padding:0 4.5mm">
          ${logoBox(o.logoUrl, 10.5, "#fff")}
          ${nameBlock(o, "#fff", "rgba(255,255,255,.85)", 12.5)}
        </div>
        <div style="flex:1;display:flex;align-items:center;justify-content:space-between;padding:3.5mm 4.5mm;gap:3mm">
          ${contacts(o, "#333", accent) || "<div></div>"}
          ${qrBox(o.qr, o.showQr, 16, false)}
        </div>
      </div>`;

    case "sidebar":
      return `<div style="${CARD_BASE};background:#fff;border:0.2mm solid #ececec;display:flex">
        <div style="width:24mm;background:${accent};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2.4mm;padding:3mm;flex:none">
          ${logoBox(o.logoUrl, 12, "#fff")}
          ${qrBox(o.qr, o.showQr, 14, true)}
        </div>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:2.4mm;padding:4.5mm 4.5mm">
          ${nameBlock(o, "#1a1a1a", accent, 13)}
          <div style="height:0.3mm;background:#eee"></div>
          ${contacts(o, "#333", accent)}
        </div>
      </div>`;

    case "solid":
      return `<div style="${CARD_BASE};background:${accent};display:flex;flex-direction:column;justify-content:space-between;padding:5mm 5mm">
        <div style="display:flex;align-items:center;gap:2.8mm">
          ${logoBox(o.logoUrl, 12, "rgba(255,255,255,.95)")}
          ${nameBlock(o, "#fff", "rgba(255,255,255,.9)", 13.5)}
        </div>
        <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:3mm">
          ${contacts(o, "rgba(255,255,255,.95)", "#fff") || "<div></div>"}
          ${qrBox(o.qr, o.showQr, 15, true)}
        </div>
      </div>`;

    case "dark":
      return `<div style="${CARD_BASE};background:#17181b;display:flex;flex-direction:column;justify-content:space-between;padding:5mm">
        <div style="display:flex;align-items:center;gap:2.8mm">
          ${logoBox(o.logoUrl, 11.5, "#26272b")}
          ${nameBlock(o, "#f5f5f5", accent, 13)}
        </div>
        <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:3mm">
          ${contacts(o, "#d4d4d8", accent) || "<div></div>"}
          ${qrBox(o.qr, o.showQr, 15, true)}
        </div>
      </div>`;

    case "minimal":
    default:
      return `<div style="${CARD_BASE};background:#fff;border:0.2mm solid #ececec;border-inline-start:1.8mm solid ${accent};display:flex;align-items:center;justify-content:space-between;padding:5mm 5.5mm;gap:3mm">
        <div style="display:flex;flex-direction:column;gap:3mm;min-width:0">
          <div style="display:flex;align-items:center;gap:2.6mm">
            ${logoBox(o.logoUrl, 11, "#f7f7f7")}
            ${nameBlock(o, "#1a1a1a", accent, 13)}
          </div>
          ${contacts(o, "#444", accent)}
        </div>
        ${qrBox(o.qr, o.showQr, 17, false)}
      </div>`;
  }
}

function printDoc(title: string, bodyHtml: string) {
  const w = window.open("", "_blank", "width=760,height=560");
  if (!w) {
    alert("فضلاً اسمح بالنوافذ المنبثقة لطباعة البطاقة.");
    return;
  }
  w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
    <title>${esc(title)}</title>
    <style>@page{margin:12mm}html,body{margin:0}
      /* Force background colors/images to print (default is to drop them). */
      *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important}
      body{display:flex;flex-direction:column;align-items:center;
      justify-content:center;min-height:100vh;gap:6mm;background:#fff;
      font-family:system-ui,'Segoe UI',Tahoma,sans-serif}
      @media print{body{min-height:auto}}</style></head>
    <body onload="window.focus();window.print()">${bodyHtml}</body></html>`);
  w.document.close();
}

export function SharePrint({
  slug, siteUrl, businessName, logoUrl, paletteKey, phone, whatsapp, address,
}: Props) {
  const [tagline, setTagline] = useState("");
  const [template, setTemplate] = useState<TemplateKey>("band");
  const [accent, setAccent] = useState(getPalette(paletteKey).swatch);
  const [showQr, setShowQr] = useState(true);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const qrWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = qrWrapRef.current?.querySelector("canvas")?.toDataURL("image/png") ?? null;
    setQrUrl(url);
  }, [siteUrl]);

  const opts: CardOpts = {
    template, businessName, logoUrl, accent, tagline, phone, whatsapp, address,
    qr: qrUrl, showQr,
  };

  function downloadQr() {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `${slug}-qr.png`;
    a.click();
  }

  function printQr() {
    if (!qrUrl) return;
    printDoc(`${businessName} — QR`, `
      <div style="text-align:center;direction:rtl">
        <div style="font-size:22px;font-weight:800;margin-bottom:4px">${esc(businessName)}</div>
        <div style="font-size:13px;color:#666;margin-bottom:14px">امسح الرمز لزيارة موقعنا</div>
        <img src="${qrUrl}" style="width:320px;height:320px"/>
        <div dir="ltr" style="font-size:13px;color:#444;margin-top:10px">${esc(siteUrl)}</div>
      </div>`);
  }

  function printCard() {
    printDoc(`${businessName} — بطاقة`, cardHtml(opts));
  }

  return (
    <div className="space-y-8">
      {/* QR code */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <QrCode className="size-4 text-accent" />
          <h3 className="font-bold text-ink">رمز QR للموقع</h3>
        </div>
        <p className="mb-4 text-sm text-muted">
          اطبعه وضعه في المحل ليصل الزبائن إلى موقعك بمسح سريع.
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <div ref={qrWrapRef} className="rounded-lg border border-line bg-white p-3">
            <QRCodeCanvas value={siteUrl} size={512} marginSize={2} className="size-36!" />
          </div>
          <div className="space-y-2">
            <p className="font-label text-xs text-faint" dir="ltr">{siteUrl}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={downloadQr} className="gap-1.5">
                <Download className="size-4" /> تنزيل PNG
              </Button>
              <Button size="sm" variant="secondary" onClick={printQr} className="gap-1.5">
                <Printer className="size-4" /> طباعة
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-line" />

      {/* Business card designer */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <IdCard className="size-4 text-accent" />
          <h3 className="font-bold text-ink">مصمّم بطاقة العمل</h3>
        </div>

        {!logoUrl && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-warn/40 bg-warn-100/50 p-3 text-sm text-ink">
            <Info className="mt-0.5 size-4 shrink-0 text-warn" />
            <span>ارفع شعار الموقع من تبويب «معلومات الموقع» ليظهر على البطاقة.</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_auto]">
          {/* Controls */}
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-ink">التصميم</p>
              <div className="flex flex-wrap gap-2">
                {CARD_TEMPLATES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTemplate(t.key)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm transition cursor-pointer",
                      template === t.key
                        ? "border-accent bg-accent-50 text-accent-900 font-medium"
                        : "border-line text-muted hover:border-accent-200",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-ink">اللون</p>
              <div className="flex flex-wrap items-center gap-2">
                {PALETTES.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setAccent(p.swatch)}
                    title={p.label}
                    aria-label={p.label}
                    className={cn(
                      "size-8 rounded-full transition cursor-pointer",
                      accent === p.swatch ? "ring-2 ring-ink ring-offset-2" : "hover:scale-110",
                    )}
                    style={{ backgroundColor: p.swatch }}
                  />
                ))}
                <label className="ms-1 flex size-8 cursor-pointer items-center justify-center rounded-full border border-dashed border-line text-xs text-muted" title="لون مخصّص">
                  +
                  <input
                    type="color"
                    className="absolute size-0 opacity-0"
                    onChange={(e) => setAccent(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <Field label="نص إضافي (اختياري)" hint="شعار أو وصف قصير يظهر تحت الاسم" className="max-w-md">
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="مثال: أفضل حلاقة في دمشق"
                maxLength={42}
              />
            </Field>

            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={showQr}
                onChange={(e) => setShowQr(e.target.checked)}
                className="size-4 accent-accent"
              />
              إظهار رمز QR على البطاقة
            </label>

            <Button onClick={printCard} className="gap-2">
              <Printer className="size-4" /> طباعة البطاقة
            </Button>
          </div>

          {/* Live preview (rendered at true 85×55mm) */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="rounded-[3mm] shadow-lg"
              dangerouslySetInnerHTML={{ __html: cardHtml(opts) }}
            />
            <span className="text-xs text-faint">مقاس فعلي ٨٥ × ٥٥ ملم</span>
          </div>
        </div>
      </section>
    </div>
  );
}
