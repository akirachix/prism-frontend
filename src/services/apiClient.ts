import { API_BASE_URL } from "@/config";
import { clearSession, getSession } from "@/services/session";

export const SESSION_EXPIRED_EVENT = "mirai:session-expired";

export class ApiError extends Error {
  status: number;

  fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function expireSession(sentWith: string | null | undefined) {
  if ((getSession()?.token ?? null) !== (sentWith ?? null)) return;
  clearSession();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

interface ErrorBody {
  detail?: string | { loc?: (string | number)[]; msg?: string }[];
}

function parseError(status: number, body: ErrorBody | null): ApiError {
  const detail = body?.detail;
  if (Array.isArray(detail)) {
    const fieldErrors: Record<string, string> = {};
    for (const item of detail) {
      const field = item.loc?.[item.loc.length - 1];
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = String(item.msg).replace(/^Value error, /, "");
      }
    }
    return new ApiError(status, "Please check the highlighted fields.", fieldErrors);
  }
  if (typeof detail === "string") return new ApiError(status, detail);
  return new ApiError(status, "Something went wrong. Please try again.");
}

export type Query = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query;
  headers?: Record<string, string>;
}

export async function request<T = unknown>(
  path: string,
  { method = "GET", body, query, headers }: RequestOptions = {},
): Promise<T> {
  let response: Response;
  const token = getSession()?.token;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),

        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  if (response.status === 204) return null as T;

  const data = await response.json().catch(() => null);

  if (response.status === 401 && !path.startsWith("/auth/")) expireSession(token);
  if (!response.ok) throw parseError(response.status, data);
  return data as T;
}

export async function requestFile(path: string): Promise<{ blob: Blob; filename: string | null }> {
  let response: Response;
  const token = getSession()?.token;
  try {
    response = await fetch(buildUrl(path), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    if (response.status === 401) expireSession(token);
    throw parseError(response.status, data);
  }
  const disposition = response.headers.get("Content-Disposition") || "";
  const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? null;
  return { blob: await response.blob(), filename };
}

export const api = {
  get: <T = unknown>(path: string, query?: Query) => request<T>(path, { query }),
  post: <T = unknown>(path: string, body?: unknown, query?: Query) =>
    request<T>(path, { method: "POST", body, query }),
  patch: <T = unknown>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T = unknown>(path: string) => request<T>(path, { method: "DELETE" }),
};
