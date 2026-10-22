"use client";

import { ChevronRight, FileText, House, NotebookPen } from "lucide-react";
import Link from "next/link";

import DevReportPicker from "@/app/parent/_components/reports/DevReportPicker";
import ProfessionalsList from "@/app/parent/_components/reports/ProfessionalsList";
import ReportsHeader from "@/app/parent/_components/reports/ReportsHeader";
import { useParentReports } from "@/app/parent/_components/reports/useParentReports";
import {
  useReportCaseId,
  withCase,
} from "@/app/parent/_components/reports/useReportCase";
import "@/app/parent/_components/reports/reports.css";

interface Card {
  kind: "screening" | "plan" | "activities";
  title: string;
  text: string;
  ready: boolean;
  waiting: string;
  icon: typeof FileText;
}

function ReportsOverviewContent({ caseId }: { caseId: string | null }) {
  const {
    child,
    childError,
    reports,
    errors: reportErrors,
    loading,
    retry,
  } = useParentReports(caseId);

  const noConcern = child?.caseItem.status === "NO_CONCERN_IDENTIFIED";
  const cards: Card[] = [
    {
      kind: "screening",
      title: "Screening report",
      text: "Your child's screening results.",
      ready: Boolean(reports?.screening),
      waiting: "Ready once you and the teacher finish the screening.",
      icon: FileText,
    },
    {
      kind: "plan",
      title: "Education plan (IEP)",
      text: "What the school will do to support your child.",
      ready: Boolean(reports?.plan),
      waiting: noConcern
        ? "Not needed: the screening found no concern."
        : "Ready once the teacher and the school approve the plan.",
      icon: NotebookPen,
    },
    {
      kind: "activities",
      title: "Home activities",
      text: "Simple things to try at home.",
      ready: Boolean(reports?.recommendation),
      waiting: noConcern
        ? "Not needed: the screening found no concern."
        : "Ready together with the plan.",
      icon: House,
    },
  ];

  return (
    <main className="preports">
      <ReportsHeader title="Reports" />
      <div className="preports__body">
        {!caseId ? (
          <>
            <p className="preports__message">
              Open Reports from your child&apos;s page to see their reports.
            </p>
            {process.env.NODE_ENV === "development" && <DevReportPicker />}
          </>
        ) : (
          <>
            {child && (
              <p className="preports__lead">
                Reports for{" "}
                <strong>
                  {child.student.first_name} {child.student.last_name}
                </strong>
              </p>
            )}
            {childError && (
              <div className="preports__error-panel">
                <p className="preports__error">
                  We could not load your child&apos;s details: {childError}
                </p>
                <button
                  type="button"
                  className="preports__button"
                  onClick={retry}
                >
                  Retry
                </button>
              </div>
            )}
            {loading && <p className="preports__message">Loading reports…</p>}
            {!loading && reports && (
              <ul className="preports__cards">
                {cards.map((card) => {
                  const Icon = card.icon;
                  const reportError =
                    card.kind === "screening"
                      ? reportErrors.screening
                      : card.kind === "plan"
                        ? reportErrors.plan
                        : reportErrors.recommendation;
                  const isReady = card.ready && !reportError;

                  return (
                    <li
                      key={card.kind}
                      className="preports__card preports__report"
                    >
                      {reportError ? (
                        <div className="preports__report-top preports__report-top--waiting">
                          <Icon size={28} aria-hidden="true" />
                          <span>
                            <span className="preports__report-title">
                              {card.title}
                            </span>
                            <span className="preports__report-text">
                              {reportError}
                            </span>
                          </span>
                        </div>
                      ) : isReady ? (
                        <Link
                          href={withCase(
                            `/parent/reports/${card.kind}`,
                            caseId,
                          )}
                          className="preports__report-top"
                        >
                          <Icon size={28} aria-hidden="true" />
                          <span>
                            <span className="preports__report-title">
                              {card.title}
                            </span>
                            <span className="preports__report-text">
                              {card.text}
                            </span>
                          </span>
                          <ChevronRight
                            size={22}
                            aria-hidden="true"
                            className="preports__chevron"
                          />
                        </Link>
                      ) : (
                        <div className="preports__report-top preports__report-top--waiting">
                          <Icon size={28} aria-hidden="true" />
                          <span>
                            <span className="preports__report-title">
                              {card.title}
                            </span>
                            <span className="preports__report-text">
                              {card.waiting}
                            </span>
                          </span>
                        </div>
                      )}
                      {isReady && (
                        <Link
                          href={withCase(
                            `/parent/reports/${card.kind}`,
                            caseId,
                            "&print=1",
                          )}
                          className="preports__button"
                        >
                          Download PDF
                        </Link>
                      )}
                      {reportError && (
                        <button
                          type="button"
                          className="preports__button"
                          onClick={retry}
                        >
                          Retry
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
        <ProfessionalsList />
      </div>
    </main>
  );
}

export default function ReportsOverview() {
  const caseId = useReportCaseId();

  return <ReportsOverviewContent key={caseId ?? "none"} caseId={caseId} />;
}
