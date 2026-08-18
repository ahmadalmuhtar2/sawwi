// The PUBLIC serializer. Integrity rule #6 is enforced HERE, not in the template:
// phone/phoneRaw/internalNote/customer data are never even read into the public
// payload, and the rating block is omitted below the visibility threshold. A
// template can only render what this returns.

import type { Prisma } from "@/generated/prisma/client";
import { publicUrl } from "@/lib/storage";
import { isRatingVisible } from "./visibility";

export interface PublicProfile {
  slug: string;
  displayName: string;
  verified: boolean;
  categories: string[];
  areas: string[];
  bio: string | null;
  photos: { url: string; caption: string | null }[];
  jobsCompleted: number;
  /** Present ONLY when there are enough ratings to be trustworthy. */
  rating: { avg: number; count: number } | null;
  /** Approved public comments, only shown alongside a visible rating. */
  comments: { text: string; score: number }[];
}

interface PublicProviderRow {
  displayName: string | null;
  name: string;
  categories: string[];
  areas: string[];
  bio: string | null;
  verifiedAt: Date | null;
  jobsCompleted: number;
  ratingCount: number;
  ratingAvg: Prisma.Decimal | null;
  photos: { key: string; caption: string | null }[];
}

export function serializePublicProfile(
  slug: string,
  p: PublicProviderRow,
  comments: { publicComment: string | null; score: number }[],
): PublicProfile {
  const ratingVisible = isRatingVisible({ ratingCount: p.ratingCount });
  return {
    slug,
    displayName: p.displayName?.trim() || p.name,
    verified: p.verifiedAt !== null,
    categories: p.categories,
    areas: p.areas,
    bio: p.bio,
    photos: p.photos.map((ph) => ({ url: publicUrl(ph.key), caption: ph.caption })),
    jobsCompleted: p.jobsCompleted,
    rating: ratingVisible && p.ratingAvg != null ? { avg: Number(p.ratingAvg), count: p.ratingCount } : null,
    comments: ratingVisible
      ? comments.filter((c) => c.publicComment).map((c) => ({ text: c.publicComment as string, score: c.score }))
      : [],
  };
}
