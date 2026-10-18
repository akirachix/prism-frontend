import type { Answers, Option, ScreeningPart } from "@/types/api";
import { densityOf, isElevated, SCORE_MAX } from "./scoring";

export const YES_NO: Option[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];
export const OFTEN: Option[] = [
  { value: "never", label: "Never" },
  { value: "sometimes", label: "Sometimes" },
  { value: "often", label: "Often" },
  { value: "very_often", label: "Very often" },
];

export const part = (
  id: string,
  tool: string,
  title: string,
  description: string,
  options: Option[],
  texts: string[],
): ScreeningPart => ({
  part_id: id,
  tool,
  title,
  description,
  questions: texts.map((text, i) => ({ question_id: `${id}-q${i + 1}`, text, options })),
});

export const MOCK_SCREENING_PARTS: ScreeningPart[] = [
  part(
    "autism",
    "autism",
    "Social and communication",
    "How the child connects with people around them.",
    YES_NO,
    [
      "Does the child respond when their name is called?",
      "Does the child look at you when you talk to them?",
      "Does the child join in play or group work with classmates?",
      "Does the child get very upset by small changes in routine?",
      "Does the child repeat the same movements, like rocking or hand-flapping?",
    ],
  ),
  part(
    "adhd",
    "adhd",
    "Attention and activity",
    "How the child focuses and stays still in class.",
    OFTEN,
    [
      "Has trouble keeping attention on a task or activity.",
      "Leaves their seat when they are expected to stay seated.",
      "Blurts out answers before a question is finished.",
      "Loses things needed for schoolwork, like pencils or books.",
      "Finds it hard to wait for their turn.",
    ],
  ),
  part(
    "dyslexia",
    "dyslexia",
    "Reading and writing",
    "How the child reads, spells and copies work.",
    OFTEN,
    [
      "Mixes up letters that look alike, like b and d.",
      "Reads more slowly than classmates of the same age.",
      "Struggles to sound out new words.",
      "Spells the same word in different ways.",
      "Finds it hard to copy from the board.",
    ],
  ),
];

export const TOTAL = MOCK_SCREENING_PARTS.reduce((sum, p) => sum + p.questions.length, 0);
export const VALID: Record<string, string[]> = Object.fromEntries(
  MOCK_SCREENING_PARTS.flatMap((p) =>
    p.questions.map((q) => [q.question_id, q.options.map((o) => o.value)]),
  ),
);

export const OFTEN_MARK: Record<string, number> = {
  never: 0,
  sometimes: 1,
  often: 2,
  very_often: 3,
};

export const CONCERN: Record<string, string> = {
  "autism-q1": "no",
  "autism-q2": "no",
  "autism-q3": "no",
  "autism-q4": "yes",
  "autism-q5": "yes",
};
export const markOf = (id: string, value: string | undefined): number =>
  CONCERN[id] ? (value === CONCERN[id] ? SCORE_MAX : 0) : (OFTEN_MARK[value ?? ""] ?? 0);

export function densitiesOf(saved: Answers): Record<string, number> {
  return Object.fromEntries(
    MOCK_SCREENING_PARTS.map((p) => [
      p.part_id,
      densityOf(p.questions.map((q) => markOf(q.question_id, saved[q.question_id]))),
    ]),
  );
}

export function resultOf(saved: Answers): { elevated: boolean } {
  return { elevated: Object.values(densitiesOf(saved)).some(isElevated) };
}

export let answers: Record<string, Answers> = {};

export function teacherScoresOf(caseId: string): Record<string, number> | null {
  const saved = answers[caseId];
  if (!saved || Object.keys(saved).length === 0) return null;
  return densitiesOf(saved);
}
export function resetTeacherScreenings() {
  answers = {};
}
