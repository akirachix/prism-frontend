"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LOGIN_ROUTE } from "@/lib/config";
import { STAGE_ROUTE, useFlow, type SignInFlow } from "./flow";
import type { AuthStage } from "./types";

/**
 * For the step pages (/password-change, /mfa-setup, /mfa-verify).
 * Returns the flow when it is on `expected`; otherwise redirects (to the
 * login chooser when there is no sign-in in progress, or to the page of the
 * real stage).
 */
export function useStepFlow(expected: AuthStage): SignInFlow | null {
  const router = useRouter();
  const flow = useFlow();

  useEffect(() => {
    if (flow === null) router.replace(LOGIN_ROUTE);
    else if (flow && flow.stage !== expected) router.replace(STAGE_ROUTE[flow.stage]);
  }, [flow, expected, router]);

  return flow && flow.stage === expected ? flow : null;
}
