import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { SiteWizard } from "@/components/dashboard/site-wizard";

export default async function NewSitePage() {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");
  // Only workspace users (resellers) create sites — collaborators cannot.
  if (!claims.workspace) redirect("/dashboard");

  return <SiteWizard />;
}
