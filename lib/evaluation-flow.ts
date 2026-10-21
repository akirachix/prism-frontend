import { query, request } from "@/lib/api";
import { casesApi } from "@/lib/cases";
import {
  evaluationsApi,
  saveAnswers,
  type EvaluationQuestion,
  type EvaluationResponse,
  type ResponderRole,
} from "@/lib/evaluation";

/**
 * The plan (IEP) fields the 6-week check needs, read only. Approving plans
 * is the IEP feature.
 */
export interface IEP {
  iep_id: string;
  case_id: string;
  version_number: number;
  status: "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "SUPERSEDED";
  approved_at: string | null;
  evaluation_unlock_date: string | null;
}

/** The case's newest plan that has not been replaced, if any. */
export async function planForCase(caseId: string): Promise<IEP | null> {
  const plans = await request<IEP[]>(
    `/ieps${query({ case_id: caseId, limit: 50 })}`,
  );
  const live = plans.filter((plan) => plan.status !== "SUPERSEDED");
  const pool = live.length > 0 ? live : plans;
  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => b.version_number - a.version_number)[0];
}

export function evaluationIsOpen(plan: IEP, now = new Date()): boolean {
  if (plan.status !== "ACTIVE" || !plan.evaluation_unlock_date) return false;
  return new Date(plan.evaluation_unlock_date).getTime() <= now.getTime();
}

const WEEK = 7 * 24 * 60 * 60 * 1000;

/** "Week 2 of 6" between approval and the check opening. */
export function weeksElapsed(plan: IEP, now = new Date()) {
  const total = 6;
  if (!plan.approved_at) return { week: 0, total };
  const passed = Math.floor(
    (now.getTime() - new Date(plan.approved_at).getTime()) / WEEK,
  );
  return { week: Math.min(total, Math.max(0, passed)), total };
}

export interface EvaluationData {
  questions: EvaluationQuestion[];
  mine: EvaluationResponse[];
}

export async function loadEvaluation(
  iep: IEP,
  responderId: string,
): Promise<EvaluationData> {
  const [questions, mine] = await Promise.all([
    evaluationsApi.questions(iep.iep_id),
    evaluationsApi.responses({ responder_id: responderId }),
  ]);
  const ids = new Set(questions.map((q) => q.eval_question_id));
  return {
    questions: [...questions].sort((a, b) => a.position - b.position),
    mine: mine.filter((r) => ids.has(r.eval_question_id)),
  };
}

/**
 * Save this person's answers, then move the case on: it is COMPLETED once
 * the teacher and the parent have both answered every question.
 */
export async function submitEvaluation(params: {
  iep: IEP;
  questions: EvaluationQuestion[];
  existing: EvaluationResponse[];
  answers: Record<string, number>;
  responderId: string;
  role: ResponderRole;
}): Promise<{ bothDone: boolean }> {
  const { iep, questions, existing, answers, responderId, role } = params;
  await saveAnswers(answers, existing, responderId, role);

  const other: ResponderRole = role === "TEACHER" ? "PARENT" : "TEACHER";
  const theirs = await Promise.all(
    questions.map((q) =>
      evaluationsApi.responses({
        eval_question_id: q.eval_question_id,
        responder_role: other,
      }),
    ),
  );
  const bothDone = theirs.every((list) => list.length > 0);
  try {
    await casesApi.update(iep.case_id, {
      status: bothDone ? "COMPLETED" : "EVALUATION_PENDING",
    });
  } catch {
    // The answers are saved; the status can be fixed by the next person.
  }
  return { bothDone };
}
