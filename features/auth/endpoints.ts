export const authEndpoints = {
  health: "/health",

  login: "/auth/login",
  changePassword: "/auth/change-password",
  mfaEnroll: "/auth/mfa/enroll",
  mfaEnrollConfirm: "/auth/mfa/enroll/confirm",
  mfaVerify: "/auth/mfa/verify",
  logout: "/auth/logout",
  me: "/auth/me",
  acceptInvitation: "/auth/accept-invitation",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",

  user: (userId: string) => `/users/${userId}`,
} as const;
