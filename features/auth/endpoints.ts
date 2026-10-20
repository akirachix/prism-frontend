/**
 * Auth endpoint map  -  THE place to change an auth URL.
 * These match backend routers/auth.py (prefix "/auth").
 * The silent token refresh (POST /auth/refresh) is in lib/config.ts.
 */
export const authEndpoints = {
  health: "/health",

  /** {email, password} -> {stage, step_token, ...} */
  login: "/auth/login",
  /** {step_token, current_password, new_password} -> next stage */
  changePassword: "/auth/change-password",
  /** {step_token} -> {secret, otpauth_uri}. Each call makes a NEW secret! */
  mfaEnroll: "/auth/mfa/enroll",
  /** {step_token, code} -> tokens + user */
  mfaEnrollConfirm: "/auth/mfa/enroll/confirm",
  /** {step_token, code} -> tokens + user */
  mfaVerify: "/auth/mfa/verify",
  /** (Bearer) {refresh_token} -> {detail} */
  logout: "/auth/logout",
  /** (Bearer) the signed-in user */
  me: "/auth/me",
  /** {token, new_password} -> next stage. Token comes from the e-mailed link. */
  acceptInvitation: "/auth/accept-invitation",
  /** {email} -> {detail} (always the same reply) */
  forgotPassword: "/auth/forgot-password",
  /** {token, new_password} -> {detail} */
  resetPassword: "/auth/reset-password",

  /** PATCH {first_name?, last_name?, phone?} - a user may edit their own profile. */
  user: (userId: string) => `/users/${userId}`,
} as const;
