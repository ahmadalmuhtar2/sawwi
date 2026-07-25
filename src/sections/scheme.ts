import type { ColorScheme } from "@/shared/domain";

// Color-scheme → background/text classes. Every section honors these so a site
// reads as one system regardless of which schemes the user picks per section.
// All accent-based schemes track the site palette (they use the accent CSS vars).
export const SCHEME_BG: Record<ColorScheme, string> = {
  primary: "bg-accent text-white", // solid accent
  bold: "bg-accent-900 text-white", // deep accent
  dark: "bg-[oklch(0.22_0.012_70)] text-white", // neutral dark
  light: "bg-surface text-ink", // white
  muted: "bg-bg text-ink", // subtle off-white
  accent: "bg-accent-100 text-accent-900", // light accent tint
  soft: "bg-accent-50 text-accent-900", // faint accent tint
};

// Schemes with a LIGHT background (dark text) vs. dark background (light text).
const LIGHT_BG = new Set<ColorScheme>(["light", "muted", "accent", "soft"]);

export function mutedText(scheme: ColorScheme): string {
  return LIGHT_BG.has(scheme) ? "text-muted" : "text-white/75";
}

export function cardBg(scheme: ColorScheme): string {
  return LIGHT_BG.has(scheme) ? "bg-bg border border-line" : "bg-white/10";
}

export function onSchemeButton(scheme: ColorScheme): string {
  // On a light background, use an accent button; on a dark one, a white button.
  return LIGHT_BG.has(scheme) ? "bg-accent text-white" : "bg-white text-accent";
}
