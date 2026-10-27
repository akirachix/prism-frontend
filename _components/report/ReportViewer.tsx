"use client";

import { useEffect, useState } from "react";

import type { Student } from "@/lib/lookups";
import { reportsApi, type Report } from "@/lib/reports";

export type ReportViewerProps = {
  kind: "screening" | "evaluation";
  child?: Student | null;
  caseId: string;
};

export default function ReportViewer({
  kind,
  child,
  caseId,
}: ReportViewerProps) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadReport() {
      try {
        setLoading(true);
        setError(null);

        const result = await reportsApi.forCase(caseId);

        if (active) {
          setReport(result);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "We could not load the report.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadReport();

    return () => {
      active = false;
    };
  }, [caseId]);

  const title = kind === "screening" ? "Screening report" : "Evaluation report";

  if (loading) {
    return <div className="ui-card">Loading report...</div>;
  }

  if (error) {
    return <div className="ui-card">{error}</div>;
  }

  if (!report) {
    return <div className="ui-card">This report is not available.</div>;
  }

  const content =
    typeof report.content === "string"
      ? report.content
      : JSON.stringify(report.content, null, 2);

  return (
    <section className="ui-card">
      <h3>{title}</h3>
      {child && (
        <p>
          {child.first_name} {child.last_name}
        </p>
      )}
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {content}
      </pre>
    </section>
  );
}
