// Brand loading screen — the animated Sawwi mark (see /brand/loading-icon.svg).
// Used by route-level loading.tsx files (App Router shows them during the
// segment's data load / navigation). Centered in the available space.
export function LoadingScreen({ label = "جارٍ التحميل…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/loading-icon.svg" alt="" aria-hidden width={52} height={52} />
      <p className="text-sm text-muted">{label}</p>
      <span className="sr-only">{label}</span>
    </div>
  );
}
