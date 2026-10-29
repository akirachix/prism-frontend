import type { Page, Request } from "@playwright/test";

import {
  API_HOST,
  PARENT_ID,
  SCHOOL_ID,
  TEACHER_ID,
  TIME_ZONE,
  failUnmockedApi,
  fakeUser,
  type Role,
  type User,
} from "./fixtures";

const DAY = 24 * 60 * 60 * 1000;
export const daysFromNow = (days: number) =>
  new Date(Date.now() + days * DAY).toISOString();
export const daysAgo = (days: number) => daysFromNow(-days);

export const longDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  });

export const shortDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  });

export interface Student {
  student_id: string;
  school_id: string;
  school_name: string;
  teacher_id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  class_name: string | null;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
}

export const student = (
  id: string,
  first: string,
  last: string,
  overrides: Partial<Student> = {},
): Student => ({
  student_id: id,
  school_id: SCHOOL_ID,
  school_name: "Sunrise Academy",
  teacher_id: TEACHER_ID,
  admission_number: `ADM-${id.toUpperCase()}`,
  first_name: first,
  last_name: last,
  date_of_birth: "2019-03-14",
  gender: "FEMALE",
  class_name: "Grade 1",
  parent_id: PARENT_ID,
  is_active: true,
  created_at: "2026-02-01T08:00:00Z",
  ...overrides,
});

export interface Case {
  case_id: string;
  school_id: string;
  student_id: string;
  initiated_by: string;
  status: string;
  autism_score: number | null;
  adhd_score: number | null;
  dyslexia_score: number | null;
  domain_density_score: number | null;
  primary_domain: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  closed_reason: string | null;
}

export const caseFor = (
  id: string,
  studentId: string,
  overrides: Partial<Case> = {},
): Case => ({
  case_id: id,
  school_id: SCHOOL_ID,
  student_id: studentId,
  initiated_by: TEACHER_ID,
  status: "INITIATED",
  autism_score: null,
  adhd_score: null,
  dyslexia_score: null,
  domain_density_score: null,
  primary_domain: null,
  created_at: daysAgo(40),
  updated_at: daysAgo(2),
  closed_at: null,
  closed_reason: null,
  ...overrides,
});

export interface IEP {
  iep_id: string;
  case_id: string;
  version_number: number;
  status: string;
  generated_content: string;
  rag_file_references: string[];
  short_term_goals: string[];
  strategies: string[];
  generated_by: string;
  teacher_approved: boolean;
  teacher_approved_by: string | null;
  admin_approved: boolean;
  admin_approved_by: string | null;
  rejection_reason: string | null;
  approved_at: string | null;
  evaluation_unlock_date: string | null;
  created_by: string;
  created_at: string;
  superseded_at: string | null;
}

export const PLAN_TEXT =
  "The child learns best with short, hands-on steps and clear pictures.";

export const iep = (
  id: string,
  caseId: string,
  overrides: Partial<IEP> = {},
): IEP => ({
  iep_id: id,
  case_id: caseId,
  version_number: 1,
  status: "PENDING_APPROVAL",
  generated_content: PLAN_TEXT,
  rag_file_references: [],
  short_term_goals: [
    "Read 20 sight words by the end of term",
    "Stay with a task for 10 minutes",
  ],
  strategies: ["Seat near the teacher", "Use picture cards for instructions"],
  generated_by: "AI",
  teacher_approved: false,
  teacher_approved_by: null,
  admin_approved: false,
  admin_approved_by: null,
  rejection_reason: null,
  approved_at: null,
  evaluation_unlock_date: null,
  created_by: "system",
  created_at: daysAgo(10),
  superseded_at: null,
  ...overrides,
});

export const activeIep = (
  id: string,
  caseId: string,
  { approvedDaysAgo = 14, unlockInDays = 28 } = {},
  overrides: Partial<IEP> = {},
) =>
  iep(id, caseId, {
    status: "ACTIVE",
    teacher_approved: true,
    teacher_approved_by: TEACHER_ID,
    admin_approved: true,
    admin_approved_by: "u-admin",
    approved_at: daysAgo(approvedDaysAgo),
    evaluation_unlock_date: daysFromNow(unlockInDays),
    ...overrides,
  });

export const user = (
  id: string,
  first: string,
  last: string,
  role: string,
  overrides: Partial<User> = {},
): User => ({
  ...fakeUser(role === "PARENT" ? "PARENT" : "TEACHER"),
  user_id: id,
  first_name: first,
  last_name: last,
  role,
  email: `${first.toLowerCase()}@example.com`,
  phone: null,
  ...overrides,
});

export const school = {
  school_id: SCHOOL_ID,
  name: "Sunrise Academy",
  county: "Nairobi",
  is_active: true,
  created_at: "2025-12-01T08:00:00Z",
};

export const notification = (
  id: string,
  message: string,
  overrides: Record<string, unknown> = {},
) => ({
  notification_id: id,
  user_id: TEACHER_ID,
  case_id: null,
  kind: "INFO",
  message,
  is_read: false,
  read_at: null,
  created_at: daysAgo(1),
  ...overrides,
});

export const professional = (
  id: string,
  first: string,
  last: string,
  overrides: Record<string, unknown> = {},
) => ({
  professional_id: id,
  first_name: first,
  last_name: last,
  specialty: "PSYCHOLOGIST",
  contact_details: "0700 111 222",
  location_address: "Buruburu, Nairobi",
  is_active: true,
  created_at: "2026-03-01T08:00:00Z",
  ...overrides,
});

export const EVAL_TEXTS = [
  "Follows a short instruction",
  "Stays with a task for five minutes",
  "Joins in group play",
  "Says how they feel",
  "Reads a familiar word",
];

export interface EvalQuestion {
  eval_question_id: string;
  iep_id: string;
  position: number;
  question_text: string;
  created_at: string;
}

export interface EvalResponse {
  eval_response_id: string;
  eval_question_id: string;
  responder_id: string;
  responder_role: Role;
  score: number;
  submitted_at: string;
}

export const evalQuestions = (iepId: string): EvalQuestion[] =>
  EVAL_TEXTS.map((text, i) => ({
    eval_question_id: `${iepId}-q${i + 1}`,
    iep_id: iepId,
    position: i + 1,
    question_text: text,
    created_at: daysAgo(14),
  }));

export const evalResponse = (
  questionId: string,
  role: Role,
  score: number,
  submittedAt = daysAgo(1),
): EvalResponse => ({
  eval_response_id: `resp-${questionId}-${role}`,
  eval_question_id: questionId,
  responder_id: role === "TEACHER" ? TEACHER_ID : PARENT_ID,
  responder_role: role,
  score,
  submitted_at: submittedAt,
});

export const evalAnswers = (
  iepId: string,
  role: Role,
  scores = [1, 2, 0, 1, -1],
  submittedAt = daysAgo(1),
) =>
  evalQuestions(iepId).map((q, i) =>
    evalResponse(q.eval_question_id, role, scores[i], submittedAt),
  );

export type RoundStatus = "NOT_APPROVED" | "NOT_OPEN" | "OPEN" | "LOCKED";

export const round = (
  iepId: string,
  status: RoundStatus,
  overrides: Record<string, unknown> = {},
) => ({
  iep_id: iepId,
  status,
  opens_at: status === "NOT_OPEN" ? daysFromNow(28) : null,
  locked_until: status === "LOCKED" ? daysFromNow(41) : null,
  last_submitted_at: status === "LOCKED" ? daysAgo(1) : null,
  questions: evalQuestions(iepId),
  my_responses: [] as EvalResponse[],
  ...overrides,
});

export const ANSWER_LABELS = ["Never", "Sometimes", "Often", "Very often"];

export const screeningQuestion = (
  id: string,
  text: string,
  tool = "SNAP_IV",
) => ({
  question_id: id,
  tool_type: tool,
  target_neurodivergence: "ADHD",
  question_number: 1,
  question_text: text,
  answer_scale: 4,
  answer_labels: ANSWER_LABELS,
  is_scored: true,
  reverse_scored: false,
  subscale: null,
  is_text_verified: true,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
});

export type ScreeningQuestion = ReturnType<typeof screeningQuestion>;

export interface Assessment {
  assessment_id: string;
  case_id: string;
  responder_id: string;
  responder_role: Role;
  started_at: string;
  completed_at: string | null;
}

export const assessment = (
  caseId: string,
  role: Role,
  overrides: Partial<Assessment> = {},
): Assessment => ({
  assessment_id: `as-${role.toLowerCase()}`,
  case_id: caseId,
  responder_id: role === "TEACHER" ? TEACHER_ID : PARENT_ID,
  responder_role: role,
  started_at: daysAgo(3),
  completed_at: null,
  ...overrides,
});

export interface PlanSection {
  tool_type: string;
  domain: string;
  question_ids: string[];
}

export interface ScreeningPlan {
  anchors: string[];
  sections: PlanSection[];
  unavailable?: string[];
}

export interface Db {
  users: User[];
  students: Student[];
  cases: Case[];
  ieps: IEP[];
  notifications: ReturnType<typeof notification>[];
  invites: Record<string, unknown>;
  rounds: Record<string, ReturnType<typeof round>>;
  evalResponses: EvalResponse[];
  questions: ScreeningQuestion[];
  assessments: Assessment[];
  plans: Partial<Record<Role, ScreeningPlan>>;
  answers: Record<string, Record<string, number>>;
  waitingForTeacher: boolean;
  reports: Record<string, unknown>;
  recommendations: Record<string, unknown>;
  professionals: ReturnType<typeof professional>[];
}

type Reply = { status: number; body: unknown };

const found = (body: unknown): Reply => ({ status: 200, body });
const missing = (what: string): Reply => ({
  status: 404,
  body: { detail: `${what} not found.` },
});

function paged<T>(rows: T[], query: URLSearchParams): T[] {
  const offset = Number(query.get("offset") ?? 0);
  const limit = query.get("limit") ? Number(query.get("limit")) : rows.length;
  return rows.slice(offset, offset + limit);
}

function where<T>(rows: T[], query: URLSearchParams, keys: (keyof T)[]): T[] {
  return rows.filter((row) =>
    keys.every((key) => {
      const wanted = query.get(String(key));
      return wanted === null || String(row[key]) === wanted;
    }),
  );
}

function screeningPlan(db: Db, item: Assessment) {
  const spec = db.plans[item.responder_role] ?? { anchors: [], sections: [] };
  const saved = db.answers[item.assessment_id] ?? {};
  const answered = (ids: string[]) =>
    ids.filter((id) => typeof saved[id] === "number").length;
  const sections = spec.sections.map((section) => ({
    ...section,
    answered: answered(section.question_ids),
    total: section.question_ids.length,
  }));
  const all = [
    ...spec.anchors,
    ...spec.sections.flatMap((s) => s.question_ids),
  ];
  return {
    assessment_id: item.assessment_id,
    case_id: item.case_id,
    responder_role: item.responder_role,
    stage: "questions",
    anchor_question_ids: spec.anchors,
    sections,
    unavailable_tools: spec.unavailable ?? [],
    answered: answered(all),
    total: all.length,
    all,
  };
}

function handle(db: Db, request: Request): Reply | undefined {
  const url = new URL(request.url());
  const q = url.searchParams;
  const method = request.method();
  const parts = url.pathname.split("/").filter(Boolean);
  const [root, id, sub, subId] = parts;
  const body = () => request.postDataJSON() as Record<string, unknown>;

  if (method === "POST" && url.pathname === "/audit-logs") {
    return { status: 201, body: {} };
  }

  if (method === "GET") {
    switch (root) {
      case "students":
        if (!id) {
          const rows = where(db.students, q, ["teacher_id", "parent_id"]);
          return found(paged(rows, q));
        }
        if (sub === "parent-invitation") {
          return id in db.invites
            ? found(db.invites[id])
            : missing("Invitation");
        }
        if (!sub) {
          const row = db.students.find((s) => s.student_id === id);
          return row ? found(row) : missing("Student");
        }
        return undefined;
      case "cases":
        if (!id) {
          const rows = where(db.cases, q, ["student_id", "initiated_by"]);
          return found(paged(rows, q));
        }
        if (!sub) {
          const row = db.cases.find((c) => c.case_id === id);
          return row ? found(row) : missing("Case");
        }
        return undefined;
      case "ieps":
        if (!id) {
          return found(paged(where(db.ieps, q, ["case_id", "status"]), q));
        }
        if (id === "case" && subId === "active") {
          const row = db.ieps.find(
            (p) => p.case_id === sub && p.status === "ACTIVE",
          );
          return row ? found(row) : missing("Active plan");
        }
        if (!sub) {
          const row = db.ieps.find((p) => p.iep_id === id);
          return row ? found(row) : missing("Plan");
        }
        return undefined;
      case "users":
        if (id && !sub) {
          const row = db.users.find((u) => u.user_id === id);
          return row ? found(row) : missing("User");
        }
        return undefined;
      case "schools":
        return id === SCHOOL_ID ? found(school) : missing("School");
      case "notifications":
        return id ? undefined : found(db.notifications);
      case "iep-evaluation-questions": {
        const iepId = q.get("iep_id") ?? "";
        if (id === "current") {
          return db.rounds[iepId]
            ? found(db.rounds[iepId])
            : missing("Evaluation round");
        }
        return id
          ? undefined
          : found(db.rounds[iepId]?.questions ?? evalQuestions(iepId));
      }
      case "iep-evaluation-responses":
        return id
          ? undefined
          : found(
              where(db.evalResponses, q, [
                "eval_question_id",
                "responder_role",
                "responder_id",
              ]),
            );
      case "screening-assessments": {
        if (!id) return found(where(db.assessments, q, ["case_id"]));
        const item = db.assessments.find((a) => a.assessment_id === id);
        if (!item) return missing("Assessment");
        const plan = screeningPlan(db, item);
        if (sub === "plan") return found(plan);
        if (sub === "progress") {
          const saved = db.answers[id] ?? {};
          return found({
            assessment_id: id,
            answered: plan.answered,
            total: plan.total,
            completed: Boolean(item.completed_at),
            unanswered_question_ids: plan.all.filter(
              (qid) => typeof saved[qid] !== "number",
            ),
            waiting_for_teacher: db.waitingForTeacher,
          });
        }
        return undefined;
      }
      case "screening-responses": {
        const assessmentId = q.get("assessment_id") ?? "";
        const rows = Object.entries(db.answers[assessmentId] ?? {}).map(
          ([questionId, value]) => ({
            response_id: `sr-${questionId}`,
            assessment_id: assessmentId,
            question_id: questionId,
            selected_value: value,
          }),
        );
        return found(paged(rows, q));
      }
      case "screening-questions":
        if (!id) return found(paged(db.questions, q));
        return db.questions.find((x) => x.question_id === id)
          ? found(db.questions.find((x) => x.question_id === id))
          : missing("Question");
      case "reports":
        if (!id) return found(Object.values(db.reports));
        if (id === "case" && sub) {
          return sub in db.reports ? found(db.reports[sub]) : missing("Report");
        }
        return undefined;
      case "recommendations":
        if (id === "case" && sub) {
          return sub in db.recommendations
            ? found(db.recommendations[sub])
            : missing("Recommendation");
        }
        return undefined;
      case "professionals":
        return found(db.professionals);
    }
    return undefined;
  }

  if (method === "POST" && url.pathname === "/screening-assessments") {
    const data = body();
    const role = data.responder_role as Role;
    if (db.assessments.some((a) => a.responder_role === role)) {
      return { status: 409, body: { detail: "Already started." } };
    }
    const created = assessment(String(data.case_id), role, {
      responder_id: String(data.responder_id),
      started_at: new Date().toISOString(),
    });
    db.assessments.push(created);
    return { status: 201, body: created };
  }
  if (method === "PUT" && url.pathname === "/screening-responses/bulk") {
    const data = body() as {
      assessment_id: string;
      answers: { question_id: string; selected_value: number }[];
    };
    const saved = (db.answers[data.assessment_id] ??= {});
    for (const answer of data.answers) {
      saved[answer.question_id] = answer.selected_value;
    }
    return found({
      saved: data.answers.length,
      created: data.answers.length,
      changed: 0,
    });
  }
  if (
    method === "POST" &&
    root === "screening-assessments" &&
    sub === "complete"
  ) {
    const item = db.assessments.find((a) => a.assessment_id === id);
    if (!item) return missing("Assessment");
    item.completed_at = new Date().toISOString();
    return found(item);
  }
  return undefined;
}

export function emptyDb(): Db {
  return {
    users: [],
    students: [],
    cases: [],
    ieps: [],
    notifications: [],
    invites: {},
    rounds: {},
    evalResponses: [],
    questions: [],
    assessments: [],
    plans: {},
    answers: {},
    waitingForTeacher: false,
    reports: {},
    recommendations: {},
    professionals: [],
  };
}

export async function serveBackend(page: Page, seed: Partial<Db> = {}) {
  const db: Db = { ...emptyDb(), ...seed };
  await failUnmockedApi(page);
  await page.route(
    (url) => url.host === API_HOST,
    (route) => {
      const reply = handle(db, route.request());
      return reply
        ? route.fulfill({ status: reply.status, json: reply.body })
        : route.fallback();
    },
  );
  return db;
}

export function bornYearsAgo(years: number): string {
  const day = new Date();
  day.setFullYear(day.getFullYear() - years);
  day.setMonth(day.getMonth() - 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}
