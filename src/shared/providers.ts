// Shared, dependency-free constants for the provider directory (providers, jobs,
// ratings). Arabic labels used by the internal dashboard screens AND the public
// profile. The reveal/visibility rules live in src/server/providers/visibility.ts
// (a single source), NOT here.

export type ProviderStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "REMOVED";
export type JobStatus = "MATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DISPUTED";
export type RatingSource = "FOLLOW_UP_CALL" | "WHATSAPP" | "IN_PERSON";

export const PROVIDER_STATUS_LABEL: Record<ProviderStatus, string> = {
  DRAFT: "مسودة",
  ACTIVE: "نشِط",
  PAUSED: "موقوف مؤقتًا",
  REMOVED: "محذوف",
};
export const PROVIDER_STATUS_ORDER: ProviderStatus[] = ["DRAFT", "ACTIVE", "PAUSED", "REMOVED"];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  MATCHED: "تمّت المطابقة",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتملة",
  CANCELLED: "ملغاة",
  DISPUTED: "خلاف",
};
export const JOB_STATUS_ORDER: JobStatus[] = ["MATCHED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "DISPUTED"];

export const RATING_SOURCE_LABEL: Record<RatingSource, string> = {
  FOLLOW_UP_CALL: "مكالمة متابعة",
  WHATSAPP: "واتساب",
  IN_PERSON: "شخصيًا",
};
export const RATING_SOURCE_ORDER: RatingSource[] = ["FOLLOW_UP_CALL", "WHATSAPP", "IN_PERSON"];

export const PROVIDER_BIO_MAX = 400;
export const RATING_COMMENT_MAX = 200;
