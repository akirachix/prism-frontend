import { query, request } from "@/lib/api";
import type { Case, CaseCreate, CaseUpdate } from "@/lib/types";

export function latestCase(cases: Case[] | null | undefined): Case | null {
  if (!cases || cases.length === 0) return null;
  return [...cases].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )[0];
}

export const casesApi = {
  list: (limit = 200, offset = 0) =>
    request<Case[]>(`/cases${query({ limit, offset })}`),
  listBy: (
    params: Record<string, string | number | boolean | null | undefined>,
  ) => request<Case[]>(`/cases${query(params)}`),
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
