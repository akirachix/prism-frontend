"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { authApi } from "../api";
import { errorMessage } from "../error-message";
import { STAGE_ROUTE, startFlow } from "../flow";
import { loginRouteFor } from "../roles";
import type { Portal } from "../types";
import { emailRule, requiredRule, safeNext, validateEmail } from "../validation";

const NOTICES: Record<string, string> = {
  expired: "Your session expired. Please sign in again.",
  step: "That sign-in step timed out. Please start again.",
};

const COPY: Record<Portal, { subtitle: string; lead: string; other: Portal; otherQuestion: string }> = {
  parent: {
    subtitle: "Sign-in into the parent portal",
    lead: "Sign in to your parent account.",
    other: "teacher",
    otherQuestion: "Are you a teacher?",
  },
  teacher: {
    subtitle: "Sign-in into the teacher portal",
    lead: "Sign in to your teacher account.",
    other: "parent",
    otherQuestion: "Are you a parent?",
  },
};

interface Values {
  email: string;
  password: string;
}

/**
 * /login/parent and /login/teacher.
 * Step 1 of the sign-in: POST /auth/login. The backend answers with the NEXT
 * step (change password / set up authenticator / enter code) - see flow.ts.
 */
export function LoginScreen({ portal }: { portal: Portal }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const notice = NOTICES[params.get("reason") ?? ""];
  const copy = COPY[portal];

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ defaultValues: { email: "", password: "" } });

  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    setInfo(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const result = await authApi.login(cleanEmail, password);
      startFlow(cleanEmail, result, next, portal);
      router.push(STAGE_ROUTE[result.stage]);
    } catch (error) {
      setFormError(errorMessage(error));
    }
  });

  /** POST /auth/forgot-password. The reply is always the same, so it never reveals if the e-mail exists. */
  async function forgotPassword() {
    setFormError(null);
    setInfo(null);
    const email = getValues("email");
    const problem = validateEmail(email);
    if (problem) {
      setFormError("Enter your email address first.");
      return;
    }
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setInfo("If that email is registered, a reset link is on its way.");
    } catch (error) {
      setFormError(errorMessage(error));
    }
  }

  return (
    <AuthShell subtitle={copy.subtitle} role={portal}>
      <h1 className="heading">Welcome back</h1>
      <p className="lead">{copy.lead}</p>

      <form onSubmit={onSubmit} noValidate className="card--mobile-only" style={{ marginTop: 28 }}>
        {notice && (
          <p className="form-info" role="status">
            {notice}
          </p>
        )}
        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          error={errors.email?.message}
          {...register("email", { validate: emailRule })}
        />
        <TextField
          label="Password"
          password
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register("password", { validate: requiredRule("Password") })}
        />
        <div className="row-between">
          <span />
          <button type="button" className="btn btn--link" onClick={forgotPassword} style={{ fontSize: 11 }}>
            Forgot password?
          </button>
        </div>
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        {info && (
          <p className="form-info" role="status">
            {info}
          </p>
        )}
        <div className="form-actions" style={{ marginTop: 24 }}>
          <Button type="submit" loading={isSubmitting}>
            Sign in
          </Button>
        </div>
      </form>

      <p className="subtle" style={{ marginTop: 24, textAlign: "center" }}>
        {copy.otherQuestion}{" "}
        <Link href={loginRouteFor(copy.other)} className="link-red">
          Sign in here
        </Link>
      </p>
    </AuthShell>
  );
}
