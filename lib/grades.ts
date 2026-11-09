export const GRADES = [
  { value: "PP1", label: "PP1" },
  { value: "PP2", label: "PP2" },
  { value: "GRADE_1", label: "Grade 1" },
  { value: "GRADE_2", label: "Grade 2" },
  { value: "GRADE_3", label: "Grade 3" },
  { value: "GRADE_4", label: "Grade 4" },
] as const;

export type Grade = (typeof GRADES)[number]["value"];

export function gradeLabel(grade: Grade | string): string {
  return GRADES.find((g) => g.value === grade)?.label ?? String(grade);
}
