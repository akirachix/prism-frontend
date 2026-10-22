"use client";

import { useEffect, useState } from "react";

import { errorMessage } from "@/lib/api";
import { iepsApi, type Iep } from "@/lib/ieps";
import { getSession, TEACHER_ID } from "@/lib/session";
import "./iep-review-modal.css";

export default function IepReviewModal({
  iepId,
  studentName,
  onClose,
  onDone,
}: {
  iepId: string;
  studentName: string;
  onClose: () => void;
  onDone: (iepId: string) => void;
}) {
  const [iep, setIep] = useState<Iep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    iepsApi
      .get(iepId)
      .then(setIep)
      .catch((err: unknown) => setError(errorMessage(err)));
  }, [iepId]);

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      const userId = getSession()?.user.user_id ?? TEACHER_ID;
      await iepsApi.approve(iepId, userId);
      onDone(iepId);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  async function reject() {
    if (reason.trim().length < 3) {
      setError("Please give a reason (at least 3 characters).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await iepsApi.reject(iepId, reason.trim());
      onDone(iepId);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="iep-modal__backdrop" onClick={onClose}>
      <div
        className="iep-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Review plan for ${studentName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="iep-modal__title">{studentName}’s plan</h2>

        {!iep && !error && <p>Loading…</p>}
        {error && (
          <p role="alert" className="iep-modal__error">
            {error}
          </p>
        )}

        {iep && (
          <div className="iep-modal__body">
            <pre className="iep-modal__content">{iep.generated_content}</pre>
            {iep.short_term_goals.length > 0 && (
              <>
                <h3>Short-term goals</h3>
                <ul>
                  {iep.short_term_goals.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </>
            )}
            {iep.strategies.length > 0 && (
              <>
                <h3>Strategies</h3>
                <ul>
                  {iep.strategies.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {rejecting && (
          <textarea
            className="iep-modal__reason"
            placeholder="Why are you rejecting this plan?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        )}

        <div className="iep-modal__actions">
          <button
            type="button"
            className="iep-modal__btn"
            onClick={onClose}
            disabled={busy}
          >
            Close
          </button>
          {!rejecting ? (
            <button
              type="button"
              className="iep-modal__btn"
              onClick={() => setRejecting(true)}
              disabled={!iep || busy}
            >
              Reject
            </button>
          ) : (
            <button
              type="button"
              className="iep-modal__btn"
              onClick={reject}
              disabled={busy}
            >
              Confirm reject
            </button>
          )}
          <button
            type="button"
            className="iep-modal__btn iep-modal__btn--primary"
            onClick={approve}
            disabled={!iep || busy}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
