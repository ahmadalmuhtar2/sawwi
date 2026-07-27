// Client-side fetch wrapper for our unified API envelope. Returns `data` on
// success; throws ApiClientError (code + message + field errors) on failure, so
// every caller handles "any bad thing" the same way.

import type { ApiError } from "@/shared/api-response";

export class ApiClientError extends Error {
  code: ApiError["code"];
  fields?: Record<string, string>;
  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiClientError";
    this.code = error.code;
    this.fields = error.fields;
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  // For FormData, let the browser set the multipart boundary content-type.
  const isForm = options.body instanceof FormData;
  const res = await fetch(url, {
    headers: {
      ...(isForm ? {} : { "content-type": "application/json" }),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  // Session expired/revoked mid-use (401): bounce to login with a notice,
  // preserving where the user was so they land back here after signing in.
  // Guarded against loops on the auth pages themselves. The returned promise
  // never resolves, so callers don't flash an error while the page navigates.
  if (res.status === 401 && typeof window !== "undefined") {
    const path = window.location.pathname;
    if (!/^\/(login|register|forgot-password|reset-password|verify-email)(\/|$)/.test(path)) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.assign(`/login?next=${next}&expired=1`);
      return new Promise<T>(() => {});
    }
  }

  const json = await res.json().catch(() => null);
  if (!json || typeof json.ok !== "boolean") {
    throw new ApiClientError({ code: "INTERNAL", message: "استجابة غير صالحة من الخادم" });
  }
  if (!json.ok) throw new ApiClientError(json.error);
  return json.data as T;
}

export const api = {
  get: <T>(url: string) => apiFetch<T>(url),
  post: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, {
      method: "POST",
      body:
        body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(url: string) => apiFetch<T>(url, { method: "DELETE" }),
};
