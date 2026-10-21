"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../session";
import { homeRouteFor } from "../roles";

export function GuestOnly({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, user } = useSession();

  useEffect(() => {
    if (status === "authenticated") router.replace(homeRouteFor(user?.role));
  }, [status, user?.role, router]);

  return status === "unauthenticated" ? <>{children}</> : null;
}
