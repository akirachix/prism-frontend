"use client";

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

export const useAccessToken = () => useStoredValue(accessStore);
