"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { LOGIN_ROUTE } from "@/lib/config";
import { authApi } from "../api";
import { errorMessage } from "../error-message";
import { STAGE_ROUTE, startFlow } from "../flow";
import { newPasswordRule, sameAsRule } from "../validation";

interface Values {
  newPassword: string;
  confirmPassword: string;
}

export function AcceptInvitationScreen() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async ({ newPassword }) => {
    setFormError(null);
    try {
      const result = await authApi.acceptInvitation(token, newPassword);

      startFlow("", result, null, null);
      router.replace(STAGE_ROUTE[result.stage]);
    } catch (error) {
      setFormError(errorMessage(error));
    }
  });

  if (!token) {
    return (
      <AuthShell subtitle="You're invited!" role="any">
        <h1 className="heading">This link is incomplete</h1>
        <p className="lead">
          Open the invitation link from your e-mail again, or ask your school
          for a new invitation.
        </p>
        <p className="subtle" style={{ marginTop: 24 }}>
          <Link href={LOGIN_ROUTE} className="link-red">
            Go to sign in
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell subtitle="You're invited!" role="any">
      <h1 className="heading">Welcome</h1>
      <p className="lead">
        Your personal link is active. Create a password to set up your account.
      </p>

      <form onSubmit={onSubmit} noValidate style={{ marginTop: 28 }}>
        <TextField
          label="New password"
          password
          autoComplete="new-password"
          placeholder="Enter new password"
          error={errors.newPassword?.message}
          {...register("newPassword", { validate: newPasswordRule() })}
        />
        <TextField
          label="Confirm password"
          password
          autoComplete="new-password"
          placeholder="Confirm new password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            validate: sameAsRule(() => getValues("newPassword")),
          })}
        />
        <p className="subtle">
          At least 12 characters, with a lowercase letter, an uppercase letter
          and a digit.
        </p>

        {formError && (
          <p className="form-error" role="alert" style={{ marginTop: 12 }}>
            {formError}
          </p>
        )}

        <div className="form-actions" style={{ marginTop: 24 }}>
          <Button type="submit" loading={isSubmitting}>
            Continue
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
