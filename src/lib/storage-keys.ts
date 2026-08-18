// Object-storage key layout. Every uploaded asset lives under a per-environment,
// per-website folder so a bucket shared by dev/prod never collides and a site's
// media is easy to find (and bulk-delete): <env>/<kind>/<siteId>/<name>.
//   e.g. production/favicons/clx123.../favicon.png

import { getEnv } from "./env";

export type AssetKind = "logos" | "favicons" | "og" | "sections" | "avatars" | "templates" | "submissions" | "providers";

function envPrefix(): string {
  const e = getEnv().NODE_ENV;
  return e === "production" ? "production" : e === "test" ? "test" : "development";
}

/** Per-website object key: `<env>/<kind>/<siteId>/<name>`. */
export function siteAssetKey(kind: AssetKind, siteId: string, name: string): string {
  return `${envPrefix()}/${kind}/${siteId}/${name}`;
}

/** Per-user object key (avatars aren't tied to a site): `<env>/avatars/<userId>/<name>`. */
export function userAssetKey(userId: string, name: string): string {
  return `${envPrefix()}/avatars/${userId}/${name}`;
}

/** Pre-site staging key for onboarding uploads (the site doesn't exist yet):
 *  `<env>/staging/<userId>/<name>`. Kept when the site is created; abandoned
 *  staging is swept later. */
export function stagingAssetKey(userId: string, name: string): string {
  return `${envPrefix()}/staging/${userId}/${name}`;
}
