"use client";

// New-site flow: browse the template gallery (backend-driven search / tag filter
// / infinite scroll — see TemplatesGallery), pick one, then fill it in via the
// onboarding wizard. The site is created only when the wizard finishes.

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { TemplatesGallery } from "./templates-gallery";
import { OnboardingWizard } from "./onboarding-wizard";

// One minimal wizard for every template: name + optional logo + subdomain. All
// the real content is edited inline in the builder after the site is created.

export function NewSiteFlow() {
  const [templateKey, setTemplateKey] = React.useState<string | null>(null);

  if (templateKey) {
    return (
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => setTemplateKey(null)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink cursor-pointer"
        >
          <ArrowRight className="size-4" /> تغيير القالب
        </button>
        <OnboardingWizard templateKey={templateKey} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <TemplatesGallery onUse={(t) => setTemplateKey(t.key)} />
    </div>
  );
}
