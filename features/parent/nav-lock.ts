"use client";

/**
 * Tiny shared flag: "the parent is in the middle of the evaluation".
 * While it is on, the sidebar / tab bar items other than Evaluation are
 * disabled (see ParentFrame) so answers are not abandoned by accident.
 * The evaluation screen switches it on and off.
 */
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

export const useNavLocked = () => useSyncExternalStore(subscribe, navLock.get, () => false);
