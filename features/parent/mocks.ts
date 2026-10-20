/**
 * Fake data for the parent portal. Only used with NEXT_PUBLIC_USE_MOCKS=true
 * (loaded lazily by api.ts, so it is never downloaded otherwise).
 */
import { RATING_SCALE } from "./adapters";
import type {
  ChildSummary,
  EvaluationQuestion,
  QuestionnaireSession,
  ReportSummary,
  ScreeningQuestion,
  TeacherEvaluation,
} from "./types";

const FREQUENCY = ["Always", "Often", "Sometimes", "Rarely", "Never"];

const SCREENING_TEXTS = [
  "Does your child look at you when you call their name?",
  "Does your child point to things they want?",
  "Does your child enjoy playing with other children?",
  "Does your child imitate your actions?",
  "Does your child respond to simple instructions?",
  "Does your child make eye contact when you speak?",
  "Does your child show interest in new toys or objects?",
  "Does your child respond when their name is called?",
  "Does your child play pretend games?",
  "Does your child show you things they find interesting?",
  "Does your child notice when someone is upset?",
];

/** "Almost there!!" on roughly the last 30% of the questions. */
const firstEncouraged = Math.ceil(SCREENING_TEXTS.length * 0.7);

export const mockScreeningQuestions: ScreeningQuestion[] = SCREENING_TEXTS.map((text, i) => ({
  id: `sq-${i + 1}`,
  text,
  options: FREQUENCY.map((label) => ({ id: label.toLowerCase(), label })),
  encouragement: i + 1 >= firstEncouraged ? "Almost there!!" : null,
}));

export const mockEvaluationQuestions: EvaluationQuestion[] = [
  "Has the child kept attention on a task on a planned time?",
  "Has the child followed a simple routine with fewer reminders?",
  "Has the child interacted with classmates during group activities?",
  "Has the child communicated needs clearly?",
  "Has the child stayed calm during transitions between activities?",
  "Has the child completed tasks independently?",
].map((text, i) => ({ id: `eq-${i + 1}`, text, scale: RATING_SCALE }));

/**
 * Fake "database": answers sent in mock mode are kept here (and logged) so you
 * can see exactly what would be saved, and so a half-done questionnaire resumes.
 */
const saved: Record<string, Record<string, string | number>> = {};

export function mockSaveAnswer(sessionId: string, questionId: string, answer: string | number) {
  (saved[sessionId] ??= {})[questionId] = answer;
  console.info("[mock] saved answer", { sessionId, questionId, answer });
}

export const mockCompleteScreening = (sessionId: string) => {
  console.info("[mock] screening completed", sessionId);
};

export const mockScreeningSession = (): QuestionnaireSession<ScreeningQuestion, string> => ({
  sessionId: "mock-screening",
  questions: mockScreeningQuestions,
  answers: { ...(saved["mock-screening"] as Record<string, string> | undefined) },
});

export const mockEvaluationSession = (): QuestionnaireSession<EvaluationQuestion, number> => ({
  sessionId: "mock-evaluation",
  questions: mockEvaluationQuestions,
  answers: { ...(saved["mock-evaluation"] as Record<string, number> | undefined) },
});

export const mockChild: ChildSummary = {
  name: "Amani Otieno",
  dateOfBirth: "14 Mar 2018",
  className: "Grade 2",
  admissionId: "ADM-0042",
  status: "Screening due",
};

export const mockReports: ReportSummary[] = [
  {
    id: "mock-screening-report",
    type: "screening",
    title: "Screening report",
    description: "View your child's screening results.",
    available: true,
  },
  {
    id: "mock-evaluation-report",
    type: "evaluation",
    title: "Evaluation report",
    description: "View your child's evaluation information.",
    available: true,
  },
];

export const mockTeacherEvaluation: TeacherEvaluation = {
  evaluatedBy: "Evaluation by teacher",
  teacherName: "Mary Wambui",
  date: "12 Sep 2026",
  details: [
    { question: "Has the child kept attention on a task?", rating: "A little better" },
    { question: "Has the child followed a simple routine?", rating: "Much better" },
    { question: "Has the child interacted with classmates?", rating: "No change" },
  ],
  teacher: { name: "Mary Wambui", phone: "+254 700 000 000", email: "mary@greenfield.example" },
};

/** A tiny valid one-page PDF so "Download PDF" works in mock mode. */
export function mockPdf(title: string): Blob {
  const safe = title.replace(/[^\x20-\x7e]/g, "").replace(/[()\\]/g, "");
  const stream =
    `BT /F1 22 Tf 72 720 Td (${safe}) Tj ET\n` +
    `BT /F1 11 Tf 72 690 Td (Mock PDF - NEXT_PUBLIC_USE_MOCKS=true) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}
