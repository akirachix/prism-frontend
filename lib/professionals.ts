import { request } from "@/lib/api";

export type Specialty = "PSYCHOLOGIST" | "PSYCHIATRIST";

export interface Professional {
  professional_id: string;
  first_name: string;
  last_name: string;
  specialty: Specialty;
  contact_details: string;
  location_address: string;
  is_active: boolean;
  created_at: string;
}

const LABELS: Record<Specialty, string> = {
  PSYCHOLOGIST: "Psychologist",
  PSYCHIATRIST: "Psychiatrist",
};

export function specialtyLabel(value: string): string {
  return LABELS[value as Specialty] ?? value;
}

export function professionalName(
  item: Pick<Professional, "first_name" | "last_name">,
) {
  return `${item.first_name} ${item.last_name}`.trim();
}

export const professionalsApi = {
  listActive: () => request<Professional[]>("/professionals?is_active=true"),
};
