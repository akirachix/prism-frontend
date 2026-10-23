import { ApiError } from "@/lib/api";
import { casesApi } from "@/lib/cases";
import { reportsApi } from "@/lib/reports";
import {
  combine,
  isComplete,
  scoreAnswers,
  type Combined,
  type Scores,
} from "@/lib/scoring";
import type { Informant, QuestionSet } from "@/lib/screening-questions";
import type { Case, CaseUpdate } from "@/lib/types";

/**
 * Where screening answers are kept.
 *
 * The API has no screening endpoint yet, so each case's answers live in
 * that case's report (`/reports/case/{case_id}`), whose `content` is free
 * JSON. The domain scores also go onto the case itself through
 * `PATCH /cases/{id}`, which is where the rest of the app reads them.
 *
 * TODO(member 1): when the backend adds screening endpoints, swap the
 * bodies of `loadScreening` and `saveScreening` and nothing else changes.
 */

export interface InformantScreening {
  responder_id: string;
  age_gate: QuestionSet["ageGate"];
  answers: Record<string, number>;
  scores: Scores;
  updated_at: string;
  completed_at: string | null;
}

export interface ScreeningContent {
  kind: "screening";
  teacher?: InformantScreening;
  parent?: InformantScreening;
  combined?: Combined & { computed_at: string };
}

const EMPTY: ScreeningContent = { kind: "screening" };

function key(role: Informant): "teacher" | "parent" {
  return role === "TEACHER" ? "teacher" : "parent";
}

/** The saved screening for a case, or an empty one if nothing is saved. */
export async function loadScreening(
  caseId: string,
): Promise<{ content: ScreeningContent; exists: boolean }> {
  try {
    const report = await reportsApi.forCase<ScreeningContent>(caseId);
    return { content: { ...EMPTY, ...report.content }, exists: true };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { content: EMPTY, exists: false };
    }
    throw error;
  }
}

export interface SaveResult {
  content: ScreeningContent;
  case: Case | null;
}

/**
 * Save one person's answers. When `finish` is true and every question is
 * answered, the screening is marked complete and the case moves on.
 */
export async function saveScreening(params: {
  caseItem: Case;
  role: Informant;
  responderId: string;
  set: QuestionSet;
  answers: Record<string, number>;
  finish: boolean;
}): Promise<SaveResult> {
  const { caseItem, role, responderId, set, answers, finish } = params;
  const { content, exists } = await loadScreening(caseItem.case_id);
  const now = new Date().toISOString();
  const done = finish && isComplete(set, answers);

  const mine: InformantScreening = {
    responder_id: responderId,
    age_gate: set.ageGate,
    answers,
    scores: scoreAnswers(set, answers),
    updated_at: now,
    completed_at: done ? now : (content[key(role)]?.completed_at ?? null),
  };
  const next: ScreeningContent = { ...content, [key(role)]: mine };

  const bothDone = Boolean(
    next.teacher?.completed_at && next.parent?.completed_at,
  );
  if (bothDone && next.teacher && next.parent) {
    next.combined = {
      ...combine(next.teacher.scores, next.parent.scores),
      computed_at: now,
    };
  }

  if (exists) await reportsApi.replace(caseItem.case_id, next);
  else await reportsApi.create(caseItem.case_id, next);

  if (!done) return { content: next, case: null };

  const update = caseUpdateFor(next, role);
  const updated = await casesApi.update(caseItem.case_id, update);
  return { content: next, case: updated };
}

function caseUpdateFor(content: ScreeningContent, role: Informant): CaseUpdate {
  const combined = content.combined;
  if (!combined) {
    // Only one side is done so far: record that side's scores and status.
    const scores = content[key(role)]?.scores ?? {};
    return {
      status:
        role === "TEACHER"
          ? "TEACHER_SCREENING_COMPLETED"
          : "PARENT_SCREENING_COMPLETED",
      autism_score: scores.AUTISM ?? null,
      adhd_score: scores.ADHD ?? null,
      dyslexia_score: scores.DYSLEXIA ?? null,
    };
  }
  return {
    // With no concern the case ends here. With a concern it stays open so
    // the plan (IEP) can be generated for it.
    status: combined.concern
      ? role === "TEACHER"
        ? "TEACHER_SCREENING_COMPLETED"
        : "PARENT_SCREENING_COMPLETED"
      : "NO_CONCERN_IDENTIFIED",
    autism_score: combined.scores.AUTISM ?? null,
    adhd_score: combined.scores.ADHD ?? null,
    dyslexia_score: combined.scores.DYSLEXIA ?? null,
    domain_density_score: combined.densityScore,
    primary_domain: combined.primaryDomain,
  };
}

export function screeningDone(
  content: ScreeningContent | null,
  role: Informant,
): boolean {
  return Boolean(content?.[key(role)]?.completed_at);
}
