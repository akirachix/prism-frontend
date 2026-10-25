"use client";

import { useState } from "react";

import { errorMessage } from "@/lib/api";
import { casesApi } from "@/lib/cases";
import { labelOf } from "@/lib/format";
import type { Case, CaseUpdate } from "@/lib/types";
import "./edit-case-form.css";

const STATUSES = ["INITIATED", "COMPLETED", "NO_CONCERN_IDENTIFIED", "CLOSED"];

interface Props {
  item: Case;
  onBack: () => void;
  onSaved: (updated: Case) => void;
}

export default function EditCaseForm({ item, onBack, onSaved }: Props) {
  const [status, setStatus] = useState(item.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const changes: CaseUpdate = {};

    if (status !== item.status) changes.status = status;

    if (Object.keys(changes).length === 0) {
      setError("You have not changed anything.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      onSaved(await casesApi.update(item.case_id, changes));
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <form className="edit-case" onSubmit={handleSubmit}>
      <h2 className="edit-case__title">Edit this case</h2>

      <label className="edit-case__field">
        <span>Where the case is</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {!STATUSES.includes(status) && (
            <option value={status}>{labelOf(status)}</option>
          )}
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {labelOf(value)}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="edit-case__error">{error}</p>}

      <div className="edit-case__actions">
        <button
          type="button"
          className="edit-case__cancel"
          onClick={onBack}
          disabled={saving}
        >
          Cancel
        </button>
        <button type="submit" className="edit-case__save" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
