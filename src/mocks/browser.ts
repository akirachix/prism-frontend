import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

let starting: Promise<unknown> | null = null;

export function startWorker(): Promise<unknown> {
  starting ??= worker.start({ onUnhandledRequest: "bypass" });
  return starting;
}
