"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { useUser } from "@/app/_components/SessionProvider";
import Button from "@/app/_components/ui/Button";
import { Alert, Note, PageHeader } from "@/app/_components/ui/bits";
import { SelectField, TextField } from "@/app/_components/ui/Field";
import { ApiError, errorMessage } from "@/lib/api";
import { EMAIL_PATTERN } from "@/lib/auth";
import { casesApi } from "@/lib/cases";
import { ageInYears, studentsApi } from "@/lib/lookups";
import { usersApi, type UserRead } from "@/lib/users";
import "@/app/_components/portal.css";
import "./add-student.css";

interface Values {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  admission_number: string;
  parent_first_name: string;
  parent_last_name: string;
  email: string;
  phone: string;
}

const MIN_AGE = 4;
const MAX_AGE = 9;

const name = (label: string) => ({
  required: `Enter the ${label}.`,
  maxLength: { value: 100, message: "Use 100 characters or fewer." },
});

/** Find the parent if the school already has an account for this email. */
async function existingParent(email: string): Promise<UserRead | null> {
  const users = await usersApi.list(200);
  return (
    users.find(
      (user) =>
        user.role === "PARENT" &&
        user.email.toLowerCase() === email.toLowerCase(),
    ) ?? null
  );
}

export default function AddStudentForm() {
  const user = useUser();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);
  // Remember what was already created, so pressing Save again after an
  // error does not create the parent or student twice.
  const created = useRef<{ parentId?: string; studentId?: string }>({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      first_name: "",
      last_name: "",
      date_of_birth: "",
      gender: "",
      admission_number: "",
      parent_first_name: "",
      parent_last_name: "",
      email: "",
      phone: "",
    },
  });

  async function onSubmit(values: Values) {
    setError(null);
    if (!user.school_id) {
      setError(
        "Your account is not linked to a school yet. Ask your school administrator.",
      );
      return;
    }
    try {
      if (!created.current.parentId) {
        setStep("Creating the parent account…");
        const email = values.email.trim();
        let parent: UserRead | null = null;
        try {
          parent = await usersApi.create({
            first_name: values.parent_first_name.trim(),
            last_name: values.parent_last_name.trim(),
            email,
            phone: values.phone.trim() || null,
            role: "PARENT",
            school_id: user.school_id,
          });
        } catch (err) {
          if (
            err instanceof ApiError &&
            (err.status === 409 || err.status === 400)
          ) {
            parent = await existingParent(email);
          }
          if (!parent) throw err;
        }
        created.current.parentId = parent.user_id;
      }

      if (!created.current.studentId) {
        setStep("Adding the student…");
        const student = await studentsApi.create({
          school_id: user.school_id,
          teacher_id: user.user_id,
          parent_id: created.current.parentId,
          admission_number: values.admission_number.trim(),
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          date_of_birth: values.date_of_birth,
          gender: values.gender,
        });
        created.current.studentId = student.student_id;
      }

      setStep("Starting the case…");
      await casesApi.create({
        school_id: user.school_id,
        student_id: created.current.studentId,
        initiated_by: user.user_id,
      });
      router.push(`/teacher/students/${created.current.studentId}`);
    } catch (err) {
      setStep(null);
      setError(errorMessage(err));
    }
  }

  return (
    <main className="ui-page">
      <PageHeader
        title="Add a student"
        back={{ href: "/teacher/students", label: "Back to students" }}
      />
      <div className="ui-body ui-body--narrow ui-body--center">
        <form
          className="ui-form add-student"
          // eslint-disable-next-line react-hooks/refs
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <fieldset className="add-student__group">
            <legend className="add-student__legend">Student</legend>
            <div className="ui-form__row">
              <TextField
                label="Student’s first name"
                autoComplete="off"
                error={errors.first_name?.message}
                {...register("first_name", name("student’s first name"))}
              />
              <TextField
                label="Student’s last name"
                autoComplete="off"
                error={errors.last_name?.message}
                {...register("last_name", name("student’s last name"))}
              />
            </div>
            <div className="ui-form__row">
              <TextField
                label="Date of birth"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                error={errors.date_of_birth?.message}
                {...register("date_of_birth", {
                  required: "Enter the date of birth.",
                  validate: (value) => {
                    const age = ageInYears(value);
                    if (age === null) return "Enter a valid date.";
                    if (age < MIN_AGE || age > MAX_AGE) {
                      return `Mirai’s screening is for children aged ${MIN_AGE} to ${MAX_AGE}.`;
                    }
                    return true;
                  },
                })}
              />
              <SelectField
                label="Gender"
                error={errors.gender?.message}
                {...register("gender", { required: "Choose an option." })}
              >
                <option value="">Select</option>
                <option value="FEMALE">Girl</option>
                <option value="MALE">Boy</option>
              </SelectField>
            </div>
            <TextField
              label="Admission number"
              autoComplete="off"
              error={errors.admission_number?.message}
              {...register("admission_number", {
                required: "Enter the admission number.",
                maxLength: {
                  value: 40,
                  message: "Use 40 characters or fewer.",
                },
              })}
            />
          </fieldset>

          <fieldset className="add-student__group">
            <legend className="add-student__legend">Parent or guardian</legend>
            <div className="ui-form__row">
              <TextField
                label="Parent’s first name"
                autoComplete="off"
                error={errors.parent_first_name?.message}
                {...register("parent_first_name", name("parent’s first name"))}
              />
              <TextField
                label="Parent’s last name"
                autoComplete="off"
                error={errors.parent_last_name?.message}
                {...register("parent_last_name", name("parent’s last name"))}
              />
            </div>
            <TextField
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="off"
              error={errors.email?.message}
              {...register("email", {
                required: "Enter the parent’s email.",
                pattern: EMAIL_PATTERN,
              })}
            />
            <TextField
              label="Phone number"
              type="tel"
              inputMode="tel"
              placeholder="+254 700 000 000"
              optional
              error={errors.phone?.message}
              {...register("phone", {
                maxLength: {
                  value: 30,
                  message: "Use 30 characters or fewer.",
                },
                pattern: {
                  value: /^\+?[\d\s-]{7,}$/,
                  message: "Enter a valid phone number.",
                },
              })}
            />
          </fieldset>

          <Note>
            The parent will receive a temporary password, which they should
            change to proceed.
          </Note>

          {error && <Alert>{error}</Alert>}

          <div className="add-student__actions">
            <Button type="submit" loading={isSubmitting} block>
              {step ?? "Save and start a case"}
            </Button>
            <Link href="/teacher/students" className="add-student__cancel">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
