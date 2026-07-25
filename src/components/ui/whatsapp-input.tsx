"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented";
import { PhoneInput } from "@/components/ui/phone-input";
import { whatsappLink } from "@/sections/types";

type Mode = "number" | "link";

const WA_PREFIX = "https://wa.me/";

/** A stored value is a direct link if it looks like a URL / wa.me path. */
export function isWhatsAppLink(v: string): boolean {
  return /^(https?:\/\/|wa\.me\/)/i.test(v.trim());
}

/** The part after the wa.me/ prefix — tolerant of a full pasted link. */
function linkRest(v: string): string {
  return v.trim().replace(/^https?:\/\//i, "").replace(/^wa\.me\//i, "");
}

/**
 * WhatsApp contact field — optional, accepts EITHER a phone number (with country
 * flag) OR a direct WhatsApp link. To save the reseller work, number mode shows
 * the auto-generated wa.me link, and link mode pins the "https://wa.me/" prefix
 * so only the number is typed. Emits a single string value.
 */
export function WhatsAppInput({
  value = "",
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [mode, setMode] = useState<Mode>(isWhatsAppLink(value) ? "link" : "number");

  // Switching mode only changes what's shown — it never edits or saves the value.
  return (
    <div className="space-y-2">
      <SegmentedControl
        size="sm"
        value={mode}
        onChange={setMode}
        options={[
          { value: "number", label: "رقم" },
          { value: "link", label: "رابط مباشر" },
        ]}
      />

      {mode === "number" ? (
        <>
          <PhoneInput value={value} onChange={onChange} />
          {value && !isWhatsAppLink(value) && (
            <p className="text-xs text-muted">
              سيُنشأ رابط واتساب تلقائيًا:{" "}
              <span dir="ltr" className="font-label text-ink">{whatsappLink(value)}</span>
            </p>
          )}
        </>
      ) : (
        <>
          <div
            dir="ltr"
            className="flex h-10 items-stretch rounded-md border border-line bg-surface transition focus-within:border-accent focus-within:ring-3 focus-within:ring-accent-100"
          >
            <span className="flex select-none items-center rounded-s-md border-e border-line bg-black/[0.03] px-2.5 font-label text-sm text-muted">
              https://wa.me/
            </span>
            <input
              dir="ltr"
              inputMode="numeric"
              value={linkRest(value)}
              onChange={(e) => {
                const rest = linkRest(e.target.value);
                onChange?.(rest ? WA_PREFIX + rest : "");
              }}
              placeholder="963944123456"
              className="h-full min-w-0 flex-1 rounded-e-md bg-transparent px-3 text-ink outline-none placeholder:text-faint"
            />
          </div>
          <p className="text-xs text-faint">أدخل الرقم بالصيغة الدولية بدون + أو مسافات.</p>
        </>
      )}
    </div>
  );
}
