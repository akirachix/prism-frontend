"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { errorMessage } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import {
  saveScreening,
  type Answers,
  type Assessment,
  type Part,
  type ResponderRole,
} from "@/lib/screening";
import { useMediaQuery } from "../hooks";
import Button from "../ui/Button";
import { Alert, ProgressBar } from "../ui/bits";
import "../portal.css";
import "./screening.css";

export default function ScreeningFlow({
  role,
  caseId,
  parts,
  assessment: savedAssessment,
  saved,
  responderId,
  title,
  exitHref,
  doneHref,
}: {
  role: ResponderRole;
  caseId: string;
  parts: Part[];
  assessment: Assessment | null;
  saved: Answers;
  responderId: string;
  title: string;
  exitHref: string;
  doneHref: string;
}) {
  const router = useRouter();
  const desktop = useMediaQuery("(min-width: 1000px)");
  const questions = useMemo(
    () =>
      parts.flatMap((part) =>
        part.questions.map((q) => ({ ...q, tool: part.tool })),
      ),
    [parts],
  );
  const [assessment, setAssessment] = useState<Assessment | null>(
    savedAssessment,
  );
  const [answers, setAnswers] = useState<Answers>(saved);
  const [index, setIndex] = useState(() => {
    const first = questions.findIndex(
      (q) => typeof saved[q.question_id] !== "number",
    );
    return first === -1 ? 0 : first;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  const perPage = role === "TEACHER" && desktop ? 2 : 1;
  const start = Math.floor(index / perPage) * perPage;
  const page = questions.slice(start, start + perPage);
  const last = start + perPage >= questions.length;
  const partOf = (i: number) => questions[i]?.tool;
  const partIndex = parts.findIndex((part) => part.tool === partOf(start));
  const answered = (id: string) => typeof answers[id] === "number";
  const answeredCount = questions.filter((q) => answered(q.question_id)).length;

  async function persist(finish: boolean) {
    setSaving(true);
    setError(null);
    try {
      const result = await saveScreening({
        caseId,
        role,
        responderId,
        assessment,
        answers,
        finish,
      });
      setAssessment(result.assessment);
      if (finish) logAudit("SUBMIT", "screening", caseId, { role });
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    if (page.some((q) => !answered(q.question_id))) {
      setMissing(true);
      return;
    }
    setMissing(false);
    if (last) {
      const gap = questions.findIndex((q) => !answered(q.question_id));
      if (gap !== -1) {
        setIndex(gap);
        setMissing(true);
        return;
      }
      if (await persist(true)) router.push(doneHref);
      return;
    }
    const nextStart = start + perPage;
    if (partOf(nextStart) !== partOf(start)) {
      if (!(await persist(false))) return;
    }
    setIndex(nextStart);
    window.scrollTo({ top: 0 });
  }

  function back() {
    setMissing(false);
    if (start === 0) {
      router.push(exitHref);
      return;
    }
    setIndex(Math.max(0, start - perPage));
  }

  async function saveAndExit() {
    if (await persist(false)) router.push(exitHref);
  }

  const nearEnd = answeredCount >= questions.length - 3 && !last;

  return (
    <main className="ui-page screening">
      <header
        className={`ui-header screening__header screening__header--${role.toLowerCase()}`}
      >
        <div className="ui-header__row">
          {role === "TEACHER" ? (
            <>
              <Link
                href={exitHref}
                className="ui-header__back screening__close"
                aria-label="Close"
              >
                ✕
              </Link>
              <button
                type="button"
                className="ui-header-pill screening__save"
                onClick={saveAndExit}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save and exit"}
              </button>
            </>
          ) : (
            <Link href={exitHref} className="ui-header__back">
              ← <span>Screening</span>
            </Link>
          )}
          <h1 className="ui-header__title screening__title">{title}</h1>
          <span className="screening__count screening__count--desktop">
            Question {Math.min(start + perPage, questions.length)} of{" "}
            {questions.length}
            <ProgressBar
              value={answeredCount}
              max={questions.length}
              label="Questions answered"
            />
          </span>
        </div>
        {role === "TEACHER" && (
          <ol className="portal-parts" aria-label="Parts">
            {parts.map((part, i) => {
              const done = part.questions.filter((q) =>
                answered(q.question_id),
              ).length;
              return (
                <li
                  key={part.tool}
                  className={
                    i === partIndex
                      ? "portal-part portal-part--current"
                      : "portal-part"
                  }
                >
                  <ProgressBar
                    value={done}
                    max={part.questions.length}
                    label={`Part ${i + 1}`}
                  />
                  Part {i + 1}
                </li>
              );
            })}
          </ol>
        )}
      </header>

      <div className="ui-body screening__body">
        <div className="portal-flow">
          <aside className="portal-sidecard ui-card" aria-label="Parts covered">
            <h2 className="ui-section-title">Parts covered</h2>
            <ol className="portal-steps">
              {parts.map((part, i) => {
                const state =
                  i < partIndex ? "done" : i === partIndex ? "current" : "todo";
                return (
                  <li key={part.tool}>
                    <span
                      className={`portal-steps__dot portal-steps__dot--${state}`}
                    >
                      {state === "done" ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span>
                      Part {i + 1}
                      {state === "done"
                        ? " – Done"
                        : state === "current"
                          ? " – Where you are"
                          : ""}
                      <span className="screening__part-name">{part.title}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </aside>

          <div className="screening__main">
            <div className="screening__count screening__count--mobile">
              {role === "PARENT" ? (
                <span className="screening__label">
                  {parts[partIndex]?.title ?? "Screening questions"}
                </span>
              ) : (
                <span>
                  Question {start + 1} of {questions.length}
                </span>
              )}
              <ProgressBar
                value={answeredCount}
                max={questions.length}
                label="Questions answered"
              />
              {role === "PARENT" && nearEnd && (
                <span className="screening__almost">Almost there!!</span>
              )}
            </div>

            {page.map((question, offset) => {
              const number = start + offset + 1;
              const value = answers[question.question_id];
              const unanswered = missing && typeof value !== "number";
              return (
                <fieldset
                  key={question.question_id}
                  className="portal-question screening__question"
                >
                  <legend className="portal-question__head">
                    {role === "TEACHER" ? (
                      <span className="portal-qtag">Q{number}</span>
                    ) : (
                      <span className="screening__num">{number}.</span>
                    )}
                    <span>{question.question_text}</span>
                  </legend>
                  <div className="ui-choices">
                    {question.answer_labels.map((label, position) => {
                      const checked = value === position;
                      return (
                        <label
                          key={label}
                          className={
                            checked
                              ? "ui-choice ui-choice--checked"
                              : "ui-choice"
                          }
                        >
                          <input
                            type="radio"
                            name={question.question_id}
                            className="visually-hidden"
                            checked={checked}
                            onChange={() => {
                              setAnswers((current) => ({
                                ...current,
                                [question.question_id]: position,
                              }));
                              setMissing(false);
                            }}
                          />
                          <span className="ui-choice__dot" aria-hidden="true" />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                  {unanswered && (
                    <p className="ui-field__error">
                      Choose an answer to continue.
                    </p>
                  )}
                </fieldset>
              );
            })}

            {error && <Alert>{error}</Alert>}

            <div
              className={
                role === "TEACHER"
                  ? "ui-actions ui-actions--split"
                  : "ui-actions"
              }
            >
              {role === "TEACHER" && (
                <Button variant="outline" onClick={back} disabled={saving}>
                  ← Back
                </Button>
              )}
              <Button
                onClick={next}
                loading={saving}
                block={role === "PARENT"}
                className="screening__next"
              >
                {saving
                  ? "Saving…"
                  : last
                    ? "Finish"
                    : role === "TEACHER"
                      ? "Next →"
                      : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
