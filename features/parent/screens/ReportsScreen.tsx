"use client";

import { useState } from "react";
import { ChevronRightIcon, DocIcon } from "../../../components/icons";
import { PageHeader } from "../../../components/layout/PageHeader";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage, Loading } from "../../../components/ui/StateMessage";
import { useAsync } from "../../../lib/use-async";
import { parentApi } from "../api";
import type { ReportSummary } from "../types";

export function ReportsScreen() {
  const { data: reports, error, loading, reload } = useAsync(parentApi.reports);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function download(report: ReportSummary) {
    setDownloadError(null);
    setDownloadingId(report.id);
    try {
      await parentApi.downloadReport(report);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Could not download the report.",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <>
      <PageHeader title="Reports" />
      <div className="page-body">
        {loading && <Loading text="Loading reports…" />}
        {error && <ErrorMessage message={error} onRetry={reload} />}

        {reports?.map((report) => (
          <article key={report.type} className="list-card">
            <div className="list-card__row">
              <span className="list-card__icon">
                <DocIcon size={26} />
              </span>
              <div className="list-card__body">
                <h2 className="list-card__title">{report.title}</h2>
                <p className="list-card__text">{report.description}</p>
              </div>
              <ChevronRightIcon size={18} className="list-card__chevron" />
            </div>
            <div className="list-card__action">
              <Button
                className="btn--sm"
                onClick={() => download(report)}
                disabled={!report.available}
                loading={downloadingId === report.id}
              >
                {report.available ? "Download PDF" : "Not ready yet"}
              </Button>
            </div>
          </article>
        ))}

        {downloadError && (
          <p className="form-error" role="alert">
            {downloadError}
          </p>
        )}
      </div>
    </>
  );
}
