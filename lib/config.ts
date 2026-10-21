export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
).replace(/\/+$/, "");

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export const MOCK_DELAY_MS = Number(
  process.env.NEXT_PUBLIC_MOCK_DELAY_MS ?? 300,
);

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Mirai";

export const OTP_LENGTH = 6;

export const LOGIN_ROUTE = "/login";

export const AUTH_REFRESH_PATH = "/auth/refresh";

export const API_CREDENTIALS: RequestCredentials =
  process.env.NEXT_PUBLIC_API_WITH_CREDENTIALS === "true"
    ? "include"
    : "same-origin";
