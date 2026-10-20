/** Form validation. Each function returns an error message or null. */
import { OTP_LENGTH } from "@/lib/config";

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address.";
  }
  return null;
}

export function validateRequired(value: string, label: string): string | null {
  return value.trim() ? null : `${label} is required.`;
}

/**
 * Mirrors the backend rule (core/security.py password_problems) so people
 * see the problem before sending. The backend stays the judge.
 */
export function passwordProblems(password: string, email = ""): string[] {
  const problems: string[] = [];
  if (password.length < 12) problems.push("at least 12 characters");
  if (!/[a-z]/.test(password)) problems.push("a lowercase letter");
  if (!/[A-Z]/.test(password)) problems.push("an uppercase letter");
  if (!/\d/.test(password)) problems.push("a digit");
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (local.length >= 4 && password.toLowerCase().includes(local)) {
    problems.push("must not contain your email name");
  }
  return problems;
}

export function validateNewPassword(
  password: string,
  confirm: string,
  email = "",
): string | null {
  if (!password) return "New password is required.";
  const problems = passwordProblems(password, email);
  if (problems.length) return `The new password needs: ${problems.join(", ")}.`;
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

export function validateCode(value: string): string | null {
  return /^\d+$/.test(value) && value.length === OTP_LENGTH
    ? null
    : `Enter the ${OTP_LENGTH}-digit code from your authenticator app.`;
}

/** Only allow in-app redirects (blocks "https://evil.com" and "//evil.com"). */
export function safeNext(value: string | null): string | null {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

// ── react-hook-form helpers ───────────────────────────────────────────────
// Use as `register("email", { validate: emailRule })`. A validate function
// returns `true` when the value is fine, otherwise the message to show.

export const emailRule = (value: string) => validateEmail(value) ?? true;

export const requiredRule = (label: string) => (value: string) =>
  validateRequired(value, label) ?? true;

export const codeRule = (value: string) => validateCode(value) ?? true;

/** New password: the backend's strength rule. `email` makes "contains your name" detectable. */
export const newPasswordRule = (email = "") => (value: string) => {
  if (!value) return "New password is required.";
  const problems = passwordProblems(value, email);
  return problems.length ? `The new password needs: ${problems.join(", ")}.` : true;
};

/** Confirm field: must equal another field's current value. */
export const sameAsRule = (other: () => string) => (value: string) =>
  value === other() ? true : "Passwords do not match.";
