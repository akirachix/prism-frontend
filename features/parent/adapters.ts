/**
 * ADAPTERS: backend shape -> parent UI types. If the backend renames a field
 * or the report content changes, this is the only file to touch.
 */
import type {
  CaseRead,
  EvaluationQuestionRead,
  ReportRead,
} from "@/lib/api-types";
import { CLOSED_CASE_STATUSES } from "@/lib/api-types";
import { humanizeEnum } from "@/lib/format";
import type { ChildSummary, EvaluationQuestion, RatingOption, ReportSummary } from "./types";

export const RATING_SCALE: RatingOption[] = [
  { value: -2, label: "Much worse" },
  { value: -1, label: "A little worse" },
  { value: 0, label: "No change" },
  { value: 1, label: "A little better" },
  { value: 2, label: "Much better" },
];

export const ratingLabel = (score: number) =>
  RATING_SCALE.find((r) => r.value === score)?.label ?? String(score);

export const toEvaluationQuestion = (raw: EvaluationQuestionRead): EvaluationQuestion => ({
  id: raw.eval_question_id,
  text: raw.question_text,
  scale: RATING_SCALE,
});

/**
 * Of the cases linked to this parent (see listMyCases in api.ts), the one a
 * screen should show: the newest with one of the `prefer` statuses, else the
 * newest open case, else the newest.
 */
export function pickCase(cases: CaseRead[], prefer: CaseRead["status"][] = []): CaseRead | undefined {
  const byNewest = [...cases].sort((a, b) => b.created_at.localeCompare(a.created_at));
  for (const status of prefer) {
    const found = byNewest.find((c) => c.status === status);
    if (found) return found;
  }
  return byNewest.find((c) => !CLOSED_CASE_STATUSES.includes(c.status)) ?? byNewest[0];
}

/** What the dashboard can show today: only the case status is known (see parentApi.child). */
export const toChildSummary = (found: CaseRead | undefined): ChildSummary => ({
  name: "Your child",
  dateOfBirth: null,
  className: null,
  admissionId: null,
  status: found ? humanizeEnum(found.status) : null,
});

const CARDS: Array<Omit<ReportSummary, "id" | "available">> = [
  { type: "screening", title: "Screening report", description: "View your child's screening results." },
  { type: "evaluation", title: "Evaluation report", description: "View your child's evaluation information." },
];

/**
 * The backend keeps ONE report per case (free-form `content`), but the design
 * has two cards. Until the content has a documented shape:
 *   - Screening report  = a report exists for the case
 *   - Evaluation report = the case is COMPLETED, or the content has an `evaluation` entry
 */
export function toReportCards(report: ReportRead | null, found: CaseRead | undefined): ReportSummary[] {
  return CARDS.map((card) => {
    const available =
      card.type === "screening"
        ? Boolean(report)
        : Boolean(report) && (found?.status === "COMPLETED" || Boolean(report?.content?.evaluation));
    return { ...card, id: report?.report_id ?? card.type, available };
  });
}
