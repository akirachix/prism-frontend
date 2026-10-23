"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { errorMessage } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { isComplete } from "@/lib/scoring";
import { saveScreening, type ScreeningContent } from "@/lib/screening";
import {
  allQuestions,
  type Informant,
  type QuestionSet,
} from "@/lib/screening-questions";
import type { Case } from "@/lib/types";
import { useMediaQuery } from "../hooks";
import Button from "../ui/Button";
import { Alert, ProgressBar } from "../ui/bits";
import "../portal.css";
import "./screening.css";

/**
 * The screening questions, one part (domain) after another.
 * Answers are saved when a part is finished, on "Save and exit", and at
 * the end, so closing the app loses at most the current part.
 */
export default function ScreeningFlow({
  role,
  caseItem,
  set,
  saved,
  responderId,
  title,
  exitHref,
  doneHref,
}: {
  role: Informant;
  caseItem: Case;
  set: QuestionSet;
  saved: ScreeningContent | null;
  responderId: string;
  title: string;
  exitHref: string;
  doneHref: string;
}) {
  const router = useRouter();
  const desktop = useMediaQuery("(min-width: 1000px)");
  const questions = useMemo(() => allQuestions(set), [set]);
  const mine = role === "TEACHER" ? saved?.teacher : saved?.parent;
  const [answers, setAnswers] = useState<Record<string, number>>(
    mine?.answers ?? {},
  );
  const [index, setIndex] = useState(() => {
    const first = questions.findIndex(
      (q) => typeof mine?.answers?.[q.id] !== "number",
    );
    return first === -1 ? 0 : first;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  // Teachers on a wide screen see two questions at a time (desktop design).
  const perPage = role === "TEACHER" && desktop ? 2 : 1;
  const start = Math.floor(index / perPage) * perPage;
  const page = questions.slice(start, start + perPage);
  const last = start + perPage >= questions.length;
  const partOf = (i: number) => questions[i]?.domain;
  const partIndex = set.parts.findIndex(
    (part) => part.domain === partOf(start),
  );
  const answeredCount = questions.filter(
    (q) => typeof answers[q.id] === "number",
  ).length;

  async function persist(finish: boolean) {
    setSaving(true);
    setError(null);
    try {
      await saveScreening({
        caseItem,
        role,
        responderId,
        set,
        answers,
        finish,
      });
      if (finish) logAudit("SUBMIT", "screening", caseItem.case_id, { role });
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    if (page.some((q) => typeof answers[q.id] !== "number")) {
      setMissing(true);
      return;
    }
    setMissing(false);
    if (last) {
      if (!isComplete(set, answers)) {
        const gap = questions.findIndex(
          (q) => typeof answers[q.id] !== "number",
        );
        setIndex(gap);
        setMissing(true);
        return;
      }
      if (await persist(true)) router.push(doneHref);
      return;
    }
    const nextStart = start + perPage;
    // Save at the end of each part.
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

  const parentWording = role === "PARENT";
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
            {set.parts.map((part, i) => {
              const done = part.questions.filter(
                (q) => typeof answers[q.id] === "number",
              ).length;
              return (
                <li
                  key={part.domain}
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
              {set.parts.map((part, i) => {
                const state =
                  i < partIndex ? "done" : i === partIndex ? "current" : "todo";
                return (
                  <li key={part.domain}>
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
                <span className="screening__label">Screening questions</span>
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
              const value = answers[question.id];
              const unanswered = missing && typeof value !== "number";
              return (
                <fieldset
                  key={question.id}
                  className="portal-question screening__question"
                >
                  <legend className="portal-question__head">
                    {role === "TEACHER" ? (
                      <span className="portal-qtag">Q{number}</span>
                    ) : (
                      <span className="screening__num">{number}.</span>
                    )}
                    <span>
                      {parentWording ? question.parent : question.teacher}
                    </span>
                  </legend>
                  <div className="ui-choices">
                    {question.options.map((option) => {
                      const checked = value === option.value;
                      return (
                        <label
                          key={option.label}
                          className={
                            checked
                              ? "ui-choice ui-choice--checked"
                              : "ui-choice"
                          }
                        >
                          <input
                            type="radio"
                            name={question.id}
                            className="visually-hidden"
                            checked={checked}
                            onChange={() => {
                              setAnswers((current) => ({
                                ...current,
                                [question.id]: option.value,
                              }));
                              setMissing(false);
                            }}
                          />
                          <span className="ui-choice__dot" aria-hidden="true" />
                          {option.label}
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
