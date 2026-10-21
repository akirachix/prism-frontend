import {
  API_BASE_URL,
  API_CREDENTIALS,
  AUTH_REFRESH_PATH,
  LOGIN_ROUTE,
} from "./config";
import { tokenStore } from "./token-store";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type Params = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  params?: Params;
  public?: boolean;
  signal?: AbortSignal;
}

export function withQuery(path: string, params?: Params): string {
  if (!params) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  if (!query) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${query}`;
}

function messageFrom(details: unknown, status: number): string {
  if (status === 429)
    return "Too many attempts. Please wait a minute and try again.";
  const body = details as
    { detail?: unknown; message?: unknown } | null | undefined;
  const detail = body?.detail ?? body?.message;
  if (typeof detail === "string" && detail) return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (!item || typeof item !== "object" || !("msg" in item)) return "";
        const loc = "loc" in item && Array.isArray(item.loc) ? item.loc : [];
        const field = loc[loc.length - 1];
        const where =
          typeof field === "string" && field !== "body" ? `${field}: ` : "";
        return `${where}${String(item.msg)}`;
      })
      .filter(Boolean);
    if (messages.length) return messages.join(" ");
  }
  return `Request failed (${status})`;
}

function authHeaders(isPublic?: boolean): Record<string, string> {
  const token = isPublic ? null : tokenStore.get();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleUnauthorized() {
  tokenStore.clear();
  if (typeof window !== "undefined") {
    const targetUrl = `${LOGIN_ROUTE}?reason=expired`;
    window.history.pushState({}, "", targetUrl);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

async function send(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new ApiError(
      "Cannot reach the server. Check that the backend is running and the API URL is correct.",
      0,
    );
  }
}

type RefreshOutcome = "ok" | "rejected" | "unreachable";
let refreshing: Promise<RefreshOutcome> | null = null;

function refreshSession(): Promise<RefreshOutcome> {
  if (refreshing) return refreshing;
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return Promise.resolve("rejected");

  refreshing = (async (): Promise<RefreshOutcome> => {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${AUTH_REFRESH_PATH}`, {
        method: "POST",
        credentials: API_CREDENTIALS,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      return "unreachable";
    }
    if (!response.ok) return "rejected";
    try {
      const data = (await response.json()) as {
        access_token?: unknown;
        refresh_token?: unknown;
      };
      if (
        typeof data.access_token !== "string" ||
        typeof data.refresh_token !== "string"
      ) {
        return "rejected";
      }
      tokenStore.set(data.access_token, data.refresh_token);
      return "ok";
    } catch {
      return "rejected";
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const usedToken = options.public ? null : tokenStore.get();
  const payload = typeof body === "function" ? (body as () => unknown)() : body;
  const response = await send(withQuery(path, options.params), {
    method,
    credentials: API_CREDENTIALS,
    signal: options.signal,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(options.public),
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });

  const text = response.status === 204 ? "" : await response.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !options.public && !isRetry) {
      const current = tokenStore.get();
      const outcome: RefreshOutcome =
        current && current !== usedToken ? "ok" : await refreshSession();
      if (outcome === "ok")
        return request<T>(method, path, body, options, true);
      if (outcome === "unreachable") {
        throw new ApiError(
          "Cannot reach the server. Check that the backend is running and the API URL is correct.",
          0,
        );
      }
    }
    if (response.status === 401 && !options.public) handleUnauthorized();
    throw new ApiError(
      messageFrom(data, response.status),
      response.status,
      data,
    );
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};

export function asList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["items", "results", "data"]) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
