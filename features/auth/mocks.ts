/**
 * Fake data for the auth feature. Only used when NEXT_PUBLIC_USE_MOCKS=true
 * (loaded lazily by api.ts, so it is never downloaded otherwise).
 *
 * Try it:
 *   - password "wrong-password" is rejected
 *   - e-mail containing "new"    -> goes through authenticator SETUP first
 *   - e-mail containing "change" -> must choose a new password first
 *   - any other e-mail           -> asks for the authenticator code
 *   - the code is accepted unless it is 000000
 *   - the role comes from the e-mail: teacher@... -> TEACHER, school@ / system@ -> admins, anything else PARENT
 *   - the reset / invitation token is accepted unless it is "badtoken"
 */
import { ApiError } from "@/lib/http";
import { getStoredUser } from "./session";
import type { AuthSession, AuthUser, MfaEnrollInfo, StageResult } from "./types";

export function mockUser(email: string): AuthUser {
  const local = email.split("@")[0] ?? "user";
  const role = local.startsWith("system")
    ? "SYSTEM_ADMIN"
    : local.startsWith("school")
      ? "SCHOOL_ADMIN"
      : local.startsWith("teacher")
        ? "TEACHER"
        : "PARENT";
  const [firstName, lastName] =
    role === "TEACHER" ? ["Mary", "Wambui"] : role === "PARENT" ? ["Grace", "Otieno"] : ["Alex", "Admin"];
  return {
    id: "mock-user-1",
    email,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    phone: "+254 700 000 000",
    schoolId: null,
    role,
  };
}

const stage = (value: StageResult["stage"]): StageResult => ({
  stage: value,
  stepToken: `mock-step-token-${value}`,
  expiresIn: 600,
  detail: "",
});

export function mockLogin(email: string, password: string): StageResult {
  if (password === "wrong-password") {
    throw new ApiError("Invalid email or password.", 401);
  }
  if (email.includes("change")) return stage("password_change_required");
  if (email.includes("new")) return stage("mfa_enrollment_required");
  return stage("mfa_required");
}

export const mockAfterPasswordChange = (): StageResult => stage("mfa_enrollment_required");
export const mockAfterInvitation = (token: string): StageResult => {
  if (token === "badtoken") throw new ApiError("This link is invalid or has expired.", 400);
  return stage("mfa_enrollment_required");
};

export const mockEnroll = (): MfaEnrollInfo => ({
  secret: "JBSWY3DPEHPK3PXP",
  otpauthUri: "otpauth://totp/Mirai:mock?secret=JBSWY3DPEHPK3PXP&issuer=Mirai",
});

export function mockSession(email: string, code: string): AuthSession {
  if (/^0+$/.test(code)) throw new ApiError("That code is not valid.", 401);
  return {
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    user: mockUser(email),
  };
}

export function mockReset(token: string): void {
  if (token === "badtoken") throw new ApiError("This link is invalid or has expired.", 400);
}

export function mockUpdateProfile(
  userId: string,
  input: { firstName: string; lastName: string; phone: string },
): AuthUser {
  const current = getStoredUser() ?? mockUser("parent@example.com");
  return {
    ...current,
    id: userId,
    firstName: input.firstName,
    lastName: input.lastName,
    name: `${input.firstName} ${input.lastName}`.trim(),
    phone: input.phone || null,
  };
}

/** In mock mode "the server" simply remembers who signed in. */
export const mockMe = (): AuthUser => getStoredUser() ?? mockUser("parent@example.com");
