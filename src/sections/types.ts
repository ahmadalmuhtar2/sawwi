// Shared types for the section design system. A section render component takes
// its variant + color scheme + content JSON + the site's structured data, and
// renders identically in the dashboard live-preview and the public renderer.

import type { ColorScheme } from "@/shared/domain";

export interface SiteRenderData {
  businessName: string;
  logoUrl?: string | null;
  // Auto navigation: the site's pages, in order. Set by the public renderer and
  // the draft preview; omitted in the builder's inline preview (no navigation).
  nav?: { path: string; title: string }[];
  // Prefix for internal links. "" on the public subdomain, "/dashboard/sites/:id/preview"
  // in the dashboard preview. `activePath` highlights the current page in the nav.
  basePath?: string;
  activePath?: string;
  settings: {
    whatsappNumber?: string | null;
    phone?: string | null;
    address?: string | null;
    googleMapsUrl?: string | null;
    openingHours?: Record<string, { open: string; close: string } | { closed: true }> | null;
    socials?: Record<string, string> | null;
    /** site-wide price currency key (see shared/currency.ts); defaults to SYP */
    currency?: string | null;
  };
  services: { id: string; name: string; price?: string | null; duration?: string | null; description?: string | null }[];
  team: { id: string; name: string; roleTitle?: string | null }[];
  testimonials: { id: string; author: string; text: string }[];
  faq: { id: string; question: string; answer: string }[];
}

export interface SectionProps {
  variant: string;
  scheme: ColorScheme;
  content: Record<string, unknown>;
  site: SiteRenderData;
}

// A button/CTA destination. Stored in a section's content JSON.
//   whatsapp → wa.me deep link (built from the site's WhatsApp number)
//   section  → smooth-scroll to a section on the SAME page (value = anchor slug)
//   page     → navigate to another page (value = page path, e.g. "/about")
//   url      → any external URL (value = the href)
export type LinkKind = "whatsapp" | "section" | "page" | "url" | "none";
export interface SectionLink {
  kind: LinkKind;
  value?: string;
}

export function isSectionLink(v: unknown): v is SectionLink {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { kind?: unknown }).kind === "string"
  );
}

/** Read a link from content, or null when unset/invalid. */
export function readLink(content: Record<string, unknown>, key: string): SectionLink | null {
  const v = content[key];
  return isSectionLink(v) ? v : null;
}

export function text(content: Record<string, unknown>, key: string, fallback = ""): string {
  const v = content[key];
  return typeof v === "string" && v.length ? v : fallback;
}

export function whatsappLink(numberOrLink?: string | null, message?: string): string {
  if (!numberOrLink) return "#";
  const v = numberOrLink.trim();
  // A direct WhatsApp link — use it as-is (the user pasted their own).
  if (/^https?:\/\//i.test(v)) return v;
  if (/^wa\.me\//i.test(v)) return `https://${v}`;
  // Otherwise treat as a phone number and build the wa.me link.
  const clean = v.replace(/[^0-9]/g, "");
  const q = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${clean}${q}`;
}
