"use client";

import { ChevronRight, FileText, House, NotebookPen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import DevReportPicker from "@/app/parent/_components/reports/DevReportPicker";
import ProfessionalsList from "@/app/parent/_components/reports/ProfessionalsList";
import ReportsHeader from "@/app/parent/_components/reports/ReportsHeader";
import {
  useReportCaseId,
  useReportChild,
  withCase,
} from "@/app/parent/_components/reports/useReportCase";
import { ApiError } from "@/lib/api";
import { loadParentReports, type ParentReports } from "@/lib/reports";
import "@/app/parent/_components/reports/reports.css";

interface Card {
  kind: "screening" | "plan" | "activities";
  title: string;
  text: string;
  ready: boolean;
  waiting: string;
  icon: typeof FileText;
}

export default function ReportsOverview() {
  const caseId = useReportCaseId();
  const child = useReportChild(caseId);
  const [reports, setReports] = useState<ParentReports | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;
    loadParentReports(caseId)
      .then(setReports)
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "Something went wrong. Please try again.",
        ),
      );
  }, [caseId]);

  const noConcern = child.data?.caseItem.status === "NO_CONCERN_IDENTIFIED";
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
            {child.data?.student && (
              <p className="preports__lead">
                Reports for{" "}
                <strong>
                  {child.data.student.first_name} {child.data.student.last_name}
                </strong>
              </p>
            )}
            {(error ?? child.error) && (
              <p className="preports__error">{error ?? child.error}</p>
            )}
            {!reports && !error && (
              <p className="preports__message">Loading reports…</p>
            )}
            {reports && (
              <ul className="preports__cards">
                {cards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <li
                      key={card.kind}
                      className="preports__card preports__report"
                    >
                      {card.ready ? (
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
                      {card.ready && (
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
