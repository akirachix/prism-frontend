"use client";

import { Check, ClipboardList } from "lucide-react";
import { useState } from "react";

import { errorMessage } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import {
  submitEvaluation,
  updateCaseAfterSubmit,
  type EvaluationData,
} from "@/lib/evaluation-flow";
import type { ResponderRole } from "@/lib/evaluations";
import { formatLongDay } from "@/lib/format";
import { weeksElapsed, type IEP } from "@/lib/ieps";
import Button, { ButtonLink } from "../ui/Button";
import {
  Alert,
  Empty,
  IconBadge,
  LockedCard,
  Note,
  ProgressBar,
} from "../ui/bits";
import FaceScale from "./FaceScale";
import LockNotice from "./LockNotice";
import "../portal.css";
import "./evaluation.css";

/** "review" shows the answers that were already sent; nothing can be edited. */
type Step = "intro" | "questions" | "confirm" | "done" | "review";

const QUESTIONS_PER_SCREEN = 2;

/**
 * The 6-week check, the same for the teacher and the parent: an intro, two
 * questions per screen, a confirmation, then the answers are locked for six
 * weeks. All answers are sent in one request.
 */
export default function EvaluationFlow({
  role,
  iep,
  data,
  childName,
  doneHref,
  doneLabel,
  onSubmitted,
}: {
  role: ResponderRole;
  iep: IEP;
  data: EvaluationData;
  /** The child's first name, for the teacher's wording. */
  childName?: string;
  doneHref: string;
  doneLabel: string;
  /** Called once the answers are saved, so the page can refresh its data. */
  onSubmitted?: () => void;
}) {
  const [round, setRound] = useState(data.round);
  const [answers, setAnswers] = useState<Record<string, number>>(() =>
    Object.fromEntries(data.mine.map((r) => [r.eval_question_id, r.score])),
  );
  const [step, setStep] = useState<Step>(
    data.round.status === "LOCKED" ? "review" : "intro",
  );
  const [index, setIndex] = useState(0);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Answers saved is one thing; the case being updated is another.
  const [caseProblem, setCaseProblem] = useState<string | null>(null);
  const [caseDone, setCaseDone] = useState(false);
  const [retryingCase, setRetryingCase] = useState(false);

  const readOnly = step === "review";
  const child = childName ?? "the child";
  const otherParty =
    role === "PARENT" ? "your child's teacher" : `${child}'s parent`;

  if (round.status === "NOT_APPROVED" || round.status === "NOT_OPEN") {
    const opensAt = round.opens_at ?? iep.evaluation_unlock_date;
    const { week, total } = weeksElapsed(iep);
    const approved = iep.status === "ACTIVE" && Boolean(iep.approved_at);
    return (
      <LockedCard
        title={opensAt ? `Opens on ${formatLongDay(opensAt)}` : "Not open yet"}
        text={
          approved
            ? `The questions unlock six weeks after the plan was approved (${formatLongDay(iep.approved_at)}). We will remind you here.`
            : "The 6-week check opens six weeks after the plan is approved by the school administrator and the teacher."
        }
        week={approved ? week : undefined}
        total={approved ? total : undefined}
      />
    );
  }

  if (data.questions.length === 0) {
    return (
      <Empty>
        The questions for this check are not ready yet. Please come back later.
      </Empty>
    );
  }

  const total = data.questions.length;
  const start = Math.floor(index / QUESTIONS_PER_SCREEN) * QUESTIONS_PER_SCREEN;
  const page = data.questions.slice(start, start + QUESTIONS_PER_SCREEN);
  const last = start + QUESTIONS_PER_SCREEN >= total;
  const hadAnswersBefore = data.mine.length > 0;

  function next() {
    if (
      !readOnly &&
      page.some((q) => answers[q.eval_question_id] === undefined)
    ) {
      setMissing(true);
      return;
    }
    setMissing(false);
    if (last) setStep("confirm");
    else setIndex(start + QUESTIONS_PER_SCREEN);
    window.scrollTo({ top: 0 });
  }

  function back() {
    if (start === 0) {
      if (!readOnly) setStep("intro");
      return;
    }
    setIndex(start - QUESTIONS_PER_SCREEN);
    window.scrollTo({ top: 0 });
  }

  function applyCaseResult(
    result: Awaited<ReturnType<typeof updateCaseAfterSubmit>>,
  ) {
    if (result.ok) {
      setCaseDone(result.bothDone && result.changed);
      setCaseProblem(null);
    } else {
      setCaseDone(false);
      setCaseProblem(result.message);
    }
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const result = await submitEvaluation({
        iep,
        questions: data.questions,
        answers,
        role,
      });
      logAudit("SUBMIT", "iep_evaluation", iep.iep_id, { role });
      setRound(result.round);
      applyCaseResult(result.caseUpdate);
      setStep("done");
      onSubmitted?.();
    } catch (err) {
      // Nothing was saved, so pressing Submit again is safe.
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function retryCaseUpdate() {
    setRetryingCase(true);
    applyCaseResult(
      await updateCaseAfterSubmit({ iep, questions: data.questions, role }),
    );
    setRetryingCase(false);
  }

  if (step === "intro") {
    return (
      <section className="evaluation__center">
        <IconBadge>
          <ClipboardList size={36} strokeWidth={1.6} />
        </IconBadge>
        <h2 className="evaluation__title">Your evaluation</h2>
        <p>
          {role === "PARENT"
            ? "Help us understand your child's progress and development at home."
            : `Help us understand ${child}'s progress and development at school.`}
        </p>
        {hadAnswersBefore && (
          <p>
            Your answers from last time are filled in. Change anything that is
            different now.
          </p>
        )}
        <p className="evaluation__red">
          Your answers go straight to {otherParty}.
        </p>
        <Button
          onClick={() => setStep("questions")}
          block
          className="evaluation__wide"
        >
          Start evaluation
        </Button>
      </section>
    );
  }

  if (step === "confirm") {
    return (
      <section className="evaluation__center">
        <h2 className="evaluation__title">Confirm your submission</h2>
        <p>
          You have answered all {total} questions. Press Submit to send your
          answers to {otherParty}. After that they are locked for six weeks.
        </p>
        {error && (
          <div className="evaluation__notice">
            <Alert>
              {error} Your answers were not saved. Please try again.
            </Alert>
          </div>
        )}
        <div className="ui-actions evaluation__confirm-actions">
          <Button
            variant="outline"
            onClick={() => setStep("questions")}
            disabled={saving}
          >
            ← Back
          </Button>
          <Button onClick={submit} loading={saving}>
            {saving ? "Submitting…" : "Submit"}
          </Button>
        </div>
      </section>
    );
  }

  if (step === "done") {
    return (
      <section className="evaluation__center">
        <IconBadge>
          <Check size={40} strokeWidth={2} />
        </IconBadge>
        <h2 className="evaluation__title">
          Congratulations!
          <br />
          You have completed the evaluation
        </h2>
        <p>
          Your answers were saved and sent to {otherParty}.
          {caseDone ? " You are both done, so this case is now complete." : ""}
        </p>
        {round.locked_until && (
          <p className="evaluation__muted">
            The next 6-week check opens on {formatLongDay(round.locked_until)}.
          </p>
        )}
        {caseProblem && (
          <div className="evaluation__notice">
            <Alert tone="warning">
              <strong>Your answers are saved,</strong> but we could not update
              the case just now ({caseProblem}). The case is not marked as
              complete yet.{" "}
              <Button
                variant="link"
                onClick={retryCaseUpdate}
                loading={retryingCase}
              >
                Try again
              </Button>
            </Alert>
          </div>
        )}
        <div className="ui-actions evaluation__done-actions">
          <Button
            onClick={() => {
              setIndex(0);
              setStep("review");
            }}
          >
            View evaluation
          </Button>
          <ButtonLink href={doneHref} variant="outline">
            {doneLabel}
          </ButtonLink>
        </div>
      </section>
    );
  }

  return (
    <div className="evaluation">
      {readOnly && round.locked_until && (
        <LockNotice
          lockedUntil={round.locked_until}
          lastSubmittedAt={round.last_submitted_at}
        />
      )}

      <div className="evaluation__progress">
        <span className="evaluation__progress-label">
          Evaluation questions · {Math.min(start + QUESTIONS_PER_SCREEN, total)}{" "}
          of {total}
        </span>
        <ProgressBar
          value={Math.min(start + QUESTIONS_PER_SCREEN, total)}
          max={total}
          label="Questions covered"
        />
      </div>

      <div className="evaluation__questions">
        {page.map((question, offset) => (
          <section key={question.eval_question_id} className="portal-question">
            <h2 className="portal-question__head">
              <span className="portal-qtag">Q{start + offset + 1}</span>
              <span>{question.question_text}</span>
            </h2>
            <FaceScale
              name={question.eval_question_id}
              legend={question.question_text}
              value={answers[question.eval_question_id]}
              disabled={readOnly}
              onChange={(score) => {
                setAnswers((current) => ({
                  ...current,
                  [question.eval_question_id]: score,
                }));
                setMissing(false);
              }}
            />
            {missing && answers[question.eval_question_id] === undefined && (
              <p className="ui-field__error">Choose a face to continue.</p>
            )}
          </section>
        ))}
      </div>

      {role === "TEACHER" && !readOnly && (
        <Note>
          The parent answers the same questions at home. Each of you sees the
          other&apos;s answers as a report.
        </Note>
      )}

      <div className="ui-actions ui-actions--split">
        <Button
          variant="outline"
          onClick={back}
          disabled={start === 0 && readOnly}
        >
          ← Back
        </Button>
        {readOnly && last ? (
          <ButtonLink href={doneHref}>{doneLabel}</ButtonLink>
        ) : (
          <Button onClick={next}>Next →</Button>
        )}
      </div>
    </div>
  );
}
