import { request } from "@/lib/api";

export type IepStatus =
  "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "SUPERSEDED";

export interface Iep {
  iep_id: string;
  case_id: string;
  version_number: number;
  status: IepStatus;
  teacher_approved: boolean;
  admin_approved: boolean;
  rejection_reason: string | null;
  evaluation_unlock_date: string | null;
  created_at: string;
}

export const iepsApi = {
  list: () => request<Iep[]>("/ieps?limit=200"),
};
