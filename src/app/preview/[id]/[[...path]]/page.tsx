import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Eye } from "lucide-react";
import { getSessionClaims } from "@/lib/auth";
import { getSite } from "@/server/sites/sites.service";
import { getDraftTemplateData } from "@/server/sites/template-data";
import { buildSiteMetadata } from "@/server/seo/metadata";
import { TemplateHost } from "@/components/public/template-host";

type Params = Promise<{ id: string; path?: string[] }>;

// The preview tab shows the site's own title + favicon (from DRAFT SEO), so the
// chosen favicon appears here just like on the published site. Always noindex.
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const fallback: Metadata = { title: "معاينة — سوّي", robots: { index: false, follow: false } };
  const { id } = await params;
  const claims = await getSessionClaims();
  if (!claims) return fallback;

  let site;
  try {
    site = await getSite(claims, id);
  } catch {
    return fallback;
  }

  const data = await getDraftTemplateData(id);
  if (!data) return fallback;

  const meta = buildSiteMetadata({
    businessName: data.meta.businessName,
    language: data.meta.language,
    slug: site.slug,
    pagePath: "/",
    siteSeo: data.meta.seo,
    pageSeo: {},
  });
  // A preview must never be indexed, whatever the site's own robots say.
  return { ...meta, robots: { index: false, follow: false } };
}

// Draft preview — renders the LIVE, unpublished site exactly as "publish" would
// freeze it. Auth-gated (site editors only); lives outside /dashboard so it shows
// full-bleed without the dashboard chrome.
export default async function PreviewPage({ params }: { params: Params }) {
  const { id } = await params;
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");

  try {
    await getSite(claims, id); // authorization guard (throws if no access)
  } catch {
    notFound();
  }

  const data = await getDraftTemplateData(id);
  if (!data) notFound();

  return (
    <div>
      <div className="flex items-center justify-between gap-3 bg-ink px-4 py-2 text-sm text-white">
        <span className="inline-flex items-center gap-2 font-medium">
          <Eye className="size-4" /> معاينة — لم تُنشر بعد
        </span>
        <Link
          href={`/dashboard/sites/${id}`}
          className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1 text-xs transition hover:bg-white/25"
        >
          <ArrowRight className="size-3.5" /> العودة إلى المُنشئ
        </Link>
      </div>
      <TemplateHost
        templateKey={data.templateKey}
        content={data.content}
        theme={data.theme}
        currency={data.currency}
        siteId={id}
      />
    </div>
  );
}
