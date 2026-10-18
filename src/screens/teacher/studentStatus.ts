import type { StudentRow } from "@/types/api";

export interface StatusLook {
  label: string;
  tone: string;
  detail?: string;
}

export const STUDENT_STATUS: Record<string, StatusLook> = {
  plan_active: { label: "Plan active", tone: "green" },
  approve_plan: { label: "Approve plan", tone: "peach" },

  evaluation_open: { label: "Screening to do", tone: "rose" },
  waiting_for_parent: { label: "Waiting for parent", tone: "white" },
  no_case: { label: "No case yet", tone: "white" },
  no_concern: { label: "No concern", tone: "lavender" },
  plan_rejected: { label: "Plan sent back", tone: "rose" },
  plan_with_admin: { label: "Waiting for admin", tone: "lavender" },
  check_due: { label: "6-week check due", tone: "rose" },
  check_done: { label: "6-week check done", tone: "lavender" },
  plan_finished: { label: "Plan finished", tone: "peach" },
  screenings_done: { label: "Screenings done", tone: "white" },
  case_closed: { label: "Case closed", tone: "white" },
};

export function statusOf(
  student: Pick<StudentRow, "status" | "next_evaluation_date" | "plan_ends_at">,
): StatusLook {
  const status = STUDENT_STATUS[student.status] || { label: "Unknown", tone: "white" };
  if (student.status === "plan_active" && student.next_evaluation_date) {
    const date = new Date(student.next_evaluation_date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
    return { ...status, detail: `\u00a0· eval ${date}` };
  }
  if (student.status === "check_done" && student.plan_ends_at) {
    return { ...status, detail: `\u00a0· ends ${short(student.plan_ends_at)}` };
  }
  return status;
}

const IEP_ACTIVE = ["plan_active", "check_due", "check_done"];

const short = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export const STUDENT_FILTERS: { id: string; label: string; test: (s: StudentRow) => boolean }[] = [
  { id: "all", label: "All", test: () => true },
  { id: "action", label: "Needs my action", test: (s: StudentRow) => Boolean(s.needs_action) },
  { id: "iep", label: "Active IEP", test: (s: StudentRow) => IEP_ACTIVE.includes(s.status) },
];
