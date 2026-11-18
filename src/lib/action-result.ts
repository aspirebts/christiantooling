import type { z } from "zod";

/**
 * Uniform return type for Server Actions. Actions never throw for expected
 * failures (validation, permissions); they return { ok: false } so forms can
 * show messages. Field errors map form field names to messages.
 */
export type ActionResult<TData = undefined> =
  | { ok: true; message?: string; data?: TData }
  | { ok: false; error: string; fieldErrors?: Partial<Record<string, string>> };

export function actionError(
  error: string,
  fieldErrors?: Partial<Record<string, string>>,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

export function actionSuccess<TData = undefined>(
  message?: string,
  data?: TData,
): ActionResult<TData> {
  return { ok: true, message, data };
}

/** Converts a failed Zod parse into an ActionResult with the first message per field. */
export function validationError(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Partial<Record<string, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: "Please correct the highlighted fields.", fieldErrors };
}
