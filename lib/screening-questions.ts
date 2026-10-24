export type Domain = "AUTISM" | "ADHD" | "DYSLEXIA";
export type Informant = "TEACHER" | "PARENT";

export interface Option {
  label: string;
  value: number;
}

export interface Question {
  id: string;
  domain: Domain;
  teacher: string;
  parent: string;
  options: Option[];
}

export const DOMAIN_TITLES: Record<Domain, string> = {
  AUTISM: "Social and communication",
  ADHD: "Attention and activity",
  DYSLEXIA: "Reading and language",
};

function reversed(options: Option[]): Option[] {
  const values = options.map((option) => option.value).reverse();
  return options.map((option, index) => ({ ...option, value: values[index] }));
}

const YES_NO: Option[] = [
  { label: "Yes", value: 3 },
  { label: "No", value: 0 },
];
const YES_NO_REVERSED: Option[] = [
  { label: "Yes", value: 0 },
  { label: "No", value: 3 },
];
const SNAP: Option[] = [
  { label: "Not at all", value: 0 },
  { label: "Just a little", value: 1 },
  { label: "Quite a bit", value: 2 },
  { label: "Very much", value: 3 },
];
const PRESCHOOL: Option[] = [
  { label: "Never or rarely", value: 0 },
  { label: "Sometimes", value: 1 },
  { label: "Often", value: 2 },
  { label: "Very often", value: 3 },
];
const FREQUENCY: Option[] = [
  { label: "Always", value: 3 },
  { label: "Often", value: 2.25 },
  { label: "Sometimes", value: 1.5 },
  { label: "Rarely", value: 0.75 },
  { label: "Never", value: 0 },
];
const FREQUENCY_REVERSED: Option[] = [
  { label: "Always", value: 0 },
  { label: "Often", value: 0.75 },
  { label: "Sometimes", value: 1.5 },
  { label: "Rarely", value: 2.25 },
  { label: "Never", value: 3 },
];

const AUTISM: Question[] = [
  {
    id: "aut-1",
    domain: "AUTISM",
    teacher: "Does the child respond when their name is called?",
    parent: "Does your child respond when their name is called?",
    options: FREQUENCY_REVERSED,
  },
  {
    id: "aut-2",
    domain: "AUTISM",
    teacher: "Does the child enjoy playing with other children?",
    parent: "Does your child enjoy playing with other children?",
    options: YES_NO_REVERSED,
  },
  {
    id: "aut-3",
    domain: "AUTISM",
    teacher: "Does the child become upset by small changes to routine?",
    parent: "Does your child get upset by small changes to the day?",
    options: YES_NO,
  },
  {
    id: "aut-4",
    domain: "AUTISM",
    teacher: "Does the child look at you when you talk to them?",
    parent: "Does your child look at you when you talk to them?",
    options: FREQUENCY_REVERSED,
  },
];

const ADHD_SCHOOL: Question[] = [
  {
    id: "adhd-1",
    domain: "ADHD",
    teacher: "Does the child sit for more than 5 minutes on one task?",
    parent: "Can your child sit with one activity for more than 5 minutes?",
    options: reversed(SNAP),
  },
  {
    id: "adhd-2",
    domain: "ADHD",
    teacher: "Does the child lose focus when there is noise around?",
    parent: "Does your child lose focus when there is noise around?",
    options: SNAP,
  },
  {
    id: "adhd-3",
    domain: "ADHD",
    teacher: "Does the child leave their seat when they are expected to stay?",
    parent: "Does your child get up from meals or homework before finishing?",
    options: SNAP,
  },
  {
    id: "adhd-4",
    domain: "ADHD",
    teacher: "Does the child find it hard to wait for their turn?",
    parent: "Does your child find it hard to wait for their turn?",
    options: SNAP,
  },
];

const ADHD_PRESCHOOL: Question[] = ADHD_SCHOOL.map((question) => ({
  ...question,
  id: `${question.id}-p`,
  options: question.id === "adhd-1" ? reversed(PRESCHOOL) : PRESCHOOL,
}));

const DYSLEXIA: Question[] = [
  {
    id: "dys-1",
    domain: "DYSLEXIA",
    teacher: "Does the child mix up letters that look alike, such as b and d?",
    parent: "Does your child mix up letters that look alike, such as b and d?",
    options: FREQUENCY,
  },
  {
    id: "dys-2",
    domain: "DYSLEXIA",
    teacher: "Does the child read more slowly than others in the class?",
    parent: "Does your child read more slowly than other children their age?",
    options: FREQUENCY,
  },
  {
    id: "dys-3",
    domain: "DYSLEXIA",
    teacher: "Does the child find it hard to sound out new words?",
    parent: "Does your child find it hard to sound out new words?",
    options: FREQUENCY,
  },
  {
    id: "dys-4",
    domain: "DYSLEXIA",
    teacher: "Does the child remember words they read yesterday?",
    parent: "Does your child remember words they read the day before?",
    options: FREQUENCY_REVERSED,
  },
];

export interface QuestionSet {
  ageGate: "4-5" | "6-9";
  parts: { domain: Domain; title: string; questions: Question[] }[];
}

export function questionSetFor(age: number | null): QuestionSet {
  const young = age !== null && age <= 5;
  const domains: [Domain, Question[]][] = young
    ? [
        ["AUTISM", AUTISM],
        ["ADHD", ADHD_PRESCHOOL],
      ]
    : [
        ["AUTISM", AUTISM],
        ["ADHD", ADHD_SCHOOL],
        ["DYSLEXIA", DYSLEXIA],
      ];
  return {
    ageGate: young ? "4-5" : "6-9",
    parts: domains.map(([domain, questions]) => ({
      domain,
      title: DOMAIN_TITLES[domain],
      questions,
    })),
  };
}

export function allQuestions(set: QuestionSet): Question[] {
  return set.parts.flatMap((part) => part.questions);
}
