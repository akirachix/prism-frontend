"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { reportsApi, type Report } from "@/lib/reports";
import { withCase } from "./useReportCase";
import "./reports.css";

/**
 * Local testing only (npm run dev): before sign-in exists there is no
 * "your child", so this lists every report in the database and opens the
 * chosen case's reports. It never renders in a production build.
 */
export default function DevReportPicker() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reportsApi
      .listAll()
      .then((list) =>
        setReports(
          [...list].sort((a, b) =>
            b.generated_at.localeCompare(a.generated_at),
          ),
        ),
      )
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "Something went wrong. Please try again.",
        ),
      );
  }, []);

  return (
    <section className="preports__section" aria-labelledby="dev-title">
      <h2 id="dev-title" className="preports__section-title"></h2>
      <p className="preports__lead"></p>
      {error && <p className="preports__error">{error}</p>}
      {!reports && !error && <p className="preports__message">Loading…</p>}
      {reports && reports.length === 0 && (
        <p className="preports__message">No reports yet.</p>
      )}
      {reports && reports.length > 0 && (
        <ul className="preports__cards">
          {reports.map((report) => (
            <li key={report.report_id}>
              <Link
                href={withCase("/parent/reports", report.case_id)}
                className="preports__card preports__report-top"
              >
                <span>
                  <span className="preports__report-title">
                    Case {report.case_id.slice(0, 8)}
                  </span>
                  <span className="preports__report-text">
                    Report generated {formatDate(report.generated_at)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
