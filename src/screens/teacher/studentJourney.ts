import type { CaseInfo, StudentDetail } from "@/types/api";

export type StepState = "done" | "current" | "pending" | "locked";
export interface JourneyStep {
  id: string;
  label: string;
  detail: string;
  state: StepState;
}
export interface StatusCard {
  id: string;
  title: string;
  label: string;
  tone: string;
}
export type PrimaryAction =
  | { kind: "start-case"; label: string }
  | { kind: "link"; label: string; to: string; secondary?: boolean };
type Look = { label: string; tone: string };

const shortDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";

export function planFinished(c: CaseInfo | null | undefined, now: Date = new Date()): boolean {
  return Boolean(c?.plan_ends_at) && now >= new Date(c?.plan_ends_at as string);
}

export function checkIsDue(c: CaseInfo | null | undefined, now: Date = new Date()): boolean {
  if (!c?.six_week_check_at) return false;
  const opens = new Date(c.six_week_check_at);
  opens.setHours(0, 0, 0, 0);
  return now >= opens;
}

const SCREENING_TEXT: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Done",
};

export function journeyOf(student: StudentDetail): JourneyStep[] {
  const c = student.case && student.case.status !== "closed" ? student.case : null;

  if (!c) {
    return [
      { id: "case", label: "Case started", detail: "No case yet", state: "pending" },
      {
        id: "teacher",
        label: "Your screening",
        detail: "Opens when a case starts",
        state: "locked",
      },
      {
        id: "parent",
        label: "Parent’s screening",
        detail: "Opens when a case starts",
        state: "locked",
      },
      { id: "plan", label: "Plan (IEP)", detail: "Opens after both screenings", state: "locked" },
      {
        id: "check",
        label: "6-week check",
        detail: "Opens 6 weeks after approval",
        state: "locked",
      },
    ];
  }

  const teacherDone = c.teacher_screening === "completed";
  const parentDone = c.parent_screening === "completed";
  const bothDone = teacherDone && parentDone;

  let planState: StepState = "locked";
  let planLabel = "Plan (IEP)";
  let planDetail = "Opens after both screenings";
  if (c.plan === "rejected") {
    planState = "current";
    planLabel = "Plan sent back";
    planDetail = "Sent back by the admin";
  } else if (c.plan === "awaiting_admin") {
    planState = "current";
    planLabel = "Waiting for admin approval";
    planDetail = "You approved it; the school admin has not yet";
  } else if (c.plan === "awaiting_approval") {
    planState = "current";
    planLabel = "Plan ready for you";
    planDetail = "Waiting for your approval";
  } else if (bothDone) {
    if (c.plan === "approved") {
      planState = "done";
      planLabel = "Plan approved";
      planDetail = `Approved by the admin ${shortDate(c.plan_approved_at)}`;
    } else if (c.plan === "not_needed") {
      planState = "done";
      planLabel = "No plan needed";
      planDetail = "No concern found";
    } else {
      planDetail = "Being prepared";
    }
  }

  let checkState: StepState = "locked";
  let checkDetail = "Opens 6 weeks after approval";
  if (c.plan === "approved") {
    if (c.six_week_check_done) {
      checkState = "done";
      checkDetail = planFinished(c)
        ? `Done · plan finished ${shortDate(c.plan_ends_at)}`
        : c.plan_ends_at
          ? `Done · plan runs until ${shortDate(c.plan_ends_at)}`
          : "Done";
    } else if (checkIsDue(c)) {
      checkState = "current";
      checkDetail = `Open since ${shortDate(c.six_week_check_at)}`;
    } else {
      checkDetail = `Opens ${shortDate(c.six_week_check_at)}`;
    }
  } else if (c.plan === "not_needed") {
    checkDetail = "Not needed";
  }

  return [
    {
      id: "case",
      label: "Case started",
      detail: `By you · ${shortDate(c.started_at)}`,
      state: "done",
    },
    {
      id: "teacher",
      label: "Your screening",
      detail: SCREENING_TEXT[c.teacher_screening] || "Not started",
      state: teacherDone ? "done" : "current",
    },
    {
      id: "parent",
      label: "Parent’s screening",
      detail: SCREENING_TEXT[c.parent_screening] || "Not started",
      state: parentDone ? "done" : teacherDone ? "current" : "pending",
    },
    { id: "plan", label: planLabel, detail: planDetail, state: planState },
    { id: "check", label: "6-week check", detail: checkDetail, state: checkState },
  ];
}

export function statusCardsOf(student: StudentDetail): StatusCard[] {
  const c = student.case;
  const open = c && c.status !== "closed";

  const caseCard: Look = !c
    ? { label: "No case yet", tone: "white" }
    : open
      ? { label: `Case started ${shortDate(c.started_at)}`, tone: "sky" }
      : { label: "Case closed", tone: "white" };

  const screening = (value: string | undefined, waitingLabel: Look): Look => {
    if (!open) return { label: "—", tone: "white" };
    if (value === "completed") return { label: "Done", tone: "green" };
    if (value === "in_progress") return { label: "In progress", tone: "lavender" };
    return waitingLabel;
  };

  return [
    { id: "case", title: "Case status", ...caseCard },
    {
      id: "teacher",
      title: "Your screening",
      ...screening(c?.teacher_screening, { label: "Not started", tone: "peach" }),
    },
    {
      id: "parent",
      title: "Parent’s screening",
      ...screening(c?.parent_screening, { label: "Waiting", tone: "slate" }),
    },
  ];
}

export function primaryActionOf(student: StudentDetail): PrimaryAction | null {
  const c = student.case && student.case.status !== "closed" ? student.case : null;
  const base = `/teacher/students/${student.student_id}`;
  if (!c) return { kind: "start-case", label: "Start a case" };
  if (c.teacher_screening === "not_started") {
    return { kind: "link", label: "Start my screening", to: `${base}/screening` };
  }
  if (c.teacher_screening === "in_progress") {
    return { kind: "link", label: "Continue my screening", to: `${base}/screening` };
  }
  if (c.plan === "awaiting_approval") {
    return { kind: "link", label: "Review plan", to: `${base}/plan` };
  }
  if (c.plan === "rejected") {
    return { kind: "link", label: "Regenerate plan", to: `${base}/plan` };
  }
  if (c.plan === "approved" && !c.six_week_check_done && checkIsDue(c)) {
    return { kind: "link", label: "Start 6-week check", to: `${base}/evaluation` };
  }
  if (c.plan === "approved" && c.six_week_check_done && planFinished(c)) {
    return { kind: "link", label: "Close case", to: `${base}/close` };
  }
  if (c.plan === "awaiting_admin" || c.plan === "approved") {
    return { kind: "link", label: "View plan", to: `${base}/plan`, secondary: true };
  }
  return null;
}

export function planLocked(student: StudentDetail): boolean {
  const c = student.case;
  return (
    !c ||
    c.status === "closed" ||
    !["approved", "awaiting_approval", "awaiting_admin", "rejected"].includes(c.plan)
  );
}
