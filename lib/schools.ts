import { request } from "@/lib/api";

export interface School {
  school_id: string;
  name: string;
  county: string;
  is_active: boolean;
  created_at: string;
}

export const schoolsApi = {
  get: (schoolId: string) => request<School>(`/schools/${schoolId}`),
};
