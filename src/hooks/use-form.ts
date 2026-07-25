"use client";

// The one form hook every form in the app builds on. It owns:
//   - field values + a typed setter and a `register()` prop-spreader
//   - per-field inline errors (cleared as the user edits the field)
//   - a form-level error (for non-field failures)
//   - optional client-side Zod validation before submit
//   - the submit lifecycle (submitting flag) + mapping backend errors to fields
//
// Backend field errors arrive two ways, both handled here by duck-typing a
// `.fields` map:
//   - `ApiClientError` from src/lib/api-client (our unified {code,message,fields})
//   - `FormError` thrown from callers wrapping non-envelope APIs (e.g. Better Auth)

import { useCallback, useState } from "react";
import type { ZodType } from "zod";

/** Throw from an onSubmit to surface a message and/or inline field errors. */
export class FormError extends Error {
  fields?: Record<string, string>;
  constructor(message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "FormError";
    this.fields = fields;
  }
}

type FieldErrors<T> = Partial<Record<keyof T, string>>;

interface UseFormOptions<T> {
  initial: T;
  /** Optional Zod schema; when present, values are validated before submit. */
  schema?: ZodType;
  onSubmit: (values: T) => Promise<void> | void;
  onSuccess?: (values: T) => void;
}

export interface UseForm<T> {
  values: T;
  errors: FieldErrors<T>;
  formError: string | null;
  submitting: boolean;
  setValue: <K extends keyof T>(name: K, value: T[K]) => void;
  /** Spread onto an Input/Textarea/Select: `<Input {...register("email")} />`. */
  register: (name: keyof T & string) => {
    id: string;
    name: string;
    value: string;
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => void;
    "aria-invalid": boolean;
  };
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  setFormError: (message: string | null) => void;
}

export function useForm<T extends Record<string, unknown>>({
  initial,
  schema,
  onSubmit,
  onSuccess,
}: UseFormOptions<T>): UseForm<T> {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setValue = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValues((v) => ({ ...v, [name]: value }));
    // Clear this field's error + any form-level error as soon as the user edits.
    setErrors((e) => (name in e ? { ...e, [name]: undefined } : e));
    setFormError(null);
  }, []);

  const register = useCallback(
    (name: keyof T & string) => ({
      id: name,
      name,
      value: (values[name] as string | undefined) ?? "",
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
      ) => setValue(name, e.target.value as T[typeof name]),
      "aria-invalid": Boolean(errors[name]),
    }),
    [values, errors, setValue],
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setFormError(null);
      setErrors({});

      // Client-side validation first (fast, offline, consistent Arabic messages).
      if (schema) {
        const result = schema.safeParse(values);
        if (!result.success) {
          const fieldErrors: FieldErrors<T> = {};
          for (const issue of result.error.issues) {
            const key = issue.path[0] as keyof T | undefined;
            if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
          }
          setErrors(fieldErrors);
          return;
        }
      }

      setSubmitting(true);
      try {
        await onSubmit(values);
        onSuccess?.(values);
      } catch (err) {
        // ApiClientError and FormError both carry an optional `.fields` map.
        const fields = (err as { fields?: Record<string, string> })?.fields;
        if (fields && Object.keys(fields).length) {
          setErrors(fields as FieldErrors<T>);
        }
        setFormError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      } finally {
        setSubmitting(false);
      }
    },
    [schema, values, onSubmit, onSuccess],
  );

  return { values, errors, formError, submitting, setValue, register, handleSubmit, setFormError };
}
