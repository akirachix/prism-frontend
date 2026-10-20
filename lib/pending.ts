/**
 * Features the Mirai design needs but the backend does not expose yet
 * (no /students, /schools, screening, PDF export ... endpoints).
 *
 * In the feature's api.ts, the `api:` branch of fromSource() returns
 * `pendingEndpoint("What the user tried")`. The screen then shows a clear
 * "not available yet" message instead of fake data. The `mock:` branch still
 * works, so the screen can be built and demoed with NEXT_PUBLIC_USE_MOCKS=true.
 * When the backend ships the endpoint, replace that one line with api.get(...).
 */
export class PendingEndpointError extends Error {
  constructor(feature: string) {
    super(`${feature} is not available yet: the backend has no endpoint for it.`);
    this.name = "PendingEndpointError";
  }
}

export const pendingEndpoint = (feature: string): Promise<never> =>
  Promise.reject(new PendingEndpointError(feature));
