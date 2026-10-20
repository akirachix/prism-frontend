"use client";

/**
 * Access + refresh tokens. Lives in lib/ (not in features/auth) because the
 * HTTP client needs them, and every feature goes through the HTTP client.
 * Only the auth feature (and the client's silent refresh) writes them.
 *
 * The backend issues a short-lived access token (15 min by default) and a
 * rotating refresh token (7 days): each refresh token works ONCE.
 */
import { createStoredValue, useStoredValue } from "./stored-value";

const accessStore = createStoredValue("prism.access_token", "local");
const refreshStore = createStoredValue("prism.refresh_token", "local");

export const tokenStore = {
  get: accessStore.get,
  getRefresh: refreshStore.get,
  set(accessToken: string, refreshToken?: string | null) {
    accessStore.set(accessToken);
    if (refreshToken) refreshStore.set(refreshToken);
  },
  clear() {
    accessStore.clear();
    refreshStore.clear();
  },
};

/** `undefined` = not known yet (server render), `null` = signed out. */
export const useAccessToken = () => useStoredValue(accessStore);
