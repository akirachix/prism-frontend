"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { LockIcon } from "@/components/icons";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { CodeInput } from "@/components/ui/CodeInput";
import { Halo } from "@/components/ui/Halo";
import { OTP_LENGTH } from "@/lib/config";
import { authApi } from "../api";
import { completeSignIn } from "../complete-sign-in";
import { errorMessage, isStepExpired } from "../error-message";
import { clearFlow, saveEnroll } from "../flow";
import { loginRouteFor } from "../roles";
import type { MfaEnrollInfo } from "../types";
import { useStepFlow } from "../use-step-flow";
import { codeRule } from "../validation";

/**
 * Every call to /auth/mfa/enroll creates a NEW secret and replaces the old
 * one. So: ask once per step token (this map also survives React Strict
 * Mode's double effect) and keep the answer in the sign-in flow.
 */
const inFlight = new Map<string, Promise<MfaEnrollInfo>>();

function ensureEnroll(stepToken: string): Promise<MfaEnrollInfo> {
  let request = inFlight.get(stepToken);
  if (!request) {
    request = authApi.mfaEnroll(stepToken);
    inFlight.set(stepToken, request);
  }
  return request;
}

/** "ABCD EFGH ..." so the key is easier to read and type. */
const groups = (secret: string) => secret.replace(/(.{4})/g, "$1 ").trim();

interface Values {
  code: string;
}

/**
 * Stage "mfa_enrollment_required" (first sign-in): link an authenticator app,
 * then prove it works with its first code. POST /auth/mfa/enroll gives the key,
 * POST /auth/mfa/enroll/confirm finishes the sign-in.
 */
export function MfaSetupScreen() {
  const router = useRouter();
  const flow = useStepFlow("mfa_enrollment_required");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ defaultValues: { code: "" } });

  const stepToken = flow?.stepToken;
  const portal = flow?.portal ?? null;
  const hasEnroll = Boolean(flow?.enroll);

  useEffect(() => {
    if (!stepToken || hasEnroll) return;
    ensureEnroll(stepToken)
      .then(saveEnroll)
      .catch((caught) => {
        inFlight.delete(stepToken);
        if (isStepExpired(caught)) {
          clearFlow();
          router.replace(`${loginRouteFor(portal)}?reason=step`);
        }
        // Other errors: the "Try again" button below lets the person retry.
      });
  }, [stepToken, hasEnroll, portal, router]);

  if (!flow) return null;
  const enroll = flow.enroll;

  const onSubmit = handleSubmit(async ({ code }) => {
    setFormError(null);
    try {
      const session = await authApi.mfaEnrollConfirm(flow.stepToken, code, flow.email);
      router.replace(completeSignIn(session));
    } catch (caught) {
      if (isStepExpired(caught)) {
        clearFlow();
        router.replace(`${loginRouteFor(flow.portal)}?reason=step`);
        return;
      }
      setFormError(errorMessage(caught));
      setValue("code", "");
    }
  });

  function retry() {
    inFlight.delete(flow!.stepToken);
    ensureEnroll(flow!.stepToken)
      .then(saveEnroll)
      .catch((caught) => setFormError(errorMessage(caught)));
  }

  return (
    <AuthShell
      subtitle={flow.portal ? `Sign-in into the ${flow.portal} portal` : "Set up your account"}
      role={flow.portal ?? "any"}
    >
      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
        <Halo>
          <LockIcon size={34} />
        </Halo>
      </div>

      <h1 className="heading" style={{ marginTop: 32 }}>
        Set up your authenticator
      </h1>
      <p className="lead" style={{ marginTop: 16 }}>
        Add Mirai to an authenticator app (Google Authenticator, Microsoft Authenticator, Authy…), then
        enter the {OTP_LENGTH}-digit code it shows.
      </p>

      <form onSubmit={onSubmit} noValidate style={{ marginTop: 18 }}>
        {enroll ? (
          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontWeight: 700 }}>Setup key</p>
            <p
              data-testid="mfa-secret"
              style={{ fontFamily: "monospace", fontSize: 16, letterSpacing: 1.5, wordBreak: "break-all", marginTop: 4 }}
            >
              {groups(enroll.secret)}
            </p>
            <p className="subtle" style={{ marginTop: 8 }}>
              In the app choose “Enter a setup key” (time based). On a phone you can also{" "}
              <a href={enroll.otpauthUri} className="link-red">
                open it in your authenticator app
              </a>
              .
            </p>
          </div>
        ) : (
          <p className="state state--loading" role="status">
            Preparing your setup key…{" "}
            <button type="button" className="btn btn--link" onClick={retry}>
              Try again
            </button>
          </p>
        )}

        <Controller
          name="code"
          control={control}
          rules={{ validate: codeRule }}
          render={({ field }) => <CodeInput value={field.value} onChange={field.onChange} />}
        />

        {(errors.code?.message || formError) && (
          <p className="form-error" role="alert" style={{ marginTop: 18 }}>
            {formError ?? errors.code?.message}
          </p>
        )}

        <div className="form-actions" style={{ marginTop: 24 }}>
          <Button type="submit" loading={isSubmitting} disabled={!enroll}>
            Finish setup
          </Button>
        </div>
      </form>

      <Link href={loginRouteFor(flow.portal)} className="text-link" onClick={() => clearFlow()}>
        Back to sign in
      </Link>
    </AuthShell>
  );
}
