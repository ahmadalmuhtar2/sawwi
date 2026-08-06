// Site visit counting, keyed by BROWSER SESSION. A visit is counted once per
// (site, browser session): the served page's beacon calls the public visits
// endpoint, which assigns a per-session `sawwi_vid` cookie and passes it here.
// Each new session (fresh cookie) counts again; repeat pageviews in the same
// session don't (idempotent via the unique constraint).

import { visitsRepository } from "./visits.repository";

/**
 * Record a visit for a (site, session). Best-effort on the request path — the
 * caller should not fail the response for a tracking error. Returns whether a
 * new visit row was actually written (false = already counted this session).
 */
export async function recordVisit(siteId: string, sessionKey: string): Promise<boolean> {
  return visitsRepository.recordSession(siteId, sessionKey);
}

/** Total counted visits per site (0 for any id with none). */
export async function visitCountsForSites(siteIds: string[]): Promise<Record<string, number>> {
  return visitsRepository.countBySites(siteIds);
}
