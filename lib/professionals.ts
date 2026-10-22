import { query, request } from "@/lib/api";

export interface Professional {
  professional_id: string;
  first_name: string;
  last_name: string;
  specialty: "PSYCHOLOGIST" | "PSYCHIATRIST";
  contact_details: string;
  location_address: string;
  is_active: boolean;
  created_at: string;
}

export const professionalsApi = {
  list: (filters: { specialty?: string; search?: string } = {}) =>
    request<Professional[]>(
      `/professionals${query({ is_active: true, limit: 50, ...filters })}`,
    ),
};
