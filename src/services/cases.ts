import type { CaseInfo } from "@/types/api";
import { api } from "./apiClient";

export const caseService = {
  start: (studentId: string) => api.post<CaseInfo>("/cases", { student_id: studentId }),

  close: (caseId: string, { reason, note }: { reason: string; note?: string }) =>
    api.post<CaseInfo>(`/cases/${caseId}/close`, { reason, note: note || null }),
};
