// Renders one resolved page as a full public document: auto Header (with nav) +
// the page's sections + Footer. Shared by the published site and the draft
// preview so both look identical.

import { RenderSection } from "@/sections/library";
import type { RenderPage, RenderTheme } from "@/server/sites/site-data";
import type { SiteRenderData } from "@/sections/types";
import { themeStyle } from "@/sections/palette";
import FloatingWhatsApp from "@/sections/whatsapp/floating-whatsapp";

export function SiteRender({
  siteData,
  nav,
  page,
  basePath,
  theme,
}: {
  siteData: SiteRenderData;
  nav: { path: string; title: string }[];
  page: RenderPage;
  basePath: string;
  theme?: RenderTheme;
}) {
  const site: SiteRenderData = {
    ...siteData,
    nav,
    basePath,
    activePath: page.path,
  };
  // Persistent WhatsApp button, shown on every page automatically when the site
  // has a number. It retreats near the WhatsApp CTA section so it never overlaps.
  const waDigits = (site.settings.whatsappNumber ?? "").replace(/[^0-9]/g, "");

  return (
    <div style={themeStyle(theme?.paletteKey, theme?.fontKey, { primaryColor: theme?.primaryColor, secondaryColor: theme?.secondaryColor })}>
      <RenderSection
        type="Header"
        variant={theme?.headerVariant ?? "A"}
        scheme="primary"
        content={{ headerScheme: theme?.headerScheme ?? "light" }}
        site={site}
      />
      {page.sections.map((s) => (
        <RenderSection
          key={s.id}
          type={s.sectionType}
          variant={s.variant}
          scheme={s.colorScheme}
          content={s.content}
          site={site}
        />
      ))}
      <RenderSection
        type="Footer"
        variant={theme?.footerVariant ?? "A"}
        scheme="primary"
        content={{ footerScheme: theme?.footerScheme ?? "dark" }}
        site={site}
      />
      {waDigits && (
        <FloatingWhatsApp
          whatsapp={waDigits}
          messageText={`مرحبًا ${site.businessName}`}
          hideNear="#whatsapp"
        />
      )}
    </div>
  );
}
