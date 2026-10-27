import { request } from "@/lib/api";
import { query } from "@/lib/query";

export type ResponderRole = "TEACHER" | "PARENT";

export interface EvaluationQuestion {
  eval_question_id: string;
  iep_id: string;
  position: number;
  question_text: string;
  created_at: string;
}

export interface EvaluationResponse {
  eval_response_id: string;
  eval_question_id: string;
  responder_id: string;
  responder_role: ResponderRole;
  score: number;
  submitted_at: string;
}

export type EvaluationWindowStatus =
  "NOT_APPROVED" | "NOT_OPEN" | "OPEN" | "LOCKED";

export interface EvaluationRound {
  iep_id: string;
  status: EvaluationWindowStatus;
  opens_at: string | null;
  locked_until: string | null;
  last_submitted_at: string | null;
  questions: EvaluationQuestion[];
  my_responses: EvaluationResponse[];
}

export interface EvaluationAnswer {
  eval_question_id: string;
  score: number;
}

export const evaluationsApi = {
  questions: (iepId: string) =>
    request<EvaluationQuestion[]>(
      `/iep-evaluation-questions${query({ iep_id: iepId })}`,
    ),
  current: (iepId: string) =>
    request<EvaluationRound>(
      `/iep-evaluation-questions/current${query({ iep_id: iepId })}`,
    ),
  submit: (iepId: string, answers: EvaluationAnswer[]) =>
    request<EvaluationRound>("/iep-evaluation-responses/submit", {
      method: "POST",
      body: JSON.stringify({ iep_id: iepId, answers }),
    }),
  responses: (filters: {
    eval_question_id?: string;
    responder_id?: string;
    responder_role?: ResponderRole;
  }) =>
    request<EvaluationResponse[]>(
      `/iep-evaluation-responses${query({ ...filters })}`,
    ),
  respond: (data: {
    eval_question_id: string;
    responder_id: string;
    responder_role: ResponderRole;
    score: number;
  }) =>
    request<EvaluationResponse>("/iep-evaluation-responses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateResponse: (evalResponseId: string, score: number) =>
    request<EvaluationResponse>(`/iep-evaluation-responses/${evalResponseId}`, {
      method: "PATCH",
      body: JSON.stringify({ score }),
    }),
};

export const SCALE = [
  { score: -2, label: "Much worse", face: "😞" },
  { score: -1, label: "A little worse", face: "🙁" },
  { score: 0, label: "No change", face: "😐" },
  { score: 1, label: "A little better", face: "🙂" },
  { score: 2, label: "Much better", face: "😄" },
] as const;

export function scaleLabel(score: number): string {
  return SCALE.find((item) => item.score === score)?.label ?? "—";
}

export async function saveAnswers(
  answers: Record<string, number>,
  existing: EvaluationResponse[],
  responderId: string,
  role: ResponderRole,
): Promise<void> {
  const byQuestion = new Map(existing.map((r) => [r.eval_question_id, r]));
  for (const [questionId, score] of Object.entries(answers)) {
    const previous = byQuestion.get(questionId);
    if (previous) {
      if (previous.score !== score) {
        await evaluationsApi.updateResponse(previous.eval_response_id, score);
      }
    } else {
      await evaluationsApi.respond({
        eval_question_id: questionId,
        responder_id: responderId,
        responder_role: role,
        score,
      });
    }
  }
}
