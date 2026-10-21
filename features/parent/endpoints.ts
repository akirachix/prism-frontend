export const parentEndpoints = {
  case: (caseId: string) => `/cases/${caseId}`,
  notifications: "/notifications",
  activeIepForCase: (caseId: string) => `/ieps/case/${caseId}/active`,
  evaluationQuestions: "/iep-evaluation-questions",
  evaluationResponses: "/iep-evaluation-responses",
  evaluationResponse: (responseId: string) =>
    `/iep-evaluation-responses/${responseId}`,
  reportForCase: (caseId: string) => `/reports/case/${caseId}`,
  user: (userId: string) => `/users/${userId}`,

  child: "/students/me",
  screeningStart: "/screening/sessions",
  screeningAnswer: (sessionId: string) =>
    `/screening/sessions/${sessionId}/answers`,
  screeningComplete: (sessionId: string) =>
    `/screening/sessions/${sessionId}/complete`,
  reportPdf: (reportId: string) => `/reports/${reportId}/pdf`,
} as const;
