import { fetchAll } from "@/lib/api";
import { EVALUATION_QUESTION_COUNT } from "@/lib/evaluation-flow";
import {
  evaluationsApi,
  scaleLabel,
  type EvaluationQuestion,
  type EvaluationResponse,
  type ResponderRole,
} from "@/lib/evaluations";
import { iepsApi, type IEP } from "@/lib/ieps";

/** One person's answers to one plan's 6-week evaluation. */
export interface EvaluationReport {
  /** `${iep_id}:${role}` - unique in a list. */
  id: string;
  iepId: string;
  caseId: string;
  planVersion: number;
  planApprovedAt: string | null;
  role: ResponderRole;
  responderId: string;
  /** When the answers were last sent. */
  submittedAt: string;
  answers: { question: EvaluationQuestion; score: number | null }[];
  /** Mean of the answered scores (-2 to 2), or null when none. */
  average: number | null;
}

/** How many reports show before "View all". */
export const TOP_REPORTS = 5;

const YEAR = 365 * 24 * 60 * 60 * 1000;

function newest(list: EvaluationResponse[]): EvaluationResponse | null {
  if (list.length === 0) return null;
  return [...list].sort(
    (a, b) =>
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
  )[0];
}

function reportFor(
  plan: IEP,
  role: ResponderRole,
  questions: EvaluationQuestion[],
  byQuestion: Map<string, EvaluationResponse[]>,
): EvaluationReport | null {
  const answers = questions.map((question) => {
    const mine = (byQuestion.get(question.eval_question_id) ?? []).filter(
      (r) => r.responder_role === role,
    );
    return { question, response: newest(mine) };
  });
  const given = answers.flatMap((a) => (a.response ? [a.response] : []));
  const last = newest(given);
  if (!last) return null;
  const average =
    given.reduce((sum, response) => sum + response.score, 0) / given.length;
  return {
    id: `${plan.iep_id}:${role}`,
    iepId: plan.iep_id,
    caseId: plan.case_id,
    planVersion: plan.version_number,
    planApprovedAt: plan.approved_at,
    role,
    responderId: last.responder_id,
    submittedAt: last.submitted_at,
    answers: answers.map(({ question, response }) => ({
      question,
      score: response ? response.score : null,
    })),
    average,
  };
}

/**
 * Every 6-week evaluation sent for these cases, by the teacher and by the
 * parent, newest first. Only approved plans have an evaluation. The answers
 * are read per question, so the list is exact (no paging gaps).
 */
export async function loadEvaluationReports(
  caseIds: string[],
): Promise<EvaluationReport[]> {
  const plansPerCase = await Promise.all(
    caseIds.map((caseId) =>
      fetchAll((limit, offset) =>
        iepsApi.list({ case_id: caseId, limit, offset }),
      ),
    ),
  );
  const plans = plansPerCase.flat().filter((plan) => plan.approved_at);

  const perPlan = await Promise.all(
    plans.map(async (plan) => {
      const questions = (await evaluationsApi.questions(plan.iep_id))
        .sort((a, b) => a.position - b.position)
        .slice(0, EVALUATION_QUESTION_COUNT);
      const lists = await Promise.all(
        questions.map((q) =>
          evaluationsApi.responses({ eval_question_id: q.eval_question_id }),
        ),
      );
      const byQuestion = new Map<string, EvaluationResponse[]>();
      questions.forEach((q, i) => byQuestion.set(q.eval_question_id, lists[i]));
      return (["TEACHER", "PARENT"] as const).flatMap((role) => {
        const report = reportFor(plan, role, questions, byQuestion);
        return report ? [report] : [];
      });
    }),
  );
  return sortReports(perPlan.flat());
}

export function sortReports(reports: EvaluationReport[]): EvaluationReport[] {
  return [...reports].sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

/** The newest reports, for the short list. */
export function topReports(
  reports: EvaluationReport[],
  count = TOP_REPORTS,
): EvaluationReport[] {
  return sortReports(reports).slice(0, count);
}

/** Everything sent in the past 12 months, newest first ("View all"). */
export function reportsThisYear(
  reports: EvaluationReport[],
  now = new Date(),
): EvaluationReport[] {
  const since = now.getTime() - YEAR;
  return sortReports(reports).filter(
    (report) => new Date(report.submittedAt).getTime() >= since,
  );
}

/** "A little better" - the average answer, in words. */
export function overallLabel(report: EvaluationReport): string {
  return report.average === null ? "—" : scaleLabel(Math.round(report.average));
}
