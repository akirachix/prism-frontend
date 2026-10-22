"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  ActivitiesDocument,
  PlanDocument,
  ScreeningDocument,
} from "@/app/parent/_components/reports/ReportDocuments";
import ReportsHeader from "@/app/parent/_components/reports/ReportsHeader";
import { useParentReports } from "@/app/parent/_components/reports/useParentReports";
import {
  useReportCaseId,
  withCase,
} from "@/app/parent/_components/reports/useReportCase";
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
}: {
  kind: string;
  caseId: string | null;
  autoPrint: boolean;
}) {
  const {
    child,
    childError,
    reports,
    errors: reportErrors,
    loading,
    retry,
  } = useParentReports(caseId);
  const printed = useRef(false);

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
  // Print only once this case's child and report are both loaded.
  const printReady = Boolean(
    ready &&
    child &&
    child.caseItem.case_id === caseId &&
    !loading &&
    !currentError,
  );

  useEffect(() => {
    if (autoPrint && printReady && !printed.current) {
      printed.current = true;
      setTimeout(() => window.print(), 300);
    }
  }, [autoPrint, printReady]);

  const title = TITLES[kind] ?? "Report";
  const student = child?.student;

  return (
    <main className="preports">
      <ReportsHeader
        title={title}
        back={caseId ? withCase("/parent/reports", caseId) : "/parent/reports"}
      />
      <div className="preports__body">
        {!caseId || !TITLES[kind] ? (
          <p className="preports__message">This report is not available.</p>
        ) : loading ? (
          <p className="preports__message">Loading…</p>
        ) : childError || currentError ? (
          <div className="preports__error-panel">
            <p className="preports__error">
              {childError
                ? `We could not load your child's details: ${childError}`
                : currentError}
            </p>
            <button type="button" className="preports__button" onClick={retry}>
              Retry
            </button>
          </div>
        ) : !reports || !child ? (
          <p className="preports__message">This report is not available.</p>
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

  return (
    <ReportContent
      key={caseId ?? "none"}
      kind={kind}
      caseId={caseId}
      autoPrint={autoPrint}
    />
  );
}
