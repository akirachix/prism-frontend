"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { homeFor } from "@/lib/auth";
import { useSession } from "./SessionProvider";

/** Someone already signed in goes straight to their portal. */
export default function HomeRedirect() {
  const { ready, user } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (ready && user && homeFor(user) !== "/") router.replace(homeFor(user));
  }, [ready, user, router]);
  return null;
}
