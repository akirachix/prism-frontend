"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { errorMessage } from "@/lib/api";
import { authApi, EMAIL_PATTERN, type Portal } from "@/lib/auth";
import Button from "../ui/Button";
import { Alert } from "../ui/bits";
import { TextField } from "../ui/Field";

export default function ForgotForm({
  portal,
  defaultEmail = "",
  framed = true,
}: {
  portal: Portal;
  defaultEmail?: string;
  framed?: boolean;
}) {
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({ defaultValues: { email: defaultEmail } });

  async function onSubmit({ email }: { email: string }) {
    setError(null);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(email.trim());
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (sent) {
    return (
      <div className="ui-form">
        <Alert tone="success">
          If {sent} has a Mirai account, we have sent it a link to set a new
          password. The link works for a short time.
        </Alert>
        <Link href={`/${portal}/login`} className="auth-back-link">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      className={framed ? "ui-form auth-card" : "ui-form"}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errors.email?.message}
        {...register("email", {
          required: "Enter your email address.",
          pattern: EMAIL_PATTERN,
        })}
      />
      {error && <Alert>{error}</Alert>}
      <Button type="submit" block loading={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send me a link"}
      </Button>
      <Link href={`/${portal}/login`} className="auth-back-link">
        Back to sign in
      </Link>
    </form>
  );
}
