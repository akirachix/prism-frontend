"use client";

import Image from "next/image";

import { formatDay } from "@/lib/format";
import { scaleLabel } from "@/lib/evaluations";
import { studentName, type Student } from "@/lib/lookups";
import {
  LEVEL_TEXT,
  screeningRows,
  type EvaluationReport,
} from "@/lib/report-data";
import type { Level } from "@/lib/scoring";
import type { ScreeningContent } from "@/lib/screening";
import { Disclaimer } from "../ui/bits";
import "./report.css";

function LevelTag({ level }: { level: Level | null }) {
  if (!level)
    return (
      <span className="report__level report__level--none">Not done yet</span>
    );
  return (
    <span className={`report__level report__level--${level.toLowerCase()}`}>
      {LEVEL_TEXT[level]}
    </span>
  );
}

/** A printable report. "Download PDF" prints this page to PDF. */
export function ScreeningReport({
  child,
  content,
}: {
  child: Student;
  content: ScreeningContent;
}) {
  const rows = screeningRows(content);
  const bothDone = Boolean(content.combined);
  return (
    <article className="report">
      <ReportHead title="Screening report" child={child} />
      <p className="report__intro">
        {bothDone
          ? "The teacher and the parent both answered short questions about the child. Each area below is looked at on its own."
          : "This report fills in once both the teacher and the parent have answered."}
      </p>
      <table className="report__table">
        <thead>
          <tr>
            <th>Area</th>
            <th>Teacher</th>
            <th>Parent</th>
            <th>Together</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.domain}>
              <th scope="row">{row.title}</th>
              <td data-label="Teacher">
                <LevelTag level={row.teacher} />
              </td>
              <td data-label="Parent">
                <LevelTag level={row.parent} />
              </td>
              <td data-label="Together">
                <LevelTag level={row.overall} />
                {row.disagreement && (
                  <span className="report__flag">
                    Teacher and parent saw this differently
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="report__dates">
        <div>
          <dt>Teacher finished</dt>
          <dd>{formatDay(content.teacher?.completed_at)}</dd>
        </div>
        <div>
          <dt>Parent finished</dt>
          <dd>{formatDay(content.parent?.completed_at)}</dd>
        </div>
      </dl>
      <Disclaimer>This is a screening result, not a diagnosis</Disclaimer>
    </article>
  );
}

export function EvaluationReportDoc({
  child,
  report,
}: {
  child: Student;
  report: EvaluationReport;
}) {
  return (
    <article className="report">
      <ReportHead title="6-week evaluation" child={child} />
      <p className="report__intro">
        Six weeks after the plan started on {formatDay(report.iep.approved_at)},
        the teacher and the parent each said how things have changed.
      </p>
      <table className="report__table">
        <thead>
          <tr>
            <th>Question</th>
            <th>Teacher</th>
            <th>Parent</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map(({ question, teacher, parent }) => (
            <tr key={question.eval_question_id}>
              <th scope="row">{question.question_text}</th>
              <td data-label="Teacher">
                {teacher ? scaleLabel(teacher.score) : "Not answered"}
              </td>
              <td data-label="Parent">
                {parent ? scaleLabel(parent.score) : "Not answered"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Disclaimer>
        Mirai is a screening tool. It never gives a diagnosis
      </Disclaimer>
    </article>
  );
}

function ReportHead({ title, child }: { title: string; child: Student }) {
  return (
    <header className="report__head">
      <div>
        <p className="report__kicker">Mirai</p>
        <h2 className="report__title">{title}</h2>
        <p className="report__child">
          {studentName(child)} · Adm. {child.admission_number}
          {child.school_name ? ` · ${child.school_name}` : ""}
        </p>
      </div>
      <Image
        src="/mirai-logo-navy.png"
        alt=""
        width={113}
        height={52}
        className="report__logo"
      />
    </header>
  );
}
