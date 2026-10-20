"use client";

import { useEffect, useState, type FormEvent } from "react";

import { ApiError } from "@/lib/api";
import { casesApi } from "@/lib/cases";
import { getStudents, studentName, type Student } from "@/lib/lookups";
import type { Case } from "@/lib/types";
import "./case-detail-modal.css";
import "./close-case-form.css";

export default function StartCaseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (created: Case) => void;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStudents()
      .then(setStudents)
      .catch(() => setError("Could not load the students. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const student = students.find((item) => item.student_id === studentId);
    if (!student) {
      setError("Please choose a student.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      onCreated(
        await casesApi.create({
          school_id: student.school_id,
          student_id: student.student_id,
          initiated_by: student.teacher_id,
        }),
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="case-modal__backdrop" onClick={onClose}>
      <div
        className="case-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-case-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="case-modal__header">
          <h2 id="start-case-title" className="case-modal__title">
            Start a case
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

        <form className="close-form" onSubmit={handleSubmit}>
          <label className="close-form__label" htmlFor="start-student">
            Student
          </label>
          <select
            id="start-student"
            className="close-form__field"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            disabled={loading || students.length === 0}
          >
            <option value="">
              {loading ? "Loading students…" : "Choose a student"}
            </option>
            {students.map((student) => (
              <option key={student.student_id} value={student.student_id}>
                {studentName(student)} ({student.admission_number})
              </option>
            ))}
          </select>

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
              {saving ? "Starting…" : "Start case"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
