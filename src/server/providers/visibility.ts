// The ONE place every "is this public / is the score shown" rule lives. No
// component, page, or serializer reads these thresholds directly — they call
// these functions. Keeping it single-source is what lets the whole directory
// stay dark until there's real job history, then flip cleanly.

/** A provider needs at least this many ratings before ANY score/average is shown.
 *  Below it, the profile shows "شغلات منجزة: N" instead — never a 1–2 rating
 *  average, never an empty five-star row. */
export const MIN_RATINGS_TO_SHOW_SCORE = 5;

/** The minimal shape the site-level gate needs. */
export interface VisibilitySite {
  publicProfilesEnabled: boolean;
}

/** The minimal shape a provider needs for the visibility checks. */
export interface VisibilityProvider {
  profilePublic: boolean;
  status: string; // ProviderStatus
  verifiedAt: Date | null;
  ratingCount: number;
}

/**
 * A profile is publicly viewable ONLY when ALL hold:
 *   - the site's master switch is on (publicProfilesEnabled)
 *   - the provider opted in (profilePublic)
 *   - the provider is ACTIVE
 *   - the provider has been verified (verifiedAt set)
 * When false, the public route returns 404 — not a "coming soon" page.
 */
export function isProfilePublic(site: VisibilitySite, provider: VisibilityProvider): boolean {
  return (
    site.publicProfilesEnabled === true &&
    provider.profilePublic === true &&
    provider.status === "ACTIVE" &&
    provider.verifiedAt !== null
  );
}

/** The rating block (score/average/stars) is shown only once there are enough
 *  ratings to be trustworthy. Below the threshold the profile shows the completed
 *  job count instead. */
export function isRatingVisible(provider: Pick<VisibilityProvider, "ratingCount">): boolean {
  return provider.ratingCount >= MIN_RATINGS_TO_SHOW_SCORE;
}
