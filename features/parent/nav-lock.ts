"use client";

import { useSyncExternalStore } from "react";

let locked = false;
const listeners = new Set<() => void>();

export const navLock = {
  set(value: boolean) {
    if (locked === value) return;
    locked = value;
    listeners.forEach((listener) => listener());
  },
  get: () => locked,
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useNavLocked = () =>
  useSyncExternalStore(subscribe, navLock.get, () => false);
