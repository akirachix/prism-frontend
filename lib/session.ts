import type { UserRead } from "@/lib/users";

export const TEACHER_ID = process.env.NEXT_PUBLIC_TEACHER_ID ?? "";

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: UserRead;
  remember?: boolean;
}

const KEY = "mirai.session";
const EVENT = "mirai:session";

let memory: Session | null = null;

function read(): Session | null {
  if (memory) return memory;
  try {
    const raw =
      window.localStorage.getItem(KEY) ?? window.sessionStorage.getItem(KEY);
    memory = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    memory = null;
  }
  return memory;
}

function storageFor(session: Session): Storage {
  return session.remember === false
    ? window.sessionStorage
    : window.localStorage;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  return read();
}

export function setSession(session: Session | null): void {
  memory = session;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    window.sessionStorage.removeItem(KEY);
    if (session) storageFor(session).setItem(KEY, JSON.stringify(session));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function updateSessionUser(user: UserRead): void {
  const current = getSession();
  if (current) setSession({ ...current, user });
}

export function clearSession(): void {
  setSession(null);
}

export function onSessionChange(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) {
      memory = null;
      listener();
    }
  };
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}