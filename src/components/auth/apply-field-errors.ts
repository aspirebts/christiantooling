import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import type { ActionResult } from "@/lib/action-result";

/**
 * Copies server-side field errors onto a React Hook Form instance so they
 * appear next to the matching inputs. Returns the form-level message, if any.
 */
export function applyActionErrors<TValues extends FieldValues>(
  result: ActionResult<unknown>,
  setError: UseFormSetError<TValues>,
  fields: readonly Path<TValues>[],
): string | null {
  if (result.ok) return null;

  for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
    if (message && (fields as readonly string[]).includes(name)) {
      setError(name as Path<TValues>, { type: "server", message });
    }
  }
  return result.error;
}
