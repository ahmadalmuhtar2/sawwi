import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getTemplate } from "@/templates/registry";
import { NewSiteFlow } from "@/components/templates/new-site-flow";

export default async function NewSitePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  // Preselected template comes from the public /templates gallery ("use this
  // template"). Validate it against the registry so a bogus key just falls back
  // to the in-flow gallery.
  const templateKey = getTemplate((await searchParams).template)?.key ?? null;

  const claims = await getSessionClaims();
  // Anonymous visitors coming from the public gallery: send them to sign in and
  // bounce back to this exact template so the choice survives the round-trip.
  if (!claims) {
    const back = templateKey ? `/dashboard/sites/new?template=${templateKey}` : "/dashboard/sites/new";
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }
  // Only workspace users (resellers) create sites — collaborators cannot.
  if (!claims.workspace) redirect("/dashboard");

  return <NewSiteFlow initialTemplateKey={templateKey} />;
}
