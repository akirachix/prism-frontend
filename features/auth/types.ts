export type Portal = "parent" | "teacher";

export type UserRole = "SYSTEM_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string | null;
  schoolId: string | null;
  role: string;
}

export type AuthStage =
  "password_change_required" | "mfa_enrollment_required" | "mfa_required";

export interface StageResult {
  stage: AuthStage;
  stepToken: string;
  expiresIn: number;
  detail: string;
}

export interface MfaEnrollInfo {
  secret: string;
  otpauthUri: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
