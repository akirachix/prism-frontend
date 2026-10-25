import { ApiError, fetchAll, request } from "@/lib/api";
import { query } from "@/lib/query";

export type ResponderRole = "TEACHER" | "PARENT";
export type ToolType =
  "CAST" | "SNAP_IV" | "CLDQR" | "ADHD_RS_PRESCHOOL" | "ANCHOR";
export type Domain = "AUTISM" | "ADHD" | "DYSLEXIA";

export interface ScreeningQuestion {
  question_id: string;
  tool_type: ToolType;
  target_neurodivergence: string;
  question_number: number;
  question_text: string;
  answer_scale: number;
  answer_labels: string[];
  is_scored: boolean;
  reverse_scored: boolean;
  subscale: string | null;
  is_text_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Assessment {
  assessment_id: string;
  case_id: string;
  responder_id: string;
  responder_role: ResponderRole;
  started_at: string;
  completed_at: string | null;
}

export interface AssessmentProgress {
  assessment_id: string;
  answered: number;
  total: number;
  completed: boolean;
  unanswered_question_ids: string[];
  waiting_for_teacher?: boolean;
}

export interface PlanSection {
  tool_type: string;
  domain: string;
  question_ids: string[];
  answered: number;
  total: number;
}

export interface AssessmentPlan {
  assessment_id: string;
  case_id: string;
  responder_role: ResponderRole;
  stage: string;
  anchor_question_ids: string[];
  sections: PlanSection[];
  unavailable_tools: string[];
  answered: number;
  total: number;
}

export interface ScreeningResponse {
  response_id: string;
  assessment_id: string;
  question_id: string;
  selected_value: number;
}

export interface CaseScore {
  case_id: string;
  status: string;
  domain_density_score: number;
  primary_domain: string | null;
  iep_threshold: number;
  iep_recommended: boolean;
  saved: boolean;
  report_generated?: boolean;
}

export type Answers = Record<string, number>;

export const AREA_TITLES: Record<string, string> = {
  AUTISM: "Social communication and play",
  ADHD: "Attention and activity",
  DYSLEXIA: "Reading and spelling",
};

const TOOL_AREAS: Record<string, Domain> = {
  CAST: "AUTISM",
  SNAP_IV: "ADHD",
  ADHD_RS_PRESCHOOL: "ADHD",
  CLDQR: "DYSLEXIA",
};

export const GETTING_STARTED = "Getting started";

export function areaTitle(section: { tool_type: string; domain: string }) {
  const domain = section.domain || TOOL_AREAS[section.tool_type];
  return AREA_TITLES[domain] ?? "More questions";
}

export const WAIT_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;

export interface Part {
  tool: ToolType;
  title: string;
  questions: ScreeningQuestion[];
}

export function partsFromPlan(
  plan: AssessmentPlan,
  questions: Map<string, ScreeningQuestion>,
): Part[] {
  return plan.sections
    .filter((section) => section.tool_type !== "ANCHOR")
    .map((section) => ({
      tool: section.tool_type as ToolType,
      title: areaTitle(section),
      questions: section.question_ids
        .map((id) => questions.get(id))
        .filter((q): q is ScreeningQuestion => Boolean(q)),
    }))
    .filter((part) => part.questions.length > 0);
}

export function anchorQuestions(
  plan: AssessmentPlan,
  questions: Map<string, ScreeningQuestion>,
): ScreeningQuestion[] {
  return plan.anchor_question_ids
    .map((id) => questions.get(id))
    .filter((q): q is ScreeningQuestion => Boolean(q));
}

export const screeningApi = {
  questions: () =>
    fetchAll((limit, offset) =>
      request<ScreeningQuestion[]>(
        `/screening-questions${query({ is_active: true, limit, offset })}`,
      ),
    ),
  question: (questionId: string) =>
    request<ScreeningQuestion>(`/screening-questions/${questionId}`),
  assessments: (caseId: string) =>
    request<Assessment[]>(
      `/screening-assessments${query({ case_id: caseId, limit: 10 })}`,
    ),
  createAssessment: (data: {
    case_id: string;
    responder_id: string;
    responder_role: ResponderRole;
  }) =>
    request<Assessment>("/screening-assessments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  plan: (assessmentId: string) =>
    request<AssessmentPlan>(`/screening-assessments/${assessmentId}/plan`),
  progress: (assessmentId: string) =>
    request<AssessmentProgress>(
      `/screening-assessments/${assessmentId}/progress`,
    ),
  complete: (assessmentId: string) =>
    request<Assessment>(`/screening-assessments/${assessmentId}/complete`, {
      method: "POST",
    }),
  responses: (assessmentId: string) =>
    fetchAll((limit, offset) =>
      request<ScreeningResponse[]>(
        `/screening-responses${query({ assessment_id: assessmentId, limit, offset })}`,
      ),
    ),
  saveAnswers: (assessmentId: string, answers: Answers) =>
    request<{ saved: number; created: number; changed: number }>(
      "/screening-responses/bulk",
      {
        method: "PUT",
        body: JSON.stringify({
          assessment_id: assessmentId,
          answers: Object.entries(answers).map(
            ([question_id, selected_value]) => ({
              question_id,
              selected_value,
            }),
          ),
        }),
      },
    ),
  calculate: (caseId: string) =>
    request<CaseScore>(`/domain-scores/case/${caseId}/calculate`, {
      method: "POST",
    }),
};

export function assessmentFor(
  assessments: Assessment[],
  role: ResponderRole,
): Assessment | null {
  return assessments.find((a) => a.responder_role === role) ?? null;
}

export function otherRole(role: ResponderRole): ResponderRole {
  return role === "TEACHER" ? "PARENT" : "TEACHER";
}

export type ScreeningStep =
  "start" | "anchors" | "waiting" | "questions" | "done";

export interface MyScreening {
  assessment: Assessment | null;
  plan: AssessmentPlan | null;
  waitingForTeacher: boolean;
  questions: Map<string, ScreeningQuestion>;
  answers: Answers;
}

export async function loadPlanned(
  assessment: Assessment,
): Promise<Omit<MyScreening, "assessment">> {
  const [plan, progress, responses, bank] = await Promise.all([
    screeningApi.plan(assessment.assessment_id),
    screeningApi.progress(assessment.assessment_id),
    screeningApi.responses(assessment.assessment_id),
    screeningApi.questions(),
  ]);
  const questions = new Map(bank.map((q) => [q.question_id, q]));
  const wanted = [
    ...plan.anchor_question_ids,
    ...plan.sections.flatMap((section) => section.question_ids),
  ].filter((id) => !questions.has(id));
  for (const q of await Promise.all(wanted.map(screeningApi.question))) {
    questions.set(q.question_id, q);
  }
  const answers: Answers = {};
  for (const r of responses) answers[r.question_id] = r.selected_value;
  return {
    plan,
    waitingForTeacher: Boolean(progress.waiting_for_teacher),
    questions,
    answers,
  };
}

export async function loadMyScreening(
  caseId: string,
  role: ResponderRole,
): Promise<MyScreening> {
  const assessment = assessmentFor(
    await screeningApi.assessments(caseId),
    role,
  );
  if (!assessment) {
    return {
      assessment: null,
      plan: null,
      waitingForTeacher: false,
      questions: new Map(),
      answers: {},
    };
  }
  return { assessment, ...(await loadPlanned(assessment)) };
}

export function anchorsDone(plan: AssessmentPlan, answers: Answers): boolean {
  return plan.anchor_question_ids.every(
    (id) => typeof answers[id] === "number",
  );
}

export function stepOf(screening: MyScreening): ScreeningStep {
  const { assessment, plan, answers } = screening;
  if (!assessment || !plan) return "start";
  if (assessment.completed_at) return "done";
  if (assessment.responder_role === "PARENT") {
    return screening.waitingForTeacher ? "waiting" : "questions";
  }
  if (!anchorsDone(plan, answers)) return "anchors";
  return "questions";
}

export async function saveAnswers(assessmentId: string, answers: Answers) {
  if (Object.keys(answers).length === 0) return;
  await screeningApi.saveAnswers(assessmentId, answers);
}

export async function ensureAssessment(
  caseId: string,
  role: ResponderRole,
  responderId: string,
): Promise<Assessment> {
  try {
    return await screeningApi.createAssessment({
      case_id: caseId,
      responder_id: responderId,
      responder_role: role,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      const existing = assessmentFor(
        await screeningApi.assessments(caseId),
        role,
      );
      if (existing) return existing;
    }
    throw error;
  }
}

export async function saveScreening(params: {
  caseId: string;
  role: ResponderRole;
  responderId: string;
  assessment: Assessment | null;
  answers: Answers;
  finish: boolean;
}): Promise<{ assessment: Assessment; score: CaseScore | null }> {
  const { caseId, role, responderId, answers, finish } = params;
  const assessment =
    params.assessment ?? (await ensureAssessment(caseId, role, responderId));
  if (Object.keys(answers).length > 0) {
    await screeningApi.saveAnswers(assessment.assessment_id, answers);
  }
  if (!finish) return { assessment, score: null };

  const completed = await screeningApi.complete(assessment.assessment_id);
  const other = assessmentFor(
    await screeningApi.assessments(caseId),
    otherRole(role),
  );
  const score = other?.completed_at
    ? await screeningApi.calculate(caseId)
    : null;
  return { assessment: completed, score };
}

export interface ScreeningContent {
  teacher: {
    completed_at: string | null;
    scores: Partial<Record<Domain, number>>;
  } | null;
  parent: {
    completed_at: string | null;
    scores: Partial<Record<Domain, number>>;
  } | null;
  combined: {
    levels: Partial<Record<Domain, number>>;
    discrepancies: Domain[];
  } | null;
}

export async function loadScreening(
  caseId: string,
): Promise<{ content: ScreeningContent | null; exists: boolean }> {
  const assessments = await screeningApi.assessments(caseId);
  const teacher = assessmentFor(assessments, "TEACHER");
  const parent = assessmentFor(assessments, "PARENT");

  const hasScreening = Boolean(teacher || parent);
  if (!hasScreening) {
    return { content: null, exists: false };
  }

  return {
    content: {
      teacher: teacher
        ? { completed_at: teacher.completed_at, scores: {} }
        : null,
      parent: parent ? { completed_at: parent.completed_at, scores: {} } : null,
      combined: null,
    },
    exists: true,
  };
}

export type ScreeningStage =
  "not_started" | "in_progress" | "waiting_for_other" | "both_done";

export function stageFor(
  assessments: Assessment[],
  role: ResponderRole,
): ScreeningStage {
  const mine = assessmentFor(assessments, role);
  const theirs = assessmentFor(assessments, otherRole(role));
  if (!mine) return "not_started";
  if (!mine.completed_at) return "in_progress";
  return theirs?.completed_at ? "both_done" : "waiting_for_other";
}

export function soloScoringDate(assessments: Assessment[]): Date | null {
  const done = assessments.filter((a) => a.completed_at);
  if (done.length !== 1) return null;
  return new Date(
    new Date(done[0].completed_at as string).getTime() + WAIT_DAYS * DAY,
  );
}

const SCREENING_STATUSES = [
  "INITIATED",
  "TEACHER_SCREENING_COMPLETED",
  "PARENT_SCREENING_COMPLETED",
];

export function screeningIsOpen(caseItem: {
  status: string;
  domain_density_score: number | null;
}): boolean {
  return (
    SCREENING_STATUSES.includes(caseItem.status) &&
    caseItem.domain_density_score === null
  );
}

export function screeningOutcome(status: string, density: number | null) {
  if (status === "NO_CONCERN_IDENTIFIED") return "no_concern" as const;
  if (density !== null) return "plan" as const;
  return "pending" as const;
}

export async function scoreIfWaitIsOver(
  caseId: string,
  assessments: Assessment[],
  caseDensity: number | null,
  now = new Date(),
): Promise<CaseScore | null> {
  if (caseDensity !== null) return null;
  const due = soloScoringDate(assessments);
  if (!due || due.getTime() > now.getTime()) return null;
  try {
    return await screeningApi.calculate(caseId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) return null;
    throw error;
  }
}
