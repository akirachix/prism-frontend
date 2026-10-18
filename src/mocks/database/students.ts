import type {
  CaseInfo,
  ParentContact,
  StudentDetail,
  StudentRow,
  Todo,
  TodoAction,
  TodoCategory,
} from "@/types/api";
import { addNotification } from "./notifications";

const student = (
  n: number,
  first: string,
  last: string,
  status: string,
  extra: Partial<StudentRow> = {},
): StudentRow => ({
  student_id: `s0000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  first_name: first,
  last_name: last,
  admission_number: `Adm ${String(140 + n).padStart(4, "0")}`,
  status,
  needs_action: false,
  next_evaluation_date: null,
  ...extra,
});

const fromToday = (days: number) =>
  new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

export const MOCK_STUDENTS = [
  student(1, "Amani", "Otieno", "plan_active", { next_evaluation_date: "2026-11-14" }),
  student(2, "Grace", "Mwangi", "waiting_for_parent"),
  student(3, "Cherly", "Njeri", "no_case"),
  student(4, "Faith", "Odhiambo", "approve_plan", { needs_action: true }),
  student(5, "Brian", "Kiprono", "evaluation_open", { needs_action: true }),
  student(6, "Zawadi", "Achieng", "plan_active", { next_evaluation_date: fromToday(36) }),
  student(7, "Imani", "Wekesa", "no_concern"),
  student(8, "Baraka", "Mutua", "plan_active", { next_evaluation_date: fromToday(-2) }),
  student(9, "Neema", "Chebet", "approve_plan", { needs_action: true }),
  student(10, "Jabali", "Kamau", "no_case"),
  student(11, "Wanjiku", "Muthoni", "plan_active", { next_evaluation_date: "2026-12-09" }),
  student(12, "Tumaini", "Ouma", "no_concern"),
];

const PARENTS = [
  "Grace Achieng",
  "Peter Mwangi",
  "Esther Njeri",
  "John Odhiambo",
  "Ruth Kiprono",
  "Mercy Achieng",
  "Paul Wekesa",
  "Ann Mutua",
  "Lucy Chebet",
  "James Kamau",
  "Joy Muthoni",
  "Mark Ouma",
];

const addDays = (isoDate: string, days: number) =>
  new Date(new Date(isoDate).getTime() + days * 86400000).toISOString().slice(0, 10);

function caseFor(s: StudentRow, n: number): CaseInfo | null {
  const base: CaseInfo = {
    case_id: `c1000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    status: "open",
    started_at: "2026-10-03T08:00:00Z",
    teacher_screening: "completed",
    parent_screening: "completed",
    plan: "locked",
    plan_approved_at: null,
    six_week_check_at: null,
    six_week_check_done: false,
  };
  switch (s.status) {
    case "no_case":
      return null;
    case "evaluation_open":
      return { ...base, teacher_screening: "not_started", parent_screening: "not_started" };
    case "waiting_for_parent":
      return { ...base, parent_screening: "not_started" };
    case "approve_plan":
      if (s.first_name === "Neema")
        return {
          ...base,
          plan: "rejected",
          plan_rejected_reason: "Goals need to be more specific.",
        };
      return { ...base, plan: "awaiting_approval" };
    case "no_concern":
      return { ...base, plan: "not_needed" };
    case "plan_active":
      return {
        ...base,
        plan: "approved",
        plan_approved_at: "2026-10-03T08:00:00Z",
        six_week_check_at: s.next_evaluation_date,

        plan_ends_at: s.next_evaluation_date ? addDays(s.next_evaluation_date, 42) : null,
      };
    default:
      return base;
  }
}

function createDetails(): Record<string, StudentDetail> {
  return Object.fromEntries(
    MOCK_STUDENTS.map((s, i) => [
      s.student_id,
      {
        ...s,
        parent: {
          name: PARENTS[i],
          account_status: i % 3 === 2 ? "invited" : "signed_in",
        } as ParentContact,
        case: caseFor(s, i + 1),
      },
    ]),
  );
}

export let details = createDetails();
let added: string[] = [];

let concerns: Record<string, { teacher?: boolean; parent?: boolean }> = {};
let caseCounter = 0;

export const allStudents = (): StudentDetail[] => [
  ...added.map((id) => details[id]),
  ...MOCK_STUDENTS.map((m) => details[m.student_id]),
];

export function addStudent(student: StudentDetail) {
  details[student.student_id] = student;
  added = [student.student_id, ...added];
}

export const addedStudentCount = () => added.length;

export function nextCaseId(): string {
  caseCounter += 1;
  return `c2000000-0000-4000-8000-${String(caseCounter).padStart(12, "0")}`;
}

export function resetStudents() {
  details = createDetails();
  added = [];
  concerns = {};
  caseCounter = 0;
}

export function recordScreening(caseId: string, who: "teacher" | "parent", concern: unknown) {
  concerns[caseId] = { ...concerns[caseId], [who]: Boolean(concern) };
  updateCase(caseId, { [`${who}_screening`]: "completed" });
  const entry = studentOfCase(caseId);
  const c = entry?.case;
  if (!entry || !c) return;
  if (c.teacher_screening !== "completed" || c.parent_screening !== "completed") return;
  const base = `/teacher/students/${entry.student_id}`;
  if (concerns[caseId].teacher || concerns[caseId].parent) {
    updateCase(caseId, { plan: "awaiting_approval" });
    addNotification({
      kind: "PLAN_READY",
      message: `A plan is ready for ${entry.first_name}. Review and approve it.`,
      link: `${base}/plan`,
      caseId,
    });
  } else {
    updateCase(caseId, { plan: "not_needed" });
    addNotification({
      kind: "NO_CONCERN",
      message: `No concern found for ${entry.first_name} from both screenings.`,
      link: `${base}/screening`,
      caseId,
    });
  }
}

export function combinedResult(caseId: string): { elevated: boolean } | null {
  const c = findCase(caseId);
  if (!c || c.teacher_screening !== "completed" || c.parent_screening !== "completed") return null;
  return { elevated: c.plan !== "not_needed" && c.plan !== "locked" };
}

export function listStatusOf(c: CaseInfo | null | undefined): {
  status: string;
  needs_action: boolean;
} {
  if (!c) return { status: "no_case", needs_action: false };
  if (c.status === "closed") return { status: "case_closed", needs_action: false };
  if (c.teacher_screening !== "completed") return { status: "evaluation_open", needs_action: true };
  if (c.plan === "awaiting_approval") return { status: "approve_plan", needs_action: true };
  if (c.plan === "rejected") return { status: "plan_rejected", needs_action: true };
  if (c.plan === "awaiting_admin") return { status: "plan_with_admin", needs_action: false };
  if (c.plan === "not_needed") return { status: "no_concern", needs_action: false };
  if (c.plan === "approved") {
    if (c.six_week_check_done && planEnded(c))
      return { status: "plan_finished", needs_action: true };
    if (c.six_week_check_done) return { status: "check_done", needs_action: false };
    if (dueNow(c)) return { status: "check_due", needs_action: true };
    return { status: "plan_active", needs_action: false };
  }
  if (c.parent_screening !== "completed")
    return { status: "waiting_for_parent", needs_action: false };
  return { status: "screenings_done", needs_action: false };
}

export const studentRow = (d: StudentDetail): StudentRow => {
  const open = d.case && d.case.status !== "closed" ? d.case : null;
  return {
    student_id: d.student_id,
    first_name: d.first_name,
    last_name: d.last_name,
    admission_number: d.admission_number,
    ...listStatusOf(d.case),
    next_evaluation_date: open?.plan === "approved" ? open.six_week_check_at : null,
    plan_ends_at: open?.plan === "approved" ? open.plan_ends_at || null : null,
  };
};

export function currentSummary() {
  const all = allStudents();
  const open = all
    .map((d) => d.case)
    .filter((c): c is CaseInfo => Boolean(c) && c?.status !== "closed");
  return {
    students: all.length,
    open_cases: open.length,
    active_ieps: open.filter((c) => c.plan === "approved").length,
    unapproved_ieps: open.filter((c) =>
      ["awaiting_approval", "awaiting_admin", "rejected"].includes(c.plan),
    ).length,
  };
}

export function findCase(caseId: string): CaseInfo | undefined {
  return Object.values(details).find((d) => d.case?.case_id === caseId)?.case ?? undefined;
}

export const studentDetails = (studentId: string): StudentDetail | undefined => details[studentId];

export function studentOfCase(caseId: string): StudentDetail | undefined {
  return Object.values(details).find((d) => d.case?.case_id === caseId);
}

export function updateCase(caseId: string, changes: Partial<CaseInfo>) {
  const entry = studentOfCase(caseId);
  if (entry?.case) details[entry.student_id] = { ...entry, case: { ...entry.case, ...changes } };
}

export const setTeacherScreening = (caseId: string, status: CaseInfo["teacher_screening"]) =>
  updateCase(caseId, { teacher_screening: status });

function planEnded(c: CaseInfo | null | undefined): boolean {
  return Boolean(c?.plan_ends_at) && new Date() >= new Date(c?.plan_ends_at as string);
}

function dueNow(c: CaseInfo | null | undefined): boolean {
  if (!c?.six_week_check_at) return false;
  const opens = new Date(c.six_week_check_at);
  opens.setHours(0, 0, 0, 0);
  return new Date() >= opens;
}

export function currentTodos(): Todo[] {
  const students = allStudents();
  const todos: Todo[] = [];
  const add = (
    category: TodoCategory,
    d: StudentDetail,
    title: string,
    action: TodoAction,
    primary: boolean,
  ) =>
    todos.push({
      todo_id: `t-${category}-${d.student_id}`,
      category,
      student_id: d.student_id,
      student_name:
        category === "parent" ? `${d.first_name}’s parent` : `${d.first_name} ${d.last_name}`,
      title,
      action,
      primary,
      link: action.link || `/teacher/students/${d.student_id}`,
    });

  for (const d of students) {
    const c = d.case && d.case.status !== "closed" ? d.case : null;
    const base = `/teacher/students/${d.student_id}`;
    if (c?.plan === "awaiting_approval") {
      add(
        "iep",
        d,
        "Approve or regenerate plan",
        { kind: "link", label: "Review", link: `${base}/plan` },
        true,
      );
    }
    if (c?.plan === "rejected") {
      add(
        "iep",
        d,
        "Rejected by the admin",
        { kind: "link", label: "Regenerate", link: `${base}/plan` },
        false,
      );
    }
  }
  for (const d of students) {
    const c = d.case && d.case.status !== "closed" ? d.case : null;
    const base = `/teacher/students/${d.student_id}`;
    if (c?.plan === "approved" && c.six_week_check_done && planEnded(c)) {
      add(
        "evaluation",
        d,
        "Plan finished: review and close the case",
        { kind: "link", label: "Close case", link: `${base}/close` },
        true,
      );
    } else if (c?.plan === "approved" && !c.six_week_check_done && dueNow(c)) {
      add(
        "evaluation",
        d,
        "Evaluation unlocked",
        { kind: "link", label: "Start", link: `${base}/evaluation` },
        true,
      );
    } else if (c?.teacher_screening === "not_started") {
      add(
        "evaluation",
        d,
        "Your screening is waiting",
        { kind: "link", label: "Start", link: `${base}/screening` },
        true,
      );
    } else if (!c) {
      add(
        "evaluation",
        d,
        "No case started yet",
        { kind: "start_case", label: "Start case" },
        false,
      );
    }
  }
  for (const d of students) {
    if (d.parent?.account_status === "invited") {
      add(
        "parent",
        d,
        "Has not signed in yet",
        { kind: "resend_invite", label: "Resend invite" },
        false,
      );
    }
  }

  const order: Record<TodoCategory, number> = { iep: 0, evaluation: 1, parent: 2 };
  return todos.sort(
    (a, b) => order[a.category] - order[b.category] || Number(b.primary) - Number(a.primary),
  );
}
