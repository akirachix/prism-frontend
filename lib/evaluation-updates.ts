import type { Classroom } from "@/lib/classroom";
import { lockCountdown } from "@/lib/evaluation-flow";
import {
  evaluationsApi,
  type EvaluationResponse,
  type EvaluationRound,
  type ResponderRole,
} from "@/lib/evaluations";
import { formatLongDay } from "@/lib/format";
import type { IEP } from "@/lib/ieps";
import { studentName, type Student } from "@/lib/lookups";
import type { Notification } from "@/lib/notifications";

/** One line in "Latest updates" on a home page. */
export interface UpdateItem {
  id: string;
  text: string;
  /** When it happened (ISO). Reminders use the time they were worked out. */
  date: string;
  href?: string;
  /** Something to do now; shown first and highlighted. */
  urgent?: boolean;
  unread?: boolean;
}

/** Upcoming checks are mentioned from two weeks before they open. */
const SOON = 14 * 24 * 60 * 60 * 1000;

function newest(list: EvaluationResponse[]): EvaluationResponse | null {
  if (list.length === 0) return null;
  return [...list].sort(
    (a, b) =>
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
  )[0];
}

/**
 * The other person's latest submission for this round. Answers are sent
 * all at once, so the first question tells when they last submitted.
 */
async function otherSubmission(
  round: EvaluationRound,
  other: ResponderRole,
): Promise<EvaluationResponse | null> {
  const first = [...round.questions].sort((a, b) => a.position - b.position)[0];
  if (!first) return null;
  return newest(
    await evaluationsApi.responses({
      eval_question_id: first.eval_question_id,
      responder_role: other,
    }),
  );
}

/** What the signed-in person should know about one child's 6-week check. */
export function roundUpdates(params: {
  round: EvaluationRound;
  other: EvaluationResponse | null;
  role: ResponderRole;
  name: string;
  checkHref: string;
  reportHref: string;
  now?: Date;
}): UpdateItem[] {
  const { round, other, role, name, checkHref, reportHref } = params;
  const now = params.now ?? new Date();
  const items: UpdateItem[] = [];
  const key = round.iep_id;
  const otherName = role === "TEACHER" ? `${name}'s parent` : "The teacher";

  if (round.status === "OPEN") {
    items.push({
      id: `open-${key}`,
      text:
        round.my_responses.length > 0
          ? `The 6-week check for ${name} is open again. Your last answers are filled in — update them.`
          : `The 6-week check for ${name} is open. Answer it now.`,
      date: now.toISOString(),
      href: checkHref,
      urgent: true,
    });
  } else if (round.status === "LOCKED" && round.locked_until) {
    const { daysLeft } = lockCountdown(round.locked_until, now);
    items.push({
      id: `locked-${key}`,
      text: `Your 6-week answers for ${name} are saved. You can answer again on ${formatLongDay(round.locked_until)} (${daysLeft} ${daysLeft === 1 ? "day" : "days"} left).`,
      date: round.last_submitted_at ?? now.toISOString(),
      href: checkHref,
    });
  } else if (round.status === "NOT_OPEN" && round.opens_at) {
    const opens = new Date(round.opens_at).getTime();
    if (opens - now.getTime() <= SOON) {
      items.push({
        id: `soon-${key}`,
        text: `The 6-week check for ${name} opens on ${formatLongDay(round.opens_at)}.`,
        date: now.toISOString(),
        href: checkHref,
      });
    }
  }

  if (other) {
    items.push({
      id: `sent-${key}-${other.submitted_at}`,
      text:
        role === "TEACHER"
          ? `${otherName} sent their 6-week evaluation. It is on ${name}'s profile.`
          : `${otherName} sent their 6-week evaluation of ${name}. Download it in School.`,
      date: other.submitted_at,
      href: reportHref,
    });
  }
  return items;
}

async function safely<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

/** Updates for every student of a teacher whose plan is active. */
export async function teacherEvaluationUpdates(
  room: Classroom,
  now = new Date(),
): Promise<UpdateItem[]> {
  const studentsById = new Map(room.students.map((s) => [s.student_id, s]));
  const active = Array.from(room.iepByCase.entries()).filter(
    ([, iep]) => iep.status === "ACTIVE",
  );
  const lists = await Promise.all(
    active.map(async ([caseId, iep]) => {
      const caseItem = room.cases.find((item) => item.case_id === caseId);
      const student = caseItem
        ? studentsById.get(caseItem.student_id)
        : undefined;
      if (!student) return [];
      return safely(
        (async () => {
          const round = await evaluationsApi.current(iep.iep_id);
          const other = await otherSubmission(round, "PARENT");
          return roundUpdates({
            round,
            other,
            role: "TEACHER",
            name: studentName(student),
            checkHref: `/teacher/cases/${caseId}/check`,
            reportHref: `/teacher/students/${student.student_id}#reports`,
            now,
          });
        })(),
        [] as UpdateItem[],
      );
    }),
  );
  return lists.flat();
}

/** Updates about a parent's child, from the plan being evaluated. */
export async function parentEvaluationUpdates(
  child: Student,
  iep: IEP | null,
  now = new Date(),
): Promise<UpdateItem[]> {
  if (!iep || iep.status !== "ACTIVE") return [];
  return safely(
    (async () => {
      const round = await evaluationsApi.current(iep.iep_id);
      const other = await otherSubmission(round, "TEACHER");
      return roundUpdates({
        round,
        other,
        role: "PARENT",
        name: child.first_name,
        checkHref: "/parent/evaluation",
        reportHref: "/parent/school",
        now,
      });
    })(),
    [],
  );
}

export function notificationUpdates(list: Notification[]): UpdateItem[] {
  return list.map((item) => ({
    id: item.notification_id,
    text: item.message,
    date: item.created_at,
    unread: !item.is_read,
  }));
}

/** Things to do now first, then everything else, newest first. */
export function sortUpdates(items: UpdateItem[]): UpdateItem[] {
  return [...items].sort((a, b) => {
    if (Boolean(a.urgent) !== Boolean(b.urgent)) return a.urgent ? -1 : 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}
