import { query, request } from "@/lib/api";
import type { Case, CaseCreate, CaseUpdate } from "@/lib/types";

export interface CaseFilters {
  school_id?: string;
  student_id?: string;
  initiated_by?: string;
  status?: string;
  open_only?: boolean;
  limit?: number;
}

export const casesApi = {
  list: () => request<Case[]>("/cases"),
  listBy: (filters: CaseFilters) =>
    request<Case[]>(`/cases${query({ limit: 200, ...filters })}`),
  get: (caseId: string) => request<Case>(`/cases/${caseId}`),
  create: (data: CaseCreate) =>
    request<Case>("/cases", { method: "POST", body: JSON.stringify(data) }),
  update: (caseId: string, data: CaseUpdate) =>
    request<Case>(`/cases/${caseId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (caseId: string) =>
    request<void>(`/cases/${caseId}`, { method: "DELETE" }),
  close: (caseId: string, reason: string) =>
    request<Case>(`/cases/${caseId}/close`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

/** The newest case for a student, open cases first. */
export function latestCase(cases: Case[]): Case | null {
  if (cases.length === 0) return null;
  return [...cases].sort((a, b) => {
    const aOpen = a.closed_at ? 1 : 0;
    const bOpen = b.closed_at ? 1 : 0;
    if (aOpen !== bOpen) return aOpen - bOpen;
    return b.created_at.localeCompare(a.created_at);
  })[0];
}
