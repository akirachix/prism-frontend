import { ApiError } from "@/lib/http";

/** Turn anything thrown by the API layer into text a person can read. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return "Cannot reach the server. Check that the backend is running and NEXT_PUBLIC_API_BASE_URL is correct.";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

/**
 * The step token (10 min) ran out or was already used. The backend answers 401
 * "This step has expired. Please sign in again." - a wrong code is also a 401
 * ("That code is not valid."), so tell them apart by the wording.
 */
export function isStepExpired(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401 && /expired|sign in again/i.test(error.message);
}
