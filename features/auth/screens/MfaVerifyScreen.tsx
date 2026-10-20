"use client";

import { useState } from "react";
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
import { clearFlow } from "../flow";
import { loginRouteFor } from "../roles";
import { useStepFlow } from "../use-step-flow";
import { codeRule } from "../validation";

interface Values {
  code: string;
}

/**
 * Stage "mfa_required": the 6-digit code from the person's authenticator app.
 * POST /auth/mfa/verify -> tokens + user, then the person's own portal opens.
 */
export function MfaVerifyScreen() {
  const router = useRouter();
  const flow = useStepFlow("mfa_required");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ defaultValues: { code: "" } });

  if (!flow) return null;
  const { stepToken, email, portal } = flow;

  const onSubmit = handleSubmit(async ({ code }) => {
    setFormError(null);
    try {
      const session = await authApi.mfaVerify(stepToken, code, email);
      router.replace(completeSignIn(session));
    } catch (error) {
      if (isStepExpired(error)) {
        clearFlow();
        router.replace(`${loginRouteFor(portal)}?reason=step`);
        return;
      }
      setFormError(errorMessage(error));
      setValue("code", "");
    }
  });

  return (
    <AuthShell subtitle={portal ? `Sign-in into the ${portal} portal` : "Sign-in"} role={portal ?? "any"}>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
        <Halo>
          <LockIcon size={34} />
        </Halo>
      </div>

      <h1 className="heading" style={{ marginTop: 32 }}>
        Verify it’s you
      </h1>
      <p className="lead" style={{ marginTop: 16 }}>
        Enter the {OTP_LENGTH}-digit code shown in your authenticator app.
      </p>

      <form onSubmit={onSubmit} noValidate style={{ marginTop: 18 }}>
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
          <Button type="submit" loading={isSubmitting}>
            Verify
          </Button>
        </div>
      </form>

      <Link href={loginRouteFor(portal)} className="text-link" onClick={() => clearFlow()}>
        Back to sign in
      </Link>
    </AuthShell>
  );
}
