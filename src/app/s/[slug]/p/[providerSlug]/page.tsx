// PUBLIC provider profile — /p/[providerSlug] on a tenant subdomain (the proxy
// rewrites it to /s/[slug]/p/[providerSlug], and this named route wins over the
// template catch-all). It is DARK by default: getPublicProfile returns null (→
// 404) unless the site flag is on AND the provider is opted-in + ACTIVE + verified.
// The payload comes from the serializer, which never includes phone/customer data.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Star, MapPin } from "lucide-react";
import { getPublicProfile } from "@/server/providers/providers.service";
import type { PublicProfile } from "@/server/providers/providers.serialize";

type Params = Promise<{ slug: string; providerSlug: string }>;

const TEAL = "#00A08A";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, providerSlug } = await params;
  const profile = await getPublicProfile(slug, providerSlug);
  // Dark / not-yet-public → noindex (the page itself 404s below).
  if (!profile) return { title: "سوّي", robots: { index: false, follow: false } };
  return {
    title: profile.displayName,
    description: profile.bio ?? `${profile.displayName} — ${profile.categories.join("، ")}`,
  };
}

export default async function ProviderProfilePage({ params }: { params: Params }) {
  const { slug, providerSlug } = await params;
  const profile = await getPublicProfile(slug, providerSlug);
  if (!profile) notFound(); // 404 while the flag is off — not a "coming soon" page

  return (
    <div dir="rtl" className="min-h-dvh bg-[#F5F8F7] text-[#10201F]" style={{ fontFamily: "'Cairo Variable','Cairo',sans-serif" }}>
      <JsonLd profile={profile} />
      <div className="mx-auto max-w-3xl px-5 py-12">
        {/* header */}
        <header className="text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-3xl text-[32px] font-bold text-white" style={{ background: TEAL, fontFamily: "'Readex Pro Variable',sans-serif" }}>
            {profile.displayName.slice(0, 1)}
          </div>
          <h1 className="mt-4 inline-flex items-center gap-2 text-[28px] font-bold" style={{ fontFamily: "'Readex Pro Variable',sans-serif" }}>
            {profile.displayName}
            {profile.verified && <BadgeCheck className="size-6" style={{ color: TEAL }} aria-label="موثّق" />}
          </h1>
          {profile.categories.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {profile.categories.map((c) => (
                <span key={c} className="rounded-full border border-[#E2E9E7] bg-white px-3 py-1 text-[13px] font-medium">{c}</span>
              ))}
            </div>
          )}
          {profile.areas.length > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-[14px] text-[#657B7D]">
              <MapPin className="size-4" /> {profile.areas.join(" · ")}
            </p>
          )}
        </header>

        {/* stats */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Stat label="شغلات منجزة" value={profile.jobsCompleted.toLocaleString("ar-EG")} />
          {profile.rating ? (
            <Stat
              label={`${profile.rating.count.toLocaleString("ar-EG")} تقييم`}
              value={
                <span className="inline-flex items-center gap-1">
                  <Star className="size-5 fill-amber-400 text-amber-400" />
                  {profile.rating.avg.toLocaleString("ar-EG", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                </span>
              }
            />
          ) : (
            <Stat label="التقييم" value={<span className="text-[15px] text-[#657B7D]">قريبًا</span>} />
          )}
        </div>

        {/* bio */}
        {profile.bio && (
          <section className="mt-8 rounded-2xl border border-[#E2E9E7] bg-white p-6">
            <p className="whitespace-pre-wrap text-[16px] leading-[1.9]">{profile.bio}</p>
          </section>
        )}

        {/* photos */}
        {profile.photos.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-[18px] font-bold" style={{ fontFamily: "'Readex Pro Variable',sans-serif" }}>صور من الشغل</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {profile.photos.map((ph, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- storage URL
                <img key={i} src={ph.url} alt={ph.caption ?? ""} className="aspect-square w-full rounded-xl border border-[#E2E9E7] object-cover" />
              ))}
            </div>
          </section>
        )}

        {/* approved comments (only shown alongside a visible rating) */}
        {profile.comments.length > 0 && (
          <section className="mt-8 space-y-3">
            <h2 className="mb-1 text-[18px] font-bold" style={{ fontFamily: "'Readex Pro Variable',sans-serif" }}>آراء الزبائن</h2>
            {profile.comments.map((c, i) => (
              <div key={i} className="rounded-2xl border border-[#E2E9E7] bg-white p-5">
                <div className="mb-2 inline-flex">
                  {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`size-4 ${n <= c.score ? "fill-amber-400 text-amber-400" : "text-[#E2E9E7]"}`} />)}
                </div>
                <p className="text-[15px]">“{c.text}”</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E2E9E7] bg-white p-5 text-center">
      <div className="text-[24px] font-bold" style={{ fontFamily: "'Readex Pro Variable',sans-serif" }}>{value}</div>
      <div className="mt-1 text-[13px] text-[#657B7D]">{label}</div>
    </div>
  );
}

/** schema.org Person markup — present for when the directory goes live. */
function JsonLd({ profile }: { profile: PublicProfile }) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.displayName,
    knowsAbout: profile.categories,
    areaServed: profile.areas,
    ...(profile.bio ? { description: profile.bio } : {}),
    ...(profile.rating
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: profile.rating.avg, reviewCount: profile.rating.count } }
      : {}),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
