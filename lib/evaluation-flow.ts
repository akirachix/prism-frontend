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
import { currentIep, plansForCase, type IEP } from "@/lib/ieps";
import { FINISHED_STATUSES } from "@/lib/types";

export const EVALUATION_QUESTION_COUNT = 5;

export const LOCK_DAYS = 42;

const DAY = 24 * 60 * 60 * 1000;

export function evaluatedIep(ieps: IEP[]): IEP | null {
  const active = ieps.filter((plan) => plan.status === "ACTIVE");
  if (active.length > 0) {
    return [...active].sort((a, b) => b.version_number - a.version_number)[0];
  }
  return currentIep(ieps);
}

export async function planForCase(caseId: string): Promise<IEP | null> {
  return evaluatedIep(await plansForCase(caseId));
}

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

export type CheckState = EvaluationRound["status"] | "UNAVAILABLE";

export async function checkStates(
  iepIds: string[],
): Promise<Map<string, CheckState>> {
  const results = await Promise.allSettled(
    iepIds.map((id) => evaluationsApi.current(id)),
  );
  const states = new Map<string, CheckState>();
  results.forEach((result, i) => {
    states.set(
      iepIds[i],
      result.status === "fulfilled" ? result.value.status : "UNAVAILABLE",
    );
  });
  return states;
}

export function unavailableCount(
  states: Map<string, CheckState> | null | undefined,
): number {
  if (!states) return 0;
  return Array.from(states.values()).filter((s) => s === "UNAVAILABLE").length;
}

export function withCheckState(
  base: StudentStatus,
  state: CheckState | undefined,
): StudentStatus {
  if (state === "UNAVAILABLE") {
    return {
      label: "Check status unavailable",
      tone: "grey",
      needsAction: false,
      activePlan: true,
    };
  }
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
