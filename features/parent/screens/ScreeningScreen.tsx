"use client";

import { CheckCircleIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ErrorMessage, Loading } from "@/components/ui/StateMessage";
import { parentApi } from "../api";
import { AnswerOption } from "../components/AnswerOption";
import { StatusScreen } from "../components/StatusScreen";
import { useQuestionnaire } from "../hooks/use-questionnaire";
import type { ScreeningQuestion } from "../types";

export function ScreeningScreen() {
  const q = useQuestionnaire<ScreeningQuestion, string>({
    start: parentApi.startScreening,
    sendAnswer: parentApi.saveScreeningAnswer,
    complete: parentApi.completeScreening,
    pageSize: 1,
  });

  if (q.phase === "done") {
    return (
      <>
        <PageHeader title="Screening completed" hideOnDesktop />
        <div className="page-body">
          <StatusScreen
            icon={<CheckCircleIcon size={34} />}
            title="Screening completed!"
            description="Thank you for completing the screening. Your responses have been submitted."
            actionsRow
            actions={
              <>
                <Button href="/parent/reports">View reports</Button>
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

  const header = <PageHeader title="Screening" />;

  if (q.loading) {
    return (
      <>
        {header}
        <div className="page-body">
          <Loading text="Loading questions…" />
        </div>
      </>
    );
  }
  if (q.error && q.questions.length === 0) {
    return (
      <>
        {header}
        <div className="page-body">
          <ErrorMessage message={q.error} onRetry={q.reload} />
        </div>
      </>
    );
  }
  if (q.questions.length === 0) {
    return (
      <>
        {header}
        <div className="page-body">
          <p className="subtle">
            There are no screening questions available yet.
          </p>
        </div>
      </>
    );
  }

  const question = q.pageQuestions[0];
  const number = q.firstQuestionNumber;
  const answer = q.answers[question.id];

  return (
    <>
      {header}
      <div className="page-body">
        <div className="q-wrap">
          <ProgressBar
            label={`Question ${number} of ${q.totalQuestions}`}
            progress={q.progress}
          />

          {question.encouragement && (
            <p className="q-encourage">{question.encouragement}</p>
          )}
          <h2 className="q-text">
            {number}. {question.text}
          </h2>

          <div className="answers" role="radiogroup" aria-label={question.text}>
            {question.options.map((option) => (
              <AnswerOption
                key={option.id}
                label={option.label}
                selected={answer === option.id}
                onSelect={() => q.select(question.id, option.id)}
              />
            ))}
          </div>

          {q.error && (
            <p className="form-error" role="alert" style={{ marginTop: 16 }}>
              {q.error}
            </p>
          )}

          <div className="q-actions">
            {q.step > 0 && (
              <Button
                variant="outline"
                onClick={q.back}
                disabled={q.submitting}
              >
                Back
              </Button>
            )}
            <Button
              onClick={q.next}
              disabled={!q.canContinue}
              loading={q.submitting}
            >
              {q.isLast ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
