import { request } from "@/lib/api";

export interface ParentInvitation {
  school_name: string;
  parent_first_name: string;
  children: string[];
  expires_at: string;
  consent_statements: Record<string, string>;
}

export const CONSENT_KEYS = [
  "screening",
  "data_use",
  "not_diagnostic",
] as const;

export type ConsentKey = (typeof CONSENT_KEYS)[number];

export type ParentConsent = Record<ConsentKey, boolean>;

export interface ParentInvitationAccept {
  token: string;
  email: string;
  first_name: string;
  last_name: string;
  new_password: string;
  consent: ParentConsent;
}

export interface ParentInvitationDone {
  detail: string;
  login_url: string;
}

export const PARENT_INVITATION_PATH = "/students/parent-invitation";

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });

export const parentInvitationApi = {
  details: (token: string) =>
    post<ParentInvitation>(PARENT_INVITATION_PATH, { token }),
  verifyEmail: (token: string, email: string) =>
    post<{ detail: string }>(`${PARENT_INVITATION_PATH}/verify-email`, {
      token,
      email,
    }),
  accept: (data: ParentInvitationAccept) =>
    post<ParentInvitationDone>(`${PARENT_INVITATION_PATH}/accept`, data),
};

export function invitationStepHref(
  step: "welcome" | "set-password",
  token: string,
  email?: string,
): string {
  const params = new URLSearchParams({ token });
  if (email) params.set("email", email);
  return `/parent/${step}?${params.toString()}`;
}

export function childrenLabel(children: string[]): string {
  if (children.length === 0) return "your child";
  if (children.length === 1) return children[0];
  return `${children.slice(0, -1).join(", ")} and ${children[children.length - 1]}`;
}

export const DEFAULT_CONSENT_TEXT: Record<ConsentKey, string> = {
  screening:
    "I agree that my child can take part in Mirai screening at school.",
  data_use:
    "I agree that the school can store and use the answers to support my child.",
  not_diagnostic:
    "I understand that Mirai screening is not a medical diagnosis.",
};

export function consentText(
  invitation: ParentInvitation | null,
  key: ConsentKey,
): string {
  return invitation?.consent_statements[key] ?? DEFAULT_CONSENT_TEXT[key];
}
