import { useSyncExternalStore } from "react";

const KEY = "mirai.parentChild";
const EVENT = "mirai:parent-child";
let memory: string | null = null;

function read(): string | null {
  if (memory) return memory;
  try {
    memory = sessionStorage.getItem(KEY);
  } catch {
    memory = null;
  }
  return memory;
}

export function selectChild(studentId: string) {
  memory = studentId;
  try {
    sessionStorage.setItem(KEY, studentId);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function clearSelectedChild() {
  memory = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

export function useSelectedChildId(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
