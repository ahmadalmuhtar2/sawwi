"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PhoneInput } from "@/components/ui/phone-input";
import { WhatsAppInput } from "@/components/ui/whatsapp-input";

export interface WebsiteInfo {
  whatsappNumber: string;
  phone: string;
  address: string;
  googleMapsUrl: string;
  socials: Record<string, string>;
}

const SOCIALS: { key: string; label: string; badge: string; placeholder: string }[] = [
  { key: "instagram", label: "إنستغرام", badge: "IG", placeholder: "https://instagram.com/…" },
  { key: "facebook", label: "فيسبوك", badge: "FB", placeholder: "https://facebook.com/…" },
  { key: "tiktok", label: "تيك توك", badge: "TT", placeholder: "https://tiktok.com/@…" },
];

export function WebsiteInfoEditor({
  initial,
  onSave,
}: {
  initial: WebsiteInfo;
  onSave: (info: WebsiteInfo) => Promise<void>;
}) {
  const [info, setInfo] = useState<WebsiteInfo>(initial);
  const [saving, setSaving] = useState(false);

  function setSocial(key: string, value: string) {
    setInfo((v) => ({ ...v, socials: { ...v.socials, [key]: value } }));
  }

  async function save() {
    setSaving(true);
    try {
      // Drop empty social links so we don't persist blanks.
      const socials = Object.fromEntries(
        Object.entries(info.socials).filter(([, v]) => v.trim()),
      );
      await onSave({ ...info, socials });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Field label="واتساب" hint="رقم واتساب أو رابط مباشر للمحادثة">
        <WhatsAppInput value={info.whatsappNumber} onChange={(v) => setInfo({ ...info, whatsappNumber: v })} />
      </Field>
      <Field label="رقم الهاتف">
        <PhoneInput value={info.phone} onChange={(v) => setInfo({ ...info, phone: v })} />
      </Field>
      <Field label="العنوان">
        <Input
          value={info.address}
          onChange={(e) => setInfo({ ...info, address: e.target.value })}
          placeholder="مثال: دمشق، شارع الحمرا، بناء رقم ٥"
        />
      </Field>
      <Field label="رابط الموقع على خرائط جوجل" hint="افتح موقعك في خرائط جوجل وانسخ الرابط">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0 text-faint" />
          <Input
            dir="ltr"
            value={info.googleMapsUrl}
            onChange={(e) => setInfo({ ...info, googleMapsUrl: e.target.value })}
            placeholder="https://maps.google.com/…"
          />
        </div>
      </Field>

      <div className="border-t border-line pt-4">
        <p className="mb-3 text-sm font-bold text-ink">حسابات التواصل الاجتماعي</p>
        <div className="space-y-3">
          {SOCIALS.map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line font-label text-xs font-bold text-muted">
                {s.badge}
              </span>
              <Input
                dir="ltr"
                value={info.socials[s.key] ?? ""}
                onChange={(e) => setSocial(s.key, e.target.value)}
                placeholder={s.placeholder}
                aria-label={s.label}
              />
            </div>
          ))}
        </div>
      </div>

      <Button onClick={save} loading={saving}>
        حفظ معلومات الموقع
      </Button>
    </div>
  );
}
