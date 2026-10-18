import { ApiError } from "./apiClient";

type SetError = (name: never, error: { type: string; message: string }) => void;

export function applyServerErrors(
  error: unknown,
  setError: SetError,
  fieldMap: Record<string, string> = {},
): string | null {
  if (error instanceof ApiError) {
    const fields = Object.entries(error.fieldErrors);
    for (const [field, message] of fields) {
      setError((fieldMap[field] || field) as never, { type: "server", message });
    }
    return fields.length > 0 ? null : error.message;
  }
  return "Something went wrong. Please try again.";
}
