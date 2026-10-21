export const TEACHER_ID = process.env.NEXT_PUBLIC_TEACHER_ID ?? "";

export type SessionUser = {
  user_id: string;
  school_id: string;
  role: string;
};

export type Session = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: SessionUser;
};

let _session: Session | null = null;

export function getSession(): Session | null {
  return _session;
}

export function setSession(session: Session | null): void {
  _session = session;
}
