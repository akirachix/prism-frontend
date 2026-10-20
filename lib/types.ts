export type CaseStatus = string;

export interface Case {
  case_id: string;
  school_id: string;
  student_id: string;
  initiated_by: string;
  status: CaseStatus;
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

export interface CaseCreate {
  school_id: string;
  student_id: string;
  initiated_by: string;
}

export const FINISHED_STATUSES: CaseStatus[] = [
  "COMPLETED",
  "NO_CONCERN_IDENTIFIED",
  "CLOSED",
];

export interface CaseUpdate {
  status?: CaseStatus;
  autism_score?: number;
  adhd_score?: number;
  dyslexia_score?: number;
  domain_density_score?: number;
  primary_domain?: string;
}
