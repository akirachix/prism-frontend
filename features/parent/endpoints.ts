/**
 * Parent-portal endpoint map  -  THE place to change a URL.
 *
 *   LIVE     exists in the backend today (OpenAPI spec).
 *   PENDING  not built yet: the matching api.ts function returns
 *            pendingEndpoint(...) in real mode. Put the real path here and
 *            swap that one line when the backend ships it.
 */
export const parentEndpoints = {
  // ── LIVE ──────────────────────────────────────────────────────────────
  /** GET -> CaseRead */
  case: (caseId: string) => `/cases/${caseId}`,
  /** GET ?user_id=&limit= -> NotificationRead[] (each carries the case it is about) */
  notifications: "/notifications",
  /** GET -> IepRead (404 when the case has no active IEP) */
  activeIepForCase: (caseId: string) => `/ieps/case/${caseId}/active`,
  /** GET ?iep_id= -> EvaluationQuestionRead[] */
  evaluationQuestions: "/iep-evaluation-questions",
  /** GET ?responder_id=&responder_role=&limit= | POST {eval_question_id, responder_id, responder_role, score} */
  evaluationResponses: "/iep-evaluation-responses",
  /** PATCH {score} */
  evaluationResponse: (responseId: string) => `/iep-evaluation-responses/${responseId}`,
  /** GET -> ReportRead (one report per case; 404 when none yet) */
  reportForCase: (caseId: string) => `/reports/case/${caseId}`,
  /** GET -> UserRead (may be refused for parents; the screen then shows "Not provided") */
  user: (userId: string) => `/users/${userId}`,

  // ── PENDING ───────────────────────────────────────────────────────────
  /** Child details (name, date of birth, class, admission number) and the parent -> child link: needs a /students endpoint. */
  child: "/students/me",
  /** Screening: start a session / save an answer / finish. */
  screeningStart: "/screening/sessions",
  screeningAnswer: (sessionId: string) => `/screening/sessions/${sessionId}/answers`,
  screeningComplete: (sessionId: string) => `/screening/sessions/${sessionId}/complete`,
  /** PDF export of a report / of the teacher's evaluation. */
  reportPdf: (reportId: string) => `/reports/${reportId}/pdf`,
} as const;
