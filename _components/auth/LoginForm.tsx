"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { errorMessage } from "@/lib/api";
import { authApi, EMAIL_PATTERN, type Portal } from "@/lib/auth";
import Button from "../ui/Button";
import { Alert } from "../ui/bits";
import { PasswordField, TextField } from "../ui/Field";
import { goToStage } from "./flow";

interface Values {
  email: string;
  password: string;
  remember: boolean;
}

/**
 * Email + password sign-in.
 * - "standard": teacher sign in and parent "Welcome back".
 * - "temporary": the parent's first visit with the emailed temporary password.
 */
export default function LoginForm({
  portal,
  mode = "standard",
  submitLabel = "Sign in",
  showRemember,
  framed = true,
}: {
  portal: Portal;
  mode?: "standard" | "temporary";
  submitLabel?: string;
  showRemember?: boolean;
  framed?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const notice = params.get("notice");
  const [error, setError] = useState<string | null>(null);
  const temporary = mode === "temporary";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      email: params.get("email") ?? "",
      password: "",
      remember: true,
    },
  });

  async function onSubmit(values: Values) {
    setError(null);
    try {
      const response = await authApi.login(
        values.email.trim(),
        values.password,
      );
      goToStage(router, portal, response, {
        password: values.password,
        extra: { email: values.email.trim(), remember: values.remember },
        next,
      });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <form
      className={framed ? "ui-form auth-card" : "ui-form"}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {notice === "password-reset" && (
        <Alert tone="success">
          Your password was changed. Sign in with the new one.
        </Alert>
      )}
      {notice === "signed-out" && (
        <Alert tone="info">You have signed out.</Alert>
      )}

      <TextField
        label={portal === "parent" ? "Email address" : "Email"}
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder={portal === "parent" ? "Enter your email" : undefined}
        error={errors.email?.message}
        {...register("email", {
          required: "Enter your email address.",
          pattern: EMAIL_PATTERN,
        })}
      />

      <PasswordField
        label={temporary ? "Temporary password" : "Password"}
        autoComplete={temporary ? "one-time-code" : "current-password"}
        placeholder={
          portal === "parent"
            ? temporary
              ? "Enter temporary password"
              : "Enter your password"
            : undefined
        }
        error={errors.password?.message}
        {...register("password", {
          required: temporary
            ? "Enter the temporary password from your email."
            : "Enter your password.",
        })}
      />

      {!temporary && (
        <div className="ui-row-between">
          {showRemember ? (
            <label className="auth-remember">
              <input type="checkbox" {...register("remember")} /> Remember me
            </label>
          ) : (
            <span />
          )}
          <Link
            href={`/${portal}/forgot-password`}
            className={
              portal === "parent"
                ? "auth-forgot auth-forgot--red"
                : "auth-forgot"
            }
          >
            Forgot password?
          </Link>
        </div>
      )}

      {error && <Alert>{error}</Alert>}

      <div className="ui-form__center">
        <Button type="submit" block loading={isSubmitting}>
          {isSubmitting ? "Please wait…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
