import { ApiError, errorMessage, query, request } from "@/lib/api";
import { casesApi } from "@/lib/cases";
import { studentsApi, type Student } from "@/lib/lookups";
import type { Case } from "@/lib/types";

export interface Report<T extends object = Record<string, unknown>> {
  report_id: string;
  case_id: string;
  content: T;
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
  list: (caseId?: string) =>
    request<Report[]>(`/reports${query({ case_id: caseId, limit: 50 })}`),
  /** Every report the API returns. Used only by the local-testing picker. */
  listAll: () => request<Report[]>("/reports?limit=100"),
  forCase: <T extends object = Record<string, unknown>>(caseId: string) =>
    request<Report<T>>(`/reports/case/${caseId}`),
  create: (caseId: string, content: object) =>
    request<Report>("/reports", {
      method: "POST",
      body: JSON.stringify({ case_id: caseId, content }),
    }),
  replace: (caseId: string, content: object) =>
    request<Report>(`/reports/case/${caseId}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),
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

export type ParentReportKey = keyof ParentReports;

export type ParentReportErrors = Partial<
  Record<ParentReportKey, string | undefined>
>;

export interface ParentReportsResult {
  reports: ParentReports;
  errors: ParentReportErrors;
}

/** All three, where each one may not exist yet. */
export async function loadParentReports(
  caseId: string,
): Promise<ParentReportsResult> {
  const requests = [
    orNull(reportsApi.screening(caseId)),
    orNull(reportsApi.plan(caseId)),
    orNull(reportsApi.recommendation(caseId)),
  ];

  const results = await Promise.allSettled(requests);
  const reports: ParentReports = {
    screening: null,
    plan: null,
    recommendation: null,
  };
  const errors: ParentReportErrors = {
    screening: undefined,
    plan: undefined,
    recommendation: undefined,
  };

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      const value = result.value;
      if (index === 0) reports.screening = value as Report | null;
      if (index === 1) reports.plan = value as Plan | null;
      if (index === 2) reports.recommendation = value as Recommendation | null;
      return;
    }

    const message = errorMessage(result.reason);

    if (index === 0) errors.screening = message;
    if (index === 1) errors.plan = message;
    if (index === 2) errors.recommendation = message;
  });

  return { reports, errors };
}

export interface ReportChild {
  caseItem: Case;
  student: Student;
}

export async function loadReportChild(caseId: string): Promise<ReportChild> {
  const caseItem = await casesApi.get(caseId);
  const student = await studentsApi.get(caseItem.student_id);
  return { caseItem, student };
}
