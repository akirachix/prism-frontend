import { ApiError, request } from "@/lib/api";

export interface Report {
  report_id: string;
  case_id: string;
  content: Record<string, unknown>;
  generated_at: string;
}

export interface Plan {
  iep_id: string;
  case_id: string;
  version_number: number;
  status: string;
  generated_content: string;
  short_term_goals: string[];
  strategies: string[];
  approved_at: string | null;
  evaluation_unlock_date: string | null;
}

export interface HomeActivity {
  title: string;
  steps: string[];
}

export interface Recommendation {
  recommendation_id: string;
  case_id: string;
  message: string;
  home_activities: HomeActivity[];
  created_at: string;
}

/** Resolve to null when nothing exists yet (404) instead of failing. */
export async function orNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export const reportsApi = {
  /** Every report the API returns. Used only by the local-testing picker. */
  listAll: () => request<Report[]>("/reports?limit=100"),
  screening: (caseId: string) => request<Report>(`/reports/case/${caseId}`),
  plan: (caseId: string) => request<Plan>(`/ieps/case/${caseId}/active`),
  recommendation: (caseId: string) =>
    request<Recommendation>(`/recommendations/case/${caseId}`),
};

export interface ParentReports {
  screening: Report | null;
  plan: Plan | null;
  recommendation: Recommendation | null;
}

/** All three, where each one may not exist yet. */
export async function loadParentReports(
  caseId: string,
): Promise<ParentReports> {
  const [screening, plan, recommendation] = await Promise.all([
    orNull(reportsApi.screening(caseId)),
    orNull(reportsApi.plan(caseId)),
    orNull(reportsApi.recommendation(caseId)),
  ]);
  return { screening, plan, recommendation };
}
