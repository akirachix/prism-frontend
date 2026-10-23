"use client";

import { useState, type FormEvent } from "react";

import { ApiError } from "@/lib/api";
import { casesApi } from "@/lib/cases";
import type { Case } from "@/lib/types";
import "./close-case-form.css";

const REASONS = [
  "Screening showed no concern",
  "Child moved to another school",
  "Parent asked to stop",
  "Started by mistake",
  "Other",
];

export default function CloseCaseForm({
  caseId,
  onClosed,
  onCancel,
  cancelLabel = "Keep it",
}: {
  caseId: string;
  onClosed: (updated: Case) => void;
  onCancel: () => void;
  cancelLabel?: string;
}) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!reason) {
      setError("Please choose a reason.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const text = note.trim() ? `${reason}: ${note.trim()}` : reason;
      onClosed(await casesApi.close(caseId, text));
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
    <form className="close-form" onSubmit={handleSubmit}>
      <label className="close-form__label" htmlFor="close-reason">
        Why are you closing it?
      </label>
      <select
        id="close-reason"
        className="close-form__field"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      >
        <option value="">Choose a reason</option>
        {REASONS.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <label className="close-form__label" htmlFor="close-note">
        Short note <span className="close-form__optional">(optional)</span>
      </label>
      <textarea
        id="close-note"
        className="close-form__field close-form__note"
        rows={3}
        maxLength={300}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />

      {error && (
        <p className="close-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="close-form__actions">
        <button
          type="button"
          className="close-form__keep"
          onClick={onCancel}
          disabled={saving}
        >
          {cancelLabel}
        </button>
        <button type="submit" className="close-form__close" disabled={saving}>
          {saving ? "Closing…" : "Close case"}
        </button>
      </div>
    </form>
  );
}
