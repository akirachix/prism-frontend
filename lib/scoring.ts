import {
  allQuestions,
  type Domain,
  type QuestionSet,
} from "@/lib/screening-questions";

export const ELEVATED_AT = 2;
export const MEDIUM_AT = 1;
export const DISCREPANCY_AT = 1.5;

export type Level = "LOW" | "MEDIUM" | "ELEVATED";
export type Scores = Partial<Record<Domain, number>>;

export function scoreAnswers(
  set: QuestionSet,
  answers: Record<string, number>,
): Scores {
  const scores: Scores = {};
  for (const part of set.parts) {
    const values = part.questions
      .map((question) => answers[question.id])
      .filter((value): value is number => typeof value === "number");
    if (values.length === 0) continue;
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    scores[part.domain] = Math.round(mean * 100) / 100;
  }
  return scores;
}

export function levelOf(score: number | null | undefined): Level {
  if (score === null || score === undefined) return "LOW";
  if (score >= ELEVATED_AT) return "ELEVATED";
  if (score >= MEDIUM_AT) return "MEDIUM";
  return "LOW";
}

export interface Combined {
  scores: Scores;
  levels: Partial<Record<Domain, Level>>;
  discrepancies: Domain[];
  concern: boolean;
  primaryDomain: Domain | null;
  densityScore: number;
}

export function combine(teacher: Scores, parent: Scores): Combined {
  const domains = Array.from(
    new Set([...Object.keys(teacher), ...Object.keys(parent)]),
  ) as Domain[];
  const scores: Scores = {};
  const levels: Partial<Record<Domain, Level>> = {};
  const discrepancies: Domain[] = [];

  for (const domain of domains) {
    const t = teacher[domain];
    const p = parent[domain];
    const best = Math.max(t ?? 0, p ?? 0);
    scores[domain] = best;
    const gap =
      t !== undefined && p !== undefined
        ? Math.abs(t - p) >= DISCREPANCY_AT
        : false;
    if (gap) discrepancies.push(domain);
    levels[domain] = gap ? "ELEVATED" : levelOf(best);
  }

  const flagged = domains.filter((domain) => levels[domain] === "ELEVATED");
  const primaryDomain =
    flagged.sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0))[0] ?? null;
  const raised = domains.filter((domain) => levels[domain] !== "LOW").length;
  const densityScore =
    domains.length === 0
      ? 0
      : Math.round((raised / domains.length) * 3 * 100) / 100;

  return {
    scores,
    levels,
    discrepancies,
    concern: flagged.length > 0,
    primaryDomain,
    densityScore,
  };
}

export function isComplete(
  set: QuestionSet,
  answers: Record<string, number>,
): boolean {
  return allQuestions(set).every(
    (question) => typeof answers[question.id] === "number",
  );
}
