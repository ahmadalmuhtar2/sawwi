"use client";

import { useRef, useState } from "react";
import { ImageIcon, Upload } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { Spinner } from "@/components/ui/feedback";

// Accepted client-side types per asset. The server re-validates.
const ACCEPT: Record<"og" | "favicon", string> = {
  og: "image/png,image/jpeg,image/webp",
  favicon: "image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/webp",
};
const HINT: Record<"og" | "favicon", string> = {
  og: "JPG أو PNG أو WEBP — ١٠ ميغابايت كحد أقصى",
  favicon: "PNG أو SVG أو ICO — ١ ميغابايت كحد أقصى",
};

/**
 * Uploads an SEO asset (Open Graph share image or favicon) for a site and
 * hands back its URL via onChange. POSTs to /api/sites/:id/seo/image with the
 * asset `key`; the wizard submits the resulting URL in the SEO payload.
 */
export function SeoImageUploader({
  siteId,
  assetKey,
  value,
  onChange,
}: {
  siteId: string;
  assetKey: "og" | "favicon";
  value: string;
  onChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("key", assetKey);
      const res = await api.post<{ url: string }>(`/api/sites/${siteId}/seo/image`, fd);
      onChange(res.url);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? (err.fields?.file ?? err.message) : "تعذّر رفع الصورة",
      );
    } finally {
      setBusy(false);
    }
  }

  const isFavicon = assetKey === "favicon";

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="relative shrink-0 overflow-hidden rounded-lg border border-line bg-bg outline-none focus-ring disabled:opacity-70 cursor-pointer"
        style={isFavicon ? { width: 56, height: 56 } : { width: 96, height: 56 }}
        aria-label="رفع الصورة"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-faint">
            <ImageIcon className="size-6" />
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
            <Spinner className="size-4" />
          </span>
        )}
      </button>

      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline cursor-pointer disabled:opacity-50"
          >
            <Upload className="size-3.5" /> {value ? "تغيير" : "رفع صورة"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => { setError(null); onChange(""); }}
              disabled={busy}
              className="text-xs font-medium text-danger hover:underline cursor-pointer disabled:opacity-50"
            >
              إزالة
            </button>
          )}
        </div>
        <p className="text-xs text-muted">{HINT[assetKey]}</p>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT[assetKey]}
        className="hidden"
        onChange={onPick}
      />
    </div>
  );
}
