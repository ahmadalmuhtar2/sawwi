import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTemplate, TEMPLATES } from "@/templates/registry";
import { TemplateHost } from "@/components/public/template-host";

type Params = Promise<{ key: string }>;

// Pre-render one page per template (they're a fixed catalog).
export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ key: t.key }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { key } = await params;
  const tpl = getTemplate(key);
  if (!tpl) return { title: "قالب — سوّي" };
  const title = `${tpl.label} — قالب موقع جاهز من سوّي`;
  return {
    title,
    description: tpl.description,
    keywords: tpl.tags,
    alternates: { canonical: `/templates/${key}` },
    openGraph: {
      type: "website",
      url: `/templates/${key}`,
      title,
      description: tpl.description,
    },
    twitter: { card: "summary_large_image", title, description: tpl.description },
  };
}

// Public template preview — no auth. This IS the website: the template renders
// full-bleed with its sample content, exactly as a published site would, so
// anyone can visit or share it and see the real thing. No "use this template"
// CTA here — that suggestion belongs inside the platform (the site picker).
export default async function TemplatePreviewPage({ params }: { params: Params }) {
  const { key } = await params;
  const tpl = getTemplate(key);
  if (!tpl) notFound();

  return (
    <TemplateHost
      templateKey={tpl.key}
      content={{}}
      theme={{ accent: null, ground: null, ink: null, fontKey: null }}
      currency="ل.س"
    />
  );
}
