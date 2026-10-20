"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui/StateMessage";
import { LOGIN_ROUTE } from "@/lib/config";
import { authApi } from "../api";
import { saveUser, useSession } from "../session";
import { homeRouteFor } from "../roles";

/** Used by "/": signed in -> home, otherwise -> sign-in. */
export function SessionRedirect() {
  const router = useRouter();
  const { status, user } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") router.replace(LOGIN_ROUTE);
    else if (status === "authenticated" && user) router.replace(homeRouteFor(user.role));
    else if (status === "authenticated") {
      // Tokens but no stored profile (cleared storage): fetch it, then this effect redirects.
      authApi.me().then(saveUser).catch(() => {});
    }
  }, [status, user, router]);

  return <Loading />;
}
