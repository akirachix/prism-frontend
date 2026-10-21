"use client";

import { useMemo } from "react";
import { createStoredValue, useStoredValue } from "@/lib/stored-value";
import type { AuthStage, MfaEnrollInfo, Portal, StageResult } from "./types";

export interface SignInFlow {
  email: string;
  stage: AuthStage;
  stepToken: string;
  portal: Portal | null;
  next: string | null;
  enroll?: MfaEnrollInfo;
}

const store = createStoredValue("prism.sign_in_flow", "session");

export const STAGE_ROUTE: Record<AuthStage, string> = {
  password_change_required: "/password-change",
  mfa_enrollment_required: "/mfa-setup",
  mfa_required: "/mfa-verify",
};

function parse(raw: string | null | undefined): SignInFlow | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as SignInFlow;
    if (!value || typeof value.stepToken !== "string" || !value.stage)
      return null;
    const portal =
      value.portal === "teacher" || value.portal === "parent"
        ? value.portal
        : null;
    return { ...value, portal };
  } catch {
    return null;
  }
}

export const getFlow = (): SignInFlow | null => parse(store.get());

export function startFlow(
  email: string,
  result: StageResult,
  next: string | null,
  portal: Portal | null,
) {
  store.set(
    JSON.stringify({
      email,
      stage: result.stage,
      stepToken: result.stepToken,
      portal,
      next,
    } satisfies SignInFlow),
  );
}

export function advanceFlow(result: StageResult) {
  const current = getFlow();
  startFlow(
    current?.email ?? "",
    result,
    current?.next ?? null,
    current?.portal ?? null,
  );
}

export function saveEnroll(enroll: MfaEnrollInfo) {
  const current = getFlow();
  if (current) store.set(JSON.stringify({ ...current, enroll }));
}

export const clearFlow = () => store.clear();

export function useFlow(): SignInFlow | null | undefined {
  const raw = useStoredValue(store);
  return useMemo(() => (raw === undefined ? undefined : parse(raw)), [raw]);
}
