// Object storage client — S3-compatible, so the SAME code drives local MinIO
// (dev) and Cloudflare R2 (prod). Switching between them is purely env
// (R2_ENDPOINT / keys / R2_PUBLIC_URL); nothing here changes.
//
// Lazy singleton (like src/lib/db.ts): the client is built on first use, never
// at import, so builds and unrelated code paths don't require storage env.

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getEnv } from "./env";

interface StorageConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
}

function readConfig(): StorageConfig {
  const env = getEnv();
  const missing = [
    ["R2_ENDPOINT", env.R2_ENDPOINT],
    ["R2_ACCESS_KEY_ID", env.R2_ACCESS_KEY_ID],
    ["R2_SECRET_ACCESS_KEY", env.R2_SECRET_ACCESS_KEY],
    ["R2_BUCKET", env.R2_BUCKET],
    ["R2_PUBLIC_URL", env.R2_PUBLIC_URL],
  ].filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    throw new Error(`Object storage is not configured: missing ${missing.join(", ")}`);
  }
  return {
    endpoint: env.R2_ENDPOINT!,
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    bucket: env.R2_BUCKET!,
    publicUrl: env.R2_PUBLIC_URL!.replace(/\/+$/, ""),
  };
}

/** True when all storage env vars are present (feature-gate for upload UI). */
export function isStorageConfigured(): boolean {
  const env = getEnv();
  return Boolean(
    env.R2_ENDPOINT &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET &&
      env.R2_PUBLIC_URL,
  );
}

let client: S3Client | null = null;
let bucket = "";
let publicBase = "";

function getClient(): S3Client {
  if (client) return client;
  const cfg = readConfig();
  bucket = cfg.bucket;
  publicBase = cfg.publicUrl;
  client = new S3Client({
    // "auto" is R2's required region; MinIO ignores it. Path-style addressing
    // works for both (MinIO needs it; R2 accepts it).
    region: "auto",
    endpoint: cfg.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  return client;
}

/** Browser-facing URL for a stored object key (bucket is public-read). */
export function publicUrl(key: string): string {
  getClient(); // ensures publicBase is populated
  return `${publicBase}/${key.replace(/^\/+/, "")}`;
}

/**
 * A short-lived presigned PUT URL the browser can upload directly to — keeps
 * large image bytes off the app server. Returns the upload URL + the final
 * public URL the object will have.
 */
export async function presignUpload(
  key: string,
  contentType: string,
  expiresIn = 300,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  const uploadUrl = await getSignedUrl(getClient(), cmd, { expiresIn });
  return { uploadUrl, publicUrl: publicUrl(key) };
}

/** Server-side upload (e.g. for generated/derived assets). */
export async function putObject(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
): Promise<string> {
  await getClient().send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
  );
  return publicUrl(key);
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/**
 * The object key behind one of OUR public URLs, or null if the URL isn't ours
 * (external image the user pasted, or storage not configured). Strips any
 * `?v=` cache-bust query.
 */
export function keyFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    getClient(); // populates publicBase
  } catch {
    return null; // storage not configured — nothing of ours to match
  }
  const clean = url.split("?")[0];
  const prefix = `${publicBase}/`;
  return clean.startsWith(prefix) ? clean.slice(prefix.length) : null;
}

/** Best-effort delete by public URL (no-op for external/unknown URLs). */
export async function deleteByUrl(url?: string | null): Promise<void> {
  const key = keyFromUrl(url);
  if (!key) return;
  try {
    await deleteObject(key);
  } catch {
    // best-effort: a missing object or transient error must not fail the request
  }
}

/** Delete every object under a key prefix (paginated). Used to free a whole
 *  site's media on site deletion. */
export async function deletePrefix(prefix: string): Promise<void> {
  const c = getClient();
  let token: string | undefined;
  do {
    const list = await c.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }),
    );
    const objects = (list.Contents ?? [])
      .map((o) => o.Key)
      .filter((k): k is string => Boolean(k))
      .map((Key) => ({ Key }));
    if (objects.length) {
      await c.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects } }));
    }
    token = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (token);
}

/** Connectivity/health check — verifies the bucket is reachable. */
export async function storageHealthy(): Promise<boolean> {
  try {
    await getClient().send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch {
    return false;
  }
}
