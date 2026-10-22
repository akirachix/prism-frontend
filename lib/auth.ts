import { request } from "@/lib/api";
import { clearSession, getSession, setSession } from "@/lib/session";
import type { UserRead } from "@/lib/users";

export type AuthStage =
  | "password_change_required"
  | "mfa_enrollment_required"
  | "mfa_required";

export interface AuthStageResponse {
  stage: AuthStage;
  step_token: string;
  expires_in: number;
  detail: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in: number;
  user: UserRead;
}

export interface MfaEnrollInfo {
  secret: string;
  otpauth_uri: string;
}

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });

export const authApi = {
  login: (email: string, password: string) =>
    post<AuthStageResponse>("/auth/login", { email, password }),
  changePassword: (
    step_token: string,
    current_password: string,
    new_password: string,
  ) =>
    post<AuthStageResponse>("/auth/change-password", {
      step_token,
      current_password,
      new_password,
    }),
  mfaEnroll: (step_token: string) =>
    post<MfaEnrollInfo>("/auth/mfa/enroll", { step_token }),
  mfaEnrollConfirm: (step_token: string, code: string) =>
    post<TokenPair>("/auth/mfa/enroll/confirm", { step_token, code }),
  mfaVerify: (step_token: string, code: string) =>
    post<TokenPair>("/auth/mfa/verify", { step_token, code }),
  acceptInvitation: (token: string, new_password: string) =>
    post<AuthStageResponse>("/auth/accept-invitation", { token, new_password }),
  forgotPassword: (email: string) =>
    post<{ detail: string }>("/auth/forgot-password", { email }),
  resetPassword: (token: string, new_password: string) =>
    post<{ detail: string }>("/auth/reset-password", { token, new_password }),
  me: () => request<UserRead>("/auth/me"),
  logout: (refresh_token: string | null) =>
    post<{ detail: string }>("/auth/logout", { refresh_token }),
};

export function startSession(pair: TokenPair, remember = true): void {
  setSession({
    access_token: pair.access_token,
    refresh_token: pair.refresh_token,
    expires_at: Date.now() + pair.expires_in * 1000,
    user: pair.user,
    remember,
  });
}

/** Revoke the refresh token on the server, then forget the session here. */
export async function signOut(): Promise<void> {
  const session = getSession();
  try {
    if (session) await authApi.logout(session.refresh_token);
  } catch {
    // Signing out locally still matters if the server call fails.
  } finally {
    clearSession();
  }
}

/* ------------------------------------------------------------------ */
/* The sign-in flow is several screens long (password → change password
 * → verify code). The step token is kept in sessionStorage so a page
 * refresh does not lose it. The password is kept in memory only, so
 * "Resend code" can log in again without asking for it. */

export type Portal = "teacher" | "parent";

export interface AuthFlow {
  portal: Portal;
  stage: AuthStage;
  step_token: string;
  expires_at: number;
  email?: string;
  remember?: boolean;
  /** Name the parent typed while creating their password. */
  pending_name?: { first_name: string; last_name: string };
}

const FLOW_KEY = "mirai.auth-flow";
let flowPassword: string | null = null;

export function saveFlow(flow: AuthFlow, password?: string): void {
  if (password !== undefined) flowPassword = password;
  try {
    window.sessionStorage.setItem(FLOW_KEY, JSON.stringify(flow));
  } catch {}
}

export function readFlow(): AuthFlow | null {
  try {
    const raw = window.sessionStorage.getItem(FLOW_KEY);
    if (!raw) return null;
    const flow = JSON.parse(raw) as AuthFlow;
    return flow.expires_at > Date.now() ? flow : null;
  } catch {
    return null;
  }
}

export function flowPasswordInMemory(): string | null {
  return flowPassword;
}

export function clearFlow(): void {
  flowPassword = null;
  try {
    window.sessionStorage.removeItem(FLOW_KEY);
  } catch {}
}

export function flowFromStage(
  portal: Portal,
  response: AuthStageResponse,
  extra: Partial<AuthFlow> = {},
): AuthFlow {
  return {
    portal,
    stage: response.stage,
    step_token: response.step_token,
    expires_at: Date.now() + response.expires_in * 1000,
    ...extra,
  };
}

/** The screen that handles each stage, per portal. */
export function routeForStage(portal: Portal, stage: AuthStage): string {
  if (stage === "password_change_required") return `/${portal}/new-password`;
  return `/${portal}/verify`;
}

export function homeFor(user: UserRead): string {
  if (user.role === "PARENT") return "/parent";
  if (user.role === "TEACHER") return "/teacher";
  return "/";
}

export const PASSWORD_RULES = {
  minLength: { value: 8, message: "Use at least 8 characters." },
  maxLength: { value: 255, message: "Use 255 characters or fewer." },
  validate: {
    letter: (value: string) =>
      /[A-Za-z]/.test(value) || "Include at least one letter.",
    number: (value: string) =>
      /\d/.test(value) || "Include at least one number.",
  },
};

export const EMAIL_PATTERN = {
  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  message: "Enter a valid email address.",
};
