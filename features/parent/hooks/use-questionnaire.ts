"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnswerPayload, QuestionnaireSession } from "../types";

export type QuestionnairePhase = "answering" | "confirm" | "done";

interface Options<Q extends { id: string }, A> {
  start: () => Promise<QuestionnaireSession<Q, A>>;
  sendAnswer: (sessionId: string, payload: AnswerPayload<A>) => Promise<void>;
  complete: (sessionId: string) => Promise<void>;
  pageSize: number;
  autoStart?: boolean;
  confirmBeforeSubmit?: boolean;
}

const errorText = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export function useQuestionnaire<Q extends { id: string }, A>({
  start,
  sendAnswer,
  complete,
  pageSize,
  autoStart = true,
  confirmBeforeSubmit = false,
}: Options<Q, A>) {
  const [session, setSession] = useState<QuestionnaireSession<Q, A> | null>(
    null,
  );
  const [answers, setAnswers] = useState<Record<string, A>>({});
  const saved = useRef<Record<string, A>>({});

  const [started, setStarted] = useState(autoStart);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<QuestionnairePhase>("answering");
  const [loading, setLoading] = useState(autoStart);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (isInitialMount = false) => {
      if (!isInitialMount) {
        setLoading(true);
      }
      setError(null);
      try {
        const loaded = await start();
        saved.current = { ...(loaded.answers ?? {}) };
        setAnswers({ ...(loaded.answers ?? {}) });
        setStep(0);
        setPhase("answering");
        setSession(loaded);
      } catch (err) {
        setError(errorText(err, "Could not load the questions."));
      } finally {
        setLoading(false);
      }
    },
    [start],
  );

  useEffect(() => {
    if (autoStart) {
      void run(true);
    }
  }, [autoStart, run]);

  const begin = () => {
    setStarted(true);
    void run(false);
  };

  const questions = useMemo(() => session?.questions ?? [], [session]);
  const totalQuestions = questions.length;
  const totalSteps = Math.max(1, Math.ceil(totalQuestions / pageSize));
  const safeStep = Math.min(step, totalSteps - 1);
  const firstIndex = safeStep * pageSize;
  const pageQuestions = useMemo(
    () => questions.slice(firstIndex, firstIndex + pageSize),
    [questions, firstIndex, pageSize],
  );
  const isLast = safeStep >= totalSteps - 1;
  const canContinue =
    pageQuestions.length > 0 &&
    pageQuestions.every((q) => answers[q.id] !== undefined);

  const select = (questionId: string, answer: A) =>
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));

  const finish = async () => {
    if (!session) return;
    await complete(session.sessionId);
    setPhase("done");
  };

  const next = async () => {
    if (!session || !canContinue || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      for (const question of pageQuestions) {
        const answer = answers[question.id];
        if (saved.current[question.id] === answer) continue;
        await sendAnswer(session.sessionId, {
          questionId: question.id,
          answer,
        });
        saved.current[question.id] = answer;
      }
      if (!isLast) setStep(safeStep + 1);
      else if (confirmBeforeSubmit) setPhase("confirm");
      else await finish();
    } catch (err) {
      setError(errorText(err, "Could not save your answer. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await finish();
    } catch (err) {
      setError(errorText(err, "Could not submit. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const back = () => {
    setError(null);
    if (phase === "confirm") setPhase("answering");
    else setStep((s) => Math.max(0, s - 1));
  };

  return {
    // state
    started,
    loading,
    submitting,
    error,
    phase,
    // questions
    questions,
    pageQuestions,
    answers,
    totalQuestions,
    // position
    step: safeStep,
    totalSteps,
    isLast,
    firstQuestionNumber: firstIndex + 1,
    lastQuestionNumber: firstIndex + pageQuestions.length,
    progress: totalQuestions
      ? (firstIndex + pageQuestions.length) / totalQuestions
      : 0,
    canContinue,
    begin,
    reload: begin,
    select,
    next,
    back,
    submit,
  };
}
