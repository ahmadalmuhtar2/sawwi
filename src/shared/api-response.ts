// The ONE response envelope every API returns. Success or failure, the frontend
// always receives this shape and can branch on `ok`. Pure data — no framework.
// The Next-specific serialization lives in src/lib/http.ts.

import type { ErrorCode, FieldErrors } from "./errors";

export interface ApiError {
  code: ErrorCode;
  message: string;
  /** Present only for VALIDATION_ERROR: per-field messages for form display. */
  fields?: FieldErrors;
}

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export function apiOk<T>(data: T): ApiResponse<T> {
  return { ok: true, data };
}

export function apiFail(error: ApiError): ApiResponse<never> {
  return { ok: false, error };
}
