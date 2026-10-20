/**
 * Environment flags. This is the ONLY file that reads process.env.
 * (Next.js only inlines NEXT_PUBLIC_* values when they are written out in full,
 * e.g. `process.env.NEXT_PUBLIC_API_BASE_URL` - do not refactor these lines.)
 *
 *   NEXT_PUBLIC_API_BASE_URL   Backend URL, no trailing slash.
 *   NEXT_PUBLIC_USE_MOCKS      "true"  -> features use their own mocks.ts, no network.
 *                              anything else -> real API calls (the default).
 *   NEXT_PUBLIC_MOCK_DELAY_MS  Fake latency for mock responses.
 *   NEXT_PUBLIC_APP_NAME       Product name used in page titles / aria labels.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export const MOCK_DELAY_MS = Number(process.env.NEXT_PUBLIC_MOCK_DELAY_MS ?? 300);

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Mirai";

/** Digits in the authenticator-app code. Fixed by the backend (^\d{6}$). */
export const OTP_LENGTH = 6;

/** Where the user is sent when there is no valid session (the portal chooser). */
export const LOGIN_ROUTE = "/login";

/** Silent token refresh, used by lib/http.ts. Backend: POST /auth/refresh. */
export const AUTH_REFRESH_PATH = "/auth/refresh";

/**
 * Send cookies with API calls? Off by default: auth uses the Bearer token, and
 * the backend's CORS is configured with allow_credentials=False. Turn on
 * (NEXT_PUBLIC_API_WITH_CREDENTIALS=true) only if the backend starts using
 * cookies; its CORS must then use allow_credentials=True too.
 */
export const API_CREDENTIALS: RequestCredentials =
  process.env.NEXT_PUBLIC_API_WITH_CREDENTIALS === "true" ? "include" : "same-origin";
