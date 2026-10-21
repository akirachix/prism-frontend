import { clearFlow, getFlow } from "./flow";
import { homeRouteFor } from "./roles";
import { saveSession } from "./session";
import type { AuthSession } from "./types";

export function completeSignIn(session: AuthSession): string {
  const next = getFlow()?.next ?? null;
  saveSession(session);
  clearFlow();
  return next ?? homeRouteFor(session.user.role);
}
