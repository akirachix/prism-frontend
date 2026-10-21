"use client";

import {
  flowFromStage,
  homeFor,
  routeForStage,
  saveFlow,
  type AuthFlow,
  type AuthStageResponse,
  type Portal,
} from "@/lib/auth";
import type { UserRead } from "@/lib/users";

type Router = { push: (href: string) => void; replace: (href: string) => void };

const AUTH_PAGE =
  /^\/(teacher|parent)\/(login|verify|new-password|forgot-password|reset-password|welcome|invite|set-password)\b/;

export function safeNext(next: string | null, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  if (AUTH_PAGE.test(next)) return fallback;
  return next;
}

export function goToStage(
  router: Router,
  portal: Portal,
  response: AuthStageResponse,
  options: {
    password?: string;
    extra?: Partial<AuthFlow>;
    next?: string | null;
  } = {},
) {
  saveFlow(flowFromStage(portal, response, options.extra), options.password);
  const path = routeForStage(portal, response.stage);
  router.push(
    options.next ? `${path}?next=${encodeURIComponent(options.next)}` : path,
  );
}

export function landingFor(
  user: UserRead,
  portal: Portal,
  next: string | null,
) {
  const home = homeFor(user);
  // Only follow `next` when it belongs to the portal the user can open.
  if (home === `/${portal}`) return safeNext(next, home);
  return home;
}
