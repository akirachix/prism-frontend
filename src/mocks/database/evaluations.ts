import type { Option } from "@/types/api";

export const CHANGE_OPTIONS: Option<number>[] = [
  { value: -2, label: "Much worse" },
  { value: -1, label: "A little worse" },
  { value: 0, label: "No change" },
  { value: 1, label: "A little better" },
  { value: 2, label: "Much better" },
];

export const MOCK_EVALUATION_QUESTIONS = [
  "Has the child kept attention on a task for the planned time?",
  "Has the child waited for their turn in group work?",
  "Has the child finished the class tasks they started?",
  "Has the child followed one-step instructions the first time?",
  "Has the child settled back to work after a movement break?",
].map((text, i) => ({ question_id: `m${i + 1}`, text }));

export let store: Record<string, { answers: Record<string, number>; submitted_at: string | null }> =
  {};

export let parentStore: Record<
  string,
  { answers: Record<string, number>; submitted_at: string | null }
> = {};
export function resetEvaluations() {
  store = {};
  parentStore = {};
}

export function sentEvaluationOf(
  caseId: string,
): { answers: Record<string, number>; submitted_at: string | null } | null {
  return store[caseId]?.submitted_at ? store[caseId] : null;
}
