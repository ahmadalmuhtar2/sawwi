import { Wrench, Rocket, Clock } from "lucide-react";

// Branded full-screen page shown on a site's public domain when it isn't serving
// its real content: a fresh draft (coming soon), an admin/reseller pause
// (maintenance), or a lapsed subscription (expired). Self-contained + RTL so it
// looks polished from minute 0. Kept intentionally light/friendly for visitors.

export type HoldingVariant = "coming-soon" | "maintenance" | "expired";

const COPY: Record<
  HoldingVariant,
  { title: string; message: string; icon: typeof Wrench; tint: string }
> = {
  "coming-soon": {
    title: "قريبًا",
    message: "نُجهّز هذا الموقع الآن ليكون بأبهى حُلّة. عُد لزيارتنا بعد قليل!",
    icon: Rocket,
    tint: "#6366f1", // indigo
  },
  maintenance: {
    title: "الموقع قيد الصيانة",
    message: "نُجري بعض التحسينات لتحسين تجربتك. سنعود خلال وقت قصير، شكرًا لصبرك.",
    icon: Wrench,
    tint: "#f59e0b", // amber
  },
  expired: {
    title: "الموقع غير متاح حاليًا",
    message: "هذا الموقع متوقّف مؤقتًا. يُرجى المحاولة لاحقًا.",
    icon: Clock,
    tint: "#ef4444", // red
  },
};

export function HoldingPage({
  variant,
  businessName,
  logoUrl,
}: {
  variant: HoldingVariant;
  businessName?: string | null;
  logoUrl?: string | null;
}) {
  const { title, message, icon: Icon, tint } = COPY[variant];

  return (
    <main
      dir="rtl"
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#fdf7f0] via-white to-[#eef1fb] px-6 text-center"
    >
      {/* soft decorative blobs */}
      <div
        className="pointer-events-none absolute -top-28 -start-24 size-80 rounded-full blur-3xl"
        style={{ background: `${tint}22` }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -end-24 size-96 rounded-full blur-3xl"
        style={{ background: `${tint}1a` }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* brand */}
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- single hero logo, no layout shift concern
          <img src={logoUrl} alt={businessName ?? ""} className="mx-auto mb-8 h-14 w-auto object-contain" />
        ) : businessName ? (
          <p className="mb-8 text-lg font-extrabold text-neutral-800">{businessName}</p>
        ) : null}

        {/* illustrated icon badge with a pulsing ring */}
        <div className="relative mx-auto mb-8 flex size-28 items-center justify-center">
          <span
            className="absolute inset-0 animate-ping rounded-full opacity-30"
            style={{ background: tint }}
          />
          <span
            className="relative flex size-28 items-center justify-center rounded-full bg-white shadow-xl ring-1 ring-black/5"
          >
            <Icon className="size-12" style={{ color: tint }} strokeWidth={1.75} />
          </span>
        </div>

        <h1 className="text-3xl font-extrabold text-neutral-900">{title}</h1>
        <p className="mx-auto mt-3 max-w-sm leading-relaxed text-neutral-600">{message}</p>

        {/* decorative dots */}
        <div className="mt-8 flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-2 animate-bounce rounded-full"
              style={{ background: tint, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      <a
        href={process.env.NEXT_PUBLIC_APP_URL || "https://sawwi.online"}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-6 text-xs text-neutral-400 transition hover:text-neutral-600"
      >
        مدعوم من <span className="font-semibold text-neutral-500">سوّي</span>
      </a>
    </main>
  );
}
