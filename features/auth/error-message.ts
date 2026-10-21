import { ApiError } from "@/lib/http";

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

export function isStepExpired(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 401 &&
    /expired|sign in again/i.test(error.message)
  );
}
