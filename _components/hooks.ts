"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { AuthFlow } from "@/lib/auth";

const noop = () => () => {};

/** False while the server HTML is being hydrated, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

const FLOW_KEY = "mirai.auth-flow";

function readRawFlow(): string | null {
  try {
    return window.sessionStorage.getItem(FLOW_KEY);
  } catch {
    return null;
  }
}

/** The saved sign-in step, or null when there is none (or it expired). */
export function useStoredFlow(): AuthFlow | null {
  const raw = useSyncExternalStore(noop, readRawFlow, () => null);
  return useMemo(() => {
    if (!raw) return null;
    try {
      const flow = JSON.parse(raw) as AuthFlow;
      // eslint-disable-next-line react-hooks/purity
      return flow.expires_at > Date.now() ? flow : null;
    } catch {
      return null;
    }
  }, [raw]);
}

/** True when the media query matches. False on the server. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
