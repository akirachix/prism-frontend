import type { IEP } from "@/lib/ieps";
import { evaluationIsOpen } from "@/lib/ieps";
import type { ScreeningContent } from "@/lib/screening";
import type { Case } from "@/lib/types";

export type StepState = "done" | "current" | "waiting" | "locked";

export interface JourneyStep {
  key: "started" | "teacher" | "parent" | "plan" | "check";
  title: string;
  note: string;
  state: StepState;
}

export function journeyFor(
  caseItem: Case,
  screening: ScreeningContent | null,
  iep: IEP | null,
  viewer: "TEACHER" | "PARENT",
): JourneyStep[] {
  const teacherDone = Boolean(screening?.teacher?.completed_at);
  const parentDone = Boolean(screening?.parent?.completed_at);
  const teacherStarted = Boolean(screening?.teacher);
  const parentStarted = Boolean(screening?.parent);
  const approved = iep?.status === "ACTIVE";
  const you = viewer === "TEACHER";

  const screeningStep = (
    done: boolean,
    started: boolean,
    mine: boolean,
  ): Pick<JourneyStep, "note" | "state"> => {
    if (done) return { note: "Done", state: "done" };
    if (started) return { note: "In progress", state: "current" };
    return { note: "Not started", state: mine ? "current" : "waiting" };
  };

  let planNote = "Opens after both screenings";
  let planState: StepState = "locked";
  if (caseItem.status === "NO_CONCERN_IDENTIFIED") {
    planNote = "Not needed: no concern found";
  } else if (approved) {
    planNote = "Approved";
    planState = "done";
  } else if (iep?.status === "PENDING_APPROVAL" || iep?.status === "DRAFT") {
    planNote = "Waiting for approval";
    planState = "current";
  } else if (iep?.status === "REJECTED") {
    planNote = "Sent back for changes";
    planState = "current";
  } else if (teacherDone && parentDone) {
    planNote = "Being prepared";
    planState = "waiting";
  }

  let checkNote = "Opens 6 weeks after approval";
  let checkState: StepState = "locked";
  if (caseItem.status === "COMPLETED") {
    checkNote = "Done";
    checkState = "done";
  } else if (iep && evaluationIsOpen(iep)) {
    checkNote = "Open now";
    checkState = "current";
  }

  return [
    {
      key: "started",
      title: "Case started",
      note: you ? "By you" : "By the teacher",
      state: "done",
    },
    {
      key: "teacher",
      title: you ? "Your screening" : "Teacher's screening",
      ...screeningStep(teacherDone, teacherStarted, you),
    },
    {
      key: "parent",
      title: you ? "Parent's screening" : "Your screening",
      ...screeningStep(parentDone, parentStarted, !you),
    },
    {
      key: "plan",
      title: "Plan made and approved",
      note: planNote,
      state: planState,
    },
    { key: "check", title: "6-week check", note: checkNote, state: checkState },
  ];
}
