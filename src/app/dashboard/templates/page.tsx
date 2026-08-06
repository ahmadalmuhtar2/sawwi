import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { DashboardTemplates } from "@/components/dashboard/dashboard-templates";

// Workspace → القوالب. Browse the catalog inside the dashboard; "use" a template
// starts a new site with it preselected. Reseller/admin only (they create sites).
export default async function DashboardTemplatesPage() {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");
  if (claims.workspace?.kind !== "reseller" && claims.platformRole !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* TemplatesGallery reads search params for its shareable q/tags state. */}
      <Suspense>
        <DashboardTemplates />
      </Suspense>
    </div>
  );
}
