import { expect, type Page, type Request, type Route } from "@playwright/test";

export const API_HOST = "api.test";
export const SCHOOL_ID = "school-1";
export const TIME_ZONE = "Africa/Nairobi";

export type Role = "TEACHER" | "PARENT";
export type Portal = "teacher" | "parent";
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  school_id: string | null;
  role: string;
  must_change_password: boolean;
  mfa_enabled: boolean;
  is_active: boolean;
  created_at: string;
}

export const TEACHER_ID = "u-teacher";
export const PARENT_ID = "u-parent";

export function fakeUser(role: Role, overrides: Partial<User> = {}): User {
  const base =
    role === "TEACHER"
      ? {
          user_id: TEACHER_ID,
          first_name: "Jane",
          last_name: "Wanjiru",
          email: "jane.wanjiru@example.com",
          phone: "+254 712 345 678",
        }
      : {
          user_id: PARENT_ID,
          first_name: "Amina",
          last_name: "Otieno",
          email: "amina.otieno@example.com",
          phone: null,
        };
  return {
    ...base,
    school_id: SCHOOL_ID,
    role,
    must_change_password: false,
    mfa_enabled: true,
    is_active: true,
    created_at: "2026-01-10T08:00:00Z",
    ...overrides,
  };
}

export function tokenPair(role: Role, overrides: Partial<User> = {}) {
  return {
    access_token: `e2e-access-${role.toLowerCase()}`,
    refresh_token: `e2e-refresh-${role.toLowerCase()}`,
    token_type: "bearer",
    expires_in: 900,
    user: fakeUser(role, overrides),
  };
}

export const api = (path: string) => (url: URL) =>
  url.host === API_HOST && url.pathname === path;

export const json =
  (body: unknown, status = 200) =>
  (route: Route) =>
    route.fulfill({ status, json: body });

export const fail = (status: number, detail: string) =>
  json({ detail }, status);

export async function onApi(
  page: Page,
  method: Method,
  path: string,
  handler: (route: Route) => unknown,
) {
  await page.route(api(path), (route) =>
    route.request().method() === method ? handler(route) : route.fallback(),
  );
}

export async function recordApi(
  page: Page,
  method: Method,
  path: string,
  reply: unknown = {},
  status = 200,
) {
  const bodies: unknown[] = [];
  await onApi(page, method, path, (route) => {
    bodies.push(route.request().postDataJSON());
    return route.fulfill({ status, json: reply });
  });
  return bodies;
}

export async function failUnmockedApi(page: Page) {
  await page.route(
    (url) => url.host === API_HOST,
    (route) =>
      route.fulfill({
        status: 501,
        json: {
          detail: `Not mocked in this test: ${route.request().method()} ${route.request().url()}`,
        },
      }),
  );
}

export function nextCall(page: Page, method: Method, path: string) {
  return page.waitForRequest((request: Request) => {
    const url = new URL(request.url());
    return (
      request.method() === method &&
      url.host === API_HOST &&
      url.pathname === path
    );
  });
}

export async function signInAs(
  page: Page,
  role: Role,
  overrides: Partial<User> = {},
) {
  const pair = tokenPair(role, overrides);
  const session = {
    access_token: pair.access_token,
    refresh_token: pair.refresh_token,
    expires_at: Date.now() + 15 * 60 * 1000,
    user: pair.user,
    remember: true,
  };
  await page.addInitScript((value) => {
    if (sessionStorage.getItem("e2e.seeded")) return;
    localStorage.setItem("mirai.session", value);
    sessionStorage.setItem("e2e.seeded", "1");
  }, JSON.stringify(session));
  await onApi(page, "GET", "/auth/me", json(pair.user));
  return pair.user;
}

export async function storedSession(page: Page) {
  return page.evaluate(() => ({
    local: localStorage.getItem("mirai.session"),
    session: sessionStorage.getItem("mirai.session"),
  }));
}

export const authStage = (
  stage:
    "password_change_required" | "mfa_enrollment_required" | "mfa_required",
  stepToken = "step-1",
) => ({
  stage,
  step_token: stepToken,
  expires_in: 300,
  detail: "",
});

export async function seedAuthFlow(
  page: Page,
  portal: Portal,
  stage: Parameters<typeof authStage>[0],
  extra: Record<string, unknown> = {},
) {
  await page.addInitScript(
    (flow) => {
      sessionStorage.setItem(
        "mirai.auth-flow",
        JSON.stringify({ ...flow, expires_at: Date.now() + 300_000 }),
      );
    },
    { portal, stage, step_token: "step-1", ...extra },
  );
}

export async function enterCode(page: Page, code = "123456") {
  for (const [i, digit] of [...code].entries()) {
    await page.getByLabel(`Digit ${i + 1} of 6`, { exact: true }).fill(digit);
  }
}

export async function stubPrint(page: Page) {
  await page.addInitScript(() => {
    const target = window as unknown as { __printed: number };
    target.__printed = 0;
    window.print = () => {
      target.__printed += 1;
    };
  });
}

export async function expectPrinted(page: Page, times = 1) {
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { __printed: number }).__printed,
      ),
    )
    .toBe(times);
}

export const onScreen = (page: Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true });

export const at = (pathAndQuery: string) =>
  new RegExp(`${pathAndQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);

export type Face =
  | "Much worse"
  | "A little worse"
  | "No change"
  | "A little better"
  | "Much better";

export async function pickFace(page: Page, question: string, face: Face) {
  await page
    .getByRole("group", { name: question })
    .locator("label")
    .filter({ has: page.getByRole("radio", { name: face, exact: true }) })
    .click();
}

export const face = (page: Page, question: string, name: Face) =>
  page
    .getByRole("group", { name: question })
    .getByRole("radio", { name, exact: true });
