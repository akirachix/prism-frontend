/**
 * The single switch between the real API and a feature's mock data.
 *
 *   export const listThings = () =>
 *     fromSource({
 *       api:  () => api.get<RawThing[]>(endpoints.things).then(toThings),
 *       mock: async () => (await import("./mocks")).mockThings,   // features/<name>/mocks.ts
 *     });
 *
 * NEXT_PUBLIC_USE_MOCKS=false (default) -> only `api` runs; mocks.ts is never loaded.
 * NEXT_PUBLIC_USE_MOCKS=true            -> only `mock` runs; no network request.
 *
 * There is deliberately NO silent fallback from the API to mocks.
 */
import { MOCK_DELAY_MS, USE_MOCKS } from "./config";

export const wait = (ms: number = MOCK_DELAY_MS) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

interface Sources<T> {
  api: () => Promise<T>;
  mock: () => T | Promise<T>;
}

export async function fromSource<T>({ api, mock }: Sources<T>): Promise<T> {
  if (!USE_MOCKS) return api();
  await wait();
  return mock();
}
