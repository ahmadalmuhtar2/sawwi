// The single error vocabulary for the whole backend. Every failure the frontend
// can see is one of these codes, so the client writes one error handler.
// Framework-agnostic: no HTTP, no Next imports here.

export const ERROR_CODES = [
  "VALIDATION_ERROR", // input failed Zod validation (has `fields`)
  "UNAUTHORIZED", // not signed in
  "FORBIDDEN", // signed in, but not allowed (tenancy)
  "NOT_FOUND", // resource does not exist / not visible to caller
  "CONFLICT", // uniqueness / state conflict (e.g. slug taken)
  "SUBSCRIPTION_REQUIRED", // action needs an active subscription (publish)
  "RATE_LIMITED", // too many requests
  "INTERNAL", // unexpected — logged with a request id
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Default HTTP status per code. The route layer maps these to responses. */
export const HTTP_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SUBSCRIPTION_REQUIRED: 402,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

/** Per-field validation messages, keyed by field path (e.g. "slug"). */
export type FieldErrors = Record<string, string>;

/**
 * The one error type thrown across the backend. Services/rules throw these;
 * the route wrapper turns them into the standard response envelope.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fields?: FieldErrors;

  constructor(code: ErrorCode, message: string, fields?: FieldErrors) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.fields = fields;
  }

  get status(): number {
    return HTTP_STATUS[this.code];
  }
}

// Ergonomic constructors — read like the failure they describe.
export const errors = {
  validation: (message: string, fields?: FieldErrors) =>
    new AppError("VALIDATION_ERROR", message, fields),
  unauthorized: (message = "يجب تسجيل الدخول") =>
    new AppError("UNAUTHORIZED", message),
  forbidden: (message = "لا تملك صلاحية لهذا الإجراء") =>
    new AppError("FORBIDDEN", message),
  notFound: (message = "العنصر غير موجود") => new AppError("NOT_FOUND", message),
  conflict: (message: string) => new AppError("CONFLICT", message),
  subscriptionRequired: (message = "هذا الإجراء يتطلب اشتراكًا نشطًا") =>
    new AppError("SUBSCRIPTION_REQUIRED", message),
  rateLimited: (message = "عدد كبير من الطلبات، حاول لاحقًا") =>
    new AppError("RATE_LIMITED", message),
  internal: (message = "حدث خطأ غير متوقع") => new AppError("INTERNAL", message),
};

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}
