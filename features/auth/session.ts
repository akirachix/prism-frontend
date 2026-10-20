"use client";

/**
 * The signed-in session: tokens (lib/token-store.ts) + the user's profile.
 *
 *   useSession()   in components   -> { status, user }
 *   saveSession()  after the last sign-in step
 *   clearSession() on logout / expired session
 */
import { useMemo } from "react";
import { createStoredValue, useStoredValue } from "@/lib/stored-value";
import { tokenStore, useAccessToken } from "@/lib/token-store";
import type { AuthSession, AuthUser } from "./types";

const userStore = createStoredValue("prism.user", "local");

export function saveSession({ accessToken, refreshToken, user }: AuthSession) {
  tokenStore.set(accessToken, refreshToken);
  userStore.set(JSON.stringify(user));
}

export function saveUser(user: AuthUser) {
  userStore.set(JSON.stringify(user));
}

export function clearSession() {
  tokenStore.clear();
  userStore.clear();
}

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

function parseUser(raw: string | null | undefined): AuthUser | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<AuthUser>;
    if (typeof value.email !== "string") return null;
    return {
      id: String(value.id ?? ""),
      email: value.email,
      firstName: String(value.firstName ?? ""),
      lastName: String(value.lastName ?? ""),
      name: String(value.name ?? value.email),
      phone: value.phone ?? null,
      schoolId: value.schoolId ?? null,
      role: String(value.role ?? ""),
    };
  } catch {
    return null;
  }
}

/** The stored profile right now (outside React). */
export const getStoredUser = (): AuthUser | null => parseUser(userStore.get());

export function useSession(): { status: SessionStatus; user: AuthUser | null } {
  const token = useAccessToken();
  const rawUser = useStoredValue(userStore);
  const user = useMemo(() => parseUser(rawUser), [rawUser]);

  const status: SessionStatus =
    token === undefined ? "loading" : token ? "authenticated" : "unauthenticated";
  return { status, user: status === "authenticated" ? user : null };
}
