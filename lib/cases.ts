import { request } from "@/lib/api";
import type { Case, CaseCreate, CaseUpdate } from "@/lib/types";

export const casesApi = {
  list: () => request<Case[]>("/cases"),
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
