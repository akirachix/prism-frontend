"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";

import { errorMessage } from "@/lib/api";
import {
  authApi,
  clearFlow,
  flowPasswordInMemory,
  PASSWORD_RULES,
  type Portal,
} from "@/lib/auth";
import Button from "../ui/Button";
import { Alert } from "../ui/bits";
import { PasswordField, TextField } from "../ui/Field";
import { useHydrated, useStoredFlow } from "../hooks";
import { goToStage } from "./flow";

interface Values {
  first_name: string;
  last_name: string;
  current_password: string;
  new_password: string;
  confirm_password: string;
}

/**
 * Create a new password. Three ways in:
 * - "change": after signing in with a temporary password
 *   (stage password_change_required → /auth/change-password)
 * - "invite": from the invitation link (?token → /auth/accept-invitation)
 * - "reset": from the forgot-password email (?token → /auth/reset-password)
 */
export default function NewPasswordForm({
  portal,
  mode,
  askName,
  submitLabel = "Save password",
  framed,
}: {
  portal: Portal;
  mode: "change" | "invite" | "reset";
  askName?: boolean;
  submitLabel?: string;
  framed?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const next = params.get("next");
  const hydrated = useHydrated();
  const stored = useStoredFlow();
  const flow =
    stored &&
    stored.portal === portal &&
    stored.stage === "password_change_required"
      ? stored
      : null;
  // After a page refresh the temporary password is gone from memory.
  const needsCurrent = mode === "change" && hydrated && !flowPasswordInMemory();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "change" && hydrated && !flow)
      router.replace(`/${portal}/login`);
  }, [mode, hydrated, flow, portal, router]);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      first_name: "",
      last_name: "",
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const missingToken = (mode === "invite" || mode === "reset") && !token;

  async function onSubmit(values: Values) {
    setError(null);
    const pendingName = askName
      ? {
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
        }
      : undefined;
    try {
      if (mode === "reset") {
        await authApi.resetPassword(token!, values.new_password);
        clearFlow();
        router.replace(`/${portal}/login?notice=password-reset`);
        return;
      }
      if (mode === "invite") {
        const response = await authApi.acceptInvitation(
          token!,
          values.new_password,
        );
        goToStage(router, portal, response, {
          extra: { pending_name: pendingName },
          next,
        });
        return;
      }
      if (!flow) return;
      const current = flowPasswordInMemory() ?? values.current_password;
      const response = await authApi.changePassword(
        flow.step_token,
        current,
        values.new_password,
      );
      goToStage(router, portal, response, {
        password: values.new_password,
        extra: {
          email: flow.email,
          remember: flow.remember,
          pending_name: pendingName,
        },
        next,
      });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (mode === "change" && (!hydrated || !flow)) return null;

  if (missingToken) {
    return (
      <Alert>
        This link is missing its code. Open the link from your email again, or
        ask for a new one.
      </Alert>
    );
  }

  return (
    <form
      className={framed ? "ui-form auth-card auth-card--white" : "ui-form"}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {askName && (
        <>
          <TextField
            label="First name"
            autoComplete="given-name"
            placeholder="Enter your first name"
            error={errors.first_name?.message}
            {...register("first_name", {
              required: "Enter your first name.",
              maxLength: {
                value: 100,
                message: "Use 100 characters or fewer.",
              },
            })}
          />
          <TextField
            label="Last name"
            autoComplete="family-name"
            placeholder="Enter your last name"
            error={errors.last_name?.message}
            {...register("last_name", {
              required: "Enter your last name.",
              maxLength: {
                value: 100,
                message: "Use 100 characters or fewer.",
              },
            })}
          />
        </>
      )}

      {needsCurrent && (
        <PasswordField
          label="Temporary password"
          autoComplete="current-password"
          placeholder="Enter the temporary password"
          error={errors.current_password?.message}
          {...register("current_password", {
            required: "Enter the temporary password from your email.",
          })}
        />
      )}

      <PasswordField
        label="New password"
        autoComplete="new-password"
        placeholder="Enter new password"
        hint="At least 8 characters, with a letter and a number."
        error={errors.new_password?.message}
        {...register("new_password", {
          required: "Enter a new password.",
          ...PASSWORD_RULES,
        })}
      />

      <PasswordField
        label="Confirm password"
        autoComplete="new-password"
        placeholder="Confirm new password"
        error={errors.confirm_password?.message}
        {...register("confirm_password", {
          required: "Type the new password again.",
          validate: (value) =>
            value === getValues("new_password") ||
            "The two passwords do not match.",
        })}
      />

      {error && <Alert>{error}</Alert>}

      <div className={framed ? "ui-form__center" : "ui-form__end"}>
        <Button type="submit" loading={isSubmitting} block={framed}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
