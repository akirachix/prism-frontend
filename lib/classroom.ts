import { casesApi, latestCase } from "@/lib/cases";
import { currentIep, evaluationIsOpen, iepsApi, type IEP } from "@/lib/ieps";
import { getStudents, studentName, type Student } from "@/lib/lookups";
import type { Case } from "@/lib/types";
import type { PillTone } from "@/lib/format";

/**
 * Everything the teacher's Home, Students and To do pages need, loaded in
 * four calls: students, cases, and plans waiting / active / sent back.
 */
export interface Classroom {
  students: Student[];
  cases: Case[];
  caseByStudent: Map<string, Case>;
  iepByCase: Map<string, IEP>;
}

export async function loadClassroom(teacherId: string): Promise<Classroom> {
  const [students, cases, pending, active, rejected] = await Promise.all([
    getStudents(teacherId),
    casesApi.listBy({ initiated_by: teacherId }),
    iepsApi.list({ status: "PENDING_APPROVAL" }),
    iepsApi.list({ status: "ACTIVE" }),
    iepsApi.list({ status: "REJECTED" }),
  ]);

  const caseByStudent = new Map<string, Case>();
  const byStudent = new Map<string, Case[]>();
  for (const item of cases) {
    byStudent.set(item.student_id, [
      ...(byStudent.get(item.student_id) ?? []),
      item,
    ]);
  }
  for (const [studentId, list] of byStudent) {
    const latest = latestCase(list);
    if (latest) caseByStudent.set(studentId, latest);
  }

  const myCases = new Set(cases.map((item) => item.case_id));
  const byCase = new Map<string, IEP[]>();
  for (const iep of [...pending, ...active, ...rejected]) {
    if (!myCases.has(iep.case_id)) continue;
    byCase.set(iep.case_id, [...(byCase.get(iep.case_id) ?? []), iep]);
  }
  const iepByCase = new Map<string, IEP>();
  for (const [caseId, list] of byCase) {
    const iep = currentIep(list);
    if (iep) iepByCase.set(caseId, iep);
  }

  return { students, cases, caseByStudent, iepByCase };
}

export interface StudentStatus {
  label: string;
  tone: PillTone;
  needsAction: boolean;
  activePlan: boolean;
}

/** The pill shown next to a student in the class list. */
export function studentStatus(
  caseItem: Case | undefined,
  iep: IEP | undefined,
): StudentStatus {
  const status = (
    label: string,
    tone: PillTone,
    needsAction = false,
    activePlan = false,
  ) => ({
    label,
    tone,
    needsAction,
    activePlan,
  });

  if (!caseItem) return status("No case yet", "outline");
  if (iep?.status === "ACTIVE") {
    return evaluationIsOpen(iep)
      ? status("6-week check open", "orange", true, true)
      : status("Plan active", "sky", false, true);
  }
  if (iep?.status === "PENDING_APPROVAL" && !iep.teacher_approved) {
    return status("Approve plan", "blush", true);
  }
  if (iep?.status === "PENDING_APPROVAL")
    return status("Waiting for admin", "outline");
  if (iep?.status === "REJECTED")
    return status("Plan sent back", "blush", true);

  switch (caseItem.status) {
    case "INITIATED":
      return status("Screening open", "orange", true);
    case "PARENT_SCREENING_COMPLETED":
      return caseItem.domain_density_score === null
        ? status("Your screening", "orange", true)
        : status("Plan being prepared", "outline");
    case "TEACHER_SCREENING_COMPLETED":
      return caseItem.domain_density_score === null
        ? status("Waiting for parent", "outline")
        : status("Plan being prepared", "outline");
    case "NO_CONCERN_IDENTIFIED":
      return status("No concern", "blush");
    case "EVALUATION_PENDING":
      return status("6-week check", "orange", true, true);
    case "COMPLETED":
      return status("Completed", "grey");
    case "CLOSED":
      return status("Closed", "grey");
    default:
      return status("In progress", "outline");
  }
}

export interface AttentionItem {
  id: string;
  kind: "iep" | "evaluation" | "case";
  name: string;
  text: string;
  href: string;
  action: string;
  urgent: boolean;
}

/** "Needs your attention" on Home and the IEP / evaluation groups in To do. */
export function attentionItems(
  room: Classroom,
  now = new Date(),
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const studentsById = new Map(room.students.map((s) => [s.student_id, s]));

  for (const [caseId, iep] of room.iepByCase) {
    const caseItem = room.cases.find((item) => item.case_id === caseId);
    const student = caseItem
      ? studentsById.get(caseItem.student_id)
      : undefined;
    const name = student ? studentName(student) : "A student";
    if (iep.status === "PENDING_APPROVAL" && !iep.teacher_approved) {
      items.push({
        id: `iep-${iep.iep_id}`,
        kind: "iep",
        name,
        text: "Approve or regenerate plan",
        href: `/teacher/cases/${caseId}/plan`,
        action: "Review",
        urgent: true,
      });
    } else if (iep.status === "REJECTED") {
      items.push({
        id: `iep-${iep.iep_id}`,
        kind: "iep",
        name,
        text: "Rejected by the admin",
        href: `/teacher/cases/${caseId}/plan`,
        action: "Regenerate",
        urgent: false,
      });
    } else if (iep.status === "ACTIVE" && iep.evaluation_unlock_date) {
      const open = evaluationIsOpen(iep, now);
      items.push({
        id: `eval-${iep.iep_id}`,
        kind: "evaluation",
        name,
        text: open
          ? "Evaluation unlocked"
          : `Evaluation starts on ${new Date(iep.evaluation_unlock_date).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`,
        href: `/teacher/cases/${caseId}/check`,
        action: open ? "Start" : "View",
        urgent: open,
      });
    }
  }

  for (const caseItem of room.caseByStudent.values()) {
    if (room.iepByCase.has(caseItem.case_id)) continue;
    const student = studentsById.get(caseItem.student_id);
    if (!student) continue;
    const ownTurn =
      caseItem.status === "INITIATED" ||
      (caseItem.status === "PARENT_SCREENING_COMPLETED" &&
        caseItem.domain_density_score === null);
    if (ownTurn) {
      items.push({
        id: `screen-${caseItem.case_id}`,
        kind: "evaluation",
        name: studentName(student),
        text: "Your screening is waiting",
        href: `/teacher/cases/${caseItem.case_id}/screening`,
        action: "Start",
        urgent: true,
      });
    }
  }

  for (const student of room.students) {
    if (room.caseByStudent.has(student.student_id)) continue;
    items.push({
      id: `nocase-${student.student_id}`,
      kind: "case",
      name: studentName(student),
      text: "No case started yet",
      href: `/teacher/students/${student.student_id}`,
      action: "Start case",
      urgent: false,
    });
  }

  return items.sort((a, b) => Number(b.urgent) - Number(a.urgent));
}
