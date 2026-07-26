import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { NewSiteFlow } from "@/components/templates/new-site-flow";

export default async function NewSitePage() {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");
  // Only workspace users (resellers) create sites — collaborators cannot.
  if (!claims.workspace) redirect("/dashboard");

  return <NewSiteFlow />;
}
