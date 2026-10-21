"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivitiesDocument,
  PlanDocument,
  ScreeningDocument,
} from "@/app/parent/_components/reports/ReportDocuments";
import ReportsHeader from "@/app/parent/_components/reports/ReportsHeader";
import {
  useReportCaseId,
  useReportChild,
  withCase,
} from "@/app/parent/_components/reports/useReportCase";
import { ApiError } from "@/lib/api";
import {
  loadParentReports,
  type ParentReportErrors,
  type ParentReports,
} from "@/lib/reports";
import "@/app/parent/_components/reports/reports.css";

const TITLES: Record<string, string> = {
  screening: "Screening report",
  plan: "Education plan (IEP)",
  activities: "Home activities",
};

function ReportContent({
  kind,
  caseId,
  autoPrint,
  child,
}: {
  kind: string;
  caseId: string | null;
  autoPrint: boolean;
  child: ReturnType<typeof useReportChild>;
}) {
  const [reports, setReports] = useState<ParentReports | null>(null);
  const [reportErrors, setReportErrors] = useState<ParentReportErrors>({});
  const printed = useRef(false);

  const loadReports = useCallback(() => {
    if (!caseId) {
      setReports(null);
      setReportErrors({});
      printed.current = false;
      return;
    }

    let active = true;
    setReports(null);
    setReportErrors({});
    printed.current = false;

    loadParentReports(caseId)
      .then(({ reports: nextReports, errors: nextErrors }) => {
        if (!active) return;
        setReports(nextReports);
        setReportErrors(nextErrors);
      })
      .catch((err) => {
        if (!active) return;
        setReportErrors({
          screening:
            err instanceof ApiError
              ? err.message
              : "Something went wrong. Please try again.",
          plan:
            err instanceof ApiError
              ? err.message
              : "Something went wrong. Please try again.",
          recommendation:
            err instanceof ApiError
              ? err.message
              : "Something went wrong. Please try again.",
        });
      });

    return () => {
      active = false;
    };
  }, [caseId]);

  useEffect(() => {
    if (!caseId) return;

    let active = true;

    loadParentReports(caseId)
      .then(({ reports: nextReports, errors: nextErrors }) => {
        if (!active) return;
        setReports(nextReports);
        setReportErrors(nextErrors);
      })
      .catch((err) => {
        if (!active) return;
        setReportErrors({
          screening:
            err instanceof ApiError
              ? err.message
              : "Something went wrong. Please try again.",
          plan:
            err instanceof ApiError
              ? err.message
              : "Something went wrong. Please try again.",
          recommendation:
            err instanceof ApiError
              ? err.message
              : "Something went wrong. Please try again.",
        });
      });

    return () => {
      active = false;
    };
  }, [caseId]);

  const currentError =
    kind === "screening"
      ? reportErrors.screening
      : kind === "plan"
        ? reportErrors.plan
        : reportErrors.recommendation;
  const ready =
    (kind === "screening" && reports?.screening) ||
    (kind === "plan" && reports?.plan) ||
    (kind === "activities" && reports?.recommendation);
  const printReady = ready && !child.loading && !currentError;

  useEffect(() => {
    if (autoPrint && printReady && !printed.current) {
      printed.current = true;
      setTimeout(() => window.print(), 300);
    }
  }, [autoPrint, printReady]);

  const title = TITLES[kind] ?? "Report";
  const student = child.data?.student;

  return (
    <main className="preports">
      <ReportsHeader
        title={title}
        back={caseId ? withCase("/parent/reports", caseId) : "/parent/reports"}
      />
      <div className="preports__body">
        {!caseId || !TITLES[kind] ? (
          <p className="preports__message">This report is not available.</p>
        ) : currentError ? (
          <div className="preports__error-panel">
            <p className="preports__error">{currentError}</p>
            <button
              type="button"
              className="preports__button"
              onClick={() => void loadReports()}
            >
              Retry
            </button>
          </div>
        ) : !reports ? (
          <p className="preports__message">Loading…</p>
        ) : !ready ? (
          <p className="preports__message">This report is not ready yet.</p>
        ) : (
          <>
            <div className="preports__actions no-print">
              <button
                type="button"
                className="preports__button"
                onClick={() => window.print()}
              >
                Download PDF
              </button>
            </div>
            <article className="preports__card preports__doc">
              <header className="preports__doc-head">
                <p className="preports__kicker">Mirai</p>
                <h2 className="preports__doc-title">{title}</h2>
                {student && (
                  <p className="preports__doc-child">
                    {student.first_name} {student.last_name} · Adm.{" "}
                    {student.admission_number}
                  </p>
                )}
              </header>
              {kind === "screening" && reports.screening && (
                <ScreeningDocument report={reports.screening} />
              )}
              {kind === "plan" && reports.plan && (
                <PlanDocument plan={reports.plan} />
              )}
              {kind === "activities" && reports.recommendation && (
                <ActivitiesDocument recommendation={reports.recommendation} />
              )}
            </article>
          </>
        )}
      </div>
    </main>
  );
}

export default function ReportView() {
  const { kind } = useParams<{ kind: string }>();
  const autoPrint = useSearchParams().get("print") === "1";
  const caseId = useReportCaseId();
  const child = useReportChild(caseId);

  return (
    <ReportContent
      key={caseId ?? "none"}
      kind={kind}
      caseId={caseId}
      autoPrint={autoPrint}
      child={child}
    />
  );
}
