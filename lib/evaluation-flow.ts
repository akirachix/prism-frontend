import { casesApi } from "@/lib/cases";
import {
  evaluationsApi,
  saveAnswers,
  type EvaluationQuestion,
  type EvaluationResponse,
  type ResponderRole,
} from "@/lib/evaluations";
import type { IEP } from "@/lib/ieps";

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
  } catch {}
  return { bothDone };
}
