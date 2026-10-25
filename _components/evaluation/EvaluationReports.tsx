"use client";

import { ChevronDown, Download, FileText, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  overallLabel,
  reportsThisYear,
  topReports,
  type EvaluationReport,
} from "@/lib/evaluation-reports";
import { scaleLabel } from "@/lib/evaluations";
import { formatDate, formatLongDay } from "@/lib/format";
import Button from "../ui/Button";
import { Empty, Pill } from "../ui/bits";
import "./evaluation-reports.css";

function roleLabel(report: EvaluationReport): string {
  return report.role === "TEACHER" ? "Teacher" : "Parent";
}

function scoreText(score: number | null): string {
  if (score === null) return "Not answered";
  return `${scaleLabel(score)} (${score > 0 ? `+${score}` : score})`;
}

function Answers({ report }: { report: EvaluationReport }) {
  return (
    <dl className="eval-report__answers">
      {report.answers.map(({ question, score }, i) => (
        <div key={question.eval_question_id} className="eval-report__answer">
          <dt>
            <span className="eval-report__q">Q{i + 1}</span>
            {question.question_text}
          </dt>
          <dd>{scoreText(score)}</dd>
        </div>
      ))}
    </dl>
  );
}

function ReportCard({
  report,
  name,
  onPrint,
}: {
  report: EvaluationReport;
  name: string;
  onPrint: () => void;
}) {
  const [open, setOpen] = useState(false);
  const answersId = `answers-${report.id}`;
  return (
    <li className="eval-report">
      <div className="eval-report__head">
        <span className="eval-report__icon" aria-hidden="true">
          <FileText size={22} />
        </span>
        <div className="eval-report__meta">
          <strong>
            {roleLabel(report)} evaluation · {name}
          </strong>
          <span>
            Sent {formatDate(report.submittedAt)} · Plan v{report.planVersion}
          </span>
        </div>
        <Pill tone="sky">{overallLabel(report)}</Pill>
      </div>
      <div className="eval-report__actions">
        <button
          type="button"
          className="eval-report__toggle"
          aria-expanded={open}
          aria-controls={answersId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Hide answers" : "View answers"}
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={open ? "eval-report__chevron--open" : ""}
          />
        </button>
        <Button variant="outline" small onClick={onPrint}>
          <Download size={16} aria-hidden="true" /> Download PDF
        </Button>
      </div>
      {open && (
        <div id={answersId}>
          <Answers report={report} />
        </div>
      )}
    </li>
  );
}

/** The printable page for one report (only visible while printing). */
function PrintDocument({
  report,
  name,
  childName,
}: {
  report: EvaluationReport;
  name: string;
  childName: string;
}) {
  return (
    <article className="eval-print">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mirai-logo-navy.png"
        alt="Mirai"
        className="eval-print__logo"
      />
      <h1>6-week evaluation report</h1>
      <table className="eval-print__facts">
        <tbody>
          <tr>
            <th>Child</th>
            <td>{childName}</td>
          </tr>
          <tr>
            <th>Completed by</th>
            <td>
              {name} ({roleLabel(report).toLowerCase()})
            </td>
          </tr>
          <tr>
            <th>Sent</th>
            <td>{formatDate(report.submittedAt)}</td>
          </tr>
          <tr>
            <th>Plan</th>
            <td>
              Version {report.planVersion}
              {report.planApprovedAt
                ? `, approved ${formatLongDay(report.planApprovedAt)}`
                : ""}
            </td>
          </tr>
          <tr>
            <th>Overall</th>
            <td>{overallLabel(report)}</td>
          </tr>
        </tbody>
      </table>
      <Answers report={report} />
      <p className="eval-print__foot">
        Scale: -2 much worse · -1 a little worse · 0 no change · +1 a little
        better · +2 much better. Printed from Mirai on{" "}
        {formatLongDay(new Date().toISOString())}.
      </p>
    </article>
  );
}

/**
 * The newest evaluation reports, with "View all" for the past 12 months in
 * a floating panel. Each report can be downloaded as a PDF (the browser's
 * print dialog, "Save as PDF").
 */
export default function EvaluationReports({
  reports,
  childName,
  nameFor,
  empty,
}: {
  reports: EvaluationReport[];
  childName: string;
  /** Who sent this report, e.g. the teacher's or the parent's name. */
  nameFor: (report: EvaluationReport) => string;
  empty: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const [printing, setPrinting] = useState<EvaluationReport | null>(null);
  const latest = topReports(reports);
  const year = reportsThisYear(reports);

  useEffect(() => {
    if (!showAll) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setShowAll(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showAll]);

  useEffect(() => {
    if (!printing) return;
    document.body.classList.add("eval-printing");
    const done = () => setPrinting(null);
    window.addEventListener("afterprint", done);
    // Let the print page render before the dialog opens.
    const timer = window.setTimeout(() => window.print(), 60);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", done);
      document.body.classList.remove("eval-printing");
    };
  }, [printing]);

  if (reports.length === 0) return <Empty>{empty}</Empty>;

  return (
    <>
      <ul className="eval-reports">
        {latest.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            name={nameFor(report)}
            onPrint={() => setPrinting(report)}
          />
        ))}
      </ul>
      <div className="eval-reports__foot">
        <span>
          Showing the {latest.length} newest of {reports.length}
        </span>
        <Button
          variant="link"
          className="eval-reports__more"
          onClick={() => setShowAll(true)}
        >
          View all for the year ({year.length})
        </Button>
      </div>

      {showAll && (
        <div
          className="eval-overlay"
          role="presentation"
          onClick={() => setShowAll(false)}
        >
          <section
            className="eval-overlay__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-reports-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="eval-overlay__head">
              <div>
                <h2 id="all-reports-title">All evaluation reports</h2>
                <p>
                  {childName} · past 12 months · {year.length}{" "}
                  {year.length === 1 ? "report" : "reports"}
                </p>
              </div>
              <button
                type="button"
                className="eval-overlay__close"
                aria-label="Close"
                onClick={() => setShowAll(false)}
              >
                <X size={22} aria-hidden="true" />
              </button>
            </header>
            <ul className="eval-reports eval-overlay__list">
              {year.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  name={nameFor(report)}
                  onPrint={() => setPrinting(report)}
                />
              ))}
            </ul>
            <Button variant="outline" block onClick={() => setShowAll(false)}>
              Back to the latest reports
            </Button>
          </section>
        </div>
      )}

      {printing &&
        createPortal(
          <PrintDocument
            report={printing}
            name={nameFor(printing)}
            childName={childName}
          />,
          document.body,
        )}
    </>
  );
}
