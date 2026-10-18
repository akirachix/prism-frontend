import type { StudentDetail, StudentRow } from "@/types/api";
import { api } from "./apiClient";

export const studentService = {
  listMine: () => api.get<StudentRow[]>("/teachers/me/students"),

  getMine: (studentId: string) => api.get<StudentDetail>(`/teachers/me/students/${studentId}`),

  resendParentInvite: (studentId: string) =>
    api.post<{ sent: boolean; invited_at: string }>(
      `/teachers/me/students/${studentId}/parent/invite`,
    ),
};
