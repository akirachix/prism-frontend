import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import Button from "@/_components/ui/Button";
import { Alert } from "@/_components/ui/bits";
import { TextField } from "@/_components/ui/Field";
import { errorMessage } from "@/lib/api";
import { EMAIL_PATTERN } from "@/lib/auth";
import {
  invitationStepHref,
  parentInvitationApi,
} from "@/lib/parent-invitation";

export default function InviteEmailForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({ defaultValues: { email: "" } });

  async function onSubmit({ email }: { email: string }) {
    setError(null);
    const address = email.trim();
    try {
      await parentInvitationApi.verifyEmail(token, address);
      router.push(invitationStepHref("set-password", token, address));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <form className="ui-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <TextField
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="Enter the email the school invited"
        error={errors.email?.message}
        {...register("email", {
          required: "Enter your email address.",
          pattern: EMAIL_PATTERN,
        })}
      />
      {error && <Alert>{error}</Alert>}
      <Button type="submit" loading={isSubmitting} block>
        {isSubmitting ? "Checking…" : "Continue"}
      </Button>
    </form>
  );
}
