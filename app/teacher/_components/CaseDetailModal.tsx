"use client";

import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import { casesApi } from "@/lib/cases";
import { formatDate, labelOf } from "@/lib/format";
import { FINISHED_STATUSES, type Case } from "@/lib/types";
import CloseCaseForm from "./CloseCaseForm";
import EditCaseForm from "./EditCaseForm";
import "./case-detail-modal.css";

function show(value: string | number | null): string {
  return value === null || value === "" ? "—" : String(value);
}

type View = "details" | "edit" | "close" | "delete";

const TITLES: Record<View, string> = {
  details: "Case details",
  edit: "Edit the case",
  close: "Close the case",
  delete: "Delete the case",
};

export default function CaseDetailModal({
  item,
  onClose,
  onCaseChange,
  onDeleted,
}: {
  item: Case;
  onClose: () => void;
  onCaseChange: (updated: Case) => void;
  onDeleted: (caseId: string) => void;
}) {
  const [view, setView] = useState<View>("details");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const finished = FINISHED_STATUSES.includes(item.status);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await casesApi.remove(item.case_id);
      onDeleted(item.case_id);
    } catch (err) {
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setDeleting(false);
    }
  }

  const sections: { title: string; rows: [string, string][] }[] = [
    {
      title: "Case",
      rows: [
        ["Status", labelOf(item.status)],
        ["Case ID", item.case_id],
        ["Student ID", item.student_id],
        ["School ID", item.school_id],
        ["Started by", item.initiated_by],
      ],
    },
    {
      title: "Screening results",
      rows: [
        ["Autism score", show(item.autism_score)],
        ["ADHD score", show(item.adhd_score)],
        ["Dyslexia score", show(item.dyslexia_score)],
        ["Domain density score", show(item.domain_density_score)],
        ["Primary domain", show(item.primary_domain)],
      ],
    },
    {
      title: "Dates",
      rows: [
        ["Created", formatDate(item.created_at)],
        ["Last updated", formatDate(item.updated_at)],
        ["Closed at", formatDate(item.closed_at)],
        ["Closed reason", show(item.closed_reason)],
      ],
    },
  ];

  return (
    <div className="case-modal__backdrop" onClick={onClose}>
      <div
        className="case-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="case-modal__header">
          <h2 id="case-modal-title" className="case-modal__title">
            {TITLES[view]}
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

        {view === "edit" && (
          <EditCaseForm
            item={item}
            onBack={() => setView("details")}
            onSaved={(updated) => {
              onCaseChange(updated);
              setView("details");
            }}
          />
        )}

        {view === "close" && (
          <CloseCaseForm
            caseId={item.case_id}
            onCancel={() => setView("details")}
            onClosed={(updated) => {
              onCaseChange(updated);
              setView("details");
            }}
          />
        )}

        {view === "delete" && (
          <div className="case-modal__confirm">
            <p className="case-modal__confirm-text">
              Delete this case? This cannot be undone. Use this only if the case
              was started by mistake.
            </p>
            {deleteError && (
              <p className="case-modal__confirm-error">{deleteError}</p>
            )}
            <div className="case-modal__actions">
              <button
                type="button"
                className="case-modal__secondary"
                onClick={() => setView("details")}
                disabled={deleting}
              >
                Keep it
              </button>
              <button
                type="button"
                className="case-modal__danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        )}

        {view === "details" && (
          <>
            {finished && (
              <p className="case-modal__banner" role="status">
                {item.status === "CLOSED"
                  ? `This case was closed on ${formatDate(item.closed_at)}. Reason: ${show(item.closed_reason)}`
                  : "This case is finished, so it can no longer be changed."}
              </p>
            )}

            {sections.map((section) => (
              <section key={section.title} className="case-modal__section">
                <h3 className="case-modal__heading">{section.title}</h3>
                <dl className="case-modal__list">
                  {section.rows.map(([label, value]) => (
                    <div key={label} className="case-modal__row">
                      <dt className="case-modal__label">{label}</dt>
                      <dd className="case-modal__value">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}

            {!finished && (
              <div className="case-modal__actions">
                <button
                  type="button"
                  className="case-modal__secondary"
                  onClick={() => setView("delete")}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="case-modal__secondary"
                  onClick={() => setView("edit")}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="case-modal__danger"
                  onClick={() => setView("close")}
                >
                  Close this case
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
