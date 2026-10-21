"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { authApi } from "../api";
import { errorMessage } from "../error-message";
import { portalForRole } from "../roles";
import { useSession } from "../session";
import { newPasswordRule, requiredRule, sameAsRule } from "../validation";

interface Values {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function ChangePasswordScreen() {
  const router = useRouter();
  const { user } = useSession();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setFormError(null);
    try {
      await authApi.changePasswordSignedIn({ currentPassword, newPassword });
      router.back();
    } catch (error) {
      setFormError(errorMessage(error));
    }
  });

  return (
    <AuthShell subtitle="Change password" role={portalForRole(user?.role)}>
      <div style={{ maxWidth: 440, margin: "0 auto", width: "100%" }}>
        <h1 className="heading" style={{ fontSize: 24, marginBottom: 10 }}>
          Change password
        </h1>
        <p className="lead" style={{ marginBottom: 20 }}>
          Update the password for your Mirai account.
        </p>

        <form onSubmit={onSubmit} noValidate>
          <TextField
            label="Current password"
            password
            autoComplete="current-password"
            placeholder="Enter current password"
            error={errors.currentPassword?.message}
            {...register("currentPassword", {
              validate: requiredRule("Current password"),
            })}
          />
          <TextField
            label="New password"
            password
            autoComplete="new-password"
            placeholder="Enter new password"
            error={errors.newPassword?.message}
            {...register("newPassword", {
              validate: newPasswordRule(user?.email),
            })}
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

          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}

          <div className="form-actions" style={{ marginTop: 16 }}>
            <Button type="submit" loading={isSubmitting}>
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
