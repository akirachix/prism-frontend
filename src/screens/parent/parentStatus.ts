import type { ParentChild } from "@/types/api";
import { STUDENT_STATUS } from "@/screens/teacher/studentStatus";

const PARENT_WORDS: Record<string, string> = {
  evaluation_open: "Teacher’s screening to do",
  waiting_for_parent: "Your screening to do",
  approve_plan: "Plan being prepared",
  plan_rejected: "Plan being updated",
  plan_with_admin: "Waiting for school approval",
};

export function parentStatusLook(code: string | null | undefined): { label: string; tone: string } {
  const look = (code && STUDENT_STATUS[code]) || STUDENT_STATUS.no_case;
  return { label: (code && PARENT_WORDS[code]) || look.label, tone: look.tone };
}

export interface ParentStatusLook {
  label: string;
  tone: string;

  action?: string;
}

const short = (iso: string) =>
  new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

export function statusOf(
  child:
    | Pick<
        ParentChild,
        "status" | "parent_screening" | "case_id" | "next_check_date" | "plan_ends_at"
      >
    | null
    | undefined,
): ParentStatusLook {
  const look = parentStatusLook(child?.status);
  let label = look.label;
  if (child?.status === "plan_active" && child.next_check_date)
    label += ` · check ${short(child.next_check_date)}`;
  if (child?.status === "check_done" && child.plan_ends_at)
    label += ` · ends ${short(child.plan_ends_at)}`;

  const open = child?.case_id && child.status !== "case_closed";
  const action =
    open && child.parent_screening === "not_started"
      ? "Start screening"
      : open && child.parent_screening === "in_progress"
        ? "Continue screening"
        : undefined;
  return { label, tone: look.tone, action };
}

export function formatBirthday(iso?: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
