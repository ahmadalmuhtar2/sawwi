// The route wrapper. Every API handler goes through withRoute() so EVERY
// response — success or failure — is the standard ApiResponse envelope, and a
// handler can never accidentally return a bespoke error shape. Zod and AppError
// are translated here; anything else becomes a logged INTERNAL error.

import { ZodError } from "zod";
import { apiFail, apiOk, type ApiResponse } from "@/shared/api-response";
import { AppError, isAppError, type FieldErrors } from "@/shared/errors";
import { logger } from "./logger";

function zodToFields(error: ZodError): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    fields[key] ??= issue.message;
  }
  return fields;
}

function toResponse<T>(body: ApiResponse<T>, status: number): Response {
  return Response.json(body, { status });
}

/**
 * Wrap a route handler. The handler just returns its data (or throws an
 * AppError / lets a ZodError bubble up); serialization is handled here.
 * `context` carries Next's route context (e.g. `{ params }`) for dynamic routes.
 */
export function withRoute<T, C = unknown>(
  handler: (request: Request, context: C) => Promise<T>,
): (request: Request, context: C) => Promise<Response> {
  return async (request: Request, context: C) => {
    const requestId = crypto.randomUUID();
    try {
      const data = await handler(request, context);
      return toResponse(apiOk(data), 200);
    } catch (err) {
      if (err instanceof ZodError) {
        return toResponse(
          apiFail({
            code: "VALIDATION_ERROR",
            message: "بيانات غير صحيحة",
            fields: zodToFields(err),
          }),
          new AppError("VALIDATION_ERROR", "").status,
        );
      }
      if (isAppError(err)) {
        return toResponse(
          apiFail({ code: err.code, message: err.message, fields: err.fields }),
          err.status,
        );
      }
      logger.error(
        { requestId, err: err instanceof Error ? err.message : String(err) },
        "unhandled route error",
      );
      return toResponse(
        apiFail({ code: "INTERNAL", message: "حدث خطأ غير متوقع", }),
        500,
      );
    }
  };
}
