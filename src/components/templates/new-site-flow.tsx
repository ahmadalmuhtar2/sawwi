"use client";

// New-site flow: browse the template gallery (backend-driven search / tag filter
// / infinite scroll — see TemplatesGallery), pick one, then fill it in via the
// onboarding wizard. The site is created only when the wizard finishes.

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { TemplatesGallery } from "./templates-gallery";
import { OnboardingWizard } from "./onboarding-wizard";
import { RestaurantOnboardingWizard } from "./restaurant-onboarding-wizard";
import { FoulFattehOnboardingWizard } from "./foul-fatteh-onboarding-wizard";

// Each template gets a bespoke wizard; fall back to the barbershop-shaped one.
const WIZARDS: Record<string, React.ComponentType<{ templateKey: string }>> = {
  "barbershop-five-star": OnboardingWizard,
  restaurant: RestaurantOnboardingWizard,
  "foul-fatteh": FoulFattehOnboardingWizard,
};

export function NewSiteFlow() {
  const [templateKey, setTemplateKey] = React.useState<string | null>(null);

  if (templateKey) {
    const Wizard = WIZARDS[templateKey] ?? OnboardingWizard;
    return (
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => setTemplateKey(null)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink cursor-pointer"
        >
          <ArrowRight className="size-4" /> تغيير القالب
        </button>
        <Wizard templateKey={templateKey} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <TemplatesGallery onUse={(t) => setTemplateKey(t.key)} />
    </div>
  );
}
