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
  allowedRoles?: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useSession();

  const roleAllowed =
    !allowedRoles || !user?.role || allowedRoles.includes(user.role);

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
      .catch(() => {});
  }, [status]);

  if (status !== "authenticated" || !roleAllowed) {
    return <Loading />;
  }
  return <>{children}</>;
}
