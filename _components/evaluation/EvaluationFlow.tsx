"use client";

import { Check, ClipboardList } from "lucide-react";
import { useMemo, useState } from "react";

import { errorMessage } from "@/lib/api";
import {
  evaluationIsOpen,
  submitEvaluation,
  weeksElapsed,
  type EvaluationData,
  type IEP,
} from "@/lib/evaluation-flow";
import { formatDay } from "@/lib/format";
import type { ResponderRole } from "@/lib/evaluation";
import { useMediaQuery } from "../hooks";
import Button, { ButtonLink } from "../ui/Button";
import { Alert, Empty, IconBadge, LockedCard, Note } from "../ui/bits";
import FaceScale from "./FaceScale";
import "../portal.css";
import "./evaluation.css";

type Step = "intro" | "questions" | "confirm" | "done";

export default function EvaluationFlow({
  role,
  iep,
  data,
  responderId,
  doneHref,
  doneLabel,
  reviewHref,
}: {
  role: ResponderRole;
  iep: IEP;
  data: EvaluationData;
  responderId: string;
  doneHref: string;
  doneLabel: string;
  reviewHref?: string;
}) {
  const desktop = useMediaQuery("(min-width: 1000px)");
  const already =
    data.mine.length > 0 && data.mine.length >= data.questions.length;
  const initial = useMemo(
    () =>
      Object.fromEntries(data.mine.map((r) => [r.eval_question_id, r.score])),
    [data.mine],
  );
  const [answers, setAnswers] = useState<Record<string, number>>(initial);
  const [step, setStep] = useState<Step>(
    already ? "done" : role === "PARENT" ? "intro" : "questions",
  );
  const [index, setIndex] = useState(0);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bothDone, setBothDone] = useState(false);

  if (!evaluationIsOpen(iep)) {
    const { week, total } = weeksElapsed(iep);
    return (
      <LockedCard
        title={
          iep.evaluation_unlock_date
            ? `Opens on ${formatDay(iep.evaluation_unlock_date)}`
            : "Not open yet"
        }
        text={
          iep.status === "ACTIVE"
            ? "The questions unlock six weeks after the plan was approved."
            : "The 6-week check opens six weeks after the plan is approved."
        }
        week={iep.status === "ACTIVE" ? week : undefined}
        total={iep.status === "ACTIVE" ? total : undefined}
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

  const perPage = desktop ? 2 : 1;
  const start = Math.floor(index / perPage) * perPage;
  const page = data.questions.slice(start, start + perPage);
  const last = start + perPage >= data.questions.length;

  function next() {
    if (page.some((q) => answers[q.eval_question_id] === undefined)) {
      setMissing(true);
      return;
    }
    setMissing(false);
    if (last) setStep("confirm");
    else setIndex(start + perPage);
    window.scrollTo({ top: 0 });
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const result = await submitEvaluation({
        iep,
        questions: data.questions,
        existing: data.mine,
        answers,
        responderId,
        role,
      });
      setBothDone(result.bothDone);
      setStep("done");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (step === "intro") {
    return (
      <section className="evaluation__center">
        <IconBadge>
          <ClipboardList size={36} strokeWidth={1.6} />
        </IconBadge>
        <h2 className="evaluation__title">Your evaluation</h2>
        <p>
          Help us understand your child&apos;s progress and development at home.
        </p>
        <p className="evaluation__red">
          Your answers go straight to your child&apos;s teacher.
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
          You have answered all {data.questions.length} questions. Press Submit
          to send your answers{role === "PARENT" ? " to the teacher" : ""}.
        </p>
        {error && <Alert>{error}</Alert>}
        <div className="ui-actions">
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
          Your responses have been saved successfully.
          {bothDone
            ? " Both of you are done, so this case is now complete."
            : ""}
        </p>
        <div className="ui-actions evaluation__done-actions">
          {reviewHref && (
            <Button
              onClick={() => {
                setIndex(0);
                setStep("questions");
              }}
            >
              View evaluation
            </Button>
          )}
          <ButtonLink href={doneHref} variant="outline">
            {doneLabel}
          </ButtonLink>
        </div>
      </section>
    );
  }

  return (
    <div className="evaluation">
      <div className="evaluation__progress" aria-label="Questions covered">
        <span className="evaluation__progress-label">Questions covered</span>
        <ol className="evaluation__dots">
          {data.questions.map((q, i) => {
            const answered = answers[q.eval_question_id] !== undefined;
            const current = i >= start && i < start + perPage;
            return (
              <li
                key={q.eval_question_id}
                className={`evaluation__dot${answered ? " evaluation__dot--done" : ""}${current ? " evaluation__dot--current" : ""}`}
              >
                {answered && !current ? (
                  <Check size={12} strokeWidth={3} />
                ) : (
                  i + 1
                )}
              </li>
            );
          })}
        </ol>
      </div>

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
            showLabels={desktop}
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

      {role === "TEACHER" && (
        <Note>
          The parent answers the same questions. The case finishes when you are
          both done.
        </Note>
      )}

      <div className="ui-actions ui-actions--split">
        <Button
          variant="outline"
          onClick={() =>
            start === 0
              ? setStep(role === "PARENT" ? "intro" : "questions")
              : setIndex(start - perPage)
          }
          disabled={start === 0 && role === "TEACHER"}
        >
          ← Back
        </Button>
        <Button onClick={next}>Next →</Button>
      </div>
    </div>
  );
}
