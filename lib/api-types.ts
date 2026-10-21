export type CaseStatus =
  | "INITIATED"
  | "TEACHER_SCREENING_COMPLETED"
  | "PARENT_SCREENING_COMPLETED"
  | "IEP_PENDING_APPROVAL"
  | "IEP_ACTIVE"
  | "EVALUATION_PENDING"
  | "NO_CONCERN_IDENTIFIED"
  | "CLOSED"
  | "COMPLETED";

export interface CaseRead {
  case_id: string;
  school_id: string;
  student_id: string;
  /** The teacher who started the case. */
  initiated_by: string;
  status: CaseStatus;
  primary_domain: "AUTISM" | "ADHD" | "DYSLEXIA" | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  closed_reason: string | null;
}

export type IepStatus =
  "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "SUPERSEDED";

export interface IepRead {
  iep_id: string;
  case_id: string;
  version_number: number;
  status: IepStatus;
  teacher_approved: boolean;
  admin_approved: boolean;
  rejection_reason: string | null;
  /** The parent evaluation opens on this date. */
  evaluation_unlock_date: string | null;
  created_at: string;
}

export interface EvaluationQuestionRead {
  eval_question_id: string;
  iep_id: string;
  position: number;
  question_text: string;
}

export type ResponderRole = "TEACHER" | "PARENT";

export interface EvaluationResponseRead {
  eval_response_id: string;
  eval_question_id: string;
  responder_id: string;
  responder_role: ResponderRole;
  /** -2 .. 2 */
  score: number;
  submitted_at: string;
}

export interface ReportRead {
  report_id: string;
  case_id: string;
  content: Record<string, unknown>;
  generated_at: string;
}

export interface NotificationRead {
  notification_id: string;
  kind: string;
  message: string;
  user_id: string;
  case_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface UserRead {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
}

export const CLOSED_CASE_STATUSES: CaseStatus[] = [
  "CLOSED",
  "COMPLETED",
  "NO_CONCERN_IDENTIFIED",
];
