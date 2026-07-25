"use client";

import { useRef, useState } from "react";
import { Camera, ImageIcon } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { Spinner } from "@/components/ui/feedback";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX = 2 * 1024 * 1024; // 2 MB

/**
 * Square logo picker for a site. Uploads to /api/sites/:id/logo (which sets
 * Site.logoUrl) and previews the result. Self-contained: inline error + optional
 * onChange with the new URL (null when removed).
 */
export function LogoUploader({
  siteId,
  initialUrl = null,
  size = 88,
  onChange,
}: {
  siteId: string;
  initialUrl?: string | null;
  size?: number;
  onChange?: (url: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!TYPES.includes(file.type)) {
      setError("الصيغ المدعومة: JPG أو PNG أو WEBP أو SVG");
      return;
    }
    if (file.size > MAX) {
      setError("أقصى حجم للصورة ٢ ميغابايت");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post<{ url: string }>(`/api/sites/${siteId}/logo`, fd);
      setUrl(res.url);
      onChange?.(res.url);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? (err.fields?.file ?? err.message) : "تعذّر رفع الصورة",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await api.del(`/api/sites/${siteId}/logo`);
      setUrl(null);
      onChange?.(null);
    } catch {
      setError("تعذّرت الإزالة");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="relative shrink-0 overflow-hidden rounded-lg border border-line bg-bg outline-none focus-ring disabled:opacity-70 cursor-pointer"
        style={{ width: size, height: size }}
        aria-label="رفع شعار الموقع"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL
          <img src={url} alt="شعار الموقع" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-faint">
            <ImageIcon className="size-7" />
          </span>
        )}
        <span className="absolute -bottom-0.5 -left-0.5 flex size-6 items-center justify-center rounded-full border-2 border-surface bg-accent text-white">
          {busy ? <Spinner className="size-3" /> : <Camera className="size-3" />}
        </span>
      </button>

      <div className="space-y-1">
        <p className="text-sm font-medium text-ink">شعار الموقع</p>
        <p className="text-xs text-muted">يظهر في القائمة وفي ترويسة الموقع. مربّع يُفضّل.</p>
        <div className="flex items-center gap-3 pt-0.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="text-xs font-medium text-accent hover:underline cursor-pointer disabled:opacity-50"
          >
            {url ? "تغيير الشعار" : "رفع شعار"}
          </button>
          {url && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="text-xs font-medium text-danger hover:underline cursor-pointer disabled:opacity-50"
            >
              إزالة
            </button>
          )}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={onPick}
      />
    </div>
  );
}
