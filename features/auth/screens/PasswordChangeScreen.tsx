"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { authApi } from "../api";
import { errorMessage, isStepExpired } from "../error-message";
import { STAGE_ROUTE, advanceFlow, clearFlow } from "../flow";
import { loginRouteFor } from "../roles";
import { useStepFlow } from "../use-step-flow";
import { newPasswordRule, requiredRule, sameAsRule } from "../validation";

interface Values {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Stage "password_change_required": the account still has the temporary
 * password it was created with. POST /auth/change-password, then the backend
 * names the next step (authenticator setup or code).
 */
export function PasswordChangeScreen() {
  const router = useRouter();
  const flow = useStepFlow("password_change_required");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });

  if (!flow) return null;

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setFormError(null);
    try {
      const result = await authApi.changePassword({
        stepToken: flow.stepToken,
        currentPassword,
        newPassword,
      });
      advanceFlow(result);
      router.replace(STAGE_ROUTE[result.stage]);
    } catch (error) {
      if (isStepExpired(error)) {
        clearFlow();
        router.replace(`${loginRouteFor(flow.portal)}?reason=step`);
        return;
      }
      setFormError(errorMessage(error));
    }
  });

  return (
    <AuthShell subtitle="Create a new password" role={flow.portal ?? "any"}>
      <h1 className="heading">Create a new password</h1>
      <p className="lead">Your account still uses a temporary password. Choose a new one to continue.</p>

      <form onSubmit={onSubmit} noValidate style={{ marginTop: 28 }}>
        <TextField
          label="Temporary password"
          password
          autoComplete="current-password"
          placeholder="Enter your temporary password"
          error={errors.currentPassword?.message}
          {...register("currentPassword", { validate: requiredRule("Temporary password") })}
        />
        <TextField
          label="New password"
          password
          autoComplete="new-password"
          placeholder="Enter new password"
          error={errors.newPassword?.message}
          {...register("newPassword", { validate: newPasswordRule(flow.email) })}
        />
        <TextField
          label="Confirm password"
          password
          autoComplete="new-password"
          placeholder="Confirm new password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", { validate: sameAsRule(() => getValues("newPassword")) })}
        />

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}

        <div className="form-actions" style={{ marginTop: 24 }}>
          <Button type="submit" loading={isSubmitting}>
            Update password
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
