import { LOGIN_ROUTE } from "@/lib/config";
import type { Portal } from "./types";

export const DEFAULT_HOME = "/dashboard";

export const ROLE_HOME: Record<string, string> = {
  PARENT: "/parent/dashboard",
  TEACHER: "/teachers/home",
  SYSTEM_ADMIN: DEFAULT_HOME,
  SCHOOL_ADMIN: DEFAULT_HOME,
};

export const homeRouteFor = (role?: string | null): string =>
  (role && ROLE_HOME[role]) || DEFAULT_HOME;

/** The portal a role belongs to (used to choose which login page to return to). */
export const portalForRole = (role?: string | null): Portal =>
  role === "TEACHER" ? "teacher" : "parent";

/** The login page of a portal; the chooser when the portal is not known. */
export const loginRouteFor = (portal: Portal | null): string =>
  portal ? `/login/${portal}` : LOGIN_ROUTE;
