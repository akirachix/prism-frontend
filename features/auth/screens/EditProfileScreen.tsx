"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/StateMessage";
import { TextField } from "@/components/ui/TextField";
import { authApi } from "../api";
import { errorMessage } from "../error-message";
import { portalForRole } from "../roles";
import { saveUser, useSession } from "../session";
import type { AuthUser } from "../types";
import { requiredRule } from "../validation";

interface Values {
  firstName: string;
  lastName: string;
  phone: string;
}

/** /edit-profile - PATCH /users/{id}: a person may change their own name and phone. */
export function EditProfileScreen() {
  const { user } = useSession();
  // The form's default values come from the user, so wait until it is known.
  return user ? <EditProfileForm user={user} /> : <Loading />;
}

function EditProfileForm({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      saveUser(await authApi.updateProfile(user.id, values));
      router.back();
    } catch (error) {
      setFormError(errorMessage(error));
    }
  });

  return (
    <AuthShell subtitle="Edit profile" role={portalForRole(user.role)}>
      <div style={{ maxWidth: 440, margin: "0 auto", width: "100%" }}>
        <h1 className="heading" style={{ fontSize: 24, marginBottom: 10 }}>
          Edit profile
        </h1>
        <p className="lead" style={{ marginBottom: 20 }}>
          Your email address can only be changed by your school.
        </p>

        <form onSubmit={onSubmit} noValidate>
          <TextField
            label="First name"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register("firstName", { validate: requiredRule("First name") })}
          />
          <TextField
            label="Last name"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register("lastName", { validate: requiredRule("Last name") })}
          />
          <TextField label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} {...register("phone")} />

          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}

          <div className="form-actions" style={{ marginTop: 16 }}>
            <Button type="submit" loading={isSubmitting}>
              Save
            </Button>
            <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
