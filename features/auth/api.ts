import { api } from "@/lib/http";
import { fromSource } from "@/lib/data-source";
import { pendingEndpoint } from "@/lib/pending";
import { tokenStore } from "@/lib/token-store";
import { authEndpoints as e } from "./endpoints";
import type {
  AuthSession,
  AuthStage,
  AuthUser,
  MfaEnrollInfo,
  StageResult,
} from "./types";

type Raw = Record<string, unknown>;
const STAGES: AuthStage[] = [
  "password_change_required",
  "mfa_enrollment_required",
  "mfa_required",
];

const text = (value: unknown): string =>
  typeof value === "string" ? value : "";

export function toAuthUser(raw: unknown): AuthUser {
  const r = (raw && typeof raw === "object" ? raw : {}) as Raw;
  const firstName = text(r.first_name);
  const lastName = text(r.last_name);
  const email = text(r.email);
  return {
    id: text(r.user_id),
    email,
    firstName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(" ") || email,
    phone: text(r.phone) || null,
    schoolId: text(r.school_id) || null,
    role: text(r.role),
  };
}

function toStage(raw: Raw | undefined): StageResult {
  const stage = text(raw?.stage) as AuthStage;
  const stepToken = text(raw?.step_token);
  if (!STAGES.includes(stage) || !stepToken) {
    throw new Error("Unexpected response from the server (no sign-in step).");
  }
  return {
    stage,
    stepToken,
    expiresIn: typeof raw?.expires_in === "number" ? raw.expires_in : 0,
    detail: text(raw?.detail),
  };
}

function toSession(raw: Raw | undefined): AuthSession {
  const accessToken = text(raw?.access_token);
  const refreshToken = text(raw?.refresh_token);
  if (!accessToken || !refreshToken || !raw?.user) {
    throw new Error("Unexpected response from the server (no tokens).");
  }
  return { accessToken, refreshToken, user: toAuthUser(raw.user) };
}

const mocks = () => import("./mocks");

export const authApi = {
  /** Step 1. Password check -> which step comes next. */
  login: (email: string, password: string): Promise<StageResult> =>
    fromSource({
      api: () =>
        api
          .post<Raw>(e.login, { email, password }, { public: true })
          .then(toStage),
      mock: async () => (await mocks()).mockLogin(email, password),
    }),

  changePassword: (input: {
    stepToken: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<StageResult> =>
    fromSource({
      api: () =>
        api
          .post<Raw>(
            e.changePassword,
            {
              step_token: input.stepToken,
              current_password: input.currentPassword,
              new_password: input.newPassword,
            },
            { public: true },
          )
          .then(toStage),
      mock: async () => (await mocks()).mockAfterPasswordChange(),
    }),

  mfaEnroll: (stepToken: string): Promise<MfaEnrollInfo> =>
    fromSource({
      api: () =>
        api
          .post<Raw>(e.mfaEnroll, { step_token: stepToken }, { public: true })
          .then((raw) => ({
            secret: text(raw.secret),
            otpauthUri: text(raw.otpauth_uri),
          })),
      mock: async () => (await mocks()).mockEnroll(),
    }),

  mfaEnrollConfirm: (
    stepToken: string,
    code: string,
    email: string,
  ): Promise<AuthSession> =>
    fromSource({
      api: () =>
        api
          .post<Raw>(
            e.mfaEnrollConfirm,
            { step_token: stepToken, code },
            { public: true },
          )
          .then(toSession),
      mock: async () => (await mocks()).mockSession(email, code),
    }),

  mfaVerify: (
    stepToken: string,
    code: string,
    email: string,
  ): Promise<AuthSession> =>
    fromSource({
      api: () =>
        api
          .post<Raw>(
            e.mfaVerify,
            { step_token: stepToken, code },
            { public: true },
          )
          .then(toSession),
      mock: async () => (await mocks()).mockSession(email, code),
    }),

  acceptInvitation: (
    token: string,
    newPassword: string,
  ): Promise<StageResult> =>
    fromSource({
      api: () =>
        api
          .post<Raw>(
            e.acceptInvitation,
            { token, new_password: newPassword },
            { public: true },
          )
          .then(toStage),
      mock: async () => (await mocks()).mockAfterInvitation(token),
    }),

  forgotPassword: (email: string): Promise<void> =>
    fromSource({
      api: () => api.post<void>(e.forgotPassword, { email }, { public: true }),
      mock: () => undefined,
    }),

  resetPassword: (token: string, newPassword: string): Promise<void> =>
    fromSource({
      api: () =>
        api.post<void>(
          e.resetPassword,
          { token, new_password: newPassword },
          { public: true },
        ),
      mock: async () => (await mocks()).mockReset(token),
    }),

  logout: (): Promise<void> =>
    fromSource({
      api: () =>
        api.post<void>(e.logout, () => {
          const refreshToken = tokenStore.getRefresh();
          return refreshToken ? { refresh_token: refreshToken } : {};
        }),
      mock: () => undefined,
    }),

  changePasswordSignedIn: (_input: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> =>
    fromSource({
      api: () =>
        pendingEndpoint("Changing your password from the account page"),
      mock: () => undefined,
    }),

  updateProfile: (
    userId: string,
    input: { firstName: string; lastName: string; phone: string },
  ): Promise<AuthUser> =>
    fromSource({
      api: () =>
        api
          .patch<Raw>(e.user(userId), {
            first_name: input.firstName.trim(),
            last_name: input.lastName.trim(),
            phone: input.phone.trim() || null,
          })
          .then(toAuthUser),
      mock: async () => (await mocks()).mockUpdateProfile(userId, input),
    }),

  me: (): Promise<AuthUser> =>
    fromSource({
      api: () => api.get<Raw>(e.me).then(toAuthUser),
      mock: async () => (await mocks()).mockMe(),
    }),
};
