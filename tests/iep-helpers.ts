import type { IEP } from "@/lib/ieps";

export function makeIep(overrides: Partial<IEP> = {}): IEP {
  return {
    iep_id: "i1",
    case_id: "c1",
    version_number: 1,
    status: "PENDING_APPROVAL",
    generated_content: "Plan",
    rag_file_references: [],
    short_term_goals: [],
    strategies: [],
    generated_by: "AI",
    teacher_approved: false,
    teacher_approved_by: null,
    admin_approved: false,
    admin_approved_by: null,
    rejection_reason: null,
    approved_at: null,
    evaluation_unlock_date: null,
    created_by: "t1",
    created_at: "2026-10-01T00:00:00Z",
    superseded_at: null,
    ...overrides,
  };
}
