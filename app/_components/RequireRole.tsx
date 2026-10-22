"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import type { Role } from "@/lib/users";
import { useSession } from "./SessionProvider";
import Button from "./ui/Button";
import "./ui/ui.css";

/**
 * Shows the page only to a signed-in user with the right role. Anyone
 * else is sent to that portal's sign-in screen, then brought back.
 */
export default function RequireRole({
  role,
  loginPath,
  children,
}: {
  role: Role;
  loginPath: string;
  children: ReactNode;
}) {
  const { ready, user, signOut } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);

  useEffect(() => {
    // Redirect once. During navigation this layout can briefly see the
    // sign-in page's path, and must not send people to "login?next=login".
    if (ready && !user && !redirected.current && !pathname.startsWith(loginPath)) {
      redirected.current = true;
      // Right after signing out, do not bring the person back to sign-out.
      router.replace(
        pathname.endsWith("/sign-out")
          ? `${loginPath}?notice=signed-out`
          : `${loginPath}?next=${encodeURIComponent(pathname)}`,
      );
    }
  }, [ready, user, router, loginPath, pathname]);

  if (!ready || !user) {
    return (
      <div className="ui-center" aria-busy="true">
        <span className="ui-spinner" aria-label="Loading" />
      </div>
    );
  }

  if (user.role !== role) {
    return (
      <div className="ui-center">
        <div className="ui-card ui-card--narrow">
          <h1 className="ui-title">This page is not for your account</h1>
          <p className="ui-text">
            You are signed in as {user.email}. Sign out to use a different
            account.
          </p>
          <Button
            onClick={async () => {
              await signOut();
              router.replace(loginPath);
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
