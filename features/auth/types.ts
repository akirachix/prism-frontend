/** Types used by the auth screens. Screens never see raw API shapes. */

/** Which Mirai portal a person is signing in to (chosen on the login chooser). */
export type Portal = "parent" | "teacher";

/** Exact values of the backend RoleEnum. */
export type UserRole = "SYSTEM_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** "First Last", for display. */
  name: string;
  phone: string | null;
  schoolId: string | null;
  /** Backend role, upper-case (see UserRole). */
  role: string;
}

/**
 * Sign-in is a short chain of steps. Each step returns the NEXT stage plus a
 * step token (valid ~10 min) that the next call must send back.
 */
export type AuthStage =
  | "password_change_required"
  | "mfa_enrollment_required"
  | "mfa_required";

export interface StageResult {
  stage: AuthStage;
  stepToken: string;
  /** Seconds the step token stays valid. */
  expiresIn: number;
  detail: string;
}

export interface MfaEnrollInfo {
  /** Base32 key to type into an authenticator app. */
  secret: string;
  /** otpauth:// URI (what a QR code would contain). */
  otpauthUri: string;
}

/** The finished sign-in: tokens + the signed-in user. */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
