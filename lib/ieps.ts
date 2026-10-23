import { query, request } from "@/lib/api";

export type IEPStatus =
  "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "SUPERSEDED";

export interface IEP {
  iep_id: string;
  case_id: string;
  version_number: number;
  status: IEPStatus;
  generated_content: string;
  rag_file_references: string[];
  short_term_goals: string[];
  strategies: string[];
  generated_by: "MANUAL" | "AI";
  teacher_approved: boolean;
  teacher_approved_by: string | null;
  admin_approved: boolean;
  admin_approved_by: string | null;
  rejection_reason: string | null;
  approved_at: string | null;
  evaluation_unlock_date: string | null;
  created_by: string;
  created_at: string;
  superseded_at: string | null;
}

export type Iep = IEP;
export type IepStatus = IEPStatus;

export interface IEPFilters {
  case_id?: string;
  status?: IEPStatus;
  limit?: number;
  offset?: number;
}

type ApproverRole = "TEACHER" | "ADMIN";

function approveIep(iepId: string, approvedBy: string): Promise<IEP>;
function approveIep(
  iepId: string,
  role: ApproverRole,
  approvedBy: string,
): Promise<IEP>;
function approveIep(iepId: string, first: string, second?: string) {
  const role = second === undefined ? "TEACHER" : (first as ApproverRole);
  const approvedBy = second === undefined ? first : second;
  return request<IEP>(`/ieps/${iepId}/approve`, {
    method: "POST",
    body: JSON.stringify({ role, approved_by: approvedBy }),
  });
}

export const iepsApi = {
  list: (filters: IEPFilters = {}) =>
    request<IEP[]>(`/ieps${query({ limit: 200, ...filters })}`),
  page: (limit = 200, offset = 0) =>
    request<IEP[]>(`/ieps${query({ limit, offset })}`),
  activeForCase: (caseId: string) =>
    request<IEP>(`/ieps/case/${caseId}/active`),
  get: (iepId: string) => request<IEP>(`/ieps/${iepId}`),
  submit: (iepId: string) =>
    request<IEP>(`/ieps/${iepId}/submit`, { method: "POST" }),
  approve: approveIep,
  reject: (iepId: string, reason: string) =>
    request<IEP>(`/ieps/${iepId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

export function currentIep(ieps: IEP[]): IEP | null {
  const live = ieps.filter((item) => item.status !== "SUPERSEDED");
  const pool = live.length > 0 ? live : ieps;
  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => b.version_number - a.version_number)[0];
}

export function evaluationIsOpen(iep: IEP, now = new Date()): boolean {
  if (iep.status !== "ACTIVE" || !iep.evaluation_unlock_date) return false;
  return new Date(iep.evaluation_unlock_date).getTime() <= now.getTime();
}

const WEEK = 7 * 24 * 60 * 60 * 1000;

export function weeksElapsed(iep: IEP, now = new Date()) {
  const total = 6;
  if (!iep.approved_at) return { week: 0, total };
  const passed = Math.floor(
    (now.getTime() - new Date(iep.approved_at).getTime()) / WEEK,
  );
  return { week: Math.min(total, Math.max(0, passed)), total };
}
