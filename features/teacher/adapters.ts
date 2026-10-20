/**
 * ADAPTERS: backend shape -> teacher UI types. If the backend renames a field,
 * or the student endpoint arrives, this is the place to change.
 */
import type { CaseRead, CaseStatus, IepRead, NotificationRead } from "@/lib/api-types";
import { CLOSED_CASE_STATUSES } from "@/lib/api-types";
import { formatDate, timeAgo } from "@/lib/format";
import type { ActivityItem, AttentionItem, DashboardStats, StudentRow, TodoItem } from "./types";

/** Until /students exists a student is only known by id. */
export const studentLabel = (studentId: string) => `Student ${studentId.slice(0, 6).toUpperCase()}`;

/** Case status -> the wording of the Students table (the filter chips look for "attention" / "active"). */
const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  INITIATED: "Screening in progress",
  TEACHER_SCREENING_COMPLETED: "Waiting for parent",
  PARENT_SCREENING_COMPLETED: "Needs attention",
  IEP_PENDING_APPROVAL: "Needs attention",
  IEP_ACTIVE: "Active plan",
  EVALUATION_PENDING: "Needs attention",
  NO_CONCERN_IDENTIFIED: "No plan needed",
  CLOSED: "Closed",
  COMPLETED: "Completed",
};

export const isOpenCase = (c: CaseRead) => !CLOSED_CASE_STATUSES.includes(c.status);

/** One row per student: the newest case wins. */
export function toStudentRows(cases: CaseRead[]): StudentRow[] {
  const newest = new Map<string, CaseRead>();
  for (const c of cases) {
    const seen = newest.get(c.student_id);
    if (!seen || c.created_at > seen.created_at) newest.set(c.student_id, c);
  }
  return [...newest.values()].map((c) => ({
    id: c.student_id,
    name: studentLabel(c.student_id),
    admissionNumber: null,
    className: null,
    status: CASE_STATUS_LABEL[c.status],
  }));
}

export function toStats(cases: CaseRead[], ieps: IepRead[]): DashboardStats {
  return {
    students: new Set(cases.map((c) => c.student_id)).size,
    openCases: cases.filter(isOpenCase).length,
    activeIeps: ieps.filter((i) => i.status === "ACTIVE").length,
    unapprovedIeps: ieps.filter((i) => i.status === "DRAFT" || i.status === "PENDING_APPROVAL").length,
  };
}

const IEP_NOTE: Partial<Record<IepRead["status"], { note: string; status: string }>> = {
  DRAFT: { note: "IEP draft needs to be completed", status: "Review" },
  PENDING_APPROVAL: { note: "IEP is waiting for approval", status: "Review" },
  REJECTED: { note: "IEP was rejected - please revise", status: "Revise" },
};

export function toAttention(ieps: IepRead[], casesById: Map<string, CaseRead>): AttentionItem[] {
  return ieps
    .filter((iep) => iep.status in IEP_NOTE)
    .slice(0, 5)
    .map((iep) => {
      const entry = IEP_NOTE[iep.status]!;
      const found = casesById.get(iep.case_id);
      return {
        id: iep.iep_id,
        studentName: found ? studentLabel(found.student_id) : "Student",
        note: entry.note,
        status: entry.status,
      };
    });
}

export const toActivity = (notifications: NotificationRead[]): ActivityItem[] =>
  notifications.slice(0, 5).map((n) => ({
    id: n.notification_id,
    text: n.message,
    time: timeAgo(n.created_at),
  }));

/** To-do items are not stored anywhere: they are worked out from the teacher's cases and IEPs. */
export function toTodos(cases: CaseRead[], ieps: IepRead[]): TodoItem[] {
  const todos: TodoItem[] = [];
  const casesById = new Map(cases.map((c) => [c.case_id, c]));

  for (const c of cases) {
    const student = studentLabel(c.student_id);
    if (c.status === "INITIATED") {
      todos.push({ id: `case-${c.case_id}`, title: "Start the teacher screening", studentName: student, kind: "referral", status: "Open", dueDate: null });
    } else if (c.status === "PARENT_SCREENING_COMPLETED") {
      todos.push({ id: `case-${c.case_id}`, title: "Create the IEP", studentName: student, kind: "iep", status: "Open", dueDate: null });
    } else if (c.status === "EVALUATION_PENDING") {
      todos.push({ id: `case-${c.case_id}`, title: "Complete the evaluation", studentName: student, kind: "evaluation", status: "Due soon", dueDate: null });
    }
  }

  for (const iep of ieps) {
    const found = casesById.get(iep.case_id);
    if (!found || !(iep.status in IEP_NOTE)) continue;
    const titles = { DRAFT: "Finish and submit the IEP", PENDING_APPROVAL: "IEP waiting for approval", REJECTED: "Revise the rejected IEP" } as const;
    todos.push({
      id: `iep-${iep.iep_id}`,
      title: titles[iep.status as keyof typeof titles],
      studentName: studentLabel(found.student_id),
      kind: "iep",
      status: iep.status === "PENDING_APPROVAL" ? "Review" : "Open",
      dueDate: formatDate(iep.evaluation_unlock_date),
    });
  }
  return todos;
}
