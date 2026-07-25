"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { Avatar, Spinner } from "@/components/ui/feedback";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX = 2 * 1024 * 1024; // 2 MB

/**
 * Optional avatar picker. Uploads to /api/account/avatar (which sets the user's
 * image) and previews the result. Self-contained: shows its own inline error and
 * reports the new URL via onUploaded.
 */
export function AvatarUploader({
  initialUrl = null,
  name = "",
  size = 80,
  onUploaded,
}: {
  initialUrl?: string | null;
  name?: string;
  size?: number;
  onUploaded?: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!TYPES.includes(file.type)) {
      setError("الصيغ المدعومة: JPG أو PNG أو WEBP");
      return;
    }
    if (file.size > MAX) {
      setError("أقصى حجم للصورة ٢ ميغابايت");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post<{ url: string }>("/api/account/avatar", fd);
      setUrl(res.url);
      onUploaded?.(res.url);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? (err.fields?.file ?? err.message) : "تعذّر رفع الصورة",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="relative rounded-full outline-none focus-ring disabled:opacity-70 cursor-pointer"
        aria-label="رفع صورة"
      >
        {url ? (
          <Avatar name={name} src={url} size={size} />
        ) : name ? (
          <Avatar name={name} size={size} />
        ) : (
          <div
            className="flex items-center justify-center rounded-full bg-accent-100 text-accent"
            style={{ width: size, height: size }}
          >
            <Camera className="size-7" />
          </div>
        )}
        <span className="absolute -bottom-0.5 -left-0.5 flex size-6 items-center justify-center rounded-full border-2 border-surface bg-accent text-white">
          {uploading ? <Spinner className="size-3" /> : <Camera className="size-3" />}
        </span>
      </button>
      <span className="text-xs text-muted">{url ? "تغيير الصورة" : "أضف صورتك (اختياري)"}</span>
      {error && <span className="text-xs text-danger">{error}</span>}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onPick}
      />
    </div>
  );
}
