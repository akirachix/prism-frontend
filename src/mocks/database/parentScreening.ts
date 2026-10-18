import { densityOf, isElevated } from "./scoring";

export const FREQUENCY = [
  { value: "always", label: "Always" },
  { value: "often", label: "Often" },
  { value: "sometimes", label: "Sometimes" },
  { value: "rarely", label: "Rarely" },
  { value: "never", label: "Never" },
];

const RARELY = ["rarely", "never"];
const OFTEN = ["always", "often"];

type Group = "social" | "attention" | "reading";
const q = (n: number, group: Group, text: string, concern: string[]) => ({
  question_id: `p-q${n}`,
  group,
  text,
  concern,
});

const ALL = [
  q(1, "social", "Does your child respond when their name is called?", RARELY),
  q(2, "social", "Does your child look at you when you talk to them?", RARELY),
  q(3, "social", "Does your child enjoy playing with other children?", RARELY),
  q(4, "social", "Does your child get very upset by small changes in routine?", OFTEN),
  q(
    5,
    "social",
    "Does your child repeat the same movements, like rocking or hand-flapping?",
    OFTEN,
  ),
  q(6, "attention", "Does your child find it hard to sit still during meals or homework?", OFTEN),
  q(7, "attention", "Does your child lose interest in a task before finishing it?", OFTEN),
  q(8, "attention", "Does your child interrupt others or find it hard to wait their turn?", OFTEN),
  q(9, "attention", "Does your child forget things they were asked to do?", OFTEN),
  q(10, "attention", "Does your child act before thinking?", OFTEN),
  q(11, "reading", "Does your child mix up letters that look alike, like b and d?", OFTEN),
  q(
    12,
    "reading",
    "Does your child find reading harder than other children of the same age?",
    OFTEN,
  ),
  q(13, "reading", "Does your child struggle to sound out new words?", OFTEN),
  q(14, "reading", "Does your child spell the same word in different ways?", OFTEN),
  q(15, "reading", "Does your child avoid reading or writing activities?", OFTEN),
];

export const PARENT_QUESTIONS = ALL.map(({ question_id, text }) => ({ question_id, text }));

const TITLES = {
  social: "Social and communication",
  attention: "Attention and activity",
  reading: "Reading and writing",
};
export const PARENT_PARTS = Object.entries(TITLES).map(([partId, title]) => ({
  part_id: partId,
  title,
  questions: ALL.filter((item) => item.group === partId).map(({ question_id, text }) => ({
    question_id,
    text,
  })),
}));

const MARK_WHEN_OFTEN: Record<string, number> = {
  always: 3,
  often: 2,
  sometimes: 1,
  rarely: 0,
  never: 0,
};
const MARK_WHEN_RARELY: Record<string, number> = {
  never: 3,
  rarely: 2,
  sometimes: 1,
  often: 0,
  always: 0,
};
const markOf = (item: (typeof ALL)[number], value: string | undefined) =>
  (item.concern === RARELY ? MARK_WHEN_RARELY : MARK_WHEN_OFTEN)[value ?? ""] ?? 0;

export function parentScoresOf(answers: Record<string, string>): Record<Group, number> | null {
  if (Object.keys(answers).length === 0) return null;
  const groups: Group[] = ["social", "attention", "reading"];
  return Object.fromEntries(
    groups.map((g) => [
      g,
      densityOf(
        ALL.filter((item) => item.group === g).map((item) =>
          markOf(item, answers[item.question_id]),
        ),
      ),
    ]),
  ) as Record<Group, number>;
}

export function parentConcern(answers: Record<string, string>): boolean {
  return Object.values(parentScoresOf(answers) ?? {}).some(isElevated);
}

export const isValidAnswer = (id: string, value: unknown) =>
  ALL.some((item) => item.question_id === id) && FREQUENCY.some((o) => o.value === value);
