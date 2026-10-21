export interface ChildSummary {
  name: string;
  dateOfBirth: string | null;
  className: string | null;
  admissionId: string | null;
  status: string | null;
}

export interface ScreeningOption {
  id: string;
  label: string;
}
export interface ScreeningQuestion {
  id: string;
  text: string;
  options: ScreeningOption[];
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

export interface QuestionnaireSession<Q extends { id: string }, A> {
  sessionId: string;
  questions: Q[];
  answers?: Record<string, A>;
}
export interface AnswerPayload<A> {
  questionId: string;
  answer: A;
}

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
  details: Array<{ question: string; rating: string }>;
  teacher: { name: string | null; phone: string | null; email: string | null };
}
