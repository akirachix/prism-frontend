import { request } from "@/lib/api";

export type IepStatus =
  "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "SUPERSEDED";

export interface Iep {
  iep_id: string;
  case_id: string;
  version_number: number;
  status: IepStatus;
  generated_content: string;
  short_term_goals: string[];
  strategies: string[];
  teacher_approved: boolean;
  admin_approved: boolean;
  rejection_reason: string | null;
  evaluation_unlock_date: string | null;
  created_at: string;
}

export const iepsApi = {
  list: (limit = 200, offset = 0) =>
    request<Iep[]>(`/ieps?limit=${limit}&offset=${offset}`),
  get: (iepId: string) => request<Iep>(`/ieps/${iepId}`),
  approve: (iepId: string, approvedBy: string) =>
    request<Iep>(`/ieps/${iepId}/approve`, {
      method: "POST",
      body: JSON.stringify({ role: "TEACHER", approved_by: approvedBy }),
    }),
  reject: (iepId: string, reason: string) =>
    request<Iep>(`/ieps/${iepId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};
