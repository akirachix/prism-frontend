"use client";

import { Hourglass } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { errorMessage } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import {
  anchorQuestions,
  anchorsDone,
  ensureAssessment,
  GETTING_STARTED,
  loadPlanned,
  partsFromPlan,
  saveAnswers,
  saveScreening,
  stepOf,
  type Answers,
  type MyScreening,
  type ResponderRole,
} from "@/lib/screening";
import Button, { ButtonLink } from "../ui/Button";
import { Alert, PageHeader, ProgressBar } from "../ui/bits";
import ScreeningFlow from "./ScreeningFlow";
import "../portal.css";
import "./screening.css";

interface Props {
  role: ResponderRole;
  caseId: string;
  responderId: string;
  childName: string;
  initial: MyScreening;
  exitHref: string;
  exitLabel: string;
  doneHref: string;
}

export default function ScreeningJourney(props: Props) {
  const { role, caseId, responderId, childName, exitHref, doneHref } = props;
  const isParent = role === "PARENT";
  const router = useRouter();
  const [screening, setScreening] = useState<MyScreening>(props.initial);
  const [answers, setAnswers] = useState<Answers>(props.initial.answers);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [showNext, setShowNext] = useState(() => {
    const plan = props.initial.plan;
    if (!plan || props.initial.assessment?.completed_at) return false;
    if (!isParent && !anchorsDone(plan, props.initial.answers)) return false;
    return plan.sections.every((section) => section.answered === 0);
  });

  const step = stepOf(screening);

  useEffect(() => {
    if (step === "done") router.replace(doneHref);
  }, [step, doneHref, router]);

  async function reload() {
    const assessment =
      screening.assessment ??
      (await ensureAssessment(caseId, role, responderId));
    const planned = await loadPlanned(assessment);
    setScreening({ assessment, ...planned });
    setAnswers(planned.answers);
    return planned;
  }

  async function start() {
    setBusy(true);
    setError(null);
    try {
      await reload();
      if (isParent) setShowNext(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const anchors = screening.plan
    ? anchorQuestions(screening.plan, screening.questions)
    : [];
  const anchorAnswered = anchors.filter(
    (q) => typeof answers[q.question_id] === "number",
  ).length;

  async function saveAnchors(exit: boolean) {
    if (!screening.assessment) return;
    if (!exit && anchorAnswered < anchors.length) {
      setMissing(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const picked: Answers = {};
      for (const q of anchors) {
        if (typeof answers[q.question_id] === "number") {
          picked[q.question_id] = answers[q.question_id];
        }
      }
      await saveAnswers(screening.assessment.assessment_id, picked);
      if (exit) {
        router.push(exitHref);
        return;
      }
      await reload();
      setShowNext(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const header = (
    <PageHeader
      title={`Screening for ${childName}`}
      back={{ href: exitHref, label: props.exitLabel }}
    />
  );

  if (step === "done") return null;

  if (step === "start") {
    return (
      <main className="ui-page">
        {header}
        <div className="ui-body screening-page screening-journey">
          {isParent ? (
            <section className="ui-card screening-journey__intro">
              <h2 className="ui-section-title">
                A few questions about {childName}
              </h2>
              <p>
                {childName}’s teacher answers some questions first. From those
                answers we choose only the areas that matter, so you answer
                fewer questions.
              </p>
            </section>
          ) : (
            <>
              <section className="ui-card screening-journey__intro">
                <span className="screening-journey__step">Step 1 of 2</span>
                <h2 className="ui-section-title">First, 3 quick questions</h2>
                <p>
                  They help us choose which questions are right for {childName},
                  for you and for the parent.
                </p>
              </section>
              <ol className="screening-journey__parts">
                <li className="screening-journey__part screening-journey__part--now">
                  <span className="screening-journey__dot">1</span>
                  <span>
                    <strong>{GETTING_STARTED}</strong>
                    <span>3 questions</span>
                  </span>
                </li>
                <li className="screening-journey__part">
                  <span className="screening-journey__dot">2</span>
                  <span>
                    <strong>Questions about {childName}</strong>
                    <span>Chosen from your answers to step 1</span>
                  </span>
                </li>
              </ol>
            </>
          )}
          {error && <Alert>{error}</Alert>}
          <div className="screening-journey__go">
            <Button onClick={start} loading={busy} block={isParent}>
              Start
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (step === "anchors") {
    return (
      <main className="ui-page">
        {header}
        <div className="ui-body screening-page screening-journey">
          <div className="screening-journey__head">
            <span className="screening-journey__step">
              {GETTING_STARTED} · step 1 of 2
            </span>
            <ProgressBar
              value={anchorAnswered}
              max={anchors.length}
              label="Getting started questions answered"
            />
            <span className="screening-journey__count">
              {anchorAnswered} of {anchors.length} answered
            </span>
          </div>

          <ol className="screening-journey__anchors">
            {anchors.map((question, i) => {
              const value = answers[question.question_id];
              const unanswered = missing && typeof value !== "number";
              return (
                <li key={question.question_id}>
                  <fieldset className="portal-question screening__question">
                    <legend className="portal-question__head">
                      <span className="screening__num">{i + 1}.</span>
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
                            <span
                              className="ui-choice__dot"
                              aria-hidden="true"
                            />
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
                </li>
              );
            })}
          </ol>

          {error && <Alert>{error}</Alert>}
          <div className="ui-actions ui-actions--split">
            <Button
              variant="outline"
              onClick={() => saveAnchors(true)}
              disabled={busy}
            >
              Save and exit
            </Button>
            <Button onClick={() => saveAnchors(false)} loading={busy}>
              Next →
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (step === "waiting") {
    return (
      <main className="ui-page">
        {header}
        <div className="ui-body screening-page">
          <section className="portal-result" aria-live="polite">
            <Hourglass size={48} aria-hidden="true" />
            <h2 className="portal-result__title">Your questions open soon</h2>
            <p>
              {childName}’s teacher answers a few questions first. As soon as
              they have, your questions open here.
            </p>
            <div className="ui-actions">
              <ButtonLink href={exitHref} variant="outline">
                {props.exitLabel}
              </ButtonLink>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const parts = screening.plan
    ? partsFromPlan(screening.plan, screening.questions)
    : [];
  const skipped = (screening.plan?.unavailable_tools.length ?? 0) > 0;

  async function finishNow() {
    setBusy(true);
    setError(null);
    try {
      await saveScreening({
        caseId,
        role,
        responderId,
        assessment: screening.assessment,
        answers: {},
        finish: true,
      });
      logAudit("SUBMIT", "screening", caseId, { role });
      router.push(doneHref);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (parts.length === 0) {
    return (
      <main className="ui-page">
        {header}
        <div className="ui-body screening-page">
          <section className="portal-result">
            <h2 className="portal-result__title">That is everything</h2>
            <p>
              {isParent
                ? `${childName}’s teacher’s first answers showed that no more questions are needed.`
                : `Your first answers showed that no more questions are needed for ${childName}.`}{" "}
              Finish to send your answers.
            </p>
            {error && <Alert>{error}</Alert>}
            <div className="ui-actions">
              <Button onClick={finishNow} loading={busy}>
                Finish
              </Button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (showNext) {
    return (
      <main className="ui-page">
        {header}
        <div className="ui-body screening-page screening-journey">
          {!isParent && (
            <span className="screening-journey__step">Step 2 of 2</span>
          )}
          <h2 className="ui-section-title">
            Here is what we will ask about {childName}
          </h2>
          <ol className="screening-journey__parts">
            {parts.map((part, i) => (
              <li
                key={`${part.tool}-${i}`}
                className={
                  i === 0
                    ? "screening-journey__part screening-journey__part--now"
                    : "screening-journey__part"
                }
              >
                <span className="screening-journey__dot">{i + 1}</span>
                <span>
                  <strong>{part.title}</strong>
                  <span>{part.questions.length} questions</span>
                </span>
              </li>
            ))}
          </ol>
          {skipped && (
            <p className="screening-journey__note">
              {isParent
                ? `${childName}’s teacher’s first answers showed that some areas need no more questions, so we left them out.`
                : "Your first answers showed that some areas need no more questions, so we left them out."}
            </p>
          )}
          <div className="screening-journey__go">
            <Button onClick={() => setShowNext(false)} block={isParent}>
              Continue
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <ScreeningFlow
      role={role}
      caseId={caseId}
      parts={parts}
      assessment={screening.assessment}
      saved={answers}
      responderId={responderId}
      title={childName}
      exitHref={exitHref}
      doneHref={doneHref}
    />
  );
}
