export type Role = "teacher" | "parent";

export interface User {
  user_id: string;
  first_name: string;
  last_name?: string;
  email: string;
  role: Role;
  school_name?: string;

  phone?: string;
}

export interface Session {
  user: User;
  token: string | null;
}

export interface TeacherProfile extends User {
  phone: string;
}

export type ScreeningStatus = "not_started" | "in_progress" | "completed";

export type PlanState =
  "locked" | "awaiting_approval" | "awaiting_admin" | "approved" | "rejected" | "not_needed";

export interface CaseInfo {
  case_id: string;
  status: "open" | "closed";
  started_at: string;
  teacher_screening: ScreeningStatus;
  parent_screening: ScreeningStatus;
  plan: PlanState;
  plan_approved_at: string | null;
  six_week_check_at: string | null;
  six_week_check_done: boolean;
  plan_ends_at?: string | null;
  plan_rejected_reason?: string | null;
  closed_at?: string | null;
  close_reason?: string | null;
  close_note?: string | null;
}

export interface StudentRow {
  student_id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  status: string;
  needs_action: boolean;
  next_evaluation_date: string | null;
  plan_ends_at?: string | null;
}

export interface ParentContact {
  name: string;
  account_status: "invited" | "signed_in";
  invited_at?: string;
  email?: string;
  phone?: string;
}

export interface StudentDetail extends StudentRow {
  date_of_birth?: string;
  gender?: string;
  class_name?: string;
  parent: ParentContact | null;
  case: CaseInfo | null;
}

export interface Option<V = string> {
  value: V;
  label: string;
}

export interface ScreeningQuestion {
  question_id: string;
  text: string;
  options: Option[];
}

export interface ScreeningPart {
  part_id: string;
  tool: string;
  title: string;
  description: string;
  questions: ScreeningQuestion[];
}

export type Answers = Record<string, string>;

export type PlanStatus = "draft" | "submitted" | "approved" | "rejected";

export interface PlanGoal {
  area: string;
  goal: string;
  strategies: string[];
}

export interface Plan {
  plan_id: string;
  case_id: string;
  status: PlanStatus;
  version: number;
  generated_at: string;
  approved_at: string | null;
  teacher_approved_at: string | null;
  admin_note: string | null;
  teacher_note?: string | null;
  review_date: string;
  ends_on?: string | null;
  summary: string;
  goals: PlanGoal[];
  accommodations: string[];
  home_support: string[];
}

export interface Evaluation {
  case_id: string;
  status: "locked" | "open" | "completed";
  plan_approved_at: string | null;
  opens_on: string | null;
  plan_ends_on: string | null;
  questions: { question_id: string; text: string }[];
  options: Option<number>[];
  answers: Record<string, number>;
  submitted_at: string | null;
}

export type TodoCategory = "iep" | "evaluation" | "parent";

export interface TodoAction {
  kind: "link" | "start_case" | "resend_invite";
  label: string;
  link?: string;
}

export interface Todo {
  todo_id: string;
  category: TodoCategory;
  student_id: string;
  student_name: string;
  title: string;
  action: TodoAction;
  primary: boolean;
  link: string;
}

export interface Notification {
  notification_id: string;
  user_id: string;
  kind?: string;
  title?: string;
  message: string;
  link?: string | null;
  case_id?: string | null;
  created_at: string;
  read_at: string | null;
  is_read: boolean;
}

export interface Invitation {
  token: string;
  school_name: string;
  parent_first_name: string;
  child_first_name: string;
  email: string;
  expires_at: string;
  accepted?: boolean;
}

export interface ParentChild {
  student_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  class_name: string;
  admission_number: string;

  status: string;

  parent_screening: ScreeningStatus;
  case_id: string | null;
  next_check_date: string | null;
  plan_ends_at?: string | null;
}

export type ReportKind = "screening" | "evaluation";
