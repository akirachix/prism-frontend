export class PendingEndpointError extends Error {
  constructor(feature: string) {
    super(
      `${feature} is not available yet: the backend has no endpoint for it.`,
    );
    this.name = "PendingEndpointError";
  }
}

export const pendingEndpoint = (feature: string): Promise<never> =>
  Promise.reject(new PendingEndpointError(feature));
