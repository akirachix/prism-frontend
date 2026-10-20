"use client";

/**
 * State of the multi-step sign-in (login -> [change password] -> [authenticator
 * setup] -> code). Kept in sessionStorage so it survives a refresh but not a
 * closed tab. It holds only the short-lived step token (~10 min, one purpose).
 */
import { useMemo } from "react";
import { createStoredValue, useStoredValue } from "@/lib/stored-value";
import type { AuthStage, MfaEnrollInfo, Portal, StageResult } from "./types";

export interface SignInFlow {
  /** Empty when the person came from an invitation link (email is not known). */
  email: string;
  stage: AuthStage;
  stepToken: string;
  /** The portal whose login page started this sign-in (decides the look of the step pages); null when it came from an invitation link. */
  portal: Portal | null;
  /** Page to open after sign-in (from ?next=). */
  next: string | null;
  /** The authenticator key, kept so a page refresh does not create a new one. */
  enroll?: MfaEnrollInfo;
}

const store = createStoredValue("prism.sign_in_flow", "session");

/** Where each stage is handled (app/(auth)/...). */
export const STAGE_ROUTE: Record<AuthStage, string> = {
  password_change_required: "/password-change",
  mfa_enrollment_required: "/mfa-setup",
  mfa_required: "/mfa-verify",
};

function parse(raw: string | null | undefined): SignInFlow | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as SignInFlow;
    if (!value || typeof value.stepToken !== "string" || !value.stage) return null;
    const portal = value.portal === "teacher" || value.portal === "parent" ? value.portal : null;
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

/** A step succeeded: keep email/next, take the new stage + step token. */
export function advanceFlow(result: StageResult) {
  const current = getFlow();
  startFlow(current?.email ?? "", result, current?.next ?? null, current?.portal ?? null);
}

export function saveEnroll(enroll: MfaEnrollInfo) {
  const current = getFlow();
  if (current) store.set(JSON.stringify({ ...current, enroll }));
}

export const clearFlow = () => store.clear();

/** `undefined` while the browser is being read, `null` when there is no sign-in in progress. */
export function useFlow(): SignInFlow | null | undefined {
  const raw = useStoredValue(store);
  return useMemo(() => (raw === undefined ? undefined : parse(raw)), [raw]);
}
