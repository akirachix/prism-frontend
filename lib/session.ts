import type { UserRead } from "@/lib/users";

/**
 * The signed-in session, kept in localStorage so the PWA stays signed in
 * between visits. Every read and write is wrapped because storage can be
 * blocked (private windows, some in-app browsers).
 */
export interface Session {
  access_token: string;
  refresh_token: string;
  /** Epoch milliseconds when the access token stops working. */
  expires_at: number;
  user: UserRead;
  /** False when the person unticked "Remember me". */
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

/** Sessions started without "Remember me" live only in this tab. */
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
