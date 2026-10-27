import type { Case } from "@/lib/types";
import type { Student } from "@/lib/lookups";

export function makeCase(overrides: Partial<Case> = {}): Case {
  return {
    case_id: "c1",
    school_id: "s1",
    student_id: "aaaaaaaa-0000-0000-0000-000000000000",
    initiated_by: "t1",
    status: "INITIATED",
    autism_score: null,
    adhd_score: null,
    dyslexia_score: null,
    domain_density_score: null,
    primary_domain: null,
    created_at: "2026-10-20T01:00:00Z",
    updated_at: "2026-10-20T01:00:00Z",
    closed_at: null,
    closed_reason: null,
    ...overrides,
  };
}

export function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    student_id: "aaaaaaaa-0000-0000-0000-000000000000",
    school_id: "s1",
    teacher_id: "t1",
    admission_number: "ADM-001",
    first_name: "Amani",
    last_name: "Otieno",
    ...overrides,
  };
}
