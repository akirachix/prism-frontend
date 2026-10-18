export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");
export const USE_MOCKS = (process.env.NEXT_PUBLIC_USE_MOCKS || "true") === "true";
