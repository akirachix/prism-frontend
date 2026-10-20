/** Fake data for the teacher portal. Only used with NEXT_PUBLIC_USE_MOCKS=true. */
import type { NewStudentPayload, StudentRow, TeacherHomeData, TodoItem } from "./types";

export const mockHome: TeacherHomeData = {
  stats: { students: 20, openCases: 3, activeIeps: 1, unapprovedIeps: 1 },
  needsAttention: [
    { id: "a1", studentName: "Amani Otieno", note: "IEP draft waiting for your review", status: "Review" },
    { id: "a2", studentName: "Amani Otieno", note: "6-week check is due", status: "Due" },
    { id: "a3", studentName: "Amani Otieno", note: "Parent evaluation not started", status: "Open" },
  ],
  latestActions: [
    { id: "l1", text: "IEP approved for Grace L.", time: "2h ago" },
    { id: "l2", text: "Report ready for Amani", time: "Yesterday" },
    { id: "l3", text: "Evaluation completed", time: "2 days ago" },
  ],
};

const students: StudentRow[] = [
  { id: "s1", name: "Amani Otieno", admissionNumber: "ADM-0042", className: "Grade 2", status: "Needs attention" },
  { id: "s2", name: "Grace Lemayian", admissionNumber: "ADM-0043", className: "Grade 2", status: "Active plan" },
  { id: "s3", name: "Brian Kamau", admissionNumber: "ADM-0044", className: "Grade 2", status: "Waiting for consent" },
  { id: "s4", name: "Zawadi Njeri", admissionNumber: "ADM-0045", className: "Grade 2", status: "No plan yet" },
  { id: "s5", name: "Peter Mwangi", admissionNumber: "ADM-0046", className: "Grade 2", status: "Screening not due" },
  { id: "s6", name: "Neema Chebet", admissionNumber: "ADM-0047", className: "Grade 2", status: "Active plan" },
];

export const mockStudents = students;

export function mockAddStudent(payload: NewStudentPayload) {
  students.push({
    id: `s${students.length + 1}`,
    name: payload.name,
    admissionNumber: payload.admissionNumber,
    className: payload.className || null,
    status: "No plan yet",
  });
}

export const mockTodos: TodoItem[] = [
  { id: "t1", title: "Review IEP draft", studentName: "Amani Otieno", kind: "iep", status: "Open", dueDate: "Fri" },
  { id: "t2", title: "Complete 6-week check", studentName: "Amani Otieno", kind: "evaluation", status: "Due soon", dueDate: "Mon" },
  { id: "t3", title: "Parent evaluation to review", studentName: "Grace Lemayian", kind: "evaluation", status: "Open", dueDate: null },
  { id: "t4", title: "Referral follow-up", studentName: "Brian Kamau", kind: "referral", status: "Open", dueDate: "Next week" },
];
