import { request } from "@/lib/api";

export interface HomeActivity {
  title: string;
  steps: string[];
}

export interface Recommendation {
  recommendation_id: string;
  case_id: string;
  message: string;
  home_activities: HomeActivity[];
  template_ids: string[];
  created_at: string;
}

export const recommendationsApi = {
  forCase: (caseId: string) =>
    request<Recommendation>(`/recommendations/case/${caseId}`),
};
