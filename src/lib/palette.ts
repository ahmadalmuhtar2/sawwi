// Curated site palettes & fonts (assembly, not design). A palette only shifts the
// ACCENT color scale — neutrals stay constant so every site reads as one system.
// Applied by overriding the Tailwind v4 color CSS variables on the site root, so
// every `bg-accent`/`text-accent-900`/… utility inside cascades to the choice.

import type { CSSProperties } from "react";

export interface Palette {
  key: string;
  label: string;
  /** Representative swatch color for the picker. */
  swatch: string;
  /** oklch hue used to build the full accent scale. */
  hue: number;
}

// The accent scale's lightness/chroma per shade (from globals.css). Each palette
// substitutes its hue, keeping a consistent, tasteful ramp across colors.
const SCALE: [shade: string, l: number, c: number][] = [
  ["", 0.45, 0.085],
  ["-50", 0.97, 0.015],
  ["-100", 0.95, 0.028],
  ["-200", 0.88, 0.05],
  ["-300", 0.72, 0.1],
  ["-400", 0.6, 0.09],
  ["-600", 0.42, 0.088],
  ["-700", 0.36, 0.08],
  ["-800", 0.3, 0.06],
  ["-900", 0.24, 0.05],
];

export const PALETTES: Palette[] = [
  { key: "olive", label: "زيتوني", swatch: "oklch(0.45 0.085 155)", hue: 155 },
  { key: "emerald", label: "أخضر", swatch: "oklch(0.5 0.1 145)", hue: 145 },
  { key: "teal", label: "فيروزي", swatch: "oklch(0.45 0.085 195)", hue: 195 },
  { key: "sky", label: "سماوي", swatch: "oklch(0.5 0.1 230)", hue: 230 },
  { key: "blue", label: "أزرق", swatch: "oklch(0.45 0.085 255)", hue: 255 },
  { key: "indigo", label: "نيلي", swatch: "oklch(0.45 0.1 275)", hue: 275 },
  { key: "purple", label: "بنفسجي", swatch: "oklch(0.45 0.085 305)", hue: 305 },
  { key: "pink", label: "وردي", swatch: "oklch(0.52 0.12 350)", hue: 350 },
  { key: "rose", label: "عنّابي", swatch: "oklch(0.45 0.11 25)", hue: 25 },
  { key: "orange", label: "برتقالي", swatch: "oklch(0.58 0.12 55)", hue: 55 },
  { key: "amber", label: "ذهبي", swatch: "oklch(0.55 0.11 80)", hue: 80 },
  { key: "slate", label: "رصاصي", swatch: "oklch(0.45 0.03 250)", hue: 250 },
];

// Sentinel palette key: the user picks their own primary + secondary colors
// (stored on SiteTheme as primaryColor/secondaryColor) instead of a curated hue.
export const CUSTOM_PALETTE = "custom";

export interface FontChoice {
  key: string;
  label: string;
  family: string;
}

// All families are self-hosted variable fonts with Arabic subsets (globals.css
// @fontsource-variable imports). Adding one here requires importing it there too.
export const FONTS: FontChoice[] = [
  { key: "readex", label: "ريدكس — عصري", family: '"Readex Pro Variable", system-ui, sans-serif' },
  { key: "cairo", label: "القاهرة — عريض", family: '"Cairo Variable", system-ui, sans-serif' },
  { key: "rubik", label: "روبيك — هندسي", family: '"Rubik Variable", system-ui, sans-serif' },
  { key: "noto-kufi", label: "نوتو كوفي — كوفي", family: '"Noto Kufi Arabic Variable", system-ui, sans-serif' },
  { key: "reem-kufi", label: "ريم كوفي — كوفي أنيق", family: '"Reem Kufi Variable", system-ui, sans-serif' },
  { key: "el-messiri", label: "المسيري — كلاسيكي", family: '"El Messiri Variable", system-ui, sans-serif' },
];

export const DEFAULT_PALETTE = "olive";
export const DEFAULT_FONT = "readex";

export function getPalette(key?: string | null): Palette {
  return PALETTES.find((p) => p.key === key) ?? PALETTES[0];
}

export function getFont(key?: string | null): FontChoice {
  return FONTS.find((f) => f.key === key) ?? FONTS[0];
}

export interface ThemeCustom {
  /** picked primary color (any CSS color, e.g. #1e88e5) — drives the accent scale */
  primaryColor?: string | null;
  /** picked secondary color — drives the secondary scale (falls back to primary) */
  secondaryColor?: string | null;
}

/**
 * OKLCH hue (degrees) of a "#rrggbb" color. We derive only the hue and apply our
 * curated lightness/chroma ramp on top — the same model as the palettes — so any
 * picked color yields a tasteful, consistent scale. Computed numerically (sRGB →
 * linear → OKLab → hue) rather than via CSS `oklch(from …)`, which older browsers
 * (Safari < 16.4) don't support. Returns null for an unparseable value.
 */
function hueOf(hex: string): number | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const toLinear = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = toLinear((n >> 16) & 0xff);
  const g = toLinear((n >> 8) & 0xff);
  const b = toLinear(n & 0xff);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m2 = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m2 + 0.4505937099 * s;
  const b2 = 0.0259040371 * l + 0.7827717662 * m2 - 0.808675766 * s;
  const deg = (Math.atan2(b2, a) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/**
 * Build one color-var ramp (accent or secondary). A curated palette passes its
 * `hue`; a custom color's hue is extracted from `baseColor`. Either way the
 * tasteful lightness/chroma steps stay constant.
 */
function ramp(prefix: string, hue: number, baseColor?: string | null): Record<string, string> {
  const h = baseColor ? hueOf(baseColor) ?? hue : hue;
  const vars: Record<string, string> = {};
  for (const [shade, l, c] of SCALE) {
    vars[`${prefix}${shade}`] = `oklch(${l} ${c} ${h})`;
  }
  return vars;
}

/**
 * CSS custom properties to apply at a site's root wrapper: the full accent scale
 * (primary), a matching secondary scale, and the chosen UI font. Cascades to all
 * utilities within. Pass `custom` when the palette is `CUSTOM_PALETTE` so the
 * user's own primary/secondary colors drive the ramps.
 */
export function themeStyle(
  paletteKey?: string | null,
  fontKey?: string | null,
  custom?: ThemeCustom,
): CSSProperties {
  const isCustom = paletteKey === CUSTOM_PALETTE;
  const { hue } = getPalette(paletteKey); // curated hue (ignored when a custom color is set)
  const primary = isCustom ? custom?.primaryColor || null : null;
  // Secondary mirrors the primary/accent unless a distinct secondary is chosen,
  // so `secondary` utilities always resolve and uncustomized sites are unchanged.
  const secondary = isCustom ? custom?.secondaryColor || primary : null;

  const vars: Record<string, string> = {
    ...ramp("--color-accent", hue, primary),
    ...ramp("--color-secondary", hue, secondary),
  };
  vars["--font-ui"] = getFont(fontKey).family;
  return vars as CSSProperties;
}
