import { clearFlow, getFlow } from "./flow";
import { homeRouteFor } from "./roles";
import { saveSession } from "./session";
import type { AuthSession } from "./types";

/**
 * Store the finished session and return the page to open next.
 * The page comes from the backend role (not from which login page was used),
 * so a teacher who signs in on the parent page still lands in the teacher portal.
 */
export function completeSignIn(session: AuthSession): string {
  const next = getFlow()?.next ?? null;
  saveSession(session);
  clearFlow();
  return next ?? homeRouteFor(session.user.role);
}
