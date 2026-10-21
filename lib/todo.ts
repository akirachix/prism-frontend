import { casesApi } from "@/lib/cases";
import { iepsApi, type Iep } from "@/lib/ieps";

export interface IepTodo {
  id: string;
  caseId: string;
  name: string;
  text: string;
  action: "Review" | "Regenerate";
}

export async function loadIepTodo(): Promise<IepTodo[]> {
  const [cases, ieps] = await Promise.all([casesApi.list(), iepsApi.list()]);

  const caseStudent = new Map<string, string>();
  for (const c of cases) {
    caseStudent.set(c.case_id, c.student_id);
  }

  const latest = new Map<string, Iep>();
  for (const iep of ieps) {
    if (!caseStudent.has(iep.case_id)) continue;
    const current = latest.get(iep.case_id);
    if (!current || iep.version_number > current.version_number) {
      latest.set(iep.case_id, iep);
    }
  }

  const items: IepTodo[] = [];
  for (const iep of latest.values()) {
    const studentId = caseStudent.get(iep.case_id)!;
    const name = `Student ${studentId.slice(0, 8)}…`;

    if (iep.status === "PENDING_APPROVAL" && !iep.teacher_approved) {
      items.push({
        id: iep.iep_id,
        caseId: iep.case_id,
        name,
        text: "Approve or regenerate plan",
        action: "Review",
      });
    } else if (iep.status === "REJECTED") {
      items.push({
        id: iep.iep_id,
        caseId: iep.case_id,
        name,
        text: iep.rejection_reason ?? "Rejected by the admin",
        action: "Regenerate",
      });
    }
  }
  return items;
}
