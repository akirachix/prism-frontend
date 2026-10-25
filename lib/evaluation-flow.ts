import { errorMessage } from "@/lib/api";
import { casesApi } from "@/lib/cases";
import type { StudentStatus } from "@/lib/classroom";
import {
  evaluationsApi,
  type EvaluationQuestion,
  type EvaluationResponse,
  type EvaluationRound,
  type ResponderRole,
} from "@/lib/evaluations";
import { currentIep, iepsApi, type IEP } from "@/lib/ieps";
import { FINISHED_STATUSES } from "@/lib/types";

/** The evaluation has at most five questions. */
export const EVALUATION_QUESTION_COUNT = 5;

/** After answers are sent, they stay locked for six weeks. */
export const LOCK_DAYS = 42;

const DAY = 24 * 60 * 60 * 1000;

/**
 * The plan being evaluated: the ACTIVE plan, even while a newer version is
 * still a draft or waiting for approval. Otherwise the newest live plan.
 */
export function evaluatedIep(ieps: IEP[]): IEP | null {
  const active = ieps.filter((plan) => plan.status === "ACTIVE");
  if (active.length > 0) {
    return [...active].sort((a, b) => b.version_number - a.version_number)[0];
  }
  return currentIep(ieps);
}

/** The case's plan for the 6-week check, if any. */
export async function planForCase(caseId: string): Promise<IEP | null> {
  return evaluatedIep(await iepsApi.list({ case_id: caseId, limit: 50 }));
}

/**
 * The timer after answers are sent: whole days left until they can be
 * changed again, and how many of the 42 days have passed.
 */
export function lockCountdown(lockedUntil: string, now = new Date()) {
  const remaining = new Date(lockedUntil).getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(remaining / DAY));
  const elapsedDays = Math.min(LOCK_DAYS, Math.max(0, LOCK_DAYS - daysLeft));
  return { daysLeft, elapsedDays, totalDays: LOCK_DAYS };
}

export interface EvaluationData {
  round: EvaluationRound;
  questions: EvaluationQuestion[];
  mine: EvaluationResponse[];
}

/**
 * Load the evaluation for whoever is signed in. The server says whether it
 * is not open yet, open, or locked after an earlier submission.
 */
export async function loadEvaluation(iep: IEP): Promise<EvaluationData> {
  const round = await evaluationsApi.current(iep.iep_id);
  const questions = [...round.questions]
    .sort((a, b) => a.position - b.position)
    .slice(0, EVALUATION_QUESTION_COUNT);
  const ids = new Set(questions.map((q) => q.eval_question_id));
  return {
    round,
    questions,
    mine: round.my_responses.filter((r) => ids.has(r.eval_question_id)),
  };
}

export type CaseUpdateResult =
  | { ok: true; bothDone: boolean; changed: boolean }
  | { ok: false; message: string };

/**
 * Move the case on after the teacher's answers: it is COMPLETED once the
 * teacher and the parent have both answered every question. Only teachers
 * may change a case, so a parent's submission never tries. This is separate
 * from saving the answers, so a failure is reported and can be tried again.
 */
export async function updateCaseAfterSubmit(params: {
  iep: IEP;
  questions: EvaluationQuestion[];
  role: ResponderRole;
}): Promise<CaseUpdateResult> {
  const { iep, questions, role } = params;
  if (role !== "TEACHER") return { ok: true, bothDone: false, changed: false };
  try {
    const theirs = await Promise.all(
      questions.map((q) =>
        evaluationsApi.responses({
          eval_question_id: q.eval_question_id,
          responder_role: "PARENT",
        }),
      ),
    );
    const bothDone = theirs.every((list) => list.length > 0);
    const caseItem = await casesApi.get(iep.case_id);
    const next = bothDone ? "COMPLETED" : "EVALUATION_PENDING";
    const finished = FINISHED_STATUSES.includes(caseItem.status);
    if (finished || caseItem.status === next) {
      return { ok: true, bothDone, changed: false };
    }
    await casesApi.update(iep.case_id, { status: next });
    return { ok: true, bothDone, changed: true };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

/**
 * Send this person's answers in one request (they are saved together, so a
 * retry never repeats answers), then update the case.
 * If sending the answers fails this throws and nothing was saved.
 * If only the case update fails, the answers are saved and `caseUpdate`
 * says what went wrong.
 */
export async function submitEvaluation(params: {
  iep: IEP;
  questions: EvaluationQuestion[];
  answers: Record<string, number>;
  role: ResponderRole;
}): Promise<{ round: EvaluationRound; caseUpdate: CaseUpdateResult }> {
  const { iep, questions, answers, role } = params;
  const payload = questions
    .filter((q) => answers[q.eval_question_id] !== undefined)
    .map((q) => ({
      eval_question_id: q.eval_question_id,
      score: answers[q.eval_question_id],
    }));
  const round = await evaluationsApi.submit(iep.iep_id, payload);
  const caseUpdate = await updateCaseAfterSubmit({ iep, questions, role });
  return { round, caseUpdate };
}

/** Each active plan's 6-week check state for the signed-in person. */
export async function checkStates(
  iepIds: string[],
): Promise<Map<string, EvaluationRound["status"]>> {
  const rounds = await Promise.all(
    iepIds.map((id) => evaluationsApi.current(id).catch(() => null)),
  );
  const states = new Map<string, EvaluationRound["status"]>();
  rounds.forEach((round, i) => {
    if (round) states.set(iepIds[i], round.status);
  });
  return states;
}

/**
 * A student's status pill, corrected with the real 6-week check state: the
 * plan's unlock date alone cannot tell that the answers were already sent.
 */
export function withCheckState(
  base: StudentStatus,
  state: EvaluationRound["status"] | undefined,
): StudentStatus {
  if (state === "LOCKED") {
    return {
      label: "Answers sent",
      tone: "sky",
      needsAction: false,
      activePlan: true,
    };
  }
  if (state === "OPEN") {
    return {
      label: "6-week check open",
      tone: "orange",
      needsAction: true,
      activePlan: true,
    };
  }
  if (state === "NOT_OPEN") {
    return {
      label: "Plan active",
      tone: "sky",
      needsAction: false,
      activePlan: true,
    };
  }
  return base;
}
