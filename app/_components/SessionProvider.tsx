"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { authApi, signOut as endSession } from "@/lib/auth";
import { getSession, onSessionChange, updateSessionUser } from "@/lib/session";
import type { UserRead } from "@/lib/users";
import { useHydrated } from "./hooks";

interface SessionValue {
  /** False until the stored session has been read on the client. */
  ready: boolean;
  user: UserRead | null;
  refreshUser: () => Promise<void>;
  setUser: (user: UserRead) => void;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export default function SessionProvider({ children }: { children: ReactNode }) {
  const ready = useHydrated();
  const session = useSyncExternalStore(onSessionChange, getSession, () => null);
  const user = session?.user ?? null;
  const signedIn = Boolean(session);

  // Check the stored token still works and pick up profile changes.
  useEffect(() => {
    if (!signedIn) return;
    authApi
      .me()
      .then(updateSessionUser)
      .catch(() => {});
  }, [signedIn]);

  const refreshUser = useCallback(async () => {
    updateSessionUser(await authApi.me());
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      ready,
      user,
      refreshUser,
      setUser: updateSessionUser,
      signOut: endSession,
    }),
    [ready, user, refreshUser],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}

/** For pages behind RequireRole, where a user is always present. */
export function useUser(): UserRead {
  const { user } = useSession();
  if (!user) throw new Error("useUser needs a signed-in user");
  return user;
}
