import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { errorMessage } from "@/lib/api";
import {
  ageInYears,
  birthDateLimits,
  birthDateProblem,
  isEligibleAge,
  MAX_STUDENT_AGE,
  MIN_STUDENT_AGE,
  studentName,
  studentsApi,
  type Student,
} from "@/lib/lookups";
import "../cases/case-detail-modal.css";
import "../cases/close-case-form.css";
import "./add-student-modal.css";

export interface AddStudentValues {
  first_name: string;
  last_name: string;
  admission_number: string;
  date_of_birth: string;
  gender: "" | "MALE" | "FEMALE";
  parent_first_name: string;
  parent_last_name: string;
  parent_email: string;
  parent_phone: string;
}

const EMPTY: AddStudentValues = {
  first_name: "",
  last_name: "",
  admission_number: "",
  date_of_birth: "",
  gender: "",
  parent_first_name: "",
  parent_last_name: "",
  parent_email: "",
  parent_phone: "",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldRule {
  required?: string;
  validate?: (value: string) => true | string;
}

function required(message: string): FieldRule {
  return { validate: (value) => value.trim() !== "" || message };
}

const RULES: Record<keyof AddStudentValues, FieldRule> = {
  first_name: required("Enter the student's first name."),
  last_name: required("Enter the student's last name."),
  admission_number: required("Enter the admission number."),
  date_of_birth: { validate: (value) => birthDateProblem(value) ?? true },
  gender: { required: "Choose the student's gender." },
  parent_first_name: required("Enter the parent's first name."),
  parent_last_name: required("Enter the parent's last name."),
  parent_email: {
    validate: (value) => {
      const email = value.trim();
      if (!email) return "Enter the parent's email.";
      return EMAIL.test(email) || "Enter a valid email address.";
    },
  },
  parent_phone: {},
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="add-student__error" role="alert">
      {message}
    </p>
  );
}

export default function AddStudentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (created: Student) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<AddStudentValues>({ defaultValues: EMPTY, mode: "onChange" });

  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Student | null>(null);

  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const limits = useMemo(() => birthDateLimits(), []);
  const dateOfBirth = useWatch({
    control,
    name: "date_of_birth",
  });
  const age = ageInYears(dateOfBirth);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function field(name: keyof AddStudentValues) {
    const invalid = Boolean(errors[name]);
    return {
      ...register(name, RULES[name]),
      "aria-invalid": invalid || undefined,
      "aria-describedby": invalid ? `${name}-error` : undefined,
    };
  }

  async function onSubmit(values: AddStudentValues) {
    setError(null);
    try {
      const student = await studentsApi.create({
        admission_number: values.admission_number.trim(),
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        date_of_birth: values.date_of_birth,
        gender: values.gender as "MALE" | "FEMALE",
        parent: {
          first_name: values.parent_first_name.trim(),
          last_name: values.parent_last_name.trim(),
          email: values.parent_email.trim(),
          phone: values.parent_phone.trim() || null,
        },
      });
      setCreated(student);
      onCreated(student);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function resendInvitation() {
    if (!created) return;
    setResending(true);
    setResendMessage(null);
    try {
      const result = await studentsApi.resendParentInvitation(
        created.student_id,
      );
      setResendMessage(
        `The invitation was sent again. ${result.resends_left} of ${result.max_resends} resends left.`,
      );
    } catch (err) {
      setResendMessage(errorMessage(err));
    } finally {
      setResending(false);
    }
  }

  const dobHint =
    age === null
      ? `Pick from the calendar. Children aged ${MIN_STUDENT_AGE}–${MAX_STUDENT_AGE}.`
      : isEligibleAge(dateOfBirth)
        ? `Age ${age}`
        : `Age ${age}: not eligible (${MIN_STUDENT_AGE}–${MAX_STUDENT_AGE} only)`;

  return (
    <div
      className="case-modal__backdrop add-student__backdrop"
      onClick={onClose}
    >
      <div
        className="case-modal add-student"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-student-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="case-modal__header">
          <h2 id="add-student-title" className="case-modal__title">
            Add a student
          </h2>
          <button
            type="button"
            className="case-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        {created ? (
          <div className="add-student__done">
            <p className="add-student__ok">{studentName(created)} was added.</p>
            <p>
              We emailed an invitation link to{" "}
              {getValues("parent_email").trim()} so the parent can set up their
              account.
            </p>
            {resendMessage && (
              <p className="add-student__hint" aria-live="polite">
                {resendMessage}
              </p>
            )}
            <div className="close-form__actions">
              <button
                type="button"
                className="close-form__keep"
                onClick={resendInvitation}
                disabled={resending}
              >
                {resending ? "Sending…" : "Resend invitation"}
              </button>
              <button
                type="button"
                className="close-form__close"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form
            className="close-form add-student__body"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="add-student__row">
              <div>
                <label className="close-form__label" htmlFor="student-first">
                  First name
                </label>
                <input
                  id="student-first"
                  className="close-form__field"
                  autoComplete="off"
                  {...field("first_name")}
                />
                <FieldError
                  id="first_name-error"
                  message={errors.first_name?.message}
                />
              </div>
              <div>
                <label className="close-form__label" htmlFor="student-last">
                  Last name
                </label>
                <input
                  id="student-last"
                  className="close-form__field"
                  autoComplete="off"
                  {...field("last_name")}
                />
                <FieldError
                  id="last_name-error"
                  message={errors.last_name?.message}
                />
              </div>
            </div>

            <label className="close-form__label" htmlFor="student-admission">
              Admission number
            </label>
            <input
              id="student-admission"
              className="close-form__field"
              autoComplete="off"
              {...field("admission_number")}
            />
            <FieldError
              id="admission_number-error"
              message={errors.admission_number?.message}
            />

            <div className="add-student__row">
              <div>
                <label className="close-form__label" htmlFor="student-dob">
                  Date of birth
                </label>
                <input
                  id="student-dob"
                  type="date"
                  min={limits.min}
                  max={limits.max}
                  className="close-form__field"
                  {...register("date_of_birth", RULES.date_of_birth)}
                  aria-invalid={Boolean(errors.date_of_birth) || undefined}
                  aria-describedby={
                    errors.date_of_birth
                      ? "student-dob-hint date_of_birth-error"
                      : "student-dob-hint"
                  }
                />
                <p
                  id="student-dob-hint"
                  className={
                    age !== null && !isEligibleAge(dateOfBirth)
                      ? "add-student__hint add-student__hint--bad"
                      : "add-student__hint"
                  }
                >
                  {dobHint}
                </p>
                <FieldError
                  id="date_of_birth-error"
                  message={errors.date_of_birth?.message}
                />
              </div>
              <div>
                <label className="close-form__label" htmlFor="student-gender">
                  Gender
                </label>
                <select
                  id="student-gender"
                  className="close-form__field"
                  {...field("gender")}
                >
                  <option value="">Choose</option>
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                </select>
                <FieldError
                  id="gender-error"
                  message={errors.gender?.message}
                />
              </div>
            </div>

            <h3 className="add-student__group">Parent or guardian</h3>
            <p className="add-student__hint">
              We email them an invitation link to join Mirai.
            </p>

            <div className="add-student__row">
              <div>
                <label className="close-form__label" htmlFor="parent-first">
                  First name
                </label>
                <input
                  id="parent-first"
                  className="close-form__field"
                  autoComplete="off"
                  {...field("parent_first_name")}
                />
                <FieldError
                  id="parent_first_name-error"
                  message={errors.parent_first_name?.message}
                />
              </div>
              <div>
                <label className="close-form__label" htmlFor="parent-last">
                  Last name
                </label>
                <input
                  id="parent-last"
                  className="close-form__field"
                  autoComplete="off"
                  {...field("parent_last_name")}
                />
                <FieldError
                  id="parent_last_name-error"
                  message={errors.parent_last_name?.message}
                />
              </div>
            </div>

            <div className="add-student__row">
              <div>
                <label className="close-form__label" htmlFor="parent-email">
                  Email
                </label>
                <input
                  id="parent-email"
                  type="email"
                  className="close-form__field"
                  autoComplete="off"
                  {...field("parent_email")}
                />
                <FieldError
                  id="parent_email-error"
                  message={errors.parent_email?.message}
                />
              </div>
              <div>
                <label className="close-form__label" htmlFor="parent-phone">
                  Phone (optional)
                </label>
                <input
                  id="parent-phone"
                  type="tel"
                  className="close-form__field"
                  autoComplete="off"
                  {...field("parent_phone")}
                />
              </div>
            </div>

            {error && (
              <p className="close-form__error" role="alert">
                {error}
              </p>
            )}

            <div className="close-form__actions">
              <button
                type="button"
                className="close-form__keep"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="close-form__close"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding…" : "Add student"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
