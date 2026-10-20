"use client";

import { useState } from "react";
import { ChevronRightIcon, ClipboardCheckIcon, PhoneIcon, UserIcon } from "@/components/icons";
import { MailIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ErrorMessage, Loading } from "@/components/ui/StateMessage";
import { useAsync } from "@/lib/use-async";
import { parentApi } from "../api";

/** Parent "Teacher evaluation" screen: what the teacher rated, and the teacher's contact details. */
export function SchoolScreen() {
  const { data: evaluation, error, loading, reload } = useAsync(parentApi.teacherEvaluation);
  const [showDetails, setShowDetails] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function download() {
    setDownloadError(null);
    setDownloading(true);
    try {
      await parentApi.downloadTeacherEvaluation();
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Could not download the PDF.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <PageHeader title="Teacher evaluation" mobileTitle="Teacher evaluation" />
      <div className="page-body">
        {loading && <Loading text="Loading evaluation…" />}
        {error && <ErrorMessage message={error} onRetry={reload} />}

        {evaluation && (
          <>
            <section className="card t-card" aria-label="Evaluation by teacher">
              <div className="t-card__top">
                <ClipboardCheckIcon size={28} />
                <div>
                  <p className="t-card__label">{evaluation.evaluatedBy}</p>
                  <p className="t-card__meta">
                    {evaluation.teacherName ?? "Teacher"}
                    {evaluation.date ? ` · ${evaluation.date}` : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="t-card__link"
                style={{ background: "none", border: 0, padding: 0, width: "100%" }}
                aria-expanded={showDetails}
                onClick={() => setShowDetails((v) => !v)}
              >
                <span>{showDetails ? "Hide details" : "View details"}</span>
                <ChevronRightIcon size={16} style={{ transform: showDetails ? "rotate(90deg)" : undefined }} />
              </button>
              {showDetails &&
                (evaluation.details.length === 0 ? (
                  <p className="subtle" style={{ marginBottom: 18 }}>
                    The teacher has not rated anything yet.
                  </p>
                ) : (
                  <ul className="subtle" style={{ marginBottom: 18, paddingLeft: 18 }}>
                    {evaluation.details.map((d) => (
                      <li key={d.question}>
                        {d.question} — <strong>{d.rating}</strong>
                      </li>
                    ))}
                  </ul>
                ))}

              <Button className="btn--sm" onClick={download} loading={downloading}>
                Download PDF
              </Button>
              {downloadError && (
                <p className="form-error" role="alert" style={{ marginTop: 12 }}>
                  {downloadError}
                </p>
              )}
            </section>

            <section className="card t-card" aria-label="Teacher information">
              <div className="t-card__top">
                <UserIcon size={28} />
                <div>
                  <p className="t-card__label">Teacher information</p>
                  <p className="t-card__meta">{evaluation.teacher.name ?? "Teacher"}</p>
                </div>
              </div>
              <div className="t-info">
                <div className="t-info__row">
                  <PhoneIcon size={18} />
                  <span>{evaluation.teacher.phone ?? "Not provided"}</span>
                </div>
                <div className="t-info__row">
                  <MailIcon size={18} />
                  <span>{evaluation.teacher.email ?? "Not provided"}</span>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
