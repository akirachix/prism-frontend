import { clearSession, getSession, setSession } from "@/lib/session";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

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

function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = exchangeRefreshToken().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

async function send(path: string, options: RequestInit): Promise<Response> {
  if (!BASE_URL) {
    throw new ApiError(
      0,
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local and restart npm run dev.",
    );
  }
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

export { query } from "@/lib/query";

export const MAX_PAGE_SIZE = 200;

export async function fetchAll<T>(
  fetchPage: (limit: number, offset: number) => Promise<T[]>,
  pageSize = MAX_PAGE_SIZE,
): Promise<T[]> {
  const all: T[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await fetchPage(pageSize, offset);
    all.push(...page);
    if (page.length < pageSize) return all;
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

export async function orNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
