import { query, request } from "@/lib/api";

export interface Report<T extends object = Record<string, unknown>> {
  report_id: string;
  case_id: string;
  content: T;
  generated_at: string;
}

export const reportsApi = {
  list: (caseId?: string) =>
    request<Report[]>(`/reports${query({ case_id: caseId, limit: 50 })}`),
  forCase: <T extends object = Record<string, unknown>>(caseId: string) =>
    request<Report<T>>(`/reports/case/${caseId}`),
  create: (caseId: string, content: object) =>
    request<Report>("/reports", {
      method: "POST",
      body: JSON.stringify({ case_id: caseId, content }),
    }),
  replace: (caseId: string, content: object) =>
    request<Report>(`/reports/case/${caseId}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),
};
