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
