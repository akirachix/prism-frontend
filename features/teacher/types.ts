/** UI-facing types of the teacher portal (adapters.ts converts the backend shapes into these). */

export interface DashboardStats {
  students: number;
  openCases: number;
  activeIeps: number;
  unapprovedIeps: number;
}
export interface AttentionItem {
  id: string;
  studentName: string;
  note: string;
  status: string;
}
export interface ActivityItem {
  id: string;
  text: string;
  time: string;
}
export interface TeacherHomeData {
  stats: DashboardStats;
  needsAttention: AttentionItem[];
  latestActions: ActivityItem[];
}

export interface StudentRow {
  id: string;
  name: string;
  admissionNumber: string | null;
  className: string | null;
  status: string;
}
export interface StudentList {
  students: StudentRow[];
  /** True while real student names are not available (rows are built from cases). */
  namesPending: boolean;
}
export interface NewStudentPayload {
  name: string;
  admissionNumber: string;
  className: string;
  dateOfBirth: string;
}

export type TodoKind = "iep" | "evaluation" | "referral" | "other";
export interface TodoItem {
  id: string;
  title: string;
  studentName: string | null;
  kind: TodoKind;
  status: string;
  dueDate: string | null;
}
