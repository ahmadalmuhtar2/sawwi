// Single source of truth for image-upload size limits. Keep every uploader
// (content images, logo, avatar, SEO og-image, favicon) pointed here so limits
// stay consistent across the app — no scattered magic numbers.

const MB = 1024 * 1024;

/** Standard cap for user-facing images (content, logo, avatar, social og). */
export const MAX_IMAGE_BYTES = 2 * MB;

/** Favicons are tiny — keep them small. */
export const MAX_FAVICON_BYTES = 1 * MB;

/** Whole megabytes, for building "٢ ميغابايت" style messages. */
export const mbOf = (bytes: number): number => Math.round(bytes / MB);

const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const toArabic = (n: number): string => String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

/** Arabic-digit MB label, e.g. "٢ ميغابايت". */
export const maxSizeLabel = (bytes: number): string => `${toArabic(mbOf(bytes))} ميغابايت`;
