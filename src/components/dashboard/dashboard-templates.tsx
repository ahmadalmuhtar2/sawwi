"use client";

// The in-dashboard templates gallery: browse the catalog (server-driven search /
// tag filter / infinite scroll via TemplatesGallery) and "use" a template to jump
// into site creation with it preselected.

import { useRouter } from "next/navigation";
import { TemplatesGallery } from "@/components/templates/templates-gallery";

export function DashboardTemplates() {
  const router = useRouter();
  return (
    <TemplatesGallery onUse={(t) => router.push(`/dashboard/sites/new?template=${t.key}`)} />
  );
}
