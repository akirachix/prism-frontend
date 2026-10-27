"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { homeFor } from "@/lib/auth";
import { useSession } from "./SessionProvider";

export default function HomeRedirect() {
  const { ready, user } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (ready && user && homeFor(user) !== "/") router.replace(homeFor(user));
  }, [ready, user, router]);
  return null;
}
