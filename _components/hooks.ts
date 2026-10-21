"use client";

import { useCallback, useSyncExternalStore } from "react";

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

let cachedFlow: AuthFlow | null = null;
let cachedRaw: string | null = null;

function readRawFlow(): string | null {
  try {
    return window.sessionStorage.getItem(FLOW_KEY);
  } catch {
    return null;
  }
}

function readStoredFlow(): AuthFlow | null {
  const raw = readRawFlow();
  if (!raw) {
    cachedFlow = null;
    cachedRaw = null;
    return null;
  }
  if (raw === cachedRaw && cachedFlow) return cachedFlow;

  try {
    cachedRaw = raw;
    cachedFlow = JSON.parse(raw) as AuthFlow;
    return cachedFlow;
  } catch {
    cachedRaw = raw;
    cachedFlow = null;
    return null;
  }
}

/** The saved sign-in step, or null when there is none. */
export function useStoredFlow(): AuthFlow | null {
  return useSyncExternalStore(noop, readStoredFlow, () => null);
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
