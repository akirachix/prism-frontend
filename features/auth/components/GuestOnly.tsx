"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../session";
import { homeRouteFor } from "../roles";

/** Wrap sign-in style pages: signed-in users are sent to their home. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, user } = useSession();

  useEffect(() => {
    if (status === "authenticated") router.replace(homeRouteFor(user?.role));
  }, [status, user?.role, router]);

  return status === "unauthenticated" ? <>{children}</> : null;
}
