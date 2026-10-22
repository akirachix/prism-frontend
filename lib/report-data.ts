import { orNull } from "@/lib/api";
import {
  evaluationsApi,
  type EvaluationQuestion,
  type EvaluationResponse,
} from "@/lib/evaluations";
import { iepsApi, type IEP } from "@/lib/ieps";
import { levelOf, type Level } from "@/lib/scoring";
import { loadScreening, type ScreeningContent } from "@/lib/screening";
import { DOMAIN_TITLES, type Domain } from "@/lib/screening-questions";

/** Plain words for each level. No clinical labels, for anyone. */
export const LEVEL_TEXT: Record<Level, string> = {
  LOW: "No concern seen",
  MEDIUM: "Some signs to watch",
  ELEVATED: "Worth extra support",
};

export interface DomainRow {
  domain: Domain;
  title: string;
  teacher: Level | null;
  parent: Level | null;
  overall: Level | null;
  disagreement: boolean;
}

export function screeningRows(content: ScreeningContent): DomainRow[] {
  const domains = Array.from(
    new Set([
      ...Object.keys(content.teacher?.scores ?? {}),
      ...Object.keys(content.parent?.scores ?? {}),
    ]),
  ) as Domain[];
  const order: Domain[] = ["AUTISM", "ADHD", "DYSLEXIA"];
  return order
    .filter((domain) => domains.includes(domain))
    .map((domain) => {
      const t = content.teacher?.completed_at
        ? content.teacher.scores[domain]
        : undefined;
      const p = content.parent?.completed_at
        ? content.parent.scores[domain]
        : undefined;
      return {
        domain,
        title: DOMAIN_TITLES[domain],
        teacher: t === undefined ? null : levelOf(t),
        parent: p === undefined ? null : levelOf(p),
        overall: content.combined?.levels[domain] ?? null,
        disagreement: content.combined?.discrepancies.includes(domain) ?? false,
      };
    });
}

export async function loadScreeningReport(caseId: string) {
  const { content, exists } = await loadScreening(caseId);
  return exists ? content : null;
}

export interface EvaluationReport {
  iep: IEP;
  rows: {
    question: EvaluationQuestion;
    teacher: EvaluationResponse | null;
    parent: EvaluationResponse | null;
  }[];
}

export async function loadEvaluationReport(
  caseId: string,
): Promise<EvaluationReport | null> {
  const iep = await orNull(iepsApi.activeForCase(caseId));
  if (!iep) return null;
  const questions = await evaluationsApi.questions(iep.iep_id);
  const rows = await Promise.all(
    [...questions]
      .sort((a, b) => a.position - b.position)
      .map(async (question) => {
        const responses = await evaluationsApi.responses({
          eval_question_id: question.eval_question_id,
        });
        return {
          question,
          teacher:
            responses.find((r) => r.responder_role === "TEACHER") ?? null,
          parent: responses.find((r) => r.responder_role === "PARENT") ?? null,
        };
      }),
  );
  return { iep, rows };
}
