// Syrian geography — the single source of truth for the "region" enum used across
// templates (the شغلة service form, the marketplace listing city select, …). Kept
// dependency-free so both client templates and server validation can import it.

/** The 14 Syrian governorates (محافظات), in the conventional display order. */
export const SYRIAN_REGIONS = [
  "دمشق",
  "ريف دمشق",
  "حلب",
  "حمص",
  "حماة",
  "اللاذقية",
  "طرطوس",
  "إدلب",
  "درعا",
  "السويداء",
  "القنيطرة",
  "دير الزور",
  "الرقة",
  "الحسكة",
] as const;

/** Catch-all appended to region selects (anything outside the governorate list). */
export const REGION_OTHER = "أخرى";

/** Every value a region field may take (governorates + the catch-all). */
export const ALL_REGIONS: readonly string[] = [...SYRIAN_REGIONS, REGION_OTHER];
