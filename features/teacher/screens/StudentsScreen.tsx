"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ErrorMessage, Loading } from "@/components/ui/StateMessage";
import { TextField } from "@/components/ui/TextField";
import { useAsync } from "@/lib/use-async";
import { teacherApi } from "../api";
import type { NewStudentPayload } from "../types";
import styles from "./StudentsScreen.module.css";

type Filter = "all" | "attention" | "active";

const statusClass = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("attention")) return styles.statusAttention;
  if (s.includes("active")) return styles.statusActive;
  if (s.includes("waiting")) return styles.statusWaiting;
  return "";
};

export function StudentsScreen() {
  const { data, error, loading, reload } = useAsync(teacherApi.students);
  const students = data?.students;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewStudentPayload>({
    defaultValues: {
      name: "",
      admissionNumber: "",
      className: "",
      dateOfBirth: "",
    },
  });

  const rows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return (students ?? []).filter((s) => {
      if (
        filter === "attention" &&
        !s.status.toLowerCase().includes("attention")
      )
        return false;
      if (filter === "active" && !s.status.toLowerCase().includes("active"))
        return false;
      return (
        !text ||
        s.name.toLowerCase().includes(text) ||
        (s.admissionNumber ?? "").toLowerCase().includes(text)
      );
    });
  }, [students, query, filter]);

  const countOf = (f: Filter) =>
    (students ?? []).filter((s) =>
      f === "all"
        ? true
        : s.status
            .toLowerCase()
            .includes(f === "attention" ? "attention" : "active"),
    ).length;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await teacherApi.addStudent(values);
      setAdding(false);
      reset();
      reload();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not add the student.",
      );
    }
  });

  const chips: Array<{ id: Filter; label: string }> = [
    { id: "all", label: `All (${countOf("all")})` },
    { id: "attention", label: `Needs attention (${countOf("attention")})` },
    { id: "active", label: `Active IEP (${countOf("active")})` },
  ];

  return (
    <>
      <PageHeader title="Students" />
      <div className={`page-body ${styles.body}`}>
        <h2 className="greeting" style={{ fontSize: 20 }}>
          Your class
        </h2>

        {data?.namesPending && (
          <p className="subtle" role="note">
            Student names and admission numbers will appear here once the
            backend has a students endpoint. For now each row is a student from
            your cases.
          </p>
        )}

        <div className={styles.toolbar}>
          <input
            className={styles.search}
            type="search"
            placeholder="Search by name or admission number"
            aria-label="Search students"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div
            className={styles.chips}
            role="group"
            aria-label="Filter students"
          >
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={`${styles.chip} ${filter === chip.id ? styles.chipActive : ""}`}
                aria-pressed={filter === chip.id}
                onClick={() => setFilter(chip.id)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <Loading text="Loading students…" />}
        {error && <ErrorMessage message={error} onRetry={reload} />}

        {students && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th className={styles.hideOnMobile}>Admission number</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="subtle">
                    No students match.
                  </td>
                </tr>
              )}
              {rows.map((student) => (
                <tr key={student.id}>
                  <td className={styles.name}>{student.name}</td>
                  <td className={styles.hideOnMobile}>
                    {student.admissionNumber ?? "—"}
                  </td>
                  <td>
                    <span
                      className={`${styles.status} ${statusClass(student.status)}`}
                    >
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {adding && (
          <form
            className={`card ${styles.form}`}
            onSubmit={onSubmit}
            noValidate
          >
            <div className={styles.formGrid}>
              <TextField
                label="Student name"
                placeholder="Full name"
                error={errors.name?.message}
                {...register("name", {
                  validate: (v) =>
                    v.trim() !== "" || "Enter the student's name.",
                })}
              />
              <TextField
                label="Admission number"
                placeholder="e.g. ADM-0042"
                error={errors.admissionNumber?.message}
                {...register("admissionNumber", {
                  validate: (v) =>
                    v.trim() !== "" || "Enter the admission number.",
                })}
              />
              <TextField
                label="Class"
                placeholder="e.g. Grade 2"
                {...register("className")}
              />
              <TextField
                label="Date of birth"
                type="date"
                {...register("dateOfBirth")}
              />
            </div>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <div className={styles.formActions}>
              <Button type="submit" loading={isSubmitting}>
                Save student
              </Button>
              <Button variant="outline" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className={styles.footer}>
          <p className={styles.count}>
            {students
              ? `You are viewing ${rows.length} of ${students.length}`
              : ""}
          </p>
          {!adding && (
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setAdding(true)}
            >
              + Add a student
            </button>
          )}
        </div>
      </div>
    </>
  );
}
