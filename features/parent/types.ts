/**
 * UI-facing types of the parent portal. Screens only see these; adapters.ts
 * converts the backend shapes (lib/api-types.ts) into them.
 */

export interface ChildSummary {
  name: string;
  dateOfBirth: string | null;
  className: string | null;
  admissionId: string | null;
  status: string | null;
}

// ── Questionnaires (screening + evaluation) ─────────────────────────────
export interface ScreeningOption {
  id: string;
  label: string;
}
export interface ScreeningQuestion {
  id: string;
  text: string;
  options: ScreeningOption[];
  /** Short green hint shown above the question, e.g. "Almost there!!" */
  encouragement?: string | null;
}
export interface RatingOption {
  value: number;
  label: string;
}
export interface EvaluationQuestion {
  id: string;
  text: string;
  scale: RatingOption[];
}

/**
 * What start() returns. The number of questions is whatever the API sends -
 * nothing in the UI hard-codes a count. `answers` lets a half-finished
 * questionnaire resume where it stopped.
 */
export interface QuestionnaireSession<Q extends { id: string }, A> {
  sessionId: string;
  questions: Q[];
  answers?: Record<string, A>;
}
export interface AnswerPayload<A> {
  questionId: string;
  answer: A;
}

// ── Reports and the teacher's evaluation ────────────────────────────────
export interface ReportSummary {
  id: string;
  type: "screening" | "evaluation";
  title: string;
  description: string;
  available: boolean;
}
export interface TeacherEvaluation {
  evaluatedBy: string;
  teacherName: string | null;
  date: string | null;
  /** One line per question the teacher rated. */
  details: Array<{ question: string; rating: string }>;
  teacher: { name: string | null; phone: string | null; email: string | null };
}
