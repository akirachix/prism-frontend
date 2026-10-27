import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import Button from "@/_components/ui/Button";
import { Alert } from "@/_components/ui/bits";
import { PasswordField, TextField } from "@/_components/ui/Field";
import { errorMessage } from "@/lib/api";
import { PASSWORD_RULES } from "@/lib/auth";
import {
  CONSENT_KEYS,
  consentText,
  parentInvitationApi,
  type ConsentKey,
  type ParentInvitation,
} from "@/lib/parent-invitation";

interface Values {
  first_name: string;
  last_name: string;
  new_password: string;
  confirm_password: string;
  consent: Record<ConsentKey, boolean>;
}

const PARENT_PASSWORD_RULES = {
  ...PASSWORD_RULES,
  maxLength: { value: 128, message: "Use 128 characters or fewer." },
};

export default function InviteAcceptFields({
  token,
  email,
  invitation,
}: {
  token: string;
  email: string;
  invitation: ParentInvitation;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      first_name: invitation.parent_first_name,
      last_name: "",
      new_password: "",
      confirm_password: "",
      consent: { screening: false, data_use: false, not_diagnostic: false },
    },
  });

  async function onSubmit(values: Values) {
    setError(null);
    try {
      await parentInvitationApi.accept({
        token,
        email,
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        new_password: values.new_password,
        consent: values.consent,
      });
      router.replace("/parent/login?notice=invite-accepted");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <form className="ui-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <TextField label="Email address" value={email} readOnly />

      <TextField
        label="First name"
        autoComplete="given-name"
        placeholder="Enter your first name"
        error={errors.first_name?.message}
        {...register("first_name", {
          validate: (value) => value.trim() !== "" || "Enter your first name.",
          maxLength: { value: 100, message: "Use 100 characters or fewer." },
        })}
      />
      <TextField
        label="Last name"
        autoComplete="family-name"
        placeholder="Enter your last name"
        error={errors.last_name?.message}
        {...register("last_name", {
          validate: (value) => value.trim() !== "" || "Enter your last name.",
          maxLength: { value: 100, message: "Use 100 characters or fewer." },
        })}
      />

      <PasswordField
        label="New password"
        autoComplete="new-password"
        placeholder="Enter new password"
        hint="At least 8 characters, with a letter and a number."
        error={errors.new_password?.message}
        {...register("new_password", {
          required: "Enter a new password.",
          ...PARENT_PASSWORD_RULES,
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

      <fieldset className="auth-consent">
        <legend className="ui-field__label">Your consent</legend>
        {CONSENT_KEYS.map((key) => (
          <div key={key}>
            <label className="auth-consent__item">
              <input
                type="checkbox"
                aria-invalid={errors.consent?.[key] ? true : undefined}
                {...register(`consent.${key}`, {
                  validate: (value) => value || "Tick this box to continue.",
                })}
              />
              <span>{consentText(invitation, key)}</span>
            </label>
            {errors.consent?.[key] && (
              <p className="ui-field__error" role="alert">
                {errors.consent[key]?.message}
              </p>
            )}
          </div>
        ))}
      </fieldset>

      {error && <Alert>{error}</Alert>}

      <div className="ui-form__end">
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? "Saving…" : "Update profile"}
        </Button>
      </div>
    </form>
  );
}
