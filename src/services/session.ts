import type { Session, User } from "@/types/api";

const KEY = "mirai.session";
let memory: Session | null = null;

export function saveSession(session: Session) {
  memory = session;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {}
}

export function getSession(): Session | null {
  if (memory) return memory;
  try {
    const stored = sessionStorage.getItem(KEY);
    memory = stored ? JSON.parse(stored) : null;
  } catch {
    memory = null;
  }
  return memory;
}

export function clearSession() {
  memory = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

export function initialsOf(user: Partial<User> | null | undefined): string {
  const parts = [user?.first_name, user?.last_name].filter((part): part is string => Boolean(part));
  if (parts.length)
    return parts
      .map((part) => part.trim()[0].toUpperCase())
      .join("")
      .slice(0, 2);
  return (user?.email?.[0] || "?").toUpperCase();
}

const SIGNED_OUT: User = { user_id: "", first_name: "", email: "", role: "teacher" };

export function currentUser(): User {
  return getSession()?.user ?? SIGNED_OUT;
}
