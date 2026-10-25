"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { errorMessage } from "@/lib/api";
import {
  ageInYears,
  birthDateLimits,
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

interface FormState {
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

const EMPTY: FormState = {
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

/** What is wrong with the form, or null when it can be sent. */
export function formProblem(form: FormState, now = new Date()): string | null {
  const required = [
    form.first_name,
    form.last_name,
    form.admission_number,
    form.date_of_birth,
    form.gender,
    form.parent_first_name,
    form.parent_last_name,
    form.parent_email,
  ];
  if (required.some((value) => !value.trim())) {
    return "Please fill in the student's details and the parent's name and email.";
  }
  if (!isEligibleAge(form.date_of_birth, now)) {
    const age = ageInYears(form.date_of_birth, now);
    const range = `${MIN_STUDENT_AGE} to ${MAX_STUDENT_AGE}`;
    return age === null
      ? `Only children aged ${range} can be added.`
      : `Only children aged ${range} can be added. This child is ${age}.`;
  }
  if (!EMAIL.test(form.parent_email.trim())) {
    return "Enter a valid email address for the parent.";
  }
  return null;
}

/**
 * Add a student and their parent. The parent is emailed an invitation link
 * as soon as the student is saved; it can be sent again from here.
 */
export default function AddStudentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (created: Student) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Student | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const limits = useMemo(() => birthDateLimits(), []);
  const age = ageInYears(form.date_of_birth);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const problem = formProblem(form);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const student = await studentsApi.create({
        admission_number: form.admission_number.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        date_of_birth: form.date_of_birth,
        gender: form.gender as "MALE" | "FEMALE",
        parent: {
          first_name: form.parent_first_name.trim(),
          last_name: form.parent_last_name.trim(),
          email: form.parent_email.trim(),
          phone: form.parent_phone.trim() || null,
        },
      });
      setCreated(student);
      onCreated(student);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
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
              We emailed an invitation link to {form.parent_email.trim()} so the
              parent can set up their account.
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
            onSubmit={handleSubmit}
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
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="close-form__label" htmlFor="student-last">
                  Last name
                </label>
                <input
                  id="student-last"
                  className="close-form__field"
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>

            <label className="close-form__label" htmlFor="student-admission">
              Admission number
            </label>
            <input
              id="student-admission"
              className="close-form__field"
              value={form.admission_number}
              onChange={(e) => set("admission_number", e.target.value)}
              autoComplete="off"
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
                  value={form.date_of_birth}
                  onChange={(e) => set("date_of_birth", e.target.value)}
                  aria-describedby="student-dob-hint"
                />
                <p
                  id="student-dob-hint"
                  className={
                    age !== null && !isEligibleAge(form.date_of_birth)
                      ? "add-student__hint add-student__hint--bad"
                      : "add-student__hint"
                  }
                >
                  {age === null
                    ? `Pick from the calendar. Children aged ${MIN_STUDENT_AGE}–${MAX_STUDENT_AGE}.`
                    : isEligibleAge(form.date_of_birth)
                      ? `Age ${age}`
                      : `Age ${age}: not eligible (${MIN_STUDENT_AGE}–${MAX_STUDENT_AGE} only)`}
                </p>
              </div>
              <div>
                <label className="close-form__label" htmlFor="student-gender">
                  Gender
                </label>
                <select
                  id="student-gender"
                  className="close-form__field"
                  value={form.gender}
                  onChange={(e) =>
                    set("gender", e.target.value as FormState["gender"])
                  }
                >
                  <option value="">Choose</option>
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                </select>
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
                  value={form.parent_first_name}
                  onChange={(e) => set("parent_first_name", e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="close-form__label" htmlFor="parent-last">
                  Last name
                </label>
                <input
                  id="parent-last"
                  className="close-form__field"
                  value={form.parent_last_name}
                  onChange={(e) => set("parent_last_name", e.target.value)}
                  autoComplete="off"
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
                  value={form.parent_email}
                  onChange={(e) => set("parent_email", e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="close-form__label" htmlFor="parent-phone">
                  Phone
                </label>
                <input
                  id="parent-phone"
                  type="tel"
                  className="close-form__field"
                  value={form.parent_phone}
                  onChange={(e) => set("parent_phone", e.target.value)}
                  autoComplete="off"
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
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="close-form__close"
                disabled={saving}
              >
                {saving ? "Adding…" : "Add student"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
