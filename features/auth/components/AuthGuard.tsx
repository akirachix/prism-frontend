"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loading } from "@/components/ui/StateMessage";
import { LOGIN_ROUTE } from "@/lib/config";
import { authApi } from "../api";
import { homeRouteFor } from "../roles";
import { saveUser, useSession } from "../session";

interface AuthGuardProps {
  children: ReactNode;
  /** Only these roles may see the page (backend values, e.g. "SYSTEM_ADMIN"). Omit = any signed-in user. */
  allowedRoles?: string[];
}

/**
 * Wrap any page that needs a signed-in user.
 *  - signed out   -> /login?next=<this page> (the portal chooser)
 *  - wrong role   -> that role's own home
 * It also asks the backend for the current user once on load. That checks the
 * session is still valid (an expired access token is refreshed silently) and
 * keeps the stored profile fresh.
 * The token lives in localStorage, so this is a client-side guard; the
 * backend is what really protects the data.
 */
export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useSession();

  const roleAllowed = !allowedRoles || !user?.role || allowedRoles.includes(user.role);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`${LOGIN_ROUTE}?next=${encodeURIComponent(pathname)}`);
    } else if (status === "authenticated" && !roleAllowed) {
      router.replace(homeRouteFor(user?.role));
    }
  }, [status, roleAllowed, user?.role, router, pathname]);

  useEffect(() => {
    if (status !== "authenticated") return;
    authApi
      .me()
      .then(saveUser)
      .catch(() => {
        // A 401 is already handled by the HTTP client (sign out + redirect).
        // Anything else (e.g. offline) must not break the page.
      });
  }, [status]);

  if (status !== "authenticated" || !roleAllowed) {
    return <Loading />;
  }
  return <>{children}</>;
}
