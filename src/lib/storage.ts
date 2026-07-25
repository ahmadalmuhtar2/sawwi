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

/** Connectivity/health check — verifies the bucket is reachable. */
export async function storageHealthy(): Promise<boolean> {
  try {
    await getClient().send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch {
    return false;
  }
}
