"use client";

import { useSyncExternalStore } from "react";

export interface StoredValue {
  get: () => string | null;
  set: (value: string) => void;
  clear: () => void;
  subscribe: (listener: () => void) => () => void;
}

export function createStoredValue(
  key: string,
  area: "local" | "session",
): StoredValue {
  const listeners = new Set<() => void>();
  const storage = () =>
    area === "local" ? window.localStorage : window.sessionStorage;
  const notify = () => listeners.forEach((listener) => listener());

  return {
    get() {
      try {
        return storage().getItem(key);
      } catch {
        return null;
      }
    },
    set(value) {
      try {
        storage().setItem(key, value);
      } catch {}
      notify();
    },
    clear() {
      try {
        storage().removeItem(key);
      } catch {
        /* ignore */
      }
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key || event.key === null) listener();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}

export function useStoredValue(store: StoredValue): string | null | undefined {
  return useSyncExternalStore<string | null | undefined>(
    store.subscribe,
    store.get,
    () => undefined,
  );
}
