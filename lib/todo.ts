import { fetchAll, request } from "@/lib/api";
import { casesApi } from "@/lib/cases";
import { iepsApi, type Iep } from "@/lib/ieps";
import { getStudents, studentName } from "@/lib/lookups";
import type { UserRead } from "@/lib/users";

export interface TodoEntry {
  id: string;
  name: string;
  text: string;
  action: string;
  urgent?: boolean;
  caseId?: string;
  userId?: string;
}

export interface TodoData {
  iep: TodoEntry[];
  evaluations: TodoEntry[];
  parents: TodoEntry[];
}

export function resendInvitation(userId: string) {
  return request<unknown>(`/users/${userId}/resend-invitation`, {
    method: "POST",
  });
}

export async function loadTodo(teacherId: string): Promise<TodoData> {
  const [students, cases, ieps] = await Promise.all([
    fetchAll((limit, offset) => getStudents(teacherId, limit, offset)),
    fetchAll(casesApi.list),
    fetchAll(iepsApi.list),
  ]);

  const studentById = new Map(students.map((s) => [s.student_id, s]));
  const caseStudent = new Map<string, string>();
  const studentsWithCase = new Set<string>();
  for (const c of cases) {
    if (!studentById.has(c.student_id)) continue;
    caseStudent.set(c.case_id, c.student_id);
    studentsWithCase.add(c.student_id);
  }

  const latest = new Map<string, Iep>();
  for (const iep of ieps) {
    if (!caseStudent.has(iep.case_id)) continue;
    const current = latest.get(iep.case_id);
    if (!current || iep.version_number > current.version_number) {
      latest.set(iep.case_id, iep);
    }
  }

  const iep: TodoEntry[] = [];
  const evaluations: TodoEntry[] = [];
  const now = Date.now();

  for (const item of latest.values()) {
    const student = studentById.get(caseStudent.get(item.case_id)!)!;
    const name = studentName(student);
    if (item.status === "PENDING_APPROVAL" && !item.teacher_approved) {
      iep.push({
        id: item.iep_id,
        caseId: item.case_id,
        name,
        text: "Approve or regenerate plan",
        action: "Review",
        urgent: true,
      });
    } else if (item.status === "REJECTED") {
      iep.push({
        id: item.iep_id,
        caseId: item.case_id,
        name,
        text: item.rejection_reason ?? "Rejected by the admin",
        action: "Regenerate",
      });
    } else if (
      item.status === "ACTIVE" &&
      item.evaluation_unlock_date &&
      new Date(item.evaluation_unlock_date).getTime() <= now
    ) {
      evaluations.push({
        id: item.iep_id,
        caseId: item.case_id,
        name: student.first_name,
        text: "Evaluation unlocked",
        action: "Start",
        urgent: true,
      });
    }
  }

  for (const student of students) {
    if (studentsWithCase.has(student.student_id)) continue;
    evaluations.push({
      id: `new-${student.student_id}`,
      name: student.first_name,
      text: "No case started yet",
      action: "Start case",
    });
  }

  const parentIds = Array.from(
    new Set(
      students
        .map((s) => s.parent_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const results = await Promise.allSettled(
    parentIds.map((id) => request<UserRead>(`/users/${id}`)),
  );
  const parents: TodoEntry[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value.must_change_password) {
      continue;
    }
    const parent = result.value;
    const child = students.find((s) => s.parent_id === parent.user_id);
    parents.push({
      id: parent.user_id,
      userId: parent.user_id,
      name: child ? `${child.first_name}’s parent` : parent.first_name,
      text: "Has not signed in yet",
      action: "Resend invite",
    });
  }

  return { iep, evaluations, parents };
}
