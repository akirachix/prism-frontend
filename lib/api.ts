import { clearSession, getSession, setSession } from "@/lib/session";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Paths that must never send or refresh the access token. */
const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/refresh",
  "/auth/change-password",
  "/auth/mfa/",
  "/auth/accept-invitation",
  "/auth/forgot-password",
  "/auth/reset-password",
];

function isPublic(path: string): boolean {
  return PUBLIC_AUTH_PATHS.some((prefix) => path.startsWith(prefix));
}

let refreshing: Promise<boolean> | null = null;

async function exchangeRefreshToken(): Promise<boolean> {
  const session = getSession();
  if (!session?.refresh_token) return false;
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
      cache: "no-store",
    });
    if (!response.ok) return false;
    const pair = await response.json();
    setSession({
      access_token: pair.access_token,
      refresh_token: pair.refresh_token,
      expires_at: Date.now() + pair.expires_in * 1000,
      user: pair.user ?? session.user,
      remember: session.remember,
    });
    return true;
  } catch {
    return false;
  }
}

/** Swap the refresh token for a new pair. Calls made at the same time share one refresh. */
function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = exchangeRefreshToken().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

async function send(path: string, options: RequestInit): Promise<Response> {
  const token = isPublic(path) ? null : getSession()?.access_token;
  try {
    return await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      0,
      "We could not reach the server. Check your connection and try again.",
    );
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response = await send(path, options);

  if (response.status === 401 && !isPublic(path) && getSession()) {
    if (await refreshSession()) {
      response = await send(path, options);
    } else {
      clearSession();
    }
  }

  if (!response.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const body = await response.json();
      if (typeof body.detail === "string") message = body.detail;
    } catch {}
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Build a query string, leaving out empty values. */
export function query(
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

/** Turn any thrown value into a message that is safe to show. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

/** Resolve to null instead of failing on a 404 (nothing saved yet). */
export async function orNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
