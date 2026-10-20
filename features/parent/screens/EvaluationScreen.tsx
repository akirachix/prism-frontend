"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CheckCircleIcon, ClipboardIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ErrorMessage } from "@/components/ui/StateMessage";
import { parentApi } from "../api";
import { RatingScale } from "../components/RatingScale";
import { StatusScreen } from "../components/StatusScreen";
import { useQuestionnaire } from "../hooks/use-questionnaire";
import { navLock } from "../nav-lock";
import type { EvaluationQuestion } from "../types";

/**
 * Parent evaluation: intro -> questions (2 per page) -> confirm -> saved.
 * Questions come from the IEP's evaluation questions; every answer is saved
 * as an evaluation response when "Next" is pressed (see parentApi.startEvaluation).
 */
export function EvaluationScreen() {
  const router = useRouter();
  const q = useQuestionnaire<EvaluationQuestion, number>({
    start: parentApi.startEvaluation,
    sendAnswer: parentApi.saveEvaluationAnswer,
    complete: parentApi.completeEvaluation,
    pageSize: 2,
    autoStart: false, // the questions are fetched when the parent presses "Start"
    confirmBeforeSubmit: true,
  });

  const inProgress = q.started && !q.loading && q.questions.length > 0 && q.phase !== "done";

  // Lock the other nav items while the parent is answering.
  useEffect(() => {
    navLock.set(inProgress);
    return () => navLock.set(false);
  }, [inProgress]);

  if (q.phase === "done") {
    return (
      <>
        <PageHeader title="Evaluation saved" hideOnDesktop />
        <div className="page-body">
          <StatusScreen
            icon={<CheckCircleIcon size={34} />}
            title="Evaluation saved!"
            description="Your responses have been saved successfully."
            actionsRow
            actions={
              <>
                <Button href="/parent/reports">View evaluation</Button>
                <Button href="/parent/dashboard" variant="outline">
                  Back to dashboard
                </Button>
              </>
            }
          />
        </div>
      </>
    );
  }

  // Intro (before the questions are fetched), also shows a load error.
  if (!q.started || q.loading || (q.error && q.questions.length === 0)) {
    return (
      <>
        <PageHeader title="Your evaluation" />
        <div className="page-body">
          <StatusScreen
            icon={<ClipboardIcon size={34} />}
            title="Your evaluation"
            description="Help us understand your child's progress and development."
            actions={
              <Button onClick={q.begin} loading={q.loading}>
                Start evaluation
              </Button>
            }
          />
          {q.error && <ErrorMessage message={q.error} onRetry={q.begin} />}
        </div>
      </>
    );
  }

  if (q.questions.length === 0) {
    return (
      <>
        <PageHeader title="Your evaluation" />
        <div className="page-body">
          <p className="subtle">There are no evaluation questions available yet.</p>
        </div>
      </>
    );
  }

  if (q.phase === "confirm") {
    return (
      <>
        <PageHeader title="Confirm your submission" onBack={q.back} />
        <div className="page-body">
          <StatusScreen
            icon={<ClipboardIcon size={34} />}
            title="Confirm your submission"
            description={`You have answered all ${q.totalQuestions} questions. Submit to finish your evaluation.`}
            actions={
              <>
                <Button onClick={q.submit} loading={q.submitting}>
                  Submit
                </Button>
                <Button variant="outline" onClick={q.back} disabled={q.submitting}>
                  Review answers
                </Button>
              </>
            }
          />
          {q.error && (
            <p className="form-error" role="alert">
              {q.error}
            </p>
          )}
        </div>
      </>
    );
  }

  const range =
    q.firstQuestionNumber === q.lastQuestionNumber
      ? `Question ${q.firstQuestionNumber}`
      : `Questions ${q.firstQuestionNumber}–${q.lastQuestionNumber}`;

  return (
    <>
      <PageHeader title="Your evaluation" onBack={q.step > 0 ? q.back : () => router.push("/parent/dashboard")} />
      <div className="page-body">
        <div className="q-wrap">
          <ProgressBar label={`${range} of ${q.totalQuestions}`} progress={q.progress} />

          {q.pageQuestions.map((question, index) => (
            <RatingScale
              key={question.id}
              number={q.firstQuestionNumber + index}
              question={question}
              value={q.answers[question.id]}
              onChange={(value) => q.select(question.id, value)}
            />
          ))}

          {q.error && (
            <p className="form-error" role="alert">
              {q.error}
            </p>
          )}

          <div className="q-actions">
            {q.step > 0 && (
              <Button variant="outline" onClick={q.back} disabled={q.submitting}>
                Back
              </Button>
            )}
            <Button onClick={q.next} disabled={!q.canContinue} loading={q.submitting}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
