import type { CaseInfo, Plan, PlanGoal, PlanStatus } from "@/types/api";
import { addNotification } from "./notifications";
import { findCase, studentOfCase, updateCase } from "./students";

export const DRAFTS: {
  summary: string;
  goals: PlanGoal[];
  accommodations: string[];
  home_support: string[];
}[] = [
  {
    summary:
      "{first} shows some difficulty keeping attention on tasks and waiting for a turn. This plan gives simple classroom steps to try for the next 6 weeks.",
    goals: [
      {
        area: "Attention",
        goal: "{first} will stay on a 10-minute task with no more than one reminder, 4 days out of 5.",
        strategies: [
          "Seat {first} near the front, away from the door and windows.",
          "Break longer tasks into short steps and tick each one off together.",
          "Use a quiet signal, like a tap on the desk, instead of calling out.",
        ],
      },
      {
        area: "Turn-taking",
        goal: "{first} will wait for their turn in group work in 3 out of 4 sessions.",
        strategies: [
          "Use a talking object: only the child holding it speaks.",
          "Praise {first} straight away each time they wait.",
        ],
      },
    ],
    accommodations: ["Short movement breaks between lessons", "Extra 10 minutes on written tests"],
    home_support: ["Keep a simple daily routine for homework at the same time each day."],
  },
  {
    summary:
      "{first} needs support with focus and self-control in class. This draft uses routines and visual reminders over the next 6 weeks.",
    goals: [
      {
        area: "Focus",
        goal: "{first} will finish 3 out of 4 class tasks started each day.",
        strategies: [
          "Put a picture checklist of the task steps on {first}’s desk.",
          "Give one instruction at a time and ask {first} to repeat it back.",
          "Use a timer so {first} can see how long is left.",
        ],
      },
      {
        area: "Self-control",
        goal: "{first} will raise a hand before speaking in 4 out of 5 lessons.",
        strategies: [
          "Agree on a hand signal for “I want to speak”.",
          "Give {first} a classroom job, like handing out books, to move with purpose.",
        ],
      },
    ],
    accommodations: [
      "Seat near the teacher",
      "Instructions written on the board as well as spoken",
    ],
    home_support: ["Praise finished homework, even small parts of it."],
  },
];

export const SIX_WEEKS = 42 * 24 * 60 * 60 * 1000;
export const fill = (text: string, first: string) => text.replaceAll("{first}", first);

export function draftFor(caseId: string, version: number): Plan {
  const first = studentOfCase(caseId)?.first_name ?? "The child";
  const t = DRAFTS[(version - 1) % DRAFTS.length];
  return {
    plan_id: `p-${caseId}-v${version}`,
    case_id: caseId,
    status: "draft",
    version,
    generated_at: new Date().toISOString(),
    approved_at: null,
    teacher_approved_at: null,
    admin_note: null,
    review_date: new Date(Date.now() + SIX_WEEKS).toISOString().slice(0, 10),
    summary: fill(t.summary, first),
    goals: t.goals.map((g) => ({
      ...g,
      goal: fill(g.goal, first),
      strategies: g.strategies.map((x) => fill(x, first)),
    })),
    accommodations: t.accommodations,
    home_support: t.home_support,
  };
}

export let plans: Record<string, Plan> = {};
export function resetPlans() {
  plans = {};
}

export const STATUS_FOR: Partial<Record<CaseInfo["plan"], PlanStatus>> = {
  awaiting_approval: "draft",
  awaiting_admin: "submitted",
  approved: "approved",
  rejected: "rejected",
};

export function planOf(caseId: string): Plan | undefined {
  const c = findCase(caseId);
  const status = c ? STATUS_FOR[c.plan] : undefined;
  if (c && !plans[caseId] && status) {
    const draft = draftFor(caseId, 1);
    plans[caseId] = {
      ...draft,
      status,
      approved_at: c.plan === "approved" ? c.plan_approved_at : null,
      review_date: c.six_week_check_at || draft.review_date,
      ends_on: c.plan_ends_at || null,
      admin_note: c.plan === "rejected" ? c.plan_rejected_reason || null : null,
    };
  }
  return plans[caseId];
}

export function adminDecide(
  caseId: string,
  { approve, note = "" }: { approve: boolean; note?: string },
): Plan | null {
  const plan = planOf(caseId);
  const student = studentOfCase(caseId);
  if (!plan || !student || plan.status !== "submitted") return null;
  const now = new Date();
  const link = `/teacher/students/${student.student_id}/plan`;
  if (approve) {
    const review = new Date(now.getTime() + SIX_WEEKS).toISOString().slice(0, 10);
    const ends = new Date(now.getTime() + 2 * SIX_WEEKS).toISOString().slice(0, 10);
    plans[caseId] = {
      ...plan,
      status: "approved",
      approved_at: now.toISOString(),
      review_date: review,
      ends_on: ends,
    };
    updateCase(caseId, {
      plan: "approved",
      plan_approved_at: now.toISOString(),
      six_week_check_at: review,
      plan_ends_at: ends,
    });
    addNotification({
      kind: "PLAN_APPROVED",
      message: `${student.first_name}’s plan was approved by the school admin. It’s now active.`,
      link,
      caseId,
    });
  } else {
    plans[caseId] = {
      ...plan,
      status: "rejected",
      admin_note: note || "Please make changes and send it again.",
    };
    updateCase(caseId, { plan: "rejected", plan_rejected_reason: plans[caseId].admin_note });
    addNotification({
      kind: "PLAN_REJECTED",
      message: `${student.first_name}’s plan was sent back by the school admin.`,
      link,
      caseId,
    });
  }
  return plans[caseId];
}
