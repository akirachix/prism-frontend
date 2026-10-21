"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useSession, useUser } from "../SessionProvider";
import Button, { ButtonLink } from "../ui/Button";
import { Alert, PageHeader } from "../ui/bits";
import { TextField } from "../ui/Field";
import { errorMessage } from "@/lib/api";
import { usersApi } from "@/lib/users";
import "../portal.css";
import "./account.css";

interface Values {
  first_name: string;
  last_name: string;
  phone: string;
}

export default function EditProfileForm({
  portal,
}: {
  portal: "teacher" | "parent";
}) {
  const user = useUser();
  const { setUser } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const back = `/${portal}/account`;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone ?? "",
    },
  });

  async function onSubmit(values: Values) {
    setError(null);
    try {
      const updated = await usersApi.update(user.user_id, {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        phone: values.phone.trim() || null,
      });
      setUser(updated);
      router.push(back);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <main className="ui-page">
      <PageHeader
        title="Edit profile"
        back={{ href: back, label: "Back to account" }}
      />
      <div className="ui-body ui-body--narrow">
        <form
          className="ui-form ui-card"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <TextField
            label="First name"
            autoComplete="given-name"
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
            error={errors.last_name?.message}
            {...register("last_name", {
              required: "Enter your last name.",
              maxLength: {
                value: 100,
                message: "Use 100 characters or fewer.",
              },
            })}
          />
          <TextField
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            optional
            error={errors.phone?.message}
            {...register("phone", {
              maxLength: { value: 30, message: "Use 30 characters or fewer." },
              pattern: {
                value: /^\+?[\d\s-]{7,}$/,
                message: "Enter a valid phone number.",
              },
            })}
          />
          <p className="ui-field__hint">
            To change your email, ask your school administrator.
          </p>
          {error && <Alert>{error}</Alert>}
          <div className="ui-actions ui-actions--end">
            <ButtonLink href={back} variant="outline">
              Cancel
            </ButtonLink>
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
