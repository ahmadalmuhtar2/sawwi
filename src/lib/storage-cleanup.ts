// Delete storage objects that a content edit removed or replaced. Content JSON
// (section fields, SEO, …) can hold image URLs anywhere — top-level or nested in
// group rows — so we deep-scan for OUR storage keys and delete the ones present
// before an edit but gone after it. Best-effort: never throws into the request.

import { keyFromUrl, deleteObject, deletePrefix, isStorageConfigured } from "./storage";
import { siteAssetKey, type AssetKind } from "./storage-keys";

const SITE_ASSET_KINDS: AssetKind[] = ["logos", "favicons", "og", "sections"];

/** Delete ALL of a site's stored media (every kind's per-site folder). Call on
 *  site deletion. Best-effort. */
export async function deleteSiteAssets(siteId: string): Promise<void> {
  if (!isStorageConfigured()) return;
  await Promise.allSettled(
    SITE_ASSET_KINDS.map((kind) => deletePrefix(siteAssetKey(kind, siteId, ""))),
  );
}

function collect(value: unknown, acc: Set<string>): void {
  if (typeof value === "string") {
    const key = keyFromUrl(value);
    if (key) acc.add(key);
  } else if (Array.isArray(value)) {
    for (const v of value) collect(v, acc);
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) collect(v, acc);
  }
}

/** All of our storage keys referenced anywhere inside a value. */
export function storageKeysIn(value: unknown): Set<string> {
  const acc = new Set<string>();
  collect(value, acc);
  return acc;
}

/**
 * Delete objects that existed in `before` but not in `after` (removed or
 * replaced). Passing `{}` as `after` deletes every object the value referenced
 * (use on section/site deletion). Never rejects.
 */
export async function deleteRemovedObjects(before: unknown, after: unknown): Promise<void> {
  if (!isStorageConfigured()) return;
  const oldKeys = storageKeysIn(before);
  if (oldKeys.size === 0) return;
  const newKeys = storageKeysIn(after);
  const removed = [...oldKeys].filter((k) => !newKeys.has(k));
  await Promise.allSettled(removed.map((k) => deleteObject(k)));
}
